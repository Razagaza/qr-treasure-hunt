import { createClient } from '@supabase/supabase-js';

// Safe initialization: If env vars are missing (e.g. during build or file-db mode), 
// we return a dummy client to prevent crash. The adapter logic will ensure it's not used.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseEnabled = !!supabaseUrl && !!supabaseAnonKey;

export const supabase = isSupabaseEnabled
    ? createClient(supabaseUrl!, supabaseAnonKey!)
    : ({} as any);
