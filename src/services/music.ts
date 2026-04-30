import { supabase } from '../lib/supabase';

export async function generateMusicTask(lyrics: string, style: string, title: string = "Mi Canción Personalizada") {
  try {
    const { data, error } = await supabase.functions.invoke('generate-music?action=generate', {
      body: { lyrics, style, title }
    });

    if (error) throw error;
    if (data.error) throw new Error(data.error);

    const taskId = data.data?.taskId || data.taskId; 
    
    if (!taskId) {
      console.error("Kie AI Unexpected Response:", data);
      throw new Error(`Kie Error: ${data.msg || data.message || JSON.stringify(data)}`);
    }

    return taskId;
  } catch (error: any) {
    console.error("Music Service Error (Task):", error);
    throw error;
  }
}

export async function checkMusicStatus(taskId: string) {
  try {
    const { data, error } = await supabase.functions.invoke(`generate-music?action=status&taskId=${taskId}`);

    if (error) {
      console.error("Supabase Function Invoke Error (Status):", error);
      throw error;
    }

    // Kie.ai suele retornar un campo data o response
    const responseData = data?.data || data?.response || data;
    
    // Si Kie reporta error interno en la tarea
    if (responseData.code === 500 || responseData.status === 'error') {
      console.error("Kie AI Internal Task Error:", responseData);
      throw new Error("Kie AI failed to generate this song.");
    }

    return data; 
  } catch (error: any) {
    console.error("Music Service Error (Status):", error);
    throw error;
  }
}
