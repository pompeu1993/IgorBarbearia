import { describe, expect, it, vi } from "vitest";
import { loadUserHistory } from "@/lib/history/service";

describe("loadUserHistory", () => {
    it("busca todos os agendamentos do usuário autenticado com filtros e paginação", async () => {
        const completePastAppointments = vi.fn();
        const fetchAppointments = vi.fn().mockResolvedValue({
            total: 3,
            rows: [
                { id: "apt-1", date: "2026-03-20T12:00:00Z", status: "COMPLETED", payment_status: "PAID", service: { id: "svc-1", name: "Corte Tradicional", price: 35 } },
                { id: "apt-2", date: "2026-03-18T12:00:00Z", status: "CONFIRMED", payment_status: "PAID", service: { id: "svc-1", name: "Corte Tradicional", price: 35 } },
                { id: "apt-3", date: "2026-03-17T12:00:00Z", status: "PENDING", payment_status: "PENDING", service: { id: "svc-1", name: "Corte Tradicional", price: 35 } },
            ],
        });

        const response = await loadUserHistory({
            userId: "user-123",
            nowIso: "2026-03-21T00:00:00.000Z",
            searchParams: new URLSearchParams({
                page: "2",
                pageSize: "10",
                from: "2026-03-01",
                to: "2026-03-31",
            }),
            repository: {
                completePastAppointments,
                fetchAppointments,
            },
        });

        expect(completePastAppointments).toHaveBeenCalledWith("user-123", "2026-03-21T00:00:00.000Z");
        expect(fetchAppointments).toHaveBeenCalledWith({
            userId: "user-123",
            query: {
                page: 2,
                pageSize: 10,
                from: "2026-03-01",
                to: "2026-03-31",
            },
        });
        expect(response.items.map((item) => item.status)).toEqual([
            "COMPLETED",
            "CONFIRMED",
            "PENDING",
        ]);
        expect(response.pagination.total).toBe(3);
    });
});
