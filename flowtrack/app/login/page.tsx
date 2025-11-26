'use client';

import SignInInline from '@/components/auth/SignInInline';

export default function LoginPage() {
  return (
    <div className="space-y-6 max-w-md mx-auto mt-12">
      <h1 className="text-xl font-semibold dark:text-gray-200">Sign In</h1>
      <p className="text-sm text-gray-600 dark:text-gray-300">Use your email and password to sign in or create an account.</p>
      <SignInInline />
    </div>
  );
}
