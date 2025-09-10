/**
 * API Response Type Definitions
 * 
 * This file contains TypeScript interfaces for all API responses,
 * ensuring type safety across client-server communication.
 */

/**
 * Standard API Response Structure
 * 
 * Base interface for all API responses providing consistent
 * success/error handling patterns.
 */
export interface ApiResponse<T = unknown> {
  /** Indicates if the operation was successful */
  success: boolean;
  /** Error message if operation failed */
  error?: string;
  /** Response data if operation succeeded */
  data?: T;
}

/**
 * Database Poll Option with Nested Poll Data
 * 
 * Represents a poll option as returned from database queries
 * with nested poll information for ownership verification.
 */
export interface PollOptionWithPoll {
  /** Unique identifier for the poll option */
  id: string;
  /** The text content of the option */
  option_text: string;
  /** ID of the poll this option belongs to */
  poll_id: string;
  /** Nested poll data for ownership verification */
  polls: {
    /** Poll ID */
    id: string;
    /** ID of the user who created the poll */
    user_id: string;
  };
}

/**
 * Vote Record from Database
 * 
 * Represents a vote record as stored in the database.
 */
export interface VoteRecord {
  /** Unique identifier for the vote */
  id: string;
  /** ID of the poll being voted on */
  poll_id: string;
  /** ID of the selected option */
  option_id: string;
  /** ID of the user who cast the vote */
  user_id: string;
  /** Timestamp when the vote was cast */
  created_at: string;
}

// Server Action Response Types
export interface ServerActionResponse<T = unknown> {
  success: boolean;
  error?: string;
  data?: T;
}

export interface DeleteVotesResponse extends ServerActionResponse<VoteRecord[]> {
  deletedVotes?: VoteRecord[];
}

export interface DeleteOptionResponse extends ServerActionResponse<PollOptionWithPoll> {
  deletedOption?: PollOptionWithPoll;
}

export interface VoteCheckResponse extends ServerActionResponse<VoteRecord[]> {
  votes?: VoteRecord[];
}

export interface OptionExistsResponse extends ServerActionResponse<PollOptionWithPoll> {
  option?: PollOptionWithPoll | null;
  exists?: boolean;
}

/**
 * Option Verification Response
 * 
 * Response structure for option existence and ownership verification.
 */
export interface OptionVerificationResponse extends ApiResponse {
  /** Whether the option exists and user has access */
  exists: boolean;
  /** Option data if exists and accessible */
  option?: PollOptionWithPoll | null;
}

/**
 * Votes Query Response
 * 
 * Response structure for retrieving votes for a specific option.
 */
export interface VotesQueryResponse extends ApiResponse {
  /** Array of vote records */
  votes: VoteRecord[];
}

/**
 * Delete Operation Response
 * 
 * Response structure for delete operations (votes, options, etc.).
 */
export interface DeleteResponse<T = unknown> extends ApiResponse {
  /** Data of deleted records */
  deletedVotes?: T[];
  /** Data of deleted option */
  deletedOption?: T[];
}



/**
 * Authentication Error Response
 * 
 * Standardized error response for authentication failures.
 */
export interface AuthErrorResponse extends ApiResponse {
  success: false;
  error: 'Authentication required' | 'Unauthorized access' | 'Invalid credentials';
}

/**
 * Validation Error Response
 * 
 * Response structure for input validation errors.
 */
export interface ValidationErrorResponse extends ApiResponse {
  success: false;
  error: string;
  /** Field-specific validation errors */
  fieldErrors?: Record<string, string[]>;
}