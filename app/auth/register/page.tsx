"use client";

import Link from "next/link";
import { RegisterForm } from "@/app/components/auth/register-form";
import { AuthLayout } from "@/app/components/auth/auth-layout";

export default function RegisterPage() {
  return (
    <AuthLayout 
      title="Create your account" 
      subtitle="Join Pollly and start creating polls"
    >
      <RegisterForm />
      
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
