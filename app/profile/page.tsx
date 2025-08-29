'use client';

import { withAuth } from "@/app/components/auth/with-auth";
import { useAuth } from "@/app/context/auth-context";

function ProfilePage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-md rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Your Profile</h1>
          {user && (
            <div>
              <p className="text-lg text-gray-700">
                <span className="font-semibold">Email:</span> {user.email}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default withAuth(ProfilePage);
