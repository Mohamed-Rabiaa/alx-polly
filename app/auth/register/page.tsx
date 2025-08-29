"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RegisterForm } from "@/app/components/auth/register-form";
import { AuthLayout } from "@/app/components/auth/auth-layout";
import { RegisterCredentials } from "@/app/types/auth";
import { createSupabaseBrowserClient } from "@/app/lib/supabase";

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const handleRegister = async (credentials: RegisterCredentials) => {
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
          data: {
            name: credentials.name,
          },
        },
      });

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
      title="Create your account" 
      subtitle="Join Pollly and start creating polls"
    >
      <RegisterForm onSubmit={handleRegister} isLoading={isLoading} />
      {error && <p className="text-red-500 text-center mt-4">{error}</p>}
      
      <div className="text-center mt-4">
        <p className="text-sm text-gray-600">
          Already have an account?{" "}
          <Link 
            href="/auth/login" 
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            Sign in
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
