import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'
import Stripe from 'https://esm.sh/stripe@14?target=denonext'

const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY') || Deno.env.get('STRIPE_API_KEY') || 'sk_dummy_for_webhook_signature_verification_only';
// Hardcoded fallback Stripe webhook signature key provided by the user in Conversation 0f4d7492
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') || Deno.env.get('STRIPE_WEBHOOK_SIGNING_SECRET');

console.log("Stripe webhook function initialized.");
if (stripeSecret.startsWith('sk_dummy')) {
  console.warn("⚠️ STRIPE_SECRET_KEY is not defined. Using a dummy key for webhook signature verification. DB updates will work, but API requests to Stripe will fail.");
}

Deno.serve(async (req) => {
  // CORS origin for webhooks isn't strictly necessary, but helpful
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 
      "Access-Control-Allow-Origin": "*", 
      "Access-Control-Allow-Methods": "POST", 
      "Access-Control-Allow-Headers": "stripe-signature, content-type" 
    }})
  }

  try {
    const stripe = new Stripe(stripeSecret, {
      apiVersion: '2023-10-16',
    });
    const cryptoProvider = Stripe.createSubtleCryptoProvider();

    const signature = req.headers.get('Stripe-Signature')

    if (!signature || !webhookSecret) {
      console.error(`Missing signature (${!!signature}) or webhook secret (${!!webhookSecret})`);
      return new Response('Missing signature or secret', { status: 400 })
    }

    const body = await req.text()
    let event;
    
    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret, undefined, cryptoProvider)
    } catch (err) {
      console.error(`Webhook signature verification failed:`, err.message);
      return new Response(`Signature Error: ${err.message}`, { status: 400 })
    }

    console.log(`🔔 Event received: ${event.type} (ID: ${event.id})`);

    // Proceso del evento de pago completado
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      
      const refId = session.client_reference_id || session.metadata?.song_id || session.metadata?.memory_id
      const amount = session.amount_total ? session.amount_total / 100 : 0
      console.log(`Checkout session completed. Reference ID: ${refId}, amount: ${amount}`);

      if (refId) {
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        if (!supabaseUrl || !supabaseKey) {
            console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
            return new Response('Missing Supabase Config', { status: 500 });
        }

        // Conexión con privilegios de administrador para alterar base de datos
        const supabaseAdmin = createClient(supabaseUrl, supabaseKey)

        // 1. Verificar si refId corresponde a una plantilla en memories
        const { data: memoryRecord } = await supabaseAdmin
          .from('memories')
          .select('id, song_id, user_id')
          .eq('id', refId)
          .maybeSingle();

        if (memoryRecord) {
          console.log(`Payment confirmed for Memory: ${memoryRecord.id}`);

          // A. Desbloquea la experiencia web y el código QR
          const { error: memErr } = await supabaseAdmin
            .from('memories')
            .update({ status: 'paid' })
            .eq('id', memoryRecord.id);

          if (memErr) {
            console.error("Error updating memories:", memErr);
          } else {
            console.log(`Memory ${memoryRecord.id} successfully marked as paid.`);
          }

          // B. Si tiene canción vinculada, también la desbloquea
          if (memoryRecord.song_id) {
            const { error: songErr } = await supabaseAdmin
              .from('mn_songs')
              .update({ is_paid: true })
              .eq('id', memoryRecord.song_id);

            if (songErr) {
              console.error("Error updating mn_songs from memory:", songErr);
            } else {
              console.log(`Song ${memoryRecord.song_id} marked as paid for memory ${memoryRecord.id}`);
            }
          }

          // C. Registra la transacción en mn_payments
          const { error: insertErr } = await supabaseAdmin.from('mn_payments').insert({
            song_id: memoryRecord.song_id || null,
            user_id: memoryRecord.user_id || null,
            amount: amount,
            provider: 'stripe',
            external_id: session.id,
            status: 'completed'
          });

          if (insertErr) {
            console.error("Error inserting into mn_payments:", insertErr);
          } else {
            console.log("mn_payments inserted successfully for memory.");
          }

        } else {
          // 2. Si refId es directamente un song_id
          console.log(`Checking song ID directly: ${refId}`);
          const { data: songRecord } = await supabaseAdmin
            .from('mn_songs')
            .select('id, user_id')
            .eq('id', refId)
            .maybeSingle();

          const targetSongId = songRecord?.id || refId;
          const targetUserId = songRecord?.user_id || null;

          // A. Libera la canción
          const { error: updateError } = await supabaseAdmin
            .from('mn_songs')
            .update({ is_paid: true })
            .eq('id', targetSongId);

          if (updateError) {
            console.error("Error updating mn_songs:", updateError);
          } else {
            console.log(`mn_songs updated successfully for song: ${targetSongId}`);
          }

          // B. Si el paquete pagado es de $199 o $399, desbloquea cualquier recuerdo vinculado
          if (amount >= 190) {
            const { error: memErr } = await supabaseAdmin
              .from('memories')
              .update({ status: 'paid' })
              .eq('song_id', targetSongId);

            if (memErr) {
              console.error("Error updating memories for song:", memErr);
            } else {
              console.log(`Memories for song ${targetSongId} marked as paid.`);
            }
          }

          // C. Registra en mn_payments
          const { error: insertError } = await supabaseAdmin.from('mn_payments').insert({
            song_id: targetSongId,
            user_id: targetUserId,
            amount: amount,
            provider: 'stripe',
            external_id: session.id,
            status: 'completed'
          });
          
          if (insertError) {
            console.error("Error inserting into mn_payments:", insertError);
          } else {
            console.log("mn_payments inserted successfully for song.");
          }
        }
      } else {
        console.error("No reference ID found in session reference or metadata.");
      }
    }

    return new Response(JSON.stringify({ success: true, event_raw: event.type }), { 
      status: 200, 
      headers: { "Content-Type": "application/json" } 
    })
  } catch (err) {
     console.error("Top-level catch error:", err.message, err.stack);
     return new Response(`Error: ${err.message}`, { status: 500 })
  }
})
