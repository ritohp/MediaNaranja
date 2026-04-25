import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Music, 
  TrendingUp, 
  DollarSign, 
  Search, 
  Play, 
  Download, 
  ChevronDown, 
  ChevronUp, 
  Loader2, 
  AlertCircle, 
  X, 
  Coins, 
  RotateCcw
} from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('panel'); // panel, seguimiento, recientes, marketing
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalSongs: 0,
    conversionRate: 0,
    revenue: 0,
    activeCreations: 0
  });

  const [masterData, setMasterData] = useState<any[]>([]);

  const fetchData = async () => {
    try {
      const { data: profiles } = await supabase.from('mn_profiles').select('*').order('created_at', { ascending: false });
      const { data: songs } = await supabase.from('mn_songs').select('*').order('created_at', { ascending: false });

      const unified = (profiles || []).map((profile: any) => {
        const userSongs = (songs || []).filter(s => s.user_id === profile.id);
        
        let funnelStatus = '🔖 Registro';
        let statusColor = 'bg-gray-100 text-gray-500';
        
        if (userSongs.some(s => s.status === 'complete')) {
          funnelStatus = '✅ Éxito';
          statusColor = 'bg-emerald-100 text-emerald-600';
        } else if (userSongs.length > 0) {
          funnelStatus = '✍️ Diseño';
          statusColor = 'bg-orange-100 text-orange-600';
        }

        return {
          ...profile,
          songs: userSongs,
          funnelStatus,
          statusColor
        };
      });

      setMasterData(unified);

      const totalU = profiles?.length || 0;
      const totalS = songs?.length || 0;
      const activeS = (songs || []).filter(s => s.status !== 'complete').length || 0;
      const conv = totalU > 0 ? (totalS / totalU) * 100 : 0;
      
      const { data: payments } = await supabase.from('mn_payments').select('*');
      
      const realRevenue = (payments || []).filter(p => p.status === 'completed').reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

      setStats({
        totalUsers: totalU,
        totalSongs: totalS,
        conversionRate: parseFloat(conv.toFixed(1)),
        revenue: realRevenue,
        activeCreations: activeS
      });

    } catch (error) {
      console.error("Critical Admin Sync Error:", error);
    }
  };

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user || session.user.email !== 'ritohp@gmail.com') {
          navigate('/');
          return;
        }
        setChecking(false);
        await fetchData();
      } catch (err) {
        console.error("Auth check failed:", err);
      } finally {
        setLoading(false);
      }
    };
    checkAdmin();
  }, [navigate]);

  const handleResetTokens = async (userId: string) => {
    if (isProcessing) return;
    setIsProcessing(userId);
    try {
      const { error } = await supabase
        .from('mn_profiles')
        .update({ tokens_balance: 3 })
        .eq('id', userId);
      if (!error) await fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(null);
    }
  };

  const handleResetSongStatus = async (songId: string) => {
    if (isProcessing) return;
    setIsProcessing(songId);
    try {
      const { error } = await supabase
        .from('mn_songs')
        .update({ 
           status: 'draft',
           audio_url: null,
           demo_url: null,
           task_id: null 
        })
        .eq('id', songId);
      if (!error) await fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(null);
    }
  };

  const filteredData = (masterData || []).filter(user => 
    (user?.email || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const allRecentSongs = (masterData || [])
    .flatMap(u => (u.songs || []).map((s: any) => ({ ...s, userEmail: u.email })))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 20);

  if (checking || loading) {
    return (
      <div className="min-h-screen bg-[#FDF9F8] flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-6">
           <Loader2 className="w-12 h-12 text-naranja-500 animate-spin" />
           <p className="text-[10px] font-black uppercase tracking-[0.4em] text-naranja-400 animate-pulse text-center leading-loose">Protegiendo Ecosistema Media Naranja...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDF9F8] text-[#1A1A1A] font-sans pb-20">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800&display=swap');
        .font-outfit { font-family: 'Outfit', sans-serif; }
        .custom-scroll::-webkit-scrollbar { height: 10px; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #FF6B0022; border-radius: 10px; }
      `}</style>
      
      <nav className="bg-white border-b border-orange-50 px-8 py-5 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-10">
          <div className="text-2xl font-black text-[#FF6B00] font-outfit">MN<span className="text-[#FF2D55]">ADMIN</span></div>
          <div className="hidden md:flex gap-8">
              <button onClick={() => setActiveTab('panel')} className={`text-[10px] font-black uppercase tracking-widest ${activeTab === 'panel' ? 'text-naranja-500 border-b-2 border-naranja-500' : 'text-gray-300'}`}>Panel</button>
              <button onClick={() => setActiveTab('seguimiento')} className={`text-[10px] font-black uppercase tracking-widest ${activeTab === 'seguimiento' ? 'text-naranja-500 border-b-2 border-naranja-500' : 'text-gray-300'}`}>Seguimiento</button>
              <button onClick={() => setActiveTab('recientes')} className={`text-[10px] font-black uppercase tracking-widest ${activeTab === 'recientes' ? 'text-naranja-500 border-b-2 border-naranja-500' : 'text-gray-300'}`}>Recientes</button>
              <button onClick={() => setActiveTab('marketing')} className={`text-[10px] font-black uppercase tracking-widest ${activeTab === 'marketing' ? 'text-naranja-500 border-b-2 border-naranja-500' : 'text-gray-300'}`}>Marketing</button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-10 space-y-8">
        
        {activeTab === 'panel' && (
          <div className="animate-in fade-in duration-500 grid grid-cols-1 md:grid-cols-4 gap-6">
             {[
               { label: 'Usuarios', value: stats.totalUsers, icon: <Users /> },
               { label: 'Historias', value: stats.totalSongs, icon: <Music /> },
               { label: 'Ingresos MXN', value: `$${stats.revenue.toLocaleString()}`, icon: <DollarSign /> },
               { label: 'Conversión', value: `${stats.conversionRate}%`, icon: <TrendingUp /> }
             ].map((m, i) => (
               <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-orange-50 shadow-sm">
                  <div className="text-naranja-500 mb-4 opacity-50">{m.icon}</div>
                  <p className="text-[10px] font-black uppercase text-gray-300 mb-1">{m.label}</p>
                  <p className="text-3xl font-black font-outfit">{m.value}</p>
               </div>
             ))}
          </div>
        )}

        {activeTab === 'seguimiento' && (
          <div className="animate-in slide-in-from-bottom-5 duration-500 space-y-6">
            <header className="flex justify-between items-center gap-6">
              <h2 className="text-3xl font-black font-outfit">Seguimiento Maestro</h2>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                <input 
                  type="text" placeholder="Buscar email..." 
                  value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-6 py-4 bg-white border border-orange-50 rounded-2xl text-sm font-bold w-64 md:w-96 outline-none focus:ring-2 focus:ring-naranja-200"
                />
              </div>
            </header>

            <div className="bg-white rounded-[3rem] border border-orange-50 shadow-xl overflow-hidden">
               <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 border-b border-orange-50">
                      <th className="py-6 px-8">Identidad Cliente</th>
                      <th className="py-6 px-8">Regalos</th>
                      <th className="py-6 px-8">Fase Funnel</th>
                      <th className="py-6 px-8 text-right">Mando</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-orange-50/50">
                    {filteredData.map((u) => (
                      <React.Fragment key={u?.id || Math.random()}>
                        <tr onClick={() => u?.id && setExpandedUser(expandedUser === u.id ? null : u.id)} className="hover:bg-gray-50/50 cursor-pointer transition-colors">
                          <td className="py-6 px-8 font-black text-sm">{u?.email || 'N/A'}</td>
                          <td className="py-6 px-8"><div className="flex items-center gap-2"><Coins size={14} className="text-amber-500" /> <span className="font-bold">{u?.tokens_balance ?? 0}</span></div></td>
                          <td className="py-6 px-8"><span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase ${u?.statusColor || 'bg-gray-100'}`}>{u?.funnelStatus || 'Unknown'}</span></td>
                          <td className="py-6 px-8 text-right">
                             <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                <button onClick={() => u?.id && handleResetTokens(u.id)} disabled={isProcessing === u?.id} className="p-3 bg-white border border-orange-100 rounded-xl text-amber-500 hover:bg-amber-500 hover:text-white transition-all shadow-sm">
                                  {isProcessing === u?.id ? <Loader2 size={16} className="animate-spin" /> : <RotateCcw size={16}/>}
                                </button>
                                <div className="p-3 text-naranja-500">{expandedUser === u?.id ? <ChevronUp size={18}/> : <ChevronDown size={18}/>}</div>
                             </div>
                          </td>
                        </tr>
                        {expandedUser === u?.id && (
                          <tr className="bg-orange-50/20">
                            <td colSpan={4} className="p-8">
                                <div className="flex gap-6 overflow-x-auto pb-6 custom-scroll">
                                   {(u?.songs || []).length > 0 ? u.songs.map((s: any) => (
                                    <div key={s?.id || Math.random()} className="min-w-[380px] bg-white p-8 rounded-[2.5rem] border border-orange-100 shadow-lg space-y-6 flex-shrink-0 relative">
                                       <div className="flex justify-between items-start">
                                          <Music size={24} className={s?.status === 'complete' ? 'text-emerald-500' : 'text-gray-300'} />
                                          <div className="flex flex-col items-end gap-2">
                                             <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full ${s?.status === 'complete' ? 'bg-pink-50 text-pink-500' : 'bg-gray-50'}`}>{s?.status || 'Draft'}</span>
                                             <button onClick={() => s?.id && handleResetSongStatus(s.id)} className="text-[8px] font-black uppercase text-naranja-400 hover:text-naranja-600 transition-colors flex items-center gap-1">
                                                {isProcessing === s?.id ? <Loader2 size={10} className="animate-spin" /> : <RotateCcw size={10} />} Regresar a Edición
                                             </button>
                                          </div>
                                       </div>
                                       <h4 className="text-base font-black truncate">{s?.title || 'Historia Sonora'}</h4>
                                       
                                       <div className="space-y-4">
                                          {/* Opción 1 */}
                                          {s?.audio_url || s?.demo_url ? (
                                            <div className="space-y-2">
                                              <p className="text-[8px] font-black uppercase text-gray-400">Opción 1</p>
                                              <audio src={s.demo_url || s.audio_url} controls crossOrigin="anonymous" referrerPolicy="no-referrer" className="w-full h-8" />
                                            </div>
                                          ) : <div className="py-3 bg-gray-50 text-gray-300 rounded-xl text-[9px] font-black uppercase text-center border border-dashed border-gray-200">Sin Audio 1</div>}

                                          {/* Opción 2 */}
                                          {s?.form_data?.version2 ? (
                                            <div className="space-y-2">
                                              <p className="text-[8px] font-black uppercase text-gray-400">Opción 2</p>
                                              <audio src={s.form_data.version2.demo_url || s.form_data.version2.audio_url} controls crossOrigin="anonymous" referrerPolicy="no-referrer" className="w-full h-8" />
                                            </div>
                                          ) : null}
                                       </div>

                                       <div className="pt-4 border-t border-gray-50 flex gap-2">
                                          {s?.audio_url && <a href={s.audio_url} target="_blank" rel="noreferrer" className="flex-1 py-3 bg-gray-50 text-gray-400 rounded-xl text-[9px] font-black uppercase text-center hover:bg-naranja-500 hover:text-white transition-all flex items-center justify-center gap-2"><Download size={14} /> Descargar Original</a>}
                                       </div>
                                    </div>
                                  )) : <div className="w-full py-10 flex flex-col items-center justify-center text-gray-300 space-y-4"><AlertCircle size={40} className="opacity-20" /><p className="text-xs font-black uppercase tracking-widest italic">Aún no hay creaciones</p></div>}
                                </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                    {filteredData.length === 0 && <tr><td colSpan={4} className="py-20 text-center text-gray-300 font-bold uppercase tracking-widest">No se hallaron coincidencias</td></tr>}
                  </tbody>
               </table>
            </div>
          </div>
        )}

        {activeTab === 'recientes' && (
           <div className="animate-in slide-in-from-bottom-5 duration-500 space-y-6">
              <h2 className="text-3xl font-black font-outfit">Últimas 20 Creaciones (Global)</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {allRecentSongs.map((s: any) => (
                   <div key={s.id} className="bg-white p-6 rounded-[2rem] border border-orange-50 shadow-sm space-y-4">
                      <div className="flex justify-between items-start">
                        <p className="text-[9px] font-black uppercase text-naranja-500">{s.userEmail}</p>
                        <span className="text-[8px] text-gray-300">{new Date(s.created_at).toLocaleString()}</span>
                      </div>
                      <h4 className="font-bold text-sm truncate">{s.title || 'Sin Título'}</h4>
                      <audio src={s.demo_url || s.audio_url} controls crossOrigin="anonymous" referrerPolicy="no-referrer" className="w-full h-8" />
                   </div>
                 ))}
              </div>
           </div>
        )}

        {activeTab === 'marketing' && (
           <div className="animate-in slide-in-from-bottom-5 duration-500 space-y-6">
              <header className="flex justify-between items-center gap-6">
                 <h2 className="text-3xl font-black font-outfit">Embudos de Retargeting Automatizados (Próximamente)</h2>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="bg-white p-8 rounded-[2.5rem] border border-orange-50 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-full blur-3xl opacity-50"></div>
                    <div className="relative z-10">
                       <div className="inline-block px-3 py-1 bg-green-50 text-green-600 text-[10px] font-black uppercase tracking-widest rounded-full mb-4">Día 1</div>
                       <h3 className="text-xl font-black font-outfit mb-2">Recordatorio Amistoso</h3>
                       <p className="text-xs text-gray-400 mb-6 font-medium leading-relaxed">Se enviará a las 24 horas a los clientes que hicieron una canción pero no la pagaron.</p>
                       <button className="w-full py-3 bg-gray-50 text-gray-400 font-bold text-xs uppercase tracking-widest rounded-xl cursor-not-allowed">Configurar Plantilla</button>
                    </div>
                 </div>

                 <div className="bg-white p-8 rounded-[2.5rem] border border-orange-50 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-pink-50 rounded-full blur-3xl opacity-50"></div>
                    <div className="relative z-10">
                       <div className="inline-block px-3 py-1 bg-amber-50 text-amber-600 text-[10px] font-black uppercase tracking-widest rounded-full mb-4">Día 3</div>
                       <h3 className="text-xl font-black font-outfit mb-2">Oferta Relámpago</h3>
                       <p className="text-xs text-gray-400 mb-6 font-medium leading-relaxed">Se enviará a las 72 horas ofreciendo un motivo fuerte (ej. descuento temporal) para cerrar la venta.</p>
                       <button className="w-full py-3 bg-gray-50 text-gray-400 font-bold text-xs uppercase tracking-widest rounded-xl cursor-not-allowed">Configurar Plantilla</button>
                    </div>
                 </div>
              </div>
           </div>
        )}
      </main>
    </div>
  );
}
