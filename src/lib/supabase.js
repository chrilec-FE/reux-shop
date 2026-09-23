import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Browser/client-side client (respects RLS, used for user auth).
export const supabase = url && key ? createClient(url, key) : null;

export function isSupabaseConfigured() {
  return Boolean(url && key);
}
