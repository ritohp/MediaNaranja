import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const SENDER_EMAIL = Deno.env.get('SENDER_EMAIL') || 'hola@medianaranja.mx';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function sendEmail(to: string, subject: string, html: string) {
  if (!RESEND_API_KEY) {
    console.error("Missing RESEND_API_KEY environment variable.");
    throw new Error("Missing RESEND_API_KEY");
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: `Media Naranja <${SENDER_EMAIL}>`,
      to: [to],
      subject: subject,
      html: html,
    }),
  });
  
  if (!res.ok) {
    const errText = await res.text();
    console.error(`Resend API error: ${errText}`);
  }
  return res.json();
}

// Estilo CSS responsivo para los correos
const emailHeader = `
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; border: 1px solid #ffebe0; overflow: hidden; box-shadow: 0 4px 12px rgba(253, 93, 16, 0.05); font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
    <tr>
      <td align="center" style="background-color: #fd5d10; padding: 40px 20px;">
        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold; letter-spacing: 1.5px; text-transform: uppercase;">Media Naranja</h1>
        <p style="color: #ffe5d9; margin: 5px 0 0 0; font-size: 14px; font-style: italic;">Tu Biografía Digital & Canción de Cuna</p>
      </td>
    </tr>
    <tr>
      <td style="padding: 40px 30px; color: #333333; line-height: 1.6; font-size: 16px;">
`;

const emailFooter = `
      </td>
    </tr>
    <tr>
      <td align="center" style="background-color: #fff3ed; padding: 20px; color: #8c3b23; font-size: 12px; font-family: Arial, sans-serif;">
        © 2026 Media Naranja MX. Hecho con ❤️ para toda la familia.<br/>
        Para cualquier duda, escríbenos a <a href="mailto:${SENDER_EMAIL}" style="color: #fd5d10; text-decoration: none;">${SENDER_EMAIL}</a>
      </td>
    </tr>
  </table>
`;

serve(async (req) => {
  try {
    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: "Missing RESEND_API_KEY environment variable on Supabase." }), { 
        status: 500, 
        headers: { "Content-Type": "application/json" } 
      });
    }

    let sentCount = 0;
    const { data: sentLogs } = await supabase.from('mn_email_sent').select('user_id, song_id, campaign_id')
    const sentHistory = sentLogs || [];

    // --- LÓGICA 1: RESCATE DE REGISTRO SIN CONFIRMAR (2 HORAS) ---
    const { data: profiles } = await supabase.rpc('get_admin_profiles_v2')
    if (profiles) {
      for (const profile of profiles) {
        if (profile.email_confirmed) continue;

        const hoursSinceCreation = (new Date().getTime() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60)
        
        // Si han pasado más de 2 horas pero menos de 24 horas, y no se ha enviado el correo de rescate
        const hasSentRescue = sentHistory.some(h => h.campaign_id === '22222222-2222-2222-2222-222222222222' && h.user_id === profile.id)
        
        if (hoursSinceCreation >= 2 && hoursSinceCreation < 24 && !hasSentRescue) {
          const bodyHtml = `
            ${emailHeader}
            <h2 style="color: #8c3b23; font-size: 22px; margin-top: 0; font-family: Georgia, serif;">¡Espera! Tu Biografía Digital te está esperando... 🍊</h2>
            <p>Notamos que empezaste a crear la historia y la letra de tu canción de cuna personalizada, pero aún no has confirmado tu correo electrónico.</p>
            <p>Para que <strong>Naranjín</strong> pueda seguir estructurando tus melodías en el estudio y no pierdas tu progreso, es muy importante confirmar tu cuenta.</p>
            
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 30px 0;">
              <tr>
                <td align="center">
                  <a href="https://www.medianaranja.mx/create" style="display: inline-block; background-color: #fd5d10; color: #ffffff; font-weight: bold; text-decoration: none; padding: 16px 36px; border-radius: 50px; font-size: 16px; letter-spacing: 1px; box-shadow: 0 4px 10px rgba(253, 93, 16, 0.3);">
                    RETOMAR MI BORRADOR
                  </a>
                </td>
              </tr>
            </table>
            
            <p style="font-size: 14px; color: #666666;"><em>Nota: Recuerda buscar el correo de confirmación de Supabase en tu bandeja de entrada o carpeta de Spam para activar tu cuenta de forma definitiva.</em></p>
            ${emailFooter}
          `;

          await sendEmail(profile.email, "🍊 ¡Espera! Completa tu registro en Media Naranja", bodyHtml)

          await supabase.from('mn_email_sent').insert({
            user_id: profile.id,
            campaign_id: '22222222-2222-2222-2222-222222222222'
          })
          sentCount++;
        }
      }
    }

    // --- LÓGICA 2: RECUPERACIÓN DE CARRITOS ABANDONADOS (CANCIONES COMPLETAS SIN PAGAR) ---
    const { data: songs } = await supabase
      .from('mn_songs')
      .select('id, user_id, created_at, is_paid, status, mn_profiles(email)')
      .eq('status', 'complete')
      .eq('is_paid', false)

    if (songs && songs.length > 0) {
      for (const song of songs) {
        // Ignorar si el usuario ni siquiera ha confirmado su correo
        const profile = profiles?.find(p => p.id === song.user_id)
        if (profile && !profile.email_confirmed) continue;

        const email = song.mn_profiles?.email
        if (!email) continue;
        
        const hoursSinceCreation = (new Date().getTime() - new Date(song.created_at).getTime()) / (1000 * 60 * 60)
        
        const sentHistoryForSong = sentHistory.filter(log => log.song_id === song.id)
        const hasSentDay1 = sentHistoryForSong.some(h => h.campaign_id === '11111111-1111-1111-1111-111111111111')
        const hasSentDay3 = sentHistoryForSong.some(h => h.campaign_id === '33333333-3333-3333-3333-333333333333')

        // LÓGICA DÍA 1 (Entre 24 y 72 horas)
        if (hoursSinceCreation >= 24 && hoursSinceCreation < 72 && !hasSentDay1) {
          const bodyHtml = `
            ${emailHeader}
            <h2 style="color: #8c3b23; font-size: 22px; margin-top: 0; font-family: Georgia, serif;">🎧 ¡Tu canción personalizada está lista en el estudio!</h2>
            <p>¡Hola de nuevo!</p>
            <p>Notamos que dejaste tu obra de arte musical guardada en el estudio. La letra y la estructura melódica ya están terminadas y listas para conmover a esa persona tan especial en tu vida.</p>
            <p>Solo falta un último paso para desbloquear la grabación final de estudio, descargar los archivos MP3 de alta calidad y acceder a tu Biografía Digital interactiva.</p>
            
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 30px 0;">
              <tr>
                <td align="center">
                  <a href="https://www.medianaranja.mx/my-songs" style="display: inline-block; background-color: #fd5d10; color: #ffffff; font-weight: bold; text-decoration: none; padding: 16px 36px; border-radius: 50px; font-size: 16px; letter-spacing: 1px; box-shadow: 0 4px 10px rgba(253, 93, 16, 0.3);">
                    ESCUCHAR Y DESBLOQUEAR
                  </a>
                </td>
              </tr>
            </table>
            
            <p>Regresa cuando quieras a tu zona de usuario para tener este recuerdo único contigo para siempre.</p>
            ${emailFooter}
          `;

          await sendEmail(email, "🎧 Tu canción personalizada de Media Naranja está lista", bodyHtml)

          await supabase.from('mn_email_sent').insert({
            user_id: song.user_id,
            song_id: song.id,
            campaign_id: '11111111-1111-1111-1111-111111111111'
          })
          sentCount++;
        }

        // LÓGICA DÍA 3 (Más de 72 horas)
        if (hoursSinceCreation >= 72 && !hasSentDay3) {
          const bodyHtml = `
            ${emailHeader}
            <h2 style="color: #8c3b23; font-size: 22px; margin-top: 0; font-family: Georgia, serif;">🍊 Las grandes historias merecen ser cantadas</h2>
            <p>¡Hola! Esperamos que estés muy bien.</p>
            <p>En <strong>Media Naranja</strong> creemos firmemente que los sentimientos más bellos y las historias familiares nunca deben quedarse guardados en un cajón.</p>
            <p>Tu canción personalizada y Biografía Digital siguen activas en nuestro servidor de forma temporal. No dejes pasar la oportunidad de entregar este regalo inolvidable que durará toda la vida.</p>
            
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 30px 0;">
              <tr>
                <td align="center">
                  <a href="https://www.medianaranja.mx/my-songs" style="display: inline-block; background-color: #fd5d10; color: #ffffff; font-weight: bold; text-decoration: none; padding: 16px 36px; border-radius: 50px; font-size: 16px; letter-spacing: 1px; box-shadow: 0 4px 10px rgba(253, 93, 16, 0.3);">
                    DESBLOQUEAR MI CANCIÓN
                  </a>
                </td>
              </tr>
            </table>
            
            <p>Te esperamos de vuelta en el estudio.</p>
            ${emailFooter}
          `;

          await sendEmail(email, "🍊 Las grandes historias merecen ser cantadas", bodyHtml)
          
          await supabase.from('mn_email_sent').insert({
            user_id: song.user_id,
            song_id: song.id,
            campaign_id: '33333333-3333-3333-3333-333333333333'
          })
          sentCount++;
        }
      }
    }

    return new Response(JSON.stringify({ success: true, emails_sent: sentCount }), { 
      status: 200, 
      headers: { "Content-Type": "application/json" } 
    });

  } catch (e: any) {
    console.error(`Edge Function execution error: ${e.message}`);
    return new Response(JSON.stringify({ error: e.message }), { 
      status: 500, 
      headers: { "Content-Type": "application/json" } 
    });
  }
})
