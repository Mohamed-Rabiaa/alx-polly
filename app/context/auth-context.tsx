"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { createSupabaseBrowserClient } from '@/app/lib/supabase';
import type { User } from '@supabase/supabase-js';

/**
 * Authentication Context for the Polling Application
 * 
 * This module provides a centralized authentication system using Supabase Auth.
 * It manages user session state, authentication status, and provides methods
 * for signing out users across the entire application.
 * 
 * Key Features:
 * - Automatic session restoration on app load
 * - Real-time authentication state synchronization
 * - Centralized sign-out functionality
 * - Type-safe user data access
 */

/** Type alias for user session state - either a User object or null */
type MaybeSession = User | null;

/**
 * Authentication context interface
 * @interface AuthContextType
 * @property {MaybeSession} user - Current authenticated user or null
 * @property {() => void} signOut - Function to sign out the current user
 */
interface AuthContextType {
  user: MaybeSession;
  signOut: () => void;
}

/** 
 * React Context for authentication state management
 * Provides default values for user (null) and signOut (no-op function)
 */
const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  signOut: () => {} 
});

/**
 * Authentication Provider Component
 * 
 * This component wraps the entire application to provide authentication context.
 * It handles the complete authentication lifecycle including:
 * 
 * 1. Initial session restoration when the app loads
 * 2. Real-time authentication state changes (login/logout/token refresh)
 * 3. Centralized sign-out functionality
 * 
 * Authentication Flow:
 * - On mount: Retrieves existing session from Supabase
 * - Subscribes to auth state changes for real-time updates
 * - Provides signOut method that clears both Supabase session and local state
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to wrap with auth context
 * @returns {JSX.Element} Provider component with authentication context
 */
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  // Initialize Supabase client for browser-side authentication
  const supabase = createSupabaseBrowserClient();
  
  // Local state to track current authenticated user
  const [user, setUser] = useState<MaybeSession>(null);

  useEffect(() => {
    /**
     * Retrieves the current session on component mount
     * This ensures users remain logged in across browser sessions
     * if they have a valid session stored in localStorage/cookies
     */
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      // Update local state with user data from session, or null if no session
      setUser(session?.user ?? null);
    };
    
    // Execute initial session check
    getInitialSession();
    
    /**
     * Set up real-time authentication state listener
     * This subscription handles all auth state changes:
     * - SIGNED_IN: User successfully logged in
     * - SIGNED_OUT: User logged out
     * - TOKEN_REFRESHED: Session token was refreshed
     * - USER_UPDATED: User profile was updated
     */
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Update local user state whenever auth state changes
      setUser(session?.user ?? null);
    });

    // Cleanup: Unsubscribe from auth changes when component unmounts
    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  /**
   * Sign out the current user
   * 
   * This function:
   * 1. Calls Supabase auth.signOut() to clear server-side session
   * 2. Updates local state to null to immediately reflect signed-out state
   * 3. Triggers auth state change listeners across the app
   * 
   * @async
   * @function signOut
   * @returns {Promise<void>} Promise that resolves when sign-out is complete
   */
  const signOut = async () => {
    // Clear Supabase session (removes tokens from storage)
    await supabase.auth.signOut();
    // Immediately update local state to reflect signed-out status
    setUser(null);
  };

  // Provide authentication context to all child components
  return (
    <AuthContext.Provider value={{ user, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Custom hook to access authentication context
 * 
 * This hook provides a convenient way to access the current user and authentication
 * methods from any component within the AuthProvider tree.
 * 
 * Usage Example:
 * ```tsx
 * function MyComponent() {
 *   const { user, signOut } = useAuth();
 *   
 *   if (!user) {
 *     return <div>Please log in</div>;
 *   }
 *   
 *   return (
 *     <div>
 *       <p>Welcome, {user.email}!</p>
 *       <button onClick={signOut}>Sign Out</button>
 *     </div>
 *   );
 * }
 * ```
 * 
 * @returns {AuthContextType} Object containing:
 *   - user: Current authenticated user or null
 *   - signOut: Function to sign out the current user
 * 
 * @throws {Error} Throws error if used outside of AuthProvider
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  // Ensure hook is used within AuthProvider
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};