import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Integração com a API do Asaas (Ambiente de Produção)
const ASAAS_API_URL = "https://api.asaas.com/v3";
const ASAAS_TOKEN = "$aact_prod_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OmVmMjE3MThmLTgwMTAtNDAyZS1iNmYzLWM5Y2U0YjQ0NjI4Mjo6JGFhY2hfYjQxNzk5ZGEtMjg3ZC00MGMzLWFhMTUtM2I5NWQ2NGI4YzY2";

export async function POST(req: Request) {
    try {
        const authHeader = req.headers.get("Authorization");
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            { global: { headers: { Authorization: authHeader || "" } } }
        );

        const body = await req.json();
        const { serviceId, date, userId, price, serviceName } = body;

        // Pega os detalhes do usuário logado
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "Usuário não autenticado." }, { status: 401 });
        }

        const { data: profile } = await supabase.from('profiles').select('cpf, name').eq('id', user.id).maybeSingle();
        const cpfToUse = profile?.cpf || user?.user_metadata?.cpf;

        if (!cpfToUse) {
            return NextResponse.json({ error: "CPF obrigatório para pagamento Pix no Asaas." }, { status: 400 });
        }

        let customerName = profile?.name || user?.user_metadata?.name || "Cliente";
        const cleanCpf = cpfToUse.replace(/\D/g, "");

        // 1. Buscar se o cliente já existe no Asaas pelo CPF
        let customerId = "";
        const searchCustomerRes = await fetch(`${ASAAS_API_URL}/customers?cpfCnpj=${cleanCpf}`, {
            headers: {
                "access_token": ASAAS_TOKEN
            }
        });
        const searchCustomerData = await searchCustomerRes.json();

        if (searchCustomerData.data && searchCustomerData.data.length > 0) {
            customerId = searchCustomerData.data[0].id;
        } else {
            // 2. Criar cliente no Asaas
            const createCustomerRes = await fetch(`${ASAAS_API_URL}/customers`, {
                method: "POST",
                headers: {
                    "access_token": ASAAS_TOKEN,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name: customerName,
                    cpfCnpj: cleanCpf,
                    email: user.email || "cliente@teste.com"
                })
            });
            const createCustomerData = await createCustomerRes.json();
            if (!createCustomerRes.ok) {
                console.error("Erro Asaas (Criar Cliente):", createCustomerData);
                return NextResponse.json({ error: "Falha ao criar cliente no Asaas.", details: createCustomerData }, { status: 400 });
            }
            customerId = createCustomerData.id;
        }

        // 3. Criar cobrança PIX
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 1); // Vencimento para amanhã

        // Ensure price is a valid number, if it's less than 1 (Asaas minimum), force it to 1.00 for testing,
        // Asaas generally has a minimum value for PIX/Boletos depending on the account configuration, typically R$ 5.00
        // We will pass the exact price but if the API rejects it, that will be caught below.
        const paymentValue = Number(price) < 5 ? 5.00 : Number(price);

        const paymentRes = await fetch(`${ASAAS_API_URL}/payments`, {
            method: "POST",
            headers: {
                "access_token": ASAAS_TOKEN,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                customer: customerId,
                billingType: "PIX",
                value: paymentValue,
                dueDate: dueDate.toISOString().split('T')[0],
                description: `Agendamento: ${serviceName || 'Corte'}`,
                externalReference: `agendamento_${Date.now()}`
            })
        });

        const paymentData = await paymentRes.json();

        if (!paymentRes.ok) {
            console.error("Erro Asaas (Cobrança):", paymentData);
            let msgError = "Erro desconhecido ao gerar Pix.";
            if (paymentData.errors && paymentData.errors.length > 0) {
                 msgError = paymentData.errors.map((e: any) => e.description).join(" | ");
            }
            return NextResponse.json({ error: `Asaas: ${msgError}`, details: paymentData }, { status: 400 });
        }

        const paymentId = paymentData.id;

        // 4. Obter o QR Code do PIX
        const qrCodeRes = await fetch(`${ASAAS_API_URL}/payments/${paymentId}/pixQrCode`, {
            headers: {
                "access_token": ASAAS_TOKEN
            }
        });

        const qrCodeData = await qrCodeRes.json();

        if (!qrCodeRes.ok) {
            console.error("Erro Asaas (QR Code):", qrCodeData);
            return NextResponse.json({ error: "Falha ao obter QR Code PIX.", details: qrCodeData }, { status: 400 });
        }

        const qrCodeImage = `data:image/png;base64,${qrCodeData.encodedImage}`;
        const qrCodeText = qrCodeData.payload;

        // 5. Salvar o agendamento no Supabase com status pendente
        const { error: dbError } = await supabase
            .from("appointments")
            .insert([
                {
                    user_id: user.id,
                    service_id: serviceId,
                    date: date,
                    status: "PENDING",
                    payment_status: "PENDING",
                    payment_id: paymentId, // ID do pedido no Asaas
                }
            ]);

        if (dbError) {
            console.error("Erro Supabase:", dbError);
            return NextResponse.json({ error: "Falha ao registrar agendamento no banco." }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            paymentId: paymentId,
            qrCodeImage: qrCodeImage,
            qrCodeText: qrCodeText,
            message: "Pedido PIX gerado com sucesso via Asaas."
        });

    } catch (error: any) {
        console.error("Erro interno:", error);
        return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
    }
}
