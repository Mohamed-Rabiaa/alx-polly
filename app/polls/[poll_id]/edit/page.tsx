"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { withAuth } from "@/app/components/auth/with-auth";
import { useAuth } from "@/app/context/auth-context";
import { Header } from "@/app/components/layout/header";
import { createSupabaseBrowserClient } from "@/app/lib/supabase";
import { deleteVotesForOptionSecure, deletePollOptionSecure, checkVotesForOptionSecure, verifyOptionExistsSecure } from "@/app/lib/actions/poll-actions-secure";
import { useToast } from "@/app/components/ui/use-toast";
import { Poll, PollOption } from "@/app/types/poll";

interface EditPollPageProps {
  params: Promise<{
    poll_id: string;
  }>;
}

function EditPollPageContent({ params }: EditPollPageProps) {
  const { poll_id } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const supabase = createSupabaseBrowserClient();

  const [isLoading, setIsLoading] = useState(true);
  const [pollData, setPollData] = useState<{
    title: string;
    description: string;
    options: string[];
  }>({
    title: "",
    description: "",
    options: ["", ""],
  });

  const [pollOptions, setPollOptions] = useState<PollOption[]>([]);

  useEffect(() => {
    const fetchPoll = async () => {
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to edit polls.",
          variant: "destructive",
        });
        router.push("/auth/login");
        return;
      }

      try {
        setIsLoading(true);
        
        // Fetch the poll
        const { data: pollData, error: pollError } = await supabase
          .from("polls")
          .select("*")
          .eq("id", poll_id)
          .single();

        if (pollError || !pollData) {
          throw new Error("Poll not found");
        }

        // Check if the current user is the creator of the poll
        if (pollData.user_id !== user.id) {
          toast({
            title: "Unauthorized",
            description: "You can only edit your own polls.",
            variant: "destructive",
          });
          router.push("/polls");
          return;
        }

        // Fetch poll options
        const { data: optionsData, error: optionsError } = await supabase
          .from("poll_options")
          .select("*")
          .eq("poll_id", poll_id);

        if (optionsError) {
          throw new Error("Failed to fetch poll options");
        }

        setPollOptions(optionsData || []);
        setPollData({
          title: pollData.title,
          description: pollData.description || "",
          options: optionsData ? optionsData.map((option) => option.option_text) : ["", ""],
        });
      } catch (error) {
        console.error("Error fetching poll:", error);
        toast({
          title: "Error",
          description: "Failed to load poll data. Please try again.",
          variant: "destructive",
        });
        router.push("/polls");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPoll();
  }, [poll_id, user, router, supabase, toast]);

  const addOption = () => {
    setPollData((prev) => ({
      ...prev,
      options: [...prev.options, ""],
    }));
  };

  const removeOption = (index: number) => {
    setPollData((prev) => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index),
    }));
  };

  const updateOption = (index: number, value: string) => {
    setPollData((prev) => ({
      ...prev,
      options: prev.options.map((option, i) => (i === index ? value : option)),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to update polls.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Update the poll
      const { error: pollUpdateError } = await supabase
        .from("polls")
        .update({
          title: pollData.title,
          description: pollData.description,
          updated_at: new Date().toISOString(),
        })
        .eq("id", poll_id);

      if (pollUpdateError) {
        console.error("Poll update error:", pollUpdateError);
        throw new Error(`Failed to update poll: ${pollUpdateError.message}`);
      }

      // Handle poll options
      const currentOptionTexts = pollData.options.filter(option => option.trim() !== '');
      const existingOptions = [...pollOptions];
      
      
      
      // Track which existing options to keep
      const optionsToKeep = new Set<string>();
      const optionsToCreate: string[] = [];

      // Match current options with existing ones using exact text matching only
      for (const currentText of currentOptionTexts) {
        // Try to find an exact match
        const matchingOption = existingOptions.find(existing => 
          !optionsToKeep.has(existing.id) && existing.option_text === currentText
        );

        if (matchingOption) {
          // Keep this existing option as it matches exactly
          optionsToKeep.add(matchingOption.id);
        } else {
          // No exact match found, create a new option
          optionsToCreate.push(currentText);
        }
      }

      // Create new options
      for (const optionText of optionsToCreate) {
        const { error } = await supabase.from("poll_options").insert({
          poll_id,
          option_text: optionText,
        });

        if (error) {
          console.error("Error creating option:", error);
          throw new Error(`Failed to create option: ${error.message}`);
        }
      }

      // Delete options that are no longer needed
      const optionsToDelete = existingOptions.filter(option => !optionsToKeep.has(option.id));
      
      if (optionsToDelete.length > 0) {
        for (const option of optionsToDelete) {
          // Check for votes first using secure server action
          const votesResult = await checkVotesForOptionSecure(option.id);
          
          if (!votesResult.success) {
            console.error("Error checking votes for option:", votesResult.error);
            throw new Error(`Failed to check votes: ${votesResult.error}`);
          }
          
          const votesData = votesResult.votes;

          
          // Delete associated votes first if any exist
          if (votesData.length > 0) {
            const deleteVotesResult = await deleteVotesForOptionSecure(option.id);
            
            if (!deleteVotesResult.success) {
              throw new Error(`Failed to delete votes for option: ${deleteVotesResult.error}`);
            }
          }
          
          // Delete the poll option using secure server action
          const deleteResult = await deletePollOptionSecure(option.id);
          
          if (!deleteResult.success) {
            throw new Error(`Failed to delete poll option: ${deleteResult.error}`);
          }
          

        }
      }

      // Refresh the poll data to reflect changes
      const { data: updatedOptionsData, error: refreshError } = await supabase
        .from("poll_options")
        .select("*")
        .eq("poll_id", poll_id);
        
      if (refreshError) {
        console.error("Error refreshing poll options:", refreshError);
      } else {

        setPollOptions(updatedOptionsData || []);
        setPollData(prev => ({
          ...prev,
          options: updatedOptionsData ? updatedOptionsData.map(option => option.option_text) : []
        }));
      }

      toast({
        title: "Poll updated",
        description: "Your poll has been successfully updated.",
      });

      router.push("/polls");
    } catch (error) {
      console.error("Error updating poll:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to update poll. Please try again.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div>
        <Header />
        <div className="min-h-screen bg-gray-50 py-12">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-center">Loading poll data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header />
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Edit Poll</h1>
            <p className="mt-2 text-gray-600">
              Update your poll details and options
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Poll Details</CardTitle>
              <CardDescription>
                Make changes to your poll
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Poll Title</Label>
                  <Input
                    id="title"
                    value={pollData.title}
                    onChange={(e) =>
                      setPollData((prev) => ({ ...prev, title: e.target.value }))
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Input
                    id="description"
                    value={pollData.description}
                    onChange={(e) =>
                      setPollData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="space-y-4">
                  <Label>Poll Options</Label>
                  {pollData.options.map((option, index) => (
                    <div key={`option-${index}-${option}`} className="flex space-x-2">
                      <Input
                        placeholder={`Option ${index + 1}`}
                        value={option}
                        onChange={(e) => updateOption(index, e.target.value)}
                        required
                      />
                      {pollData.options.length > 2 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeOption(index)}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addOption}
                    className="w-full"
                  >
                    Add Option
                  </Button>
                </div>

                <div className="flex space-x-4">
                  <Button type="submit" className="flex-1">
                    Update Poll
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => router.push("/polls")}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default withAuth(EditPollPageContent);