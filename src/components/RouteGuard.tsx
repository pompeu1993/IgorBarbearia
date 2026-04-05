"use client";

import { useAuth } from "@/contexts/AuthContext";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

export function RouteGuard({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (loading) return; // Espera o AuthProvider carregar a sessão

        const publicPaths = [
            "/",
            "/login",
            "/cadastro",
            "/recuperar-senha",
            "/update-password",
            "/appointments/new",
            "/appointments/new/datetime",
            "/appointments/new/summary",
            "/admin-login"
        ];
        // Retirar query params para checagem exata, se necessário:
        const currentPath = pathname.split('?')[0];
        const isPublicPath = publicPaths.includes(currentPath);

        if (!isAuthenticated && !isPublicPath) {
            router.replace("/");
        }
    }, [isAuthenticated, loading, pathname, router]);

    const publicPaths = [
        "/",
        "/login",
        "/cadastro",
        "/recuperar-senha",
        "/update-password",
        "/appointments/new",
        "/appointments/new/datetime",
        "/appointments/new/summary",
        "/admin-login"
    ];
    const currentPath = pathname.split("?")[0];
    const isPublicPath = publicPaths.includes(currentPath);

    if (loading || (!isAuthenticated && !isPublicPath)) {
        return (
            <div className="flex-1 flex items-center justify-center min-h-screen z-50 bg-black">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return <>{children}</>;
}
