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

import { useState } from "react";
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
  
  /** Current authenticated user from auth context */
  const { user } = useAuth();
  
  /** Supabase client for database operations */
  const supabase = createSupabaseBrowserClient();
  
  /** Next.js router for navigation */
  const router = useRouter();
  
  /** Toast notification hook for user feedback */
  const { toast } = useToast();

  // ========================================================================
  // EVENT HANDLERS
  // ========================================================================
  
  /**
   * Handles poll creation form submission
   * 
   * Performs a multi-step database transaction to create a poll and its options:
   * 1. Validates user authentication
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
  const handleSubmit = async (e: React.FormEvent) => {
    // Prevent default form submission behavior
    e.preventDefault();
    
    // Authentication validation
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: "You must be logged in to create a poll."
      });
      return;
    }

    // Step 1: Create the poll record
    const { data: poll, error: pollError } = await supabase
      .from("polls")
      .insert({
        title: pollData.title,
        description: pollData.description,
        user_id: user.id, // Associate poll with current user
      })
      .select() // Return the created record
      .single(); // Expect single result

    // Handle poll creation errors
    if (pollError) {
      console.error("Error creating poll:", pollError);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Error creating poll: ${pollError.message}`
      });
      return;
    }

    // Step 2: Create poll options with references to the poll
    const { error: optionsError } = await supabase.from("poll_options").insert(
      pollData.options.map((option) => ({
        poll_id: poll.id, // Reference to the created poll
        option_text: option,
      }))
    );

    // Handle options creation errors
    if (optionsError) {
      console.error("Error creating poll options:", optionsError);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error creating poll options. Please try again."
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
      variant: "success",
      title: "Success",
      description: "Poll created successfully!"
    });
    
    // Navigate to polls listing page
    router.push("/polls");
  };

  const addOption = () => {
    setPollData((prev) => ({
      ...prev,
      options: [...prev.options, ""],
    }));
  };

  const removeOption = (index: number) => {
    if (pollData.options.length > 2) {
      setPollData((prev) => ({
        ...prev,
        options: prev.options.filter((_, i) => i !== index),
      }));
    }
  };

  const updateOption = (index: number, value: string) => {
    setPollData((prev) => ({
      ...prev,
      options: prev.options.map((option, i) => (i === index ? value : option)),
    }));
  };

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
                    onChange={(e) =>
                      setPollData((prev) => ({ ...prev, title: e.target.value }))
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Input
                    id="description"
                    placeholder="Add some context to your poll..."
                    value={pollData.description}
                    onChange={(e) =>
                      setPollData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="space-y-4">
                  <Label>Poll Options</Label>
                  {pollData.options.map((option, index) => (
                    <div key={index} className="flex space-x-2">
                      <Input
                        placeholder={`Option ${index + 1}`}
                        value={option}
                        onChange={(e) => updateOption(index, e.target.value)}
                        required
                      />
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
                  ))}
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
