"use client";

import Link from "next/link";
import { LoginForm } from "@/app/components/auth/login-form";
import { AuthLayout } from "@/app/components/auth/auth-layout";

export default function LoginPage() {
  return (
    <AuthLayout 
      title="Sign in to your account" 
      subtitle="Welcome back to Pollly"
    >
      <LoginForm />
      
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
