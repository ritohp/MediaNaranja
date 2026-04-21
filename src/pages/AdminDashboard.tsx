import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User,
  Users, 
  Music, 
  TrendingUp, 
  DollarSign, 
  BarChart3, 
  ArrowUpRight, 
  ArrowDownRight, 
  Clock,
  Layout,
  MessageSquare,
  ChevronRight,
  Filter,
  Search,
  ExternalLink,
  ArrowRight,
  Database,
  FileText,
  Play,
  Download,
  Eye,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('panel');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalSongs: 0,
    conversionRate: 0,
    revenue: 0,
    activeCreations: 0
  });

  const [masterData, setMasterData] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || user.email !== 'ritohp@gmail.com') {
        navigate('/');
        return;
      }
      setChecking(false);

      try {
        const { data: profiles } = await supabase.from('mn_profiles').select('*').order('created_at', { ascending: false });
        const { data: songs } = await supabase.from('mn_songs').select('*').order('created_at', { ascending: false });

        const unified = profiles?.map((profile: any) => {
          const userSongs = songs?.filter(s => s.user_id === profile.id) || [];
          
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
        }) || [];

        setMasterData(unified);

        const totalU = profiles?.length || 0;
        const totalS = songs?.length || 0;
        const activeS = songs?.filter(s => s.status !== 'complete').length || 0;
        const conv = totalU > 0 ? (totalS / totalU) * 100 : 0;
        
        setStats({
          totalUsers: totalU,
          totalSongs: totalS,
          conversionRate: parseFloat(conv.toFixed(1)),
          revenue: (totalS - activeS) * 49,
          activeCreations: activeS
        });

      } catch (error) {
        console.error("Error fetching admin data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const toggleUser = (id: string) => {
    setExpandedUser(expandedUser === id ? null : id);
  };

  const filteredData = masterData.filter(user => 
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (checking || loading) {
    return (
      <div className="min-h-screen bg-[#FDF9F8] flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
           <div className="w-16 h-16 border-4 border-naranja-100 border-t-naranja-500 rounded-full animate-spin"></div>
           <p className="text-[10px] font-black uppercase tracking-[0.4em] text-naranja-400 animate-pulse">Sincronizando Boutique...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDF9F8] text-[#1A1A1A] font-sans pb-20">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&display=swap');
        .font-outfit { font-family: 'Outfit', sans-serif; }
        ::-webkit-scrollbar { height: 6px; }
        ::-webkit-scrollbar-thumb { background: #FF6B0022; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #FF6B0044; }
      `}</style>
      
      {/* NAVBAR */}
      <nav className="bg-white border-b border-orange-50 px-8 py-5 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-10">
          <div className="text-2xl font-black tracking-tighter text-[#FF6B00] font-outfit">MN<span className="text-[#FF2D55]">ADMIN</span></div>
          <div className="hidden md:flex items-center gap-8">
             <button onClick={() => setActiveTab('panel')} className={`text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'panel' ? 'text-naranja-600 border-b-2 border-naranja-500 pb-1' : 'text-gray-300 hover:text-gray-500'}`}>Panel</button>
             <button onClick={() => setActiveTab('seguimiento')} className={`text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'seguimiento' ? 'text-naranja-600 border-b-2 border-naranja-500 pb-1' : 'text-gray-300 hover:text-gray-500'}`}>Seguimiento Maestro</button>
          </div>
        </div>
        <div className="flex items-center gap-3">
           <div className="hidden sm:block text-right">
              <p className="text-[8px] font-black uppercase text-orange-300">Admin Live</p>
              <p className="text-xs font-bold text-gray-800">ritohp@gmail.com</p>
           </div>
           <div className="w-10 h-10 bg-naranja-50 text-naranja-500 rounded-2xl flex items-center justify-center font-black">R</div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-10 space-y-8">
        
        {/* VIEW: PANEL */}
        {activeTab === 'panel' && (
          <div className="space-y-10 animate-in fade-in duration-700">
            <header className="flex justify-between items-end">
               <div>
                  <h1 className="text-4xl font-black font-outfit tracking-tight">Centro de Mando</h1>
                  <p className="text-gray-400 text-sm mt-1">Sincronización total con Media Naranja.</p>
               </div>
               <div className="bg-white p-4 rounded-2xl border border-orange-50 shadow-sm flex items-center gap-3">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div>
                  <span className="text-[10px] font-black uppercase text-gray-400">Database Connected</span>
               </div>
            </header>

            <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
               {[
                 { label: 'Usuarios', value: stats.totalUsers, icon: <Users /> },
                 { label: 'Obras', value: stats.totalSongs, icon: <Music /> },
                 { label: 'Ventas Est.', value: `$${stats.revenue}`, icon: <DollarSign /> },
                 { label: 'Conversión', value: `${stats.conversionRate}%`, icon: <TrendingUp /> }
               ].map((m, i) => (
                 <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-orange-50 shadow-sm space-y-4">
                    <div className="text-naranja-500 opacity-50">{m.icon}</div>
                    <div>
                       <p className="text-[9px] font-black uppercase text-gray-300 tracking-widest">{m.label}</p>
                       <p className="text-3xl font-black font-outfit">{m.value}</p>
                    </div>
                 </div>
               ))}
            </section>

            <section className="bg-white p-10 rounded-[3rem] border border-orange-50 shadow-sm space-y-10">
               <h3 className="text-lg font-black font-outfit uppercase tracking-widest text-gray-400">Rendimiento de Producción</h3>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                  {[
                    { label: 'Registros', value: stats.totalUsers, color: 'bg-emerald-400' },
                    { label: 'En Proceso', value: stats.totalSongs, color: 'bg-orange-400' },
                    { label: 'Completados', value: stats.totalSongs - stats.activeCreations, color: 'bg-pink-400' }
                  ].map((s, i) => (
                    <div key={i} className="space-y-4">
                       <div className="flex justify-between items-end">
                          <p className="text-xs font-black uppercase text-gray-800">{s.label}</p>
                          <p className="text-2xl font-black font-outfit">{s.value}</p>
                       </div>
                       <div className="h-2 bg-gray-50 rounded-full overflow-hidden">
                          <div className={`h-full ${s.color} rounded-full`} style={{ width: `${(s.value / (stats.totalUsers || 1)) * 100}%` }}></div>
                       </div>
                    </div>
                  ))}
               </div>
            </section>
          </div>
        )}

        {/* VIEW: SEGUIMIENTO MAESTRO (REDESIGN) */}
        {activeTab === 'seguimiento' && (
          <div className="space-y-8 animate-in slide-in-from-bottom-5 duration-700">
            <header className="flex flex-col md:flex-row justify-between items-center gap-6">
              <h2 className="text-3xl font-black font-outfit">Seguimiento Maestro</h2>
              <div className="relative w-full md:w-96">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                <input 
                  type="text" 
                  placeholder="Buscar email..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-6 py-4 bg-white border border-orange-50 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-naranja-300 shadow-sm font-bold" 
                />
              </div>
            </header>

            <div className="bg-white rounded-[3rem] border border-orange-50 shadow-xl overflow-hidden">
               <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50/50 text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-orange-50">
                      <th className="py-6 px-8">Usuario</th>
                      <th className="py-6 px-8">Embudo</th>
                      <th className="py-6 px-8">Obras</th>
                      <th className="py-6 px-8 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-orange-50/50">
                    {filteredData.map((u) => (
                      <React.Fragment key={u.id}>
                        <tr className={`group transition-all ${expandedUser === u.id ? 'bg-orange-50/30' : 'hover:bg-gray-50/50'}`}>
                          <td className="py-6 px-8">
                             <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white border border-orange-100 rounded-xl flex items-center justify-center font-black text-naranja-500 shadow-sm">{u.email?.[0].toUpperCase()}</div>
                                <div>
                                   <p className="text-sm font-black font-outfit">{u.email}</p>
                                   <p className="text-[9px] text-gray-300 font-bold uppercase">{new Date(u.created_at).toLocaleDateString()}</p>
                                </div>
                             </div>
                          </td>
                          <td className="py-6 px-8">
                             <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm ${u.statusColor}`}>
                                {u.funnelStatus}
                             </span>
                          </td>
                          <td className="py-6 px-8">
                             <div className="flex items-center gap-2">
                                <Music size={14} className="text-gray-300" />
                                <span className="font-bold text-sm">{u.songs.length}</span>
                             </div>
                          </td>
                          <td className="py-6 px-8 text-right">
                             <button 
                               onClick={() => toggleUser(u.id)}
                               className="p-3 bg-white border border-orange-100 rounded-xl text-naranja-500 hover:bg-naranja-500 hover:text-white transition-all shadow-sm"
                             >
                               {expandedUser === u.id ? <ChevronUp size={18}/> : <ChevronDown size={18}/>}
                             </button>
                          </td>
                        </tr>
                        
                        {/* SUB-LISTA HORIZONTAL DE CANCIONES */}
                        {expandedUser === u.id && (
                          <tr className="bg-orange-50/20">
                            <td colSpan={4} className="p-8">
                               <div className="flex gap-6 overflow-x-auto pb-4 custom-scroll">
                                  {u.songs.length > 0 ? u.songs.map((s: any) => (
                                    <div key={s.id} className="min-w-[320px] bg-white p-8 rounded-[2rem] border border-orange-100 shadow-lg space-y-6 flex-shrink-0 animate-in zoom-in-95 duration-500">
                                       <div className="flex justify-between items-start">
                                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.status === 'complete' ? 'bg-emerald-50 text-emerald-500' : 'bg-gray-50 text-gray-300'}`}>
                                             <Music size={20} />
                                          </div>
                                          <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full ${s.status === 'complete' ? 'bg-pink-50 text-pink-500' : 'bg-gray-50 text-gray-400'}`}>
                                            {s.status}
                                          </span>
                                       </div>
                                       <div>
                                          <h4 className="text-base font-black font-outfit truncate text-gray-800">{s.title || 'Canción sin título'}</h4>
                                          <p className="text-[9px] font-bold text-gray-300 uppercase tracking-widest mt-1">ID: {s.id?.slice(0,8)}</p>
                                       </div>
                                       <div className="flex gap-3">
                                          {s.audio_url ? (
                                            <>
                                               <button onClick={() => window.open(s.audio_url, '_blank')} className="flex-1 py-3 bg-[#1A1A1A] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 transition-all flex items-center justify-center gap-2 shadow-lg">
                                                  <Play size={14} fill="currentColor" /> ESCUCHAR
                                               </button>
                                               <a href={s.audio_url} download className="w-12 h-12 bg-gray-50 text-gray-400 rounded-xl flex items-center justify-center hover:bg-naranja-500 hover:text-white transition-all">
                                                  <Download size={18} />
                                               </a>
                                            </>
                                          ) : (
                                            <div className="flex-1 py-3 bg-gray-50 text-gray-300 rounded-xl text-[9px] font-black uppercase text-center border border-dashed border-gray-200">
                                               Producción pendiente
                                            </div>
                                          )}
                                       </div>
                                    </div>
                                  )) : (
                                    <div className="w-full py-10 flex flex-col items-center justify-center text-gray-300 space-y-4">
                                       <AlertCircle size={40} className="opacity-20" />
                                       <p className="text-xs font-black uppercase tracking-widest">Este usuario aún no tiene obras iniciadas</p>
                                    </div>
                                  )}
                               </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
               </table>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

import React from 'react';
