import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Play, Pause, Heart, Sparkles, Volume2, Music, Disc3, Share2, MessageCircle, Copy, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function PublicGiftPlayer() {
  const { id } = useParams();
  const [memory, setMemory] = useState<any>(null);
  const [song, setSong] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Audio state - Song
  const [isPlayingSong, setIsPlayingSong] = useState(false);
  const [songProgress, setSongProgress] = useState(0);
  const [songCurrentTime, setSongCurrentTime] = useState(0);
  const [songDuration, setSongDuration] = useState(0);
  const songAudioRef = useRef<HTMLAudioElement | null>(null);

  // Audio state - Voice Note
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [voiceProgress, setVoiceProgress] = useState(0);
  const [voiceCurrentTime, setVoiceCurrentTime] = useState(0);
  const [voiceDuration, setVoiceDuration] = useState(0);
  const voiceAudioRef = useRef<HTMLAudioElement | null>(null);

  const [copied, setCopied] = useState(false);

  useEffect(() => {
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

  // Song Audio controls
  const togglePlaySong = () => {
    if (!songAudioRef.current) return;
    if (isPlayingSong) {
      songAudioRef.current.pause();
      setIsPlayingSong(false);
    } else {
      // Pause voice note if playing
      if (voiceAudioRef.current && isPlayingVoice) {
        voiceAudioRef.current.pause();
        setIsPlayingVoice(false);
      }
      songAudioRef.current.play().catch(e => console.error(e));
      setIsPlayingSong(true);
    }
  };

  // Voice Note Audio controls
  const togglePlayVoice = () => {
    if (!voiceAudioRef.current) return;
    if (isPlayingVoice) {
      voiceAudioRef.current.pause();
      setIsPlayingVoice(false);
    } else {
      // Pause song if playing
      if (songAudioRef.current && isPlayingSong) {
        songAudioRef.current.pause();
        setIsPlayingSong(false);
      }
      voiceAudioRef.current.play().catch(e => console.error(e));
      setIsPlayingVoice(true);
    }
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

  const songAudioUrl = song?.audio_url || song?.demo_url || '';
  const voiceAudioUrl = memory?.voice_note_url || '';

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
        <h2 className="text-2xl font-serif font-bold text-white mb-2">Abriendo tu regalo...</h2>
        <p className="text-zinc-400 max-w-sm text-sm">
          Preparando tu experiencia cinematográfica en Loveflix.
        </p>
      </div>
    );
  }

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

  return (
    <div className="min-h-screen bg-[#080808] text-white font-sans selection:bg-red-900 pb-24">
      {/* Google fonts for Loveflix title */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Dancing+Script:wght@700&display=swap');
        .font-script { font-family: 'Dancing Script', cursive; }
        .font-bebas { font-family: 'Bebas Neue', cursive; letter-spacing: 2.5px; }
      `}</style>

      {/* HEADER CINEMATOGRÁFICO */}
      <header className="fixed top-0 inset-x-0 h-16 bg-black/80 backdrop-blur-md z-50 flex items-center justify-between px-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <span className="text-[#E50914] text-3xl font-normal leading-none font-bebas">LOVEFLIX</span>
          <span className="text-[10px] uppercase font-bold text-zinc-400 border-l border-zinc-700 pl-3 hidden sm:inline-block">
            Tu Regalo Inédito
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={copyShareLink}
            className="px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all"
          >
            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            <span>{copied ? "¡Copiado!" : "Compartir"}</span>
          </button>
        </div>
      </header>

      {/* HERO SECTION CON FOTO PRINCIPAL */}
      <div className="relative pt-16 w-full max-w-4xl mx-auto overflow-hidden">
        <div className="relative aspect-[16/10] sm:aspect-[21/9] md:aspect-[16/8] w-full overflow-hidden">
          {memory.main_photo_url ? (
            <img 
              src={memory.main_photo_url} 
              alt={memory.names} 
              className="w-full h-full object-cover object-center"
            />
          ) : (
            <div className="w-full h-full bg-zinc-900"></div>
          )}
          {/* Degradados estilo Netflix */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-[#080808]/40 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-[#080808]/80 via-transparent to-[#080808]/60"></div>
          
          <div className="absolute bottom-6 left-6 right-6 z-20 space-y-2">
            <div className="flex items-center gap-2 text-red-500 font-bold text-[11px] tracking-widest uppercase">
              <span className="bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-sm">N</span>
              <span>PAREJAS • EDICIÓN ESPECIAL</span>
            </div>
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-script text-white drop-shadow-2xl leading-none">
              {memory.names || "Nuestra Historia"}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-xs font-bold pt-1">
              <span className="text-emerald-400">Juntos Desde {memory.date_text || "Siempre"}</span>
              <span className="px-1.5 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded text-[10px]">L</span>
              <span className="text-zinc-300">1° Gran Amor</span>
              <span className="px-1.5 py-0.5 border border-zinc-600 rounded text-[10px] text-zinc-400">HD 4K</span>
              <span className="bg-red-600 text-white px-2 py-0.5 rounded text-[10px] font-black">TOP 10</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 space-y-8 mt-6">
        {/* SINOPSIS */}
        {memory.synopsis && (
          <div className="bg-[#121212] border border-zinc-800/80 rounded-2xl p-6 shadow-xl">
            <p className="text-base sm:text-lg text-zinc-200 leading-relaxed italic font-serif">
              "{memory.synopsis}"
            </p>
            {(memory.author_name || memory.recipient_name) && (
              <div className="mt-4 pt-3 border-t border-zinc-800 text-xs text-zinc-400 flex flex-wrap gap-4 font-medium">
                {memory.author_name && <span><strong className="text-zinc-300">Escrito por:</strong> {memory.author_name}</span>}
                {memory.recipient_name && <span><strong className="text-zinc-300">Destinado a:</strong> {memory.recipient_name}</span>}
              </div>
            )}
          </div>
        )}

        {/* REPRODUCTORES DESTACADOS: CANCIÓN + NOTA DE VOZ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* TARJETA DE LA CANCIÓN */}
          {songAudioUrl && (
            <div className="bg-gradient-to-br from-[#1c1c1c] to-[#121212] border border-zinc-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 rounded-full blur-2xl pointer-events-none"></div>
              
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-600/20 text-red-500 rounded-full flex items-center justify-center">
                  <Music size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    {song?.title || "Nuestra Canción Inédita"}
                  </h3>
                  <p className="text-[11px] text-zinc-400">Composición Personalizada</p>
                </div>
              </div>

              {/* Botón Principal y Barra */}
              <div className="flex items-center gap-4 pt-2">
                <button
                  onClick={togglePlaySong}
                  className="w-14 h-14 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center shadow-lg shadow-red-950/60 transition-transform active:scale-95 shrink-0"
                >
                  {isPlayingSong ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
                </button>
                <div className="flex-1 space-y-1.5">
                  <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden cursor-pointer" onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const clickX = e.clientX - rect.left;
                    const newProgress = clickX / rect.width;
                    if (songAudioRef.current) {
                      songAudioRef.current.currentTime = newProgress * (songAudioRef.current.duration || 1);
                    }
                  }}>
                    <div 
                      className="bg-red-600 h-full rounded-full transition-all"
                      style={{ width: `${songProgress}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-[10px] font-mono text-zinc-400">
                    <span>{formatTime(songCurrentTime)}</span>
                    <span>{formatTime(songDuration)}</span>
                  </div>
                </div>
              </div>

              <audio
                ref={songAudioRef}
                src={songAudioUrl}
                onTimeUpdate={() => {
                  if (songAudioRef.current) {
                    setSongCurrentTime(songAudioRef.current.currentTime);
                    setSongProgress((songAudioRef.current.currentTime / (songAudioRef.current.duration || 1)) * 100);
                  }
                }}
                onLoadedMetadata={() => {
                  if (songAudioRef.current) setSongDuration(songAudioRef.current.duration || 0);
                }}
                onEnded={() => setIsPlayingSong(false)}
              />
            </div>
          )}

          {/* TARJETA DE LA NOTA DE VOZ */}
          {voiceAudioUrl ? (
            <div className="bg-gradient-to-br from-[#1c1c1c] to-[#121212] border border-zinc-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-600/10 rounded-full blur-2xl pointer-events-none"></div>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-amber-500/20 text-amber-400 rounded-full flex items-center justify-center">
                  <Volume2 size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Mensaje de Voz Dedicado
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    {memory.author_name ? `De ${memory.author_name}` : "Palabras desde el corazón"}
                  </p>
                </div>
              </div>

              {/* Botón y Barra */}
              <div className="flex items-center gap-4 pt-2">
                <button
                  onClick={togglePlayVoice}
                  className="w-14 h-14 bg-amber-500 hover:bg-amber-600 text-black rounded-full flex items-center justify-center shadow-lg shadow-amber-950/60 transition-transform active:scale-95 shrink-0 font-bold"
                >
                  {isPlayingVoice ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
                </button>
                <div className="flex-1 space-y-1.5">
                  <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden cursor-pointer" onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const clickX = e.clientX - rect.left;
                    const newProgress = clickX / rect.width;
                    if (voiceAudioRef.current) {
                      voiceAudioRef.current.currentTime = newProgress * (voiceAudioRef.current.duration || 1);
                    }
                  }}>
                    <div 
                      className="bg-amber-500 h-full rounded-full transition-all"
                      style={{ width: `${voiceProgress}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-[10px] font-mono text-zinc-400">
                    <span>{formatTime(voiceCurrentTime)}</span>
                    <span>{formatTime(voiceDuration)}</span>
                  </div>
                </div>
              </div>

              <audio
                ref={voiceAudioRef}
                src={voiceAudioUrl}
                onTimeUpdate={() => {
                  if (voiceAudioRef.current) {
                    setVoiceCurrentTime(voiceAudioRef.current.currentTime);
                    setVoiceProgress((voiceAudioRef.current.currentTime / (voiceAudioRef.current.duration || 1)) * 100);
                  }
                }}
                onLoadedMetadata={() => {
                  if (voiceAudioRef.current) setVoiceDuration(voiceAudioRef.current.duration || 0);
                }}
                onEnded={() => setIsPlayingVoice(false)}
              />
            </div>
          ) : (
            <div className="bg-[#121212] border border-dashed border-zinc-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
              <Disc3 size={32} className="text-zinc-600 mb-2 animate-spin-slow" />
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Caja Musical Media Naranja</p>
              <p className="text-[11px] text-zinc-500 mt-1">Una obra irrepetible hecha con amor.</p>
            </div>
          )}
        </div>

        {/* GALERÍA: NUESTROS MEJORES MOMENTOS */}
        {memory.gallery_photos_urls && memory.gallery_photos_urls.filter(Boolean).length > 0 && (
          <div className="space-y-4 pt-4">
            <h3 className="text-xs font-black uppercase tracking-[0.25em] text-zinc-400 flex items-center gap-2">
              <Sparkles size={14} className="text-red-500" /> Nuestros Mejores Momentos
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {memory.gallery_photos_urls.filter(Boolean).map((photoUrl: string, idx: number) => (
                <div key={idx} className="aspect-[3/4] bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 shadow-lg group">
                  <img 
                    src={photoUrl} 
                    alt={`Momento ${idx + 1}`} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* LETRA DE LA CANCIÓN */}
        {song?.lyrics && (
          <div className="bg-[#121212] border border-zinc-800 rounded-2xl p-6 sm:p-8 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Music size={16} className="text-red-500" /> Letra de la Canción
              </h3>
            </div>
            <div className="text-zinc-300 font-serif leading-relaxed whitespace-pre-line text-sm sm:text-base pt-2">
              {song.lyrics}
            </div>
          </div>
        )}

        {/* FOOTER ROMÁNTICO */}
        <div className="text-center pt-10 text-xs text-zinc-600 space-y-2">
          <p className="flex items-center justify-center gap-1.5">
            Creado con amor en <strong className="text-zinc-400">Media Naranja</strong> <Heart size={12} className="text-red-500" fill="currentColor" />
          </p>
          <p className="text-[10px]">
            Inmortalizando historias de amor a través de la música y el arte.
          </p>
        </div>
      </div>
    </div>
  );
}
