import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Rota protegida para limpar agendamentos expirados (chamada via cron ou webhook seguro)
export async function POST(req: Request) {
    try {
        const authHeader = req.headers.get("Authorization");
        
        // Verifica se o token de autorização do Cron (CRON_SECRET) foi enviado
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            console.error("[Cleanup API] Acesso não autorizado.");
            return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
        }

        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
            console.error("[Cleanup API] Variáveis de ambiente do Supabase ausentes.");
            return NextResponse.json({ error: "Configuração do servidor incompleta." }, { status: 500 });
        }

        // Usar service_role para ter permissão de alterar agendamentos de qualquer usuário
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        // Chama a RPC que acabamos de criar no banco de dados
        const { data, error } = await supabase.rpc("cleanup_expired_appointments");

        if (error) {
            console.error("[Cleanup API] Erro ao executar RPC:", error);
            return NextResponse.json({ error: "Falha ao limpar agendamentos." }, { status: 500 });
        }

        console.log(`[Cleanup API] ${data} agendamentos expirados foram cancelados.`);
        return NextResponse.json({ success: true, cancelled_count: data });

    } catch (error) {
        console.error("[Cleanup API] Erro interno:", error);
        return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
    }
}
