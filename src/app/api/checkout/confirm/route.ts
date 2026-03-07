import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
    try {
        const authHeader = req.headers.get("Authorization");
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            { global: { headers: { Authorization: authHeader || "" } } }
        );

        const { paymentId } = await req.json();

        if (!paymentId) {
            return NextResponse.json({ error: "ID de pagamento não fornecido." }, { status: 400 });
        }

        // Em uma implementação real do PagSeguro, verificaríamos o status com a API
        // antes de atualizar o banco de dados. Como é simulado, atualizamos direto.
        const { error: dbError } = await supabase
            .from("appointments")
            .update({ status: "CONFIRMED", payment_status: "PAID" })
            .eq("payment_id", paymentId);

        if (dbError) {
            console.error("Erro banco de dados:", dbError);
            return NextResponse.json({ error: "Falha ao marcar como pago." }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: "Pagamento e agendamento confirmados." });
    } catch (err) {
        return NextResponse.json({ error: "Erro no servidor." }, { status: 500 });
    }
}
