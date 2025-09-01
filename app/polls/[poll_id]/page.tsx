'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/app/lib/supabase';
import { Poll, PollOption } from '@/app/types/poll';
import { Button } from '@/app/components/ui/button';
import { Header } from '@/app/components/layout/header';
import { useAuth } from '@/app/context/auth-context';

const examplePolls = {
  '1': {
    poll: {
      id: "1",
      title: "What's your favorite programming language?",
      description: "Created by John Doe • 2 days ago",
      options: [],
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
      options: [],
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
      options: [],
      createdBy: "user3",
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      totalVotes: 0
    },
    options: [
      { id: "7", poll_id: "3", text: 'Pepperoni', votes: 0, percentage: 0 },
      { id: "8", poll_id: "3", text: 'Margherita', votes: 0, percentage: 0 },
      { id: "9", poll_id: "3", text: 'Hawaiian', votes: 0, percentage: 0 },
    ],
  },
};

export default function VotePage() {
  const { poll_id } = useParams();
  const supabase = createSupabaseBrowserClient();
  const { user } = useAuth();

  const [poll, setPoll] = useState<Poll | null>(null);
  const [options, setOptions] = useState<PollOption[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);

  useEffect(() => {
    const fetchPoll = async () => {
      const { data: pollData, error: pollError } = await supabase
        .from('polls')
        .select('*')
        .eq('id', poll_id)
        .single();

      if (pollError) {
        console.error('Error fetching poll:', pollError.message);
        // @ts-ignore
        if (examplePolls[poll_id]) {
          // @ts-ignore
          setPoll(examplePolls[poll_id].poll);
          // @ts-ignore
          setOptions(examplePolls[poll_id].options);
        }
        return;
      }

      setPoll(pollData);

      const { data: optionsData, error: optionsError } = await supabase
        .from('poll_options')
        .select('*')
        .eq('poll_id', poll_id);

      if (optionsError) {
        console.error('Error fetching poll options:', optionsError.message);
        return;
      }

      setOptions(optionsData);
    };

    if (poll_id) {
      fetchPoll();
    }
  }, [poll_id, supabase]);

  useEffect(() => {
    const checkIfVoted = async () => {
      if (user && poll_id) {
        const { data, error } = await supabase
          .from('votes')
          .select('*')
          .eq('poll_id', poll_id)
          .eq('user_id', user.id)
          .single();

        if (data) {
          setHasVoted(true);
          setSelectedOption(data.option_id);
        }
      }
    };

    checkIfVoted();
  }, [user, poll_id, supabase]);

  const handleVote = async () => {
    if (selectedOption === null || !user) {
      alert('Please select an option and make sure you are logged in.');
      return;
    }

    const { error } = await supabase.from('votes').insert({
      poll_id: poll_id,
      option_id: selectedOption,
      user_id: user.id,
    });

    if (error) {
      console.error('Error casting vote:', error.message);
      alert('Error casting vote. You may have already voted.');
    } else {
      setHasVoted(true);
      alert('Thank you for voting!');
    }
  };

  if (!poll) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <Header />
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">{poll.title}</h1>
          <p className="mt-2 text-gray-600">{poll.description}</p>

          <div className="mt-8 space-y-4">
            {options.map((option) => (
              <div
                key={option.id}
                className={`p-4 border rounded-md cursor-pointer ${selectedOption === option.id ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
                onClick={() => !hasVoted && setSelectedOption(option.id)}
              >
                {option.option_text}
              </div>
            ))}
          </div>

          <div className="mt-8">
            {hasVoted ? (
              <p className="text-lg font-semibold text-gray-700">You have already voted on this poll.</p>
            ) : (
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
