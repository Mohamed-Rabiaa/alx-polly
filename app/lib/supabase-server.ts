
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Creates a Supabase client specifically configured for server-side operations.
 * 
 * This function is essential for server-side data operations as it:
 * 1. Properly handles authentication state through cookies in a Next.js server environment
 * 2. Ensures secure database access without exposing client-side tokens
 * 3. Maintains session persistence across server-side rendered pages
 * 
 * Assumptions:
 * - NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables are set
 * - Running in a Next.js server environment with access to the cookies API
 * 
 * Edge Cases:
 * - If environment variables are missing, will throw TypeError due to null check (!)
 * - Cookie access may fail in environments where cookies API is not available
 * 
 * Related Components:
 * - Works in tandem with client-side Supabase initialization
 * - Used by server-side API routes and Server Components
 * - Integrates with Next.js middleware for auth protection
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )
}
