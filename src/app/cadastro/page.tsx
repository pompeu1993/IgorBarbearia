"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

function CadastroContent() {
    const { isAuthenticated, loading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectPath = searchParams.get("redirect") || "/";

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [authLoading, setAuthLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    useEffect(() => {
        if (isAuthenticated && !loading) {
            router.push(redirectPath);
        }
    }, [isAuthenticated, loading, router, redirectPath]);

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name || !email || !phone || !password) {
            setErrorMsg("Por favor, preencha todos os campos.");
            return;
        }

        setAuthLoading(true);
        setErrorMsg(null);

        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    name: name,
                    phone: phone,
                }
            }
        });

        if (error) {
            setErrorMsg(error.message);
        } else {
            // Em caso de sucesso de sign up sem necessidade de confirmação,
            // ou se tiver session automática, ele vai redirecionar via useEffect.
            // Se exigir email config, talvez mostre a mensagem:
            setErrorMsg("Conta criada com sucesso! Redirecionando...");
            setTimeout(() => {
                if (redirectPath) {
                    router.push(redirectPath);
                }
            }, 1000);
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
                <div className="mb-8">
                    <Link href={`/login?redirect=${encodeURIComponent(redirectPath)}`} className="inline-flex items-center justify-center p-2 -ml-2 mb-6 text-primary hover:bg-white/5 rounded-full transition-colors">
                        <span className="material-symbols-outlined text-xl">arrow_back_ios_new</span>
                    </Link>
                    <h1 className="text-4xl font-extrabold text-primary mb-2 tracking-tight">Criar Conta</h1>
                    <p className="text-slate-400 text-sm">
                        Preencha os dados para começar sua experiência premium.
                    </p>
                </div>

                <form onSubmit={handleSignUp} className="space-y-6">
                    <div>
                        <label className="block text-[10px] font-bold text-primary uppercase tracking-widest mb-2">Nome Completo</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-primary text-[20px]">person</span>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                className="w-full bg-zinc-900 border border-white/5 rounded-sm pl-12 pr-4 py-4 text-white focus:outline-none focus:border-primary focus:bg-zinc-800 transition-colors text-sm placeholder:text-slate-600"
                                placeholder="Seu nome completo"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-primary uppercase tracking-widest mb-2">E-mail</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-primary text-[20px]">mail</span>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full bg-zinc-900 border border-white/5 rounded-sm pl-12 pr-4 py-4 text-white focus:outline-none focus:border-primary focus:bg-zinc-800 transition-colors text-sm placeholder:text-slate-600"
                                placeholder="seu@email.com"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-primary uppercase tracking-widest mb-2">Número de Celular</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-primary text-[20px]">call</span>
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                required
                                className="w-full bg-zinc-900 border border-white/5 rounded-sm pl-12 pr-4 py-4 text-white focus:outline-none focus:border-primary focus:bg-zinc-800 transition-colors text-sm placeholder:text-slate-600"
                                placeholder="(00) 00000-0000"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-primary uppercase tracking-widest mb-2">Senha</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-primary text-[20px]">lock</span>
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full bg-zinc-900 border border-white/5 rounded-sm pl-12 pr-12 py-4 text-white focus:outline-none focus:border-primary focus:bg-zinc-800 transition-colors text-sm placeholder:text-slate-600 tracking-[0.2em]"
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-primary transition-colors focus:outline-none"
                            >
                                <span className="material-symbols-outlined text-[20px]">{showPassword ? "visibility_off" : "visibility"}</span>
                            </button>
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
                        className="w-full h-14 mt-4 bg-gradient-to-r from-primary to-[#bfa040] hover:from-[#cfaa33] hover:to-[#dcb650] text-black rounded-sm shadow-[0_4px_25px_-5px_rgba(212,175,55,0.3)] flex items-center justify-center font-extrabold text-sm uppercase tracking-wider transition-all disabled:opacity-50"
                    >
                        {authLoading ? 'Processando...' : 'Cadastrar'}
                    </button>
                </form>

                <div className="mt-8 text-center pb-8">
                    <span className="text-slate-400 text-sm">Já tem uma conta? </span>
                    <Link
                        href={`/login?redirect=${encodeURIComponent(redirectPath)}`}
                        className="text-primary font-bold text-sm tracking-wider hover:text-white transition-colors uppercase"
                    >
                        Entre
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default function Cadastro() {
    return (
        <Suspense fallback={
            <div className="flex-1 flex items-center justify-center min-h-[90vh]">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        }>
            <CadastroContent />
        </Suspense>
    );
}
