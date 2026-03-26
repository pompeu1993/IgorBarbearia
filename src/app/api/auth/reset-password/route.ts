import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
    try {
        const { email, redirectTo } = await req.json();

        if (!email) {
            return NextResponse.json({ error: 'E-mail é obrigatório.' }, { status: 400 });
        }

        // Initialize Supabase with service role to bypass RLS and generate admin links
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        );

        // Generate a reset password link via Supabase Admin API
        const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
            type: 'recovery',
            email: email,
            options: {
                redirectTo: redirectTo || `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/update-password`
            }
        });

        if (linkError) {
            console.error("Erro ao gerar link do Supabase:", linkError);
            return NextResponse.json({ error: 'Falha ao processar solicitação.' }, { status: 500 });
        }

        const resetLink = linkData.properties.action_link;

        // Send email via Resend
        const { data, error } = await resend.emails.send({
            from: 'Igor Barbearia <onboarding@resend.dev>', // Resend test domain
            to: [email],
            subject: 'Recuperação de Senha - Igor Barbearia',
            html: `
                <div style="font-family: Arial, sans-serif; max-w: 600px; margin: 0 auto; padding: 20px; background-color: #111; color: #fff; border-radius: 8px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #D4AF37; margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: 2px;">Igor Barbearia</h1>
                    </div>
                    <h2 style="font-size: 20px; margin-bottom: 20px;">Olá,</h2>
                    <p style="color: #ccc; line-height: 1.6; margin-bottom: 20px;">
                        Recebemos uma solicitação para redefinir a senha da sua conta. Se você não fez essa solicitação, pode ignorar este e-mail.
                    </p>
                    <div style="text-align: center; margin: 40px 0;">
                        <a href="${resetLink}" style="background-color: #D4AF37; color: #000; padding: 14px 30px; text-decoration: none; border-radius: 4px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; display: inline-block;">
                            Redefinir Minha Senha
                        </a>
                    </div>
                    <p style="color: #ccc; line-height: 1.6; margin-bottom: 30px;">
                        Ou copie e cole o link abaixo no seu navegador:<br>
                        <a href="${resetLink}" style="color: #D4AF37; word-break: break-all;">${resetLink}</a>
                    </p>
                    <div style="border-top: 1px solid #333; padding-top: 20px; text-align: center;">
                        <p style="color: #666; font-size: 12px; margin: 0;">
                            The Gentlemen's Choice<br>
                            Este é um e-mail automático, por favor não responda.
                        </p>
                    </div>
                </div>
            `
        });

        if (error) {
            console.error("Erro Resend:", error);
            return NextResponse.json({ error: 'Erro ao enviar e-mail.' }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: 'E-mail enviado com sucesso.' });

    } catch (error) {
        console.error("Erro inesperado:", error);
        return NextResponse.json({ error: 'Erro interno no servidor.' }, { status: 500 });
    }
}