import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hkakmdpqbbsstacpgpqe.supabase.co';
const supabaseAnonKey = 'sb_publishable_BI9Kc4Ik9F6ywN4ZjV6xiQ_y0iE4tbb';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  const prompt = "Genera la letra de una cancion para mi papa Javier Rayas de estilo ranchera norteña";
  console.log("Calling supabase.functions.invoke('generate-lyrics')...");
  try {
    const { data, error } = await supabase.functions.invoke('generate-lyrics', {
      body: { prompt }
    });
    console.log("Error:", error);
    console.log("Data:", JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Caught error:", err);
  }
}

test();
