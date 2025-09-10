/**
 * Polls Listing Page
 * 
 * This page displays all available polls in a grid layout, allowing users to:
 * - Browse all polls created by the community
 * - Navigate to individual polls for voting
 * - Manage their own polls (edit/delete)
 * - Create new polls
 * 
 * Features:
 * - Real-time poll data fetching from Supabase
 * - Responsive grid layout (1-3 columns based on screen size)
 * - Poll management actions for poll owners
 * - Error handling with toast notifications
 * - Authentication protection via withAuth HOC
 * - Loading states and user feedback
 * 
 * Database Operations:
 * - Fetches all polls from 'polls' table
 * - Respects RLS policies for data access
 * - Supports real-time updates when polls are deleted
 * 
 * Security:
 * - Protected by authentication wrapper
 * - Poll management restricted to poll owners
 * - Secure database queries through Supabase RLS
 */

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import Link from "next/link";
import { withAuth } from "@/app/components/auth/with-auth";
import { Header } from "@/app/components/layout/header";
import { createSupabaseBrowserClient } from "@/app/lib/supabase";
import { Poll } from "@/app/types/poll";
import { useAuth } from "@/app/context/auth-context";
import { Poll as PollComponent } from "@/app/components/poll/poll-actions";
import { useToast } from "@/app/components/ui/use-toast";
import { ErrorHandler } from "@/app/lib/error-handler";

/**
 * Example polls data for development/testing purposes
 * 
 * This static data serves as fallback content during development
 * and provides examples of the expected poll data structure.
 * In production, this data is replaced by real polls from the database.
 * 
 * @deprecated This should be removed in production builds
 */
const examplePolls: Poll[] = [
  {
    id: "1",
    title: "What's your favorite programming language?",
    description: "Created by John Doe • 2 days ago",
    options: [], // Options loaded separately in individual poll views
    user_id: "user1",
    created_at: new Date(),
    updated_at: new Date(),
    is_active: true,
    total_votes: 0
  },
  {
    id: "2",
    title: "Which framework do you prefer?",
    description: "Created by Jane Smith • 1 week ago",
    options: [], // Options loaded separately in individual poll views
    user_id: "user2",
    created_at: new Date(),
    updated_at: new Date(),
    is_active: true,
    total_votes: 0
  },
  {
    id: "3",
    title: "Best pizza topping?",
    description: "Created by Mike Johnson • 3 days ago",
    options: [], // Options loaded separately in individual poll views
    user_id: "user3",
    created_at: new Date(),
    updated_at: new Date(),
    is_active: true,
    total_votes: 0
  },
];

/**
 * Polls Page Content Component
 * 
 * Main component for displaying the polls listing page. Handles:
 * - Fetching polls from Supabase database
 * - Rendering polls in a responsive grid layout
 * - Managing poll actions (edit/delete for owners)
 * - Error handling and user feedback
 * - Navigation to individual polls and poll creation
 * 
 * State Management:
 * - polls: Array of poll objects from database
 * - Loading and error states handled through toast notifications
 * 
 * Authentication:
 * - Requires user authentication (enforced by withAuth wrapper)
 * - Poll management actions restricted to poll owners
 */
function PollsPageContent() {
  // ========================================================================
  // STATE AND HOOKS
  // ========================================================================
  
  /** Array of polls fetched from the database */
  const [polls, setPolls] = useState<Poll[]>([]);
  
  /** Supabase client for database operations */
  const supabase = createSupabaseBrowserClient();
  
  /** Current authenticated user from auth context */
  const { user } = useAuth();
  
  /** Toast notification hook for user feedback */
  const { toast } = useToast();

  // ========================================================================
  // DATA FETCHING
  // ========================================================================
  
  /**
   * Fetches all polls from the database
   * 
   * Retrieves all poll records from the 'polls' table using Supabase.
   * Handles errors gracefully with user-friendly toast notifications.
   * Updates the polls state with fetched data on success.
   * 
   * Database Query:
   * - Selects all columns from 'polls' table
   * - Respects RLS policies for data access
   * - Does not include poll options (loaded separately in individual views)
   * 
   * Error Handling:
   * - Logs errors to console for debugging
   * - Shows user-friendly error messages via toast
   * - Maintains existing polls state on error
   */
  const fetchPolls = async () => {
    const { data, error } = await supabase.from("polls").select("*");
    
    if (error) {
      ErrorHandler.handleError(error, {
        fallbackMessage: 'Failed to load polls'
      });
    } else if (data) {
      // Update polls state with fetched data
      setPolls(data);
    }
  };

  // ========================================================================
  // EFFECTS
  // ========================================================================
  
  /**
   * Initial data loading effect
   * 
   * Fetches polls when the component mounts or when the Supabase client changes.
   * This ensures fresh data is loaded when the user navigates to this page.
   * 
   * Dependencies:
   * - supabase: Triggers refetch if client instance changes
   */
  useEffect(() => {
    fetchPolls();
  }, [supabase]);


  // ========================================================================
  // RENDER
  // ========================================================================
  
  return (
    <div>
      {/* Navigation header */}
      <Header />
      
      {/* Main content area */}
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Page header with title and description */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">All Polls</h1>
            <p className="mt-2 text-gray-600">Discover and vote on polls created by the community</p>
          </div>

          {/* Responsive polls grid (1-3 columns based on screen size) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {polls.map((poll) => (
              <Card key={poll.id} className="hover:border-blue-300 hover:shadow-md transition-all duration-200">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    {/* Poll title and description */}
                    <div>
                      <CardTitle>{poll.title}</CardTitle>
                      <CardDescription>{poll.description}</CardDescription>
                    </div>
                    
                    {/* Poll management actions (edit/delete for owners) */}
                    <PollComponent 
                      pollId={poll.id} 
                      pollCreatorId={poll.user_id} 
                      currentUserId={user?.id} 
                      onPollDeleted={fetchPolls} // Refresh polls after deletion
                    />
                  </div>
                </CardHeader>
                
                {/* Vote button - navigates to individual poll page */}
                <CardContent>
                  <Link href={`/polls/${poll.id}`}>
                    <Button className="w-full">Vote</Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Call-to-action section for creating new polls */}
          <div className="mt-12 text-center">
            <p className="text-gray-600 mb-4">Ready to create your own poll?</p>
            <Link href="/create-poll">
              <Button size="lg">Create New Poll</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default withAuth(PollsPageContent);
 