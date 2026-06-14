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
      
      // Asumimos que mandaremos el song_id oculto en los metadatos o ref
      const songId = session.client_reference_id || session.metadata?.song_id
      console.log(`Checkout session completed. Song ID: ${songId}, amount: ${session.amount_total}`);

      if (songId) {
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        if (!supabaseUrl || !supabaseKey) {
            console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
            return new Response('Missing Supabase Config', { status: 500 });
        }

        // Conexión con privilegios de administrador para alterar base de datos
        const supabaseAdmin = createClient(supabaseUrl, supabaseKey)

        // 1. Libera la canción en la base de datos (desbloquea)
        const { error: updateError } = await supabaseAdmin.from('mn_songs').update({ is_paid: true }).eq('id', songId)
        if (updateError) {
             console.error("Error updating mn_songs:", updateError);
        } else {
             console.log(`mn_songs updated successfully for song: ${songId}`);
        }

        // 2. Crea el ticket comercial para uso estadístico
        const { error: insertError } = await supabaseAdmin.from('mn_payments').insert({
          song_id: songId,
          amount: session.amount_total ? session.amount_total / 100 : 0,
          provider: 'stripe',
          external_id: session.id,
          status: 'completed'
        })
        
        if (insertError) {
             console.error("Error inserting into mn_payments:", insertError);
        } else {
             console.log("mn_payments inserted successfully.");
        }
      } else {
          console.error("No songId found in session reference or metadata.");
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
