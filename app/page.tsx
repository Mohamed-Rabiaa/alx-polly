import Link from "next/link";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 sm:text-6xl">
              Create and Vote on Polls
            </h1>
            <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto">
              Pollly is a modern polling platform that makes it easy to create engaging polls, 
              gather opinions, and make data-driven decisions.
            </p>
            <div className="mt-10 flex justify-center space-x-4">
              <Link href="/auth/register">
                <Button size="lg">Get Started</Button>
              </Link>
              <Link href="/polls">
                <Button variant="outline" size="lg">View Polls</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">
              Why Choose Pollly?
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Everything you need to create engaging polls and gather insights
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Easy to Use</CardTitle>
                <CardDescription>
                  Create polls in minutes with our intuitive interface
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  No complex setup required. Just sign up and start creating polls immediately.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Real-time Results</CardTitle>
                <CardDescription>
                  See poll results update in real-time as votes come in
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Watch your polls come to life with live updates and visual charts.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Secure & Private</CardTitle>
                <CardDescription>
                  Your data is protected with enterprise-grade security
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Rest easy knowing your polls and voter data are secure and private.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white">
              Ready to Start Creating Polls?
            </h2>
            <p className="mt-4 text-xl text-blue-100">
              Join thousands of users who trust Pollly for their polling needs
            </p>
            <div className="mt-8">
              <Link href="/auth/register">
                <Button size="lg" variant="secondary">
                  Create Your First Poll
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
