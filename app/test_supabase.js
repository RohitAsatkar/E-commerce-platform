import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tsqwmzkwwshzyszuvvar.supabase.co';
const supabaseAnonKey = 'sb_publishable_TPKx7bgD1BXS15Bo8bd2Mw_LeYUBbVf';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspectProfiles() {
  console.log("Fetching profiles from Supabase...");
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*');
    
    if (error) {
      console.error("Error fetching profiles:", error);
      return;
    }
    console.log("Profiles list:");
    console.log(JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("Exception occurred:", e);
  }
}

inspectProfiles();
