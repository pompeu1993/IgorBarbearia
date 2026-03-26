"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

function LoginContent() {
    const { isAuthenticated, loading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectPath = searchParams.get("redirect") || "/";

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
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

    if (loading || isAuthenticated) {
        return (
            <div className="flex-1 flex items-center justify-center min-h-[90vh]">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col justify-center px-6 py-12 relative z-10 bg-[#0c0c0c] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
            <div className="w-full max-w-md mx-auto">

                {/* Logo and Tag */}
                <div className="flex flex-col items-center mb-10 mt-4">
                    <div className="size-20 rounded-full border-[3px] border-primary flex items-center justify-center mb-3 shadow-[0_0_30px_rgba(212,175,55,0.2)]">
                        <span className="material-symbols-outlined text-4xl text-primary transform -rotate-45">content_cut</span>
                    </div>
                    <span className="text-[10px] font-black tracking-[0.3em] text-primary uppercase">Igor Barbearia</span>
                </div>

                <div className="mb-10 text-center">
                    <h1 className="text-4xl font-extrabold text-white mb-3 tracking-tight">Bem-vindo<br />de volta</h1>
                    <p className="text-white text-sm">
                        Entre para agendar seu próximo corte
                    </p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-[10px] font-bold text-primary uppercase tracking-widest mb-2">E-mail</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-primary text-[20px]">mail</span>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full bg-[#111] border border-white/5 rounded-sm pl-12 pr-4 py-4 text-white focus:outline-none focus:border-primary focus:bg-zinc-800 transition-colors text-sm placeholder:text-white"
                                placeholder="seu@email.com"
                            />
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-[10px] font-bold text-primary uppercase tracking-widest">Senha</label>
                        </div>
                        <div className="relative mb-2">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-primary text-[20px]">lock</span>
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full bg-[#111] border border-white/5 rounded-sm pl-12 pr-12 py-4 text-white focus:outline-none focus:border-primary focus:bg-zinc-800 transition-colors text-sm placeholder:text-white tracking-[0.2em]"
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-primary transition-colors focus:outline-none"
                            >
                                <span className="material-symbols-outlined text-[20px]">{showPassword ? "visibility_off" : "visibility"}</span>
                            </button>
                        </div>
                        <div className="flex justify-end">
                            <Link href="/recuperar-senha" className="text-[10px] font-bold text-primary hover:text-white transition-colors uppercase tracking-widest">Esqueci minha senha</Link>
                        </div>
                    </div>

                    {errorMsg && (
                        <div className="bg-red-900/50 border border-red-500/50 text-red-200 text-xs p-3 rounded-sm text-center">
                            {errorMsg}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={authLoading}
                        className="w-full h-14 mt-6 bg-gradient-to-r from-[#dca715] via-primary to-[#dca715] text-black rounded-sm shadow-[0_10px_30px_-5px_rgba(212,175,55,0.3)] flex items-center justify-center font-black text-sm uppercase tracking-[0.15em] transition-all disabled:opacity-50 hover:bg-[100%_0] duration-500"
                    >
                        {authLoading ? 'Processando...' : 'Entrar'}
                    </button>
                </form>

                <div className="mt-12 text-center pb-[100px]">
                    <span className="text-white text-sm block mb-2">Ainda não tem uma conta?</span>
                    <Link
                        href={`/cadastro?redirect=${encodeURIComponent(redirectPath)}`}
                        className="text-primary font-bold text-sm tracking-widest hover:text-white transition-colors uppercase"
                    >
                        Cadastre-se Agora
                    </Link>
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
