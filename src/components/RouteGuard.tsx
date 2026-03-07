"use client";

import { useAuth } from "@/contexts/AuthContext";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function RouteGuard({ children }: { children: React.ReactNode }) {
    const { isAuthenticated } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        const publicPaths = ["/", "/login", "/cadastro"];
        const isPublicPath = publicPaths.includes(pathname);

        const savedAuth = localStorage.getItem("barbearia_auth") === "true";
        const isAuth = isAuthenticated || savedAuth;

        if (!isAuth && !isPublicPath) {
            router.replace("/");
        } else {
            setIsChecking(false);
        }
    }, [isAuthenticated, pathname, router]);

    if (isChecking) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return <>{children}</>;
}
