import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  Play, Pause, Download, Edit3, Image as ImageIcon, Heart, 
  Share2, Lock, FileText, CheckCircle2, Home, Briefcase, 
  Hammer, Users, Star, Mountain, Feather, TreeDeciduous, User, Copy, MessageCircle
} from 'lucide-react';
import { checkMusicStatus } from '../services/music';
import { QRCodeSVG } from 'qrcode.react';
import { toJpeg } from 'html-to-image';
import { jsPDF } from 'jspdf';
import type { InfographicData } from '../services/ai';
import AnchorGraphic from '../components/tribute/AnchorGraphics';
import PDFLayout from '../components/tribute/PDFLayout';
import TributeAddon from '../components/tribute/TributeAddon';

// Mapeo dinámico de iconos de Lucide
const IconMap: Record<string, any> = {
  Home, Briefcase, Hammer, Users, Star, Heart, Mountain, Feather, TreeDeciduous
};

export default function SongPlayer() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [song, setSong] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ photoUrl: '', dedication: '', recipient: '' });
  const [isUploading, setIsUploading] = useState(false);
  const [activePreviewVersion, setActivePreviewVersion] = useState<1 | 2>(1);
  const [isAudioLoading, setIsAudioLoading] = useState(true);
  const [showDemoModal, setShowDemoModal] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const pdfRef = useRef<HTMLDivElement | null>(null);

  const isOwner = user?.id === song?.user_id;
  const isAdmin = user?.email === 'ritohp@gmail.com';
  const isPaid = song?.is_paid || isAdmin;
  
  const activeVersionToPlay = (isOwner || isAdmin) ? activePreviewVersion : (song?.form_data?.selected_version || 1);
  const currentAudioUrl = song ? (
    activeVersionToPlay === 2
      ? (isPaid ? (song.form_data?.version2?.audio_url || song.form_data?.version2?.demo_url) : (song.form_data?.version2?.demo_url || song.form_data?.version2?.audio_url))
      : (isPaid ? (song.audio_url || song.demo_url) : (song.demo_url || song.audio_url))
  ) : '';

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
    loadSong();
  }, [id]);

  useEffect(() => {
    if (song?.form_data?.selected_version) {
      setActivePreviewVersion(song.form_data.selected_version);
    }
  }, [song]);

  async function loadSong() {
    try {
      const { data, error } = await supabase
        .from('mn_songs')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setSong(data);
      setEditData({
        photoUrl: data.form_data?.custom_photo_url || "/papa-sorpresa.png",
        dedication: data.form_data?.custom_dedication || "Gracias por cada enseñanza y cada sonrisa.",
        recipient: data.form_data?.recipientName || 
                   (data.form_data?.nombreDestinatario ? `${data.form_data.nombreDestinatario} ${data.form_data.apellidoDestinatario || ''}`.trim() : null) || 
                   "Papá"
      });
    } catch (err) {
      console.error("Error cargando canción:", err);
    } finally {
      setLoading(false);
    }
  };

  // Polling para recuperar el audio de Kie.ai si está en estado 'generating_music'
  useEffect(() => {
    if (!song || song.status !== 'generating_music') return;

    let pollInterval: NodeJS.Timeout;
    let attempts = 0;
    const maxAttempts = 120; // 10 minutos máx

    const checkStatus = async () => {
      attempts++;
      try {
        const response = await checkMusicStatus(song.task_id);
        const sunoData = response?.data?.response?.sunoData || response?.response?.sunoData;

        if (sunoData && sunoData.length > 0 && sunoData[0].audioUrl) {
          clearInterval(pollInterval);
          
          const song1 = sunoData[0];
          const song2 = sunoData.length > 1 ? sunoData[1] : null;
          const audioUrl = song1.audioUrl;
          
          let demoUrl = audioUrl;
          let finalUrl2 = null;
          try {
            const { data: treatmentData } = await supabase.functions.invoke('process-audio', {
              body: { originalUrl: audioUrl, songId: song.id, taskId: song.task_id }
            });
            demoUrl = treatmentData?.demoUrl || audioUrl;

            if (song2 && song2.audioUrl) {
               try {
                  const { data: treatmentData2 } = await supabase.functions.invoke('process-audio', {
                    body: { originalUrl: song2.audioUrl, songId: song.id, taskId: song.task_id }
                  });
                  finalUrl2 = treatmentData2?.demoUrl || song2.audioUrl;
               } catch (e) {
                  finalUrl2 = song2.audioUrl;
               }
            }
          } catch (err) {
            console.error("Error post-procesando audios en SongPlayer:", err);
          }

          const updatedFormData = {
            ...(song.form_data || {}),
            version2: (song2 && song2.audioUrl) ? { 
              audio_url: song2.audioUrl, 
              demo_url: finalUrl2,
              song_id: song2.id 
            } : null
          };

          const { data: updatedSong, error: updateError } = await supabase
            .from('mn_songs')
            .update({ 
              audio_url: audioUrl, 
              demo_url: demoUrl, 
              form_data: updatedFormData, 
              status: 'completed' 
            })
            .eq('id', song.id)
            .select()
            .single();

          if (!updateError && updatedSong) {
            setSong(updatedSong);
          } else {
            setSong((prev: any) => ({
              ...prev,
              audio_url: audioUrl,
              demo_url: demoUrl,
              form_data: updatedFormData,
              status: 'completed'
            }));
          }
        }
      } catch (err) {
        console.error("Error consultando estado de canción en SongPlayer:", err);
      }

      if (attempts >= maxAttempts) {
        clearInterval(pollInterval);
      }
    };

    checkStatus();
    pollInterval = setInterval(checkStatus, 5000);

    return () => clearInterval(pollInterval);
  }, [song?.status, song?.id]);

  useEffect(() => {
    if (audioRef.current && song) {
      const audio = audioRef.current;
      const isAdminUser = user?.email === 'ritohp@gmail.com';
      const isSongPaid = song.is_paid || isAdminUser;

      // Reset loading state on track change
      setIsAudioLoading(true);

      const updateProgress = () => {
        if (!isSongPaid && audio.currentTime >= 90) {
          audio.pause();
          audio.currentTime = 0;
          setIsPlaying(false);
          setShowDemoModal(true);
        }
        setCurrentTime(audio.currentTime);
        setProgress((audio.currentTime / (audio.duration || 1)) * 100);
      };

      const updateDuration = () => {
        setDuration(audio.duration || 0);
        setIsAudioLoading(false);
        
        // Autoplay logic: try to play the song immediately when loaded
        audio.play().then(() => {
          setIsPlaying(true);
        }).catch((err) => {
          console.log("Autoplay block or delay:", err);
        });
      };

      const onEnded = () => setIsPlaying(false);
      const onLoadStart = () => setIsAudioLoading(true);
      const onWaiting = () => setIsAudioLoading(true);
      const onPlaying = () => {
        setIsAudioLoading(false);
        setIsPlaying(true);
      };
      const onPause = () => setIsPlaying(false);
      
      const onError = (e: Event) => {
        console.error("Audio Load Error in SongPlayer:", e);
        if (audio && !audio.getAttribute('data-retried')) {
          audio.setAttribute('data-retried', 'true');
          audio.load();
        } else {
          setIsAudioLoading(false);
        }
      };

      audio.addEventListener('timeupdate', updateProgress);
      audio.addEventListener('loadedmetadata', updateDuration);
      audio.addEventListener('ended', onEnded);
      audio.addEventListener('loadstart', onLoadStart);
      audio.addEventListener('waiting', onWaiting);
      audio.addEventListener('playing', onPlaying);
      audio.addEventListener('pause', onPause);
      audio.addEventListener('error', onError);

      // Force load the audio when url changes or component mounts
      audio.load();

      return () => {
        audio.removeEventListener('timeupdate', updateProgress);
        audio.removeEventListener('loadedmetadata', updateDuration);
        audio.removeEventListener('ended', onEnded);
        audio.removeEventListener('loadstart', onLoadStart);
        audio.removeEventListener('waiting', onWaiting);
        audio.removeEventListener('playing', onPlaying);
        audio.removeEventListener('pause', onPause);
        audio.removeEventListener('error', onError);
      };
    }
  }, [song, user, currentAudioUrl]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (audioRef.current) {
      const newTime = (Number(e.target.value) / 100) * duration;
      audioRef.current.currentTime = newTime;
      setProgress(Number(e.target.value));
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
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    setIsUploading(true);
    try {
      const compressedBlob = await compressImage(file);
      const compressedFile = new File([compressedBlob], `image.jpg`, { type: 'image/jpeg' });

      const fileName = `${song.id}-${Math.random()}.jpg`;
      const filePath = `custom_photos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('memories')
        .upload(filePath, compressedFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('memories')
        .getPublicUrl(filePath);

      setEditData(prev => ({ ...prev, photoUrl: publicUrl }));
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Hubo un error al subir la imagen.");
    } finally {
      setIsUploading(false);
    }
  };

  const saveEdits = async () => {
    try {
      setIsUploading(true);
      const newFormData = { ...song.form_data, 
        custom_photo_url: editData.photoUrl,
        custom_dedication: editData.dedication,
        nombreDestinatario: editData.recipient
      };

      const { error } = await supabase
        .from('mn_songs')
        .update({ form_data: newFormData })
        .eq('id', song.id);

      if (error) throw error;
      setSong({ ...song, form_data: newFormData });
      setIsEditing(false);
    } catch (err) {
      console.error("Error guardando edición", err);
      alert("Error al guardar los cambios.");
    } finally {
      setIsUploading(false);
    }
  };

  const saveSelectedVersion = async (version: 1 | 2) => {
    if (!song) return;
    try {
      setIsUploading(true);
      const newFormData = {
        ...song.form_data,
        selected_version: version
      };

      const { error } = await supabase
        .from('mn_songs')
        .update({ form_data: newFormData })
        .eq('id', song.id);

      if (error) throw error;
      setSong({ ...song, form_data: newFormData });
      setActivePreviewVersion(version);
    } catch (err) {
      console.error("Error guardando versión seleccionada:", err);
      alert("Hubo un error al guardar tu selección.");
    } finally {
      setIsUploading(false);
    }
  };

  const generatePDF = async () => {
    if (!pdfRef.current || !isPaid) {
      if (!isPaid) alert("Debes desbloquear la canción para descargar la Infografía en alta calidad.");
      return;
    }
    
    setIsUploading(true);
    try {
      const element = pdfRef.current;
      
      const imgData = await toJpeg(element, {
        quality: 1.0,
        backgroundColor: '#F8F3E9',
        pixelRatio: 2
      });
      
      const elementWidth = element.scrollWidth || 800;
      const elementHeight = element.scrollHeight || 1200;
      
      // Ajustamos a proporciones de Tamaño Carta (Letter)
      const pdf = new jsPDF('p', 'mm', 'letter');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Historia_${recipient.replace(/\s+/g, '_')}.pdf`);
      
    } catch (error: any) {
      console.error("Error generando PDF:", error);
      alert(`Hubo un error al generar tu certificado: ${error.message || error}`);
    } finally {
      setIsUploading(false);
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F3E9] p-6 text-center">
        <div className="relative mb-6">
          <img 
            src="/mascota_loading.png" 
            alt="Naranjín" 
            className="w-48 h-48 md:w-56 md:h-56 object-contain animate-pulse mx-auto" 
          />
          <div className="absolute inset-0 border-4 border-dashed border-[#A88B5B]/30 rounded-full animate-spin-slow pointer-events-none"></div>
        </div>
        <h2 className="text-2xl font-serif font-bold text-[#1C2A39] mb-2">Abriendo tu Legado...</h2>
        <p className="text-[#1C2A39]/60 max-w-sm text-sm">
          Naranjín está afinando su guitarra y cargando los recuerdos del pergamino.
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
  }

  if (!song) {
    return <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F3E9]">Canción no encontrada.</div>;
  }

  // Bloqueo de acceso público
  if (!isPaid && !isOwner && !isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#111] p-6 text-center animate-in fade-in zoom-in duration-500">
        <div className="bg-[#1C2A39] p-8 md:p-12 rounded-[2.5rem] shadow-2xl max-w-lg w-full border border-[#2A3F54] relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 text-white">
            <Lock size={120} />
          </div>
          <div className="w-20 h-20 bg-naranja-500/20 text-naranja-400 rounded-full flex items-center justify-center mx-auto mb-6 relative z-10">
            <Lock size={40} />
          </div>
          <h2 className="text-2xl font-serif text-white mb-4 relative z-10">Legado Privado</h2>
          <p className="text-gray-400 mb-8 relative z-10 text-sm leading-relaxed">
            Esta canción y su legado aún no han sido desbloqueados públicamente por su creador.
          </p>
          <button 
            onClick={() => { localStorage.removeItem('mn_draft_song'); navigate('/crear-cancion'); }}
            className="w-full py-4 bg-gradient-to-r from-naranja-500 to-naranja-600 text-white rounded-xl font-bold uppercase tracking-widest text-xs hover:scale-105 transition-all"
          >
            CREAR MI PROPIO LEGADO
          </button>
        </div>
      </div>
    );
  }

  const photoUrl = song.form_data?.legacy_photo_url || song.form_data?.custom_photo_url || "/papa-sorpresa.png";
  
  // Extraer datos infográficos
  const hasTributeData = !!song.form_data?.infographic_data;
  const infoData: InfographicData = song.form_data?.infographic_data || {
    theme: 'legacy',
    archetype: 'LEGACY',
    timeline: [],
    shields: [],
    nameMeaning: {name: "", meaning: ""},
    lastNameMeaning: {lastName: "", meaning: ""},
    quote: "",
    familyMembers: [],
    testimonials: []
  };

  const recipient = editData.recipient || 'Tu Ser Querido';
  const title = song.title || "Tu Canción";
  const theme = infoData.theme || 'legacy';
  const archetype = infoData.archetype || 'LEGACY';

  // DESIGN TOKENS (Variables de Tema Dinámicas)
  const tokens = theme === 'love' ? {
    bg: 'bg-[#FFF0F5]',
    bgHex: '#FFF0F5',
    text: 'text-[#4A0E2E]',
    accent: 'text-[#D64060]',
    border: 'border-[#D64060]',
    borderHex: '#D64060',
    svgFill: '#4A0E2E',
    svgStroke: '#D64060',
    fontTitle: 'font-serif italic',
    ornament: 'rounded-full'
  } : {
    bg: 'bg-[#F8F3E9]',
    bgHex: '#F8F3E9',
    text: 'text-[#1C2A39]',
    accent: 'text-[#B69D74]',
    border: 'border-[#B69D74]',
    borderHex: '#B69D74',
    svgFill: '#1C2A39',
    svgStroke: '#B69D74',
    fontTitle: 'font-serif',
    ornament: 'rounded-none'
  };



  return (
    <div className="min-h-screen bg-[#111] py-8 px-4 md:py-12 flex justify-center">
      
      {/* Contenedor principal de la Web (Simulando un póster flotante) */}
      <div className={`w-full max-w-2xl ${tokens.bg} shadow-2xl relative overflow-hidden rounded-md transition-colors duration-500`}>
        
          <div className="w-full p-6 md:p-12 space-y-8">
            {song.status === 'generating_music' ? (
              <div className="bg-[#1C2A39] p-8 rounded-3xl border-2 border-[#B69D74]/30 text-center shadow-xl relative overflow-hidden animate-pulse">
                <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent"></div>
                <div className="relative z-10 flex flex-col items-center justify-center gap-4">
                  <div className="animate-spin w-8 h-8 border-4 border-[#B69D74] border-t-transparent rounded-full"></div>
                  <h3 className="text-[#B69D74] font-serif text-lg md:text-xl font-bold uppercase tracking-wider">Estudio de Grabación</h3>
                  <p className="text-white/80 text-xs md:text-sm max-w-sm leading-relaxed">
                    Naranjín está componiendo tu canción en este momento. ¡El reproductor de música se activará automáticamente al terminar!
                  </p>
                  <p className="text-[#B69D74]/70 text-[10px] uppercase tracking-widest italic font-mono">
                    Tiempo estimado: ~1 minuto
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Reproductor de Audio */}
                <div className="bg-[#1C2A39] p-6 rounded-2xl shadow-2xl max-w-md mx-auto relative overflow-hidden border border-[#2A3F54] text-center">
                   <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent"></div>
                   
                   <div className="relative z-10 flex gap-4 items-center mb-4">
                      <img src={photoUrl} className="w-16 h-16 rounded-lg object-cover shadow-md border border-[#B69D74]/30" crossOrigin="anonymous"/>
                      <div className="flex-1 text-left">
                         <h4 className="text-white text-xs md:text-sm tracking-widest font-bold mb-1 opacity-90 truncate">{title}</h4>
                         <p className="text-[#B69D74] text-[9px] uppercase tracking-widest">
                           {isPaid ? "Versión Completa" : "Muestra de 1.5 minutos de tu canción."}
                         </p>
                      </div>
                   </div>

                   {song.form_data?.version2 && (isOwner || isAdmin) && (
                      <div className="relative z-10 mt-2 mb-4 p-3 bg-[#2A3F54]/30 rounded-xl border border-[#B69D74]/10 text-center">
                         <span className="text-[#B69D74] text-[9px] tracking-wider uppercase block mb-2 font-bold opacity-80">
                            ¿Qué versión escucharás?
                         </span>
                         <div className="flex gap-2 mb-2">
                            <button
                              onClick={() => setActivePreviewVersion(1)}
                              className={`flex-1 py-2 rounded-lg font-bold text-[9px] uppercase tracking-wider transition-all flex items-center justify-center gap-1
                                ${activePreviewVersion === 1 
                                  ? 'bg-[#B69D74] text-[#1C2A39] shadow-md' 
                                  : 'bg-[#2A3F54]/50 text-gray-300 hover:bg-[#2A3F54]'}`}
                            >
                              Opción A {song.form_data?.selected_version !== 2 && <span className="text-[7px] opacity-75">(Fijada)</span>}
                            </button>
                            <button
                              onClick={() => setActivePreviewVersion(2)}
                              className={`flex-1 py-2 rounded-lg font-bold text-[9px] uppercase tracking-wider transition-all flex items-center justify-center gap-1
                                ${activePreviewVersion === 2 
                                  ? 'bg-[#B69D74] text-[#1C2A39] shadow-md' 
                                  : 'bg-[#2A3F54]/50 text-gray-300 hover:bg-[#2A3F54]'}`}
                            >
                              Opción B {song.form_data?.selected_version === 2 && <span className="text-[7px] opacity-75">(Fijada)</span>}
                            </button>
                         </div>
                         {song.form_data?.selected_version !== activePreviewVersion && (
                            <button
                              onClick={() => saveSelectedVersion(activePreviewVersion)}
                              className="w-full py-1.5 bg-[#B69D74]/20 hover:bg-[#B69D74]/35 text-[#B69D74] border border-[#B69D74]/30 rounded-lg text-[8px] font-bold uppercase tracking-widest transition-all animate-pulse"
                            >
                              Fijar Opción {activePreviewVersion === 1 ? 'A' : 'B'} como la definitiva
                            </button>
                         )}
                      </div>
                   )}

                   <div className="relative z-10 text-left">
                      {isAudioLoading && (
                         <div className="mb-4 flex items-center justify-center gap-2 bg-[#2A3F54]/30 p-2.5 rounded-xl border border-[#B69D74]/10 animate-pulse">
                            <div className="animate-spin w-3 h-3 border-2 border-[#B69D74] border-t-transparent rounded-full"></div>
                            <p className="text-[#B69D74] text-[8px] tracking-wider uppercase font-semibold">
                               Cargando melodía...
                            </p>
                         </div>
                      )}

                      <div className="flex items-center justify-between text-[9px] text-[#B69D74] font-mono mb-1">
                         <span>{formatTime(currentTime)}</span>
                         <span>{formatTime(duration)}</span>
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        value={progress}
                        onChange={handleSeek}
                        className="w-full h-1 bg-[#2A3F54] rounded-lg appearance-none cursor-pointer accent-[#B69D74]"
                      />
                      <div className="flex items-center justify-center gap-6 mt-4">
                        <button className="text-gray-400 hover:text-[#B69D74] transition"><Share2 size={16} /></button>
                        <button 
                          onClick={togglePlay}
                          className="w-12 h-12 rounded-full border border-[#B69D74] text-[#B69D74] flex items-center justify-center hover:bg-[#B69D74] hover:text-[#1C2A39] transition-colors shadow-lg"
                        >
                          {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-1" />}
                        </button>
                        <button className="text-gray-400 hover:text-[#B69D74] transition"><Heart size={16} /></button>
                      </div>
                   </div>
                </div>

                {/* Letra de la Canción */}
                {song.lyrics && (
                  <div className="bg-white/90 p-8 md:p-12 rounded-3xl shadow-md border border-[#E8DCC8] relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#D64060] to-[#B69D74]"></div>
                    <h3 className="text-center font-serif text-[#1C2A39] text-xl md:text-2xl font-bold uppercase tracking-widest mb-8">Letra de la Canción</h3>
                    <div className="whitespace-pre-wrap text-[#4A4A4A] font-medium text-sm md:text-base leading-relaxed text-center font-serif italic mx-auto max-w-lg">
                      {song.lyrics}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

        {/* Acciones Web */}
        <div className={`px-6 md:px-12 pb-12 pt-6 flex flex-col gap-4 border-t ${tokens.border} border-opacity-20 mt-4 relative z-20 ${tokens.bg}`}>
          
          {!isPaid && (isAdmin || isOwner) && (
            <div className="bg-orange-50 border border-orange-200 p-4 rounded-xl mb-2 text-center shadow-inner">
              <p className="text-[10px] text-orange-800 font-medium uppercase tracking-widest mb-1 flex items-center justify-center gap-1">
                <Lock size={12} /> BIOGRAFÍA RESTRINGIDA
              </p>
              <p className="text-xs text-orange-700 leading-relaxed italic">
                Para descargar la canción completa, obtener la Biografía PDF en alta calidad con QR y compartir este enlace públicamente, necesitas desbloquear tu regalo.
              </p>
            </div>
          )}

          <button 
            onClick={() => {
              if (isPaid) {
                 window.open(song.selected_version ? song.selected_version.url : currentAudioUrl, '_blank');
              } else {
                 window.location.href = `https://buy.stripe.com/dRm5kwcXzf2T7kgdI72Ry00?client_reference_id=${song.id}`;
              }
            }}
            className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-colors shadow-md tracking-wider text-[10px] md:text-xs uppercase
              ${isPaid ? 'bg-[#1C2A39] text-white hover:bg-[#2A3F54]' : 'bg-gradient-to-r from-[#D64060] to-[#B69D74] text-white'}`}
          >
            {isPaid ? <Download size={16} /> : <Lock size={16} className="opacity-60" />}
            {isPaid ? "Descargar Canción MP3" : "Desbloquear Canción + Biografía PDF + Web ($399 MXN)"}
          </button>
          
          {isPaid && (
            <button 
              onClick={generatePDF}
              className="w-full py-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-colors shadow-md tracking-wider text-[10px] md:text-xs uppercase bg-[#FDF8EE] border border-[#B69D74] text-[#1C2A39] hover:bg-[#F2E8D5]"
            >
              <FileText size={16} className="text-[#B69D74]" />
              Descargar Biografía PDF para Imprimir
            </button>
          )}
          
          {isPaid && (
            <div className="pt-4 mt-2 border-t border-[#1C2A39]/10 grid grid-cols-2 gap-3">
              <button 
                onClick={() => {
                  const url = window.location.href;
                  navigator.clipboard.writeText(url);
                  alert('¡Enlace copiado al portapapeles!');
                }}
                className="py-3 bg-white text-[#1C2A39] border border-[#1C2A39]/20 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors text-[10px] uppercase tracking-widest"
              >
                <Copy size={14} /> Copiar Enlace
              </button>
              <button 
                onClick={() => {
                  const url = window.location.href;
                  const text = `¡Mira la canción mágica y el legado que me hicieron! 🎧✨%0A%0A${url}`;
                  window.open(`https://wa.me/?text=${text}`, '_blank');
                }}
                className="py-3 bg-[#25D366] text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#20bd5a] transition-colors text-[10px] uppercase tracking-widest shadow-sm"
              >
                <MessageCircle size={14} /> WhatsApp
              </button>
            </div>
          )}
          
          {isOwner && !isPaid && (
            <button 
              onClick={() => setIsEditing(true)}
              className="w-full py-3 text-[#555] text-[10px] font-medium flex items-center justify-center gap-2 hover:text-[#B69D74] transition-colors uppercase tracking-widest mt-2"
            >
              <Edit3 size={14} /> Personalizar Foto y Textos (Gratis)
            </button>
          )}
        </div>

      </div>

      {/* Contenedor Oculto para Generación PDF (Posicionado fuera de pantalla para mantener la altura completa real) */}
      <div style={{ position: 'absolute', top: '-20000px', left: '-20000px' }}>
        <div ref={pdfRef} className="bg-transparent">
          <PDFLayout 
             infoData={infoData} 
             recipient={recipient} 
             photoUrl={photoUrl} 
             songId={song.id} 
             theme={theme} 
             archetype={archetype} 
          />
        </div>
      </div>
      
      <audio 
        key={currentAudioUrl}
        ref={audioRef} 
        src={currentAudioUrl || undefined} 
        referrerPolicy="no-referrer"
      />
      
      {/* Modal de Edición */}
      {isEditing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsEditing(false)}></div>
          <div className={`${tokens.bg} rounded-2xl p-6 md:p-8 max-w-md w-full relative z-10 border ${tokens.border} shadow-2xl max-h-[90vh] overflow-y-auto`}>
            <h3 className={`text-lg md:text-xl font-serif ${tokens.text} uppercase tracking-widest mb-6 text-center border-b ${tokens.border} border-opacity-30 pb-4`}>Personalizar Infografía</h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-bold text-[#555] uppercase tracking-widest mb-2">Foto Principal</label>
                <div className={`border border-dashed ${tokens.border} bg-white rounded-xl p-4 text-center hover:opacity-80 transition cursor-pointer relative overflow-hidden`}>
                  {isUploading ? (
                    <div className="py-4">
                      <div className="animate-spin w-6 h-6 border-2 border-[#B69D74] border-t-transparent rounded-full mx-auto"></div>
                    </div>
                  ) : editData.photoUrl && editData.photoUrl !== "/papa-sorpresa.png" ? (
                    <div className="relative group">
                      <img src={editData.photoUrl} alt="Preview" className="w-full h-32 object-cover rounded-lg sepia-[0.2]" />
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                        <span className="text-white text-xs font-bold flex items-center gap-1"><Edit3 size={12}/> Cambiar foto</span>
                      </div>
                      <input type="file" accept="image/*" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                    </div>
                  ) : (
                    <div className="py-2">
                      <ImageIcon className="mx-auto text-[#B69D74] mb-2" />
                      <span className="text-xs text-[#555]">Haz clic para subir una foto</span>
                      <input type="file" accept="image/*" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#555] uppercase tracking-widest mb-2">Nombre Completo</label>
                <input 
                  type="text" 
                  value={editData.recipient}
                  onChange={e => setEditData({...editData, recipient: e.target.value})}
                  className="w-full border border-[#E8DCC8] bg-white rounded-xl p-3 outline-none focus:border-[#B69D74] text-sm font-serif"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#555] uppercase tracking-widest mb-2">Frase Célebre (Bajo la foto)</label>
                <textarea 
                  value={editData.dedication}
                  onChange={e => setEditData({...editData, dedication: e.target.value})}
                  rows={2}
                  className="w-full border border-[#E8DCC8] bg-white rounded-xl p-3 outline-none focus:border-[#B69D74] resize-none text-sm font-serif italic"
                ></textarea>
              </div>

              <div className="flex gap-4 pt-4 border-t border-[#B69D74] border-opacity-30">
                <button onClick={() => setIsEditing(false)} className="flex-1 py-3 text-[#555] font-bold hover:bg-[#E8DCC8] rounded-xl transition text-xs uppercase tracking-widest">Cancelar</button>
                <button onClick={saveEdits} disabled={isUploading} className="flex-1 py-3 bg-[#1C2A39] text-white font-bold rounded-xl hover:bg-[#2A3F54] transition disabled:opacity-50 text-xs uppercase tracking-widest">Guardar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Demostración Completa (Límite 1.5 min alcanzado) */}
      {showDemoModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in zoom-in duration-300">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowDemoModal(false)}></div>
          <div className={`${tokens.bg} rounded-[2rem] p-10 md:p-12 max-w-lg w-full shadow-2xl relative z-10 border ${tokens.border} border-opacity-30 text-center space-y-6`}>
            <div className="w-20 h-20 bg-naranja-50 text-naranja-500 rounded-full flex items-center justify-center mx-auto mb-2 border border-naranja-100 shadow-inner">
              <Lock size={40} className="text-[#B69D74]" />
            </div>
            <h3 className={`text-2xl md:text-3xl font-serif ${tokens.text}`}>¡La magia continúa! ✨</h3>
            <p className="text-ink-600/80 leading-relaxed text-sm">
              Has escuchado la muestra de 1.5 minutos de tu regalo. La versión completa de la canción contiene toda la letra personalizada sin interrupciones y con la máxima calidad de audio.
            </p>
            <button 
              onClick={() => {
                setShowDemoModal(false);
                window.location.href = `https://buy.stripe.com/dRm5kwcXzf2T7kgdI72Ry00?client_reference_id=${song.id}`;
              }}
              className="w-full py-5 bg-gradient-to-r from-[#D64060] to-[#B69D74] text-white rounded-2xl font-bold text-base shadow-xl hover:scale-[1.02] transition-all uppercase tracking-widest text-xs"
            >
              DESBLOQUEAR AHORA
            </button>
            <button 
              onClick={() => setShowDemoModal(false)}
              className="text-gray-400 text-[10px] font-bold uppercase tracking-widest hover:text-[#B69D74] transition-all block mx-auto animate-pulse"
            >
              SEGUIR EXPLORANDO LA BIOGRAFÍA
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
