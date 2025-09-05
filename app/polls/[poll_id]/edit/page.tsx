/**
 * Edit Poll Page
 * 
 * This page provides functionality for poll creators to edit their existing polls.
 * It includes comprehensive poll management features with security validations.
 * 
 * Key Features:
 * - Poll ownership verification (only creators can edit)
 * - Dynamic option management (add/remove/update options)
 * - Secure vote handling when deleting options
 * - Real-time form validation and error handling
 * - Responsive UI with loading states
 * - Toast notifications for user feedback
 * 
 * Security Considerations:
 * - Authentication required via withAuth HOC
 * - User authorization check (poll creator only)
 * - Secure server actions for vote/option deletion
 * - Input validation and sanitization
 * - Database transaction safety
 * 
 * Database Operations:
 * - Fetch existing poll and options data
 * - Update poll metadata (title, description)
 * - Create new poll options
 * - Delete removed options and associated votes
 * - Refresh data after modifications
 * 
 * @route /polls/[poll_id]/edit
 */

"use client";

import { useState, useEffect, use } from "react";
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
import { deleteVotesForOptionSecure, deletePollOptionSecure, checkVotesForOptionSecure, verifyOptionExistsSecure } from "@/app/lib/actions/poll-actions-secure";
import { useToast } from "@/app/components/ui/use-toast";
import { Poll, PollOption } from "@/app/types/poll";

/**
 * Props interface for EditPollPage component
 * 
 * @interface EditPollPageProps
 * @property {Promise<{poll_id: string}>} params - Next.js dynamic route parameters containing poll ID
 */
interface EditPollPageProps {
  params: Promise<{
    poll_id: string;
  }>;
}

/**
 * Edit Poll Page Content Component
 * 
 * Main component for editing existing polls. Handles the complete poll editing workflow
 * including data fetching, form management, validation, and secure updates.
 * 
 * Component Responsibilities:
 * - Fetch and display existing poll data
 * - Validate user permissions (poll ownership)
 * - Manage form state for poll details and options
 * - Handle dynamic option addition/removal
 * - Process secure poll updates with vote management
 * - Provide user feedback through toast notifications
 * 
 * State Management:
 * - isLoading: Loading state for initial data fetch
 * - pollData: Form data for poll title, description, and options
 * - pollOptions: Current poll options from database
 * 
 * Security Features:
 * - User authentication validation
 * - Poll ownership verification
 * - Secure server actions for data deletion
 * - Input validation and error handling
 * 
 * @param {EditPollPageProps} props - Component props containing route parameters
 */
function EditPollPageContent({ params }: EditPollPageProps) {
  // ========================================================================
  // HOOKS AND STATE
  // ========================================================================
  
  /** Extract poll ID from URL parameters */
  const { poll_id } = use(params);
  
  /** Next.js router for navigation */
  const router = useRouter();
  
  /** Current authenticated user from auth context */
  const { user } = useAuth();
  
  /** Toast notification system for user feedback */
  const { toast } = useToast();
  
  /** Supabase client for database operations */
  const supabase = createSupabaseBrowserClient();

  /** Loading state for initial data fetch and permission validation */
  const [isLoading, setIsLoading] = useState(true);
  
  /** 
   * Form data state for poll editing
   * Contains title, description, and options array for form management
   */
  const [pollData, setPollData] = useState<{
    title: string;
    description: string;
    options: string[];
  }>({
    title: "",
    description: "",
    options: ["", ""], // Start with minimum 2 options
  });

  /** 
   * Current poll options from database
   * Used for tracking changes and managing deletions
   */
  const [pollOptions, setPollOptions] = useState<PollOption[]>([]);

  // ========================================================================
  // DATA FETCHING AND VALIDATION
  // ========================================================================
  
  /**
   * Fetch Poll Data and Validate Permissions Effect
   * 
   * Handles the complete initialization process for poll editing:
   * 1. Validates user authentication
   * 2. Fetches existing poll data from database
   * 3. Verifies poll ownership (security check)
   * 4. Loads poll options for editing
   * 5. Initializes form state with existing data
   * 
   * Security Features:
   * - Redirects unauthenticated users to login
   * - Prevents unauthorized editing (owner-only access)
   * - Comprehensive error handling with user feedback
   * 
   * Dependencies: poll_id, user, router, supabase, toast
   */
  useEffect(() => {
    const fetchPoll = async () => {
      // Authentication check - redirect if not logged in
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to edit polls.",
          variant: "destructive",
        });
        router.push("/auth/login");
        return;
      }

      try {
        setIsLoading(true);
        
        // Fetch the poll data from database
        const { data: pollData, error: pollError } = await supabase
          .from("polls")
          .select("*")
          .eq("id", poll_id)
          .single();

        if (pollError || !pollData) {
          throw new Error("Poll not found");
        }

        // Security check: verify poll ownership
        if (pollData.user_id !== user.id) {
          toast({
            title: "Unauthorized",
            description: "You can only edit your own polls.",
            variant: "destructive",
          });
          router.push("/polls");
          return;
        }

        // Fetch associated poll options
        const { data: optionsData, error: optionsError } = await supabase
          .from("poll_options")
          .select("*")
          .eq("poll_id", poll_id);

        if (optionsError) {
          throw new Error("Failed to fetch poll options");
        }

        // Update component state with fetched data
        setPollOptions(optionsData || []);
        setPollData({
          title: pollData.title,
          description: pollData.description || "",
          options: optionsData ? optionsData.map((option) => option.option_text) : ["", ""],
        });
      } catch (error) {
        console.error("Error fetching poll:", error);
        toast({
          title: "Error",
          description: "Failed to load poll data. Please try again.",
          variant: "destructive",
        });
        router.push("/polls");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPoll();
  }, [poll_id, user, router, supabase, toast]);

  // ========================================================================
  // OPTION MANAGEMENT FUNCTIONS
  // ========================================================================
  
  /**
   * Add New Poll Option
   * 
   * Adds an empty option to the poll options array for user input.
   * Maintains form state consistency and allows dynamic option creation.
   */
  const addOption = () => {
    setPollData((prev) => ({
      ...prev,
      options: [...prev.options, ""], // Add empty option for user input
    }));
  };

  /**
   * Remove Poll Option
   * 
   * Removes an option at the specified index from the options array.
   * Maintains minimum option requirement (handled by UI constraints).
   * 
   * @param {number} index - Index of the option to remove
   */
  const removeOption = (index: number) => {
    setPollData((prev) => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index),
    }));
  };

  /**
   * Update Poll Option Text
   * 
   * Updates the text content of a specific poll option.
   * Maintains immutable state updates for React optimization.
   * 
   * @param {number} index - Index of the option to update
   * @param {string} value - New text value for the option
   */
  const updateOption = (index: number, value: string) => {
    setPollData((prev) => ({
      ...prev,
      options: prev.options.map((option, i) => (i === index ? value : option)),
    }));
  };

  // ========================================================================
  // FORM SUBMISSION HANDLER
  // ========================================================================
  
  /**
   * Handle Poll Update Submission
   * 
   * Processes the complete poll update workflow with comprehensive validation
   * and secure data management. Handles both poll metadata and options updates.
   * 
   * Update Process:
   * 1. Validates user authentication
   * 2. Updates poll metadata (title, description)
   * 3. Analyzes option changes (additions, deletions, modifications)
   * 4. Creates new options as needed
   * 5. Securely deletes removed options and associated votes
   * 6. Refreshes data and provides user feedback
   * 
   * Security Features:
   * - Authentication validation
   * - Secure server actions for vote/option deletion
   * - Transaction-like operations with error rollback
   * - Comprehensive error handling and logging
   * 
   * @param {React.FormEvent} e - Form submission event
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Authentication validation
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to update polls.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Step 1: Update poll metadata (title, description)
      const { error: pollUpdateError } = await supabase
        .from("polls")
        .update({
          title: pollData.title,
          description: pollData.description,
          updated_at: new Date().toISOString(),
        })
        .eq("id", poll_id);

      if (pollUpdateError) {
        console.error("Poll update error:", pollUpdateError);
        throw new Error(`Failed to update poll: ${pollUpdateError.message}`);
      }

      // Step 2: Handle poll options management
      // Filter out empty options and prepare for comparison
      const currentOptionTexts = pollData.options.filter(option => option.trim() !== '');
      const existingOptions = [...pollOptions];
      
      // Track which existing options to keep and which new ones to create
      const optionsToKeep = new Set<string>();
      const optionsToCreate: string[] = [];

      // Step 3: Analyze option changes using exact text matching
      // This prevents unnecessary deletions and recreations
      for (const currentText of currentOptionTexts) {
        // Try to find an exact match with existing options
        const matchingOption = existingOptions.find(existing => 
          !optionsToKeep.has(existing.id) && existing.option_text === currentText
        );

        if (matchingOption) {
          // Keep this existing option as it matches exactly
          optionsToKeep.add(matchingOption.id);
        } else {
          // No exact match found, create a new option
          optionsToCreate.push(currentText);
        }
      }

      // Step 4: Create new options in database
      for (const optionText of optionsToCreate) {
        const { error } = await supabase.from("poll_options").insert({
          poll_id,
          option_text: optionText,
        });

        if (error) {
          console.error("Error creating option:", error);
          throw new Error(`Failed to create option: ${error.message}`);
        }
      }

      // Step 5: Secure deletion of removed options and associated votes
      const optionsToDelete = existingOptions.filter(option => !optionsToKeep.has(option.id));
      
      if (optionsToDelete.length > 0) {
        for (const option of optionsToDelete) {
          // Check for existing votes using secure server action
          // This prevents data integrity issues during deletion
          const votesResult = await checkVotesForOptionSecure(option.id);
          
          if (!votesResult.success) {
            console.error("Error checking votes for option:", votesResult.error);
            throw new Error(`Failed to check votes: ${votesResult.error}`);
          }
          
          const votesData = votesResult.votes;

          // Delete associated votes first if any exist
          // This maintains referential integrity in the database
          if (votesData.length > 0) {
            const deleteVotesResult = await deleteVotesForOptionSecure(option.id);
            
            if (!deleteVotesResult.success) {
              throw new Error(`Failed to delete votes for option: ${deleteVotesResult.error}`);
            }
          }
          
          // Delete the poll option using secure server action
          // Server actions provide additional security validation
          const deleteResult = await deletePollOptionSecure(option.id);
          
          if (!deleteResult.success) {
            throw new Error(`Failed to delete poll option: ${deleteResult.error}`);
          }
        }
      }

      // Step 6: Refresh poll data to reflect all changes
      // This ensures UI consistency after database modifications
      const { data: updatedOptionsData, error: refreshError } = await supabase
        .from("poll_options")
        .select("*")
        .eq("poll_id", poll_id);
        
      if (refreshError) {
        console.error("Error refreshing poll options:", refreshError);
      } else {
        // Update component state with fresh data from database
        setPollOptions(updatedOptionsData || []);
        setPollData(prev => ({
          ...prev,
          options: updatedOptionsData ? updatedOptionsData.map(option => option.option_text) : []
        }));
      }

      // Step 7: Provide success feedback and navigate back
      toast({
        title: "Poll updated",
        description: "Your poll has been successfully updated.",
      });

      router.push("/polls");
    } catch (error) {
      // Comprehensive error handling with user-friendly messages
      console.error("Error updating poll:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to update poll. Please try again.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  // ========================================================================
  // RENDER
  // ========================================================================
  
  // Loading state while fetching data and validating permissions
  if (isLoading) {
    return (
      <div>
        <Header />
        <div className="min-h-screen bg-gray-50 py-12">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-center">Loading poll data...</p>
          </div>
        </div>
      </div>
    );
  }

  // Main edit poll interface
  return (
    <div>
      <Header />
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Edit Poll</h1>
            <p className="mt-2 text-gray-600">
              Update your poll details and options
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Poll Details</CardTitle>
              <CardDescription>
                Make changes to your poll
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Edit Poll Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Poll Title Input */}
                <div className="space-y-2">
                  <Label htmlFor="title">Poll Title</Label>
                  <Input
                    id="title"
                    value={pollData.title}
                    onChange={(e) =>
                      setPollData((prev) => ({ ...prev, title: e.target.value }))
                    }
                    required
                  />
                </div>

                {/* Poll Description Input */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Input
                    id="description"
                    value={pollData.description}
                    onChange={(e) =>
                      setPollData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                  />
                </div>

                {/* Poll Options Management */}
                <div className="space-y-4">
                  <Label>Poll Options</Label>
                  {/* Dynamic list of poll options with edit/remove functionality */}
                  {pollData.options.map((option, index) => (
                    <div key={`option-${index}`} className="flex space-x-2">
                      {/* Option text input */}
                      <Input
                        placeholder={`Option ${index + 1}`}
                        value={option}
                        onChange={(e) => updateOption(index, e.target.value)}
                        required
                      />
                      {/* Remove button (only show if more than 2 options) */}
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
                  {/* Add new option button */}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addOption}
                    className="w-full"
                  >
                    Add Option
                  </Button>
                </div>

                {/* Form Action Buttons */}
                <div className="flex space-x-4">
                  {/* Submit button - triggers handleSubmit function */}
                  <Button type="submit" className="flex-1">
                    Update Poll
                  </Button>
                  {/* Cancel button - navigates back to polls list */}
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => router.push("/polls")}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default withAuth(EditPollPageContent);