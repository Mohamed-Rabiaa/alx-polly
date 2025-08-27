import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { ProtectedRoute } from "@/app/components/auth/protected-route";
import Link from "next/link";

function PollsPageContent() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">All Polls</h1>
          <p className="mt-2 text-gray-600">Discover and vote on polls created by the community</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Placeholder Poll Cards */}
          <Card>
            <CardHeader>
              <CardTitle>What's your favorite programming language?</CardTitle>
              <CardDescription>Created by John Doe • 2 days ago</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>JavaScript</span>
                  <span className="font-medium">45%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '45%' }}></div>
                </div>
              </div>
              <div className="mt-4">
                <Button className="w-full">Vote</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Which framework do you prefer?</CardTitle>
              <CardDescription>Created by Jane Smith • 1 week ago</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>React</span>
                  <span className="font-medium">60%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: '60%' }}></div>
                </div>
              </div>
              <div className="mt-4">
                <Button className="w-full">Vote</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Best pizza topping?</CardTitle>
              <CardDescription>Created by Mike Johnson • 3 days ago</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Pepperoni</span>
                  <span className="font-medium">75%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-red-600 h-2 rounded-full" style={{ width: '75%' }}></div>
                </div>
              </div>
              <div className="mt-4">
                <Button className="w-full">Vote</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-4">Ready to create your own poll?</p>
          <Link href="/create-poll">
            <Button size="lg">Create New Poll</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PollsPage() {
  return (
    <ProtectedRoute>
      <PollsPageContent />
    </ProtectedRoute>
  );
}
