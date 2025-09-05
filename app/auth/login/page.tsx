"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LoginForm } from "@/app/components/auth/login-form";
import { AuthLayout } from "@/app/components/auth/auth-layout";
import { LoginCredentials } from "@/app/types/auth";
import { createSupabaseBrowserClient } from "@/app/lib/supabase";

/**
 * Login Page Component
 * 
 * This page handles user authentication through email and password.
 * It provides a complete login flow with error handling and navigation.
 * 
 * Authentication Flow:
 * 1. User enters email and password in LoginForm
 * 2. Form submission triggers handleLogin function
 * 3. Credentials are sent to Supabase Auth via signInWithPassword
 * 4. On success: User is redirected to polls page
 * 5. On error: Error message is displayed to user
 * 6. Loading states are managed throughout the process
 * 
 * Features:
 * - Form validation and error display
 * - Loading state management
 * - Automatic redirect on successful login
 * - Link to registration page for new users
 * - Responsive design with AuthLayout wrapper
 * 
 * @returns {JSX.Element} Login page with form and navigation
 */
export default function LoginPage() {
  // Loading state for form submission
  const [isLoading, setIsLoading] = useState(false);
  
  // Error state for displaying authentication errors
  const [error, setError] = useState<string | null>(null);
  
  // Router for navigation after successful login
  const router = useRouter();
  
  // Supabase client for authentication
  const supabase = createSupabaseBrowserClient();

  /**
   * Handles user login authentication
   * 
   * This function processes login form submission by:
   * 1. Setting loading state to prevent multiple submissions
   * 2. Clearing any previous error messages
   * 3. Attempting authentication with Supabase
   * 4. Handling success/error responses appropriately
   * 5. Managing loading state cleanup
   * 
   * @param {LoginCredentials} credentials - User's email and password
   * @returns {Promise<void>} Resolves when login process completes
   */
  const handleLogin = async (credentials: LoginCredentials) => {
    // Prevent multiple submissions and show loading state
    setIsLoading(true);
    
    // Clear any previous error messages
    setError(null);
    
    try {
      // Attempt to sign in with Supabase Auth
      const { error } = await supabase.auth.signInWithPassword(credentials);

      if (error) {
        // Display authentication error to user
        setError(error.message);
      } else {
        // Successful login - redirect to main polls page
        // The AuthContext will automatically update with the new user session
        router.push("/polls");
      }
    } catch (error) {
      // Handle unexpected errors (network issues, etc.)
      setError("An unexpected error occurred.");
    } finally {
      // Always reset loading state when process completes
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
