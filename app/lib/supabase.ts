import { createBrowserClient } from '@supabase/ssr'

/**
 * Creates a Supabase client instance specifically for browser-side operations.
 * 
 * This function is essential for client-side data operations in our Next.js app,
 * creating a connection to our Supabase backend that runs in the browser context.
 * It's separate from any server-side Supabase client to maintain proper security
 * boundaries and handle client-specific authentication flows.
 * 
 * Key aspects:
 * - Uses environment variables for configuration that must be prefixed with NEXT_PUBLIC_
 * - Returns a browser-optimized client with automatic token refresh
 * - Handles real-time subscriptions and client-side caching
 * 
 * Assumptions:
 * - Environment variables NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set
 * - Running in a browser environment (will throw if used server-side)
 * 
 * @returns A configured Supabase client instance for browser usage
 * @throws Will throw if environment variables are missing
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}