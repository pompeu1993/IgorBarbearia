/* eslint-disable */
import { HistoryItem, HistoryQuery, HistoryResponse, RawHistoryRow } from "@/lib/history/types";

const MAX_PAGE_SIZE = 50;
const DEFAULT_PAGE_SIZE = 10;
const DEFAULT_PROFESSIONAL = "Profissional da Casa";

export function parseHistoryQuery(searchParams: URLSearchParams): HistoryQuery {
    const page = parsePositiveInteger(searchParams.get("page"), 1);
    const pageSize = Math.min(parsePositiveInteger(searchParams.get("pageSize"), DEFAULT_PAGE_SIZE), MAX_PAGE_SIZE);
    const from = normalizeDateFilter(searchParams.get("from"));
    const to = normalizeDateFilter(searchParams.get("to"));

    return { page, pageSize, from, to };
}

export function normalizeHistoryRow(row: RawHistoryRow): HistoryItem {
    const service = Array.isArray(row.service) ? row.service[0] : row.service;

    return {
        id: row.id,
        date: row.date,
        status: row.status,
        paymentStatus: row.payment_status ?? "UNKNOWN",
        professional: DEFAULT_PROFESSIONAL,
        service: {
            id: service?.id ?? row.service_id ?? null,
            name: service?.name ?? "Serviço indisponível",
            price: typeof service?.price === "number" ? service.price : null,
        },
    };
}

export function buildHistoryResponse(args: {
    items: RawHistoryRow[];
    total: number;
    query: HistoryQuery;
}): HistoryResponse {
    const totalPages = Math.max(1, Math.ceil(args.total / args.query.pageSize));

    return {
        items: args.items.map(normalizeHistoryRow),
        pagination: {
            page: args.query.page,
            pageSize: args.query.pageSize,
            total: args.total,
            totalPages,
        },
        filters: {
            from: args.query.from ?? null,
            to: args.query.to ?? null,
        },
    };
}

function parsePositiveInteger(value: string | null, fallback: number) {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function normalizeDateFilter(value: string | null) {
    if (!value) {
        return undefined;
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return undefined;
    }

    return value;
}

function normalizeString(value: string | null) {
    return value && value.trim() ? value.trim() : undefined;
}
