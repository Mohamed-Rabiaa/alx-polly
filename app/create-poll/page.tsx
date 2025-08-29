"use client";

import { useState } from "react";
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

function CreatePollPageContent() {
  const [pollData, setPollData] = useState({
    title: "",
    description: "",
    options: ["", ""],
  });
  const [showPreview, setShowPreview] = useState(false);
  const { user } = useAuth();
  const supabase = createSupabaseBrowserClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert("You must be logged in to create a poll.");
      return;
    }

    // 1. Insert the poll
    const { data: poll, error: pollError } = await supabase
      .from("polls")
      .insert({
        title: pollData.title,
        description: pollData.description,
        user_id: user.id,
      })
      .select()
      .single();

    if (pollError) {
      console.error("Error creating poll:", pollError);
      alert(`Error creating poll: ${pollError.message}`);
      return;
    }

    // 2. Insert the poll options
    const { error: optionsError } = await supabase.from("poll_options").insert(
      pollData.options.map((option) => ({
        poll_id: poll.id,
        option_text: option,
      }))
    );

    if (optionsError) {
      console.error("Error creating poll options:", optionsError);
      alert("Error creating poll options. Please try again.");
      return;
    }

    // 3. Reset the form
    setPollData({
      title: "",
      description: "",
      options: ["", ""],
    });

    alert("Poll created successfully!");
  };

  const addOption = () => {
    setPollData((prev) => ({
      ...prev,
      options: [...prev.options, ""],
    }));
  };

  const removeOption = (index: number) => {
    if (pollData.options.length > 2) {
      setPollData((prev) => ({
        ...prev,
        options: prev.options.filter((_, i) => i !== index),
      }));
    }
  };

  const updateOption = (index: number, value: string) => {
    setPollData((prev) => ({
      ...prev,
      options: prev.options.map((option, i) => (i === index ? value : option)),
    }));
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Create New Poll
            </h1>
            <p className="mt-2 text-gray-600">
              Design your poll and start gathering responses
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Poll Details</CardTitle>
              <CardDescription>
                Fill in the details for your new poll
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Poll Title</Label>
                  <Input
                    id="title"
                    placeholder="What's your favorite programming language?"
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
                    placeholder="Add some context to your poll..."
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
                    <div key={index} className="flex space-x-2">
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
                    Create Poll
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowPreview(true)}
                  >
                    Preview
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">{pollData.title}</h2>
            <p className="text-gray-600 mb-6">{pollData.description}</p>
            <div className="space-y-4">
              {pollData.options.map((option, index) => (
                <div key={index} className="border rounded-md p-4">
                  {option}
                </div>
              ))}
            </div>
            <Button
              variant="outline"
              className="w-full mt-6"
              onClick={() => setShowPreview(false)}
            >
              Close Preview
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

export default withAuth(CreatePollPageContent);
