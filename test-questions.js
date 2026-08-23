import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hkakmdpqbbsstacpgpqe.supabase.co';
const supabaseKey = 'dummy'; // the function probably uses the anon key or we just need the url
// Wait, test-lyrics-with-params.js just does a fetch without auth. Let's do a fetch directly.

async function testGenerateQuestions() {
  const context = "Homenaje de vida e historia para mi papá Javier Rayas, nacido en la Sandía León Guanajuato el desconocido. Sus seres queridos y familia: su esposa Mary, hijos Javi, valeria, edgar, ulises y anibal. Detalles e hitos de su vida: mi papa se llama javier rayas, es de la sandia leon guanajuato";
  const category = "papa";
  const recipientName = "Javier Rayas";
  
  const prompt = `Eres un experto entrevistador para "Media Naranja", una plataforma que crea canciones personalizadas ultra-sentimentales.
    A partir de la siguiente idea inicial del usuario: "${context}"
    Categoría de la canción: "${category}"
    ${recipientName ? `Nombre de la persona a quien va dirigida la canción: "${recipientName}"` : ''}
    
    Genera exactamente 6 preguntas abiertas y profundas que nos ayuden a extraer los mejores detalles para una canción inolvidable.
    Las preguntas deben enfocarse en: anécdotas, rasgos físicos/personales, palabras clave entre ellos, apodos, momentos difíciles superados, y el sentimiento exacto.
    IMPORTANTE: Asegúrate de que las preguntas SE ADAPTEN PERFECTAMENTE a la categoría indicada (por ejemplo, si es "papa", NO preguntes de romance o noviazgo).
    ${recipientName ? `\n    MANDATORIO: Dado que conocemos su nombre (${recipientName}), HAZ LAS PREGUNTAS USANDO SU NOMBRE EXPLÍCITAMENTE para que sea más personal (Ej: "¿Cómo conociste a ${recipientName}?", "¿Qué admiras más de ${recipientName}?").` : ''}
    
    ADEMÁS, intenta extraer o deducir el nombre principal de la persona a la que va dirigida la canción (el destinatario o festejado). Si no puedes deducirlo, usa un string vacío "".
    
    RESPONDE ÚNICAMENTE CON UN OBJETO JSON CON ESTA ESTRUCTURA (SIN TEXTO ADICIONAL NI MARKDOWN):
    {
      "extractedName": "${recipientName || 'Juan'}",
      "questions": ["Pregunta 1", "Pregunta 2", "Pregunta 3", "Pregunta 4", "Pregunta 5", "Pregunta 6"]
    }`;

  try {
    const response = await fetch('https://hkakmdpqbbsstacpgpqe.supabase.co/functions/v1/generate-lyrics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ prompt })
    });
    
    const data = await response.json();
    console.log("RESPONSE JSON:", data);
    
    const text = data.text;
    console.log("RAW TEXT:", text);
    
    if (text) {
      const jsonStr = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1);
      console.log("EXTRACTED JSON STR:", jsonStr);
      const parsed = JSON.parse(jsonStr);
      console.log("PARSED OK:", parsed);
    }
  } catch (err) {
    console.error("ERROR:", err);
  }
}

testGenerateQuestions();
