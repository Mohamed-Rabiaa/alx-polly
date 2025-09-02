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
import { Poll } from "@/app/components/poll/poll-";
import { useToast } from "@/app/components/ui/use-toast";

const examplePolls: Poll[] = [
  {
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
  {
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
  {
    id: "3",
    title: "Best pizza topping?",
    description: "Created by Mike Johnson • 3 days ago",
    options: [],
    user_id: "user3",
    created_at: new Date(),
    updated_at: new Date(),
    is_active: true,
    total_votes: 0
  },
];

function PollsPageContent() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const supabase = createSupabaseBrowserClient();
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchPolls = async () => {
    const { data, error } = await supabase.from("polls").select("*");
    if (error) {
      console.error("Error fetching polls:", error);
      toast({
        title: "Error",
        description: "Failed to load polls. Please try again.",
        variant: "destructive",
      });
    } else if (data) {
      setPolls(data);
    }
  };

  useEffect(() => {
    fetchPolls();
  }, [supabase]);


  return (
    <div>
      <Header />
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">All Polls</h1>
            <p className="mt-2 text-gray-600">Discover and vote on polls created by the community</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {polls.map((poll) => (
              <Card key={poll.id} className="hover:border-blue-300 hover:shadow-md transition-all duration-200">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{poll.title}</CardTitle>
                      <CardDescription>{poll.description}</CardDescription>
                    </div>
                    <Poll 
                      pollId={poll.id} 
                      pollCreatorId={poll.user_id} 
                      currentUserId={user?.id} 
                      onPollDeleted={fetchPolls}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <Link href={`/polls/${poll.id}`}>
                    <Button className="w-full">Vote</Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>

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
 