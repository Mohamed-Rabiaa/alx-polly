/**
 * Authentication Type Definitions
 * 
 * This file contains all TypeScript interfaces and types related to user
 * authentication, user management, and auth state management throughout
 * the application.
 */

/**
 * User Interface
 * 
 * Represents a registered user in the application with their core profile data.
 * This interface defines the structure of user objects returned from Supabase
 * and used throughout the application for user identification and display.
 * 
 * Used in:
 * - AuthContext for storing current user state
 * - Poll ownership verification
 * - User profile display
 * - Database queries and mutations
 */
export interface User {
  /** Unique identifier for the user (UUID from Supabase Auth) */
  id: string;
  
  /** User's email address (used for authentication) */
  email: string;
  
  /** User's display name (stored in auth metadata) */
  name: string;
  
  /** Timestamp when the user account was created */
  createdAt: Date;
  
  /** Timestamp when the user account was last updated */
  updatedAt: Date;
}

/**
 * Authentication State Interface
 * 
 * Represents the current authentication state of the application.
 * Used by AuthContext to manage and provide authentication status
 * to components throughout the app.
 * 
 * State Flow:
 * - isLoading: true during initial session restoration
 * - user: null when not authenticated, User object when authenticated
 * - isAuthenticated: derived from user presence for convenience
 */
export interface AuthState {
  /** Current authenticated user or null if not authenticated */
  user: User | null;
  
  /** Boolean flag indicating if user is currently authenticated */
  isAuthenticated: boolean;
  
  /** Loading state during authentication operations */
  isLoading: boolean;
}

/**
 * Login Credentials Interface
 * 
 * Defines the structure for user login form data.
 * Used by LoginForm component and login authentication flow.
 * 
 * Validation:
 * - email: Must be valid email format (HTML5 validation)
 * - password: Required field (validated by Supabase)
 */
export interface LoginCredentials {
  /** User's email address for authentication */
  email: string;
  
  /** User's password for authentication */
  password: string;
}

/**
 * Registration Credentials Interface
 * 
 * Defines the structure for user registration form data.
 * Used by RegisterForm component and registration authentication flow.
 * 
 * Validation:
 * - name: Required display name for the user
 * - email: Must be valid email format
 * - password: Must meet Supabase password requirements
 * - confirmPassword: Must match password (validated in form)
 */
export interface RegisterCredentials {
  /** User's chosen display name */
  name: string;
  
  /** User's email address for account creation */
  email: string;
  
  /** User's chosen password */
  password: string;
  
  /** Password confirmation for validation */
  confirmPassword: string;
}

/**
 * Authentication Response Interface
 * 
 * Defines the structure of successful authentication responses.
 * Used for typing authentication API responses and ensuring
 * consistent data structure across authentication operations.
 * 
 * Note: In practice, Supabase handles token management automatically,
 * but this interface provides type safety for auth responses.
 */
export interface AuthResponse {
  /** Authenticated user data */
  user: User;
  
  /** Authentication token (managed by Supabase) */
  token: string;
}
