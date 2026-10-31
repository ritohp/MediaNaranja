import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Play, Pause, Heart, Sparkles, Volume2, Music, Share2, 
  Copy, Check, X, ChevronLeft, ChevronRight, Lock, 
  ArrowLeft, ShieldCheck, Gift, CheckCircle2, ShoppingBag, Eye, Edit3,
  MapPin, Loader2, Phone
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

  // Sección de Compra Post-Demo: 3 Paquetes o Upgrade
  const [selectedProduct, setSelectedProduct] = useState<'physical_box' | 'digital_poster' | 'solo_cancion'>('digital_poster');
  const [shippingAddress, setShippingAddress] = useState({
    street: '',
    colony: '',
    city: '',
    state: '',
    zipCode: '',
    references: ''
  });
  const [phone, setPhone] = useState('');
  const [isUpdatingOrder, setIsUpdatingOrder] = useState(false);
  const [orderSavedSuccess, setOrderSavedSuccess] = useState(false);

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
      if (memData) {
        setMemory(memData);
        if (memData.shipping_address) {
          try {
            const parsed = typeof memData.shipping_address === 'string'
              ? JSON.parse(memData.shipping_address)
              : memData.shipping_address;
            setShippingAddress(prev => ({ ...prev, ...parsed }));
          } catch (e) {
            console.warn("Could not parse shipping address:", e);
          }
        }
        if (memData.phone) setPhone(memData.phone);
        if (memData.product_type) setSelectedProduct(memData.product_type);
      }

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

  // Determinar si la serie Loveflix está pagada
  const isMemoryPaid = 
    memory?.status === 'paid' || 
    memory?.status === 'in_production' || 
    memory?.status === 'shipped' || 
    memory?.status === 'delivered' || 
    currentUser?.email === 'ritohp@gmail.com';

  // Determinar si el usuario ya pagó la canción por separado (Upgrade Flow: +$199 MXN)
  const isSongPaidOnly = !isMemoryPaid && (song?.is_paid === true);

  const isPaid = isMemoryPaid;
  const isDemoMode = isExplicitDemo || !isMemoryPaid;

  const isCreator = currentUser && (
    currentUser.id === memory?.user_id || 
    currentUser.email === 'ritohp@gmail.com'
  );

  // Audio URL con fallback automático a la muestra romántica si el enlace temporal expiró (404/401)
  const [songAudioUrl, setSongAudioUrl] = useState<string>('/audio/love_song_sample.mp3');
  const voiceAudioUrl = memory?.voice_note_url || '';

  useEffect(() => {
    const selectedVersion = song?.form_data?.selected_version || 1;
    const candidate = selectedVersion === 2
      ? (song?.form_data?.version2?.audio_url || song?.form_data?.version2?.demo_url || song?.audio_url || song?.demo_url || '')
      : (song?.audio_url || song?.demo_url || song?.form_data?.version2?.audio_url || song?.form_data?.version2?.demo_url || '');

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
      // Pausar nota de voz si estaba sonando para que no se encimen
      if (voiceAudioRef.current && isPlayingVoice) {
        voiceAudioRef.current.pause();
        setIsPlayingVoice(false);
      }
      songAudioRef.current.play().catch(console.error);
      setIsPlayingSong(true);
    }
  };

  // Controles de Nota de Voz
  const togglePlayVoice = () => {
    if (!voiceAudioRef.current) return;

    if (isPlayingVoice) {
      voiceAudioRef.current.pause();
      setIsPlayingVoice(false);
    } else {
      // Pausar canción de fondo si estaba sonando
      if (songAudioRef.current && isPlayingSong) {
        songAudioRef.current.pause();
        setIsPlayingSong(false);
      }
      voiceAudioRef.current.play().catch(console.error);
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

  // Guardar y Confirmar Pedido de Caja Musical MDF
  const handleOrderPhysicalBox = async () => {
    if (!shippingAddress.street || !shippingAddress.zipCode || !phone) {
      alert("Por favor completa los campos obligatorios de entrega: Calle, Código Postal y Teléfono.");
      return;
    }

    setIsUpdatingOrder(true);
    try {
      const { error } = await supabase.from('memories').update({
        product_type: 'physical_box',
        shipping_address: JSON.stringify(shippingAddress),
        phone: phone,
      }).eq('id', memory.id);

      if (error) throw error;
      setOrderSavedSuccess(true);

      const message = encodeURIComponent(
        `¡Hola Media Naranja! Quiero confirmar mi pedido de Caja Musical MDF para ${memory.names || 'mi pareja'}.\n\n` +
        `📦 Producto: Caja Musical MDF Personalizada ($899 MXN)\n` +
        `📍 Dirección de entrega: ${shippingAddress.street}, Col. ${shippingAddress.colony || ''}, C.P. ${shippingAddress.zipCode}, ${shippingAddress.city || ''}, ${shippingAddress.state || ''}\n` +
        `📞 Teléfono de contacto: ${phone}\n` +
        `🔗 Ver Serie Loveflix: ${window.location.origin}/escuchar/${memory.id}\n` +
        `🆔 ID de Pedido: ${memory.id}`
      );
      window.open(`https://wa.me/5215512345678?text=${message}`, '_blank');
    } catch (err: any) {
      alert("Error al guardar pedido: " + err.message);
    } finally {
      setIsUpdatingOrder(false);
    }
  };

  // Guardar y Confirmar Experiencia Loveflix Digital o Upgrade
  const handleOrderDigitalLoveflix = async () => {
    setIsUpdatingOrder(true);
    try {
      await supabase.from('memories').update({
        product_type: 'digital_poster',
        status: 'pending_payment',
      }).eq('id', memory.id);

      const price = isSongPaidOnly ? '199' : '399';
      const packageName = isSongPaidOnly 
        ? 'Upgrade Serie Loveflix Digital ($199 MXN)' 
        : 'Experiencia Loveflix Digital ($399 MXN)';

      const message = encodeURIComponent(
        `¡Hola Media Naranja! Quiero confirmar mi pedido de ${packageName} para ${memory.names || 'mi pareja'}.\n\n` +
        `✨ Paquete: ${packageName}\n` +
        `🎵 Canción: ${song?.title || 'Canción Personalizada'}\n` +
        `🔗 Ver Serie Loveflix: ${window.location.origin}/escuchar/${memory.id}\n` +
        `🆔 ID de Pedido: ${memory.id}`
      );
      window.open(`https://wa.me/5215512345678?text=${message}`, '_blank');
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsUpdatingOrder(false);
    }
  };

  // Redirigir a compra de Solo Canción MP3 ($249 MXN)
  const handleOrderSoloCancion = () => {
    const stripeUrl = `https://buy.stripe.com/dRmdR23mZ07ZdIEfQf2Ry01?client_reference_id=${song?.id || memory.id}`;
    window.location.href = stripeUrl;
  };

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
        .netflix-gradient-bottom { background: linear-gradient(to top, rgba(0,0,0,0.96) 0%, rgba(0,0,0,0.85) 45%, rgba(0,0,0,0.4) 75%, transparent 100%); }
        .netflix-gradient-top { background: linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, transparent 100%); }
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
              • Escucha el adelanto y confirma tu pedido para activar el código QR.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(`/personalizar-cuadro/${memory.id}`)}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg font-bold text-[11px] flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Edit3 size={13} />
              <span>Volver a Editar</span>
            </button>

            <button
              onClick={() => {
                const checkoutEl = document.getElementById('checkout-section');
                if (checkoutEl) {
                  checkoutEl.scrollIntoView({ behavior: 'smooth' });
                } else {
                  setShowUnlockModal(true);
                }
              }}
              className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-black text-[11px] uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-red-950 transition-all active:scale-95 cursor-pointer"
            >
              <Gift size={13} />
              <span>Confirmar Pedido y Activar QR</span>
            </button>
          </div>
        </aside>
      )}

      {/* CONTENEDOR PRINCIPAL: PÓSTER CINEMÁTICO VERTICAL LOVEFLIX */}
      {/* Mantiene la proporción alargada 1:1.414 idéntica a la plantilla de impresión para que las fotos verticales luzcan perfectas */}
      <section aria-label="Afiche Loveflix" className="w-full max-w-[560px] mx-auto px-3 sm:px-0 pt-4 sm:pt-6">
        <div className="relative w-full aspect-[1/1.414] bg-black rounded-3xl overflow-hidden shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] border border-zinc-800/80 group">
          
          {/* FOTO PRINCIPAL VERTICAL DE FONDO */}
          <div className="absolute inset-0">
            {memory.main_photo_url ? (
              <img 
                src={memory.main_photo_url} 
                alt={memory.names} 
                className="w-full h-full object-cover object-center"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-b from-zinc-800 to-zinc-950 flex items-center justify-center text-zinc-600 font-bold uppercase tracking-widest text-xs">
                Serie Original Loveflix
              </div>
            )}

            {/* Degradados cinemáticos estilo Netflix */}
            <div className="absolute inset-0 netflix-gradient-bottom"></div>
            <div className="absolute top-0 inset-x-0 h-32 netflix-gradient-top"></div>
          </div>

          {/* CABECERA LOVEFLIX DENTRO DEL AFICHE (ALINEADA EXACTA A LOS BORDES DE LA FOTO) */}
          <header className="absolute top-0 inset-x-0 h-16 flex items-center justify-between px-5 sm:px-7 z-30">
            <div className="flex items-center gap-3 sm:gap-4">
              <span className="text-[#E50914] text-3xl sm:text-4xl font-normal leading-none font-bebas select-none drop-shadow">
                LOVEFLIX
              </span>
              <div className="hidden sm:flex items-center gap-2.5 text-[10px] font-bold text-white/80">
                <span>Inicio</span>
                <span>Series</span>
                <span>Películas</span>
                <span>Tendencias</span>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={copyShareLink}
                className="px-2.5 sm:px-3 py-1 bg-black/50 hover:bg-black/70 backdrop-blur-md border border-white/20 text-white rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                title="Copiar enlace del regalo"
              >
                {copied ? <Check size={13} className="text-emerald-400" /> : <Share2 size={13} />}
                <span className="hidden xs:inline">{copied ? "¡Listo!" : "Compartir"}</span>
              </button>

              <div className="w-7 h-7 rounded-sm bg-[#E50914] border border-white/20 overflow-hidden flex items-center justify-center shrink-0">
                {memory.main_photo_url ? (
                  <img src={memory.main_photo_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[10px] text-white">☺</span>
                )}
              </div>
            </div>
          </header>

          {/* CONTENIDO INFERIOR DEL AFICHE */}
          <div className="absolute inset-x-5 sm:inset-x-7 bottom-4 sm:bottom-6 z-20 flex flex-col justify-end space-y-2 sm:space-y-2.5">
            
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
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-script text-white drop-shadow-2xl leading-tight py-0.5">
              {memory.names || "Nuestra Historia de Amor"}
            </h1>

            {/* FILA DE BADGES ESTILO NETFLIX */}
            <div className="flex flex-wrap items-center gap-2 text-[10px] sm:text-[11px] font-bold">
              <span className="text-emerald-400 font-extrabold drop-shadow">
                Juntos Desde {memory.date_text || "Siempre"}
              </span>
              <span className="bg-emerald-600 text-white px-1 py-0.2 rounded-[2px] text-[9px] font-black">
                L
              </span>
              <span className="text-white/85 drop-shadow">1° Gran Amor</span>
              <span className="border border-white/50 px-1 py-0.2 rounded-[2px] text-[8px] font-bold text-white/80">
                HD 4K
              </span>
              <div className="flex items-center gap-1">
                <span className="bg-[#E50914] text-white font-black text-[8px] px-1 py-0.5 rounded-[2px] tracking-tighter">
                  TOP 10
                </span>
                <span className="text-white font-bold text-[10px] drop-shadow">
                  Las Mejores Parejas Del Mundo
                </span>
              </div>
            </div>

            {/* SINOPSIS */}
            {memory.synopsis && (
              <p className="text-[11px] sm:text-xs text-white/90 font-normal leading-relaxed drop-shadow line-clamp-3">
                "{memory.synopsis}"
              </p>
            )}

            {/* BOTONES INTERACTIVOS */}
            <div className="pt-1 flex flex-wrap items-center gap-2 sm:gap-2.5">
              {/* BOTÓN PLAY INTERACTIVO DINÁMICO */}
              <button
                onClick={togglePlaySong}
                className="px-4 sm:px-5 py-2.5 bg-white hover:bg-zinc-200 text-black rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-xl transition-all active:scale-95 cursor-pointer"
              >
                {isPlayingSong ? (
                  <>
                    <Pause size={16} fill="currentColor" />
                    <span>Pausar</span>
                    <div className="flex items-end gap-0.5 h-3.5 ml-0.5">
                      <span className="w-0.5 bg-black rounded-full eq-bar-1"></span>
                      <span className="w-0.5 bg-black rounded-full eq-bar-2"></span>
                      <span className="w-0.5 bg-black rounded-full eq-bar-3"></span>
                    </div>
                  </>
                ) : (
                  <>
                    <Play size={16} fill="currentColor" />
                    <span>{songCurrentTime > 0 ? "Reanudar" : "Reproducir"}</span>
                  </>
                )}
              </button>

              {/* BOTÓN DEDICATORIA DE VOZ */}
              {voiceAudioUrl && (
                <button
                  onClick={togglePlayVoice}
                  className={`px-3.5 sm:px-4 py-2.5 rounded-xl font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5 transition-all active:scale-95 ${
                    isPlayingVoice 
                      ? 'bg-amber-400 text-black shadow-lg shadow-amber-950' 
                      : 'bg-black/60 hover:bg-black/80 text-amber-300 border border-amber-500/40 backdrop-blur-md'
                  }`}
                >
                  <Volume2 size={15} />
                  <span>{isPlayingVoice ? "Pausar Voz" : "🎙️ Nota de Voz"}</span>
                </button>
              )}

              {/* BOTONES SECUNDARIOS */}
              <button
                onClick={() => setIsInMyList(!isInMyList)}
                className="w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 border border-white/30 flex items-center justify-center text-white transition-all text-xs"
                title="Mi Lista"
              >
                {isInMyList ? <Check size={15} className="text-emerald-400" /> : "+"}
              </button>

              <button
                onClick={() => setLiked(!liked)}
                className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all text-xs ${
                  liked 
                    ? 'bg-red-600/30 border-red-500 text-red-500' 
                    : 'bg-black/60 hover:bg-black/80 border-white/30 text-white'
                }`}
                title="Me gusta"
              >
                <Heart size={15} fill={liked ? "currentColor" : "none"} />
              </button>

              {/* BADGE DEMO */}
              {isDemoMode && (
                <div className="px-2.5 py-1 bg-amber-500/20 border border-amber-500/40 rounded-full text-[9px] text-amber-300 font-bold flex items-center gap-1 ml-auto">
                  <span>⏳ Demo 1 min</span>
                </div>
              )}
            </div>

            {/* BARRA DE PROGRESO DE LA CANCIÓN */}
            {songAudioUrl && (
              <div className="pt-1 w-full space-y-1">
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
                <div className="flex justify-between text-[9px] font-mono text-white/70">
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

      {/* CONTENIDO PRINCIPAL: GALERÍA DE MEJORES MOMENTOS + DETALLES + CHECKOUT */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-10 mt-10">

        {/* SECCIÓN: NUESTROS MEJORES MOMENTOS (5 FOTOS AMPLIABLES) */}
        {galleryList.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h2 className="text-sm sm:text-base font-black uppercase tracking-wider text-white flex items-center gap-2">
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

            {/* VISTA 1: CARRUSEL EN MÓVIL (< md) */}
            <div className="md:hidden relative">
              <div 
                ref={carouselRef}
                onScroll={handleCarouselScroll}
                className="flex overflow-x-auto snap-x snap-mandatory gap-3.5 pb-3 pt-1 px-4 -mx-4 scrollbar-none scroll-smooth"
              >
                {galleryList.map((photoUrl: string, idx: number) => (
                  <div
                    key={idx}
                    onClick={() => setLightboxIndex(idx)}
                    className="snap-center shrink-0 w-[64vw] max-w-[220px] aspect-[3/4] bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 hover:border-red-600/80 cursor-pointer shadow-2xl relative group transition-all active:scale-95"
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
                className="w-14 h-14 rounded-full bg-amber-500 hover:bg-amber-400 text-black flex items-center justify-center font-bold shadow-lg shadow-amber-950/60 transition-transform active:scale-95 shrink-0 cursor-pointer"
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
          <div className="bg-[#121212] border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
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

        {/* ============================================================== */}
        {/* SECCIÓN DE ELECCIÓN DE PRODUCTO Y CONFIRMACIÓN POST-DEMO       */}
        {/* ============================================================== */}
        {isCreator && (
          <section id="checkout-section" className="bg-[#121212] border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-red-600/20 text-red-500 flex items-center justify-center mx-auto mb-2">
                <Sparkles size={24} />
              </div>
              <h2 className="text-2xl font-serif font-bold text-white">
                {isSongPaidOnly ? "Activa la Serie Loveflix para tu Pareja" : "Inmortaliza Esta Historia de Amor"}
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 max-w-lg mx-auto leading-relaxed">
                {isSongPaidOnly 
                  ? "Como ya desbloqueaste tu canción en MP3, obtén tu serie interactiva con QR activo y lámina de alta resolución con precio preferencial de Upgrade." 
                  : "Elige el paquete que mejor se adapte a tu regalo. Puedes elegir solo la canción en MP3, la experiencia Loveflix completa con página web y lámina, o la caja física artesanal de madera."}
              </p>
            </div>

            {/* SI LA CANCIÓN YA FUE PAGADA (UPGRADE FLOW) */}
            {isSongPaidOnly ? (
              <div className="space-y-4">
                <div className="p-3.5 bg-amber-950/40 border border-amber-500/30 rounded-2xl flex items-center gap-3 text-xs text-amber-200">
                  <span className="text-xl shrink-0">✨</span>
                  <span>
                    <strong>¡Canción desbloqueada!</strong> Tienes un descuento exclusivo de <strong>-$49 MXN</strong> para activar la experiencia Loveflix completa.
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  {/* OPCIÓN 1: UPGRADE DIGITAL ($199 MXN) */}
                  <div
                    onClick={() => setSelectedProduct('digital_poster')}
                    className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                      selectedProduct === 'digital_poster' 
                        ? 'bg-red-950/40 border-red-600 ring-2 ring-red-600/50 shadow-xl shadow-red-950/40' 
                        : 'bg-zinc-900/80 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2 py-0.5 bg-red-600 text-white rounded text-[9px] font-black uppercase tracking-wider">
                        ✨ UPGRADE PREFERENCIAL
                      </span>
                      {selectedProduct === 'digital_poster' ? (
                        <CheckCircle2 size={18} className="text-red-500" />
                      ) : (
                        <span className="text-xs text-zinc-500">Seleccionar</span>
                      )}
                    </div>
                    <div className="flex items-baseline justify-between">
                      <h4 className="text-base font-bold text-white">Serie Loveflix Digital</h4>
                      <span className="text-base font-black text-red-400">$199 MXN</span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                      Mini página web interactiva con código QR activo + galería de 5 fotos con dedicatoria de voz + lámina digital PDF 300 DPI lista para imprimir.
                    </p>
                  </div>

                  {/* OPCIÓN 2: CAJA MUSICAL MDF ($899 MXN) */}
                  <div
                    onClick={() => setSelectedProduct('physical_box')}
                    className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                      selectedProduct === 'physical_box' 
                        ? 'bg-red-950/40 border-red-600 ring-2 ring-red-600/50 shadow-xl shadow-red-950/40' 
                        : 'bg-zinc-900/80 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2 py-0.5 bg-amber-600 text-white rounded text-[9px] font-black uppercase tracking-wider">
                        👑 FÍSICO ARTESANAL
                      </span>
                      {selectedProduct === 'physical_box' ? (
                        <CheckCircle2 size={18} className="text-red-500" />
                      ) : (
                        <span className="text-xs text-zinc-500">Seleccionar</span>
                      )}
                    </div>
                    <div className="flex items-baseline justify-between">
                      <h4 className="text-base font-bold text-white">Caja Musical MDF</h4>
                      <span className="text-base font-black text-white">$899 MXN</span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                      Caja de madera MDF con chip recargable al abrirse + portada Loveflix a color + QR grabado + envío a domicilio en México incluido.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              /* SI NADA ESTÁ PAGADO: LOS 3 PAQUETES COMERCIALES */
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                {/* PAQUETE 1: SOLO CANCIÓN ($249 MXN) */}
                <div
                  onClick={() => setSelectedProduct('solo_cancion')}
                  className={`p-5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                    selectedProduct === 'solo_cancion' 
                      ? 'bg-zinc-800/90 border-zinc-400 ring-2 ring-zinc-400/50 shadow-xl' 
                      : 'bg-zinc-900/70 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-2xl">🎵</span>
                      {selectedProduct === 'solo_cancion' ? (
                        <CheckCircle2 size={18} className="text-zinc-300" />
                      ) : (
                        <span className="text-xs text-zinc-500">Elegir</span>
                      )}
                    </div>
                    <div className="flex items-baseline justify-between">
                      <h4 className="text-base font-bold text-white">Solo Canción</h4>
                      <span className="text-base font-black text-white">$249 MXN</span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                      Canción completa en MP3 de alta fidelidad para descargar y escuchar sin interrupciones. Reproductor digital privado incluido.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-zinc-800/80 text-[11px] text-zinc-400">
                    Solo archivo de audio MP3
                  </div>
                </div>

                {/* PAQUETE 2: EXPERIENCIA LOVEFLIX DIGITAL ($399 MXN) - DESTACADO */}
                <div
                  onClick={() => setSelectedProduct('digital_poster')}
                  className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between relative ${
                    selectedProduct === 'digital_poster' 
                      ? 'bg-red-950/50 border-red-500 ring-2 ring-red-500/50 shadow-2xl shadow-red-950/60 scale-[1.02]' 
                      : 'bg-gradient-to-b from-red-950/30 to-zinc-900 border-red-900/60 hover:border-red-600'
                  }`}
                >
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-red-600 text-white rounded-full text-[9px] font-black uppercase tracking-wider shadow-md">
                    ⭐ MÁS ELEGIDO (RECOMENDADO)
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-3 mt-1">
                      <span className="text-2xl">🎬</span>
                      {selectedProduct === 'digital_poster' ? (
                        <CheckCircle2 size={18} className="text-red-500" />
                      ) : (
                        <span className="text-xs text-zinc-400 font-bold">Elegir</span>
                      )}
                    </div>
                    <div className="flex items-baseline justify-between">
                      <h4 className="text-base font-bold text-white">Loveflix Digital</h4>
                      <span className="text-base font-black text-red-400">$399 MXN</span>
                    </div>
                    <p className="text-xs text-zinc-300 mt-2 leading-relaxed">
                      Canción MP3 completa + Mini página web interactiva con código QR activo + galería de 5 fotos con dedicatoria + lámina digital PDF 300 DPI lista para imprimir.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-red-900/40 text-[11px] text-red-300 font-medium">
                    Experiencia interactiva completa
                  </div>
                </div>

                {/* PAQUETE 3: CAJA MUSICAL DE MADERA MDF ($899 MXN) - FÍSICO */}
                <div
                  onClick={() => setSelectedProduct('physical_box')}
                  className={`p-5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                    selectedProduct === 'physical_box' 
                      ? 'bg-amber-950/40 border-amber-500 ring-2 ring-amber-500/50 shadow-xl shadow-amber-950/40' 
                      : 'bg-zinc-900/70 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-2xl">📦</span>
                      {selectedProduct === 'physical_box' ? (
                        <CheckCircle2 size={18} className="text-amber-500" />
                      ) : (
                        <span className="text-xs text-zinc-500">Elegir</span>
                      )}
                    </div>
                    <div className="flex items-baseline justify-between">
                      <h4 className="text-base font-bold text-white">Caja Musical MDF</h4>
                      <span className="text-base font-black text-amber-400">$899 MXN</span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                      Todo lo digital incluido + Caja artesanal de madera MDF con portada impresa + chip de música recargable al abrirse + QR grabado + envío a México incluido.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-zinc-800/80 text-[11px] text-amber-300 font-medium">
                    👑 El regalo físico definitivo
                  </div>
                </div>
              </div>
            )}

            {/* ACCIÓN SI ELIGE SOLO CANCIÓN */}
            {selectedProduct === 'solo_cancion' && (
              <div className="space-y-4 pt-4 border-t border-zinc-800 animate-in fade-in duration-300">
                <div className="bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800 text-xs text-zinc-300 space-y-2">
                  <p className="font-bold text-white flex items-center gap-2">
                    <Music size={16} className="text-zinc-300" />
                    ¿Qué recibirás con Solo Canción?
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-zinc-400 text-[11px]">
                    <li>Archivo de audio MP3 completo en máxima fidelidad sin cortes.</li>
                    <li>Reproductor digital privado para escuchar desde cualquier teléfono o computadora.</li>
                    <li>Descarga permanente para guardar en tu biblioteca.</li>
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={handleOrderSoloCancion}
                  className="w-full py-4.5 bg-white hover:bg-zinc-200 text-black font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-xl flex items-center justify-center gap-2.5 transition-all active:scale-95 cursor-pointer"
                >
                  <Download size={18} />
                  <span>Desbloquear Solo Canción MP3 ($249 MXN)</span>
                </button>
              </div>
            )}

            {/* ACCIÓN SI ELIGE LÁMINA / EXPERIENCIA DIGITAL */}
            {selectedProduct === 'digital_poster' && (
              <div className="space-y-4 pt-4 border-t border-zinc-800 animate-in fade-in duration-300">
                <div className="bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800 text-xs text-zinc-300 space-y-2">
                  <p className="font-bold text-white flex items-center gap-2">
                    <Sparkles size={16} className="text-red-400" />
                    {isSongPaidOnly ? "¿Qué incluye tu Upgrade Loveflix Digital?" : "¿Qué recibirás con tu Experiencia Loveflix Digital?"}
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-zinc-400 text-[11px]">
                    {!isSongPaidOnly && <li>Canción completa en MP3 de máxima calidad sin límites de reproducción.</li>}
                    <li>Mini página web interactiva Loveflix con código QR activo.</li>
                    <li>Galería interactiva de 5 fotos con dedicatoria de voz personalizada.</li>
                    <li>Lámina digital en PDF de alta resolución (300 DPI) lista para imprimir.</li>
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={handleOrderDigitalLoveflix}
                  disabled={isUpdatingOrder}
                  className="w-full py-4.5 bg-gradient-to-r from-red-600 via-rose-600 to-red-600 hover:from-red-500 hover:to-red-700 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-red-950 flex items-center justify-center gap-2.5 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {isUpdatingOrder ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Sparkles size={18} />
                  )}
                  <span>
                    {isUpdatingOrder 
                      ? "Procesando..." 
                      : isSongPaidOnly 
                        ? "Activar Upgrade Loveflix Digital ($199 MXN)" 
                        : "Obtener Experiencia Loveflix Digital ($399 MXN)"}
                  </span>
                </button>
              </div>
            )}

            {/* FORMULARIO DE ENVÍO SI ELIGE CAJA MUSICAL FÍSICA */}
            {selectedProduct === 'physical_box' && (
              <div className="space-y-4 pt-4 border-t border-zinc-800 animate-in fade-in duration-300">
                <div className="flex items-center gap-2 text-xs font-bold text-red-500 uppercase tracking-wider">
                  <MapPin size={16} /> Datos para Envío a Domicilio en México
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 uppercase mb-1">
                    Calle, Número y Depto *
                  </label>
                  <input
                    type="text"
                    value={shippingAddress.street}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, street: e.target.value })}
                    placeholder="Ej: Av. Juárez 450, Interior 201"
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm focus:border-red-600 outline-none transition-colors"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-400 uppercase mb-1">
                      Colonia / Fraccionamiento *
                    </label>
                    <input
                      type="text"
                      value={shippingAddress.colony}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, colony: e.target.value })}
                      placeholder="Ej: Centro"
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm focus:border-red-600 outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-400 uppercase mb-1">
                      Código Postal *
                    </label>
                    <input
                      type="text"
                      value={shippingAddress.zipCode}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, zipCode: e.target.value })}
                      placeholder="Ej: 06000"
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm focus:border-red-600 outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-400 uppercase mb-1">
                      Ciudad / Municipio *
                    </label>
                    <input
                      type="text"
                      value={shippingAddress.city}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                      placeholder="Ej: Monterrey"
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm focus:border-red-600 outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-400 uppercase mb-1">
                      Estado *
                    </label>
                    <input
                      type="text"
                      value={shippingAddress.state}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })}
                      placeholder="Ej: Nuevo León"
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm focus:border-red-600 outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 uppercase mb-1">
                    Teléfono / WhatsApp de Contacto para Paquetería *
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Ej: 55 1234 5678"
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm focus:border-red-600 outline-none transition-colors"
                  />
                </div>

                {/* BOTÓN CONFIRMAR CAJA MUSICAL */}
                <button
                  type="button"
                  onClick={handleOrderPhysicalBox}
                  disabled={isUpdatingOrder}
                  className="w-full py-4.5 bg-gradient-to-r from-red-600 via-rose-600 to-red-600 hover:from-red-500 hover:to-red-700 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-red-950 flex items-center justify-center gap-2.5 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {isUpdatingOrder ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Gift size={18} />
                  )}
                  <span>
                    {isUpdatingOrder ? "Guardando..." : "Confirmar Pedido de Caja Musical ($899 MXN)"}
                  </span>
                </button>
              </div>
            )}

          </section>
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
              {isSongPaidOnly ? (
                <>
                  {/* UPGRADE LOVEFLIX */}
                  <div 
                    onClick={() => {
                      setShowUnlockModal(false);
                      setSelectedProduct('digital_poster');
                      document.getElementById('checkout-section')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="p-4 bg-gradient-to-r from-red-950/60 to-zinc-900 rounded-2xl border-2 border-red-500 hover:border-red-400 cursor-pointer transition-all hover:scale-[1.01] shadow-lg space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase text-red-400 tracking-wider flex items-center gap-1.5">
                        ✨ Upgrade Serie Loveflix (Descuento -$49)
                      </span>
                      <span className="text-sm font-black text-white">$199 MXN</span>
                    </div>
                    <p className="text-[11px] text-zinc-300 leading-snug">
                      Mini web interactiva con código QR activo + galería de 5 fotos con voz + lámina digital PDF 300 DPI lista para imprimir.
                    </p>
                  </div>

                  {/* CAJA MDF */}
                  <div 
                    onClick={() => {
                      setShowUnlockModal(false);
                      setSelectedProduct('physical_box');
                      document.getElementById('checkout-section')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="p-3.5 bg-zinc-800/60 rounded-2xl border border-zinc-700 hover:border-zinc-500 cursor-pointer transition-all hover:scale-[1.01] space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase text-amber-400 tracking-wider flex items-center gap-1.5">
                        📦 Caja Musical MDF Física
                      </span>
                      <span className="text-sm font-black text-white">$899 MXN</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-snug">
                      Caja de madera con chip de música recargable + impresión en la tapa + QR grabado + envío a domicilio en México.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  {/* LOVEFLIX DIGITAL 399 (RECOMENDADO) */}
                  <div 
                    onClick={() => {
                      setShowUnlockModal(false);
                      setSelectedProduct('digital_poster');
                      document.getElementById('checkout-section')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="p-4 bg-gradient-to-r from-red-950/60 to-zinc-900 rounded-2xl border-2 border-red-500 hover:border-red-400 cursor-pointer transition-all hover:scale-[1.01] shadow-lg space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase text-red-400 tracking-wider flex items-center gap-1.5">
                        ⭐ Loveflix Digital (Recomendado)
                      </span>
                      <span className="text-sm font-black text-white">$399 MXN</span>
                    </div>
                    <p className="text-[11px] text-zinc-300 leading-snug">
                      Canción MP3 completa + Mini página web interactiva con QR activo + Galería de 5 fotos con voz + Lámina PDF 300 DPI.
                    </p>
                  </div>

                  {/* SOLO CANCIÓN 249 (DOWNSELL) */}
                  <div 
                    onClick={() => {
                      setShowUnlockModal(false);
                      setSelectedProduct('solo_cancion');
                      document.getElementById('checkout-section')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="p-3.5 bg-zinc-800/60 rounded-2xl border border-zinc-700 hover:border-zinc-500 cursor-pointer transition-all hover:scale-[1.01] space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase text-zinc-300 tracking-wider flex items-center gap-1.5">
                        🎵 Solo Canción MP3
                      </span>
                      <span className="text-sm font-black text-white">$249 MXN</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-snug">
                      Canción completa en MP3 de alta fidelidad sin extras digitales ni lámina.
                    </p>
                  </div>

                  {/* CAJA MDF 899 (VIP FÍSICO) */}
                  <div 
                    onClick={() => {
                      setShowUnlockModal(false);
                      setSelectedProduct('physical_box');
                      document.getElementById('checkout-section')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="p-3.5 bg-zinc-800/60 rounded-2xl border border-zinc-700 hover:border-zinc-500 cursor-pointer transition-all hover:scale-[1.01] space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase text-amber-400 tracking-wider flex items-center gap-1.5">
                        👑 Caja Musical MDF Física
                      </span>
                      <span className="text-sm font-black text-white">$899 MXN</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-snug">
                      Todo lo digital + Caja de madera MDF física con chip musical y envío express en México.
                    </p>
                  </div>
                </>
              )}
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
