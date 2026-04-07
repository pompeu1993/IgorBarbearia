/* eslint-disable */
import { describe, expect, it, vi } from "vitest";
import { createHistoryGetHandler } from "@/app/api/history/route";

describe("GET /api/history", () => {
    it("retorna 401 quando não há usuário autenticado", async () => {
        const handler = createHistoryGetHandler(() => ({
            getCurrentUserId: async () => null,
            repository: {
                completePastAppointments: vi.fn(),
                fetchAppointments: vi.fn(),
            },
        }));

        const response = await handler(new Request("http://localhost/api/history"));
        const body = await response.json();

        expect(response.status).toBe(401);
        expect(body.error).toBe("Usuário não autenticado.");
    });

    it("retorna histórico paginado com todos os status do usuário autenticado", async () => {
        const completePastAppointments = vi.fn();
        const fetchAppointments = vi.fn().mockResolvedValue({
            total: 4,
            rows: [
                { id: "1", date: "2026-03-12T14:00:00Z", status: "PENDING", payment_status: "PENDING", service: { id: "s1", name: "Corte Tradicional", price: 35 } },
                { id: "2", date: "2026-03-11T14:00:00Z", status: "CONFIRMED", payment_status: "PAID", service: { id: "s1", name: "Corte Tradicional", price: 35 } },
                { id: "3", date: "2026-03-10T14:00:00Z", status: "CANCELLED", payment_status: "CANCELLED", service: { id: "s2", name: "Barba", price: 20 } },
                { id: "4", date: "2026-03-09T14:00:00Z", status: "COMPLETED", payment_status: "PAID", service: { id: "s2", name: "Barba", price: 20 } },
            ],
        });

        const handler = createHistoryGetHandler(() => ({
            getCurrentUserId: async () => "user-1",
            repository: { completePastAppointments, fetchAppointments },
        }));

        const response = await handler(new Request("http://localhost/api/history?page=1&pageSize=10&serviceId=s1"));
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(completePastAppointments).toHaveBeenCalledTimes(1);
        expect(fetchAppointments).toHaveBeenCalledWith({
            userId: "user-1",
            query: {
                page: 1,
                pageSize: 10,
                from: undefined,
                to: undefined
            },
        });
        expect(body.pagination.total).toBe(4);
        expect(body.items).toHaveLength(4);
        expect(body.items.map((item: { status: string }) => item.status)).toEqual([
            "PENDING",
            "CONFIRMED",
            "CANCELLED",
            "COMPLETED",
        ]);
    });

    it("encaminha corretamente filtros de período e serviço", async () => {
        const completePastAppointments = vi.fn();
        const fetchAppointments = vi.fn().mockResolvedValue({
            total: 2,
            rows: [
                { id: "1", date: "2026-03-12T14:00:00Z", status: "COMPLETED", payment_status: "PAID", service: { id: "s1", name: "Corte Tradicional", price: 35 } },
                { id: "2", date: "2026-03-10T14:00:00Z", status: "CONFIRMED", payment_status: "PAID", service: { id: "s1", name: "Corte Tradicional", price: 35 } },
            ],
        });

        const handler = createHistoryGetHandler(() => ({
            getCurrentUserId: async () => "user-2",
            repository: { completePastAppointments, fetchAppointments },
        }));

        const response = await handler(new Request("http://localhost/api/history?page=1&pageSize=10&from=2026-03-01&to=2026-03-31&serviceId=s1"));
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(fetchAppointments).toHaveBeenCalledWith({
            userId: "user-2",
            query: {
                page: 1,
                pageSize: 10,
                from: "2026-03-01",
                to: "2026-03-31",
            },
        });
        expect(body.items).toHaveLength(2);
        expect(body.filters).toEqual({
            from: "2026-03-01",
            to: "2026-03-31"
        });
    });
});
