/* eslint-disable */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { POST } from "@/app/api/checkout/confirm/route";
import { NextRequest } from "next/server";

// Mock do Supabase
vi.mock("@supabase/supabase-js", () => ({
    createClient: vi.fn(() => ({
        from: vi.fn((table) => {
            if (table === "appointments") {
                return {
                    update: vi.fn().mockReturnThis(),
                    eq: vi.fn().mockResolvedValue({
                        error: null
                    })
                };
            }
            return {};
        })
    }))
}));

const originalFetch = global.fetch;

describe("POST /api/checkout/confirm", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        global.fetch = originalFetch;
    });

    const createMockRequest = (body: any) => {
        return new NextRequest("http://localhost/api/checkout/confirm", {
            method: "POST",
            headers: {
                "Authorization": "Bearer fake-token",
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        });
    };

    it("deve retornar 400 se paymentId não for fornecido", async () => {
        const req = createMockRequest({});
        const res = await POST(req);
        const data = await res.json();

        expect(res.status).toBe(400);
        expect(data.error).toMatch(/ID de pagamento não fornecido/);
    });

    it("deve retornar sucesso quando o pagamento estiver CONFIRMED", async () => {
        const responseData = { status: "CONFIRMED" };
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(responseData),
            text: () => Promise.resolve(JSON.stringify(responseData))
        });

        const req = createMockRequest({ paymentId: "pay_123" });
        const res = await POST(req);
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.message).toMatch(/confirmados/);
    });

    it("deve retornar success false se o pagamento ainda estiver PENDING", async () => {
        const responseData = { status: "PENDING" };
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(responseData),
            text: () => Promise.resolve(JSON.stringify(responseData))
        });

        const req = createMockRequest({ paymentId: "pay_123" });
        const res = await POST(req);
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(data.success).toBe(false);
        expect(data.status).toBe("PENDING");
    });

    it("deve retornar 502 se o Asaas retornar resposta não JSON", async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: false,
            json: () => Promise.reject(new SyntaxError("Unexpected token <")),
            text: () => Promise.resolve("<html>Gateway Timeout</html>")
        });

        const req = createMockRequest({ paymentId: "pay_123" });
        const res = await POST(req);
        const data = await res.json();

        expect(res.status).toBe(502);
        expect(data.error).toMatch(/formatação/);
    });
});
