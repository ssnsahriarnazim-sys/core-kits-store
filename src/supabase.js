import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rjpphcrpqfdfmqjfbjwf.supabase.co';

const SUPABASE_ANON_KEY = 'sb_publishable_Vs1MSOml_H_-JlwxmwgLqXg_eYzJ27Hy';

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);
