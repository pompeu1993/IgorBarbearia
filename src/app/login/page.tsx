"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

export default function Login() {
    const { login } = useAuth();
    const router = useRouter();

    const handleLogin = () => {
        login();
        router.push("/");
    };

    return (
        <div className="min-h-[90vh] flex flex-col px-6 py-12 relative z-10">
            <h1 className="text-3xl font-bold text-primary mb-8 text-center uppercase font-display tracking-tight">
                Login / Cadastro
            </h1>

            <div className="flex-1 flex flex-col justify-center">
                <p className="text-slate-400 text-center mb-12">
                    Acesse sua conta para agendar e gerenciar seus horários.
                </p>

                <button
                    onClick={handleLogin}
                    className="w-full h-16 bg-gradient-to-r from-primary to-[#bfa040] hover:from-[#cfaa33] hover:to-[#dcb650] text-black rounded-sm shadow-[0_4px_25px_-5px_rgba(212,175,55,0.3)] flex items-center justify-center font-extrabold text-lg uppercase tracking-wider transition-all"
                >
                    Fazer Login de Teste
                </button>
            </div>
        </div>
    );
}
