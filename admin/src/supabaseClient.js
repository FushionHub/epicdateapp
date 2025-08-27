import { createClient } from '@supabase/supabase-js'

// Note: These are the same credentials as the main client app.
// The separation is for organizational purposes.
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
