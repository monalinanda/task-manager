import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';
import { environment } from '../environments/environment';

if (!environment.supabaseUrl || !environment.supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(
  environment.supabaseUrl,
  environment.supabaseKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
);
