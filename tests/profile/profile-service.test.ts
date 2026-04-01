import { describe, it, expect, vi } from "vitest";
import { updateUserProfile } from "@/lib/profile/service";

describe("Profile Service - updateUserProfile", () => {
    it("should return success when update works on first try", async () => {
        const mockSupabase = {
            from: vi.fn().mockReturnThis(),
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            select: vi.fn().mockResolvedValue({ data: [{ id: "123", name: "Test" }], error: null })
        } as any;

        const result = await updateUserProfile(mockSupabase, "123", { name: "Test", phone: "123", cpf: null });
        
        expect(result.success).toBe(true);
        expect(result.data).toEqual({ id: "123", name: "Test" });
        expect(mockSupabase.from).toHaveBeenCalledWith("profiles");
        expect(mockSupabase.update).toHaveBeenCalledWith({ name: "Test", phone: "123", cpf: null });
        expect(mockSupabase.eq).toHaveBeenCalledWith("id", "123");
    });

    it("should not retry on client errors like 23505 (Duplicate CPF)", async () => {
        const mockSupabase = {
            from: vi.fn().mockReturnThis(),
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            select: vi.fn().mockResolvedValue({ data: null, error: { code: "23505", message: "Duplicate key" } })
        } as any;

        const result = await updateUserProfile(mockSupabase, "123", { name: "Test", phone: "123", cpf: "111" });
        
        expect(result.success).toBe(false);
        expect(result.error.code).toBe("23505");
        expect(mockSupabase.select).toHaveBeenCalledTimes(1); // Only tried once
    });

    it("should retry on network/server errors and succeed if later attempt works", async () => {
        let attempts = 0;
        const mockSupabase = {
            from: vi.fn().mockReturnThis(),
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            select: vi.fn().mockImplementation(async () => {
                attempts++;
                if (attempts === 1) {
                    return { data: null, error: { code: "503", message: "Service Unavailable" } };
                }
                return { data: [{ id: "123" }], error: null };
            })
        } as any;

        // Pass maxRetries=3, baseDelayMs=10 for fast test
        const result = await updateUserProfile(mockSupabase, "123", { name: "Test", phone: "123", cpf: null }, 3, 10);
        
        expect(result.success).toBe(true);
        expect(attempts).toBe(2);
    });

    it("should return NO_DATA error if update succeeds but returns null data (RLS failure)", async () => {
        const mockSupabase = {
            from: vi.fn().mockReturnThis(),
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            select: vi.fn().mockResolvedValue({ data: [], error: null })
        } as any;

        const result = await updateUserProfile(mockSupabase, "123", { name: "Test", phone: "123", cpf: null });
        
        expect(result.success).toBe(false);
        expect(result.error.code).toBe("NO_DATA");
        expect(result.error.message).toContain("Nenhum dado foi retornado");
    });
});