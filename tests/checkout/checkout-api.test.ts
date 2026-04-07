/* eslint-disable */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { POST } from "@/app/api/checkout/route";
import { NextRequest } from "next/server";

// Mock do Supabase
vi.mock("@supabase/supabase-js", () => ({
    createClient: vi.fn(() => ({
        auth: {
            getUser: vi.fn().mockResolvedValue({
                data: {
                    user: { id: "user-123", email: "test@example.com", user_metadata: { name: "Test User", cpf: "12345678909" } }
                },
                error: null
            })
        },
        from: vi.fn((table) => {
            if (table === "profiles") {
                return {
                    select: vi.fn().mockReturnThis(),
                    eq: vi.fn().mockReturnThis(),
                    maybeSingle: vi.fn().mockResolvedValue({
                        data: { cpf: "123.456.789-09", name: "Test User" },
                        error: null
                    })
                };
            }
            if (table === "appointments") {
                return {
                    insert: vi.fn().mockResolvedValue({
                        error: null
                    })
                };
            }
            return {};
        })
    }))
}));

// Setup global fetch mock
const originalFetch = global.fetch;

describe("POST /api/checkout", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        global.fetch = originalFetch;
    });

    const createMockRequest = (body: any) => {
        return new NextRequest("http://localhost/api/checkout", {
            method: "POST",
            headers: {
                "Authorization": "Bearer fake-token",
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        });
    };

    it("deve retornar 400 se faltarem dados obrigatórios", async () => {
        const req = createMockRequest({ serviceId: "123" }); // Faltando date e price
        const res = await POST(req);
        const data = await res.json();

        expect(res.status).toBe(400);
        expect(data.error).toMatch(/Dados inválidos/);
    });

    it("deve processar o checkout e retornar a chave PIX com sucesso", async () => {
        // Mocking fetch behavior for Asaas API calls
        global.fetch = vi.fn().mockImplementation((url: string) => {
            if (url.includes("/customers?cpfCnpj=")) {
                const responseData = { data: [{ id: "cus_123" }] };
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve(responseData),
                    text: () => Promise.resolve(JSON.stringify(responseData))
                });
            }
            if (url.includes("/payments") && !url.includes("pixQrCode")) {
                const responseData = { id: "pay_123" };
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve(responseData),
                    text: () => Promise.resolve(JSON.stringify(responseData))
                });
            }
            if (url.includes("pixQrCode")) {
                const responseData = { encodedImage: "base64image", payload: "pix-key-123" };
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve(responseData),
                    text: () => Promise.resolve(JSON.stringify(responseData))
                });
            }
            return Promise.resolve({ ok: false });
        });

        const req = createMockRequest({ serviceId: "serv-1", date: "2023-12-01T10:00:00Z", price: 50, serviceName: "Corte" });
        const res = await POST(req);
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.paymentId).toBe("pay_123");
        expect(data.qrCodeText).toBe("pix-key-123");
    });

    it("deve retornar 502 se a API do Asaas retornar resposta não JSON ao buscar cliente", async () => {
        global.fetch = vi.fn().mockImplementation((url: string) => {
            if (url.includes("/customers?cpfCnpj=")) {
                return Promise.resolve({
                    ok: false,
                    json: () => Promise.reject(new SyntaxError("Unexpected token <")),
                    text: () => Promise.resolve("<html>500 Internal Server Error</html>")
                });
            }
            return Promise.resolve({ ok: false });
        });

        const req = createMockRequest({ serviceId: "serv-1", date: "2023-12-01T10:00:00Z", price: 50 });
        const res = await POST(req);
        const data = await res.json();

        expect(res.status).toBe(502);
        expect(data.error).toMatch(/Erro de comunicação com o gateway/);
    });

    it("deve retornar 400 com detalhes se a API do Asaas recusar a criação do pagamento", async () => {
        global.fetch = vi.fn().mockImplementation((url: string) => {
            if (url.includes("/customers?cpfCnpj=")) {
                const responseData = { data: [{ id: "cus_123" }] };
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve(responseData),
                    text: () => Promise.resolve(JSON.stringify(responseData))
                });
            }
            if (url.includes("/payments") && !url.includes("pixQrCode")) {
                const responseData = { errors: [{ description: "Valor inválido" }] };
                return Promise.resolve({
                    ok: false,
                    json: () => Promise.resolve(responseData),
                    text: () => Promise.resolve(JSON.stringify(responseData))
                });
            }
            return Promise.resolve({ ok: false });
        });

        const req = createMockRequest({ serviceId: "serv-1", date: "2023-12-01T10:00:00Z", price: 50 });
        const res = await POST(req);
        const data = await res.json();

        expect(res.status).toBe(400);
        expect(data.error).toBe("Valor inválido");
    });
});
