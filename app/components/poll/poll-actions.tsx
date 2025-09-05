"use client";

/**
 * Poll Actions Component
 * 
 * This module provides poll management functionality including editing and deleting polls.
 * It implements a modular architecture with separate classes for different concerns:
 * - Authentication and authorization
 * - Input validation
 * - Database operations
 * - Error handling
 * 
 * Features:
 * - Poll ownership verification
 * - Secure poll deletion with confirmation dialog
 * - Navigation to poll edit page
 * - Optimized re-rendering with React hooks
 * - Centralized error handling and user feedback
 * 
 * Security:
 * - Only poll creators can edit or delete their polls
 * - Input validation for all operations
 * - Proper error handling to prevent information leakage
 */

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Edit, Trash } from "lucide-react";
import { useToast } from "@/app/components/ui/use-toast";
import { createSupabaseBrowserClient } from "@/app/lib/supabase";
import { Button } from "@/app/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/app/components/ui/alert-dialog";
import type { SupabaseClient } from "@supabase/supabase-js";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================
/**
 * Props for the Poll component
 * @interface PollActionsProps
 */
interface PollActionsProps {
  /** Unique identifier for the poll */
  pollId: string;
  /** User ID of the poll creator */
  pollCreatorId: string;
  /** Current authenticated user ID (undefined if not logged in) */
  currentUserId: string | undefined;
  /** Optional callback function called after successful poll deletion */
  onPollDeleted?: () => void;
}

/**
 * Result object for poll operations
 * @interface PollOperationResult
 */
interface PollOperationResult {
  /** Whether the operation completed successfully */
  success: boolean;
  /** Error message if operation failed */
  error?: string;
}

/**
 * Result object for input validation
 * @interface ValidationResult
 */
interface ValidationResult {
  /** Whether the input is valid */
  isValid: boolean;
  /** Error message if validation failed */
  error?: string;
}

/**
 * Result object for authentication checks
 * @interface AuthenticationResult
 */
interface AuthenticationResult {
  /** Whether the user is authorized for the operation */
  isAuthorized: boolean;
  /** Error message if authorization failed */
  error?: string;
}

// ============================================================================
// SUPABASE CLIENT MANAGEMENT
// ============================================================================

/**
 * Singleton pattern for managing Supabase client instances
 * 
 * This class ensures only one Supabase client instance is created and reused
 * throughout the component lifecycle, improving performance and reducing
 * unnecessary client instantiations.
 * 
 * @class SupabaseClientManager
 */
class SupabaseClientManager {
  /** Single instance of the Supabase client */
  private static instance: SupabaseClient | null = null;

  /**
   * Gets or creates the Supabase client instance
   * 
   * Uses lazy initialization to create the client only when needed.
   * Subsequent calls return the same instance for optimal performance.
   * 
   * @returns {SupabaseClient} The Supabase client instance
   */
  static getClient(): SupabaseClient {
    // Create instance if it doesn't exist (lazy initialization)
    if (!this.instance) {
      this.instance = createSupabaseBrowserClient();
    }
    return this.instance;
  }
}

// ============================================================================
// INPUT VALIDATION
// ============================================================================

/**
 * Input validation utilities for poll operations
 * 
 * This class provides static methods for validating user inputs before
 * performing database operations. It helps prevent invalid data from
 * reaching the database and provides consistent error messages.
 * 
 * @class PollValidator
 */
class PollValidator {
  /**
   * Validates a poll ID parameter
   * 
   * Ensures the poll ID is a non-empty string that can be used
   * safely in database queries.
   * 
   * @param {string} pollId - The poll ID to validate
   * @returns {ValidationResult} Validation result with success status and error message
   */
  static validatePollId(pollId: string): ValidationResult {
    // Check for null, undefined, non-string, or empty string
    if (!pollId || typeof pollId !== 'string' || pollId.trim().length === 0) {
      return {
        isValid: false,
        error: 'Invalid poll ID provided'
      };
    }
    return { isValid: true };
  }

  /**
   * Validates a user ID parameter
   * 
   * Ensures the user ID is a non-empty string, indicating the user
   * is properly authenticated.
   * 
   * @param {string | undefined} userId - The user ID to validate
   * @returns {ValidationResult} Validation result with success status and error message
   */
  static validateUserId(userId: string | undefined): ValidationResult {
    // Check for null, undefined, non-string, or empty string
    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      return {
        isValid: false,
        error: 'Invalid user ID provided'
      };
    }
    return { isValid: true };
  }
}

// ============================================================================
// AUTHENTICATION & AUTHORIZATION
// ============================================================================

/**
 * Authentication and authorization utilities for poll operations
 * 
 * This class handles security checks to ensure only authorized users
 * can perform sensitive operations like editing or deleting polls.
 * It implements the principle of least privilege by restricting
 * operations to poll creators only.
 * 
 * @class PollAuthenticator
 */
class PollAuthenticator {
  /**
   * Checks if the current user is authorized to modify a poll
   * 
   * Verifies that:
   * 1. The user is authenticated (has a valid user ID)
   * 2. The user is the creator of the poll (ownership check)
   * 
   * This prevents unauthorized users from modifying polls they don't own.
   * 
   * @param {string | undefined} currentUserId - ID of the currently authenticated user
   * @param {string} pollCreatorId - ID of the user who created the poll
   * @returns {AuthenticationResult} Authorization result with success status and error message
   */
  static checkPollOwnership(
    currentUserId: string | undefined,
    pollCreatorId: string
  ): AuthenticationResult {
    // First, validate that the user is authenticated
    const userValidation = PollValidator.validateUserId(currentUserId);
    if (!userValidation.isValid) {
      return {
        isAuthorized: false,
        error: 'User not authenticated'
      };
    }

    // Then, check if the user owns this poll
    if (currentUserId !== pollCreatorId) {
      return {
        isAuthorized: false,
        error: 'User not authorized to perform this action'
      };
    }

    // User is authenticated and owns the poll
    return { isAuthorized: true };
  }
}

// ============================================================================
// DATABASE OPERATIONS
// ============================================================================

/**
 * Database operations for poll management
 * 
 * This class encapsulates all database interactions related to poll operations.
 * It uses the singleton Supabase client for consistent database access and
 * implements proper error handling for all operations.
 * 
 * Features:
 * - Input validation before database operations
 * - Consistent error handling and reporting
 * - Cascading deletion (polls, options, and votes)
 * - Transaction safety through Supabase RLS policies
 * 
 * @class PollOperations
 */
class PollOperations {
  /** Supabase client instance for database operations */
  private static supabase = SupabaseClientManager.getClient();

  /**
   * Deletes a poll and all associated data
   * 
   * This operation will cascade delete:
   * - The poll record
   * - All poll options
   * - All votes cast on the poll
   * 
   * The deletion is protected by Supabase Row Level Security (RLS) policies
   * that ensure only the poll creator can delete their polls.
   * 
   * @param {string} pollId - The unique identifier of the poll to delete
   * @returns {Promise<PollOperationResult>} Result indicating success or failure
   */
  static async deletePoll(pollId: string): Promise<PollOperationResult> {
    try {
      // Validate input before attempting database operation
      const validation = PollValidator.validatePollId(pollId);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error
        };
      }

      // Perform the deletion operation
      // RLS policies ensure only the poll creator can delete
      const { error } = await this.supabase
        .from("polls")
        .delete()
        .eq("id", pollId);

      // Handle database errors
      if (error) {
        throw error;
      }

      return { success: true };
    } catch (error) {
      // Convert errors to standardized format
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete poll'
      };
    }
  }
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

/**
 * Centralized error handling and message standardization
 * 
 * This class provides user-friendly error messages for various error conditions
 * that can occur during poll operations. It maps technical error messages to
 * human-readable messages that provide clear guidance to users.
 * 
 * Benefits:
 * - Consistent error messaging across the application
 * - User-friendly language instead of technical jargon
 * - Centralized location for error message updates
 * - Security through information hiding (no technical details exposed)
 * 
 * @class ErrorHandler
 */
class ErrorHandler {
  /**
   * Converts technical error messages to user-friendly messages
   * 
   * Maps internal error codes and messages to appropriate user-facing
   * messages that provide clear guidance without exposing technical details.
   * 
   * @param {string | undefined} error - The technical error message
   * @returns {string} User-friendly error message
   */
  static getStandardErrorMessage(error: string | undefined): string {
    // Map of technical errors to user-friendly messages
    const errorMessages: Record<string, string> = {
      'Invalid poll ID provided': 'The poll could not be found.',
      'User not authenticated': 'Please log in to perform this action.',
      'User not authorized to perform this action': 'You can only modify polls you created.',
      'Failed to delete poll': 'Unable to delete the poll. Please try again.',
    };

    // Return mapped message or generic fallback
    return errorMessages[error || ''] || 'An unexpected error occurred. Please try again.';
  }
}

// ============================================================================
// REACT COMPONENT
// ============================================================================

/**
 * Poll Actions Component
 * 
 * Renders edit and delete buttons for polls, with proper authorization checks.
 * Only displays actions to users who own the poll, implementing client-side
 * security measures alongside server-side RLS policies.
 * 
 * Features:
 * - Ownership-based action visibility
 * - Optimized re-rendering with React hooks
 * - Confirmation dialog for destructive actions
 * - Loading states and error handling
 * - Toast notifications for user feedback
 * 
 * Security:
 * - Client-side authorization checks (UI-level)
 * - Server-side RLS policies (database-level)
 * - Input validation before operations
 * 
 * @param {PollActionsProps} props - Component props
 * @returns {JSX.Element | null} Poll actions UI or null if unauthorized
 */
export function Poll({
  pollId,
  pollCreatorId,
  currentUserId,
  onPollDeleted,
}: PollActionsProps) {
  // ========================================================================
  // STATE AND HOOKS
  // ========================================================================
  
  /** Loading state for delete operation */
  const [isDeleting, setIsDeleting] = useState(false);
  
  /** Next.js router for navigation */
  const router = useRouter();
  
  /** Toast notification hook */
  const { toast } = useToast();

  // ========================================================================
  // MEMOIZED VALUES
  // ========================================================================
  
  /**
   * Memoized authentication check
   * 
   * Only recalculates when currentUserId or pollCreatorId changes,
   * preventing unnecessary re-renders and improving performance.
   */
  const authResult = useMemo(() => 
    PollAuthenticator.checkPollOwnership(currentUserId, pollCreatorId),
    [currentUserId, pollCreatorId]
  );

  // ========================================================================
  // AUTHORIZATION CHECK
  // ========================================================================
  
  /**
   * Early return pattern for unauthorized users
   * 
   * If the user is not authorized to modify this poll, return null
   * to hide the action buttons entirely. This provides a clean UX
   * where users only see actions they can perform.
   */
  if (!authResult.isAuthorized) {
    return null;
  }

  // ========================================================================
  // EVENT HANDLERS
  // ========================================================================
  
  /**
   * Handles the edit button click
   * 
   * Validates the poll ID and navigates to the edit page.
   * Uses useCallback to prevent unnecessary re-renders of child components.
   * 
   * @function handleEdit
   */
  const handleEdit = useCallback(() => {
    // Validate poll ID before navigation
    const validation = PollValidator.validatePollId(pollId);
    if (!validation.isValid) {
      toast({
        title: "Error",
        description: ErrorHandler.getStandardErrorMessage(validation.error),
        variant: "destructive",
      });
      return;
    }
    
    // Navigate to edit page
    router.push(`/polls/${pollId}/edit`);
  }, [pollId, router, toast]);

  /**
   * Handles the delete confirmation action
   * 
   * Performs the actual poll deletion after user confirmation.
   * Includes loading state management, error handling, and user feedback.
   * Uses useCallback for performance optimization.
   * 
   * @function handleDeleteConfirm
   */
  const handleDeleteConfirm = useCallback(async () => {
    // Prevent multiple simultaneous delete operations
    if (isDeleting) return;

    try {
      // Set loading state
      setIsDeleting(true);
      
      // Perform the deletion using modularized operations
      const result = await PollOperations.deletePoll(pollId);
      
      // Handle operation failure
      if (!result.success) {
        throw new Error(result.error);
      }
      
      // Show success notification
      toast({
        title: "Poll deleted",
        description: "Your poll has been successfully deleted.",
      });
      
      // Handle post-deletion navigation/refresh
      if (onPollDeleted) {
        // Use callback if provided (for list updates)
        onPollDeleted();
      } else {
        // Fallback to page refresh
        router.refresh();
      }
    } catch (error) {
      // Handle and display errors
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete poll';
      toast({
        title: "Error",
        description: ErrorHandler.getStandardErrorMessage(errorMessage),
        variant: "destructive",
      });
    } finally {
      // Always reset loading state
      setIsDeleting(false);
    }
  }, [isDeleting, pollId, toast, onPollDeleted, router]);

  // ========================================================================
  // RENDER
  // ========================================================================
  
  /**
   * Renders the poll action buttons
   * 
   * Provides edit and delete functionality with:
   * - Edit button: navigates to poll edit page
   * - Delete button: opens confirmation dialog
   * - Loading states during operations
   * - Proper accessibility attributes
   */
  return (
    <div className="flex space-x-2">
      {/* Edit Button */}
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleEdit}
        className="flex items-center"
        aria-label="Edit poll"
      >
        <Edit className="mr-1 h-4 w-4" aria-hidden="true" />
        Edit
      </Button>
      
      {/* Delete Button with Confirmation Dialog */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button 
            variant="destructive" 
            size="sm" 
            disabled={isDeleting}
            className="flex items-center"
            aria-label="Delete poll"
          >
            <Trash className="mr-1 h-4 w-4" aria-hidden="true" />
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </AlertDialogTrigger>
        
        {/* Confirmation Dialog */}
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your poll
              and remove all associated votes and data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <AlertDialogFooter>
            {/* Cancel Button */}
            <AlertDialogCancel disabled={isDeleting}>
              Cancel
            </AlertDialogCancel>
            
            {/* Confirm Delete Button */}
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Deleting..." : "Delete Poll"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}