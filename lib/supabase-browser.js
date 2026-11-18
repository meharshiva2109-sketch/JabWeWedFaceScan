import { createClient } from '@supabase/supabase-js';

// Browser client with the PUBLISHABLE key. It has no table/storage read access
// (RLS has no anon policies); it is only used to PUT files to server-issued
// signed upload URLs from the admin dashboard.
let client = null;
export function getSupabaseBrowser() {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Missing Supabase browser environment variables.');
  client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return client;
}
