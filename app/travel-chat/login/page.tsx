'use client';

// 1. Import your standardized helper from lib/auth.ts
import { signInWithGoogle } from '@/lib/auth';

export default function LoginPage() {
  // 2. Use the helper function directly
  // It already handles the redirectTo path correctly
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-2xl font-bold mb-6">Welcome to Travel Chat</h1>
      <button 
        onClick={() => signInWithGoogle('/travel-chat/create-trip')}
        className="px-6 py-3 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 flex items-center gap-2"
      >
        <img src="https://developers.google.com/identity/images/g-logo.png" alt="Google" className="w-5 h-5" />
        Sign in with Google
      </button>
    </div>
  );
}