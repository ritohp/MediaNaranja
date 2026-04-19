import { supabase } from '../lib/supabase';

export async function generateMusicTask(lyrics: string, style: string, title: string = "Mi Canción Personalizada") {
  try {
    const { data, error } = await supabase.functions.invoke('generate-music?action=generate', {
      body: { lyrics, style, title }
    });

    if (error) throw error;
    if (data.error) throw new Error(data.error);

    // Kie.ai anida el taskId dentro de un objeto 'data'
    return data.data?.taskId || data.taskId; 
  } catch (error: any) {
    console.error("Music Service Error (Task):", error);
    throw error;
  }
}

export async function checkMusicStatus(taskId: string) {
  try {
    const { data, error } = await supabase.functions.invoke(`generate-music?action=status&taskId=${taskId}`);

    if (error) {
      console.error("Status check error:", error);
      return null;
    }

    return data; 
  } catch (error) {
    console.error("Music Service Error (Status):", error);
    return null;
  }
}
