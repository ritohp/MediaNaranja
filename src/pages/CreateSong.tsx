import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Music, Sparkles, BookOpen, User, Users, Heart, Baby, Mic, Target, CalendarDays, Lock, ArrowLeft, RefreshCw, CheckCircle2, ExternalLink, Loader2, Camera, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { generateLyrics, generateInterviewQuestions, cleanStylePrompt, generateDetailsPrompt, generateInfographicData } from '../services/ai';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import TributeAddon from '../components/tribute/TributeAddon';
import VoiceRecorder from '../components/VoiceRecorder';

export default function CreateSong() {
  const navigate = useNavigate();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [tokens, setTokens] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Recuperar borrador si existe
  const savedDraft = localStorage.getItem('mn_draft_song');
  const parsedDraft = savedDraft ? JSON.parse(savedDraft) : null;

  // Adaptar estructura antigua (donde las propiedades del formulario estaban en la raíz)
  const isOldDraft = parsedDraft && !parsedDraft.formData && parsedDraft.category;
  const draftData = isOldDraft ? { formData: parsedDraft } : parsedDraft;

  // Determinar si el borrador guardado tiene progreso real
  const hasSavedProgress = !!(draftData && (
    (draftData.step && draftData.step > 1) ||
    (draftData.initialContext && draftData.initialContext.trim() !== '') ||
    (draftData.formData?.nombreDestinatario && draftData.formData.nombreDestinatario.trim() !== '') ||
    (draftData.formData?.specificDetails && draftData.formData.specificDetails.trim() !== '') ||
    (draftData.lyrics && draftData.lyrics.trim() !== '')
  ));

  const [step, setStep] = useState(draftData?.step || 1); 
  const [lyrics, setLyrics] = useState(draftData?.lyrics || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [currentSongId, setCurrentSongId] = useState<string | null>(draftData?.currentSongId || null);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioUrl2, setAudioUrl2] = useState<string | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<1 | 2>(1);
  const [generationStatus, setGenerationStatus] = useState<'idle' | 'generating' | 'completed' | 'error'>('idle');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoginLoading, setIsLoginLoading] = useState(false);

  // NUEVO: Tipo de embudo por el que entra el usuario (CRO)
  const [landingFlow, setLandingFlow] = useState<'standard' | 'direct-papa'>(() => {
    if (draftData?.landingFlow) return draftData.landingFlow;
    const params = new URLSearchParams(window.location.search);
    const urlFlow = params.get('flow') || params.get('c');
    const urlCategory = params.get('category');
    if (urlFlow === 'papa' || urlCategory === 'papa') {
      return 'direct-papa';
    }
    return 'standard';
  });

  const [showFullDetailsForm, setShowFullDetailsForm] = useState<boolean>(() => {
    if (draftData?.showFullDetailsForm !== undefined) return draftData.showFullDetailsForm;
    if (draftData?.formData?.nombreDestinatario) return true;
    return false;
  });

  // NUEVOS ESTADOS PARA ENTREVISTA DINÁMICA
  const [formPhase, setFormPhase] = useState<'spark' | 'details' | 'interview'>(() => {
    if (draftData?.formPhase) return draftData.formPhase;
    const params = new URLSearchParams(window.location.search);
    const urlFlow = params.get('flow') || params.get('c');
    const urlCategory = params.get('category');
    if (urlFlow === 'papa' || urlCategory === 'papa') {
      return 'details';
    }
    return 'spark';
  });
  const [initialContext, setInitialContext] = useState(draftData?.initialContext || '');
  const [isGeneratingDetailsPrompt, setIsGeneratingDetailsPrompt] = useState(false);
  const [detailsPrompt, setDetailsPrompt] = useState({
    title: "Nombres, lugares y la historia",
    subtitle: "¿Cómo se llaman? ¿Dónde se conocieron? ¿Hay algo específico que debemos mencionar en la canción?",
    placeholder: "Ej: Él se llama Carlos y ella Ana, se conocieron en Madrid. Tienen 3 hijos...",
    familyTitle: "Familiares y personas importantes",
    familySubtitle: "¿Cómo se llaman las personas que giran a su alrededor? (Opcional pero recomendado)",
    familyPlaceholder: "Ej: Su pareja, sus hijos o sus mejores amigos..."
  });
  const [aiQuestions, setAiQuestions] = useState<string[]>(draftData?.aiQuestions || []);
  const [interviewAnswers, setInterviewAnswers] = useState<Record<string, string>>(draftData?.interviewAnswers || {});
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);

  // Estados para Biografía Digital interactiva durante espera
  const [photoUrl, setPhotoUrl] = useState(draftData?.formData?.legacy_photo_url || '');
  const [isUploading, setIsUploading] = useState(false);
  const [customDedication, setCustomDedication] = useState(draftData?.formData?.custom_dedication || '');
  const [majorMilestone, setMajorMilestone] = useState(draftData?.formData?.major_milestone || '');
  const [isGeneratingBiography, setIsGeneratingBiography] = useState(false);
  const [biographyGenerated, setBiographyGenerated] = useState(false);
  const biographyGeneratedRef = useRef(biographyGenerated);
  useEffect(() => {
    biographyGeneratedRef.current = biographyGenerated;
  }, [biographyGenerated]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const urlCategory = params.get('category');
    const urlFlow = params.get('flow') || params.get('c');
    const data = draftData?.formData || {};
    return {
      category: (urlFlow === 'papa' || urlCategory === 'papa') ? 'papa' : (urlCategory || data.category || 'otro'),
      childName: data.childName || '',
      birthDate: data.birthDate || '',
      mensajeHablado: data.mensajeHablado || '',
      specificDetails: data.specificDetails || '',
      familyNames: data.familyNames || '',
      moodAndStyle: data.moodAndStyle || '',
      finalStylePrompt: data.finalStylePrompt || '',
      nombreDestinatario: data.nombreDestinatario || '',
      apellidoDestinatario: data.apellidoDestinatario || '',
      lugarOrigen: data.lugarOrigen || ''
    };
  });

  // AUTO-GUARDADO COMPLETO: Guarda todo el estado del borrador para no perder progreso
  useEffect(() => {
    const hasProgress = step > 1 || 
                        initialContext.trim() !== '' || 
                        formData.nombreDestinatario.trim() !== '' || 
                        formData.specificDetails.trim() !== '' ||
                        lyrics.trim() !== '';

    if (hasProgress) {
      const draft = {
        formData,
        step,
        lyrics,
        currentSongId,
        formPhase,
        initialContext,
        aiQuestions,
        interviewAnswers,
        landingFlow,
        showFullDetailsForm
      };
      localStorage.setItem('mn_draft_song', JSON.stringify(draft));
    } else {
      localStorage.removeItem('mn_draft_song');
    }
  }, [formData, step, lyrics, currentSongId, formPhase, initialContext, aiQuestions, interviewAnswers, landingFlow, showFullDetailsForm]);

  const handleClearDraft = () => {
    localStorage.removeItem('mn_draft_song');
    window.location.reload();
  };

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
    if (data.familyNames) {
      contextSummary += `Personas importantes (esposa, hijos, etc.): ${data.familyNames}\n`;
    }
    contextSummary += `\nHechos y Detalles Extraídos de la Entrevista:\n`;
    Object.values(answers).forEach((a, index) => {
      contextSummary += `- Detalle ${index + 1}: ${a}\n`;
    });

    const isTribute = data.category === 'papa';
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
    4. SPOKEN WORD: La sección [Spoken Word] debe contener el mensaje hablado proporcionado.${isTribute ? `\n    5. REGLAS DE FORMATO Y METATAGS (¡CRÍTICO PARA SUNO!): SUNO NO ENTIENDE INSTRUCCIONES DESCRIPTIVAS. NUNCA escribas frases narrativas dentro de los corchetes (por ejemplo, PROHIBIDO escribir: "[Baja la música, entra violín]"). Suno cantará ese texto por error. Si necesitas cambiar la música, usa ÚNICAMENTE metatags estructurales estándar de 1 o 2 palabras en inglés (ejemplo: [Break], [Guitar Solo], [Instrumental Interlude], [Drop], [Build], [Acapella]).
    6. PERSPECTIVA DEL NARRADOR: Canta desde la perspectiva de un observador ("él era...") o colectivo ("nuestro padre..."). Cuenta su historia en tercera persona, no le cantes directamente ("tú").` : `\n    5. METATAGS DE SUNO: NUNCA uses frases descriptivas en los corchetes (ej. "[Música suave]"). Suno lo cantará por error. Usa solo etiquetas cortas en inglés: [Verse], [Chorus], [Bridge], [Guitar Solo], [Break].`}
    ${isTribute ? '7' : '6'}. Responde ÚNICAMENTE con la letra estructurada.`;

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
      const prompt = await generateDetailsPrompt(initialContext, formData.category);
      setDetailsPrompt({
        title: prompt.title || "Nombres, lugares y la historia",
        subtitle: prompt.subtitle || "¿Cómo se llaman? ¿Dónde se conocieron? ¿Hay algo específico que debemos mencionar?",
        placeholder: prompt.placeholder || "Ej: Él se llama Carlos y ella Ana, se conocieron en Madrid. Tienen 3 hijos...",
        familyTitle: prompt.familyTitle || "Familiares y personas importantes",
        familySubtitle: prompt.familySubtitle || "¿Cómo se llaman las personas que giran a su alrededor? (Opcional pero recomendado)",
        familyPlaceholder: prompt.familyPlaceholder || "Ej: Su pareja, sus hijos o sus mejores amigos..."
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
    if (landingFlow === 'direct-papa') {
      if (!formData.nombreDestinatario.trim() || !formData.apellidoDestinatario.trim() || !formData.specificDetails.trim() || !formData.moodAndStyle.trim()) {
        alert("Por favor completa los campos obligatorios (*)");
        return;
      }
    } else {
      if (!initialContext.trim() || !formData.specificDetails.trim() || !formData.moodAndStyle.trim()) return;
    }
    
    setIsGeneratingQuestions(true);
    try {
      let finalContext = initialContext;
      if (landingFlow === 'direct-papa') {
        finalContext = `Homenaje de vida e historia para mi papá ${formData.nombreDestinatario} ${formData.apellidoDestinatario}, nacido en ${formData.lugarOrigen || 'México'} el ${formData.birthDate || 'desconocido'}. Sus seres queridos y familia: ${formData.familyNames || 'desconocido'}. Detalles e hitos de su vida: ${formData.specificDetails}`;
        setInitialContext(finalContext);
      }

      const combinedContext = `Idea base: ${finalContext}. Detalles: ${formData.specificDetails}. Familia: ${formData.familyNames}. Estilo deseado: ${formData.moodAndStyle}`;
      const { questions, extractedName } = await generateInterviewQuestions(combinedContext, formData.category);
      setAiQuestions(questions);
      
      // Si la IA encontró el nombre, lo guardamos si no está ya especificado por el usuario.
      if (extractedName) {
        setFormData(prev => ({
          ...prev,
          nombreDestinatario: prev.nombreDestinatario || extractedName,
          childName: prev.category === 'hijo' && prev.childName ? prev.childName : (prev.childName || extractedName)
        }));
      }

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
      if (signInError.message.includes('Invalid login credentials')) {
        // Podría ser un usuario nuevo o alguien que se equivocó de contraseña
        const { error: signUpError } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/crear-cancion?confirmed=true`
          }
        });
        if (signUpError) {
          if (signUpError.message.includes('already registered')) {
            alert("Contraseña incorrecta. Por favor intenta de nuevo.");
          } else {
            alert("Error: " + signUpError.message);
          }
        } else {
          alert("¡Cuenta casi lista! Por favor, revisa tu correo y confirma tu registro para poder continuar. No perderás tu progreso.");
        }
      } else {
        alert("Error de inicio de sesión: " + signInError.message);
      }
    }
    setIsLoginLoading(false);
  };

  const handleCheckout = () => {
    if (!currentSongId) {
      console.error("No currentSongId available for checkout!");
      alert("Hubo un problema al procesar el identificador de la canción. Por favor, ve a 'Mis Canciones' para realizar el pago de forma segura.");
      return;
    }
    window.location.href = `https://buy.stripe.com/dRm5kwcXzf2T7kgdI72Ry00?client_reference_id=${currentSongId}`;
  };

  const handleStartLyrics = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsGenerating(true);
    try {
      const prompt = buildPrompt(formData, interviewAnswers, initialContext);
      const generatedLyrics = await generateLyrics(prompt);
      setLyrics(generatedLyrics);
      
      // El borrador se mantiene en localStorage en el useEffect hasta confirmar la música
      setStep(2);
      window.scrollTo(0, 0);
    } catch (error: any) {
      console.error("Error generating lyrics:", error);
      const errMsg = error?.message || "";
      if (errMsg.includes("Bloqueo de Seguridad")) {
        alert("🔒 Filtro de Seguridad de Google AI:\n\nTu historia o algunas respuestas de la entrevista activaron los filtros de seguridad de la IA (por contener palabras sensibles relacionadas con armas, violencia o autolesión, incluso si son de juguete o anecdóticas).\n\nPor favor, cambia esas respuestas o detalles e inténtalo de nuevo.");
      } else if (errMsg.includes("GEMINI_ALERT [429]")) {
        alert("⏳ El servidor de IA está saturado en este momento debido a una alta cantidad de solicitudes.\n\nPor favor, espera unos segundos y vuelve a dar clic en 'COMPONER LETRA AHORA'.");
      } else {
        alert(`Hubo un problema al componer la letra:\n${errMsg.replace('Detalle técnico: ', '')}\n\nPor favor, verifica tus respuestas e inténtalo de nuevo.`);
      }
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
    } catch (error: any) {
      console.error("Error rewriting lyrics:", error);
      const errMsg = error?.message || "";
      if (errMsg.includes("Bloqueo de Seguridad")) {
        alert("🔒 Filtro de Seguridad de Google AI:\n\nEl ajuste solicitado activó los filtros de seguridad de la IA. Por favor, reformula tu petición evitando palabras sensibles e inténtalo de nuevo.");
      } else {
        alert(`Hubo un error al reescribir la letra:\n${errMsg.replace('Detalle técnico: ', '')}`);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const compressImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob((blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error("Canvas toBlob failed"));
            }
          }, 'image/jpeg', 0.8);
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentSongId) {
      alert("Por favor, espera a que se inicie el proceso de creación antes de subir la foto.");
      return;
    }

    try {
      setIsUploading(true);
      
      const compressedBlob = await compressImage(file);
      const compressedFile = new File([compressedBlob], `image.jpg`, { type: 'image/jpeg' });

      const fileName = `${currentSongId}-legacy-${Date.now()}.jpg`;
      const path = `${user?.id || 'anonymous'}/${fileName}`;

      const { error } = await supabase.storage
        .from('memories')
        .upload(path, compressedFile);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('memories')
        .getPublicUrl(path);

      setPhotoUrl(publicUrl);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Hubo un error al subir la imagen. Intenta con una imagen más pequeña.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleGenerateBiography = async () => {
    if (!currentSongId) return;
    setIsGeneratingBiography(true);
    try {
      const storyParts = [
        initialContext,
        formData.specificDetails,
        formData.familyNames ? `Familiares mencionados: ${formData.familyNames}` : null,
        formData.lugarOrigen ? `Origen: ${formData.lugarOrigen}` : null,
        formData.birthDate ? `Nacimiento: ${formData.birthDate}` : null
      ].filter(Boolean);
      const story = storyParts.join(". ");

      const combinedAnswers = [
        ...Object.values(interviewAnswers),
        customDedication ? `Dedicatoria especial: ${customDedication}` : null,
        majorMilestone ? `Mayor logro/hito: ${majorMilestone}` : null
      ].filter(Boolean) as string[];

      const infoData = await generateInfographicData(
        story,
        combinedAnswers,
        formData.nombreDestinatario || formData.childName || 'Homenajeado',
        formData.apellidoDestinatario || '',
        formData.category?.toUpperCase() || 'PAPA',
        'legacy'
      );

      // Traer datos de canción actual
      const { data: song } = await supabase
        .from('mn_songs')
        .select('form_data')
        .eq('id', currentSongId)
        .single();

      const currentFormData = song?.form_data || {};
      const updatedFormData = {
        ...currentFormData,
        ...formData,
        legacy_photo_url: photoUrl,
        custom_dedication: customDedication,
        major_milestone: majorMilestone,
        infographic_data: infoData,
        landing_flow: currentFormData.landing_flow || landingFlow
      };

      const { error } = await supabase
        .from('mn_songs')
        .update({ form_data: updatedFormData })
        .eq('id', currentSongId);

      if (error) throw error;
      
      setFormData(prev => ({
        ...prev,
        ...updatedFormData
      }));
      setBiographyGenerated(true);

      // Una vez generada la biografía digital, navegamos de inmediato al portal.
      // Si la canción sigue grabándose, la página destino manejará el polling en segundo plano.
      navigate(`/cancion/${currentSongId}`);
    } catch (err) {
      console.error("Error generating biography:", err);
      alert("Hubo un error al generar la Biografía Digital. Por favor, intenta de nuevo.");
    } finally {
      setIsGeneratingBiography(false);
    }
  };

  const handleConfirmLyrics = async () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }

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
        const uniqueTitle = 'Canción Personalizada ' + Math.floor(Date.now() / 1000);
        // Suno/Kie cachea basándose estrictamente en las letras (prompt) y estilo.
        // Añadimos un tag final único para forzar una NUEVA generación en sus servidores.
        const lyricsWithUniqueBypass = lyrics + `\n\n[Fade Out ${Math.floor(Date.now() / 1000)}]`;
        taskId = await generateMusicTask(lyricsWithUniqueBypass, cleanedStyle, uniqueTitle);
      }

      let newSong;
      try {
        const songData = {
          user_id: user?.id,
          title: formData.category === 'hijo' ? (formData.childName || 'Canción Personalizada') : (formData.nombreDestinatario || formData.childName || 'Canción Personalizada'),
          lyrics: lyrics,
          status: 'generating_music',
          task_id: taskId,
          style_prompt: cleanedStyle,
          form_data: { 
            ...formData, 
            finalStylePrompt: cleanedStyle,
            initialContext,
            interviewAnswers,
            aiQuestions,
            landing_flow: landingFlow
          }
        };

        if (currentSongId) {
          const { data } = await supabase.from('mn_songs')
            .update(songData)
            .eq('id', currentSongId)
            .select()
            .single();
          newSong = data;
        } else {
          const { data } = await supabase.from('mn_songs')
            .insert([songData])
            .select()
            .single();
          newSong = data;
        }
        if (newSong) {
          setCurrentSongId(newSong.id);
          localStorage.removeItem('mn_draft_song');
        }
      } catch (err) {
        console.error("Error saving song:", err);
        setGenerationStatus('error');
        return;
      }
      
      if (newSong) {
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

            const isSong1Ready = song1?.audioUrl && song1.audioUrl.trim() !== '';
            const isSong2Ready = song2?.audioUrl && song2.audioUrl.trim() !== '';

            // Esperar a que ambas versiones estén listas para no perder la opción 2
            if (isSong1Ready && (isSong2Ready || attempts > 20)) {
              clearInterval(pollInterval);
              try {
                let finalUrl1 = song1.audioUrl;
                let finalUrl2 = null;
                if (song2 && song2.audioUrl) {
                  finalUrl2 = song2.audioUrl;
                }

                setAudioUrl(finalUrl1);
                setAudioUrl2(finalUrl2);
                setGenerationStatus('completed');
                
                // Traer datos de canción actual en DB para no sobreescribir la biografía digital si ya se generó
                const { data: latestSong } = await supabase
                  .from('mn_songs')
                  .select('form_data')
                  .eq('id', newSong.id)
                  .single();

                const currentDbFormData = latestSong?.form_data || {};
                const updatedFormData = {
                  ...currentDbFormData,
                  ...formData,
                  finalStylePrompt: formData.finalStylePrompt || cleanedStyle,
                  version2: (song2 && song2.audioUrl) ? { 
                    audio_url: song2.audioUrl, 
                    demo_url: finalUrl2,
                    song_id: song2.id 
                  } : null
                };

                await supabase.from('mn_songs').update({ 
                  audio_url: finalUrl1,
                  demo_url: null,
                  suno_id: song1.id,
                  form_data: updatedFormData,
                  status: 'completed'
                }).eq('id', newSong.id);

                if (formData.category !== 'papa' || biographyGeneratedRef.current) {
                  navigate(`/cancion/${newSong.id}`);
                }
              } catch (err) {
                console.error("Error post-procesando audios:", err);
                setAudioUrl(song1.audioUrl);
                setAudioUrl2(song2?.audioUrl || null);
                setGenerationStatus('completed');

                try {
                  const { data: latestSong } = await supabase
                    .from('mn_songs')
                    .select('form_data')
                    .eq('id', newSong.id)
                    .single();

                  const currentDbFormData = latestSong?.form_data || {};
                  const updatedFormData = {
                    ...currentDbFormData,
                    ...formData,
                    finalStylePrompt: formData.finalStylePrompt || cleanedStyle,
                    version2: song2 ? { 
                      audio_url: song2.audioUrl, 
                      demo_url: null,
                      song_id: song2.id 
                    } : null
                  };

                  await supabase.from('mn_songs').update({ 
                    audio_url: song1.audioUrl,
                    demo_url: null,
                    suno_id: song1.id,
                    form_data: updatedFormData,
                    status: 'completed'
                  }).eq('id', newSong.id);
                } catch (dbErr) {
                  console.error("Error al guardar estado de fallo en DB:", dbErr);
                }

                if (formData.category !== 'papa' || biographyGeneratedRef.current) {
                  navigate(`/cancion/${newSong.id}`);
                }
              }
              fetchProfile(user!.id);
            }
          }
          if (attempts >= maxAttempts) {
            clearInterval(pollInterval);
            setGenerationStatus('error');
          }
        }, isTestMode ? 1000 : 7000); 
      }
    } catch (error: any) {
      console.error("Critical Generation Error:", error);
      alert(`Error crítico al generar: ${error?.message || "Desconocido"}. Revisa tu conexión.`);
      setGenerationStatus('error');
    }
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FFFBF7] p-6 text-center animate-in fade-in duration-500">
      <div className="relative mb-6">
        <img 
          src="/mascota_loading.png" 
          alt="Naranjín" 
          className="w-48 h-48 md:w-56 md:h-56 object-contain animate-pulse mx-auto" 
        />
        <div className="absolute inset-0 border-4 border-dashed border-naranja-500/20 rounded-full animate-spin-slow pointer-events-none"></div>
      </div>
      <h2 className="text-2xl font-serif font-bold text-blush-800 mb-2">Conectando con Naranjín...</h2>
      <p className="text-ink-600/60 max-w-sm text-sm">
        Estamos preparando la mecha creativa para iniciar tu composición personalizada.
      </p>
      <style>{`
        @keyframes spinSlow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spinSlow 12s linear infinite;
        }
      `}</style>
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
            {hasSavedProgress && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-naranja-50/70 border border-naranja-100 rounded-3xl p-6 max-w-2xl mx-auto text-sm text-naranja-950 animate-in fade-in duration-500 shadow-sm">
                <div className="flex items-center gap-3 text-center sm:text-left">
                  <Sparkles className="text-naranja-500 shrink-0" size={20} />
                  <span>Continuando con tu borrador anterior. ¿Prefieres comenzar de nuevo?</span>
                </div>
                <button 
                  type="button" 
                  onClick={handleClearDraft} 
                  className="px-4 py-2 bg-white hover:bg-naranja-500 hover:text-white text-naranja-600 rounded-xl border border-naranja-200 text-xs font-bold uppercase tracking-wider transition-all duration-300 shadow-sm"
                >
                  Empezar de nuevo
                </button>
              </div>
            )}
            
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-naranja-50 text-naranja-500 mb-6 border border-naranja-100"><Music size={32} /></div>
              <h1 className="text-4xl md:text-5xl mb-4 font-serif text-blush-800">
                {formData.category === 'papa' ? (
                  <>Crea su <span className="text-naranja-500 italic">Biografía Digital</span></>
                ) : (
                  <>Crea tu <span className="text-naranja-500 italic">Obra Maestra</span></>
                )}
              </h1>
              <p className="text-ink-600/70 text-lg font-light max-w-2xl mx-auto">
                {formData.category === 'papa' ? (
                  "Cuéntanos un poco sobre él y deja que Naranjín organice su portal de recuerdos y su canción personalizada."
                ) : (
                  "Cuéntanos tu historia y deja que Naranjín, nuestro compositor virtual, diseñe la entrevista perfecta para tu canción."
                )}
              </p>
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

                  <h3 className="text-xl md:text-2xl font-serif text-blush-800 flex items-center gap-3 pt-4">
                    <Sparkles className="text-naranja-500" /> 
                    {formData.category === 'papa' ? "¿Cuál es la chispa del homenaje?" : "¿Cuál es la chispa inicial?"}
                  </h3>
                  <p className="text-ink-600/70 text-sm italic">
                    {formData.category === 'papa' ? (
                      "Escribe una breve reseña de papá: a qué se dedica o dedicaba, qué le gusta hacer en su tiempo libre y qué representa para la familia."
                    ) : (
                      'Ejemplo: "Es una canción para mi abuelo que cumple 80 años, fue agricultor y ama a su familia".'
                    )}
                  </p>
                  <textarea 
                    value={initialContext}
                    onChange={(e) => setInitialContext(e.target.value)}
                    placeholder={
                      formData.category === 'papa' 
                        ? "Ej: Es un homenaje para mi papá José, fue maestro de escuela toda su vida, le apasiona la música mexicana y siempre nos enseñó a ser trabajadores..." 
                        : "Escribe aquí de qué se trata la canción..."
                    }
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
                {landingFlow === 'direct-papa' ? (
                  showFullDetailsForm && (
                    <button onClick={() => setShowFullDetailsForm(false)} type="button" className="flex items-center gap-2 text-blush-500 hover:text-naranja-500 transition-colors font-bold text-xs uppercase tracking-widest mb-2"><ArrowLeft size={16} /> Cambiar nombre</button>
                  )
                ) : (
                  <button onClick={() => setFormPhase('spark')} type="button" className="flex items-center gap-2 text-blush-500 hover:text-naranja-500 transition-colors font-bold text-xs uppercase tracking-widest mb-2"><ArrowLeft size={16} /> Volver a la chispa</button>
                )}
                
                <div className="bg-white p-6 md:p-10 rounded-3xl md:rounded-[3rem] border-2 border-naranja-100 shadow-xl space-y-8">
                  {landingFlow === 'direct-papa' && !showFullDetailsForm ? (
                    <div className="space-y-6 animate-in fade-in duration-500">
                      <div className="text-center py-4">
                        <span className="inline-block px-3 py-1 bg-naranja-50 text-naranja-600 rounded-full text-xs font-bold uppercase tracking-widest mb-4">Homenaje a Papá</span>
                        <h3 className="text-3xl font-serif text-blush-900 font-bold mb-2">¿Cómo se llama tu papá?</h3>
                        <p className="text-sm text-ink-600/60">Escribe su nombre completo para comenzar.</p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Nombre(s) *</label>
                          <input 
                            type="text"
                            name="nombreDestinatario"
                            value={formData.nombreDestinatario || ''}
                            onChange={handleChange}
                            placeholder="Ej: José de la Luz"
                            className="w-full bg-blush-50/50 border border-blush-200 rounded-xl p-4 outline-none focus:ring-2 focus:ring-naranja-400 text-base transition-all font-medium text-center"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Apellido(s) *</label>
                          <input 
                            type="text"
                            name="apellidoDestinatario"
                            value={formData.apellidoDestinatario || ''}
                            onChange={handleChange}
                            placeholder="Ej: Sánchez Ramírez"
                            className="w-full bg-blush-50/50 border border-blush-200 rounded-xl p-4 outline-none focus:ring-2 focus:ring-naranja-400 text-base transition-all font-medium text-center"
                            required
                          />
                        </div>
                      </div>

                      <button 
                        type="button" 
                        onClick={() => {
                          if (formData.nombreDestinatario.trim() && formData.apellidoDestinatario.trim()) {
                            setShowFullDetailsForm(true);
                          } else {
                            alert("Por favor escribe el nombre y apellido de tu papá.");
                          }
                        }}
                        className="w-full py-4 bg-naranja-500 text-white rounded-xl font-bold text-base tracking-widest hover:bg-naranja-600 transition shadow-lg flex items-center justify-center gap-2"
                      >
                        CONTINUAR <Sparkles size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-700">
                      {formData.category === 'papa' ? (
                        <>
                          {/* Campos Biográficos de Papá */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <h3 className="text-lg font-serif text-blush-800 flex items-center gap-3"><User className="text-naranja-500" /> Nombre(s) de Papá *</h3>
                              <p className="text-ink-600/70 text-xs italic mt-1">Primer y segundo nombre (sin apellidos).</p>
                              <input 
                                type="text"
                                name="nombreDestinatario"
                                value={formData.nombreDestinatario || ''}
                                onChange={handleChange}
                                placeholder="Ej: José de la Luz"
                                className="w-full mt-3 bg-blush-50/50 border border-blush-200 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-naranja-400 text-base transition-all font-medium"
                                required
                              />
                            </div>

                            <div>
                              <h3 className="text-lg font-serif text-blush-800 flex items-center gap-3"><User className="text-naranja-500" /> Apellido(s) de Papá *</h3>
                              <p className="text-ink-600/70 text-xs italic mt-1">Apellido paterno y materno.</p>
                              <input 
                                type="text"
                                name="apellidoDestinatario"
                                value={formData.apellidoDestinatario || ''}
                                onChange={handleChange}
                                placeholder="Ej: Sánchez Ramírez"
                                className="w-full mt-3 bg-blush-50/50 border border-blush-200 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-naranja-400 text-base transition-all font-medium"
                                required
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <h3 className="text-lg font-serif text-blush-800 flex items-center gap-3"><CalendarDays className="text-naranja-500" /> Fecha de Nacimiento</h3>
                              <p className="text-ink-600/70 text-xs italic mt-1">Para trazar el punto de partida en su línea de tiempo.</p>
                              <input 
                                type="text"
                                name="birthDate"
                                value={formData.birthDate || ''}
                                onChange={handleChange}
                                placeholder="Ej: 12 de Junio de 1950"
                                className="w-full mt-3 bg-blush-50/50 border border-blush-200 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-naranja-400 text-base transition-all font-medium"
                                required
                              />
                            </div>

                            <div>
                              <h3 className="text-lg font-serif text-blush-800 flex items-center gap-3"><Target className="text-naranja-500" /> Lugar de Origen</h3>
                              <p className="text-ink-600/70 text-xs italic mt-1">Establece el inicio geográfico de su biografía.</p>
                              <input 
                                type="text"
                                name="lugarOrigen"
                                value={formData.lugarOrigen || ''}
                                onChange={handleChange}
                                placeholder="Ej: Guadalajara, Jalisco"
                                className="w-full mt-3 bg-blush-50/50 border border-blush-200 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-naranja-400 text-base transition-all font-medium"
                                required
                              />
                            </div>
                          </div>

                          <div>
                            <h3 className="text-xl md:text-2xl font-serif text-blush-800 flex items-center gap-3"><Users className="text-naranja-500" /> ¿Quiénes son los pilares de su vida? (Familia)</h3>
                            <p className="text-ink-600/70 text-sm italic mt-2">Ingresa el nombre de su esposa, hijos y nietos (separados por comas). Estos nombres se grabarán en el árbol familiar interactivo de su Biografía Digital.</p>
                            <input 
                              type="text"
                              name="familyNames"
                              value={formData.familyNames || ''}
                              onChange={handleChange}
                              placeholder="Ej: Su esposa María, sus hijos Pedro, Laura y Lucía, y su nieto Mateo..."
                              className="w-full mt-4 bg-blush-50/50 border border-blush-200 rounded-2xl p-5 outline-none focus:ring-2 focus:ring-naranja-400 text-base transition-all font-medium"
                              required
                            />
                          </div>

                          <div>
                            <h3 className="text-xl md:text-2xl font-serif text-blush-800 flex items-center gap-3"><BookOpen className="text-naranja-500" /> Historia, Enseñanzas y Anécdotas</h3>
                            <p className="text-ink-600/70 text-sm italic mt-2">Cuéntanos hitos importantes de su vida, anécdotas divertidas y enseñanzas que te dejó.</p>
                            <div className="mt-4 bg-blush-50/50 border border-blush-200 rounded-2xl p-5">
                              <VoiceRecorder 
                                initialText={formData.specificDetails}
                                onTranscriptionComplete={(text) => setFormData({...formData, specificDetails: text})}
                                placeholder="Ej: Empezó trabajando desde muy joven en el campo, luego se mudó a la ciudad y fundó su propio taller. Siempre nos enseñó que la familia es lo primero. Un día se cayó de una bicicleta persiguiendo un perro y toda la cuadra se rió con él..."
                              />
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          {/* Formulario Estándar para Otras Categorías */}
                          <div>
                            <h3 className="text-xl md:text-2xl font-serif text-blush-800 flex items-center gap-3"><BookOpen className="text-naranja-500" /> {detailsPrompt.title}</h3>
                            <p className="text-ink-600/70 text-sm italic mt-2">{detailsPrompt.subtitle}</p>
                            <div className="mt-4 bg-blush-50/50 border border-blush-200 rounded-2xl p-5">
                              <VoiceRecorder 
                                initialText={formData.specificDetails}
                                onTranscriptionComplete={(text) => setFormData({...formData, specificDetails: text})}
                                placeholder={detailsPrompt.placeholder}
                              />
                            </div>
                          </div>

                          <div>
                            <h3 className="text-xl md:text-2xl font-serif text-blush-800 flex items-center gap-3"><Users className="text-naranja-500" /> {detailsPrompt.familyTitle}</h3>
                            <p className="text-ink-600/70 text-sm italic mt-2">{detailsPrompt.familySubtitle}</p>
                            <input 
                              type="text"
                              name="familyNames"
                              value={formData.familyNames || ''}
                              onChange={handleChange}
                              placeholder={detailsPrompt.familyPlaceholder}
                              className="w-full mt-4 bg-blush-50/50 border border-blush-200 rounded-2xl p-5 outline-none focus:ring-2 focus:ring-naranja-400 text-base transition-all"
                            />
                          </div>
                        </>
                      )}
                      
                      <div>
                        <h3 className="text-xl md:text-2xl font-serif text-blush-800 flex items-center gap-3"><Music className="text-naranja-500" /> Género, tono y emoción de la canción</h3>
                        <p className="text-ink-600/70 text-sm italic mt-2">¿Cómo quieres que suene? (Con humor, poética, nostálgica, corrido bragado, mariachi tradicional, o banda sinaloense)</p>
                        <textarea 
                          name="moodAndStyle"
                          value={formData.moodAndStyle || ''}
                          onChange={handleChange}
                          placeholder={formData.category === 'papa' ? "Ej: Un corrido norteño con acordeón y bajo sexto, con tono alegre y mucho orgullo..." : "Ej: Quiero una cumbia rápida y alegre con un toque de humor, estilo Los Ángeles Azules..."}
                          className="w-full h-32 mt-4 bg-blush-50/50 border border-blush-200 rounded-2xl p-5 outline-none focus:ring-2 focus:ring-naranja-400 text-base resize-none transition-all font-medium"
                          required
                        ></textarea>
                      </div>

                      <button 
                        type="submit" 
                        disabled={
                          isGeneratingQuestions || 
                          !formData.specificDetails?.trim() || 
                          !formData.moodAndStyle?.trim() || 
                          (formData.category === 'papa' && (
                            !formData.nombreDestinatario?.trim() || 
                            !formData.apellidoDestinatario?.trim() || 
                            !formData.birthDate?.trim() || 
                            !formData.lugarOrigen?.trim() || 
                            !formData.familyNames?.trim()
                          ))
                        } 
                        className="w-full py-5 bg-naranja-500 text-white rounded-2.5xl font-bold text-lg tracking-widest hover:bg-naranja-600 transition shadow-lg disabled:opacity-50 flex items-center justify-center gap-3"
                      >
                        {isGeneratingQuestions ? <RefreshCw className="animate-spin" /> : <Sparkles />}
                        {isGeneratingQuestions ? "DISEÑANDO ENTREVISTA..." : "CONTINUAR"}
                      </button>
                    </div>
                  )}
                </div>
              </form>
            ) : (
              <form onSubmit={handleStartLyrics} className="space-y-10 animate-in slide-in-from-right-8 duration-700">
                <button onClick={() => setFormPhase('details')} type="button" className="flex items-center gap-2 text-blush-500 hover:text-naranja-500 transition-colors font-bold text-xs uppercase tracking-widest mb-4"><ArrowLeft size={16} /> Volver a detalles</button>
                
                <div className="text-center pb-6">
                  <h2 className="text-3xl font-serif text-blush-800">El Corazón de tu Historia</h2>
                  <p className="text-ink-600/70 mt-2">Naranjín ha preparado estas 6 preguntas clave para profundizar en tus sentimientos.</p>
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
                        <p className="text-ink-600/70 text-xs mt-1 italic">Este texto se incluirá como una narración emotiva en medio de la canción. Puedes escribirlo o grabarlo con tu voz.</p>
                      </div>
                    </div>
                    <div className="bg-white/80 border border-naranja-100 rounded-2xl p-6 shadow-inner">
                      <VoiceRecorder 
                        initialText={formData.mensajeHablado}
                        onTranscriptionComplete={(text) => setFormData({...formData, mensajeHablado: text})}
                        placeholder="Escribe o dicta las palabras exactas que quieres que se escuchen (ej: 'Te amo con todo mi ser, nunca lo olvides...')"
                      />
                    </div>
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
                  <p className="text-xs text-naranja-600/70 mb-4">Dile a Naranjín qué mejorar (ej: "Más intensidad", "Añade nuestro aniversario").</p>
                  <textarea 
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Escribe aquí..."
                    className="w-full bg-white border border-naranja-100 rounded-xl p-4 text-sm outline-none focus:ring-2 focus:ring-naranja-400 h-28"
                  ></textarea>
                  <button onClick={handleRewrite} disabled={isGenerating || !feedback.trim()} className="w-full mt-4 py-3 bg-white border-2 border-naranja-500 text-naranja-600 rounded-xl font-bold text-xs hover:bg-naranja-500 hover:text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                    {isGenerating ? <RefreshCw size={14} className="animate-spin" /> : <RefreshCw size={14} />} REESCRIBIR CON NARANJÍN
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
            {(generationStatus === 'generating' || (formData.category === 'papa' && !biographyGenerated)) ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center max-w-5xl mx-auto">
                <div className={`${formData.category === 'papa' ? 'lg:col-span-5' : 'lg:col-span-12'} text-center space-y-6`}>
                  {generationStatus === 'completed' || audioUrl ? (
                    <div className="space-y-4">
                      <div className="relative inline-block">
                        <img 
                          src="/mascota_success.png" 
                          alt="Naranjín listo" 
                          className="w-40 h-40 md:w-48 md:h-48 object-contain mx-auto animate-bounce-slow" 
                        />
                      </div>
                      <h2 className="text-2xl md:text-3xl font-serif text-emerald-800">¡Tu Canción está Lista! 🎵</h2>
                      <p className="text-ink-600/70 text-sm max-w-xs mx-auto font-light leading-relaxed">
                        Naranjín ha terminado de componer y grabar tu canción personalizada.
                        <br /><br />
                        <strong>Completa la biografía digital a la derecha</strong> para guardar tu regalo y escuchar la melodía de inmediato.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="relative inline-block">
                        <img 
                          src="/mascota_loading.png" 
                          alt="Naranjín grabando" 
                          className="w-40 h-40 md:w-48 md:h-48 object-contain animate-pulse mx-auto" 
                        />
                        <div className="absolute inset-0 border-4 border-dashed border-naranja-500/20 rounded-full animate-spin-slow pointer-events-none"></div>
                      </div>
                      <h2 className="text-3xl font-serif text-blush-800">Estudio de Grabación</h2>
                      <p className="text-ink-600/70 text-sm max-w-xs mx-auto font-light">
                        Naranjín está afinando los instrumentos, arreglando los acordes y grabando las voces personalizadas. Tardará 1-2 minutos.
                      </p>
                      <div className="w-full max-w-xs mx-auto bg-blush-50 h-3 rounded-full overflow-hidden">
                        <div className="bg-gradient-to-r from-naranja-400 to-naranja-600 h-full animate-pulse" style={{ width: '70%' }}></div>
                      </div>
                      <p className="text-naranja-500 font-bold text-xs tracking-widest animate-pulse uppercase">Componiendo voces e instrumentos...</p>
                      
                      <div className="pt-4">
                        <button 
                          onClick={() => {
                            setStep(2);
                            setGenerationStatus('idle');
                          }}
                          className="text-blush-400 hover:text-naranja-500 font-bold text-xs uppercase tracking-[0.2em] transition-colors"
                        >
                          × Cancelar y volver
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {formData.category === 'papa' && (
                  <div className="lg:col-span-7 bg-gradient-to-br from-blue-50 to-indigo-50/50 p-6 md:p-10 rounded-[2.5rem] border border-blue-100 shadow-xl text-left space-y-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                      <User size={150} />
                    </div>
                    <div className="flex items-center gap-4 relative z-10">
                      <img src="/mascota.png" alt="Naranjín" className="w-14 h-14 object-contain animate-bounce-slow" />
                      <div>
                        <h4 className="text-xl font-serif text-blue-900 leading-tight">✨ ¡Paso Extra: Tu Biografía Digital!</h4>
                        <p className="text-xs text-blue-700/70">Aprovecha este tiempo para subir su foto de portada y personalizar su portal interactivo.</p>
                      </div>
                    </div>

                    {!biographyGenerated ? (
                      <div className="space-y-5 relative z-10">
                        <div className="space-y-2">
                          <label className="text-xs font-black text-blue-900 uppercase tracking-widest block">Foto de Portada de Papá (Opcional)</label>
                          <div className="flex items-center gap-4">
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              disabled={isUploading}
                              className="px-4 py-3 bg-white border border-blue-200 text-blue-600 rounded-xl text-xs font-bold hover:bg-blue-50 transition-all flex items-center gap-2 shadow-sm"
                            >
                              {isUploading ? <Loader2 className="animate-spin" size={14} /> : <Camera size={14} />}
                              {photoUrl ? "Cambiar Foto" : "Subir Foto Oficial"}
                            </button>
                            <input
                              type="file"
                              ref={fileInputRef}
                              onChange={handleFileUpload}
                              accept="image/*"
                              className="hidden"
                            />
                            {photoUrl && (
                              <div className="flex items-center gap-2 text-xs text-emerald-600 font-bold">
                                <CheckCircle2 size={14} /> Foto cargada
                              </div>
                            )}
                          </div>
                          {photoUrl && (
                            <img src={photoUrl} alt="Vista previa" className="w-24 h-24 object-cover rounded-2xl border-2 border-white shadow-md mt-2" />
                          )}
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-black text-blue-900 uppercase tracking-widest block">Dedicatoria Especial *</label>
                          <p className="text-[10px] text-blue-700/60 italic">Una hermosa frase corta para recibir a toda la familia en su portal biográfico.</p>
                          <input
                            type="text"
                            value={customDedication}
                            onChange={(e) => setCustomDedication(e.target.value)}
                            placeholder="Ej: Para el hombre que me enseñó a caminar con la frente en alto. Te amo, papá."
                            className="w-full bg-white border border-blue-200 rounded-xl p-3.5 text-sm outline-none focus:ring-2 focus:ring-blue-400 font-medium"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-black text-blue-900 uppercase tracking-widest block">Mayor Logro o Hito de su Vida *</label>
                          <p className="text-[10px] text-blue-700/60 italic">Un orgullo familiar (ej: su carrera, su negocio, sus hijos, un gran viaje o aprendizaje).</p>
                          <input
                            type="text"
                            value={majorMilestone}
                            onChange={(e) => setMajorMilestone(e.target.value)}
                            placeholder="Ej: Dedicar 40 años a la enseñanza y construir nuestro hogar con amor y esfuerzo."
                            className="w-full bg-white border border-blue-200 rounded-xl p-3.5 text-sm outline-none focus:ring-2 focus:ring-blue-400 font-medium"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={handleGenerateBiography}
                          disabled={isGeneratingBiography || isUploading || !customDedication.trim() || !majorMilestone.trim()}
                          className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold text-sm tracking-wider hover:bg-blue-700 transition shadow disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {isGeneratingBiography ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
                          {isGeneratingBiography ? "GENERANDO PORTAL BIOGRÁFICO..." : "¡GENERAR BIOGRAFÍA DIGITAL!"}
                        </button>
                        <p className="text-[10px] text-center text-blue-600/60">Dedicatoria e hito de vida son obligatorios. La foto es opcional.</p>
                      </div>
                    ) : (
                      <div className="p-8 bg-white/80 backdrop-blur rounded-3xl border border-emerald-100 text-center space-y-4 shadow-sm animate-in zoom-in duration-500">
                        <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
                          <CheckCircle2 size={32} />
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-emerald-800">¡Biografía Digital Creada con Éxito!</h4>
                          <p className="text-xs text-emerald-600 mt-1">
                            El Homenaje Digital Interactivo, el árbol familiar y el PDF descargable de alta calidad con QR personalizado han sido configurados.
                          </p>
                        </div>
                        <p className="text-[10px] font-bold text-blue-600 animate-pulse uppercase tracking-widest pt-2">
                          Naranjín sigue grabando tu melodía... ¡Espera en esta pantalla!
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
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
                          handleCheckout();
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
                <div className="relative inline-block mb-6">
                  <img 
                    src="/mascota_success.png" 
                    alt="Naranjín celebrando" 
                    className="w-40 h-40 object-contain mx-auto animate-bounce-slow" 
                  />
                  <style>{`
                    @keyframes bounceSlow {
                      0%, 100% { transform: translateY(0); }
                      50% { transform: translateY(-10px); }
                    }
                    .animate-bounce-slow {
                      animation: bounceSlow 3s ease-in-out infinite;
                    }
                  `}</style>
                </div>
                <div>
                  <h2 className="text-4xl font-serif text-blush-800 mb-2">¡Muestra Lista! 🎨</h2>
                  <p className="text-ink-600/70 text-lg">Escucha un adelanto de tu canción personalizada.</p>
                  <div className="mt-2 inline-block px-4 py-1 bg-amber-50 text-amber-600 text-[10px] font-bold uppercase tracking-widest rounded-full border border-amber-100 italic">
                    Versión Demo (1.5 Minutos con Marca de Agua)
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
                      if (e.currentTarget.currentTime >= 90) {
                        e.currentTarget.pause();
                        e.currentTarget.currentTime = 0;
                        setShowDemoModal(true);
                      }
                    }}
                    onError={(e) => {
                      console.error("Audio Load Error:", e);
                      // Intentar recargar una vez si falla
                      const audio = e.currentTarget;
                      if (!audio.getAttribute('data-retried')) {
                        audio.setAttribute('data-retried', 'true');
                        audio.load();
                      }
                    }}
                    className="w-full mb-4 custom-audio-player"
                  >
                    Tu navegador no soporta el reproductor de audio.
                  </audio>
                  
                  {/* Ayuda si falla la carga */}
                  <p className="text-[9px] text-blush-400 mb-8 italic">
                    ¿No escuchas nada? Intenta <button onClick={() => window.location.reload()} className="underline hover:text-naranja-500">recargar la página</button> o cambia de opción.
                  </p>
                  <div className="space-y-4 relative z-10">
                    <button 
                      onClick={handleCheckout}
                      className="w-full px-8 py-5 bg-gradient-to-r from-naranja-500 to-naranja-600 text-white rounded-2xl font-bold text-lg tracking-widest hover:scale-105 transition-all shadow-xl shadow-naranja-200 flex items-center justify-center gap-3"
                    >
                      DESBLOQUEAR CANCIÓN COMPLETA <Sparkles size={20} />
                    </button>
                    <p className="text-[10px] text-ink-400 font-medium text-center">
                      Al comprar recibirás la versión original de alta fidelidad, de duración completa y sin voces de marca de agua.
                    </p>
                  </div>
                </div>

                {/* Mostrar el botón del Legado Digital si aplica */}
                {formData.category === 'papa' && !formData.infographic_data && (
                  <div className="w-full bg-white p-6 md:p-8 rounded-[2.5rem] border-2 border-[#1C2A39]/10 shadow-xl relative overflow-hidden">
                    <TributeAddon 
                      song={{ 
                        id: currentSongId, 
                        form_data: formData,
                        is_paid: false
                      }} 
                    />
                  </div>
                )}
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
