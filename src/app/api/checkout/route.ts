import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Integração com a API do PagSeguro (Ambiente de Produção)
const PAGSEGURO_API_URL = "https://api.pagseguro.com/orders"; // Produção

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

        const token = process.env.PAGSEGURO_TOKEN;

        if (!token) {
            return NextResponse.json({ error: "Configuração de pagamento ausente." }, { status: 500 });
        }

        // Pega os detalhes do usuário logado
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "Usuário não autenticado." }, { status: 401 });
        }

        const { data: profile } = await supabase.from('profiles').select('cpf, name').eq('id', user.id).single();
        const cpfToUse = profile?.cpf || user?.user_metadata?.cpf;

        if (!cpfToUse) {
            return NextResponse.json({ error: "CPF obrigatório para pagamento Pix no PagSeguro." }, { status: 400 });
        }

        // PagSeguro exige que o nome tenha no mínimo duas palavras (Nome e Sobrenome)
        let customerName = profile?.name || user?.user_metadata?.name || "Cliente Teste";
        customerName = customerName.trim();
        if (customerName.split(' ').length < 2) {
            customerName = customerName + " Sobrenome";
        }

        // Garante que o CPF contenha apenas números (sem pontos ou traços)
        const cleanCpf = cpfToUse.replace(/\D/g, "");

        // 1. Criar pedido no PagSeguro (PIX checkout transparente)
        const pagSeguroPayload = {
            reference_id: `agendamento_${Date.now()}`,
            customer: {
                name: customerName,
                email: user?.email || "cliente@teste.com",
                tax_id: cleanCpf, // CPF real do cadastro
            },
            items: [
                {
                    reference_id: serviceId,
                    name: serviceName || "Corte",
                    quantity: 1,
                    unit_amount: Math.round(price * 100), // Em centavos
                }
            ],
            // Adicionado bloco para gerar PIX
            qr_codes: [
                {
                    amount: {
                        value: Math.round(price * 100)
                    }
                }
            ]
        };

        const response = await fetch(PAGSEGURO_API_URL, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-type": "application/json"
            },
            body: JSON.stringify(pagSeguroPayload)
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("Erro PagSeguro:", JSON.stringify(data, null, 2));

            // Tenta extrair a exata mensagem de erro do PagSeguro
            let msgError = "Erro desconhecido.";
            if (data.error_messages && data.error_messages.length > 0) {
                msgError = data.error_messages.map((e: any) => `${e.parameterName || ''}: ${e.description}`).join(" | ");
            } else if (data.message) {
                msgError = data.message;
            } else {
                msgError = JSON.stringify(data);
            }

            return NextResponse.json({ error: `PagSeguro: ${msgError}`, details: data }, { status: 400 });
        }

        const qrCodeLink = data.qr_codes?.[0]?.links?.find((l: any) => l.rel === 'QRCODE.PNG')?.href || null;
        const qrCodeText = data.qr_codes?.[0]?.text || null;

        // 2. Salvar o agendamento no Supabase com status pendente e o ID do pagamento gerado
        const { error: dbError } = await supabase
            .from("appointments")
            .insert([
                {
                    user_id: userId,
                    service_id: serviceId,
                    date: date,
                    status: "PENDING",
                    payment_status: "PENDING",
                    payment_id: data.id, // ID do pedido no PagSeguro
                }
            ]);

        if (dbError) {
            console.error("Erro Supabase:", dbError);
            return NextResponse.json({ error: "Falha ao registrar agendamento no banco." }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            paymentId: data.id,
            qrCodeImage: qrCodeLink,
            qrCodeText: qrCodeText,
            message: "Pedido PIX gerado com sucesso."
        });

    } catch (error: any) {
        console.error("Erro interno:", error);
        return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
    }
}
