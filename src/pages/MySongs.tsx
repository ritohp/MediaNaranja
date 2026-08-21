import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Music, Calendar, Clock, Play, Download, ExternalLink, Heart, ChevronRight, Music2, Lock, RefreshCw, Scroll } from 'lucide-react';
import { Link } from 'react-router-dom';
import TributeAddon from '../components/tribute/TributeAddon';

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
  const [selectedVersions, setSelectedVersions] = useState<{[key: string]: number}>({});
  const [unlockingSongId, setUnlockingSongId] = useState<string | null>(null);
  const [unlockingStatus, setUnlockingStatus] = useState<'checking' | 'success' | 'failed'>('checking');

  const handleVersionSelect = async (songId: string, version: number, currentFormData: any) => {
    setSelectedVersions(prev => ({ ...prev, [songId]: version }));
    try {
      await supabase
        .from('mn_songs')
        .update({ 
          form_data: { 
            ...currentFormData, 
            selected_version: version 
          } 
        })
        .eq('id', songId);
      
      // Update local state to reflect new form_data
      setSongs(current => current.map(s => 
        s.id === songId 
          ? { ...s, form_data: { ...s.form_data, selected_version: version } } 
          : s
      ));
    } catch (err) {
      console.error("Error saving selected version", err);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchSongs(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const params = new URLSearchParams(window.location.search);
    const refId = params.get('client_reference_id');
    const sessionId = params.get('session_id');

    if (sessionId || refId) {
      setUnlockingSongId(refId || 'detecting');
      let attempts = 0;
      const interval = setInterval(async () => {
        attempts++;
        if (sessionId) {
          // Poll mn_payments to find the associated song_id
          const { data, error } = await supabase
            .from('mn_payments')
            .select('song_id')
            .eq('external_id', sessionId)
            .maybeSingle();

          if (data && data.song_id) {
            clearInterval(interval);
            setUnlockingSongId(data.song_id);
            setUnlockingStatus('success');
            
            // Trigger pixels purchase conversion
            if (window.fbq) {
              window.fbq('track', 'Purchase', { value: 249.00, currency: 'MXN' });
            }
            if (window.ttq) {
              window.ttq.track('CompletePayment', { value: 249.00, currency: 'MXN' });
            }

            setTimeout(() => {
              window.location.href = `/cancion/${data.song_id}`;
            }, 1500);
            return;
          }
        } else if (refId) {
          // Poll mn_songs directly for is_paid status
          const { data, error } = await supabase
            .from('mn_songs')
            .select('is_paid')
            .eq('id', refId)
            .single();
          
          if (data && data.is_paid) {
            clearInterval(interval);
            setUnlockingStatus('success');

            // Trigger pixels purchase conversion
            if (window.fbq) {
              window.fbq('track', 'Purchase', { value: 249.00, currency: 'MXN' });
            }
            if (window.ttq) {
              window.ttq.track('CompletePayment', { value: 249.00, currency: 'MXN' });
            }

            setTimeout(() => {
              window.location.href = `/cancion/${refId}`;
            }, 1500);
            return;
          }
        }

        if (attempts >= 15) {
          clearInterval(interval);
          setUnlockingStatus('failed');
        }
      }, 2000);
      
      return () => clearInterval(interval);
    }
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
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
        <div className="relative mb-6">
          <img 
            src="/mascota_loading.png" 
            alt="Naranjín" 
            className="w-40 h-40 object-contain animate-pulse mx-auto" 
          />
          <div className="absolute inset-0 border-4 border-dashed border-naranja-500/20 rounded-full animate-spin-slow pointer-events-none"></div>
        </div>
        <h2 className="text-xl font-serif font-bold text-blush-800 mb-2">Cargando tus Creaciones...</h2>
        <p className="text-ink-600/60 max-w-sm text-xs">
          Naranjín está buscando en la base de datos tus historias musicales.
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
  const reportAudioIssue = async (songId: string) => {
    try {
      const song = songs.find(s => s.id === songId);
      if (!song) return;
      
      const newFormData = { ...song.form_data, audio_issue_reported: true };
      await supabase.from('mn_songs').update({ form_data: newFormData }).eq('id', songId);
      alert('Hemos recibido tu reporte. Nuestro equipo técnico revisará el audio y nos pondremos en contacto contigo a la brevedad.');
      if (user) fetchSongs(user.id);
    } catch (e) {
      console.error(e);
      alert('Error al enviar el reporte. Por favor intenta de nuevo.');
    }
  };

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
          onClick={() => localStorage.removeItem('mn_draft_song')}
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
                  window.location.href = `https://buy.stripe.com/dRmdR23mZ07ZdIEfQf2Ry01?client_reference_id=${showDemoModal}`;
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

      {unlockingSongId && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 animate-in fade-in zoom-in duration-300">
          <div className="absolute inset-0 bg-ink-950/60 backdrop-blur-md"></div>
          <div className="bg-white rounded-[3rem] p-10 md:p-14 max-w-lg w-full shadow-2xl relative z-10 border border-emerald-100 text-center space-y-6">
            {unlockingStatus === 'checking' && (
              <>
                <div className="bg-emerald-50 text-emerald-500 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-2">
                  <RefreshCw size={40} className="animate-spin" />
                </div>
                <h3 className="text-3xl font-serif text-emerald-800">Procesando tu pago...</h3>
                <p className="text-ink-600 leading-relaxed">
                  Estamos liberando tu canción completa, póster PDF de alta calidad y la mini web personalizada. Esto tomará solo unos segundos.
                </p>
              </>
            )}
            {unlockingStatus === 'success' && (
              <>
                <div className="bg-emerald-100 text-emerald-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-2 animate-bounce">
                  <Heart size={40} className="fill-current text-emerald-500" />
                </div>
                <h3 className="text-3xl font-serif text-emerald-800">¡Pago Exitoso! 🎉</h3>
                <p className="text-ink-600 leading-relaxed font-medium">
                  ¡Tu regalo ha sido completamente desbloqueado! Redirigiéndote a tu canción...
                </p>
              </>
            )}
            {unlockingStatus === 'failed' && (
              <>
                <div className="bg-red-50 text-red-500 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Lock size={40} />
                </div>
                <h3 className="text-3xl font-serif text-red-800">Verificación pendiente</h3>
                <p className="text-ink-600 leading-relaxed">
                  El pago aún está procesándose en Stripe o la conexión tardó de más. Si ya pagaste, la canción se desbloqueará sola en unos minutos.
                </p>
                <div className="flex flex-col gap-2 pt-2">
                  {unlockingSongId !== 'detecting' && (
                    <button 
                      onClick={() => window.location.href = `/cancion/${unlockingSongId}`}
                      className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-sm tracking-widest transition-all"
                    >
                      IR A LA CANCIÓN
                    </button>
                  )}
                  <button 
                    onClick={() => {
                      setUnlockingSongId(null);
                      const url = new URL(window.location.href);
                      url.searchParams.delete('client_reference_id');
                      url.searchParams.delete('session_id');
                      window.history.replaceState({}, '', url.toString());
                    }}
                    className="text-ink-400 text-xs font-bold uppercase tracking-widest hover:text-naranja-500 transition-all py-2"
                  >
                    VER MIS CANCIONES
                  </button>
                </div>
              </>
            )}
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
            onClick={() => localStorage.removeItem('mn_draft_song')}
            className="inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-naranja-500 to-naranja-600 text-white rounded-2xl font-bold text-lg tracking-widest hover:brightness-110 transition-all shadow-xl"
          >
            EMPEZAR AHORA
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {songs.map((song) => (
            <div key={song.id} className="group relative bg-white rounded-[2rem] overflow-hidden shadow-lg transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 border border-blush-50 flex flex-col">
              <div className="absolute top-4 right-4 z-10 flex gap-2">
                {getStatusBadge(song.status)}
                {song.status === 'completed' && (
                  song.is_paid ? (
                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">Liberada</span>
                  ) : (
                    <span className="bg-naranja-100 text-naranja-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">Demo</span>
                  )
                )}
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
                    <div className="space-y-6">
                      {/* Selector de Versiones si existe v2 */}
                      {song.form_data?.version2 && (
                        <div className="flex p-1 bg-blush-50/50 rounded-xl w-full max-w-xs mx-auto">
                          <button 
                            onClick={() => handleVersionSelect(song.id, 1, song.form_data)}
                            className={`flex-1 py-2 px-4 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${(!selectedVersions[song.id] || selectedVersions[song.id] === 1) ? 'bg-white text-naranja-500 shadow-sm' : 'text-blush-400 hover:text-blush-600'}`}
                          >
                            Opción 1
                          </button>
                          <button 
                            onClick={() => handleVersionSelect(song.id, 2, song.form_data)}
                            className={`flex-1 py-2 px-4 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${selectedVersions[song.id] === 2 ? 'bg-white text-blush-500 shadow-sm' : 'text-blush-400 hover:text-blush-600'}`}
                          >
                            Opción 2
                          </button>
                        </div>
                      )}

                      <div className="bg-gradient-to-b from-white to-blush-50/30 rounded-3xl p-6 border border-blush-100 shadow-sm relative overflow-hidden group/player">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-naranja-100/20 rounded-full blur-3xl -mr-16 -mt-16 group-hover/player:bg-naranja-200/30 transition-colors duration-700"></div>
                        
                        <div className="relative z-10">
                          <audio 
                            key={(!selectedVersions[song.id] || selectedVersions[song.id] === 1) ? (song.audio_url || song.demo_url) : (song.form_data?.version2?.audio_url || song.form_data?.version2?.demo_url)}
                            src={(!selectedVersions[song.id] || selectedVersions[song.id] === 1) 
                              ? (song.audio_url || song.demo_url || '') 
                              : (song.form_data?.version2?.audio_url || song.form_data?.version2?.demo_url || '')}
                            controls 
                            controlsList="nodownload"
                            referrerPolicy="no-referrer"
                            onContextMenu={(e) => e.preventDefault()}
                            onTimeUpdate={(e) => {
                              if (!song.is_paid && e.currentTarget.currentTime >= 90) {
                                e.currentTarget.pause();
                                e.currentTarget.currentTime = 0;
                                setShowDemoModal(song.id);
                              }
                            }}
                            onError={(e) => {
                              const target = e.currentTarget;
                              if (target.src && !target.src.includes('retry=')) {
                                const url = new URL(target.src);
                                url.searchParams.set('retry', Date.now().toString());
                                target.src = url.toString();
                              }
                            }}
                            className="w-full mb-2 custom-audio-player"
                          >
                            Tu navegador no soporta el reproductor de audio.
                          </audio>

                          <div className="flex justify-center mb-4">
                            <button 
                              onClick={() => reportAudioIssue(song.id)}
                              disabled={song.form_data?.audio_issue_reported}
                              className={`text-[9px] font-black uppercase flex items-center gap-1 transition-opacity ${song.form_data?.audio_issue_reported ? 'text-amber-500 opacity-100' : 'text-naranja-500 opacity-60 hover:opacity-100 hover:underline'}`}
                            >
                              {song.form_data?.audio_issue_reported ? (
                                <><Clock size={10} /> Reporte enviado - Te contactaremos</>
                              ) : (
                                <><ExternalLink size={10} /> ¿Problemas con el audio? Repórtalo aquí</>
                              )}
                            </button>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            {!song.is_paid ? (
                              <span className="text-[10px] font-bold text-naranja-600 uppercase tracking-widest bg-white px-3 py-1 rounded-full border border-naranja-100 italic">
                                {(!selectedVersions[song.id] || selectedVersions[song.id] === 1) ? 'Muestra de 1.5 Minutos' : 'Muestra Alternativa'}
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest bg-green-50 px-3 py-1 rounded-full border border-green-100">
                                ✓ Pista Completa
                              </span>
                            )}
                            
                            {song.is_paid && (
                              <a 
                                href={(!selectedVersions[song.id] || selectedVersions[song.id] === 1) ? (song.audio_url || '') : (song.form_data?.version2?.audio_url || '')} 
                                target="_blank" rel="noreferrer" download 
                                className="text-[10px] flex items-center gap-1 font-bold text-naranja-600 uppercase tracking-widest bg-white px-3 py-1 rounded-full border border-naranja-100 hover:bg-naranja-50 transition shadow-sm"
                              >
                                <Download size={12} /> Descargar
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="py-12 bg-gray-50 rounded-3xl border border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 gap-3">
                      {(song.status === 'draft' || song.status === 'lyrics_ready') ? (
                        <>
                          <RefreshCw className="text-gray-300" />
                          <p className="text-[10px] font-bold uppercase tracking-widest italic mb-2">
                            {song.status === 'draft' ? 'Borrador Guardado' : 'Falta generar el audio'}
                          </p>
                          <button 
                            onClick={() => {
                              const draft = {
                                ...song.form_data,
                                lyrics: song.lyrics,
                                step: 2, 
                                currentSongId: song.id 
                              };
                              localStorage.setItem('mn_draft_song', JSON.stringify(draft));
                              window.location.href = '/crear-cancion';
                            }}
                            className="px-6 py-2 bg-white text-naranja-500 border border-naranja-200 rounded-xl font-bold text-xs hover:bg-naranja-50 transition-all uppercase tracking-widest flex items-center justify-center gap-2 shadow-sm"
                          >
                            Continuar Creación
                          </button>
                        </>
                      ) : (
                        <>
                          <Clock className="animate-pulse" />
                          <p className="text-[10px] font-bold uppercase tracking-widest italic">Componiendo tu historia...</p>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="px-8 pb-8 pt-2 flex flex-col gap-3">
                
                {/* Botón Descarga Grande si está pagada */}
                {song.is_paid && (song.audio_url || song.form_data?.version2?.audio_url) && (
                  <a 
                    href={(!selectedVersions[song.id] || selectedVersions[song.id] === 1) ? (song.audio_url || '') : (song.form_data?.version2?.audio_url || '')} 
                    target="_blank" rel="noreferrer" download 
                    className="w-full py-3 bg-white text-naranja-600 border border-naranja-200 rounded-xl font-bold text-xs hover:bg-naranja-50 transition-all uppercase tracking-widest flex items-center justify-center gap-2 mb-1 shadow-sm"
                  >
                    <Download size={14} /> Descargar Canción (MP3)
                  </a>
                )}

                {song.form_data?.infographic_data ? (
                  <>
                    <Link 
                      to={`/cancion/${song.id}`}
                      className="w-full py-3 bg-[#1C2A39] text-white rounded-xl font-bold text-xs hover:bg-[#2A3F54] transition-all uppercase tracking-widest flex items-center justify-center gap-2 mb-3"
                    >
                      <Scroll size={14} /> Ver Mi Legado
                    </Link>
                    <Link 
                      to={`/legado/${song.id}`}
                      className="w-full py-3 bg-blush-50 text-[#1C2A39] border border-[#1C2A39]/20 rounded-xl font-bold text-xs hover:bg-[#1C2A39] hover:text-white transition-all uppercase tracking-widest flex items-center justify-center gap-2"
                    >
                      <RefreshCw size={14} /> Modificar Legado / Foto
                    </Link>
                  </>
                ) : (
                  <>
                    {/* Botón Ver Regalo */}
                    {song.status === 'completed' && (
                      <Link 
                        to={song.is_paid ? `/cancion/${song.id}` : '#'}
                        onClick={(e) => {
                          if (!song.is_paid) {
                            e.preventDefault();
                            window.location.href = `https://buy.stripe.com/dRmdR23mZ07ZdIEfQf2Ry01?client_reference_id=${song.id}`;
                          }
                        }}
                        className={`w-full py-3 ${!song.is_paid ? 'bg-naranja-500 hover:bg-naranja-600' : 'bg-blush-500 hover:bg-blush-600'} text-white rounded-xl font-bold text-xs transition-all uppercase tracking-widest flex items-center justify-center gap-2 mb-3`}
                      >
                        {!song.is_paid ? <Lock size={14} /> : <Heart size={14} />} 
                        {!song.is_paid ? "DESBLOQUEAR Y VER REGALO" : "VER MI REGALO"}
                      </Link>
                    )}
                    
                    <button 
                      onClick={() => {
                        const draft = {
                          ...song.form_data,
                          lyrics: song.lyrics,
                          step: 2, // Saltar directamente al taller de letra
                          currentSongId: song.status === 'draft' ? song.id : null // Solo sobreescribir si es borrador
                        };
                        localStorage.setItem('mn_draft_song', JSON.stringify(draft));
                        window.location.href = '/crear-cancion';
                      }}
                      className="w-full py-3 bg-blush-50 text-blush-600 rounded-xl font-bold text-xs hover:bg-naranja-50 hover:text-naranja-600 transition-all uppercase tracking-widest flex items-center justify-center gap-2"
                    >
                      <RefreshCw size={14} /> Ver Letra / Modificar
                    </button>

                    {/* Botón de Upsell para Legado Digital en la tarjeta */}
                    {song.form_data?.category === 'papa' && !song.form_data?.infographic_data && (
                      <TributeAddon 
                        song={song} 
                        variant="card" 
                      />
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
