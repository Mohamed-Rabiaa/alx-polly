"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LoginForm } from "@/app/components/auth/login-form";
import { AuthLayout } from "@/app/components/auth/auth-layout";
import { LoginCredentials } from "@/app/types/auth";
import { createSupabaseBrowserClient } from "@/app/lib/supabase";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const handleLogin = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase.auth.signInWithPassword(credentials);

      if (error) {
        setError(error.message);
      } else {
        router.push("/polls");
      }
    } catch (error) {
      setError("An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout 
      title="Sign in to your account" 
      subtitle="Welcome back to Pollly"
    >
      <LoginForm onSubmit={handleLogin} isLoading={isLoading} />
      {error && <p className="text-red-500 text-center mt-4">{error}</p>}
      
      <div className="text-center mt-4">
        <p className="text-sm text-gray-600">
          Don't have an account?{" "}
          <Link 
            href="/auth/register" 
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            Sign up
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
