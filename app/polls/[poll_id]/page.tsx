/**
 * Individual Poll Voting Page
 * 
 * This page displays a specific poll and allows users to vote on it.
 * Features include:
 * - Poll details display (title, description)
 * - Interactive voting options
 * - Vote submission and validation
 * - Voting status tracking (prevent duplicate votes)
 * - Real-time vote recording
 * 
 * Voting Flow:
 * 1. User navigates to poll via poll ID
 * 2. Poll and options are fetched from database
 * 3. User's voting status is checked
 * 4. User selects an option (if not already voted)
 * 5. Vote is submitted and recorded in database
 * 6. UI updates to reflect voting completion
 * 
 * Database Operations:
 * - Fetches poll data from 'polls' table
 * - Fetches poll options from 'poll_options' table
 * - Checks existing votes in 'votes' table
 * - Records new votes with user and option association
 * 
 * Security:
 * - Prevents duplicate voting per user per poll
 * - Validates user authentication before voting
 * - Uses database constraints to enforce voting rules
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/app/lib/supabase';
import { Poll, PollOption } from '@/app/types/poll';
import { Button } from '@/app/components/ui/button';
import { Header } from '@/app/components/layout/header';
import { useAuth } from '@/app/context/auth-context';

/**
 * Example polls data for development/testing purposes
 * 
 * This static data serves as fallback content when database queries fail
 * during development. Provides sample poll structures for testing the
 * voting interface and user interactions.
 * 
 * @deprecated This should be removed in production builds
 * @todo Replace with proper error handling and loading states
 */
const examplePolls = {
  '1': {
    poll: {
      id: "1",
      title: "What's your favorite programming language?",
      description: "Created by John Doe • 2 days ago",
      options: [], // Options stored separately
      user_id: "user1",
      created_at: new Date(),
      updated_at: new Date(),
      is_active: true,
      total_votes: 0
    },
    options: [
      { id: "1", poll_id: "1", option_text: 'JavaScript', votes: 0, percentage: 0 },
      { id: "2", poll_id: "1", option_text: 'Python', votes: 0, percentage: 0 },
      { id: "3", poll_id: "1", option_text: 'TypeScript', votes: 0, percentage: 0 },
    ],
  },
  '2': {
    poll: {
      id: "2",
      title: "Which framework do you prefer?",
      description: "Created by Jane Smith • 1 week ago",
      options: [], // Options stored separately
      user_id: "user2",
      created_at: new Date(),
      updated_at: new Date(),
      is_active: true,
      total_votes: 0
    },
    options: [
      { id: "4", poll_id: "2", option_text: 'React', votes: 0, percentage: 0 },
      { id: "5", poll_id: "2", option_text: 'Vue', votes: 0, percentage: 0 },
      { id: "6", poll_id: "2", option_text: 'Angular', votes: 0, percentage: 0 },
    ],
  },
  '3': {
    poll: {
      id: "3",
      title: "Best pizza topping?",
      description: "Created by Mike Johnson • 3 days ago",
      options: [], // Options stored separately
      createdBy: "user3", // Note: Inconsistent property name (should be user_id)
      createdAt: new Date(), // Note: Inconsistent property name (should be created_at)
      updatedAt: new Date(), // Note: Inconsistent property name (should be updated_at)
      isActive: true, // Note: Inconsistent property name (should be is_active)
      totalVotes: 0 // Note: Inconsistent property name (should be total_votes)
    },
    options: [
      { id: "7", poll_id: "3", text: 'Pepperoni', votes: 0, percentage: 0 }, // Note: Inconsistent property name (should be option_text)
      { id: "8", poll_id: "3", text: 'Margherita', votes: 0, percentage: 0 }, // Note: Inconsistent property name (should be option_text)
      { id: "9", poll_id: "3", text: 'Hawaiian', votes: 0, percentage: 0 }, // Note: Inconsistent property name (should be option_text)
    ],
  },
};

/**
 * Vote Page Component
 * 
 * Main component for individual poll voting. Handles:
 * - Poll data fetching and display
 * - User voting status tracking
 * - Vote submission and validation
 * - Interactive option selection
 * - Error handling and user feedback
 * 
 * State Management:
 * - poll: Current poll data
 * - options: Available voting options
 * - selectedOption: User's current selection
 * - hasVoted: Whether user has already voted
 * 
 * Authentication:
 * - Requires user login for voting
 * - Tracks votes per user to prevent duplicates
 */
export default function VotePage() {
  // ========================================================================
  // HOOKS AND STATE
  // ========================================================================
  
  /** Extract poll ID from URL parameters */
  const { poll_id } = useParams();
  
  /** Supabase client for database operations */
  const supabase = createSupabaseBrowserClient();
  
  /** Current authenticated user from auth context */
  const { user } = useAuth();

  /** Current poll data (null while loading) */
  const [poll, setPoll] = useState<Poll | null>(null);
  
  /** Array of voting options for the current poll */
  const [options, setOptions] = useState<PollOption[]>([]);
  
  /** ID of the currently selected voting option */
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  
  /** Flag indicating if the current user has already voted on this poll */
  const [hasVoted, setHasVoted] = useState(false);

  // ========================================================================
  // DATA FETCHING EFFECTS
  // ========================================================================
  
  /**
   * Fetch Poll Data Effect
   * 
   * Retrieves poll information from Supabase when component mounts
   * or when poll_id changes. Includes fallback to example data
   * for development/testing purposes.
   * 
   * Dependencies: poll_id, supabase
   */
  useEffect(() => {
    const fetchPoll = async () => {
      if (!poll_id) return;

      try {
        // Query polls table for the specific poll ID
        const { data, error } = await supabase
          .from('polls')
          .select('*')
          .eq('id', poll_id)
          .single();

        if (error) {
          console.error('Error fetching poll:', error);
          // Use example data as fallback for development
          const examplePoll = examplePolls.find(p => p.id === poll_id);
          if (examplePoll) {
            setPoll(examplePoll);
          }
        } else {
          setPoll(data);
        }
      } catch (error) {
        console.error('Error:', error);
        // Use example data as fallback for development
        const examplePoll = examplePolls.find(p => p.id === poll_id);
        if (examplePoll) {
          setPoll(examplePoll);
        }
      }
    };

    fetchPoll();
  }, [poll_id, supabase]);

  /**
   * Fetch Poll Options Effect
   * 
   * Retrieves voting options for the current poll from Supabase.
   * Runs after poll data is fetched or when dependencies change.
   * 
   * Dependencies: poll_id, supabase
   */
  useEffect(() => {
    const fetchOptions = async () => {
      if (!poll_id) return;

      try {
        // Query poll_options table for voting options
        const { data: optionsData, error: optionsError } = await supabase
          .from('poll_options')
          .select('*')
          .eq('poll_id', poll_id);

        if (optionsError) {
          console.error('Error fetching options:', optionsError.message);
        } else {
          setOptions(optionsData || []);
        }
      } catch (error) {
        console.error('Error fetching options:', error);
      }
    };

    fetchOptions();
  }, [poll_id, supabase]);

  /**
   * Check User Voting Status Effect
   * 
   * Determines if the current user has already voted on this poll.
   * Updates hasVoted state and selectedOption if a vote exists.
   * Prevents duplicate voting by checking existing votes table.
   * 
   * Dependencies: user, poll_id, supabase
   */
  useEffect(() => {
    const checkIfVoted = async () => {
      if (!user || !poll_id) return;

      try {
        // Query votes table to check if user has already voted
        const { data, error } = await supabase
          .from('votes')
          .select('option_id')
          .eq('poll_id', poll_id)
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          // PGRST116 = no rows returned (user hasn't voted yet)
          console.error('Error checking vote status:', error);
        } else if (data) {
          // User has already voted, update state accordingly
          setHasVoted(true);
          setSelectedOption(data.option_id);
        }
      } catch (error) {
        console.error('Error checking voting status:', error);
      }
    };

    checkIfVoted();
  }, [user, poll_id, supabase]);

  // ========================================================================
  // EVENT HANDLERS
  // ========================================================================
  
  /**
   * Handle Vote Submission
   * 
   * Processes user vote submission with validation and error handling.
   * Prevents duplicate votes and updates UI state upon successful submission.
   * 
   * Validation:
   * - User must be authenticated
   * - Option must be selected
   * - User must not have already voted
   * 
   * Database Operation:
   * - Inserts vote record into votes table
   * - Links vote to poll, option, and user
   * 
   * Error Handling:
   * - Displays user-friendly error messages
   * - Logs detailed errors for debugging
   */
  const handleVote = async () => {
    // Validation: ensure all required conditions are met
    if (selectedOption === null || !user) {
      alert('Please select an option and make sure you are logged in.');
      return;
    }

    try {
      // Insert vote record into Supabase votes table
      const { error } = await supabase.from('votes').insert({
        poll_id: poll_id,
        option_id: selectedOption,
        user_id: user.id,
      });

      if (error) {
        console.error('Error casting vote:', error.message);
        alert('Error casting vote. You may have already voted.');
      } else {
        // Update local state to reflect successful vote
        setHasVoted(true);
        alert('Thank you for voting!');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error submitting vote. Please try again.');
    }
  };

  // ========================================================================
  // RENDER
  // ========================================================================
  
  if (!poll) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <Header />
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Poll Header */}
          <h1 className="text-3xl font-bold text-gray-900">{poll.title}</h1>
          <p className="mt-2 text-gray-600">{poll.description}</p>

          {/* Voting Options */}
          <div className="mt-8 space-y-4">
            {options.map((option) => (
              <div
                key={option.id}
                className={`p-4 border rounded-md cursor-pointer ${selectedOption === option.id ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
                onClick={() => !hasVoted && setSelectedOption(option.id)} // Only allow selection if user hasn't voted
              >
                {option.option_text}
              </div>
            ))}
          </div>

          {/* Vote Action Section */}
          <div className="mt-8">
            {hasVoted ? (
              // Show confirmation message if user has already voted
              <p className="text-lg font-semibold text-gray-700">You have already voted on this poll.</p>
            ) : (
              // Show vote button if user hasn't voted yet
              <Button onClick={handleVote} className="w-full">
                Vote
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
