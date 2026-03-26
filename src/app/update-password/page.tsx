"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function UpdatePasswordPage() {
    const router = useRouter();
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!password) {
            setMessage({ type: 'error', text: 'Por favor, informe a nova senha.' });
            return;
        }

        setLoading(true);
        setMessage(null);

        const { error } = await supabase.auth.updateUser({
            password: password
        });

        if (error) {
            console.error("Update password error:", error);
            let errorText = error.message;
            if (error.status === 422 || errorText.includes("Password should be") || errorText.includes("weak_password")) {
                errorText = "A senha deve ter pelo menos 6 caracteres e não pode ser muito fraca.";
            } else if (errorText.includes("Auth session missing") || error.status === 401) {
                errorText = "Sessão inválida ou expirada. Tente solicitar um novo link de recuperação.";
            } else if (errorText.includes("same_password")) {
                 errorText = "A nova senha deve ser diferente da antiga.";
            } else {
                errorText = "Ocorreu um erro ao atualizar a senha. Verifique se o link ainda é válido.";
            }
            setMessage({ type: 'error', text: errorText });
        } else {
            setMessage({ type: 'success', text: 'Senha atualizada com sucesso! Redirecionando...' });
            setTimeout(() => {
                router.push('/login');
            }, 2000);
        }

        setLoading(false);
    };

    return (
        <div className="min-h-screen flex flex-col justify-center px-6 py-12 relative z-10 bg-[#0c0c0c] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
            <div className="w-full max-w-md mx-auto">
                <div className="mb-10 text-center">
                    <h1 className="text-4xl font-extrabold text-white mb-3 tracking-tight">Nova Senha</h1>
                    <p className="text-white text-sm">
                        Digite sua nova senha abaixo.
                    </p>
                </div>

                <form onSubmit={handleUpdatePassword} className="space-y-6">
                    <div>
                        <label className="block text-[10px] font-bold text-primary uppercase tracking-widest mb-2">Nova Senha</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-primary text-[20px]">lock</span>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full bg-[#111] border border-white/5 rounded-sm pl-12 pr-4 py-4 text-white focus:outline-none focus:border-primary focus:bg-zinc-800 transition-colors text-sm placeholder:text-white"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    {message && (
                        <div className={`p-3 rounded-sm text-xs text-center border ${message.type === 'success' ? 'bg-green-900/30 border-green-500/50 text-green-300' : 'bg-red-900/50 border-red-500/50 text-red-200'}`}>
                            {message.text}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full h-14 mt-6 mb-[100px] bg-gradient-to-r from-[#dca715] via-primary to-[#dca715] text-black rounded-sm shadow-[0_10px_30px_-5px_rgba(212,175,55,0.3)] flex items-center justify-center font-black text-sm uppercase tracking-[0.15em] transition-all disabled:opacity-50 hover:bg-[100%_0] duration-500"
                    >
                        {loading ? 'Salvando...' : 'Salvar Nova Senha'}
                    </button>
                </form>
            </div>
        </div>
    );
}
