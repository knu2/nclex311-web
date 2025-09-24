'use client';

import React, { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import LoginForm from '@/components/LoginForm';
import RegistrationForm from '@/components/RegistrationForm';

export default function AuthDemoPage() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (session?.user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="w-full max-w-md space-y-6 rounded-lg bg-white p-8 shadow-md">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">Welcome!</h1>
            <p className="mt-2 text-gray-600">
              You are successfully logged in.
            </p>
          </div>

          <div className="space-y-4">
            <div className="rounded-lg bg-green-50 p-4">
              <h3 className="font-medium text-green-800">User Information</h3>
              <p className="mt-1 text-sm text-green-700">
                Email: {session.user.email}
              </p>
              {session.user.name && (
                <p className="text-sm text-green-700">
                  Name: {session.user.name}
                </p>
              )}
            </div>

            <button
              onClick={() => signOut()}
              className="w-full rounded-md bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-6 rounded-lg bg-white p-8 shadow-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">NCLEX 311</h1>
          <p className="mt-2 text-gray-600">
            Sign in to your account or create a new one
          </p>
        </div>

        {/* Tab Navigation */}
        <div role="tablist" className="flex rounded-lg bg-gray-100 p-1">
          <button
            role="tab"
            aria-selected={activeTab === 'login'}
            onClick={() => setActiveTab('login')}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === 'login'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Sign In
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'register'}
            onClick={() => setActiveTab('register')}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === 'register'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Form Content */}
        <div className="mt-6">
          {activeTab === 'login' ? (
            <LoginForm
              onSuccess={() => {
                // The session will update automatically
                console.log('Login successful');
              }}
            />
          ) : (
            <RegistrationForm
              onSuccess={user => {
                console.log('Registration successful:', user);
                // After successful registration, switch to login
                setActiveTab('login');
                alert(`Account created for ${user.email}! Please sign in.`);
              }}
            />
          )}
        </div>

        {/* Demo Info */}
        <div className="mt-8 rounded-lg bg-blue-50 p-4">
          <h3 className="text-sm font-medium text-blue-800">
            Authentication Demo
          </h3>
          <p className="mt-1 text-xs text-blue-700">
            This demonstrates the complete user authentication system with
            registration, login, and session management.
          </p>
          <div className="mt-2 text-xs text-blue-600">
            <p>• Passwords are hashed with bcrypt</p>
            <p>• Email uniqueness enforced</p>
            <p>• NextAuth JWT session management</p>
          </div>
        </div>
      </div>
    </div>
  );
}
