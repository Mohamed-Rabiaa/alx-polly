"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/app/components/ui/button";
import { useAuthStore } from "@/app/lib/auth-store";

export function Navigation() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <span className="text-xl font-bold text-gray-900">Pollly</span>
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            {isAuthenticated && user ? (
              <>
                <Link href="/polls">
                  <Button variant="ghost">View Polls</Button>
                </Link>
                <Link href="/create-poll">
                  <Button variant="ghost">Create Poll</Button>
                </Link>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-700">Welcome, {user.name}</span>
                  <Button variant="outline" size="sm" onClick={handleLogout}>
                    Logout
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button variant="ghost">Sign in</Button>
                </Link>
                <Link href="/auth/register">
                  <Button>Sign up</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
