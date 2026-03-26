"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RecuperarSenha() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email) {
            setMessage({ type: 'error', text: 'Por favor, informe seu e-mail.' });
            return;
        }

        setLoading(true);
        setMessage(null);

        // Utiliza a API route que conecta com o Resend
        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    redirectTo: `${window.location.origin}/update-password`
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setMessage({ type: 'error', text: data.error || 'Erro ao enviar e-mail.' });
            } else {
                setMessage({ type: 'success', text: 'Link de recuperação enviado! Verifique sua caixa de entrada.' });
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Erro de conexão com o servidor.' });
        }

        setLoading(false);
    };

    return (
        <div className="min-h-screen flex flex-col px-6 py-12 relative z-10 bg-[#0c0c0c] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">

            {/* Header / Back Button */}
            <div className="mb-10 mt-4">
                <button
                    onClick={() => router.back()}
                    className="inline-flex items-center justify-center size-10 rounded-full border border-white/10 hover:bg-white/5 transition-colors"
                >
                    <span className="material-symbols-outlined text-primary text-xl">arrow_back_ios_new</span>
                </button>
            </div>

            <div className="flex-1 w-full max-w-md mx-auto flex flex-col">
                <div className="mb-10">
                    <h1 className="text-4xl font-extrabold text-white mb-3 tracking-tight">Esqueci minha<br />senha</h1>
                    <p className="text-slate-400 text-sm pr-4">
                        Informe seu e-mail para receber um link de recuperação.
                    </p>
                </div>

                <form onSubmit={handleResetPassword} className="space-y-6">
                    <div>
                        <label className="block text-[10px] font-bold text-primary uppercase tracking-widest mb-2">E-mail</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-primary text-[20px]">mail</span>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full bg-[#111] border border-white/5 rounded-sm pl-12 pr-4 py-4 text-white focus:outline-none focus:border-primary focus:bg-zinc-800 transition-colors text-sm placeholder:text-slate-600"
                                placeholder="seu@email.com"
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
                        className="w-full h-14 mt-6 bg-gradient-to-r from-[#dca715] via-primary to-[#dca715] text-black rounded-sm shadow-[0_10px_30px_-5px_rgba(212,175,55,0.3)] flex items-center justify-center font-black text-sm uppercase tracking-[0.15em] transition-all disabled:opacity-50 hover:bg-[100%_0] duration-500"
                    >
                        {loading ? 'Enviando...' : 'Enviar Link'}
                    </button>
                </form>

                <div className="mt-12 text-center pb-[100px]">
                    <span className="text-slate-500 text-[10px] font-bold tracking-widest uppercase block mb-1">Não recebeu o e-mail?</span>
                    <button
                        onClick={handleResetPassword}
                        disabled={loading || !email}
                        className="text-primary font-bold text-[11px] tracking-widest hover:text-white transition-colors uppercase disabled:opacity-50"
                    >
                        Tentar Novamente
                    </button>
                </div>

                {/* Fixed Logo at Bottom */}
                <div className="mt-auto pt-16 pb-8 flex justify-center w-full">
                    <div className="relative w-full border-t border-white/5 pt-10 flex justify-center">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>
                        <div className="size-14 rounded-full border border-white/10 flex items-center justify-center bg-zinc-900/50">
                            <span className="material-symbols-outlined text-xl text-primary/30 transform -rotate-45">content_cut</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
