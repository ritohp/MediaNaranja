import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const PRIMARY_MODEL = "gemini-3.5-flash-lite"
const BACKUP_MODEL = "gemini-flash-latest"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Función auxiliar para esperar (delay)
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

async function fetchWithRetry(url: string, options: any, maxRetries = 2) {
  let lastError;
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      const data = await response.json();
      
      // Si es un error de saturación (503) o cuota (429), reintentamos
      if (response.status === 503 || response.status === 429) {
        console.warn(`Intento ${i + 1} falló con ${response.status}. Reintentando en 1.5s...`);
        await delay(1500);
        continue;
      }
      
      return { response, data };
    } catch (err) {
      lastError = err;
      await delay(1000);
    }
  }
  throw lastError || new Error("Fallo tras múltiples reintentos");
}

async function callGemini(model: string, apiKey: string, prompt: string) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  return await fetchWithRetry(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
      ]
    }),
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { prompt } = await req.json()
    if (!prompt) return new Response(JSON.stringify({ error: "Falta el prompt" }), { headers: corsHeaders, status: 200 })

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY")
    if (!GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: "GEMINI_API_KEY no está configurada en los secretos del entorno." }), { headers: corsHeaders, status: 200 })
    }

    let { response, data } = await callGemini(PRIMARY_MODEL, GEMINI_API_KEY, prompt);

    // Si el modelo principal tuvo error de cuota/modelo no disponible, intentamos con el de respaldo
    if (data && data.error && (data.error.code === 404 || data.error.code === 503)) {
      console.warn(`Fallback al modelo ${BACKUP_MODEL} por error:`, data.error);
      const backupResult = await callGemini(BACKUP_MODEL, GEMINI_API_KEY, prompt);
      response = backupResult.response;
      data = backupResult.data;
    }

    if (data.error) {
      return new Response(JSON.stringify({ 
        error: `GEMINI_ALERT [${data.error.code}]: ${data.error.message}` 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200, 
      })
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) {
      return new Response(JSON.stringify({ 
        error: "Bloqueo de Seguridad: El contenido parece infringir las políticas de Google." 
      }), { headers: corsHeaders, status: 200 })
    }

    return new Response(JSON.stringify({ text }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    return new Response(JSON.stringify({ error: `Error Crítico: ${error.message}` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  }
})
