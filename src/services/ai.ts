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

export async function generateInterviewQuestions(context: string, category: string): Promise<{questions: string[], extractedName: string}> {
  try {
    const prompt = `Eres un experto entrevistador para "Media Naranja", una plataforma que crea canciones personalizadas ultra-sentimentales.
    A partir de la siguiente idea inicial del usuario: "${context}"
    Categoría de la canción: "${category}"
    
    Genera exactamente 6 preguntas abiertas y profundas que nos ayuden a extraer los mejores detalles para una canción inolvidable.
    Las preguntas deben enfocarse en: anécdotas, rasgos físicos/personales, palabras clave entre ellos, apodos, momentos difíciles superados, y el sentimiento exacto.
    IMPORTANTE: Asegúrate de que las preguntas SE ADAPTEN PERFECTAMENTE a la categoría indicada (por ejemplo, si es "papa", NO preguntes de romance o noviazgo).
    
    ADEMÁS, intenta extraer o deducir el nombre principal de la persona a la que va dirigida la canción (el destinatario o festejado). Si no puedes deducirlo, usa un string vacío "".
    
    RESPONDE ÚNICAMENTE CON UN OBJETO JSON CON ESTA ESTRUCTURA (SIN TEXTO ADICIONAL NI MARKDOWN):
    {
      "extractedName": "Javier Rayas",
      "questions": ["Pregunta 1", "Pregunta 2", "Pregunta 3", "Pregunta 4", "Pregunta 5", "Pregunta 6"]
    }`;

    const { data, error } = await supabase.functions.invoke('generate-lyrics', {
      body: { prompt }
    });

    if (error) throw error;
    
    const text = data.text;
    if (!text) throw new Error(data?.error || "La IA no respondió correctamente.");

    const jsonStr = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1);
    const parsed = JSON.parse(jsonStr);
    
    let questions = parsed.questions;
    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error("Formato de preguntas inválido");
    }

    return { 
      questions: questions.slice(0, 6), 
      extractedName: parsed.extractedName || '' 
    };
  } catch (error: any) {
    console.error("Error generating questions:", error);
    // PLAN B: Lista de emergencia de exactamente 6 preguntas
    return {
      extractedName: '',
      questions: [
        "¿Cómo describirías su personalidad en 3 palabras?",
        "¿Cuál es el recuerdo más divertido que comparten?",
        "¿Qué es lo que más admiras de esta persona?",
        "¿Tienen algún lugar que sea 'suyo'?",
        "¿Hay alguna frase que siempre digan?",
        "¿Cómo ha cambiado tu vida desde que le conoces?"
      ]
    };
  }
}

export async function cleanStylePrompt(rawStyle: string, category?: string): Promise<string> {
  try {
    const prompt = `El usuario desea una canción con este estilo: "${rawStyle}".
    Tu tarea es extraer los TÉRMINOS TÉCNICOS de género musical para una IA generativa (Suno).
    
    CONTEXTO DE CATEGORÍA: ${category || 'General'}
    
    INSTRUCCIONES:
    1. Analiza la intención del usuario. Si es para un niño y pide algo 'divertido' o 'alegre', usa estilos como 'Upbeat Children's Music', 'Kids Pop', 'Playful'.
    2. Si es para un niño pero pide algo tranquilo, usa 'Lullaby', 'Soft Piano', 'Dreamy'.
    3. NUNCA incluyas instrumentos pesados como 'Tuba' o géneros de 'Banda' a menos que el usuario lo pida explícitamente por su nombre.
    4. Si el usuario menciona artistas reales, usa solo su género musical.
    5. Responde con 3 a 5 palabras clave separadas por comas.
    
    RESPONDE ÚNICAMENTE CON EL ESTILO RESULTANTE.`;

    const { data, error } = await supabase.functions.invoke('generate-lyrics', {
      body: { prompt }
    });

    if (error || !data || !data.text) {
      console.warn("Fallo el filtro de estilo, usando estilo por defecto");
      return category === 'hijo' ? "Lullaby, Soft Piano" : "Pop romántico acústico";
    }

    let cleanText = data.text.trim();
    cleanText = cleanText.replace(/^["']|["']$/g, '');
    
    return cleanText;
  } catch (error) {
    console.error("Error in cleanStylePrompt:", error);
    return category === 'hijo' ? "Lullaby, Soft Piano" : "Pop acústico emocional";
  }
}

export async function generateDetailsPrompt(context: string, category: string): Promise<{
  title: string, subtitle: string, placeholder: string,
  familyTitle: string, familySubtitle: string, familyPlaceholder: string
}> {
  try {
    const prompt = `Basado en la siguiente idea inicial para una canción: "${context}"
    Categoría seleccionada por el usuario: "${category}"
    
    Genera dos conjuntos de textos para nuestro formulario web interactivo.
    1. Textos para pedir detalles generales y la historia.
    2. Textos específicos para pedir nombres de familiares o personas cercanas relevantes a la historia adaptado exactamente al tipo de relación ("${category}"). ¡Si es "papa", pide por hijos/esposa, si es pareja pide por detalles de la relación!
    
    RESPONDE EXACTAMENTE CON UN JSON VÁLIDO CON ESTA ESTRUCTURA (SIN TEXTO ANTES NI DESPUÉS):
    {
      "title": "Nombres y la historia...",
      "subtitle": "¿Cómo se llama? ¿De dónde es? ¿Qué cosas específicas no pueden faltar en la canción?",
      "placeholder": "Ej: Se llama Juan, creció en Veracruz, es muy trabajador...",
      "familyTitle": "Familiares y personas importantes",
      "familySubtitle": "¿Cómo se llaman su esposa e hijos? (Opcional pero recomendado)",
      "familyPlaceholder": "Ej: Su esposa María y sus hijos Leo y Sofía..."
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
      placeholder: parsed.placeholder || "Ej: Tienen 3 hijos, se conocieron en la playa...",
      familyTitle: parsed.familyTitle || "Familiares y personas importantes",
      familySubtitle: parsed.familySubtitle || "¿Cómo se llaman las personas que giran a su alrededor? (Opcional pero recomendado)",
      familyPlaceholder: parsed.familyPlaceholder || "Ej: Su pareja, sus hijos o sus mejores amigos..."
    };
  } catch (error) {
    console.error("Error generating details prompt:", error);
    return {
      title: "Nombres, lugares y la historia",
      subtitle: "¿Cómo se llaman? ¿Dónde se conocieron? ¿Hay algo específico que mencionar?",
      placeholder: "Ej: Él se llama Carlos y ella Ana, se conocieron en Madrid. Tienen 3 hijos...",
      familyTitle: "Familiares y personas importantes",
      familySubtitle: "¿Cómo se llaman las personas que giran a su alrededor? (Opcional pero recomendado)",
      familyPlaceholder: "Ej: Su pareja, sus hijos o sus mejores amigos..."
    };
  }
}

export async function generateTributeQuestions(
  story: string, 
  answers: string[], 
  recipientName: string
): Promise<string[]> {
  const prompt = `Actúa como un biógrafo experto y cálido. Estamos construyendo un "Legado Digital" (Línea del tiempo, Valores y Testimonios) para honrar a ${recipientName}.
Historia previa: "${story}"
Detalles ya conocidos: "${answers.join(" | ")}"

Tu objetivo es formular EXACTAMENTE 5 preguntas conversacionales, directas y altamente personalizadas para extraer la información DURA que FALTA para completar su biografía.

REGLAS VITALES:
1. Dirígete al usuario en segunda persona (tú) y usa el nombre "${recipientName}" en las preguntas para que se sientan hechas a la medida.
2. NO pidas información que ya está en la "Historia previa" o "Detalles ya conocidos". Si ya sabemos dónde nació, pregúntale por su primer trabajo o reto.
3. Necesitamos datos específicos: Fechas (años) clave para la línea de tiempo, nombres de familiares (si faltan), y virtudes principales.
4. Tono emotivo pero enfocado en obtener respuestas concretas.

RESPONDE ÚNICAMENTE CON UN ARRAY JSON DE 5 STRINGS (sin markdown extra). Ejemplo:
[
  "Mencionaste que ${recipientName} empezó a trabajar muy joven, ¿en qué año fue eso y cuál fue su primer gran logro?",
  "¿Cuáles dirías que son los 3 valores más grandes que lo definen?",
  "¿Cómo se llaman las personas más importantes en su vida actualmente (esposa, hijos)?",
  "¿Cuál ha sido el mayor obstáculo que ${recipientName} tuvo que superar?",
  "Si pudieras resumir su legado en una frase corta que él siempre dice, ¿cuál sería?"
]`;

  try {
    const { data, error } = await supabase.functions.invoke('generate-lyrics', { body: { prompt } });
    if (error) throw error;
    if (!data || !data.text) throw new Error("La IA no devolvió texto");

    const text = data.text;
    const startIndex = text.indexOf('[');
    const endIndex = text.lastIndexOf(']');
    if (startIndex === -1 || endIndex === -1) throw new Error("No se encontró Array JSON");

    const jsonStr = text.substring(startIndex, endIndex + 1);
    const parsedQuestions = JSON.parse(jsonStr) as string[];
    
    if (parsedQuestions.length !== 5) {
      // Fallback if not exactly 5
      return parsedQuestions.slice(0, 5);
    }
    return parsedQuestions;
  } catch (error) {
    console.error("Error generating tribute questions:", error);
    return [
      `¿En qué año nació ${recipientName} y dónde creció?`,
      `¿Cuáles dirías que son los 3 mayores valores o virtudes de ${recipientName}?`,
      `Nombra a sus familiares más cercanos (hijos, esposa, etc.)`,
      `¿Cuál ha sido el mayor sacrificio o reto superado por ${recipientName}?`,
      `Si pudieras resumir su legado en una frase corta, ¿cuál sería?`
    ];
  }
}

export interface InfographicData {
  theme: string;
  archetype: string;
  timeline: { title: string; subtitle: string; icon: string }[];
  shields: { name: string; icon: string }[];
  nameMeaning: { name: string; meaning: string };
  lastNameMeaning: { lastName: string; meaning: string };
  quote: string;
  familyMembers: string[];
  testimonials: { text: string }[];
}

export async function generateInfographicData(
  story: string, 
  answers: string[], 
  recipientName: string, 
  archetype: string, 
  theme: string
): Promise<InfographicData> {
  const prompt = `Analiza la historia y las respuestas de esta entrevista para crear una Infografía "Historia de Vida".
Homenajeado: "${recipientName}"
Arquetipo: ${archetype}
Historia Inicial: "${story}"
Detalles Adicionales (Respuestas de la entrevista): "${answers.join(" | ")}"

Extrae los datos y RESPONDE EXACTAMENTE CON UN JSON VÁLIDO CON ESTA ESTRUCTURA (SIN TEXTO ANTES NI DESPUÉS):
{
  "theme": "${theme}",
  "archetype": "${archetype}",
  "timeline": [
    // ¡DEBES CREAR EXACTAMENTE 5 ELEMENTOS PARA LA LÍNEA DEL TIEMPO, NO MÁS, NO MENOS!
    {"title": "INFANCIA", "subtitle": "Donde empezó su historia...", "icon": "Home"}
  ],
  "shields": [
    // CREA EXACTAMENTE 5 VALORES O VIRTUDES (Ej: TRABAJO, HONESTIDAD, FAMILIA, PERSEVERANCIA, GENEROSIDAD)
    {"name": "Valor humano", "icon": "Hammer"}
  ],
  "nameMeaning": {
    "name": "Primer nombre", 
    "meaning": "Escribe el origen real primero. LUEGO AGREGA UN SALTO DE LÍNEA DOBLE (\\n\\n). Luego escribe una frase poética sobre cómo él honra ese nombre."
  },
  "lastNameMeaning": {
    "lastName": "Primer apellido", 
    "meaning": "Escribe el origen de su apellido. LUEGO AGREGA UN SALTO DE LÍNEA DOBLE (\\n\\n). Luego escribe una frase sobre cómo lo lleva con orgullo."
  },
  "quote": "Una frase poética de 10 a 15 palabras que resuma su legado o historia.",
  "familyMembers": [
    // EXTRAE LOS NOMBRES EXACTOS DE LOS FAMILIARES (hijos, esposa, nietos) MENCIONADOS EN LA HISTORIA. Si no hay, pon "Su Familia".
    "Nombre 1", "Nombre 2"
  ], 
  "testimonials": [
    // REFINA Y MEJORA LO QUE DIJO EL USUARIO. No copies y pegues. Haz que suene muy profesional, pulido y emotivo, como la dedicatoria de un libro.
    {"text": "Testimonio o anécdota refinada."}
  ]
}

NOTAS:
- USA ÚNICAMENTE NOMBRES COMPATIBLES CON LUCIDE-REACT para los iconos (ej: Home, Briefcase, Hammer, Users, Star, Heart, Mountain, Feather, TreeDeciduous, Award).
- Todo debe estar en español y ser muy emotivo.`;

  try {
    const { data, error } = await supabase.functions.invoke('generate-lyrics', { body: { prompt } });
    if (error) throw error;
    if (!data || !data.text) throw new Error("La IA no devolvió texto");

    const text = data.text;
    const startIndex = text.indexOf('{');
    const endIndex = text.lastIndexOf('}');
    if (startIndex === -1 || endIndex === -1) throw new Error("No se encontró JSON en la respuesta");

    const jsonStr = text.substring(startIndex, endIndex + 1);
    return JSON.parse(jsonStr) as InfographicData;
  } catch (error) {
    console.error("Error in Tribute Generator:", error);
    return {
      theme: theme || "legacy",
      archetype: archetype || "LEGACY",
      timeline: [
        {title: "INICIOS", subtitle: "Donde comenzó todo.", icon: "Home"},
        {title: "CAMINO", subtitle: "Paso a paso forjando la historia.", icon: "Compass"},
        {title: "ESFUERZO", subtitle: "Superando cada obstáculo.", icon: "Mountain"},
        {title: "UNIÓN", subtitle: "El valor de estar juntos.", icon: "Heart"},
        {title: "HOY", subtitle: "Una historia digna de contar.", icon: "Star"}
      ],
      shields: [
        {name: "VALOR", icon: "Flame"},
        {name: "HONESTIDAD", icon: "Heart"},
        {name: "FAMILIA", icon: "Users"},
        {name: "PERSEVERANCIA", icon: "Mountain"},
        {name: "BONDAD", icon: "Sun"}
      ],
      nameMeaning: {name: recipientName.split(' ')[0] || "Tu Nombre", meaning: "Valioso, de gran estima, digno de alabanza."},
      lastNameMeaning: {lastName: recipientName.split(' ')[1] || "Tu Apellido", meaning: "De origen noble, lleno de historia."},
      quote: "Una historia que construyó mucho más que recuerdos, construyó un legado.",
      familyMembers: ["Tu Familia"],
      testimonials: [
        {text: "Su ejemplo y sus valores dejaron huellas en nuestros corazones."}
      ]
    };
  }
}
