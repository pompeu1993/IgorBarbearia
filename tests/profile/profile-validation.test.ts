/* eslint-disable */
import { describe, it, expect } from "vitest";

// Extraímos a lógica pura de validação para ser perfeitamente testável isoladamente
export function validateProfile(name: string, phone: string, cpf: string) {
    const trimmedName = name.trim();
    if (!trimmedName) {
        return { isValid: false, error: "O campo Nome é obrigatório." };
    }

    const unmaskedPhone = phone.replace(/\D/g, "");
    if (!unmaskedPhone || unmaskedPhone.length < 10) {
        return { isValid: false, error: "O campo Telefone é obrigatório e deve ter um formato válido." };
    }

    const unmaskedCpf = cpf.replace(/\D/g, "");
    if (unmaskedCpf && unmaskedCpf.length !== 11) {
        return { isValid: false, error: "O CPF informado é inválido. Digite 11 números ou deixe em branco." };
    }

    return { isValid: true, error: null, data: { name: trimmedName, phone: unmaskedPhone, cpf: unmaskedCpf || null } };
}

describe("Profile Validation", () => {
    it("should fail if name is empty", () => {
        const result = validateProfile("   ", "12999999999", "");
        expect(result.isValid).toBe(false);
        expect(result.error).toBe("O campo Nome é obrigatório.");
    });

    it("should fail if phone is empty or too short", () => {
        const result = validateProfile("João Silva", "123", "");
        expect(result.isValid).toBe(false);
        expect(result.error).toBe("O campo Telefone é obrigatório e deve ter um formato válido.");
    });

    it("should fail if CPF is partially filled", () => {
        const result = validateProfile("João Silva", "12999999999", "123.456.789"); // 9 chars
        expect(result.isValid).toBe(false);
        expect(result.error).toBe("O CPF informado é inválido. Digite 11 números ou deixe em branco.");
    });

    it("should pass with valid name and phone and empty CPF", () => {
        const result = validateProfile("João Silva", "(12) 99999-9999", "");
        expect(result.isValid).toBe(true);
        expect(result.error).toBeNull();
        expect(result.data?.cpf).toBeNull();
    });

    it("should pass with valid name, phone and valid CPF", () => {
        const result = validateProfile("João Silva", "12999999999", "123.456.789-00");
        expect(result.isValid).toBe(true);
        expect(result.error).toBeNull();
        expect(result.data?.cpf).toBe("12345678900");
    });
});