import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tsqwmzkwwshzyszuvvar.supabase.co';
const supabaseAnonKey = 'sb_publishable_TPKx7bgD1BXS15Bo8bd2Mw_LeYUBbVf';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
