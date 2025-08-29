
"use client";

import { useAuth } from "@/app/context/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";


export function withAuth<P extends object>(Component: React.ComponentType<P>) {
    return function WithAuth(props: P) {
        const { user } = useAuth();
        const router = useRouter();

        useEffect(() => {
            if (!user) {
                router.replace("/auth/login");
            }
        }, [user, router]);

        if (!user) {
            return null; 
        }

        return <Component {...props} />;
    };
}
