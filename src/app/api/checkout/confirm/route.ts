import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const ASAAS_API_URL = process.env.ASAAS_API_URL || "https://api.asaas.com/v3";
const ASAAS_TOKEN = "$aact_prod_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OjRmNDhlMGRiLTA4MjgtNGU4OS05Y2RjLWQ2N2U1YWZiMTVmZDo6JGFhY2hfNzc0YzAyMTMtOTUwZi00ZjY3LTg5YWQtYzdiOTFjZTI3NTZj";

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

        // Consultar status do pagamento no Asaas
        const paymentRes = await fetch(`${ASAAS_API_URL}/payments/${paymentId}`, {
            headers: {
                "access_token": ASAAS_TOKEN,
                "Accept": "application/json"
            }
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
            const { error: dbError } = await supabase
                .from("appointments")
                .update({ status: "CONFIRMED", payment_status: "PAID" })
                .eq("payment_id", paymentId);

            if (dbError) {
                console.error("Erro banco de dados:", dbError);
                return NextResponse.json({ error: "Falha ao marcar como pago." }, { status: 500 });
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
