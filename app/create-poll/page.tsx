"use client";

import { useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { ProtectedRoute } from "@/app/components/auth/protected-route";

function CreatePollPageContent() {
  const [pollData, setPollData] = useState({
    title: "",
    description: "",
    options: ["", ""],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Creating poll:", pollData);
    // TODO: Implement poll creation logic
  };

  const addOption = () => {
    setPollData(prev => ({
      ...prev,
      options: [...prev.options, ""],
    }));
  };

  const removeOption = (index: number) => {
    if (pollData.options.length > 2) {
      setPollData(prev => ({
        ...prev,
        options: prev.options.filter((_, i) => i !== index),
      }));
    }
  };

  const updateOption = (index: number, value: string) => {
    setPollData(prev => ({
      ...prev,
      options: prev.options.map((option, i) => i === index ? value : option),
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create New Poll</h1>
          <p className="mt-2 text-gray-600">Design your poll and start gathering responses</p>
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
                  onChange={(e) => setPollData(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Input
                  id="description"
                  placeholder="Add some context to your poll..."
                  value={pollData.description}
                  onChange={(e) => setPollData(prev => ({ ...prev, description: e.target.value }))}
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
                <Button type="button" variant="outline" className="flex-1">
                  Preview
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function CreatePollPage() {
  return (
    <ProtectedRoute>
      <CreatePollPageContent />
    </ProtectedRoute>
  );
}
