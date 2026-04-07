/* eslint-disable */
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export function BottomNav() {
    const pathname = usePathname();
    const { isAuthenticated } = useAuth();

    // Hide client BottomNav if the user is in any /admin route
    if (pathname?.startsWith('/admin')) {
        return null;
    }

    const navItems = [
        { name: "Início", href: "/", icon: "home" },
        { name: "Agendamentos", href: "/appointments", icon: "calendar_month", fill: true },
        { name: "Histórico", href: "/history", icon: "history" },
        { name: "Perfil", href: "/profile", icon: "account_circle" },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-md border-t border-white/10 pb-safe pt-2 px-6 max-w-md mx-auto z-50 pb-4">
            <div className="flex justify-between items-end pb-4">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;

                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`flex flex-col items-center gap-1.5 min-w-[60px] transition-colors ${
                                isActive ? "text-primary" : "text-slate-500 hover:text-white"
                            }`}
                        >
                            <span className="material-symbols-outlined" style={item.fill ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                                {item.icon}
                            </span>
                            <span className="text-[9px] font-bold uppercase tracking-wider">{item.name}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
