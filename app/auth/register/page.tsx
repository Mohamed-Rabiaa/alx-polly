"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RegisterForm } from "@/app/components/auth/register-form";
import { AuthLayout } from "@/app/components/auth/auth-layout";
import { RegisterCredentials } from "@/app/types/auth";
import { createSupabaseBrowserClient } from "@/app/lib/supabase";

/**
 * Registration Page Component
 * 
 * This page handles new user registration with email, password, and name.
 * It provides a complete registration flow with error handling and navigation.
 * 
 * Authentication Flow:
 * 1. User enters name, email, and password in RegisterForm
 * 2. Form submission triggers handleRegister function
 * 3. User data is sent to Supabase Auth via signUp
 * 4. User metadata (name) is stored in the auth user profile
 * 5. On success: User is automatically signed in and redirected to polls page
 * 6. On error: Error message is displayed to user
 * 7. Loading states are managed throughout the process
 * 
 * Features:
 * - User registration with email/password authentication
 * - User profile data storage (name in metadata)
 * - Form validation and error display
 * - Loading state management
 * - Automatic sign-in after successful registration
 * - Link to login page for existing users
 * - Responsive design with AuthLayout wrapper
 * 
 * @returns {JSX.Element} Registration page with form and navigation
 */
export default function RegisterPage() {
  // Loading state for form submission
  const [isLoading, setIsLoading] = useState(false);
  
  // Error state for displaying registration errors
  const [error, setError] = useState<string | null>(null);
  
  // Router for navigation after successful registration
  const router = useRouter();
  
  // Supabase client for authentication
  const supabase = createSupabaseBrowserClient();

  /**
   * Handles user registration
   * 
   * This function processes registration form submission by:
   * 1. Setting loading state to prevent multiple submissions
   * 2. Clearing any previous error messages
   * 3. Creating new user account with Supabase Auth
   * 4. Storing user metadata (name) in the auth profile
   * 5. Handling success/error responses appropriately
   * 6. Managing loading state cleanup
   * 
   * @param {RegisterCredentials} credentials - User's name, email, and password
   * @returns {Promise<void>} Resolves when registration process completes
   */
  const handleRegister = async (credentials: RegisterCredentials) => {
    // Prevent multiple submissions and show loading state
    setIsLoading(true);
    
    // Clear any previous error messages
    setError(null);

    try {
      // Create new user account with Supabase Auth
      const { error } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
          // Store additional user data in auth metadata
          data: {
            name: credentials.name, // User's display name
          },
        },
      });

      if (error) {
        // Display registration error to user
        setError(error.message);
      } else {
        // Successful registration - user is automatically signed in
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
