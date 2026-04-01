import { HistoryRepository, HistoryResponse } from "@/lib/history/types";
import { buildHistoryResponse, parseHistoryQuery } from "@/lib/history/utils";

export async function loadUserHistory(args: {
    searchParams: URLSearchParams;
    userId: string;
    repository: HistoryRepository;
    nowIso?: string;
}): Promise<HistoryResponse> {
    const query = parseHistoryQuery(args.searchParams);
    const nowIso = args.nowIso ?? new Date().toISOString();

    await args.repository.completePastAppointments(args.userId, nowIso);

    const result = await args.repository.fetchAppointments({
        userId: args.userId,
        query,
    });

    return buildHistoryResponse({
        items: result.rows,
        total: result.total,
        query,
    });
}
