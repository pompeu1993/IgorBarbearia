/* eslint-disable */
"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function AdminLogin() {
    const router = useRouter();
    const [accessCode, setAccessCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        if (accessCode !== "igor123778") {
            setErrorMsg("Código de acesso incorreto.");
            return;
        }

        setLoading(true);
        setErrorMsg(null);

        // Login oculto usando a conta de admin real do sistema
        const { error } = await supabase.auth.signInWithPassword({
            email: "rafaelmiguelalonso@gmail.com",
            password: "rafael123778", // Senha real do admin no Supabase
        });

        if (error) {
            console.error(error);
            setErrorMsg("Erro interno ao autenticar. Contate o suporte.");
            setLoading(false);
            return;
        }

        // Sucesso
        router.push("/admin");
    };

    return (
        <main className="flex-1 flex flex-col items-center justify-center min-h-screen px-6 bg-black relative z-10">
            <div className="w-full max-w-sm">
                <div className="text-center mb-10">
                    <div className="w-20 h-20 bg-gradient-to-br from-[#dca715] to-[#8a680b] rounded-full mx-auto mb-6 flex items-center justify-center shadow-[0_0_30px_rgba(212,175,55,0.3)]">
                        <span className="material-symbols-outlined text-black text-[40px]">admin_panel_settings</span>
                    </div>
                    <h1 className="text-2xl font-black text-white tracking-widest uppercase mb-2">Acesso Restrito</h1>
                    <p className="text-white/50 text-sm">Área administrativa da barbearia.</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                    <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-2 shadow-lg">
                        <div className="bg-white/5 rounded-xl flex items-center px-4 py-2 border border-transparent focus-within:border-primary/50 transition-colors">
                            <span className="material-symbols-outlined text-white/40 mr-3">key</span>
                            <input
                                type="password"
                                placeholder="Código de Acesso"
                                value={accessCode}
                                onChange={(e) => setAccessCode(e.target.value)}
                                className="w-full bg-transparent text-white py-2 focus:outline-none placeholder:text-white/30"
                                required
                            />
                        </div>
                    </div>

                    {errorMsg && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-center gap-3">
                            <span className="material-symbols-outlined text-red-500 text-[20px]">error</span>
                            <p className="text-red-500 text-xs font-medium">{errorMsg}</p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full h-14 mt-6 bg-gradient-to-r from-[#dca715] via-primary to-[#dca715] text-black rounded-xl shadow-[0_10px_30px_-5px_rgba(212,175,55,0.3)] flex items-center justify-center font-black text-sm uppercase tracking-[0.15em] transition-all disabled:opacity-50 hover:bg-[100%_0] duration-500"
                    >
                        {loading ? 'Acessando...' : 'Entrar no Painel'}
                    </button>
                </form>

                <div className="mt-12 text-center">
                    <Link
                        href="/"
                        className="text-white/50 text-xs font-bold uppercase tracking-widest hover:text-white transition-colors flex items-center justify-center gap-2"
                    >
                        <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                        Voltar ao Início
                    </Link>
                </div>
            </div>
        </main>
    );
}