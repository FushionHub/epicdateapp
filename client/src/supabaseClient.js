import { createClient } from '@supabase/supabase-js'

// TODO: Add your own Supabase URL and anon key below
// You can find these in your Supabase project settings
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY';

// Initialize the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
