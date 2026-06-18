import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tsqwmzkwwshzyszuvvar.supabase.co';
const supabaseAnonKey = 'sb_publishable_TPKx7bgD1BXS15Bo8bd2Mw_LeYUBbVf';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspectProducts() {
  console.log("Fetching products from Supabase...");
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error("Error fetching products:", error);
      return;
    }
    console.log("Product fields:");
    console.log(JSON.stringify(data[0], null, 2));
  } catch (e) {
    console.error("Exception occurred:", e);
  }
}

inspectProducts();
