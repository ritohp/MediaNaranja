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
