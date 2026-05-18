import { createClient } from '@supabase/supabase-js';

// Conexión forzada a la base de datos activa "kwefdakzfmhuiqjylmuk"
const supabaseUrl = 'https://kwefdakzfmhuiqjylmuk.supabase.co';
const supabaseAnonKey = 'sb_publishable_nfZfVvuXGmHTqKd9LL6dGg_VEAByZaw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
