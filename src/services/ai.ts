import { supabase } from '../lib/supabase';

export async function generateLyrics(prompt: string) {
  try {
    const { data, error } = await supabase.functions.invoke('generate-lyrics', {
      body: { prompt }
    });

    if (error) {
       console.error("Functions Invoke Error Details:", error);
       // El error de Supabase para 400 es FunctionsHttpError
       // Intentaremos decodificar el mensaje si viene en el error
       throw new Error(error.message || "Error desconocido en la IA");
    }

    if (!data || data.error) {
      throw new Error(data?.error || "La IA no devolvió contenido válido.");
    }

    return data.text;
  } catch (error: any) {
    console.error("Critical AI Services Error:", error);
    // Usar una forma segura de acceder a propiedades dinámicas para evitar errores de Build
    const detailedMessage = error?.message || "Error de conexión con la IA";
    throw new Error(`Detalle técnico: ${detailedMessage}`);
  }
}

export async function generateInterviewQuestions(context: string): Promise<string[]> {
  try {
    const prompt = `Eres un experto entrevistador para "Media Naranja", una plataforma que crea canciones personalizadas ultra-sentimentales.
    A partir de la siguiente idea inicial del usuario: "${context}"
    
    Genera exactamente 6 preguntas abiertas y profundas que nos ayuden a extraer los mejores detalles para una canción inolvidable.
    Las preguntas deben enfocarse en: anécdotas, rasgos físicos/personales, palabras clave entre ellos, apodos, momentos difíciles superados, y el sentimiento exacto.
    
    RESPONDE ÚNICAMENTE CON UN ARRAY JSON DE STRINGS, SIN TEXTO ADICIONAL.
    Ejemplo: ["Pregunta 1", "Pregunta 2", ...]`;

    const { data, error } = await supabase.functions.invoke('generate-lyrics', {
      body: { prompt }
    });

    if (error) throw error;
    
    const text = data.text;
    if (!text) throw new Error(data?.error || "La IA no respondió correctamente.");

    const questions = JSON.parse(text.substring(text.indexOf('['), text.lastIndexOf(']') + 1));
    
    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error("Formato de preguntas inválido");
    }

    return questions.slice(0, 6);
  } catch (error: any) {
    console.error("Error generating questions:", error);
    // PLAN B: Lista de emergencia de exactamente 6 preguntas
    return [
      "¿Cómo describirías su personalidad en 3 palabras?",
      "¿Cuál es el recuerdo más divertido que comparten?",
      "¿Qué es lo que más admiras de esta persona?",
      "¿Tienen algún lugar que sea 'suyo'?",
      "¿Hay alguna frase que siempre digan?",
      "¿Cómo ha cambiado tu vida desde que le conoces?"
    ];
  }
}

export async function cleanStylePrompt(rawStyle: string): Promise<string> {
  try {
    const prompt = `El usuario ha descrito el estilo musical que desea para su canción: "${rawStyle}".
    Extrae y describe el género musical de forma concisa (ej. 'Banda sinaloense alegre', 'Balada pop romántica acústica').
    
    INSTRUCCIÓN CRÍTICA: Si el usuario menciona nombres de artistas, cantantes o bandas reales con copyright (ej. Banda MS, Luis Miguel, Ed Sheeran), ELIMÍNALOS por completo. Solo describe el estilo musical genérico que los representa.
    
    RESPONDE ÚNICAMENTE CON EL ESTILO RESULTANTE, SIN NINGÚN OTRO TEXTO NI COMILLAS.`;

    const { data, error } = await supabase.functions.invoke('generate-lyrics', {
      body: { prompt }
    });

    if (error || !data || !data.text) {
      // Si falla, regresamos el string crudo o algo muy genérico para no romper el flujo
      console.warn("Fallo el filtro de estilo, usando estilo por defecto");
      return "Pop romántico";
    }

    // Limpiamos de comillas si la IA no hizo caso
    let cleanText = data.text.trim();
    cleanText = cleanText.replace(/^["']|["']$/g, '');
    
    return cleanText;
  } catch (error) {
    console.error("Error in cleanStylePrompt:", error);
    return "Pop acústico emocional";
  }
}

export async function generateDetailsPrompt(context: string): Promise<{title: string, subtitle: string, placeholder: string}> {
  try {
    const prompt = `Basado en la siguiente idea inicial para una canción: "${context}"
    
    Genera un título, un subtítulo descriptivo y un texto de ejemplo (placeholder) que inviten al usuario a escribir más detalles y anécdotas relevantes para este tipo específico de canción (ej. si es para un padre, un hijo, una mascota, una pareja, etc.)
    
    RESPONDE EXACTAMENTE CON UN JSON VÁLIDO CON ESTA ESTRUCTURA (SIN TEXTO ANTES NI DESPUÉS):
    {
      "title": "Nombres y la historia...",
      "subtitle": "¿Cómo se llama? ¿De dónde es? ¿Qué cosas específicas no pueden faltar en la canción?",
      "placeholder": "Ej: Se llama Juan, creció en Veracruz, es muy trabajador..."
    }`;

    const { data, error } = await supabase.functions.invoke('generate-lyrics', {
      body: { prompt }
    });

    if (error) throw error;
    
    const text = data.text;
    const jsonStr = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1);
    const parsed = JSON.parse(jsonStr);

    return {
      title: parsed.title || "Nombres, lugares y la historia",
      subtitle: parsed.subtitle || "¿Cómo se llaman? ¿Dónde se conocieron? ¿Hay algo específico que mencionar?",
      placeholder: parsed.placeholder || "Ej: Tienen 3 hijos, se conocieron en la playa..."
    };
  } catch (error) {
    console.error("Error generating details prompt:", error);
    return {
      title: "Nombres, lugares y la historia",
      subtitle: "¿Cómo se llaman? ¿Dónde se conocieron? ¿Hay algo específico que mencionar?",
      placeholder: "Ej: Él se llama Carlos y ella Ana, se conocieron en Madrid. Tienen 3 hijos..."
    };
  }
}
