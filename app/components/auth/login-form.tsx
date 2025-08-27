"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Alert, AlertDescription } from "@/app/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { LoginCredentials } from "@/app/types/auth";
import { useAuthStore } from "@/app/lib/auth-store";

interface LoginFormProps {
  onSubmit?: (credentials: LoginCredentials) => void;
  isLoading?: boolean;
}

export function LoginForm({ onSubmit, isLoading: externalLoading }: LoginFormProps) {
  const router = useRouter();
  const { login, isLoading, error, clearError } = useAuthStore();
  const [formData, setFormData] = useState<LoginCredentials>({
    email: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear error when user starts typing
    if (error) {
      clearError();
    }
  };

  // Redirect on successful login
  useEffect(() => {
    if (useAuthStore.getState().isAuthenticated) {
      router.push('/polls');
    }
  }, [router]);

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Welcome back</CardTitle>
        <CardDescription>
          Enter your credentials to access your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading || externalLoading}>
            {isLoading || externalLoading ? "Signing in..." : "Sign in"}
          </Button>
        </form>
        
        <div className="mt-4 text-sm text-gray-600">
          <p>Demo credentials:</p>
          <p>Email: demo@example.com</p>
          <p>Password: password</p>
        </div>
      </CardContent>
    </Card>
  );
}
