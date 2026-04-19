import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// lib/auth.ts

export const signInWithGoogle = async () => {
  // This detects if you are on localhost or the live domain automatically
  const getURL = () => {
    let url =
      process?.env?.NEXT_PUBLIC_SITE_URL ?? // Set this in your .env for production
      process?.env?.NEXT_PUBLIC_VERCEL_URL ?? // Automatically set by Vercel
      window.location.origin; // Fallback to current browser origin
    
    // Ensure the URL ends without a slash for consistency
    url = url.charAt(url.length - 1) === '/' ? url.slice(0, -1) : url;
    return url;
  };

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      // This is the key change: 
      // It tells Google: "Once done, send them back to exactly where they came from."
      redirectTo: getURL(),
    },
  });

  if (error) console.error('Error logging in:', error.message);
};

// ADD THIS EXPORT
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) console.error('Error signing out:', error.message);
};