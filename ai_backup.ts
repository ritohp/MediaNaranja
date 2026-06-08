import { supabase } from '../lib/supabase';

export async function generateLyrics(prompt: string) {
  try {
    const { data, error } = await supabase.functions.invoke('generate-lyrics', {
      body: { prompt }
    });

    if (error) {
       console.error("Functions Invoke Error Details:", error);
       throw new Error(error.message || "Error desconocido en la IA");
    }

    if (!data || data.error) {
      throw new Error(data?.error || "La IA no devolvió contenido válido.");
    }

    return data.text;
  } catch (error: any) {
    console.error("Critical AI Services Error:", error);
    const detailedMessage = error?.message || "Error de conexión con la IA";
    throw new Error(`Detalle técnico: ${detailedMessage}`);
  }
}

// ==========================================
// AGENTE 1A: Chispa Analyzer (Fase 1 -> Fase 2)
// ==========================================
export interface ChispaAnalysis {
  detectedName: string;
  relationship: string;
  phase2Labels: {
    names: { title: string; subtitle: string; placeholder: string };
    family: { title: string; subtitle: string; placeholder: string };
    style: { title: string; subtitle: string; placeholder: string };
  };
}

export async function analyzeChispa(chispa: string): Promise<ChispaAnalysis> {
  const prompt = `Analiza este breve contexto ("chispa") sobre una canción a crear:
"${chispa}"

Extrae a quién va dirigida, qué relación tiene con el usuario (ej: padre, pareja, hijo, amigo) y crea etiquetas personalizadas para el siguiente formulario de 3 preguntas de la aplicación.
Si la chispa es muy breve y no dice quién es, asume que es para un "ser querido" en general y haz preguntas genéricas, PERO NUNCA asumas que es una pareja si no hay indicios de romance.

RESPONDE ÚNICAMENTE CON UN JSON VÁLIDO CON ESTA ESTRUCTURA EXACTA:
{
  "detectedName": "Nombre de la persona (o 'Tu ser querido')",
  "relationship": "Relación (ej: Papá, Pareja, Hijo, etc.)",
  "phase2Labels": {
    "names": { 
      "title": "Nombres y lugares clave", 
      "subtitle": "Pregunta sobre dónde crecieron o dónde sucedió la historia. (Ej: ¿Dónde creció tu papá Roberto?)", 
      "placeholder": "Ej: Roberto es de un rancho en Jalisco..."
    },
    "family": { 
      "title": "Personas importantes", 
      "subtitle": "Pregunta sobre quiénes más lo acompañan. (Ej: ¿Quiénes son los hijos o esposa de Roberto?)", 
      "placeholder": "Ej: Su esposa María y sus 3 hijos..."
    },
    "style": { 
      "title": "Género, tono y emoción", 
      "subtitle": "Pregunta sobre cómo quieren que suene. (Ej: ¿Qué música le gusta escuchar a tu papá?)", 
      "placeholder": "Ej: Un corrido ranchero o norteño alegre..."
    }
  }
}`;

  try {
    const { data, error } = await supabase.functions.invoke('generate-lyrics', { body: { prompt } });
    if (error) throw error;
    if (!data || !data.text) throw new Error("La IA no devolvió texto");
    
    const text = data.text;
    const startIndex = text.indexOf('{');
    const endIndex = text.lastIndexOf('}');
    if (startIndex === -1 || endIndex === -1) throw new Error("No se encontró JSON");
    
    // Limpiar string para evitar errores de parseo por saltos de línea mal escapados
    let jsonStr = text.substring(startIndex, endIndex + 1);
    jsonStr = jsonStr.replace(/\\n/g, "\\n").replace(/\\'/g, "\\'").replace(/\\"/g, '\\"').replace(/\\&/g, "\\&").replace(/\\r/g, "\\r").replace(/\\t/g, "\\t").replace(/\\b/g, "\\b").replace(/\\f/g, "\\f");
    
    // Quitar saltos de línea literales dentro del JSON que puedan romper el parseo
    jsonStr = jsonStr.replace(/[\u0000-\u0019]+/g,"");
    
    return JSON.parse(jsonStr) as ChispaAnalysis;
  } catch (err) {
    console.error("Error in Chispa Analyzer:", err);
    return {
      detectedName: "Tu Ser Querido",
      relationship: "Ser Querido",
      phase2Labels: {
        names: { title: "Nombres y lugares", subtitle: "¿Cómo se llama y dónde ocurre su historia?", placeholder: "Ej: Se llama Juan y es de México..." },
        family: { title: "Familiares y amigos", subtitle: "¿Quiénes son las personas más importantes a su alrededor?", placeholder: "Ej: Su familia, sus amigos..." },
        style: { title: "Género musical", subtitle: "¿Cómo quieres que suene la canción?", placeholder: "Ej: Estilo banda, balada..." }
      }
    };
  }
}

// ==========================================
// AGENTE 1B: Story Architect (Fase 2 -> Fase 3)
// ==========================================
export interface StoryAnalysis {
  archetype: "LEGACY" | "LOVE" | "DREAMS" | "CELEBRATION" | "MEMORIAL";
  theme: "legacy" | "love" | "dreams" | "celebration" | "memorial";
  summary: string;
  recipientName: string;
}

export async function analyzeStoryArchetype(story: string): Promise<StoryAnalysis> {
  const prompt = `Actúa como un Arquitecto de Historias experto. 
Analiza la siguiente historia proporcionada por el usuario:
"${story}"

Debes clasificar esta historia en uno de los siguientes 5 arquetipos:
- LEGACY (Padres, abuelos, mentores, historias de esfuerzo y vida)
- LOVE (Parejas, novios, esposos, bodas, aniversarios)
- DREAMS (Hijos, bebés, graduaciones, metas a futuro)
- CELEBRATION (Cumpleaños felices, jubilaciones, éxitos, fiestas)
- MEMORIAL (Homenajes póstumos, recuerdo de mascotas o seres queridos fallecidos)

Devuelve ÚNICAMENTE un objeto JSON válido con esta estructura exacta:
{
  "archetype": "LEGACY",
  "theme": "legacy", 
  "summary": "Resumen de 1 oración del núcleo emocional de la historia",
  "recipientName": "Nombre de la persona principal (si se menciona) o 'Tu ser querido'"
}`;

  try {
    const { data, error } = await supabase.functions.invoke('generate-lyrics', { body: { prompt } });
    if (error) throw error;
    if (!data || !data.text) throw new Error("La IA no devolvió texto");
    
    const text = data.text;
    const startIndex = text.indexOf('{');
    const endIndex = text.lastIndexOf('}');
    if (startIndex === -1 || endIndex === -1) throw new Error("No se encontró JSON en la respuesta");
    
    const jsonStr = text.substring(startIndex, endIndex + 1);
    return JSON.parse(jsonStr) as StoryAnalysis;
  } catch (err) {
    console.error("Error in Story Architect:", err);
    return { archetype: "LEGACY", theme: "legacy", summary: "Una historia de vida importante.", recipientName: "Tu Ser Querido" }; 
  }
}

// ==========================================
// AGENTE 2: Interview Builder
// ==========================================
export async function generateDynamicQuestions(archetype: string, story: string, recipientName: string): Promise<string[]> {
  const prompt = `Actúa como un compositor experto en extraer "Preguntas Detonadoras" (storytelling). Tu tono debe ser cálido, cotidiano y directo.
El usuario quiere hacer una canción sobre: ${recipientName}.
Historia base: "${story}"

Tu trabajo es formular EXACTAMENTE 6 preguntas detonadoras, profundas pero fáciles de entender, para sacar las mejores anécdotas para la canción y para un PÓSTER HOMENAJE.
REGLAS VITALES:
1. NUNCA hagas preguntas cerradas o limitadas (ej. NO preguntes: "¿Dónde se conocieron?"). 
2. SIEMPRE haz preguntas abiertas que inviten a contar historias detalladas (ej. SÍ pregunta: "Cuéntame sobre el día que se conocieron, ¿qué fue lo que más te llamó la atención?").
3. INCLUYE preguntas que logren extraer información clave para el PDF, pero de forma conversacional:
   - Fechas ("¿En qué año empezó esta gran historia y cómo recuerdas ese momento exacto?").
   - Valores ("Si tuvieras que describir su forma de ser contando una anécdota, ¿cuál nos contarías?").
   - Frases ("¿Cuáles son esas palabras o dichos que siempre repite?").
4. Dirígete al usuario de "tú a tú" y no repitas temas. Abarca: historia, anécdotas, personalidad y legado.

RESPONDE ÚNICAMENTE CON UN ARRAY JSON DE 6 STRINGS (preguntas). NO envuelvas en markdown.
Ejemplo: [
  "Cuéntame cómo empezó todo o en qué año comenzó esta historia, ¿qué detalle nunca vas a olvidar de ese inicio?",
  "Seguro tienen miles de historias, ¿pero cuál es esa anécdota chistosa o emotiva que siempre recuerdan con cariño?",
  "¿Cuáles son esas palabras, dichos o frases únicas que siempre dice ${recipientName}?",
  "Más allá de la rutina, ¿qué es lo que más le apasiona, le hace reír o le hace brillar los ojos?",
  "Todos pasamos por momentos duros, ¿recuerdas algún obstáculo que superó con esfuerzo y cómo lo logró?",
  "Si hoy tuvieras que agradecerle por el legado y lo que te ha enseñado, ¿qué le dirías con el corazón en la mano?"
]`;

  try {
    const { data, error } = await supabase.functions.invoke('generate-lyrics', { body: { prompt } });
    if (error) throw error;
    if (!data || !data.text) throw new Error("La IA no devolvió texto");

    const text = data.text;
    const startIndex = text.indexOf('[');
    const endIndex = text.lastIndexOf(']');
    if (startIndex === -1 || endIndex === -1) throw new Error("No se encontró Array JSON en la respuesta");

    const jsonStr = text.substring(startIndex, endIndex + 1);
    const questions = JSON.parse(jsonStr) as string[];
    
    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error("El JSON parseado no es un array válido");
    }
    
    return questions;
  } catch (err) {
    console.error("Error in Interview Builder:", err);
    return [
      "¿Cuál es el momento más feliz que recuerdas de esta historia?",
      "¿Qué detalle o cualidad hace que esta persona sea única?",
      "Si pudieras resumir lo que sientes en una frase, ¿cuál sería?"
    ];
  }
}

// ==========================================
// AGENTE 3: Tribute Generator
// ==========================================
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
    "meaning": "Escribe el origen histórico. LUEGO AGREGA UN SALTO DE LÍNEA DOBLE (\\n\\n). Luego añade: 'Pero para quienes lo conocen, [Apellido] significa: VALOR 1 • VALOR 2 • VALOR 3'"
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
