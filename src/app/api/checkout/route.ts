import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { asaasConfig, getAsaasHeaders } from "@/config/asaas";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Inicializa o limitador apenas se as chaves estiverem configuradas
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

const ratelimit = redis
    ? new Ratelimit({
        redis: redis,
        limiter: Ratelimit.slidingWindow(5, "1 m"), // 5 tentativas de Pix por minuto por IP/Usuário
      })
    : null;

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
        // --- 1. Rate Limiting (Anti-Bot) ---
        if (ratelimit) {
            const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
            const { success, limit, reset, remaining } = await ratelimit.limit(ip);
            if (!success) {
                console.warn(`[Checkout RateLimit] Bloqueado IP: ${ip}`);
                return NextResponse.json(
                    { error: "Muitas tentativas de agendamento. Tente novamente em alguns instantes." },
                    { status: 429 }
                );
            }
        }

        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
            console.error("[Checkout API] Variáveis de ambiente do Supabase ausentes.");
            return NextResponse.json({ error: "Configuração do servidor incompleta. Contate o suporte." }, { status: 500 });
        }

        const authHeader = req.headers.get("Authorization");
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            { global: { headers: { Authorization: authHeader || "" } } }
        );

        const body = await req.json();
        
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

        // 0. Verificar se o horário ainda está disponível antes de prosseguir
        const { data: bookedSlots, error: bookedError } = await supabase.rpc("get_booked_slots", {
            start_time: date,
            end_time: date
        });

        if (bookedError) {
            console.error("[Checkout API] Erro ao verificar disponibilidade:", bookedError);
            return NextResponse.json({ error: "Erro ao verificar disponibilidade de horário." }, { status: 500 });
        }

        if (bookedSlots && bookedSlots.length > 0) {
            return NextResponse.json({ error: "O horário selecionado não está mais disponível ou expirou." }, { status: 409 });
        }

        const customerName = profile?.name || user?.user_metadata?.name || "Cliente";
        const cleanCpf = cpfToUse.replace(/\D/g, "");

        // 1. Buscar se o cliente já existe no Asaas pelo CPF
        let customerId = "";
        const searchCustomerRes = await fetch(`${asaasConfig.API_URL}/customers?cpfCnpj=${cleanCpf}`, {
            headers: getAsaasHeaders()
        });

        const searchRawText = await searchCustomerRes.text();
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
            const createCustomerRes = await fetch(`${asaasConfig.API_URL}/customers`, {
                method: "POST",
                headers: getAsaasHeaders(),
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

        // Ensure price is a valid number. Asaas exige mínimo de R$ 5.00 para gerar cobrança via API
        const paymentValue = Math.max(5.00, Number(price) || 0);

        const paymentRes = await fetch(`${asaasConfig.API_URL}/payments`, {
            method: "POST",
            headers: getAsaasHeaders(),
            body: JSON.stringify({
                customer: customerId,
                billingType: "PIX",
                value: paymentValue,
                dueDate: new Date().toISOString().split("T")[0],
                description: `Agendamento - ${serviceName || 'Serviço'} - ${customerName}`
            })
        });

        // Safe JSON parsing for Asaas Payment errors
        const paymentRawText = await paymentRes.text();
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
        const qrCodeRes = await fetch(`${asaasConfig.API_URL}/payments/${paymentId}/pixQrCode`, {
            headers: getAsaasHeaders()
        });

        const qrCodeRawText = await qrCodeRes.text();
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
