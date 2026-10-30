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
    const { originalUrl, songId, version } = await req.json()
    
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log(`[Audio Treatment] Processing song ${songId} (version: ${version || 1})...`);

    let permanentAudioUrl = originalUrl;

    // Si la URL viene de un servidor temporal externo (aiquickdraw, kie, suno),
    // descargamos el archivo MP3 y lo guardamos permanentemente en nuestro Supabase Storage propio (bucket 'demos')
    if (originalUrl && (
      originalUrl.includes('aiquickdraw.com') || 
      originalUrl.includes('kie.ai') || 
      originalUrl.includes('tempfile') ||
      originalUrl.includes('suno.ai')
    )) {
      try {
        console.log(`[Audio Treatment] Downloading audio from temporary CDN: ${originalUrl}`);
        const res = await fetch(originalUrl);
        if (res.ok) {
          const audioBuffer = await res.arrayBuffer();
          const fileSuffix = version ? `_v${version}` : '_v1';
          const filename = `songs/${songId || crypto.randomUUID()}${fileSuffix}_${Date.now()}.mp3`;

          const { error: uploadErr } = await supabaseAdmin.storage
            .from('demos')
            .upload(filename, audioBuffer, {
              contentType: 'audio/mpeg',
              upsert: true
            });

          if (!uploadErr) {
            const { data: publicUrlData } = supabaseAdmin.storage
              .from('demos')
              .getPublicUrl(filename);
            
            permanentAudioUrl = publicUrlData.publicUrl;
            console.log(`[Audio Treatment] Successfully saved to permanent Supabase Storage: ${permanentAudioUrl}`);
          } else {
            console.error(`[Audio Treatment] Storage upload error:`, uploadErr);
          }
        } else {
          console.error(`[Audio Treatment] Failed to fetch source audio: HTTP ${res.status}`);
        }
      } catch (dlErr: any) {
        console.error(`[Audio Treatment] Download exception:`, dlErr.message);
      }
    }

    // Actualizamos la base de datos con la URL permanente
    if (songId) {
      if (version === 2) {
        // En versión 2, actualizamos form_data.version2 si existe
        const { data: currentSong } = await supabaseAdmin
          .from('mn_songs')
          .select('form_data')
          .eq('id', songId)
          .single();

        if (currentSong?.form_data?.version2) {
          const updatedFormData = {
            ...currentSong.form_data,
            version2: {
              ...currentSong.form_data.version2,
              audio_url: permanentAudioUrl,
              demo_url: permanentAudioUrl,
            }
          };
          await supabaseAdmin
            .from('mn_songs')
            .update({ form_data: updatedFormData })
            .eq('id', songId);
        }
      } else {
        await supabaseAdmin
          .from('mn_songs')
          .update({ 
            audio_url: permanentAudioUrl,
            demo_url: permanentAudioUrl,
            status: 'completed'
          })
          .eq('id', songId);
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      permanentAudioUrl,
      demoUrl: permanentAudioUrl 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error("[Treatment Error]:", error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
