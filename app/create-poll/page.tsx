"use client";

/**
 * Create Poll Page
 * 
 * This module provides the user interface and logic for creating new polls.
 * It implements a multi-step poll creation process with form validation,
 * preview functionality, and database persistence.
 * 
 * Features:
 * - Interactive poll form with dynamic options
 * - Real-time preview of poll appearance
 * - Form validation and error handling
 * - Database transaction for poll and options creation
 * - Authentication-protected route
 * - Toast notifications for user feedback
 * 
 * Database Operations:
 * - Creates poll record in 'polls' table
 * - Creates associated options in 'poll_options' table
 * - Uses Supabase RLS for security
 * 
 * Security:
 * - Protected by withAuth HOC
 * - User authentication validation
 * - Input sanitization and validation
 */

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { withAuth } from "@/app/components/auth/with-auth";
import { useAuth } from "@/app/context/auth-context";
import { Header } from "@/app/components/layout/header";
import { createSupabaseBrowserClient } from "@/app/lib/supabase";
import { useToast } from "@/app/components/ui/use-toast";
import { ErrorHandler } from "@/app/lib/error-handler";

/**
 * Create Poll Page Content Component
 * 
 * Main component for poll creation interface. Handles form state management,
 * validation, database operations, and user interactions.
 * 
 * @returns {JSX.Element} The create poll page UI
 */
function CreatePollPageContent() {
  // ========================================================================
  // STATE AND HOOKS
  // ========================================================================
  
  /**
   * Poll form data state
   * 
   * Manages the poll creation form data including title, description,
   * and dynamic list of poll options. Initialized with empty values
   * and minimum required options (2).
   */
  const [pollData, setPollData] = useState({
    /** Poll title (required) */
    title: "",
    /** Poll description (optional) */
    description: "",
    /** Array of poll options (minimum 2 required) */
    options: ["", ""],
  });
  
  /**
   * Preview modal visibility state
   * 
   * Controls whether the poll preview modal is displayed to the user.
   */
  const [showPreview, setShowPreview] = useState(false);
  
  /** Form validation errors */
  const [errors, setErrors] = useState<{
    title?: string;
    description?: string;
    options?: string[];
  }>({});
  
  /** Current authenticated user from auth context */
  const { user } = useAuth();
  
  /** Supabase client for database operations (memoized) */
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  
  /** Next.js router for navigation */
  const router = useRouter();
  
  /** Toast notification hook for user feedback */
  const { toast } = useToast();

  // ========================================================================
  // VALIDATION
  // ========================================================================
  
  /**
   * Validates poll form data
   * 
   * @returns {object} Object containing validation errors
   */
  const validateForm = useCallback(() => {
    const newErrors: {
      title?: string;
      description?: string;
      options?: string[];
    } = {};
    
    // Title validation
    if (!pollData.title.trim()) {
      newErrors.title = "Poll title is required";
    } else if (pollData.title.trim().length < 3) {
      newErrors.title = "Poll title must be at least 3 characters";
    } else if (pollData.title.trim().length > 200) {
      newErrors.title = "Poll title must be less than 200 characters";
    }
    
    // Description validation (optional but with limits)
    if (pollData.description && pollData.description.length > 500) {
      newErrors.description = "Description must be less than 500 characters";
    }
    
    // Options validation
    const optionErrors: string[] = [];
    const filledOptions = pollData.options.filter(option => option.trim());
    
    if (filledOptions.length < 2) {
      optionErrors.push("At least 2 options are required");
    }
    
    pollData.options.forEach((option, index) => {
      if (option.trim() && option.trim().length > 100) {
        optionErrors[index] = "Option must be less than 100 characters";
      }
    });
    
    // Check for duplicate options
    const trimmedOptions = pollData.options.map(opt => opt.trim().toLowerCase()).filter(opt => opt);
    const uniqueOptions = new Set(trimmedOptions);
    if (trimmedOptions.length !== uniqueOptions.size) {
      optionErrors.push("Options must be unique");
    }
    
    if (optionErrors.length > 0) {
      newErrors.options = optionErrors;
    }
    
    return newErrors;
  }, [pollData.title, pollData.description, pollData.options]);
  
  // ========================================================================
  // EVENT HANDLERS
  // ========================================================================
  
  /**
   * Handles poll creation form submission
   * 
   * Performs a multi-step database transaction to create a poll and its options:
   * 1. Validates user authentication and form data
   * 2. Creates the poll record in the 'polls' table
   * 3. Creates associated options in the 'poll_options' table
   * 4. Handles success/error states and user feedback
   * 5. Resets form and navigates on success
   * 
   * Database Transaction Flow:
   * - Poll creation returns the new poll ID
   * - Poll options are created with references to the poll ID
   * - RLS policies ensure only authenticated users can create polls
   * 
   * @param {React.FormEvent} e - Form submission event
   */
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    // Prevent default form submission behavior
    e.preventDefault();
    
    // Authentication validation
    if (!user) {
      ErrorHandler.handleError('User not authenticated');
      return;
    }
    
    // Form validation
    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }
    
    setErrors({});

    // Step 1: Create the poll record with sanitized data
    const { data: poll, error: pollError } = await supabase
      .from("polls")
      .insert({
        title: pollData.title.trim(),
        description: pollData.description.trim() || null,
        user_id: user.id, // Associate poll with current user
      })
      .select() // Return the created record
      .single(); // Expect single result

    // Handle poll creation errors
    if (pollError) {
      ErrorHandler.handleError(pollError, {
        fallbackMessage: 'Failed to create poll'
      });
      return;
    }

    // Step 2: Create poll options with sanitized data
    const { error: optionsError } = await supabase.from("poll_options").insert(
      pollData.options
        .filter(option => option.trim()) // Only include non-empty options
        .map((option) => ({
          poll_id: poll.id, // Reference to the created poll
          option_text: option.trim(),
        }))
    );

    // Handle options creation errors
    if (optionsError) {
      ErrorHandler.handleError(optionsError, {
        fallbackMessage: 'Failed to create poll options'
      });
      return;
    }

    // Step 3: Reset form to initial state
    setPollData({
      title: "",
      description: "",
      options: ["", ""],
    });

    // Step 4: Show success notification and navigate
    toast({
      title: "Success",
      description: "Poll created successfully!"
    });
    
    // Navigate to polls listing page
    router.push("/polls");
  }, [user, validateForm, supabase, pollData, toast, router]);

  const addOption = useCallback(() => {
    setPollData((prev) => ({
      ...prev,
      options: [...prev.options, ""],
    }));
  }, []);

  const removeOption = useCallback((index: number) => {
    if (pollData.options.length > 2) {
      setPollData((prev) => ({
        ...prev,
        options: prev.options.filter((_, i) => i !== index),
      }));
    }
  }, [pollData.options.length]);

  const updateOption = useCallback((index: number, value: string) => {
    setPollData((prev) => ({
      ...prev,
      options: prev.options.map((option, i) => (i === index ? value : option)),
    }));
    
    // Clear option-specific errors when user starts typing
    if (errors.options && errors.options[index]) {
      setErrors(prev => ({
        ...prev,
        options: prev.options?.filter((_, i) => i !== index),
      }));
    }
  }, [errors.options]);

  // Optimized change handlers
  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPollData((prev) => ({ ...prev, title: e.target.value }));
    // Clear title error when user starts typing
    if (errors.title) {
      setErrors(prev => ({ ...prev, title: undefined }));
    }
  }, [errors.title]);

  const handleDescriptionChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPollData((prev) => ({
      ...prev,
      description: e.target.value,
    }));
    // Clear description error when user starts typing
    if (errors.description) {
      setErrors(prev => ({ ...prev, description: undefined }));
    }
  }, [errors.description]);

  // Memoized poll options to prevent unnecessary re-renders
  const pollOptionsElements = useMemo(() => {
    return pollData.options.map((option, index) => (
      <div key={index} className="flex space-x-2">
        <Input
          placeholder={`Option ${index + 1}`}
          value={option}
          onChange={(e) => updateOption(index, e.target.value)}
          required
          maxLength={100}
        />
        {errors.options && errors.options[index] && (
          <p className="text-sm text-red-500">{errors.options[index]}</p>
        )}
        {pollData.options.length > 2 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => removeOption(index)}
          >
            Remove
          </Button>
        )}
      </div>
    ));
  }, [pollData.options, errors.options, updateOption, removeOption]);

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Create New Poll
            </h1>
            <p className="mt-2 text-gray-600">
              Design your poll and start gathering responses
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Poll Details</CardTitle>
              <CardDescription>
                Fill in the details for your new poll
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Poll Title</Label>
                  <Input
                    id="title"
                    placeholder="What's your favorite programming language?"
                    value={pollData.title}
                    onChange={handleTitleChange}
                    required
                    maxLength={200}
                  />
                  {errors.title && (
                    <p className="text-sm text-red-500">{errors.title}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Input
                    id="description"
                    placeholder="Add some context to your poll..."
                    value={pollData.description}
                    onChange={handleDescriptionChange}
                    maxLength={500}
                  />
                  {errors.description && (
                    <p className="text-sm text-red-500">{errors.description}</p>
                  )}
                </div>

                <div className="space-y-4">
                  <Label>Poll Options</Label>
                  {pollOptionsElements}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addOption}
                    className="w-full"
                  >
                    Add Option
                  </Button>
                </div>

                <div className="flex space-x-4">
                  <Button type="submit" className="flex-1">
                    Create Poll
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowPreview(true)}
                  >
                    Preview
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">{pollData.title}</h2>
            <p className="text-gray-600 mb-6">{pollData.description}</p>
            <div className="space-y-4">
              {pollData.options.map((option, index) => (
                <div key={index} className="border rounded-md p-4">
                  {option}
                </div>
              ))}
            </div>
            <Button
              variant="outline"
              className="w-full mt-6"
              onClick={() => setShowPreview(false)}
            >
              Close Preview
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

export default withAuth(CreatePollPageContent);
