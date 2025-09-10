"use client";

import { useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { LoginCredentials } from "@/app/types/auth";

/**
 * Props interface for the LoginForm component
 */
interface LoginFormProps {
  /** Callback function called when form is submitted with valid credentials */
  onSubmit: (credentials: LoginCredentials) => void;
  /** Loading state to disable form during authentication process */
  isLoading?: boolean;
}

/**
 * Login Form Component
 * 
 * A reusable form component for user authentication that handles:
 * - Email and password input collection
 * - Form validation (HTML5 required attributes)
 * - Form state management
 * - Loading state display
 * - Form submission handling
 * 
 * Authentication Flow:
 * 1. User enters email and password
 * 2. Form validates required fields (HTML5 validation)
 * 3. On submit, prevents default browser behavior
 * 4. Calls onSubmit callback with form data
 * 5. Parent component handles actual authentication
 * 6. Form shows loading state during authentication
 * 
 * Features:
 * - Controlled form inputs with React state
 * - Accessible form labels and inputs
 * - Responsive design with shadcn/ui components
 * - Loading state with disabled inputs
 * - Email type validation
 * 
 * @param {LoginFormProps} props - Component props
 * @returns {JSX.Element} Login form with email and password fields
 */
export function LoginForm({ onSubmit, isLoading = false }: LoginFormProps) {
  // Form state management for controlled inputs
  const [formData, setFormData] = useState<LoginCredentials>({
    email: "",
    password: "",
  });

  // Error state for form validation
  const [errors, setErrors] = useState<Partial<LoginCredentials>>({});

  /**
   * Validates form data before submission
   * 
   * @returns {Partial<LoginCredentials>} Object containing validation errors
   */
  const validateForm = (): Partial<LoginCredentials> => {
    const newErrors: Partial<LoginCredentials> = {};
    
    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = "Please enter a valid email address";
      }
    }
    
    // Password validation
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    
    return newErrors;
  };

  /**
   * Handles form submission
   * 
   * Prevents default browser form submission, validates form data,
   * and calls the parent's onSubmit callback with sanitized data.
   * 
   * @param {React.FormEvent} e - Form submission event
   */
  const handleSubmit = (e: React.FormEvent) => {
    // Prevent default browser form submission behavior
    e.preventDefault();
    
    // Validate form data
    const newErrors = validateForm();
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setErrors({});
    
    // Pass sanitized form data to parent component for authentication
    onSubmit({
      email: formData.email.trim().toLowerCase(),
      password: formData.password,
    });
  };

  /**
   * Handles input field changes
   * 
   * Updates the form state when user types in email or password fields.
   * Uses the input's name attribute to update the correct field.
   * Clears validation errors when user starts typing.
   * 
   * @param {React.ChangeEvent<HTMLInputElement>} e - Input change event
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Extract field name and value from the input element
    const { name, value } = e.target;
    
    // Update form state using functional update to preserve other fields
    setFormData(prev => ({
      ...prev,
      [name]: value, // Dynamically update the field based on input name
    }));
    
    // Clear error when user starts typing
    if (errors[name as keyof LoginCredentials]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Welcome back</CardTitle>
        <CardDescription>
          Enter your credentials to access your account
        </CardDescription>
      </CardHeader>
      <CardContent>
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
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email}</p>
            )}
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
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password}</p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
