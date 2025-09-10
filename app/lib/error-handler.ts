/**
 * Centralized Error Handling Utility
 * 
 * This module provides standardized error handling patterns across the application,
 * ensuring consistent user experience and proper error logging.
 */

import { toast } from "@/app/components/ui/use-toast";

// ============================================================================
// ERROR TYPES AND INTERFACES
// ============================================================================

/**
 * Standard error categories for consistent handling
 */
export enum ErrorCategory {
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  VALIDATION = 'validation',
  DATABASE = 'database',
  NETWORK = 'network',
  UNKNOWN = 'unknown'
}

/**
 * Standard error response structure
 */
export interface StandardError {
  category: ErrorCategory;
  message: string;
  technicalMessage?: string;
  code?: string;
  statusCode?: number;
}

/**
 * Error handling options
 */
export interface ErrorHandlingOptions {
  showToast?: boolean;
  logError?: boolean;
  fallbackMessage?: string;
  variant?: 'default' | 'destructive';
}

// ============================================================================
// ERROR MESSAGE MAPPINGS
// ============================================================================

/**
 * Maps technical error messages to user-friendly messages
 */
const ERROR_MESSAGES: Record<string, StandardError> = {
  // Authentication errors
  'Authentication required': {
    category: ErrorCategory.AUTHENTICATION,
    message: 'Please log in to continue.',
    statusCode: 401
  },
  'Invalid credentials': {
    category: ErrorCategory.AUTHENTICATION,
    message: 'Invalid email or password. Please try again.',
    statusCode: 401
  },
  'User not authenticated': {
    category: ErrorCategory.AUTHENTICATION,
    message: 'Please log in to perform this action.',
    statusCode: 401
  },
  
  // Authorization errors
  'Unauthorized access': {
    category: ErrorCategory.AUTHORIZATION,
    message: 'You do not have permission to perform this action.',
    statusCode: 403
  },
  'User not authorized to perform this action': {
    category: ErrorCategory.AUTHORIZATION,
    message: 'You can only modify content you created.',
    statusCode: 403
  },
  'You can only access votes from your own polls': {
    category: ErrorCategory.AUTHORIZATION,
    message: 'You can only view votes from polls you created.',
    statusCode: 403
  },
  
  // Validation errors
  'Invalid poll ID provided': {
    category: ErrorCategory.VALIDATION,
    message: 'The poll could not be found.',
    statusCode: 400
  },
  'Poll title is required': {
    category: ErrorCategory.VALIDATION,
    message: 'Please enter a title for your poll.',
    statusCode: 400
  },
  'At least 2 options are required': {
    category: ErrorCategory.VALIDATION,
    message: 'Please provide at least 2 options for your poll.',
    statusCode: 400
  },
  
  // Database errors
  'Failed to create poll': {
    category: ErrorCategory.DATABASE,
    message: 'Unable to create poll. Please try again.',
    statusCode: 500
  },
  'Failed to update poll': {
    category: ErrorCategory.DATABASE,
    message: 'Unable to update poll. Please try again.',
    statusCode: 500
  },
  'Failed to delete poll': {
    category: ErrorCategory.DATABASE,
    message: 'Unable to delete poll. Please try again.',
    statusCode: 500
  },
  'Failed to load polls': {
    category: ErrorCategory.DATABASE,
    message: 'Unable to load polls. Please refresh the page.',
    statusCode: 500
  },
  'Failed to cast vote': {
    category: ErrorCategory.DATABASE,
    message: 'Unable to record your vote. Please try again.',
    statusCode: 500
  },
  
  // Network errors
  'Network error': {
    category: ErrorCategory.NETWORK,
    message: 'Connection error. Please check your internet connection.',
    statusCode: 0
  },
  'Request timeout': {
    category: ErrorCategory.NETWORK,
    message: 'Request timed out. Please try again.',
    statusCode: 408
  }
};

// ============================================================================
// ERROR HANDLER CLASS
// ============================================================================

/**
 * Centralized error handling utility
 */
export class ErrorHandler {
  /**
   * Processes and standardizes error messages
   * 
   * @param error - The error to process (string, Error object, or unknown)
   * @param fallbackMessage - Optional fallback message
   * @returns Standardized error object
   */
  static processError(error: unknown, fallbackMessage?: string): StandardError {
    let errorMessage: string;
    let technicalMessage: string | undefined;
    
    // Extract error message from different error types
    if (typeof error === 'string') {
      errorMessage = error;
    } else if (error instanceof Error) {
      errorMessage = error.message;
      technicalMessage = error.stack;
    } else if (error && typeof error === 'object' && 'message' in error) {
      errorMessage = String((error as any).message);
    } else {
      errorMessage = 'Unknown error';
    }
    
    // Look up standardized error or create generic one
    const standardError = ERROR_MESSAGES[errorMessage];
    
    if (standardError) {
      return {
        ...standardError,
        technicalMessage
      };
    }
    
    // Return generic error with fallback message
    return {
      category: ErrorCategory.UNKNOWN,
      message: fallbackMessage || 'An unexpected error occurred. Please try again.',
      technicalMessage: errorMessage,
      statusCode: 500
    };
  }
  
  /**
   * Handles errors with consistent logging and user feedback
   * 
   * @param error - The error to handle
   * @param options - Error handling options
   * @returns Standardized error object
   */
  static handleError(
    error: unknown, 
    options: ErrorHandlingOptions = {}
  ): StandardError {
    const {
      showToast = true,
      logError = true,
      fallbackMessage,
      variant = 'destructive'
    } = options;
    
    const standardError = this.processError(error, fallbackMessage);
    
    // Log error for debugging (in development/server-side)
    if (logError) {
      console.error('Error handled by ErrorHandler:', {
        category: standardError.category,
        message: standardError.message,
        technicalMessage: standardError.technicalMessage,
        statusCode: standardError.statusCode
      });
    }
    
    // Show toast notification to user
    if (showToast && typeof window !== 'undefined') {
      toast({
        variant,
        title: this.getCategoryTitle(standardError.category),
        description: standardError.message
      });
    }
    
    return standardError;
  }
  
  /**
   * Gets appropriate title for error category
   * 
   * @param category - Error category
   * @returns Title string
   */
  private static getCategoryTitle(category: ErrorCategory): string {
    const titles: Record<ErrorCategory, string> = {
      [ErrorCategory.AUTHENTICATION]: 'Authentication Error',
      [ErrorCategory.AUTHORIZATION]: 'Access Denied',
      [ErrorCategory.VALIDATION]: 'Validation Error',
      [ErrorCategory.DATABASE]: 'Database Error',
      [ErrorCategory.NETWORK]: 'Connection Error',
      [ErrorCategory.UNKNOWN]: 'Error'
    };
    
    return titles[category];
  }
  
  /**
   * Creates a standardized API error response
   * 
   * @param error - The error to process
   * @param fallbackMessage - Optional fallback message
   * @returns API error response object
   */
  static createApiErrorResponse(error: unknown, fallbackMessage?: string) {
    const standardError = this.processError(error, fallbackMessage);
    
    return {
      success: false,
      error: standardError.message,
      category: standardError.category,
      statusCode: standardError.statusCode || 500
    };
  }
  
  /**
   * Validates if an error should be retried
   * 
   * @param error - The error to check
   * @returns Whether the operation should be retried
   */
  static shouldRetry(error: StandardError): boolean {
    // Don't retry authentication, authorization, or validation errors
    const nonRetryableCategories = [
      ErrorCategory.AUTHENTICATION,
      ErrorCategory.AUTHORIZATION,
      ErrorCategory.VALIDATION
    ];
    
    return !nonRetryableCategories.includes(error.category);
  }
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Quick error handling for common scenarios
 */
export const handleAuthError = (error: unknown) => 
  ErrorHandler.handleError(error, { fallbackMessage: 'Authentication failed' });

export const handleDatabaseError = (error: unknown) => 
  ErrorHandler.handleError(error, { fallbackMessage: 'Database operation failed' });

export const handleValidationError = (error: unknown) => 
  ErrorHandler.handleError(error, { fallbackMessage: 'Invalid input provided' });

export const handleNetworkError = (error: unknown) => 
  ErrorHandler.handleError(error, { fallbackMessage: 'Network request failed' });

/**
 * Silent error handling (no toast, only logging)
 */
export const logError = (error: unknown, context?: string) => {
  const standardError = ErrorHandler.processError(error);
  console.error(`Error in ${context || 'unknown context'}:`, {
    category: standardError.category,
    message: standardError.message,
    technicalMessage: standardError.technicalMessage
  });
  return standardError;
};