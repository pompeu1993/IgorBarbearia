import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { loadUserHistory } from "@/lib/history/service";
import { HistoryRepository, HistoryQuery, RawHistoryRow } from "@/lib/history/types";

export const dynamic = 'force-dynamic';

export function createHistoryGetHandler(
    createRepository: (request: Request) => {
        repository: HistoryRepository;
        getCurrentUserId: () => Promise<string | null>;
    },
) {
    return async function GET(request: Request) {
        try {
            const { repository, getCurrentUserId } = createRepository(request);
            const userId = await getCurrentUserId();

            if (!userId) {
                return NextResponse.json({ error: "Usuário não autenticado." }, { status: 401 });
            }

            const history = await loadUserHistory({
                searchParams: new URL(request.url).searchParams,
                userId,
                repository,
            });

            return NextResponse.json(history);
        } catch (error) {
            console.error(error);
            return NextResponse.json({ error: "Erro interno ao carregar histórico." }, { status: 500 });
        }
    };
}

export const GET = createHistoryGetHandler((request) => {
    const authHeader = request.headers.get("Authorization");
    const authClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { global: { headers: { Authorization: authHeader || "" } } },
    );
    const databaseClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    return {
        getCurrentUserId: async () => {
            const jwt = authHeader ? authHeader.replace("Bearer ", "") : undefined;
            const { data, error } = await authClient.auth.getUser(jwt);
            if (error) {
                console.error("Auth error:", error);
            }
            return data.user?.id ?? null;
        },
        repository: {
            completePastAppointments: async (userId, nowIso) => {
                await databaseClient
                    .from("appointments")
                    .update({ status: "COMPLETED" })
                    .eq("user_id", userId)
                    .eq("status", "CONFIRMED")
                    .lt("date", nowIso);
            },
            fetchAppointments: async ({ userId, query }: { userId: string; query: HistoryQuery }) => {
                const fromIndex = (query.page - 1) * query.pageSize;
                const toIndex = fromIndex + query.pageSize - 1;
                let rowsQuery = databaseClient
                    .from("appointments")
                    .select("id, date, status, payment_status, service_id, service:services(id, name, price)", { count: "exact" })
                    .eq("user_id", userId)
                    .in("status", ["CONFIRMED", "COMPLETED"]);

                if (query.from) {
                    rowsQuery = rowsQuery.gte("date", new Date(query.from).toISOString());
                }

                if (query.to) {
                    const endOfDay = new Date(query.to);
                    endOfDay.setHours(23, 59, 59, 999);
                    rowsQuery = rowsQuery.lte("date", endOfDay.toISOString());
                }

                rowsQuery = rowsQuery.order("date", { ascending: false }).range(fromIndex, toIndex);

                const { data, count, error } = await rowsQuery;

                if (error) {
                    console.error("fetchAppointments error:", error);
                    throw error;
                }

                return {
                    rows: (data ?? []) as RawHistoryRow[],
                    total: count ?? 0,
                };
            },
        },
    };
});
