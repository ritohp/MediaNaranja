import { supabase } from '../lib/supabase';

export async function generateLyrics(prompt: string) {
  try {
    const { data, error } = await supabase.functions.invoke('generate-lyrics', {
      body: { prompt }
    });

    if (error) {
      console.error("Supabase Function Error:", error);
      throw new Error(`Error en la función de borde: ${error.message}`);
    }

    if (!data || !data.text) {
      throw new Error("La IA no devolvió contenido válido.");
    }

    return data.text;
  } catch (error: any) {
    console.error("Critical AI Services Error:", error);
    throw error;
  }
}

export async function generateInterviewQuestions(context: string): Promise<string[]> {
  try {
    const prompt = `Eres un experto entrevistador para "Media Naranja", una plataforma que crea canciones personalizadas ultra-sentimentales.
    A partir de la siguiente idea inicial del usuario: "${context}"
    
    Genera exactamente 9 preguntas abiertas y profundas que nos ayuden a extraer los mejores detalles para una canción inolvidable.
    Las preguntas deben enfocarse en: anécdotas, rasgos físicos/personales, palabras clave entre ellos, apodos, momentos difíciles superados, y el sentimiento exacto.
    
    RESPONDE ÚNICAMENTE CON UN ARRAY JSON DE STRINGS, SIN TEXTO ADICIONAL.
    Ejemplo: ["Pregunta 1", "Pregunta 2", ...]`;

    const { data, error } = await supabase.functions.invoke('generate-lyrics', {
      body: { prompt }
    });

    if (error) throw error;
    
    const text = data.text;
    const questions = JSON.parse(text.substring(text.indexOf('['), text.lastIndexOf(']') + 1));
    
    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error("Formato de preguntas inválido");
    }

    return questions.slice(0, 9);
  } catch (error: any) {
    console.error("Error generating questions:", error);
    return [
      "¿Cómo describirías su personalidad en 3 palabras?",
      "¿Cuál es el recuerdo más divertido que comparten?",
      "¿Qué es lo que más admiras de esta persona?",
      "¿Tienen algún lugar que sea 'suyo'?",
      "¿Hay alguna frase que siempre digan?",
      "¿Cómo ha cambiado tu vida desde que le conoces?",
      "¿Qué canción o artista les recuerda al otro?",
      "¿Cuál ha sido el momento más feliz juntos?",
      "¿Qué mensaje le darías si fuera vuestro último día?"
    ];
  }
}
