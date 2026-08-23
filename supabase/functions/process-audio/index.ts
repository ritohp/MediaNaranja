import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { originalUrl, songId } = await req.json()
    
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log(`[Audio Treatment] Processing song ${songId}...`);

    // Usamos directamente la URL original. El frontend (SongPlayer.tsx) ya se encarga 
    // de pausar el audio automáticamente a los 90 segundos si la canción no está pagada.
    // Cloudinary demo accounts suelen bloquear tráfico, provocando 0:00.
    const demoUrl = originalUrl;

    console.log(`[Generated Demo URL]: ${demoUrl}`);

    // Actualizamos la base de datos
    await supabaseAdmin
      .from('mn_songs')
      .update({ 
        demo_url: demoUrl,
        status: 'completed'
      })
      .eq('id', songId)

    return new Response(JSON.stringify({ 
      success: true, 
      demoUrl 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error("[Treatment Error]:", error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
