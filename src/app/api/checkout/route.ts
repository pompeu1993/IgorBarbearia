import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// Exemplo básico de Integração com a API do PagSeguro
const PAGSEGURO_API_URL = "https://sandbox.api.pagseguro.com/orders"; // Usar ambiente Sandbox para testes

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { serviceId, date, userId, price, serviceName } = body;

        const token = process.env.PAGSEGURO_TOKEN;

        if (!token) {
            return NextResponse.json({ error: "Configuração de pagamento ausente." }, { status: 500 });
        }

        // 1. Criar pedido no PagSeguro (Exemplo de payload de Checkout transparente/Orders)
        const pagSeguroPayload = {
            reference_id: `agendamento_${Date.now()}`,
            customer: {
                name: "Cliente Teste",
                email: "cliente@teste.com",
                tax_id: "12345678909",
            },
            items: [
                {
                    reference_id: serviceId,
                    name: serviceName || "Corte de Cabelo",
                    quantity: 1,
                    unit_amount: Math.round(price * 100), // Em centavos
                }
            ],
            // notification_urls: ["https://sua-url.com/api/webhooks/pagseguro"]
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
            console.error("Erro PagSeguro:", data);
            return NextResponse.json({ error: "Falha ao processar pagamento com PagSeguro" }, { status: 400 });
        }

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

        return NextResponse.json({ success: true, paymentId: data.id, message: "Pedido gerado com sucesso." });

    } catch (error: any) {
        console.error("Erro interno:", error);
        return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
    }
}
