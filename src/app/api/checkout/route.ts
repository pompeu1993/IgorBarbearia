import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Integração com a API do Asaas (Ambiente de Produção)
const ASAAS_API_URL = process.env.ASAAS_API_URL || "https://api.asaas.com/v3";
// O Next.js com dotenv-expand tem um bug onde tenta expandir chaves começando com $
// Para evitar isso e não precisar das aspas literais no .env.local, escapamos no código:
const ASAAS_TOKEN = "$aact_prod_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OjRmNDhlMGRiLTA4MjgtNGU4OS05Y2RjLWQ2N2U1YWZiMTVmZDo6JGFhY2hfNzc0YzAyMTMtOTUwZi00ZjY3LTg5YWQtYzdiOTFjZTI3NTZj";

type AsaasErrorDetail = {
    description: string;
};

type AsaasErrorResponse = {
    errors?: AsaasErrorDetail[];
};

function getErrorMessage(error: unknown) {
    if (error instanceof Error) {
        return error.message;
    }

    return "Erro interno do servidor.";
}

export async function POST(req: Request) {
    try {
        console.log("=== INICIO CHECKOUT API ===");
        const authHeader = req.headers.get("Authorization");
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            { global: { headers: { Authorization: authHeader || "" } } }
        );

        const body = await req.json();
        console.log("Body Recebido:", body);
        
        const { serviceId, date, price, serviceName, cpf: bodyCpf } = body;

        if (!serviceId || !date || price === undefined) {
            return NextResponse.json({ error: "Dados inválidos: serviceId, date e price são obrigatórios." }, { status: 400 });
        }

        // Pega os detalhes do usuário logado
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "Usuário não autenticado." }, { status: 401 });
        }

        const { data: profile } = await supabase.from('profiles').select('cpf, name').eq('id', user.id).maybeSingle();
        
        // Prefere o CPF enviado ativamente pelo frontend, se não, tenta o do banco de dados
        const cpfToUse = bodyCpf || profile?.cpf || user?.user_metadata?.cpf;

        if (!cpfToUse) {
            return NextResponse.json({ error: "CPF obrigatório para pagamento Pix no Asaas." }, { status: 400 });
        }

        const customerName = profile?.name || user?.user_metadata?.name || "Cliente";
        const cleanCpf = cpfToUse.replace(/\D/g, "");
        console.log("CPF processado:", cleanCpf, " | Cliente:", customerName);
        console.log("Asaas URL:", ASAAS_API_URL);
        console.log("Asaas Token length:", ASAAS_TOKEN.length);

        // 1. Buscar se o cliente já existe no Asaas pelo CPF
        let customerId = "";
        const searchCustomerRes = await fetch(`${ASAAS_API_URL}/customers?cpfCnpj=${cleanCpf}`, {
            headers: {
                "access_token": ASAAS_TOKEN,
                "Accept": "application/json"
            }
        });
        
        const searchRawText = await searchCustomerRes.text();
        console.log("Asaas Search Customer Response Status:", searchCustomerRes.status);
        console.log("Asaas Search Customer Raw Body:", searchRawText.substring(0, 300));
        let searchCustomerData;
        try {
            searchCustomerData = JSON.parse(searchRawText);
        } catch (err) {
            console.error("[Checkout API] Falha ao buscar cliente no Asaas. Resposta não é JSON:", searchRawText);
            return NextResponse.json({ error: "Erro de comunicação com o gateway de pagamento (Asaas).", details: searchRawText }, { status: 502 });
        }

        if (!searchCustomerRes.ok) {
            console.error("[Checkout API] Erro Asaas (Buscar Cliente):", searchCustomerData);
            return NextResponse.json({ error: "Erro ao buscar cliente no Asaas.", details: searchCustomerData }, { status: searchCustomerRes.status });
        }

        if (searchCustomerData.data && searchCustomerData.data.length > 0) {
            customerId = searchCustomerData.data[0].id;
        } else {
            // 2. Criar cliente no Asaas
            const createCustomerRes = await fetch(`${ASAAS_API_URL}/customers`, {
                method: "POST",
                headers: {
                    "access_token": ASAAS_TOKEN,
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify({
                    name: customerName,
                    cpfCnpj: cleanCpf,
                    email: user.email || "cliente@teste.com"
                })
            });
            
            // Tratamento de falhas HTTP que não retornam JSON válido
            const createRawText = await createCustomerRes.text();
            let createCustomerData;
            try {
                createCustomerData = JSON.parse(createRawText);
            } catch (err) {
                console.error("[Checkout API] Falha ao criar cliente no Asaas. Resposta não é JSON:", createRawText);
                return NextResponse.json({ error: "Erro de comunicação com o gateway de pagamento (Asaas) ao criar cliente.", details: createRawText }, { status: 502 });
            }

            if (!createCustomerRes.ok) {
                console.error("[Checkout API] Erro Asaas (Criar Cliente):", createCustomerData);
                
                // Tratar erro específico de CPF Duplicado que o Asaas retorna
                const errorMessage = typeof createCustomerData === 'object' && createCustomerData?.errors?.[0]?.description
                    ? createCustomerData.errors[0].description
                    : "Falha ao criar cliente no Asaas.";
                    
                return NextResponse.json({ error: errorMessage, details: createCustomerData }, { status: 400 });
            }
            
            customerId = createCustomerData.id;
        }

        // 3. Criar cobrança PIX
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 1); // Vencimento para amanhã

        // Ensure price is a valid number. Asaas requires minimum R$ 5.00 for PIX
        const paymentValue = Number(price) < 5 ? 5.00 : Number(price);

        const paymentRes = await fetch(`${ASAAS_API_URL}/payments`, {
            method: "POST",
            headers: {
                "access_token": ASAAS_TOKEN,
                "Content-Type": "application/json",
                "Accept": "application/json"
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

        // Safe JSON parsing for Asaas Payment errors
        const paymentRawText = await paymentRes.text();
        console.log("Asaas Payment Response Status:", paymentRes.status);
        console.log("Asaas Payment Raw Body:", paymentRawText.substring(0, 300));
        let paymentData: any;
        try {
            paymentData = JSON.parse(paymentRawText);
        } catch {
            console.error("[Checkout API] Asaas retornou formato inválido ao criar cobrança:", paymentRawText);
            return NextResponse.json({ error: "Erro de formatação na resposta do Asaas." }, { status: 502 });
        }

        if (!paymentRes.ok) {
            console.error("[Checkout API] Erro Asaas (Cobrança):", paymentData);
            let msgError = "Erro desconhecido ao gerar Pix no Asaas.";
            if (paymentData.errors && Array.isArray(paymentData.errors) && paymentData.errors.length > 0) {
                 msgError = paymentData.errors.map((e: any) => e.description).join(" | ");
            }
            return NextResponse.json({ error: msgError, details: paymentData }, { status: 400 });
        }

        // Fix missing paymentId before QR code fetch
        const paymentId = paymentData.id;

        // 4. Obter o QR Code do PIX
        const qrCodeRes = await fetch(`${ASAAS_API_URL}/payments/${paymentId}/pixQrCode`, {
            headers: {
                "access_token": ASAAS_TOKEN,
                "Accept": "application/json"
            }
        });

        const qrCodeRawText = await qrCodeRes.text();
        console.log("Asaas QRCode Response Status:", qrCodeRes.status);
        console.log("Asaas QRCode Raw Body:", qrCodeRawText.substring(0, 300));
        let qrCodeData;
        try {
            qrCodeData = JSON.parse(qrCodeRawText);
        } catch (err) {
            console.error("[Checkout API] Asaas retornou formato inválido ao buscar QR Code:", qrCodeRawText);
            return NextResponse.json({ error: "Erro de formatação na resposta do Asaas ao buscar QR Code." }, { status: 502 });
        }

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

    } catch (error: unknown) {
        console.error("Erro interno:", error);
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
    }
}
