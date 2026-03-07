"use client";

import { useAuth } from "@/contexts/AuthContext";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function RouteGuard({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        if (loading) return; // Espera o AuthProvider carregar a sessão

        const publicPaths = ["/", "/login", "/cadastro"];
        const isPublicPath = publicPaths.includes(pathname);

        if (!isAuthenticated && !isPublicPath) {
            router.replace("/");
        } else {
            setIsChecking(false);
        }
    }, [isAuthenticated, loading, pathname, router]);

    if (loading || isChecking) {
        return (
            <div className="flex-1 flex items-center justify-center min-h-screen z-50 bg-black">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return <>{children}</>;
}
