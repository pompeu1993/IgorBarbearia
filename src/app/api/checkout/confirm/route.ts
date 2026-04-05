import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { asaasConfig, getAsaasHeaders } from "@/config/asaas";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
    try {
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
            console.error("[Checkout Confirm API] Variáveis de ambiente do Supabase ausentes.");
            return NextResponse.json({ error: "Configuração do servidor incompleta. Contate o suporte." }, { status: 500 });
        }

        const authHeader = req.headers.get("Authorization");
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            { global: { headers: { Authorization: authHeader || "" } } }
        );

        const { paymentId } = await req.json();

        if (!paymentId) {
            return NextResponse.json({ error: "ID de pagamento não fornecido." }, { status: 400 });
        }

        // Consultar status real no Asaas
        const paymentRes = await fetch(`${asaasConfig.API_URL}/payments/${paymentId}`, {
            headers: getAsaasHeaders()
        });

        const paymentRawText = await paymentRes.text();
        let paymentData;
        try {
            paymentData = JSON.parse(paymentRawText);
        } catch (err) {
            console.error("[Checkout Confirm] Resposta não JSON do Asaas:", paymentRawText);
            return NextResponse.json({ error: "Erro de formatação na resposta do Asaas." }, { status: 502 });
        }

        if (!paymentRes.ok) {
            console.error("Erro ao consultar Asaas:", paymentData);
            return NextResponse.json({ error: "Erro ao consultar status no Asaas." }, { status: 400 });
        }

        if (paymentData.status === "RECEIVED" || paymentData.status === "CONFIRMED") {
            // Pagamento efetuado, atualiza o banco de dados
            const supabaseAdmin = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL,
                process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
            );

            const { data: dbData, error: dbError } = await supabaseAdmin
                .from("appointments")
                .update({ status: "CONFIRMED", payment_status: "PAID" })
                .eq("payment_id", paymentId)
                .select("*, services(name), profiles!appointments_user_id_fkey(name)")
                .single();

            if (dbError) {
                console.error("Erro banco de dados:", dbError);
                return NextResponse.json({ error: "Falha ao marcar como pago." }, { status: 500 });
            }

            // Disparar e-mail de notificação de forma assíncrona
            if (process.env.RESEND_API_KEY && dbData) {
                try {
                    const { data: userAuth } = await supabaseAdmin.auth.admin.getUserById(dbData.user_id);
                    const email = userAuth?.user?.email;
                    
                    if (email) {
                        const serviceName = Array.isArray(dbData.services) ? dbData.services[0]?.name : dbData.services?.name;
                        const clientName = Array.isArray(dbData.profiles) ? dbData.profiles[0]?.name : dbData.profiles?.name;
                        const appointmentDate = new Date(dbData.date).toLocaleString('pt-BR', { 
                            dateStyle: 'short', timeStyle: 'short' 
                        });

                        await resend.emails.send({
                            from: "Barbearia Igor <nao-responda@barbeariaigor.com.br>", // Configure o domínio verificado na Resend
                            to: email,
                            subject: "Agendamento Confirmado! 💈",
                            html: `
                                <div style="font-family: sans-serif; color: #111;">
                                    <h2>Olá, ${clientName || 'Cliente'}!</h2>
                                    <p>Seu pagamento via Pix foi recebido e seu agendamento está <strong>confirmado</strong>.</p>
                                    <div style="background: #f4f4f4; padding: 15px; border-radius: 8px; margin: 20px 0;">
                                        <p><strong>Serviço:</strong> ${serviceName || 'Corte'}</p>
                                        <p><strong>Data e Hora:</strong> ${appointmentDate}</p>
                                    </div>
                                    <p>Te esperamos lá!</p>
                                    <p><strong>Barbearia Igor</strong></p>
                                </div>
                            `
                        });
                    }
                } catch (emailErr) {
                    console.error("[Checkout Confirm] Erro ao enviar e-mail via Resend:", emailErr);
                    // Não falha o request se o e-mail der erro
                }
            }

            return NextResponse.json({ success: true, message: "Pagamento e agendamento confirmados." });
        } else {
            return NextResponse.json({ success: false, status: paymentData.status, message: "O pagamento ainda não foi processado." });
        }
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: "Erro no servidor." }, { status: 500 });
    }
}
