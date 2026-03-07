"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { supabase } from "@/lib/supabase";

function LoginContent() {
    const { isAuthenticated, loading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectPath = searchParams.get("redirect") || "/";

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [authLoading, setAuthLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    useEffect(() => {
        if (isAuthenticated && !loading) {
            router.push(redirectPath);
        }
    }, [isAuthenticated, loading, router, redirectPath]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email || !password) {
            setErrorMsg("Por favor, preencha o e-mail e a senha.");
            return;
        }

        setAuthLoading(true);
        setErrorMsg(null);

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setErrorMsg(error.message);
        }

        setAuthLoading(false);
    };

    const handleSignUp = async () => {
        if (!email || !password) {
            setErrorMsg("Por favor, preencha o e-mail e a senha para criar a conta.");
            return;
        }

        setAuthLoading(true);
        setErrorMsg(null);

        // Para simplificar, o cadastro só usará email e senha.
        const { error } = await supabase.auth.signUp({
            email,
            password,
        });

        if (error) {
            setErrorMsg(error.message);
        } else {
            setErrorMsg("Verifique sua caixa de e-mail para confirmar a conta! (Se não exigido pelo painel, basta fazer login com a mesma senha)");
        }

        setAuthLoading(false);
    };

    if (loading || isAuthenticated) {
        return (
            <div className="flex-1 flex items-center justify-center min-h-[90vh]">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-[90vh] flex flex-col px-6 py-12 relative z-10">
            <h1 className="text-3xl font-bold text-primary mb-8 text-center uppercase font-display tracking-tight">
                Acesso
            </h1>

            <div className="flex-1 flex flex-col justify-center">
                <p className="text-slate-400 text-center mb-10">
                    Acesse sua conta para agendar e gerenciar seus horários.
                </p>

                <form onSubmit={handleLogin} className="space-y-4 mb-8">
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">E-mail</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full bg-zinc-900 border border-white/10 rounded-sm px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                            placeholder="seu@email.com"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Senha</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full bg-zinc-900 border border-white/10 rounded-sm px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                            placeholder="••••••••"
                        />
                    </div>

                    {errorMsg && (
                        <div className="bg-red-900/50 border border-red-500/50 text-red-200 text-xs p-3 rounded-sm mb-4">
                            {errorMsg}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={authLoading}
                        className="w-full h-14 mt-4 bg-gradient-to-r from-primary to-[#bfa040] hover:from-[#cfaa33] hover:to-[#dcb650] text-black rounded-sm shadow-[0_4px_25px_-5px_rgba(212,175,55,0.3)] flex items-center justify-center font-extrabold text-sm uppercase tracking-wider transition-all disabled:opacity-50"
                    >
                        {authLoading ? 'Aguarde...' : 'Entrar'}
                    </button>
                </form>

                <div className="text-center">
                    <button
                        type="button"
                        onClick={handleSignUp}
                        className="text-xs font-bold text-primary hover:text-white transition-colors uppercase tracking-widest"
                    >
                        Ainda não tem conta? Criar conta
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function Login() {
    return (
        <Suspense fallback={
            <div className="flex-1 flex items-center justify-center min-h-[90vh]">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        }>
            <LoginContent />
        </Suspense>
    );
}
