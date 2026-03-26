"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { user, isAuthenticated } = useAuth();
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isAuthenticated || !user) {
            setLoading(false);
            return;
        }

        const checkAdmin = async () => {
            const { data } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
            if (data?.role === 'admin' || user.email === 'rafaelmiguelalonso@gmail.com') {
                setIsAdmin(true);
            }
            setLoading(false);
        };
        checkAdmin();
    }, [user, isAuthenticated]);

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center min-h-screen bg-black">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
            </div>
        );
    }

    if (!isAdmin) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-black px-6 text-center">
                <span className="material-symbols-outlined text-[64px] text-red-500 mb-4">gpp_bad</span>
                <h1 className="text-2xl font-black text-white uppercase tracking-widest mb-2">Acesso Negado</h1>
                <p className="text-slate-400 text-sm mb-8">Você não tem permissão para acessar esta área.</p>
                <Link href="/" className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-full font-bold uppercase tracking-widest text-xs transition-colors border border-white/10">
                    Voltar ao Início
                </Link>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-black pb-[100px]">
            {children}
            
            {/* Admin Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-xl border-t border-white/5 z-50 px-6 py-4 flex items-center justify-between pb-8">
                <Link href="/admin" className={`flex flex-col items-center gap-1.5 transition-colors ${pathname === '/admin' ? 'text-primary' : 'text-white/50 hover:text-white'}`}>
                    <span className="material-symbols-outlined text-[24px]">{pathname === '/admin' ? 'home' : 'home'}</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest">Início</span>
                </Link>
                <Link href="/admin/agenda" className={`flex flex-col items-center gap-1.5 transition-colors ${pathname === '/admin/agenda' ? 'text-primary' : 'text-white/50 hover:text-white'}`}>
                    <span className="material-symbols-outlined text-[24px]">{pathname === '/admin/agenda' ? 'calendar_month' : 'calendar_month'}</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest">Agenda</span>
                </Link>
                <Link href="/admin/settings" className={`flex flex-col items-center gap-1.5 transition-colors ${pathname === '/admin/settings' ? 'text-primary' : 'text-white/50 hover:text-white'}`}>
                    <span className="material-symbols-outlined text-[24px]">{pathname === '/admin/settings' ? 'settings' : 'settings'}</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest">Config</span>
                </Link>
            </nav>
        </div>
    );
}
