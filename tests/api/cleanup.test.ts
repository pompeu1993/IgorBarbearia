import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "../../../src/app/api/appointments/cleanup/route";
import { createClient } from "@supabase/supabase-js";

// Mocks
vi.mock("@supabase/supabase-js", () => {
  const rpcMock = vi.fn();
  return {
    createClient: vi.fn(() => ({
      rpc: rpcMock,
    })),
  };
});

describe("POST /api/appointments/cleanup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://mock.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "mock-key";
    process.env.CRON_SECRET = "mock-secret";
  });

  it("deve retornar 401 se o CRON_SECRET estiver ausente ou incorreto", async () => {
    const req = new Request("http://localhost:3000/api/appointments/cleanup", { 
      method: "POST",
      headers: { "Authorization": "Bearer wrong-secret" }
    });
    const response = await POST(req);
    expect(response.status).toBe(401);
  });

  it("deve retornar 500 se as variáveis de ambiente estiverem ausentes", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;

    const req = new Request("http://localhost:3000/api/appointments/cleanup", { 
      method: "POST",
      headers: { "Authorization": "Bearer mock-secret" }
    });
    const response = await POST(req);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBe("Configuração do servidor incompleta.");
  });

  it("deve retornar 500 se a RPC falhar", async () => {
    const mockClient = createClient("", "");
    (mockClient.rpc as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: null,
      error: new Error("DB Error"),
    });

    const req = new Request("http://localhost:3000/api/appointments/cleanup", { 
      method: "POST",
      headers: { "Authorization": "Bearer mock-secret" }
    });
    const response = await POST(req);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBe("Falha ao limpar agendamentos.");
  });

  it("deve retornar 200 e a quantidade de cancelamentos se a RPC for bem-sucedida", async () => {
    const mockClient = createClient("", "");
    (mockClient.rpc as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: 5, // 5 agendamentos cancelados
      error: null,
    });

    const req = new Request("http://localhost:3000/api/appointments/cleanup", { 
      method: "POST",
      headers: { "Authorization": "Bearer mock-secret" }
    });
    const response = await POST(req);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.cancelled_count).toBe(5);
  });
});
