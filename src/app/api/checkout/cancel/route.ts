import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const ASAAS_API_URL = "https://api.asaas.com/v3";
// Fixando o token pelo mesmo motivo do checkout route
const ASAAS_TOKEN = "$aact_prod_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OjY4NWNjNDAyLTAyZTgtNDBkMS05MGZjLWRkMmQxYTYzYjZlYjo6JGFhY2hfODAwMzFiMTctMGU0OC00ZWQzLTkyZDMtMmYzOTEzNmQ1Y2Q3";

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

        // 1. Cancel in Asaas
        const deleteRes = await fetch(`${ASAAS_API_URL}/payments/${paymentId}`, {
            method: "DELETE",
            headers: {
                "access_token": ASAAS_TOKEN
            }
        });

        const deleteData = await deleteRes.json();

        if (!deleteRes.ok && deleteData.errors && deleteData.errors[0]?.code !== "invalid_action") {
             // invalid_action often means it's already deleted or paid, we can safely proceed to delete from DB
             console.error("Erro ao cancelar no Asaas:", deleteData);
             return NextResponse.json({ error: "Falha ao cancelar cobrança no Asaas.", details: deleteData }, { status: 400 });
        }

        // 2. Delete appointment from Supabase DB since it was never paid/confirmed
        const { error: dbError } = await supabase
            .from("appointments")
            .delete()
            .eq("payment_id", paymentId)
            .eq("status", "PENDING"); // only delete if it's still pending

        if (dbError) {
            console.error("Erro banco de dados (cancelamento):", dbError);
            return NextResponse.json({ error: "Falha ao remover agendamento do banco." }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: "Pagamento e agendamento cancelados." });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: "Erro no servidor." }, { status: 500 });
    }
}