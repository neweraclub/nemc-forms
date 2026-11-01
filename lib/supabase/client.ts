import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  'https://klggvkylzvkyhxtpwpxd.supabase.co';

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  'sb_publishable_04KAHht13dTNtP1_p5lXng_prTtbr3y';

export function createBrowserSupabaseClient() {
  return createClient(supabaseUrl, supabaseAnonKey);
}
