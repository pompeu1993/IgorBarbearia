/* eslint-disable */
import { describe, expect, it } from "vitest";
import { buildHistoryResponse, parseHistoryQuery } from "@/lib/history/utils";

describe("parseHistoryQuery", () => {
    it("aplica paginação padrão e filtros opcionais", () => {
        const query = parseHistoryQuery(new URLSearchParams());

        expect(query).toEqual({
            page: 1,
            pageSize: 10,
            from: undefined,
            to: undefined,
        });
    });

    it("normaliza paginação e filtros informados", () => {
        const query = parseHistoryQuery(new URLSearchParams({
            page: "2",
            pageSize: "100", // acima do máximo
            from: "2026-03-01",
            to: "2026-03-31",
            serviceId: "service-1" // Agora ignorado
        }));

        expect(query).toEqual({
            page: 2,
            pageSize: 50, // limitado
            from: "2026-03-01",
            to: "2026-03-31"
        });
    });
});

describe("buildHistoryResponse", () => {
    it("preserva todos os status retornados pelo histórico", () => {
        const response = buildHistoryResponse({
            total: 4,
            query: { page: 1, pageSize: 10 },
            items: [
                { id: "1", date: "2026-03-10T10:00:00Z", status: "PENDING", payment_status: "PENDING", service: { id: "a", name: "Corte Tradicional", price: 35 } },
                { id: "2", date: "2026-03-09T10:00:00Z", status: "CONFIRMED", payment_status: "PAID", service: { id: "a", name: "Corte Tradicional", price: 35 } },
                { id: "3", date: "2026-03-08T10:00:00Z", status: "CANCELLED", payment_status: "CANCELLED", service: { id: "a", name: "Corte Tradicional", price: 35 } },
                { id: "4", date: "2026-03-07T10:00:00Z", status: "COMPLETED", payment_status: "PAID", service: { id: "a", name: "Corte Tradicional", price: 35 } },
            ],
        });

        expect(response.items.map((item) => item.status)).toEqual([
            "PENDING",
            "CONFIRMED",
            "CANCELLED",
            "COMPLETED",
        ]);
        expect(response.items[0].professional).toBe("Profissional da Casa");
        expect(response.pagination.totalPages).toBe(1);
    });
});
