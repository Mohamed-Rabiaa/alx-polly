"use client";

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

// Types
interface PollActionsProps {
  pollId: string;
  pollCreatorId: string;
  currentUserId: string | undefined;
  onPollDeleted?: () => void;
}

interface PollOperationResult {
  success: boolean;
  error?: string;
}

interface ValidationResult {
  isValid: boolean;
  error?: string;
}

interface AuthenticationResult {
  isAuthorized: boolean;
  error?: string;
}

// Centralized Supabase client
class SupabaseClientManager {
  private static instance: SupabaseClient | null = null;

  static getClient(): SupabaseClient {
    if (!this.instance) {
      this.instance = createSupabaseBrowserClient();
    }
    return this.instance;
  }
}

// Input validation
class PollValidator {
  static validatePollId(pollId: string): ValidationResult {
    if (!pollId || typeof pollId !== 'string' || pollId.trim().length === 0) {
      return {
        isValid: false,
        error: 'Invalid poll ID provided'
      };
    }
    return { isValid: true };
  }

  static validateUserId(userId: string | undefined): ValidationResult {
    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      return {
        isValid: false,
        error: 'Invalid user ID provided'
      };
    }
    return { isValid: true };
  }
}

// Authentication logic
class PollAuthenticator {
  static checkPollOwnership(
    currentUserId: string | undefined,
    pollCreatorId: string
  ): AuthenticationResult {
    const userValidation = PollValidator.validateUserId(currentUserId);
    if (!userValidation.isValid) {
      return {
        isAuthorized: false,
        error: 'User not authenticated'
      };
    }

    if (currentUserId !== pollCreatorId) {
      return {
        isAuthorized: false,
        error: 'User not authorized to perform this action'
      };
    }

    return { isAuthorized: true };
  }
}

// Poll operations
class PollOperations {
  private static supabase = SupabaseClientManager.getClient();

  static async deletePoll(pollId: string): Promise<PollOperationResult> {
    try {
      const validation = PollValidator.validatePollId(pollId);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error
        };
      }

      const { error } = await this.supabase
        .from("polls")
        .delete()
        .eq("id", pollId);

      if (error) {
        throw error;
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete poll'
      };
    }
  }
}

// Standardized error responses
class ErrorHandler {
  static getStandardErrorMessage(error: string | undefined): string {
    const errorMessages: Record<string, string> = {
      'Invalid poll ID provided': 'The poll could not be found.',
      'User not authenticated': 'Please log in to perform this action.',
      'User not authorized to perform this action': 'You can only modify polls you created.',
      'Failed to delete poll': 'Unable to delete the poll. Please try again.',
    };

    return errorMessages[error || ''] || 'An unexpected error occurred. Please try again.';
  }
}

export function Poll({
  pollId,
  pollCreatorId,
  currentUserId,
  onPollDeleted,
}: PollActionsProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  // Memoized authentication check
  const authResult = useMemo(() => 
    PollAuthenticator.checkPollOwnership(currentUserId, pollCreatorId),
    [currentUserId, pollCreatorId]
  );

  // Early return if user is not authorized
  if (!authResult.isAuthorized) {
    return null;
  }

  const handleEdit = useCallback(() => {
    const validation = PollValidator.validatePollId(pollId);
    if (!validation.isValid) {
      toast({
        title: "Error",
        description: ErrorHandler.getStandardErrorMessage(validation.error),
        variant: "destructive",
      });
      return;
    }
    router.push(`/polls/${pollId}/edit`);
  }, [pollId, router, toast]);

  const handleDeleteConfirm = useCallback(async () => {
    if (isDeleting) return;

    try {
      setIsDeleting(true);
      
      // Use modularized poll operations
      const result = await PollOperations.deletePoll(pollId);
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      toast({
        title: "Poll deleted",
        description: "Your poll has been successfully deleted.",
      });
      
      // Refresh the polls list or call the callback
      if (onPollDeleted) {
        onPollDeleted();
      } else {
        router.refresh();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete poll';
      toast({
        title: "Error",
        description: ErrorHandler.getStandardErrorMessage(errorMessage),
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  }, [isDeleting, pollId, toast, onPollDeleted, router]);

  return (
    <div className="flex space-x-2">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleEdit}
        className="flex items-center"
      >
        <Edit className="mr-1 h-4 w-4" />
        Edit
      </Button>
      
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button 
            variant="destructive" 
            size="sm" 
            disabled={isDeleting}
            className="flex items-center"
          >
            <Trash className="mr-1 h-4 w-4" />
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your poll
              and remove all associated votes and data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Cancel
            </AlertDialogCancel>
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