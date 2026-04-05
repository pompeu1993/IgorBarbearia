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
        limiter: Ratelimit.slidingWindow(5, "1 m"),
      })
    : null;

function getErrorMessage(error: unknown) {
    if (error instanceof Error) {
        return error.message;
    }
    return "Erro interno do servidor.";
}

export async function POST(req: Request) {
    try {
        if (ratelimit) {
            const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
            const { success } = await ratelimit.limit(ip);
            if (!success) {
                console.warn(`[Checkout RateLimit] Bloqueado IP: ${ip}`);
                return NextResponse.json(
                    { error: "Muitas tentativas de agendamento. Tente novamente em alguns instantes." },
                    { status: 429 }
                );
            }
        }

        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
            console.error("[Checkout API] Variáveis de ambiente do Supabase ausentes.");
            return NextResponse.json({ error: "Configuração do servidor incompleta. Contate o suporte." }, { status: 500 });
        }

        // Usamos SERVICE_ROLE para poder criar contas fantasmas e manipular perfis/agendamentos
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        const body = await req.json();
        const { serviceId, date, price, serviceName, userName, userId, ghostToken } = body;

        if (!serviceId || !date || price === undefined) {
            return NextResponse.json({ error: "Dados inválidos: serviceId, date e price são obrigatórios." }, { status: 400 });
        }

        // 0. Verificar disponibilidade do horário
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

        let targetUserId = userId;
        let customerName = userName || "Cliente Anônimo";
        let newGhostToken = null;

        // 1. Se não enviou userId, precisamos criar um Ghost User
        if (!targetUserId) {
            if (!userName) {
                return NextResponse.json({ error: "Nome é obrigatório para agendamentos anônimos." }, { status: 400 });
            }

            const ghostUuid = crypto.randomUUID();
            const ghostEmail = `ghost_${ghostUuid}@barbeariaigor.com`;
            const ghostPassword = ghostUuid;

            const { data: authData, error: authError } = await supabase.auth.admin.createUser({
                email: ghostEmail,
                password: ghostPassword,
                email_confirm: true,
                user_metadata: {
                    name: userName
                }
            });

            if (authError || !authData.user) {
                console.error("[Checkout API] Erro ao criar Ghost User:", authError);
                return NextResponse.json({ error: "Erro interno ao processar cadastro simplificado." }, { status: 500 });
            }

            targetUserId = authData.user.id;

            // Atualiza o profile com o nome do cliente (o trigger já deve ter criado o profile)
            const { error: profileError } = await supabase.from('profiles').update({
                name: userName
            }).eq('id', targetUserId);

            if (profileError) {
                console.error("[Checkout API] Erro ao criar Ghost Profile:", profileError);
                // Não falha aqui para não quebrar a expêriencia, tenta seguir
            }

            newGhostToken = { email: ghostEmail, password: ghostPassword };
        } else {
            // Tenta buscar o nome do usuário existente se não foi enviado
            const { data: profile } = await supabase.from('profiles').select('name').eq('id', targetUserId).maybeSingle();
            if (profile?.name) customerName = profile.name;
        }

        // 2. Verificar se precisa de pagamento (Horários antes das 09:00 ou depois/igual às 18:00)
        const appointmentDate = new Date(date);
        const hour = appointmentDate.getHours();
        const requiresPayment = hour < 9 || hour >= 18;

        // Regra de negócio: "todos os cpfs devem ser com o mesmo CPF 00483932159 dentro do sistema para nao barrar no asaas"
        const FIXED_ASAAS_CPF = "00483932159";

        // Agendamento GRATUITO
        if (!requiresPayment) {
            const { error: dbError } = await supabase
                .from("appointments")
                .insert([{
                    user_id: targetUserId,
                    client_name: customerName,
                    service_id: serviceId,
                    date: date,
                    status: "CONFIRMED",
                    payment_status: "CONFIRMED",
                    payment_id: `FREE_${crypto.randomUUID().split('-')[0]}`
                }]);

            if (dbError) {
                console.error("Erro Supabase:", dbError);
                return NextResponse.json({ error: "Falha ao registrar agendamento no banco." }, { status: 500 });
            }

            return NextResponse.json({
                success: true,
                requiresPayment: false,
                message: "Agendamento confirmado com sucesso.",
                ghostToken: newGhostToken
            });
        }

        // 3. Requer Pagamento: Buscar/Criar cliente no Asaas
        let customerId = "";
        const searchCustomerRes = await fetch(`${asaasConfig.API_URL}/customers?cpfCnpj=${FIXED_ASAAS_CPF}`, {
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
            // Criar cliente no Asaas
            const createCustomerRes = await fetch(`${asaasConfig.API_URL}/customers`, {
                method: "POST",
                headers: getAsaasHeaders(),
                body: JSON.stringify({
                    name: "Cliente Sistema", // Nome fixo genérico para este CPF no Asaas
                    cpfCnpj: FIXED_ASAAS_CPF,
                    email: "cliente@barbeariaigor.com"
                })
            });
            
            const createRawText = await createCustomerRes.text();
            let createCustomerData;
            try {
                createCustomerData = JSON.parse(createRawText);
            } catch (err) {
                return NextResponse.json({ error: "Erro de comunicação com o gateway de pagamento (Asaas) ao criar cliente.", details: createRawText }, { status: 502 });
            }

            if (!createCustomerRes.ok) {
                const errorMessage = typeof createCustomerData === 'object' && createCustomerData?.errors?.[0]?.description
                    ? createCustomerData.errors[0].description
                    : "Falha ao criar cliente no Asaas.";
                return NextResponse.json({ error: errorMessage, details: createCustomerData }, { status: 400 });
            }
            customerId = createCustomerData.id;
        }

        // 4. Criar cobrança PIX
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

        const paymentRawText = await paymentRes.text();
        let paymentData: any;
        try {
            paymentData = JSON.parse(paymentRawText);
        } catch {
            return NextResponse.json({ error: "Erro de formatação na resposta do Asaas." }, { status: 502 });
        }

        if (!paymentRes.ok) {
            let msgError = "Erro desconhecido ao gerar Pix no Asaas.";
            if (paymentData.errors && Array.isArray(paymentData.errors) && paymentData.errors.length > 0) {
                 msgError = paymentData.errors.map((e: any) => e.description).join(" | ");
            }
            return NextResponse.json({ error: msgError, details: paymentData }, { status: 400 });
        }

        const paymentId = paymentData.id;

        // 5. Obter o QR Code do PIX
        const qrCodeRes = await fetch(`${asaasConfig.API_URL}/payments/${paymentId}/pixQrCode`, {
            headers: getAsaasHeaders()
        });

        const qrCodeRawText = await qrCodeRes.text();
        let qrCodeData;
        try {
            qrCodeData = JSON.parse(qrCodeRawText);
        } catch (err) {
            return NextResponse.json({ error: "Erro de formatação na resposta do Asaas ao buscar QR Code." }, { status: 502 });
        }

        if (!qrCodeRes.ok) {
            return NextResponse.json({ error: "Falha ao obter QR Code PIX.", details: qrCodeData }, { status: 400 });
        }

        const qrCodeImage = `data:image/png;base64,${qrCodeData.encodedImage}`;
        const qrCodeText = qrCodeData.payload;

        // 6. Salvar o agendamento no Supabase com status pendente
        const { error: dbError } = await supabase
            .from("appointments")
            .insert([{
                user_id: targetUserId,
                client_name: customerName,
                service_id: serviceId,
                date: date,
                status: "PENDING",
                payment_status: "PENDING",
                payment_id: paymentId,
            }]);

        if (dbError) {
            console.error("Erro Supabase:", dbError);
            return NextResponse.json({ error: "Falha ao registrar agendamento no banco." }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            requiresPayment: true,
            paymentId: paymentId,
            qrCodeImage: qrCodeImage,
            qrCodeText: qrCodeText,
            message: "Pedido PIX gerado com sucesso via Asaas.",
            ghostToken: newGhostToken
        });

    } catch (error: unknown) {
        console.error("Erro interno:", error);
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
    }
}