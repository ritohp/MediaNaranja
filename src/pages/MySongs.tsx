import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Music, Calendar, Clock, Play, Download, ExternalLink, Heart, ChevronRight, Music2, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Song {
  id: string;
  title: string;
  lyrics: string;
  audio_url: string | null;
  demo_url: string | null;
  status: string;
  created_at: string;
  form_data: any;
  style_prompt: string;
  is_paid: boolean;
}

export default function MySongs() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [showDemoModal, setShowDemoModal] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchSongs(session.user.id);
      } else {
        setLoading(false);
      }
    });
  }, []);

  const fetchSongs = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('mn_songs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSongs(data || []);

      // Recuperación automática para canciones "atrapadas" en grabación
      const { checkMusicStatus } = await import('../services/music');
      
      data?.forEach(async (song) => {
        if (song.status === 'generating_music' && song.task_id) {
          const response = await checkMusicStatus(song.task_id);
          const sunoData = response?.data?.response?.sunoData || response?.response?.sunoData;
          
          if (sunoData && sunoData.length > 0 && sunoData[0].audioUrl) {
            const song1 = sunoData[0];
            const song2 = sunoData.length > 1 ? sunoData[1] : null;
            const audioUrl = song1.audioUrl;
            
            // --- Aplicar tratamiento de audio si no existe demo ---
            try {
              const { data: treatmentData } = await supabase.functions.invoke('process-audio', {
                body: { originalUrl: audioUrl, songId: song.id, taskId: song.task_id }
              });
              const demoUrl = treatmentData?.demoUrl || audioUrl;

              let finalUrl2 = null;
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

              const updatedFormData = {
                ...(song.form_data || {}),
                version2: (song2 && song2.audioUrl) ? { audio_url: song2.audioUrl, demo_url: finalUrl2 } : null
              };

              setSongs(current => current.map(s => s.id === song.id ? { ...s, audio_url: audioUrl, demo_url: demoUrl, form_data: updatedFormData, status: 'completed' } : s));
              await supabase.from('mn_songs').update({ audio_url: audioUrl, demo_url: demoUrl, form_data: updatedFormData, status: 'completed' }).eq('id', song.id);
            } catch (err) {
              setSongs(current => current.map(s => s.id === song.id ? { ...s, audio_url: audioUrl, status: 'completed' } : s));
              await supabase.from('mn_songs').update({ audio_url: audioUrl, status: 'completed' }).eq('id', song.id);
            }
          }
        }
      });

    } catch (error) {
      console.error('Error fetching songs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">Completada</span>;
      case 'generating_music':
        return <span className="bg-naranja-100 text-naranja-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider animate-pulse">Grabando...</span>;
      default:
        return <span className="bg-blush-100 text-blush-500 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">Borrador</span>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-naranja-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6">
        <div className="w-20 h-20 bg-blush-50 text-blush-400 rounded-full flex items-center justify-center mb-6">
          <Music2 size={40} />
        </div>
        <h2 className="text-3xl font-serif text-blush-800 mb-4">Inicia sesión</h2>
        <p className="text-ink-600/70 max-w-sm mx-auto mb-8 font-light">Debes entrar a tu cuenta para ver tu historial de canciones mágicas.</p>
        <Link to="/" className="px-8 py-4 bg-naranja-500 text-white rounded-xl font-bold tracking-widest hover:bg-naranja-600 transition shadow-lg">IR AL INICIO</Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-serif text-blush-800 mb-4 tracking-tight">Mis <span className="text-naranja-500 italic">Creaciones</span></h1>
          <p className="text-ink-600/70 text-lg font-light max-w-2xl">Aquí guardamos cada historia que has convertido en música. <Heart size={18} className="inline text-naranja-500" /></p>
        </div>
        <Link 
          to="/crear-cancion" 
          className="bg-white border-2 border-naranja-500 text-naranja-600 px-6 py-3 rounded-xl font-bold text-sm tracking-widest hover:bg-naranja-500 hover:text-white transition-all shadow-sm flex items-center gap-2"
        >
          NUEVA CANCIÓN <ChevronRight size={16} />
        </Link>
      </div>

      {/* Modal Premium de Final de Demo */}
      {showDemoModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in zoom-in duration-300">
          <div className="absolute inset-0 bg-ink-950/40 backdrop-blur-md" onClick={() => setShowDemoModal(null)}></div>
          <div className="bg-white rounded-[3rem] p-10 md:p-14 max-w-lg w-full shadow-2xl relative z-10 border border-naranja-100 text-center space-y-6">
            <div className="bg-naranja-50 text-naranja-500 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-2">
              <Music2 size={40} />
            </div>
            <h3 className="text-3xl font-serif text-blush-800">¡Sigue el ritmo! ✨</h3>
            <p className="text-ink-600 leading-relaxed">
              Has escuchado el adelanto de 1 minuto. La versión completa de esta canción está disponible para descarga permanente tras realizar el pago.
            </p>
            <button 
              onClick={() => {
                if (showDemoModal) {
                  window.location.href = `https://buy.stripe.com/dRm5kwcXzf2T7kgdI72Ry00?client_reference_id=${showDemoModal}`;
                }
              }}
              className="w-full py-5 bg-gradient-to-r from-naranja-500 to-naranja-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-naranja-200 hover:scale-105 transition-all"
            >
              DESBLOQUEAR CANCIÓN
            </button>
            <button 
              onClick={() => setShowDemoModal(null)}
              className="text-ink-400 text-xs font-bold uppercase tracking-widest hover:text-naranja-500 transition-all"
            >
              CERRAR
            </button>
          </div>
        </div>
      )}

      {songs.length === 0 ? (
        <div className="bg-white rounded-[2.5rem] p-16 text-center shadow-xl border border-blush-50">
          <div className="w-24 h-24 bg-naranja-50 text-naranja-400 rounded-full flex items-center justify-center mx-auto mb-8">
            <Music size={48} />
          </div>
          <h3 className="text-2xl font-serif text-blush-800 mb-4">Aún no tienes canciones</h3>
          <p className="text-ink-600/70 max-w-md mx-auto mb-10 font-light">El taller está listo y esperando por tu próxima gran historia de amor.</p>
          <Link 
            to="/crear-cancion" 
            className="inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-naranja-500 to-naranja-600 text-white rounded-2xl font-bold text-lg tracking-widest hover:brightness-110 transition-all shadow-xl"
          >
            EMPEZAR AHORA
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {songs.map((song) => (
            <div key={song.id} className="group relative bg-white rounded-[2rem] overflow-hidden shadow-lg transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 border border-blush-50 flex flex-col">
              <div className="absolute top-4 right-4 z-10">
                {getStatusBadge(song.status)}
              </div>
              
              <div className="p-8 flex-1">
                <div className="flex items-center gap-3 text-blush-400 mb-4">
                  <Calendar size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em]">{new Date(song.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'long' })}</span>
                </div>
                
                <h3 className="text-2xl font-serif text-blush-800 mb-3 line-clamp-2 leading-tight group-hover:text-naranja-500 transition-colors">
                  {song.title || `Canción para ${song.form_data?.nombreDestinatario || 'Alguien Especial'}`}
                </h3>
                
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-6 h-6 rounded-full bg-blush-50 flex items-center justify-center text-blush-400">
                    <Music size={12} />
                  </div>
                  <span className="text-xs text-ink-500/80 font-medium capitalize">{song.style_prompt || 'Estilo Personalizado'}</span>
                </div>

                <div className="space-y-4">
                  {song.audio_url || song.demo_url ? (
                    <div className="space-y-4">
                      <div className="bg-naranja-50/30 rounded-2xl p-4 border border-naranja-100 relative">
                        <div className="absolute -left-2 -top-2 bg-gradient-to-r from-naranja-500 to-naranja-600 text-white text-[9px] font-bold px-2 py-1 rounded-md uppercase tracking-widest shadow-sm">Opción 1</div>
                        <audio 
                          key={song.audio_url || song.id}
                          src={song.audio_url || song.demo_url || ''}
                          controls 
                          controlsList="nodownload"
                          referrerPolicy="no-referrer"
                          onContextMenu={(e) => e.preventDefault()}
                          onTimeUpdate={(e) => {
                            if (!song.is_paid && e.currentTarget.currentTime >= 60) {
                              e.currentTarget.pause();
                              e.currentTarget.currentTime = 0;
                              setShowDemoModal(song.id);
                            }
                          }}
                          className="w-full h-10 accent-naranja-500 mt-2"
                        >
                          Tu navegador no soporta el reproductor de audio.
                        </audio>
                        <div className="mt-3 flex items-center justify-between">
                          {!song.is_paid ? (
                            <span className="text-[10px] font-bold text-naranja-600 uppercase tracking-widest bg-white px-3 py-1 rounded-full border border-naranja-100 italic">
                              Muestra de 60s
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest bg-green-50 px-3 py-1 rounded-full border border-green-100">
                              ✓ Pista Completa
                            </span>
                          )}
                          
                          {song.is_paid && (
                            <a href={song.audio_url || ''} target="_blank" rel="noreferrer" download className="text-[10px] flex items-center gap-1 font-bold text-naranja-600 uppercase tracking-widest bg-white px-3 py-1 rounded-full border border-naranja-100 hover:bg-naranja-50 transition">
                              <Download size={12} /> Descargar
                            </a>
                          )}
                        </div>
                      </div>

                      {song.form_data?.version2 && (
                        <div className="bg-blush-50/50 rounded-2xl p-4 border border-blush-100 relative">
                          <div className="absolute -left-2 -top-2 bg-gradient-to-r from-blush-400 to-blush-500 text-white text-[9px] font-bold px-2 py-1 rounded-md uppercase tracking-widest shadow-sm">Opción 2</div>
                          <audio 
                            key={`v2-${song.id}`}
                            src={song.form_data.version2.audio_url || song.form_data.version2.demo_url || ''}
                            controls 
                            controlsList="nodownload"
                            referrerPolicy="no-referrer"
                            onContextMenu={(e) => e.preventDefault()}
                            onTimeUpdate={(e) => {
                              if (!song.is_paid && e.currentTarget.currentTime >= 60) {
                                e.currentTarget.pause();
                                e.currentTarget.currentTime = 0;
                                setShowDemoModal(song.id);
                              }
                            }}
                            className="w-full h-10 accent-blush-500 mt-2"
                          >
                            Tu navegador no soporta el reproductor de audio.
                          </audio>
                          <div className="mt-3 flex items-center justify-between">
                            {!song.is_paid ? (
                              <span className="text-[10px] font-bold text-blush-500 uppercase tracking-widest bg-white px-3 py-1 rounded-full border border-blush-100 italic">
                                Muestra Alternativa (60s)
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest bg-green-50 px-3 py-1 rounded-full border border-green-100">
                                ✓ Pista Alternativa
                              </span>
                            )}

                            {song.is_paid && (
                              <a href={song.form_data.version2.audio_url || ''} target="_blank" rel="noreferrer" download className="text-[10px] flex items-center gap-1 font-bold text-blush-500 uppercase tracking-widest bg-white px-3 py-1 rounded-full border border-blush-100 hover:bg-blush-50 transition">
                                <Download size={12} /> Descargar
                              </a>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-blush-50/30 rounded-2xl p-8 border border-dashed border-blush-200 text-center">
                      <Clock size={24} className="mx-auto text-blush-300 mb-2 animate-pulse" />
                      <p className="text-[10px] text-blush-400 uppercase font-bold tracking-widest">En proceso de grabación...</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="px-8 pb-8 pt-2 flex flex-col gap-3">
                {!song.is_paid && (song.audio_url || song.demo_url) && (
                  <button 
                    onClick={() => window.location.href = `https://buy.stripe.com/dRm5kwcXzf2T7kgdI72Ry00?client_reference_id=${song.id}`}
                    className="w-full py-3 md:py-4 bg-gradient-to-r from-naranja-500 to-naranja-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-lg flex items-center justify-center gap-2"
                  >
                    <Lock size={14} /> DESBLOQUEAR CANCIÓN
                  </button>
                )}
                
                <button 
                  onClick={() => {
                    alert(`Letra de la canción:\n\n${song.lyrics}`);
                  }}
                  className="w-full py-3 bg-blush-50 text-blush-600 rounded-xl font-bold text-xs hover:bg-naranja-50 hover:text-naranja-600 transition-all uppercase tracking-widest flex items-center justify-center gap-2"
                >
                  <ExternalLink size={14} /> Ver Letra
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
