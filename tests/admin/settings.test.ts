import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";

// The frontend logic of `handleSave` isolated to a testable function
async function saveAdminSettings(
    supabaseMock: any, 
    priceStr: string, 
    allowRescheduling: boolean, 
    operatingDays: number[], 
    disabledDates: string[]
) {
    const numPrice = parseFloat(priceStr);
    
    if (isNaN(numPrice)) {
        throw new Error("Preço inválido.");
    }
    if (numPrice < 5.00) {
        throw new Error("O Asaas exige um valor mínimo de R$ 5,00 para cobranças.");
    }
    
    const { data, error } = await supabaseMock
        .from("services")
        .update({ price: numPrice })
        .eq("name", "Corte Tradicional")
        .select();
        
    if (error) throw new Error(`Erro do banco: ${error.message}`);
    if (!data || data.length === 0) {
        throw new Error("Falha de permissão (RLS): Você não tem privilégios de 'admin' no banco de dados para alterar o preço do serviço.");
    }

    const { data: settingsData, error: settingsError } = await supabaseMock
        .from("settings")
        .update({
            allow_rescheduling: allowRescheduling,
            operating_days: operatingDays,
            disabled_dates: disabledDates
        })
        .eq("id", 1)
        .select();

    if (settingsError) throw new Error(`Erro do banco: ${settingsError.message}`);
    if (!settingsData || settingsData.length === 0) {
        throw new Error("Falha de permissão (RLS): Você não tem privilégios de 'admin' para alterar as configurações do sistema.");
    }
    
    return true;
}

describe("Admin Settings Service & RLS Validations", () => {
    it("should successfully save when RLS allows the update (returns data)", async () => {
        const mockSupabase = {
            from: vi.fn().mockReturnThis(),
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            select: vi.fn().mockResolvedValue({ data: [{ id: 1 }], error: null })
        };

        const result = await saveAdminSettings(mockSupabase, "50", true, [1,2], []);
        expect(result).toBe(true);
        expect(mockSupabase.update).toHaveBeenCalledWith({ price: 50 });
    });

    it("should throw specific RLS permission error when updating price returns empty data", async () => {
        const mockSupabase = {
            from: vi.fn().mockReturnThis(),
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            select: vi.fn().mockResolvedValue({ data: [], error: null }) // RLS Blocked
        };

        await expect(saveAdminSettings(mockSupabase, "50", true, [1,2], [])).rejects.toThrow(
            "Falha de permissão (RLS): Você não tem privilégios de 'admin' no banco de dados para alterar o preço do serviço."
        );
    });

    it("should throw generic database error when a real error is returned", async () => {
        const mockSupabase = {
            from: vi.fn().mockReturnThis(),
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            select: vi.fn().mockResolvedValue({ data: null, error: { message: "Connection timeout" } })
        };

        await expect(saveAdminSettings(mockSupabase, "50", true, [1,2], [])).rejects.toThrow(
            "Erro do banco: Connection timeout"
        );
    });

    it("should reject price updates below 5.00", async () => {
        const mockSupabase = {
            from: vi.fn().mockReturnThis(),
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            select: vi.fn().mockResolvedValue({ data: [{ id: 1 }], error: null })
        };

        await expect(saveAdminSettings(mockSupabase, "4.99", true, [1,2], [])).rejects.toThrow(
            "O Asaas exige um valor mínimo de R$ 5,00 para cobranças."
        );
        expect(mockSupabase.update).not.toHaveBeenCalled();
    });

    it("should reject invalid non-numeric price inputs", async () => {
        const mockSupabase = {
            from: vi.fn().mockReturnThis(),
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            select: vi.fn().mockResolvedValue({ data: [{ id: 1 }], error: null })
        };

        await expect(saveAdminSettings(mockSupabase, "invalid", true, [1,2], [])).rejects.toThrow(
            "Preço inválido."
        );
        expect(mockSupabase.update).not.toHaveBeenCalled();
    });
});