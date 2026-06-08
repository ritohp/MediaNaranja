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
      throw new Error(data?.error || "La IA no devolvi├│ contenido v├ílido.");
    }

    return data.text;
  } catch (error: any) {
    console.error("Critical AI Services Error:", error);
    // Usar una forma segura de acceder a propiedades din├ímicas para evitar errores de Build
    const detailedMessage = error?.message || "Error de conexi├│n con la IA";
    throw new Error(`Detalle t├®cnico: ${detailedMessage}`);
  }
}

export async function generateInterviewQuestions(context: string): Promise<string[]> {
  try {
    const prompt = `Eres un experto entrevistador para "Media Naranja", una plataforma que crea canciones personalizadas ultra-sentimentales.
    A partir de la siguiente idea inicial del usuario: "${context}"
    
    Genera exactamente 6 preguntas abiertas y profundas que nos ayuden a extraer los mejores detalles para una canci├│n inolvidable.
    Las preguntas deben enfocarse en: an├®cdotas, rasgos f├¡sicos/personales, palabras clave entre ellos, apodos, momentos dif├¡ciles superados, y el sentimiento exacto.
    
    RESPONDE ├ÜNICAMENTE CON UN ARRAY JSON DE STRINGS, SIN TEXTO ADICIONAL.
    Ejemplo: ["Pregunta 1", "Pregunta 2", ...]`;

    const { data, error } = await supabase.functions.invoke('generate-lyrics', {
      body: { prompt }
    });

    if (error) throw error;
    
    const text = data.text;
    if (!text) throw new Error(data?.error || "La IA no respondi├│ correctamente.");

    const questions = JSON.parse(text.substring(text.indexOf('['), text.lastIndexOf(']') + 1));
    
    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error("Formato de preguntas inv├ílido");
    }

    return questions.slice(0, 6);
  } catch (error: any) {
    console.error("Error generating questions:", error);
    // PLAN B: Lista de emergencia de exactamente 6 preguntas
    return [
      "┬┐C├│mo describir├¡as su personalidad en 3 palabras?",
      "┬┐Cu├íl es el recuerdo m├ís divertido que comparten?",
      "┬┐Qu├® es lo que m├ís admiras de esta persona?",
      "┬┐Tienen alg├║n lugar que sea 'suyo'?",
      "┬┐Hay alguna frase que siempre digan?",
      "┬┐C├│mo ha cambiado tu vida desde que le conoces?"
    ];
  }
}

export async function cleanStylePrompt(rawStyle: string, category?: string): Promise<string> {
  try {
    const prompt = `El usuario desea una canci├│n con este estilo: "${rawStyle}".
    Tu tarea es extraer los T├ëRMINOS T├ëCNICOS de g├®nero musical para una IA generativa (Suno).
    
    CONTEXTO DE CATEGOR├ìA: ${category || 'General'}
    
    INSTRUCCIONES:
    1. Analiza la intenci├│n del usuario. Si es para un ni├▒o y pide algo 'divertido' o 'alegre', usa estilos como 'Upbeat Children's Music', 'Kids Pop', 'Playful'.
    2. Si es para un ni├▒o pero pide algo tranquilo, usa 'Lullaby', 'Soft Piano', 'Dreamy'.
    3. NUNCA incluyas instrumentos pesados como 'Tuba' o g├®neros de 'Banda' a menos que el usuario lo pida expl├¡citamente por su nombre.
    4. Si el usuario menciona artistas reales, usa solo su g├®nero musical.
    5. Responde con 3 a 5 palabras clave separadas por comas.
    
    RESPONDE ├ÜNICAMENTE CON EL ESTILO RESULTANTE.`;

    const { data, error } = await supabase.functions.invoke('generate-lyrics', {
      body: { prompt }
    });

    if (error || !data || !data.text) {
      console.warn("Fallo el filtro de estilo, usando estilo por defecto");
      return category === 'hijo' ? "Lullaby, Soft Piano" : "Pop rom├íntico ac├║stico";
    }

    let cleanText = data.text.trim();
    cleanText = cleanText.replace(/^["']|["']$/g, '');
    
    return cleanText;
  } catch (error) {
    console.error("Error in cleanStylePrompt:", error);
    return category === 'hijo' ? "Lullaby, Soft Piano" : "Pop ac├║stico emocional";
  }
}

export async function generateDetailsPrompt(context: string): Promise<{
  title: string, subtitle: string, placeholder: string,
  familyTitle: string, familySubtitle: string, familyPlaceholder: string
}> {
  try {
    const prompt = `Basado en la siguiente idea inicial para una canci├│n: "${context}"
    
    Genera dos conjuntos de textos:
    1. Textos para pedir detalles generales y la historia.
    2. Textos espec├¡ficos para pedir nombres de familiares o personas cercanas relevantes a la historia (hijos, esposa, novio, amigos, etc.) adaptado exactamente al tipo de relaci├│n.
    
    RESPONDE EXACTAMENTE CON UN JSON V├üLIDO CON ESTA ESTRUCTURA (SIN TEXTO ANTES NI DESPU├ëS):
    {
      "title": "Nombres y la historia...",
      "subtitle": "┬┐C├│mo se llama? ┬┐De d├│nde es? ┬┐Qu├® cosas espec├¡ficas no pueden faltar en la canci├│n?",
      "placeholder": "Ej: Se llama Juan, creci├│ en Veracruz, es muy trabajador...",
      "familyTitle": "Familiares y personas importantes",
      "familySubtitle": "┬┐C├│mo se llaman su esposa e hijos? (Opcional pero recomendado)",
      "familyPlaceholder": "Ej: Su esposa Mar├¡a y sus hijos Leo y Sof├¡a..."
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
      subtitle: parsed.subtitle || "┬┐C├│mo se llaman? ┬┐D├│nde se conocieron? ┬┐Hay algo espec├¡fico que mencionar?",
      placeholder: parsed.placeholder || "Ej: Tienen 3 hijos, se conocieron en la playa...",
      familyTitle: parsed.familyTitle || "Familiares y personas importantes",
      familySubtitle: parsed.familySubtitle || "┬┐C├│mo se llaman las personas que giran a su alrededor? (Opcional pero recomendado)",
      familyPlaceholder: parsed.familyPlaceholder || "Ej: Su pareja, sus hijos o sus mejores amigos..."
    };
  } catch (error) {
    console.error("Error generating details prompt:", error);
    return {
      title: "Nombres, lugares y la historia",
      subtitle: "┬┐C├│mo se llaman? ┬┐D├│nde se conocieron? ┬┐Hay algo espec├¡fico que mencionar?",
      placeholder: "Ej: ├ël se llama Carlos y ella Ana, se conocieron en Madrid. Tienen 3 hijos...",
      familyTitle: "Familiares y personas importantes",
      familySubtitle: "┬┐C├│mo se llaman las personas que giran a su alrededor? (Opcional pero recomendado)",
      familyPlaceholder: "Ej: Su pareja, sus hijos o sus mejores amigos..."
    };
  }
}
