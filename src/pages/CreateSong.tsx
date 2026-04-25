import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Music, Sparkles, BookOpen, User, Users, Heart, Baby, Mic, Target, CalendarDays, Lock, ArrowLeft, RefreshCw, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { generateLyrics, generateInterviewQuestions, cleanStylePrompt, generateDetailsPrompt } from '../services/ai';
import type { User as SupabaseUser } from '@supabase/supabase-js';

export default function CreateSong() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [tokens, setTokens] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Recuperar borrador si existe
  const savedDraft = localStorage.getItem('mn_draft_song');
  const parsedDraft = savedDraft ? JSON.parse(savedDraft) : null;

  const [step, setStep] = useState(parsedDraft?.step || 1); 
  const [lyrics, setLyrics] = useState(parsedDraft?.lyrics || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [currentSongId, setCurrentSongId] = useState<string | null>(parsedDraft?.currentSongId || null);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioUrl2, setAudioUrl2] = useState<string | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<1 | 2>(1);
  const [generationStatus, setGenerationStatus] = useState<'idle' | 'generating' | 'completed' | 'error'>('idle');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoginLoading, setIsLoginLoading] = useState(false);

  // NUEVOS ESTADOS PARA ENTREVISTA DINÁMICA
  const [formPhase, setFormPhase] = useState<'spark' | 'details' | 'interview'>(parsedDraft ? 'interview' : 'spark');
  const [initialContext, setInitialContext] = useState(parsedDraft?.initialContext || '');
  const [isGeneratingDetailsPrompt, setIsGeneratingDetailsPrompt] = useState(false);
  const [detailsPrompt, setDetailsPrompt] = useState({
    title: "Nombres, lugares y la historia",
    subtitle: "¿Cómo se llaman? ¿Dónde se conocieron? ¿Hay algo específico que debemos mencionar en la canción?",
    placeholder: "Ej: Él se llama Carlos y ella Ana, se conocieron en Madrid. Tienen 3 hijos..."
  });
  const [aiQuestions, setAiQuestions] = useState<string[]>([]);
  const [interviewAnswers, setInterviewAnswers] = useState<Record<string, string>>(parsedDraft?.interviewAnswers || {});
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);

  const [formData, setFormData] = useState(() => {
    const parsed = parsedDraft || {};
    return {
      category: parsed.category || 'otro',
      childName: parsed.childName || '',
      birthDate: parsed.birthDate || '',
      mensajeHablado: parsed.mensajeHablado || '',
      specificDetails: parsed.specificDetails || '',
      moodAndStyle: parsed.moodAndStyle || '',
      finalStylePrompt: parsed.finalStylePrompt || ''
    };
  });

  const [lyrics, setLyrics] = useState('');

  // AUTO-GUARDADO: Guardar en localStorage cada vez que el form cambie
  useEffect(() => {
    localStorage.setItem('mn_draft_song', JSON.stringify(formData));
  }, [formData]);

  const ensureProfile = async (userId: string, userEmail?: string) => {
    // Intentar traer el perfil
    const { data: profile, error } = await supabase
      .from('mn_profiles')
      .select('tokens_balance')
      .eq('id', userId)
      .single();

    if (error && error.code === 'PGRST116') {
      // SI NO EXISTE EL PERFIL, CREARLO
      const { data: newProfile, error: createError } = await supabase
        .from('mn_profiles')
        .insert([{ 
           id: userId, 
           email: userEmail,
           tokens_balance: 3 // Regalo inicial
        }])
        .select()
        .single();
      
      if (!createError && newProfile) {
        setTokens(newProfile.tokens_balance);
      }
    } else if (!error && profile) {
      setTokens(profile.tokens_balance);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) ensureProfile(currentUser.id, currentUser.email);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        ensureProfile(currentUser.id, currentUser.email);
        setShowLoginModal(false);
      } else {
        setTokens(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const buildPrompt = (data: any, answers: Record<string, string>, context: string, feedbackText?: string, previousLyrics?: string) => {
    let contextSummary = `Categoría: ${data.category}\n`;
    contextSummary += `Idea Inicial: ${context}\n`;
    
    if (data.category === 'hijo') {
      contextSummary += `DATOS DEL NIÑO/A (OBLIGATORIO INCLUIR): \n`;
      contextSummary += `- Nombre: ${data.childName}\n`;
      contextSummary += `- Fecha de Nacimiento: ${data.birthDate}\n`;
      contextSummary += `INSTRUCCIÓN PARA NIÑO: La canción debe mencionar su nombre, el significado de su nombre (o un mensaje sobre su origen) y la importancia del día que nació.\n\n`;
    }

    if (data.specificDetails) {
      contextSummary += `Detalles Específicos Adicionales: ${data.specificDetails}\n`;
    }
    contextSummary += `\nHechos y Detalles Extraídos de la Entrevista:\n`;
    Object.values(answers).forEach((a, index) => {
      contextSummary += `- Detalle ${index + 1}: ${a}\n`;
    });

    const basePrompt = `Eres un compositor experto de canciones personalizadas. 
    Genera la letra completa de una canción siguiendo estos datos, estructurada con [Verse 1], [Chorus], [Verse 2], [Spoken Word], [Chorus], [Bridge], [Outro].
    
    CONTEXTO Y DETALLES EMOCIONALES:
    ${contextSummary}
    
    MENSAJE HABLADO (Para la sección [Spoken Word]):
    "${data.mensajeHablado}"
    
    ESTILO DE LA CANCIÓN DESEADO:
    ${data.moodAndStyle}
    
    INSTRUCCIONES CRÍTICAS DE REDACCIÓN:
    1. PROHIBICIÓN: No incluyas nunca la frase "Media Naranja" ni menciones a la plataforma en la letra. La canción debe ser 100% personal para el destinatario.
    2. NIÑOS/BEBÉS: Si la categoría es 'hijo', es MANDATORIO que investigues o deduzcas poéticamente el significado de su nombre "${data.childName}" y lo integres en un verso. Debe sentirse como una bendición o un regalo del destino.
    3. FLUIDEZ: Incorpora los detalles de las respuestas en la lírica de forma natural y poética.
    4. SPOKEN WORD: La sección [Spoken Word] debe contener el mensaje hablado proporcionado.
    5. Responde ÚNICAMENTE con la letra estructurada.`;

    if (feedbackText && previousLyrics) {
      return `Eres un compositor experto. REESCRIBE la siguiente canción basándote exclusivamente en el AJUSTE solicitado.
      
LETRA ACTUAL:
${previousLyrics}

AJUSTE SOLICITADO:
"${feedbackText}"

INSTRUCCIONES:
1. Mantén la estructura [Verse 1], [Chorus], etc.
2. Incorpora el ajuste de forma natural.
3. Responde ÚNICAMENTE con la nueva letra.`;
    }
    return basePrompt;
  };

  const handleProceedToDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!initialContext.trim()) return;
    
    if (formData.category === 'hijo') {
      if (!formData.childName?.trim() || !formData.birthDate?.trim()) {
        alert("Por favor, ingresa el nombre y la fecha de nacimiento.");
        return;
      }
    }
    
    setIsGeneratingDetailsPrompt(true);
    try {
      const prompt = await generateDetailsPrompt(initialContext);
      setDetailsPrompt({
        title: prompt.title || "Nombres, lugares y la historia",
        subtitle: prompt.subtitle || "¿Cómo se llaman? ¿Dónde se conocieron? ¿Hay algo específico que debemos mencionar?",
        placeholder: prompt.placeholder || "Ej: Él se llama Carlos y ella Ana, se conocieron en Madrid. Tienen 3 hijos..."
      });
    } catch (err) {
      console.error("Error al generar detalle base", err);
    } finally {
      setIsGeneratingDetailsPrompt(false);
      setFormPhase('details');
      window.scrollTo(0, 0);
    }
  };

  const handleStartInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!initialContext.trim() || !formData.specificDetails.trim() || !formData.moodAndStyle.trim()) return;
    
    setIsGeneratingQuestions(true);
    try {
      const combinedContext = `Idea base: ${initialContext}. Detalles: ${formData.specificDetails}. Estilo deseado: ${formData.moodAndStyle}`;
      const questions = await generateInterviewQuestions(combinedContext);
      setAiQuestions(questions);
      setFormPhase('interview');
      window.scrollTo(0, 0);
    } catch (error) {
      alert("Error al generar las preguntas. Por favor intenta de nuevo.");
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setIsLoginLoading(true);
    
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    
    if (signInError) {
      const { error: signUpError } = await supabase.auth.signUp({ email, password });
      if (signUpError) {
        alert("Error: " + signUpError.message);
      } else {
        alert("¡Cuenta casi lista! Por favor, confirma tu correo para crear tu canción. No te preocupes, tus datos están guardados.");
      }
    }
    setIsLoginLoading(false);
  };

  const handleStartLyrics = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setShowLoginModal(true);
      return;
    }

    if (tokens !== null && tokens <= 0) {
      alert("❌ No tienes tokens suficientes. ¡Adquiere más!");
      return;
    }

    setIsGenerating(true);
    try {
      const prompt = buildPrompt(formData, interviewAnswers, initialContext);
      const generatedLyrics = await generateLyrics(prompt);
      setLyrics(generatedLyrics);
      
      const { data } = await supabase
        .from('mn_songs')
        .insert([{
          user_id: user?.id,
          form_data: formData,
          lyrics: generatedLyrics,
          style_prompt: formData.moodAndStyle,
          status: 'draft'
        }])
        .select()
        .single();
      
      if (data) {
        setCurrentSongId(data.id);
        // LIMPIAR LOCALSTORAGE al tener éxito inicial
        localStorage.removeItem('mn_draft_song');
      }
      setStep(2);
      window.scrollTo(0, 0);
    } catch (error: any) {
      console.error("DEBUG AI ERROR:", error);
      alert(`Error llamando a la IA: ${error.message || "Error desconocido"}. Revisa tu internet o la API Key.`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRewrite = async () => {
    if (!feedback.trim()) return;
    setIsGenerating(true);
    try {
      const prompt = buildPrompt(formData, interviewAnswers, initialContext, feedback, lyrics);
      const generatedLyrics = await generateLyrics(prompt);
      setLyrics(generatedLyrics);
      setFeedback('');
      
      if (currentSongId) {
        await supabase.from('mn_songs').update({ lyrics: generatedLyrics }).eq('id', currentSongId);
      }
    } catch (error: any) {
      console.error("DEBUG REWRITE ERROR:", error);
      alert(`[DEBUG REWRITE]: ${error.message || "Error desconocido"}.`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleConfirmLyrics = async () => {
    if (tokens !== null && tokens <= 0) {
      alert("❌ No tienes tokens suficientes.");
      return;
    }

    setStep(3);
    setGenerationStatus('generating');
    window.scrollTo(0, 0);

    try {
      const { error: tokenError } = await supabase
        .from('mn_profiles')
        .update({ tokens_balance: (tokens || 0) - 1 })
        .eq('id', user?.id);
      
      if (tokenError) throw new Error("Error al procesar el token.");

      const cleanedStyle = await cleanStylePrompt(formData.moodAndStyle, formData.category);
      setFormData(prev => ({...prev, finalStylePrompt: cleanedStyle}));

      const isTestMode = false;
      const { generateMusicTask, checkMusicStatus } = await import('../services/music');
      
      let taskId;
      if (isTestMode) {
        taskId = "mock-task-id-" + Date.now();
      } else {
        taskId = await generateMusicTask(lyrics, cleanedStyle, 'Canción Original Media Naranja');
      }

      if (currentSongId) {
        await supabase.from('mn_songs')
          .update({ task_id: taskId, status: 'generating_music' })
          .eq('id', currentSongId);
      }

      let attempts = 0;
      const maxAttempts = 100;
      const pollInterval = setInterval(async () => {
        attempts++;
        let response;
        if (isTestMode) {
          response = { response: { sunoData: [{ audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' }] } };
        } else {
          try {
            response = await checkMusicStatus(taskId);
          } catch (e) {
            console.error("Polling error detected:", e);
            clearInterval(pollInterval);
            setGenerationStatus('error');
            return;
          }
        }
        
        const sunoData = response?.data?.response?.sunoData || response?.response?.sunoData;
        
        if (sunoData && sunoData.length > 0) {
          const song1 = sunoData[0];
          const song2 = sunoData.length > 1 ? sunoData[1] : null;

          if (song1.audioUrl) {
            clearInterval(pollInterval);
            try {
              let finalUrl1 = song1.audioUrl;
              const { data: treatmentData1 } = await supabase.functions.invoke('process-audio', {
                body: { originalUrl: song1.audioUrl, songId: currentSongId, taskId }
              });
              finalUrl1 = treatmentData1?.demoUrl || song1.audioUrl;

              let finalUrl2 = null;
              if (song2 && song2.audioUrl) {
                try {
                  const { data: treatmentData2 } = await supabase.functions.invoke('process-audio', {
                    body: { originalUrl: song2.audioUrl, songId: currentSongId, taskId }
                  });
                  finalUrl2 = treatmentData2?.demoUrl || song2.audioUrl;
                } catch (e) {
                  finalUrl2 = song2.audioUrl;
                }
              }

              setAudioUrl(finalUrl1);
              setAudioUrl2(finalUrl2);
              setGenerationStatus('completed');
              
              if (currentSongId) {
                const updatedFormData = {
                  ...formData,
                  finalStylePrompt: formData.finalStylePrompt || cleanedStyle,
                  version2: (song2 && song2.audioUrl) ? { 
                    audio_url: song2.audioUrl, 
                    demo_url: finalUrl2,
                    song_id: song2.id 
                  } : null
                };

                await supabase.from('mn_songs').update({ 
                  audio_url: song1.audioUrl,
                  demo_url: finalUrl1,
                  suno_id: song1.id,
                  form_data: updatedFormData,
                  status: 'completed'
                }).eq('id', currentSongId);
              }
            } catch (err) {
              console.error("Error post-procesando audios:", err);
              setAudioUrl(song1.audioUrl);
              setAudioUrl2(song2?.audioUrl || null);
              setGenerationStatus('completed');
            }
            fetchProfile(user!.id);
          }
        }
        if (attempts >= maxAttempts) {
          clearInterval(pollInterval);
          setGenerationStatus('error');
        }
      }, isTestMode ? 1000 : 7000); 
    } catch (error) {
      setGenerationStatus('error');
    }
  };

  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-naranja-500"></div>
    </div>
  );

  return (
    <div className="relative min-h-[80vh] flex flex-col items-center py-16 px-4 md:px-6">
      
      {showLoginModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-ink-950/40 backdrop-blur-md" onClick={() => setShowLoginModal(false)}></div>
          <div className="max-w-md w-full bg-white p-10 rounded-[2.5rem] shadow-2xl text-center border border-blush-100 relative z-10 animate-in zoom-in-95 duration-300">
            <button onClick={() => setShowLoginModal(false)} className="absolute top-6 right-6 text-blush-400 hover:text-naranja-500 transition-colors">✕</button>
            <div className="w-16 h-16 bg-blush-50 text-blush-400 rounded-full flex items-center justify-center mx-auto mb-6"><Lock size={32} /></div>
            <h2 className="text-3xl font-serif text-blush-800 mb-2">¡Casi Listo!</h2>
            <p className="text-ink-600/70 mb-8 text-sm leading-relaxed">Solo entra con tu email para procesar tu canción. <br/><span className="text-naranja-500 font-bold italic">¡No perderás nada de lo que escribiste!</span></p>
            
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <input 
                type="email" 
                placeholder="tu@email.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-4 bg-blush-50 border border-blush-200 rounded-xl outline-none focus:ring-2 focus:ring-naranja-400 transition-all text-center font-medium"
                required
              />
              <input 
                type="password" 
                placeholder="Escoge una contraseña" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-4 bg-blush-50 border border-blush-200 rounded-xl outline-none focus:ring-2 focus:ring-naranja-400 transition-all text-center font-medium"
                required
              />
              <button 
                type="submit" 
                disabled={isLoginLoading}
                className="w-full py-4 bg-naranja-500 text-white rounded-xl font-bold tracking-widest hover:bg-naranja-600 transition shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoginLoading ? <RefreshCw className="animate-spin" size={20} /> : "ENTRAR / REGISTRARSE"}
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="max-w-5xl w-full bg-white md:bg-white/90 md:backdrop-blur-md p-4 md:p-12 rounded-3xl md:rounded-[2rem] shadow-2xl border border-blush-50 relative z-10">
        
        {step === 1 && (
          <div className="space-y-12">
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-naranja-50 text-naranja-500 mb-6 border border-naranja-100"><Music size={32} /></div>
              <h1 className="text-4xl md:text-5xl mb-4 font-serif text-blush-800">Crea tu <span className="text-naranja-500 italic">Obra Maestra</span></h1>
              <p className="text-ink-600/70 text-lg font-light max-w-2xl mx-auto">Cuéntanos tu historia y deja que nuestra IA diseñe la entrevista perfecta para tu canción.</p>
            </div>

            {formPhase === 'spark' ? (
              <form onSubmit={handleProceedToDetails} className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-700">
                <div className="bg-white p-6 md:p-10 rounded-3xl md:rounded-[3rem] border-2 border-naranja-100 shadow-xl space-y-6">
                  <h3 className="text-xl md:text-2xl font-serif text-blush-800 flex items-center gap-3"><Sparkles className="text-naranja-500" /> ¿Para quién es esta canción?</h3>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                      { id: 'mama', label: 'Mamá', icon: <Heart size={14}/> },
                      { id: 'papa', label: 'Papá', icon: <User size={14}/> },
                      { id: 'pareja', label: 'Pareja', icon: <Users size={14}/> },
                      { id: 'hijo', label: 'Hijo/Niño', icon: <Baby size={14}/> },
                      { id: 'amigos', label: 'Amigos/Hermanos', icon: <Users size={14}/> },
                      { id: 'otro', label: 'Otro', icon: <Music size={14}/> },
                    ].map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, category: cat.id })}
                        className={`flex items-center gap-2 p-3 rounded-xl border text-[10px] font-bold uppercase tracking-wider transition-all ${formData.category === cat.id ? 'bg-naranja-500 text-white border-transparent shadow-md' : 'bg-white text-gray-500 border-gray-100 hover:border-naranja-200'}`}
                      >
                        {cat.icon} {cat.label}
                      </button>
                    ))}
                  </div>

                  {formData.category === 'hijo' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6 bg-indigo-50 rounded-2xl border border-indigo-100 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-indigo-700 uppercase tracking-widest">Nombre del niño/a *</label>
                        <input 
                          type="text"
                          name="childName"
                          value={formData.childName}
                          onChange={handleChange}
                          placeholder="Ej: Mateo"
                          className="w-full p-3 rounded-xl border border-indigo-200 outline-none focus:ring-2 focus:ring-indigo-400"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-indigo-700 uppercase tracking-widest">Fecha de nacimiento *</label>
                        <input 
                          type="date"
                          name="birthDate"
                          value={formData.birthDate}
                          onChange={handleChange}
                          className="w-full p-3 rounded-xl border border-indigo-200 outline-none focus:ring-2 focus:ring-indigo-400"
                          required
                        />
                      </div>
                      <p className="md:col-span-2 text-[10px] text-indigo-500 italic mt-1">
                        Esta información es clave para que la canción de cuna sea mágica e incluya su nombre y el día que llegó a tu vida.
                      </p>
                    </div>
                  )}

                  <h3 className="text-xl md:text-2xl font-serif text-blush-800 flex items-center gap-3 pt-4"><Sparkles className="text-naranja-500" /> ¿Cuál es la chispa inicial?</h3>
                  <p className="text-ink-600/70 text-sm italic">Ejemplo: "Es una canción para mi abuelo que cumple 80 años, fue agricultor y ama a su familia".</p>
                  <textarea 
                    value={initialContext}
                    onChange={(e) => setInitialContext(e.target.value)}
                    placeholder="Escribe aquí de qué se trata la canción..."
                    className="w-full h-40 bg-blush-50/50 border border-blush-200 rounded-3xl p-6 outline-none focus:ring-2 focus:ring-naranja-400 text-lg font-medium resize-none transition-all"
                    required
                  ></textarea>
                  <button type="submit" disabled={isGeneratingDetailsPrompt || !initialContext.trim()} className="w-full py-5 bg-naranja-500 text-white rounded-2.5xl font-bold text-lg tracking-widest hover:bg-naranja-600 transition shadow-lg disabled:opacity-50 flex items-center justify-center gap-3">
                    {isGeneratingDetailsPrompt ? <RefreshCw className="animate-spin" /> : <Sparkles />}
                    {isGeneratingDetailsPrompt ? "PREPARANDO..." : "SIGUIENTE PASO"}
                  </button>
                </div>
              </form>
            ) : formPhase === 'details' ? (
              <form onSubmit={handleStartInterview} className="max-w-2xl mx-auto space-y-8 animate-in slide-in-from-right-8 duration-700">
                <button onClick={() => setFormPhase('spark')} type="button" className="flex items-center gap-2 text-blush-500 hover:text-naranja-500 transition-colors font-bold text-xs uppercase tracking-widest mb-2"><ArrowLeft size={16} /> Volver a chispa inicial</button>
                
                <div className="bg-white p-6 md:p-10 rounded-3xl md:rounded-[3rem] border-2 border-naranja-100 shadow-xl space-y-8">
                  <div>
                    <h3 className="text-xl md:text-2xl font-serif text-blush-800 flex items-center gap-3"><BookOpen className="text-naranja-500" /> {detailsPrompt.title}</h3>
                    <p className="text-ink-600/70 text-sm italic mt-2">{detailsPrompt.subtitle}</p>
                    <textarea 
                      name="specificDetails"
                      value={formData.specificDetails || ''}
                      onChange={handleChange}
                      placeholder={detailsPrompt.placeholder}
                      className="w-full h-32 mt-4 bg-blush-50/50 border border-blush-200 rounded-2xl p-5 outline-none focus:ring-2 focus:ring-naranja-400 text-base resize-none transition-all"
                      required
                    ></textarea>
                  </div>
                  
                  <div>
                    <h3 className="text-xl md:text-2xl font-serif text-blush-800 flex items-center gap-3"><Music className="text-naranja-500" /> Género, tono y emoción</h3>
                    <p className="text-ink-600/70 text-sm italic mt-2">¿Cómo quieres que suene? (Con humor, cómica, poética, corrido bragado, o estilo Banda MS)</p>
                    <textarea 
                      name="moodAndStyle"
                      value={formData.moodAndStyle || ''}
                      onChange={handleChange}
                      placeholder="Ej: Quiero una cumbia rápida y alegre con un toque de humor, estilo Los Ángeles Azules..."
                      className="w-full h-32 mt-4 bg-blush-50/50 border border-blush-200 rounded-2xl p-5 outline-none focus:ring-2 focus:ring-naranja-400 text-base resize-none transition-all"
                      required
                    ></textarea>
                  </div>

                  <button type="submit" disabled={isGeneratingQuestions || !formData.specificDetails?.trim() || !formData.moodAndStyle?.trim()} className="w-full py-5 bg-naranja-500 text-white rounded-2.5xl font-bold text-lg tracking-widest hover:bg-naranja-600 transition shadow-lg disabled:opacity-50 flex items-center justify-center gap-3">
                    {isGeneratingQuestions ? <RefreshCw className="animate-spin" /> : <Sparkles />}
                    {isGeneratingQuestions ? "DISEÑANDO ENTREVISTA..." : "CONTINUAR"}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleStartLyrics} className="space-y-10 animate-in slide-in-from-right-8 duration-700">
                <button onClick={() => setFormPhase('details')} type="button" className="flex items-center gap-2 text-blush-500 hover:text-naranja-500 transition-colors font-bold text-xs uppercase tracking-widest mb-4"><ArrowLeft size={16} /> Volver a detalles</button>
                
                <div className="text-center pb-6">
                  <h2 className="text-3xl font-serif text-blush-800">El Corazón de tu Historia</h2>
                  <p className="text-ink-600/70 mt-2">La IA ha preparado estas 6 preguntas clave para profundizar en tus sentimientos.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                  {aiQuestions && aiQuestions.length > 0 && aiQuestions.map((q, i) => (
                    <div key={i} className="bg-white p-6 md:p-8 rounded-3xl md:rounded-[2.5rem] border border-blush-100 shadow-sm hover:shadow-md transition-shadow space-y-4">
                      <div className="flex items-center gap-3">
                         <span className="w-8 h-8 rounded-full bg-naranja-50 text-naranja-500 flex items-center justify-center text-xs font-black">{i + 1}</span>
                         <label className="text-sm font-bold text-blush-800 leading-tight">{q}</label>
                      </div>
                      <textarea 
                        value={interviewAnswers[q] || ''}
                        onChange={(e) => setInterviewAnswers({...interviewAnswers, [q]: e.target.value})}
                        className="w-full bg-blush-50/30 border border-blush-100 rounded-2xl p-4 text-sm outline-none focus:ring-2 focus:ring-naranja-400 h-24 resize-none"
                        required
                        placeholder="Tu respuesta aquí..."
                      ></textarea>
                    </div>
                  ))}

                  {/* CAMPO DE MENSAJE HABLADO */}
                  <div className="md:col-span-2 bg-gradient-to-br from-naranja-50 to-pink-50 p-6 md:p-10 rounded-3xl md:rounded-[3rem] border border-naranja-100 shadow-sm space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-white rounded-full text-naranja-500 shadow-sm"><Mic size={24} /></div>
                      <div>
                        <h4 className="text-xl font-serif text-blush-800 leading-none">Mensaje Hablado Especial</h4>
                        <p className="text-ink-600/70 text-xs mt-1 italic">Este texto se incluirá como una narración emotiva en medio de la canción.</p>
                      </div>
                    </div>
                    <textarea 
                      name="mensajeHablado"
                      value={formData.mensajeHablado}
                      onChange={handleChange}
                      placeholder="Escribe las palabras exactas que quieres que se escuchen (ej: 'Te amo con todo mi ser, nunca lo olvides...')"
                      className="w-full h-32 bg-white/80 border border-naranja-100 rounded-2xl p-6 outline-none focus:ring-2 focus:ring-naranja-400 text-base font-medium resize-none shadow-inner"
                    ></textarea>
                  </div>
                </div>

                <div className="pt-6 md:pt-10 text-center">
                  <button type="submit" disabled={isGenerating} className="w-full flex items-center justify-center gap-3 px-6 md:px-8 py-5 md:py-6 bg-gradient-to-r from-naranja-500 to-naranja-600 text-white rounded-2xl md:rounded-2.5xl font-bold text-lg md:text-xl tracking-widest hover:brightness-110 transition-all shadow-xl disabled:opacity-50">
                    {isGenerating ? <RefreshCw className="animate-spin" /> : <Sparkles />}
                    <span>{isGenerating ? "ESCRIBIENDO LETRA..." : "COMPONER LETRA AHORA"}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <button onClick={() => setStep(1)} className="flex items-center gap-2 text-blush-500 hover:text-naranja-500 transition-colors font-bold text-xs uppercase tracking-widest mb-8"><ArrowLeft size={16} /> Volver a los datos</button>
            <div className="text-center mb-10">
              <h2 className="text-4xl font-serif text-blush-800 mb-2">Taller Poético</h2>
              <p className="text-ink-600/70">Revisa la letra de Gemini. Puedes editarla a mano o pedirle cambios.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              <div className="lg:col-span-2">
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-naranja-400 to-pink-400 rounded-3.5xl blur opacity-20 transition duration-1000"></div>
                  <textarea 
                    value={lyrics} 
                    onChange={(e) => setLyrics(e.target.value)} 
                    className="relative w-full h-[600px] bg-white border border-blush-100 rounded-3xl p-10 font-serif text-lg leading-relaxed text-ink-700 shadow-sm focus:ring-1 focus:ring-naranja-200 outline-none resize-none"
                  ></textarea>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-naranja-50/50 p-6 rounded-3xl border border-naranja-100">
                  <h4 className="font-bold text-naranja-700 mb-2 flex items-center gap-2 italic"><Sparkles size={16} /> ¿Algún ajuste?</h4>
                  <p className="text-xs text-naranja-600/70 mb-4">Dile a la IA qué mejorar (ej: "Más intensidad", "Añade nuestro aniversario").</p>
                  <textarea 
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Escribe aquí..."
                    className="w-full bg-white border border-naranja-100 rounded-xl p-4 text-sm outline-none focus:ring-2 focus:ring-naranja-400 h-28"
                  ></textarea>
                  <button onClick={handleRewrite} disabled={isGenerating || !feedback.trim()} className="w-full mt-4 py-3 bg-white border-2 border-naranja-500 text-naranja-600 rounded-xl font-bold text-xs hover:bg-naranja-500 hover:text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                    {isGenerating ? <RefreshCw size={14} className="animate-spin" /> : <RefreshCw size={14} />} REESCRIBIR CON IA
                  </button>
                </div>

                <div className="bg-blush-50 p-6 rounded-3xl border border-blush-100 text-[10px] text-blush-500/80 uppercase font-bold tracking-widest space-y-3">
                  <p>• Estilo solicitado: {formData.moodAndStyle.substring(0, 50)}...</p>
                  <p>• Tokens: {tokens} disponibles</p>
                </div>

                <button onClick={handleConfirmLyrics} className="w-full py-5 bg-gradient-to-r from-naranja-500 to-naranja-600 text-white rounded-2.5xl font-bold text-lg tracking-widest hover:brightness-110 transition-all shadow-2xl flex items-center justify-center gap-3">
                  <CheckCircle2 size={24} /> ¡COMPLETAR CANCIÓN!
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="text-center py-16 animate-in zoom-in duration-700">
            {generationStatus === 'generating' ? (
              <>
                <div className="relative inline-block mb-10">
                  <div className="w-40 h-40 rounded-full border-8 border-naranja-50 border-t-naranja-500 animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center text-naranja-500"><Mic size={48} /></div>
                </div>
                <h2 className="text-4xl font-serif text-blush-800 mb-4">Estudio de Grabación</h2>
                <p className="text-ink-600/70 text-lg max-w-sm mx-auto mb-10 font-light">Kie.ai está grabando los instrumentos y las voces. Estaremos listos en 1-2 minutos.</p>
                <div className="w-full max-w-xs mx-auto bg-blush-50 h-3 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-naranja-400 to-naranja-600 h-full animate-pulse" style={{ width: '70%' }}></div>
                </div>
                <p className="mt-8 text-naranja-500 font-bold text-sm tracking-widest animate-pulse uppercase">Generando Magia...</p>
                <div className="mt-12">
                  <button 
                    onClick={() => {
                      setStep(2);
                      setGenerationStatus('idle');
                    }}
                    className="text-blush-400 hover:text-naranja-500 font-bold text-xs uppercase tracking-[0.2em] transition-colors"
                  >
                    × Cancelar y volver al taller
                  </button>
                </div>
              </>
            ) : generationStatus === 'completed' && audioUrl ? (
              <div className="max-w-2xl mx-auto space-y-10 relative">
                {showDemoModal && (
                  <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in zoom-in duration-300">
                    <div className="absolute inset-0 bg-ink-950/40 backdrop-blur-md" onClick={() => setShowDemoModal(false)}></div>
                    <div className="bg-white rounded-[3rem] p-10 md:p-14 max-w-lg w-full shadow-2xl relative z-10 border border-naranja-100 text-center space-y-6">
                      <div className="w-20 h-20 bg-naranja-50 text-naranja-500 rounded-full flex items-center justify-center mx-auto mb-2">
                        <Lock size={40} />
                      </div>
                      <h3 className="text-3xl font-serif text-blush-800">¡La magia continúa! ✨</h3>
                      <p className="text-ink-600 leading-relaxed">
                        Has escuchado el adelanto de 1 minuto. La versión completa contiene toda la letra personalizada y la mejor calidad de sonido para tu regalo.
                      </p>
                      <button 
                        onClick={() => {
                          setShowDemoModal(false);
                          window.location.href = `https://buy.stripe.com/dRm5kwcXzf2T7kgdI72Ry00?client_reference_id=${currentSongId}`;
                        }}
                        className="w-full py-5 bg-gradient-to-r from-naranja-500 to-naranja-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-naranja-200 hover:scale-105 transition-all"
                      >
                        DESBLOQUEAR AHORA
                      </button>
                      <button 
                        onClick={() => setShowDemoModal(false)}
                        className="text-ink-400 text-xs font-bold uppercase tracking-widest hover:text-naranja-500 transition-all"
                      >
                        SEGUIR ESCUCHANDO EL DEMO
                      </button>
                    </div>
                  </div>
                )}
                <div className="w-24 h-24 bg-naranja-50 text-naranja-500 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                  <Music size={40} />
                  <div className="absolute -bottom-1 -right-1 bg-white p-2 rounded-full shadow-lg text-amber-500">
                    <Lock size={16} />
                  </div>
                </div>
                <div>
                  <h2 className="text-4xl font-serif text-blush-800 mb-2">¡Muestra Lista! 🎨</h2>
                  <p className="text-ink-600/70 text-lg">Escucha un adelanto de tu canción personalizada.</p>
                  <div className="mt-2 inline-block px-4 py-1 bg-amber-50 text-amber-600 text-[10px] font-bold uppercase tracking-widest rounded-full border border-amber-100 italic">
                    Versión Demo (1 Minuto con Marca de Agua)
                  </div>
                </div>
                <div className="bg-white p-8 md:p-12 rounded-[2.5rem] border-2 border-naranja-100 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5">
                    <Music size={120} />
                  </div>
                  
                  {/* Selector de Versiones */}
                  {audioUrl2 && (
                    <div className="flex bg-blush-50 p-1.5 rounded-2xl mb-8 relative z-10">
                      <button 
                        onClick={() => setSelectedVersion(1)}
                        className={`flex-1 py-3 rounded-xl font-bold text-xs transition-all ${selectedVersion === 1 ? 'bg-white text-naranja-600 shadow-sm' : 'text-blush-400'}`}
                      >
                        OPCIÓN 1
                      </button>
                      <button 
                        onClick={() => setSelectedVersion(2)}
                        className={`flex-1 py-3 rounded-xl font-bold text-xs transition-all ${selectedVersion === 2 ? 'bg-white text-naranja-600 shadow-sm' : 'text-blush-400'}`}
                      >
                        OPCIÓN 2
                      </button>
                    </div>
                  )}

                  <audio 
                    key={selectedVersion === 1 ? audioUrl : audioUrl2}
                    src={selectedVersion === 1 ? audioUrl! : audioUrl2!}
                    controls 
                    controlsList="nodownload" 
                    autoPlay
                    referrerPolicy="no-referrer"
                    onContextMenu={(e) => e.preventDefault()}
                    onTimeUpdate={(e) => {
                      if (e.currentTarget.currentTime >= 60) {
                        e.currentTarget.pause();
                        e.currentTarget.currentTime = 0;
                        setShowDemoModal(true);
                      }
                    }}
                    className="w-full mb-8 custom-audio-player"
                  >
                    Tu navegador no soporta el reproductor de audio.
                  </audio>
                  <div className="space-y-4 relative z-10">
                    <button 
                      onClick={() => window.location.href = `https://buy.stripe.com/dRm5kwcXzf2T7kgdI72Ry00?client_reference_id=${currentSongId}`}
                      className="w-full px-8 py-5 bg-gradient-to-r from-naranja-500 to-naranja-600 text-white rounded-2xl font-bold text-lg tracking-widest hover:scale-105 transition-all shadow-xl shadow-naranja-200 flex items-center justify-center gap-3"
                    >
                      DESBLOQUEAR CANCIÓN COMPLETA <Sparkles size={20} />
                    </button>
                    <p className="text-[10px] text-ink-400 font-medium">
                      Al comprar recibirás la versión original de alta fidelidad, de duración completa y sin voces de marca de agua.
                    </p>
                  </div>
                </div>
                <div className="pt-4">
                   <button onClick={() => setStep(1)} className="text-blush-400 text-xs font-bold hover:text-naranja-500 transition-all uppercase tracking-widest underline decoration-blush-200">
                    ¿PROBAR CON OTRA LETRA?
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-12">
                <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <RefreshCw size={40} />
                </div>
                <h2 className="text-2xl md:text-3xl font-serif text-blush-800 mb-4">Algo se complicó en el estudio</h2>
                <p className="text-ink-600/70 mb-8 max-w-md mx-auto">
                  Tuvimos un problema técnico o el tiempo de espera se agotó. 
                  <br/><br/>
                  <strong className="text-balance text-naranja-500 bg-naranja-50 p-2 rounded-lg inline-block text-sm">
                    ⚠️ Sin embargo, es muy probable que tu canción siga creándose en segundo plano. Incluso si hubo error aquí, por favor revisa el apartado "Mis Canciones" en un par de minutos. Podría ya estar terminada allí.
                  </strong>
                </p>
                <div className="flex flex-col gap-4 max-w-xs mx-auto">
                  <button onClick={() => setStep(2)} className="px-8 py-4 bg-blush-100 text-blush-800 rounded-2xl font-bold hover:bg-blush-200 transition">
                    VOLVER AL TALLER
                  </button>
                  <Link to="/mis-canciones" className="px-8 py-4 bg-naranja-500 text-white rounded-2xl font-bold hover:bg-naranja-600 transition shadow-lg inline-block">
                    VER MIS CANCIONES
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
