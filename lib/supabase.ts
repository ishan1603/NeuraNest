import { createClient } from '@supabase/supabase-js';

export const createSupabaseClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      'dummy_key',
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
};
