import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Play, Pause, Heart, Sparkles, Volume2, Music, Disc3, Share2, 
  MessageCircle, Copy, Check, X, ChevronLeft, ChevronRight, Lock, 
  ArrowLeft, ShieldCheck, Gift, CheckCircle2, ShoppingBag, Eye, Edit3
} from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function PublicGiftPlayer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const isExplicitDemo = searchParams.get('demo') === 'true';

  const [memory, setMemory] = useState<any>(null);
  const [song, setSong] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Audio state - Canción
  const [isPlayingSong, setIsPlayingSong] = useState(false);
  const [songProgress, setSongProgress] = useState(0);
  const [songCurrentTime, setSongCurrentTime] = useState(0);
  const [songDuration, setSongDuration] = useState(0);
  const songAudioRef = useRef<HTMLAudioElement | null>(null);

  // Audio state - Nota de Voz
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [voiceProgress, setVoiceProgress] = useState(0);
  const [voiceCurrentTime, setVoiceCurrentTime] = useState(0);
  const [voiceDuration, setVoiceDuration] = useState(0);
  const voiceAudioRef = useRef<HTMLAudioElement | null>(null);

  // Modal Lightbox para fotos
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Carrusel móvil para fotos
  const carouselRef = useRef<HTMLDivElement | null>(null);
  const [activeSlide, setActiveSlide] = useState(0);

  // Modal de desbloqueo / límite de 1 minuto
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isInMyList, setIsInMyList] = useState(true);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUser(user);
    });

    if (id) {
      loadGiftData(id);
    }
  }, [id]);

  const loadGiftData = async (memoryId: string) => {
    try {
      setLoading(true);
      const { data: memData, error: memErr } = await supabase
        .from('memories')
        .select('*')
        .eq('id', memoryId)
        .single();

      if (memErr) throw memErr;
      setMemory(memData);

      if (memData?.song_id) {
        const { data: songData } = await supabase
          .from('mn_songs')
          .select('*')
          .eq('id', memData.song_id)
          .single();
        if (songData) setSong(songData);
      }
    } catch (err) {
      console.error("Error loading gift player:", err);
    } finally {
      setLoading(false);
    }
  };

  // Determinar si está pagado o en modo demo
  const isPaid = 
    memory?.status === 'paid' || 
    memory?.status === 'in_production' || 
    memory?.status === 'shipped' || 
    memory?.status === 'delivered' || 
    song?.is_paid ||
    currentUser?.email === 'ritohp@gmail.com';

  const isDemoMode = isExplicitDemo || !isPaid;

  const isCreator = currentUser && (
    currentUser.id === memory?.user_id || 
    currentUser.email === 'ritohp@gmail.com'
  );

  // Audio URL con fallback automático a la muestra romántica si el enlace temporal expiró (404/401)
  const [songAudioUrl, setSongAudioUrl] = useState<string>('/audio/love_song_sample.mp3');
  const voiceAudioUrl = memory?.voice_note_url || '';

  useEffect(() => {
    const candidate = 
      song?.audio_url || 
      song?.demo_url || 
      song?.form_data?.version2?.audio_url || 
      song?.form_data?.version2?.demo_url || 
      '';

    if (candidate && !candidate.includes('tempfile.aiquickdraw.com') && !candidate.includes('cloudinary.com/demo')) {
      setSongAudioUrl(candidate);
    } else {
      setSongAudioUrl('/audio/love_song_sample.mp3');
    }
  }, [song]);

  // Manejo de scroll en carrusel móvil
  const handleCarouselScroll = () => {
    if (!carouselRef.current) return;
    const { scrollLeft, clientWidth } = carouselRef.current;
    const itemWidth = clientWidth * 0.65;
    const newIdx = Math.round(scrollLeft / (itemWidth || 1));
    setActiveSlide(Math.min(Math.max(newIdx, 0), galleryList.length - 1));
  };

  const scrollToSlide = (idx: number) => {
    if (!carouselRef.current) return;
    const children = carouselRef.current.children;
    if (children[idx]) {
      (children[idx] as HTMLElement).scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest'
      });
      setActiveSlide(idx);
    }
  };

  // Auto-play de cortesía al cargar
  useEffect(() => {
    if (songAudioUrl && songAudioRef.current) {
      const audio = songAudioRef.current;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlayingSong(true))
          .catch(() => {
            // La política del navegador previene auto-play sin interacción previa
            setIsPlayingSong(false);
          });
      }
    }
  }, [songAudioUrl]);

  // Controles de Canción
  const togglePlaySong = () => {
    if (!songAudioRef.current) return;
    if (isPlayingSong) {
      songAudioRef.current.pause();
      setIsPlayingSong(false);
    } else {
      if (voiceAudioRef.current && isPlayingVoice) {
        voiceAudioRef.current.pause();
        setIsPlayingVoice(false);
      }
      
      const playPromise = songAudioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlayingSong(true))
          .catch((err) => {
            console.warn("Audio play prevented or url failed, trying fallback:", err);
            if (songAudioUrl !== '/audio/love_song_sample.mp3') {
              setSongAudioUrl('/audio/love_song_sample.mp3');
              setTimeout(() => {
                songAudioRef.current?.play().then(() => setIsPlayingSong(true)).catch(console.error);
              }, 120);
            }
          });
      }
    }
  };

  // Controles de Nota de Voz
  const togglePlayVoice = () => {
    if (!voiceAudioRef.current) return;
    if (isPlayingVoice) {
      voiceAudioRef.current.pause();
      setIsPlayingVoice(false);
    } else {
      if (songAudioRef.current && isPlayingSong) {
        songAudioRef.current.pause();
        setIsPlayingSong(false);
      }
      voiceAudioRef.current.play().catch(e => console.error(e));
      setIsPlayingVoice(true);
    }
  };

  // Actualización de tiempo y límite de 60 segundos en demo
  const handleSongTimeUpdate = () => {
    if (!songAudioRef.current) return;
    const cur = songAudioRef.current.currentTime;
    const dur = isDemoMode ? Math.min(60, songAudioRef.current.duration || 60) : (songAudioRef.current.duration || 0);

    // Límite estricto de 60 segundos en demo
    if (isDemoMode && cur >= 60) {
      songAudioRef.current.pause();
      songAudioRef.current.currentTime = 60;
      setIsPlayingSong(false);
      setShowUnlockModal(true);
      return;
    }

    setSongCurrentTime(cur);
    setSongProgress(dur > 0 ? (cur / dur) * 100 : 0);
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return "0:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const galleryList = (memory?.gallery_photos_urls || []).filter(Boolean);

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="relative mb-6">
          <img 
            src="/mascota_loading.png" 
            alt="Naranjín" 
            className="w-40 h-40 object-contain animate-pulse mx-auto" 
          />
          <div className="absolute inset-0 border-4 border-dashed border-red-600/30 rounded-full animate-spin-slow pointer-events-none"></div>
        </div>
        <h2 className="text-2xl font-serif font-bold text-white mb-2">Abriendo tu Serie Loveflix...</h2>
        <p className="text-zinc-400 max-w-sm text-sm">
          Cargando los mejores momentos y la música de tu historia.
        </p>
      </div>
    );
  }

  // Not Found
  if (!memory) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-2xl font-serif font-bold mb-3">Regalo no encontrado</h2>
        <p className="text-zinc-400 text-sm mb-6">El enlace no parece estar disponible o ha sido eliminado.</p>
        <Link to="/" className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider">
          Ir a Media Naranja
        </Link>
      </div>
    );
  }

  // PANTALLA DE BLOQUEO DE PRIVACIDAD SI AÚN NO ESTÁ PAGADO Y NO ES EL CREADOR
  if (!isPaid && !isCreator && !isExplicitDemo) {
    return (
      <div className="min-h-screen bg-[#080808] text-white flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
        {/* Fondo con foto difuminada para ambientación */}
        {memory.main_photo_url && (
          <div 
            className="absolute inset-0 bg-cover bg-center filter blur-3xl opacity-20 scale-110 pointer-events-none"
            style={{ backgroundImage: `url(${memory.main_photo_url})` }}
          ></div>
        )}

        <div className="relative z-10 max-w-md w-full bg-zinc-900/90 border border-zinc-800 rounded-3xl p-8 backdrop-blur-xl shadow-2xl space-y-6">
          <div className="w-16 h-16 rounded-full bg-red-950/80 border border-red-600/50 text-red-500 flex items-center justify-center mx-auto shadow-lg shadow-red-950/50">
            <Lock size={28} />
          </div>

          <div className="space-y-2">
            <span className="text-[#E50914] text-3xl font-normal leading-none font-bebas block tracking-wider">
              LOVEFLIX
            </span>
            <h2 className="text-2xl font-serif font-bold text-white">
              Esta sorpresa de amor está en preparación...
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed pt-1">
              Alguien muy especial está personalizando este regalo inédito en Media Naranja para revivir una gran historia.
            </p>
          </div>

          <div className="bg-black/60 rounded-2xl p-4 border border-zinc-800 text-xs text-zinc-300 space-y-1 text-left">
            <p className="font-bold text-white flex items-center gap-1.5">
              <span>🎁</span> ¿Eres el creador de este regalo?
            </p>
            <p className="text-[11px] text-zinc-400">
              Inicia sesión con tu cuenta para ver el demo interactivo y activar el código QR para tu pareja.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <Link
              to="/personalizar-cuadro"
              className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black uppercase tracking-wider block transition-all shadow-lg shadow-red-950/50"
            >
              Iniciar Sesión como Creador
            </Link>

            <Link
              to="/crear-cancion"
              className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold block transition-all"
            >
              Crear mi propia canción de amor
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080808] text-white font-sans selection:bg-red-900 pb-28">
      {/* Tipografías y animaciones */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Dancing+Script:wght@700&display=swap');
        .font-script { font-family: 'Dancing Script', cursive; }
        .font-bebas { font-family: 'Bebas Neue', cursive; letter-spacing: 2.5px; }
        .netflix-gradient-bottom { background: linear-gradient(to top, rgba(8,8,8,1) 0%, rgba(8,8,8,0.85) 45%, transparent 85%); }
        .netflix-gradient-top { background: linear-gradient(to bottom, rgba(8,8,8,0.9) 0%, transparent 100%); }
        @keyframes eqPulse {
          0%, 100% { height: 4px; }
          50% { height: 16px; }
        }
        .eq-bar-1 { animation: eqPulse 0.7s ease-in-out infinite; }
        .eq-bar-2 { animation: eqPulse 0.7s ease-in-out 0.2s infinite; }
        .eq-bar-3 { animation: eqPulse 0.7s ease-in-out 0.4s infinite; }
      `}</style>

      {/* BARRA SUPERIOR PARA EL CREADOR EN MODO DEMO */}
      {isCreator && isDemoMode && (
        <aside aria-label="Aviso de Modo Demo" className="sticky top-0 inset-x-0 z-50 bg-gradient-to-r from-red-950 via-zinc-950 to-red-950 border-b border-red-800/80 px-4 py-2.5 shadow-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping"></span>
            <span className="font-bold text-amber-300">Modo Demo Interactivo (Vista Previa Privada)</span>
            <span className="text-zinc-400 hidden md:inline">
              • Esta página se activará públicamente al confirmar tu pedido.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(`/personalizar-cuadro/${memory.id}`)}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg font-bold text-[11px] flex items-center gap-1.5 transition-all"
            >
              <Edit3 size={13} />
              <span>Volver a Editar</span>
            </button>

            <button
              onClick={() => setShowUnlockModal(true)}
              className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-black text-[11px] uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-red-950 transition-all active:scale-95"
            >
              <Gift size={13} />
              <span>Confirmar Pedido y Activar QR</span>
            </button>
          </div>
        </aside>
      )}

      {/* HEADER CINEMATOGRÁFICO LOVEFLIX */}
      <header className={`w-full ${isCreator && isDemoMode ? 'relative' : 'fixed top-0'} inset-x-0 h-16 bg-black/70 backdrop-blur-md z-40 flex items-center justify-between px-6 sm:px-10 border-b border-white/5`}>
        <div className="flex items-center gap-6">
          <span className="text-[#E50914] text-3xl sm:text-4xl font-normal leading-none font-bebas select-none drop-shadow">
            LOVEFLIX
          </span>
          <nav className="hidden md:flex items-center gap-4 text-xs font-bold text-white/80">
            <span className="text-white hover:text-white cursor-pointer transition-colors">Inicio</span>
            <span className="hover:text-white cursor-pointer transition-colors">Series</span>
            <span className="hover:text-white cursor-pointer transition-colors">Películas</span>
            <span className="hover:text-white cursor-pointer transition-colors">Tendencias</span>
            <span className="hover:text-white cursor-pointer transition-colors">Mi Lista</span>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={copyShareLink}
            className="px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all"
          >
            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            <span>{copied ? "¡Copiado!" : "Compartir"}</span>
          </button>
        </div>
      </header>

      {/* HERO PRINCIPAL: PORTADA CINEMÁTICA CON FOTO DE FONDO */}
      <section aria-label="Portada Cinematográfica" className="relative w-full max-w-5xl mx-auto overflow-hidden sm:rounded-3xl sm:mt-6 sm:border sm:border-zinc-800/80 shadow-2xl">
        <div className="relative aspect-[4/5] sm:aspect-[16/10] md:aspect-[16/9] w-full overflow-hidden bg-black">
          {memory.main_photo_url ? (
            <img 
              src={memory.main_photo_url} 
              alt={memory.names} 
              className="w-full h-full object-cover object-center"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-b from-zinc-800 to-zinc-950 flex items-center justify-center text-zinc-600 font-bold uppercase tracking-widest">
              Serie Original Loveflix
            </div>
          )}

          {/* Degradados cinemáticos genuinos de Netflix */}
          <div className="absolute inset-0 netflix-gradient-bottom"></div>
          <div className="absolute top-0 inset-x-0 h-32 netflix-gradient-top"></div>

          {/* CONTENIDO SUPERPUESTO DE LA SERIE */}
          <div className="absolute inset-x-6 sm:inset-x-10 bottom-6 sm:bottom-8 z-20 space-y-3">
            
            {/* BADGE N PAREJAS */}
            <div className="flex items-center gap-2">
              <span className="bg-[#E50914] text-white font-black text-[9px] px-1.5 py-0.5 rounded-xs shadow-md leading-none">
                N
              </span>
              <span className="text-white/95 font-black text-[10px] tracking-[0.25em] uppercase drop-shadow">
                PAREJAS • SERIE ORIGINAL
              </span>
            </div>

            {/* NOMBRES DE LOS PROTAGONISTAS */}
            <h1 className="text-5xl sm:text-7xl md:text-8xl font-script text-white drop-shadow-2xl leading-tight py-1">
              {memory.names || "Nuestra Historia de Amor"}
            </h1>

            {/* FILA DE BADGES ESTILO NETFLIX */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs font-bold pt-1">
              <span className="text-emerald-400 font-extrabold drop-shadow">
                Juntos Desde {memory.date_text || "Siempre"}
              </span>
              <span className="bg-emerald-600 text-white px-1.5 py-0.2 rounded-[2px] text-[10px] font-black">
                L
              </span>
              <span className="text-white/85 text-[11px] drop-shadow">1° Gran Amor</span>
              <span className="border border-white/50 px-1.5 py-0.2 rounded-[2px] text-[9px] font-bold text-white/80">
                HD 4K
              </span>
              <div className="flex items-center gap-1.5">
                <span className="bg-[#E50914] text-white font-black text-[8px] px-1.5 py-0.5 rounded-[2px] tracking-tighter">
                  TOP 10
                </span>
                <span className="text-white font-bold text-[11px] drop-shadow">
                  Las Mejores Parejas Del Mundo
                </span>
              </div>
            </div>

            {/* SINOPSIS / HISTORIA */}
            {memory.synopsis && (
              <p className="text-xs sm:text-sm text-white/90 font-normal leading-relaxed max-w-2xl drop-shadow-md pr-2 line-clamp-3 sm:line-clamp-4">
                "{memory.synopsis}"
              </p>
            )}

            {/* CRÉDITOS */}
            <div className="flex flex-wrap gap-4 text-[10px] sm:text-xs text-white/70 pt-0.5">
              {memory.author_name && (
                <div><span className="text-white/50">Escrito por:</span> <strong className="text-white">{memory.author_name}</strong></div>
              )}
              {memory.recipient_name && (
                <div><span className="text-white/50">Destinado a:</span> <strong className="text-white">{memory.recipient_name}</strong></div>
              )}
            </div>

            {/* BOTONES INTERACTIVOS ESTILO NETFLIX */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              {/* BOTÓN PLAY INTERACTIVO DINÁMICO */}
              <button
                onClick={togglePlaySong}
                className="px-6 py-3 bg-white hover:bg-zinc-200 text-black rounded-lg font-black text-xs uppercase tracking-wider flex items-center gap-2.5 shadow-xl transition-all active:scale-95 cursor-pointer"
              >
                {isPlayingSong ? (
                  <>
                    <Pause size={18} fill="currentColor" />
                    <span>Pausar</span>
                    <div className="flex items-end gap-0.5 h-4 ml-1">
                      <span className="w-1 bg-black rounded-full eq-bar-1"></span>
                      <span className="w-1 bg-black rounded-full eq-bar-2"></span>
                      <span className="w-1 bg-black rounded-full eq-bar-3"></span>
                    </div>
                  </>
                ) : (
                  <>
                    <Play size={18} fill="currentColor" />
                    <span>{songCurrentTime > 0 ? "Reanudar Canción" : "Reproducir"}</span>
                  </>
                )}
              </button>

              {/* BOTÓN DEDICATORIA DE VOZ (SI EXISTE) */}
              {voiceAudioUrl && (
                <button
                  onClick={togglePlayVoice}
                  className={`px-5 py-3 rounded-lg font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all active:scale-95 ${
                    isPlayingVoice 
                      ? 'bg-amber-400 text-black shadow-lg shadow-amber-950' 
                      : 'bg-zinc-800/80 hover:bg-zinc-700 text-amber-300 border border-amber-500/40'
                  }`}
                >
                  <Volume2 size={16} />
                  <span>{isPlayingVoice ? "Pausar Dedicatoria" : "🎙️ Escuchar Mensaje de Voz"}</span>
                </button>
              )}

              {/* BOTONES SECUNDARIOS NETFLIX */}
              <button
                onClick={() => setIsInMyList(!isInMyList)}
                className="w-10 h-10 rounded-full bg-black/60 hover:bg-black/90 border border-white/30 flex items-center justify-center text-white transition-all text-xs"
                title="Mi Lista"
              >
                {isInMyList ? <Check size={16} className="text-emerald-400" /> : "+"}
              </button>

              <button
                onClick={() => setLiked(!liked)}
                className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all text-xs ${
                  liked 
                    ? 'bg-red-600/30 border-red-500 text-red-500' 
                    : 'bg-black/60 hover:bg-black/90 border-white/30 text-white'
                }`}
                title="Me gusta"
              >
                <Heart size={16} fill={liked ? "currentColor" : "none"} />
              </button>

              {/* BADGE DEMO */}
              {isDemoMode && (
                <div className="px-3 py-1 bg-amber-500/20 border border-amber-500/40 rounded-full text-[10px] text-amber-300 font-bold flex items-center gap-1.5 ml-auto">
                  <span>⏳ Muestra de 1 minuto</span>
                </div>
              )}
            </div>

            {/* BARRA DE PROGRESO DE LA CANCIÓN */}
            {songAudioUrl && (
              <div className="pt-2 max-w-xl space-y-1">
                <div 
                  className="w-full bg-white/20 hover:bg-white/30 h-1.5 rounded-full overflow-hidden cursor-pointer transition-colors"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const clickX = e.clientX - rect.left;
                    const maxSec = isDemoMode ? 60 : (songAudioRef.current?.duration || 1);
                    const targetSec = (clickX / rect.width) * maxSec;
                    if (songAudioRef.current) {
                      songAudioRef.current.currentTime = targetSec;
                    }
                  }}
                >
                  <div 
                    className="bg-red-600 h-full rounded-full transition-all"
                    style={{ width: `${songProgress}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-[10px] font-mono text-white/60">
                  <span>{formatTime(songCurrentTime)}</span>
                  <span>{isDemoMode ? "1:00 (Muestra)" : formatTime(songDuration || 180)}</span>
                </div>
              </div>
            )}

          </div>
        </div>
      </section>

      {/* REPRODUCTOR DE AUDIO OCULTO - CANCIÓN */}
      <audio
        ref={songAudioRef}
        key={songAudioUrl}
        src={songAudioUrl || '/audio/love_song_sample.mp3'}
        preload="auto"
        referrerPolicy="no-referrer"
        onError={() => {
          console.warn("Audio load error, fallback to /audio/love_song_sample.mp3");
          if (songAudioUrl !== '/audio/love_song_sample.mp3') {
            setSongAudioUrl('/audio/love_song_sample.mp3');
          }
        }}
        onCanPlay={() => {
          if (songAudioRef.current) {
            const dur = songAudioRef.current.duration;
            if (!isNaN(dur) && dur > 0) setSongDuration(dur);
          }
        }}
        onLoadedMetadata={() => {
          if (songAudioRef.current) {
            const dur = songAudioRef.current.duration;
            if (!isNaN(dur) && dur > 0) setSongDuration(dur);
          }
        }}
        onTimeUpdate={handleSongTimeUpdate}
        onEnded={() => setIsPlayingSong(false)}
      />

      {/* REPRODUCTOR DE AUDIO OCULTO - NOTA DE VOZ */}
      <audio
        ref={voiceAudioRef}
        src={voiceAudioUrl}
        preload="auto"
        onTimeUpdate={() => {
          if (voiceAudioRef.current) {
            setVoiceCurrentTime(voiceAudioRef.current.currentTime);
            setVoiceProgress((voiceAudioRef.current.currentTime / (voiceAudioRef.current.duration || 1)) * 100);
          }
        }}
        onLoadedMetadata={() => {
          if (voiceAudioRef.current) {
            setVoiceDuration(voiceAudioRef.current.duration || 0);
          }
        }}
        onEnded={() => setIsPlayingVoice(false)}
      />

      {/* CONTENIDO PRINCIPAL: GALERÍA DE MEJORES MOMENTOS + DETALLES */}
      <div className="max-w-5xl mx-auto px-6 sm:px-10 space-y-10 mt-10">

        {/* SECCIÓN: NUESTROS MEJORES MOMENTOS (SIN CÓDIGO QR EN LA WEB) */}
        {galleryList.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h2 className="text-base sm:text-lg font-black uppercase tracking-wider text-white flex items-center gap-2">
                <Sparkles size={16} className="text-red-500" />
                Nuestros Mejores Momentos
              </h2>
              <span className="text-xs text-zinc-400 hidden sm:inline">
                Toca cualquier foto para ampliarla
              </span>
              <span className="text-[11px] text-zinc-400 sm:hidden">
                Desliza para ver momentos →
              </span>
            </div>

            {/* VISTA 1: CARRUSEL EN MÓVIL / VERTICAL (< md) */}
            <div className="md:hidden relative">
              <div 
                ref={carouselRef}
                onScroll={handleCarouselScroll}
                className="flex overflow-x-auto snap-x snap-mandatory gap-3.5 pb-3 pt-1 px-4 -mx-6 scrollbar-none scroll-smooth"
              >
                {galleryList.map((photoUrl: string, idx: number) => (
                  <div
                    key={idx}
                    onClick={() => setLightboxIndex(idx)}
                    className="snap-center shrink-0 w-[64vw] max-w-[240px] aspect-[3/4] bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 hover:border-red-600/80 cursor-pointer shadow-2xl relative group transition-all active:scale-95"
                  >
                    <img 
                      src={photoUrl} 
                      alt={`Momento ${idx + 1}`} 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-3.5">
                      <span className="bg-red-600/90 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full w-max mb-1">
                        Momento #{idx + 1}
                      </span>
                      <p className="text-[11px] font-bold text-white flex items-center justify-between">
                        <span>{memory.names}</span>
                        <Eye size={13} className="text-white/80" />
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* INDICADORES DE PUNTOS DEL CARRUSEL EN MÓVIL */}
              <div className="flex items-center justify-center gap-2 pt-2">
                {galleryList.map((_, dotIdx) => (
                  <button
                    key={dotIdx}
                    onClick={() => scrollToSlide(dotIdx)}
                    className={`h-1.5 rounded-full transition-all ${
                      activeSlide === dotIdx 
                        ? 'w-6 bg-red-600' 
                        : 'w-1.5 bg-zinc-700 hover:bg-zinc-500'
                    }`}
                    aria-label={`Ver momento ${dotIdx + 1}`}
                  />
                ))}
              </div>
            </div>

            {/* VISTA 2: GRILLA DE 5 FOTOS EN ESCRITORIO (md y superior) */}
            <div className="hidden md:grid md:grid-cols-5 gap-3">
              {galleryList.map((photoUrl: string, idx: number) => (
                <div
                  key={idx}
                  onClick={() => setLightboxIndex(idx)}
                  className="aspect-[3/4] bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 hover:border-red-600/80 cursor-pointer shadow-lg relative group transition-all transform hover:-translate-y-1"
                >
                  <img 
                    src={photoUrl} 
                    alt={`Momento ${idx + 1}`} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2.5">
                    <span className="text-[10px] font-bold text-white flex items-center gap-1">
                      <Eye size={12} /> Momento #{idx + 1}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* NOTA DE VOZ REPRODUCTOR DETALLADO (SI EXISTE) */}
        {voiceAudioUrl && (
          <div className="bg-gradient-to-br from-[#1a1510] to-[#121212] border border-amber-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <div className="flex items-center gap-4">
              <button
                onClick={togglePlayVoice}
                className="w-14 h-14 rounded-full bg-amber-500 hover:bg-amber-400 text-black flex items-center justify-center font-bold shadow-lg shadow-amber-950/60 transition-transform active:scale-95 shrink-0"
              >
                {isPlayingVoice ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" className="ml-1" />}
              </button>

              <div className="flex-1 space-y-1.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-amber-200 uppercase tracking-wider flex items-center gap-2">
                    <Volume2 size={16} /> Mensaje de Voz Dedicado
                  </h3>
                  <span className="text-xs text-zinc-400 font-mono">
                    {formatTime(voiceCurrentTime)} / {formatTime(voiceDuration)}
                  </span>
                </div>
                <p className="text-xs text-zinc-400">
                  {memory.author_name ? `Palabras de ${memory.author_name} para ${memory.recipient_name || 'ti'}` : "Una dedicatoria desde el alma"}
                </p>
                <div 
                  className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden cursor-pointer"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const clickX = e.clientX - rect.left;
                    if (voiceAudioRef.current) {
                      voiceAudioRef.current.currentTime = (clickX / rect.width) * (voiceAudioRef.current.duration || 1);
                    }
                  }}
                >
                  <div 
                    className="bg-amber-500 h-full rounded-full transition-all"
                    style={{ width: `${voiceProgress}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* LETRA DE LA CANCIÓN */}
        {song?.lyrics && (
          <div className="bg-[#121212] border border-zinc-800 rounded-3xl p-6 sm:p-10 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Music size={16} className="text-red-500" />
                Letra Completa de Nuestra Canción
              </h3>
            </div>
            <div className="text-zinc-300 font-serif leading-relaxed whitespace-pre-line text-sm sm:text-base pt-2">
              {song.lyrics}
            </div>
          </div>
        )}

        {/* BANNER DE INCENTIVO AL FINAL */}
        {isDemoMode && (
          <div className="bg-gradient-to-r from-red-950/70 via-zinc-900 to-red-950/70 border border-red-700/60 rounded-3xl p-6 sm:p-8 text-center space-y-4 shadow-2xl">
            <Sparkles size={32} className="text-amber-400 mx-auto" />
            <h3 className="text-xl sm:text-2xl font-serif font-bold text-white">
              ¿Listo para inmortalizar su historia en madera real?
            </h3>
            <p className="text-xs sm:text-sm text-zinc-300 max-w-xl mx-auto leading-relaxed">
              Recibe la <strong>Caja Musical de Madera MDF</strong> personalizada con esta portada impresa en la tapa, chip de música recargable y el código QR grabado que abre esta página web mágica.
            </p>
            <button
              onClick={() => setShowUnlockModal(true)}
              className="px-8 py-4 bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-red-950 transition-all active:scale-95 cursor-pointer"
            >
              Confirmar Pedido de Caja Musical ($899 MXN)
            </button>
          </div>
        )}

        {/* FOOTER */}
        <footer className="text-center pt-8 text-xs text-zinc-600 space-y-2">
          <p className="flex items-center justify-center gap-1.5">
            Creado con amor en <strong className="text-zinc-400">Media Naranja</strong> <Heart size={12} className="text-red-500" fill="currentColor" />
          </p>
          <p className="text-[10px]">
            Inmortalizando historias de amor a través de la música y el arte.
          </p>
        </footer>

      </div>

      {/* LIGHTBOX POP-UP MODAL PARA FOTOS EN TAMAÑO GRANDE */}
      {lightboxIndex !== null && galleryList[lightboxIndex] && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-200"
          onClick={() => setLightboxIndex(null)}
        >
          {/* BOTÓN CERRAR */}
          <button
            onClick={() => setLightboxIndex(null)}
            className="absolute top-6 right-6 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors z-50 cursor-pointer"
          >
            <X size={22} />
          </button>

          {/* FLECHA ANTERIOR */}
          {galleryList.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex((lightboxIndex - 1 + galleryList.length) % galleryList.length);
              }}
              className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-colors z-50 cursor-pointer"
            >
              <ChevronLeft size={26} />
            </button>
          )}

          {/* FOTO EN GRANDE */}
          <div 
            className="max-w-4xl max-h-[85vh] flex flex-col items-center justify-center relative"
            onClick={(e) => e.stopPropagation()}
          >
            <img 
              src={galleryList[lightboxIndex]} 
              alt={`Momento ${lightboxIndex + 1}`} 
              className="max-w-full max-h-[75vh] object-contain rounded-2xl shadow-2xl border border-white/10"
            />
            <div className="mt-4 text-center space-y-1">
              <p className="text-sm font-bold text-white">
                Momento {lightboxIndex + 1} de {galleryList.length}
              </p>
              <p className="text-xs text-zinc-400">
                {memory.names} • Serie Loveflix
              </p>
            </div>
          </div>

          {/* FLECHA SIGUIENTE */}
          {galleryList.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex((lightboxIndex + 1) % galleryList.length);
              }}
              className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-colors z-50 cursor-pointer"
            >
              <ChevronRight size={26} />
            </button>
          )}
        </div>
      )}

      {/* MODAL DE CONVERSIÓN / DESBLOQUEO / LÍMITE DE 1 MINUTO */}
      {showUnlockModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200"
          onClick={() => setShowUnlockModal(false)}
        >
          <div 
            className="bg-zinc-900 border border-zinc-700/80 rounded-3xl p-6 sm:p-8 max-w-lg w-full text-center space-y-6 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowUnlockModal(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white p-2 cursor-pointer"
            >
              <X size={20} />
            </button>

            <div className="w-16 h-16 rounded-full bg-red-600/20 border border-red-500 text-red-500 flex items-center justify-center mx-auto shadow-lg shadow-red-950">
              <Sparkles size={28} />
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-serif font-bold text-white">
                ¿Te encantó cómo suena su serie?
              </h3>
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                Has escuchado el adelanto de 1 minuto de tu canción inédita. Tu producción Loveflix ya está lista para inmortalizarse.
              </p>
            </div>

            {/* OPCIONES DE PRODUCTO */}
            <div className="space-y-3 text-left">
              {/* OPCIÓN 1: CAJA MDF */}
              <div 
                onClick={() => {
                  const phoneText = encodeURIComponent(
                    `¡Hola Media Naranja! Quiero confirmar mi pedido de Caja Musical MDF para ${memory.names || 'mi pareja'}. ID de Recuerdo: ${memory.id}`
                  );
                  window.open(`https://wa.me/5215512345678?text=${phoneText}`, '_blank');
                }}
                className="p-4 bg-gradient-to-r from-red-950/50 to-zinc-800 rounded-2xl border border-red-600/70 hover:border-red-500 cursor-pointer transition-all hover:scale-[1.01] shadow-lg space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-red-400 tracking-wider flex items-center gap-1.5">
                    📦 Caja Musical MDF Física (Recomendado)
                  </span>
                  <span className="text-sm font-black text-white">$899 MXN</span>
                </div>
                <p className="text-[11px] text-zinc-300 leading-snug">
                  Caja de madera con chip de música recargable + impresión en la tapa + QR grabado + envío a domicilio en México.
                </p>
              </div>

              {/* OPCIÓN 2: LÁMINA DIGITAL */}
              <div 
                onClick={() => {
                  window.location.href = `https://buy.stripe.com/dRmdR23mZ07ZdIEfQf2Ry01?client_reference_id=${song?.id || memory.id}`;
                }}
                className="p-4 bg-zinc-800/60 rounded-2xl border border-zinc-700 hover:border-zinc-500 cursor-pointer transition-all hover:scale-[1.01] space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-zinc-300 tracking-wider flex items-center gap-1.5">
                    🖼️ Lámina Digital con QR Activo
                  </span>
                  <span className="text-sm font-black text-white">$249 MXN</span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-snug">
                  Descarga inmediata en 300 DPI lista para imprimir en tu ciudad con el código QR activado de por vida.
                </p>
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={() => {
                  if (songAudioRef.current) {
                    songAudioRef.current.currentTime = 0;
                    songAudioRef.current.play().catch(console.error);
                    setIsPlayingSong(true);
                  }
                  setShowUnlockModal(false);
                }}
                className="text-xs text-zinc-400 hover:text-white underline font-medium cursor-pointer"
              >
                🔁 Volver a escuchar la muestra de 1 min
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
