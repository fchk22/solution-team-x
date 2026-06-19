// lib/auth.ts
import { supabase } from './supabaseClient';

// Export the supabase client so other files can import it
export { supabase };

// Sign out function
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) console.error('Error signing out:', error.message);
};

// Existing Google sign-in function
export const signInWithGoogle = async (nextPath = '') => {
  const getURL = () => {
    // 1. If we are in the browser, always trust the actual current URL
    if (typeof window !== 'undefined') {
      return window.location.origin; 
    }
    // 2. Only use the environment variable if we are on the server (SSR/API routes)
    return process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  };

  const url = getURL();

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      // Force the redirect to stay on the origin we just calculated
      redirectTo: `${url}${nextPath}`,
    },
  });

  if (error) console.error('Error logging in:', error.message);
};