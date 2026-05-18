import { createClient } from '@supabase/supabase-js';

// Conexión forzada a la base de datos original y correcta "hkakmdpqbbsstacpgpqe"
const supabaseUrl = 'https://hkakmdpqbbsstacpgpqe.supabase.co';
const supabaseAnonKey = 'sb_publishable_BI9Kc4Ik9F6ywN4ZjV6xiQ_y0iE4tbb';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
