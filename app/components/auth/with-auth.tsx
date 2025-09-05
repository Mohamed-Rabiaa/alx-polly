
"use client";

import { useAuth } from "@/app/context/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Higher-Order Component (HOC) for Route Protection
 * 
 * This HOC wraps components that require authentication, providing automatic
 * route protection and redirect functionality. It ensures that only authenticated
 * users can access protected pages.
 * 
 * Authentication Flow:
 * 1. Checks if user is authenticated on component mount and auth state changes
 * 2. If user is not authenticated, redirects to login page
 * 3. If user is authenticated, renders the wrapped component
 * 4. Shows nothing while redirect is in progress to prevent flash of content
 * 
 * Usage Example:
 * ```tsx
 * // Protect a page component
 * function ProfilePage() {
 *   return <div>Protected content</div>;
 * }
 * 
 * export default withAuth(ProfilePage);
 * 
 * // Or protect any component
 * const ProtectedComponent = withAuth(MyComponent);
 * ```
 * 
 * @template P - Props type of the wrapped component
 * @param {React.ComponentType<P>} Component - The component to protect with authentication
 * @returns {React.ComponentType<P>} Enhanced component with authentication protection
 */
export function withAuth<P extends object>(Component: React.ComponentType<P>) {
    /**
     * Enhanced component with authentication protection
     * 
     * @param {P} props - Props to pass through to the wrapped component
     * @returns {JSX.Element | null} The wrapped component if authenticated, null during redirect
     */
    return function WithAuth(props: P) {
        // Get current authentication state
        const { user } = useAuth();
        const router = useRouter();

        // Handle authentication state changes and redirects
        useEffect(() => {
            // If no user is authenticated, redirect to login page
            if (!user) {
                // Use replace instead of push to prevent back button issues
                router.replace("/auth/login");
            }
        }, [user, router]); // Re-run when user or router changes

        // Prevent rendering protected content while unauthenticated
        // This prevents flash of protected content before redirect
        if (!user) {
            return null; // Could also return a loading spinner here
        }

        // User is authenticated, render the protected component
        return <Component {...props} />;
    };
}
