/**
 * Poll Management Type Definitions
 * 
 * This file contains all TypeScript interfaces and types related to poll
 * creation, management, voting, and result display throughout the application.
 */

/**
 * Poll Interface
 * 
 * Represents a complete poll entity with all its properties and metadata.
 * This is the main data structure for polls stored in the database and
 * used throughout the application for poll display and management.
 * 
 * Database Mapping:
 * - Maps to the 'polls' table in Supabase
 * - Includes relationships to poll_options and votes tables
 * - Supports soft deletion via is_active flag
 * 
 * Used in:
 * - Poll listing and display components
 * - Poll creation and editing forms
 * - Poll management operations
 * - Voting and results calculation
 */
export interface Poll {
  /** Unique identifier for the poll (UUID from database) */
  id: string;
  
  /** Poll question or title displayed to users */
  title: string;
  
  /** Optional detailed description providing context for the poll */
  description?: string;
  
  /** Array of voting options available for this poll */
  options: PollOption[];
  
  /** ID of the user who created this poll (foreign key to auth.users) */
  user_id: string;
  
  /** Timestamp when the poll was created */
  created_at: Date;
  
  /** Timestamp when the poll was last modified */
  updated_at: Date;
  
  /** Flag indicating if the poll is active and accepting votes */
  is_active: boolean;
  
  /** Cached total number of votes across all options */
  total_votes: number;
}

/**
 * Poll Option Interface
 * 
 * Represents a single voting option within a poll.
 * Contains the option text and optional vote statistics.
 * 
 * Database Mapping:
 * - Maps to the 'poll_options' table in Supabase
 * - Related to polls table via poll_id foreign key
 * - Vote counts calculated from votes table
 * 
 * Used in:
 * - Poll creation and editing forms
 * - Voting interface components
 * - Results display and visualization
 */
export interface PollOption {
  /** Unique identifier for the poll option (UUID from database) */
  id: string;
  
  /** Text content of the voting option displayed to users */
  option_text: string;
  
  /** Number of votes this option has received (calculated field) */
  votes?: number;
  
  /** Percentage of total votes this option represents (calculated field) */
  percentage?: number;
}

/**
 * Create Poll Data Interface
 * 
 * Defines the structure for poll creation form data.
 * Used when users create new polls through the creation form.
 * 
 * Form Flow:
 * 1. User fills out poll creation form
 * 2. Form data is validated against this interface
 * 3. Data is transformed and sent to server action
 * 4. Server action creates poll and options in database
 * 
 * Validation:
 * - title: Required, non-empty string
 * - description: Optional context information
 * - options: Array of at least 2 option strings
 */
export interface CreatePollData {
  /** Poll question or title (required) */
  title: string;
  
  /** Optional description providing additional context */
  description?: string;
  
  /** Array of option texts (minimum 2 required) */
  options: string[];
}

/**
 * Vote Data Interface
 * 
 * Defines the structure for vote submission data.
 * Used when users cast votes on poll options.
 * 
 * Voting Flow:
 * 1. User selects an option on a poll
 * 2. Vote data is created with poll and option IDs
 * 3. Data is sent to voting server action
 * 4. Server action validates and records the vote
 * 5. Poll statistics are updated
 * 
 * Constraints:
 * - One vote per user per poll (enforced by database)
 * - Both IDs must reference existing entities
 */
export interface VoteData {
  /** ID of the poll being voted on */
  pollId: string;
  
  /** ID of the selected poll option */
  optionId: string;
}

/**
 * Poll Result Interface
 * 
 * Represents a poll with voting results and user-specific voting status.
 * Used for displaying polls with results and indicating if the current
 * user has already voted.
 * 
 * Result Calculation:
 * - poll: Complete poll data with calculated vote statistics
 * - userVote: ID of option the current user voted for (if any)
 * - hasVoted: Boolean flag for quick voting status check
 * 
 * Used in:
 * - Poll results display pages
 * - Voting interface (to show if user already voted)
 * - Poll statistics and analytics
 */
export interface PollResult {
  /** Complete poll data with vote statistics */
  poll: Poll;
  
  /** ID of the option the current user voted for (if voted) */
  userVote?: string;
  
  /** Flag indicating if the current user has voted on this poll */
  hasVoted: boolean;
}
