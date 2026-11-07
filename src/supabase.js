import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rjpphcrpqfdfmqjfbjwf.supabase.co';

const SUPABASE_ANON_KEY = 'sb_publishable_jG-h2ePwd969egKiwEfDlA_GQ31gxas';

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);
