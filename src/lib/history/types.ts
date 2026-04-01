export type HistoryQuery = {
    page: number;
    pageSize: number;
    from?: string;
    to?: string;
};

export type RawHistoryRow = {
    id: string;
    date: string;
    status: string;
    payment_status?: string;
    created_at?: string;
    service_id?: string;
    service: {
        id?: string;
        name?: string;
        price?: number;
    } | {
        id?: string;
        name?: string;
        price?: number;
    }[] | null;
};

export type HistoryItem = {
    id: string;
    date: string;
    status: string;
    paymentStatus: string;
    professional: string;
    service: {
        id: string | null;
        name: string;
        price: number | null;
    };
};

export type HistoryResponse = {
    items: HistoryItem[];
    pagination: {
        page: number;
        pageSize: number;
        total: number;
        totalPages: number;
    };
    filters: {
        from: string | null;
        to: string | null;
    };
};

export type HistoryRepository = {
    completePastAppointments: (userId: string, nowIso: string) => Promise<void>;
    fetchAppointments: (args: {
        userId: string;
        query: HistoryQuery;
    }) => Promise<{
        rows: RawHistoryRow[];
        total: number;
    }>;
};
