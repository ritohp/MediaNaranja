import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Music, Sparkles, BookOpen, User, Mic, Target, CalendarDays, Lock, ArrowLeft, RefreshCw, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { generateLyrics, generateInterviewQuestions } from '../services/ai';
import type { User as SupabaseUser } from '@supabase/supabase-js';

export default function CreateSong() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [tokens, setTokens] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1); // 1: Form, 2: Lyrics Workshop, 3: Music Studio
  const [isGenerating, setIsGenerating] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [currentSongId, setCurrentSongId] = useState<string | null>(null);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [generationStatus, setGenerationStatus] = useState<'idle' | 'generating' | 'completed' | 'error'>('idle');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoginLoading, setIsLoginLoading] = useState(false);

  // NUEVOS ESTADOS PARA ENTREVISTA DINÁMICA
  const [formPhase, setFormPhase] = useState<'spark' | 'interview'>('spark');
  const [initialContext, setInitialContext] = useState('');
  const [aiQuestions, setAiQuestions] = useState<string[]>([]);
  const [interviewAnswers, setInterviewAnswers] = useState<Record<string, string>>({});
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);

  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem('mn_draft_song');
    return saved ? JSON.parse(saved) : {
      genero: 'romantica',
      idioma: 'espanol',
      mensajeHablado: '',
      detallePerfecto: ''
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

  const buildPrompt = (data: typeof formData, answers: Record<string, string>, context: string, feedbackText?: string, previousLyrics?: string) => {
    let contextSummary = `Idea Inicial: ${context}\n\nDetalles de la Entrevista:\n`;
    Object.entries(answers).forEach(([q, a]) => {
      contextSummary += `- Pregunta: ${q}\n  Respuesta: ${a}\n`;
    });

    const basePrompt = `Eres un compositor experto para "Media Naranja". 
    Genera la letra completa de una canción siguiendo estos datos, estructurada con [Verse 1], [Chorus], [Verse 2], [Spoken Word], [Chorus], [Bridge], [Outro].
    
    CONTEXTO Y DETALLES EMOCIONALES:
    ${contextSummary}
    
    MENSAJE HABLADO (Para la sección [Spoken Word]):
    "${data.mensajeHablado}"
    
    ESTILO Y FORMATO:
    - Estilo Musical deseado: ${data.genero}
    - Idioma: ${data.idioma}
    - Toque final: ${data.detallePerfecto}
    
    INSTRUCCIÓN CRÍTICA:
    1. Incorpora los detalles de las respuestas en la lírica de forma fluida y natural, no los copies literalmente.
    2. La sección [Spoken Word] debe contener el mensaje hablado proporcionado, ajustado para que suene natural si es necesario.
    3. Responde ÚNICAMENTE con la letra estructurada.`;

    if (feedbackText && previousLyrics) {
      return `${basePrompt}\n\nLETRA ACTUAL:\n${previousLyrics}\n\nPETICIÓN DE CAMBIO DEL USUARIO:\n${feedbackText}\n\nPor favor, genera una nueva versión mejorada siguiendo estas instrucciones.`;
    }
    return basePrompt;
  };

  const handleStartInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!initialContext.trim()) return;
    
    setIsGeneratingQuestions(true);
    try {
      const questions = await generateInterviewQuestions(initialContext);
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
          style_prompt: formData.genero,
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
        await supabase.from('mn_songs').update({ lyrics: newLyrics }).eq('id', currentSongId);
      }
    } catch (error) {
      alert("Error reescribiendo la letra.");
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

      const isTestMode = false;
      const { generateMusicTask, checkMusicStatus } = await import('../services/music');
      
      let taskId;
      if (isTestMode) {
        taskId = "mock-task-id-" + Date.now();
      } else {
        taskId = await generateMusicTask(lyrics, formData.genero, `Canción para ${formData.nombreDestinatario}`);
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
          const song = sunoData[0];
          if (song.audioUrl) {
            clearInterval(pollInterval);
            try {
              let finalUrl = song.audioUrl;
              const { data: treatmentData } = await supabase.functions.invoke('process-audio', {
                body: { originalUrl: song.audioUrl, songId: currentSongId, taskId }
              });
              finalUrl = treatmentData?.demoUrl || song.audioUrl;
              setAudioUrl(finalUrl);
              setGenerationStatus('completed');
              if (currentSongId) {
                await supabase.from('mn_songs').update({ 
                  audio_url: song.audioUrl,
                  demo_url: finalUrl,
                  status: 'completed'
                }).eq('id', currentSongId);
              }
            } catch (err) {
              setAudioUrl(song.audioUrl);
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

      <div className="max-w-5xl w-full bg-white/90 backdrop-blur-md p-6 md:p-12 rounded-[2rem] shadow-2xl border border-blush-50 relative z-10">
        
        {step === 1 && (
          <div className="space-y-12">
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-naranja-50 text-naranja-500 mb-6 border border-naranja-100"><Music size={32} /></div>
              <h1 className="text-4xl md:text-5xl mb-4 font-serif text-blush-800">Crea tu <span className="text-naranja-500 italic">Obra Maestra</span></h1>
              <p className="text-ink-600/70 text-lg font-light max-w-2xl mx-auto">Cuéntanos tu historia y deja que nuestra IA diseñe la entrevista perfecta para tu canción.</p>
            </div>

            {formPhase === 'spark' ? (
              <form onSubmit={handleStartInterview} className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-700">
                <div className="bg-white p-10 rounded-[3rem] border-2 border-naranja-100 shadow-xl space-y-6">
                  <h3 className="text-2xl font-serif text-blush-800 flex items-center gap-3"><Sparkles className="text-naranja-500" /> ¿Cuál es la chispa inicial?</h3>
                  <p className="text-ink-600/70 text-sm italic">Ejemplo: "Es una canción para mi abuelo que cumple 80 años, fue agricultor y ama a su familia".</p>
                  <textarea 
                    value={initialContext}
                    onChange={(e) => setInitialContext(e.target.value)}
                    placeholder="Escribe aquí de qué se trata la canción y para quién es..."
                    className="w-full h-40 bg-blush-50/50 border border-blush-200 rounded-3xl p-6 outline-none focus:ring-2 focus:ring-naranja-400 text-lg font-medium resize-none transition-all"
                    required
                  ></textarea>
                  <button type="submit" disabled={isGeneratingQuestions || !initialContext.trim()} className="w-full py-5 bg-naranja-500 text-white rounded-2.5xl font-bold text-lg tracking-widest hover:bg-naranja-600 transition shadow-lg disabled:opacity-50 flex items-center justify-center gap-3">
                    {isGeneratingQuestions ? <RefreshCw className="animate-spin" /> : <Sparkles />}
                    {isGeneratingQuestions ? "DISEÑANDO ENTREVISTA..." : "SIGUIENTE PASO"}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleStartLyrics} className="space-y-10 animate-in slide-in-from-right-8 duration-700">
                <button onClick={() => setFormPhase('spark')} className="flex items-center gap-2 text-blush-500 hover:text-naranja-500 transition-colors font-bold text-xs uppercase tracking-widest mb-4"><ArrowLeft size={16} /> Cambiar idea inicial</button>
                
                <div className="text-center pb-6">
                  <h2 className="text-3xl font-serif text-blush-800">El Corazón de tu Historia</h2>
                  <p className="text-ink-600/70 mt-2">La IA ha preparado estas preguntas para profundizar en tus sentimientos.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {aiQuestions.map((q, i) => (
                    <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-blush-100 shadow-sm hover:shadow-md transition-shadow space-y-4">
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
                  <div className="md:col-span-2 bg-gradient-to-br from-naranja-50 to-pink-50 p-10 rounded-[3rem] border border-naranja-100 shadow-sm space-y-6">
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

                  {/* ESTILO MUSICAL */}
                  <div className="md:col-span-2 bg-blush-50/20 p-8 rounded-[3rem] border border-blush-100/50">
                    <h3 className="text-2xl font-serif text-blush-800 mb-6 flex items-center gap-3"><Target size={24} className="text-naranja-500"/> Personalización Final</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-blush-600 uppercase tracking-wider">Género</label>
                        <select name="genero" value={formData.genero} onChange={handleChange} className="w-full bg-white border border-blush-200 rounded-xl px-4 py-3 outline-none">
                          <option value="romantica">Romántica</option>
                          <option value="pop">Pop</option>
                          <option value="regional">Regional Mexicano</option>
                          <option value="acustico">Acústico / Guitarra</option>
                          <option value="bachata">Bachata</option>
                          <option value="urbano">Urbano / Reggaetón</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-blush-600 uppercase tracking-wider">Idioma</label>
                        <select name="idioma" value={formData.idioma} onChange={handleChange} className="w-full bg-white border border-blush-200 rounded-xl px-4 py-3 outline-none">
                          <option value="espanol">Español</option>
                          <option value="ingles">Inglés</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-blush-600 uppercase tracking-wider">Visión Perfecta</label>
                        <input type="text" name="detallePerfecto" value={formData.detallePerfecto} onChange={handleChange} placeholder="Ej. Que sea muy lenta..." className="w-full bg-white border border-blush-200 rounded-xl px-4 py-3 outline-none" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-10">
                  <button type="submit" disabled={isGenerating} className="w-full flex items-center justify-center gap-3 px-8 py-6 bg-gradient-to-r from-naranja-500 to-naranja-600 text-white rounded-2.5xl font-bold text-xl tracking-widest hover:brightness-110 transition-all shadow-xl disabled:opacity-50">
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
                  <p>• Género: {formData.genero}</p>
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
                          alert("Llevándote a finalizar pedido...");
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
                  <audio 
                    key={audioUrl}
                    src={audioUrl}
                    controls 
                    controlsList="nodownload" 
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
                      onClick={() => alert("¡Llevándote a la pasarela de pago para desbloquear!")}
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
                <h2 className="text-3xl font-serif text-blush-800 mb-4">Algo no salió como esperábamos</h2>
                <p className="text-ink-600/70 mb-8 max-w-md mx-auto">Tuvimos un problema técnico en el estudio. No te preocupes, tus tokens no se han perdido.</p>
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
