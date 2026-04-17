import { createClient } from '@supabase/supabase-js';
// Updated to the correct export name
import { analyzePdfContent } from './ai-analyst'; 

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * HSBC HK SANDBOX CONFIGURATION
 * Based on your provided URL: https://developer.hsbc.com.hk/sandbox/...
 */
const HSBC_TOKEN_URL = 'https://developer.hsbc.com.hk/sandbox/oauth/token';
const HSBC_API_BASE = 'https://developer.hsbc.com.hk/sandbox/open-banking/v1.0/personal-credit-cards';

async function getHSBCAccessToken() {
  const response = await fetch(HSBC_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: process.env.HSBC_CLIENT_ID!,
      client_secret: process.env.HSBC_CLIENT_SECRET!,
    })
  });

  if (!response.ok) {
    throw new Error(`Auth Failed: ${response.status}`);
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * Note: This sync function was for the Sandbox API. 
 * Since we are now using the PDF Upload Admin page, 
 * this is preserved here just to fix the build error.
 */
export async function syncFromSandbox() {
  console.log("⚠️ Sandbox Sync is currently bypassed in favor of PDF Upload.");
  return { success: true };
}