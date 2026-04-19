import { createClient } from '@supabase/supabase-js';

// Forzado manualmente para saltar el reinicio del servidor
const supabaseUrl = 'https://hkakmdpqbbsstacpgpqe.supabase.co';
const supabaseAnonKey = 'sb_publishable_BI9Kc4Ik9F6ywN4ZjV6xiQ_y0iE4tbb';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
