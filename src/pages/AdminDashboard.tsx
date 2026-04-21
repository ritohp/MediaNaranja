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
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('panel'); // 'panel', 'seguimiento'
  const [searchQuery, setSearchQuery] = useState('');
  
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
        // 1. Traer Perfiles y Canciones
        const { data: profiles } = await supabase.from('mn_profiles').select('*').order('created_at', { ascending: false });
        const { data: songs } = await supabase.from('mn_songs').select('*').order('created_at', { ascending: false });

        // 2. Unificar Datos (Master Joint)
        const unified = profiles?.map((profile: any) => {
          const userSongs = songs?.filter(s => s.user_id === profile.id) || [];
          
          // Lógica de estado de embudo
          let funnelStatus = '🏷️ Solo Registro';
          let statusColor = 'bg-gray-100 text-gray-500';
          
          if (userSongs.some(s => s.status === 'complete')) {
            funnelStatus = '✅ ¡Venta Exitosa!';
            statusColor = 'bg-emerald-100 text-emerald-600';
          } else if (userSongs.length > 0) {
            funnelStatus = '✍️ Diseñando Canción';
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

        // 3. Calcular Estadísticas
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
        console.error("Error fetching admin stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const filteredData = masterData.filter(user => 
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (checking || loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
           <div className="relative">
              <div className="w-20 h-20 border-4 border-orange-100 rounded-full animate-pulse"></div>
              <Loader2 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#FF6B00] animate-spin" size={40} />
           </div>
           <p className="text-xs font-black uppercase tracking-[0.4em] text-gray-400 animate-pulse italic">Media Naranja • Sincronizando Boutique</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans pb-20">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&display=swap');
        .font-outfit { font-family: 'Outfit', sans-serif; }
      `}</style>
      
      {/* HEADER NAVBAR */}
      <nav className="bg-white border-b border-gray-100 px-8 py-5 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-8">
          <div className="text-2xl font-black tracking-tighter text-[#FF6B00] font-outfit">MN<span className="text-[#FF2D55]">ADMIN</span></div>
          <div className="hidden md:flex items-center gap-8">
             <button 
               onClick={() => setActiveTab('panel')}
               className={`text-[10px] font-black uppercase tracking-widest pb-1 transition-all ${activeTab === 'panel' ? 'border-b-2 border-[#FF6B00]' : 'text-gray-400 hover:text-gray-600'}`}
             >
               Panel General
             </button>
             <button 
               onClick={() => setActiveTab('seguimiento')}
               className={`text-[10px] font-black uppercase tracking-widest pb-1 transition-all ${activeTab === 'seguimiento' ? 'border-b-2 border-[#FF6B00]' : 'text-gray-400 hover:text-gray-600'}`}
             >
               Seguimiento Maestro
             </button>
          </div>
        </div>
        <div className="flex items-center gap-4">
           <div className="w-10 h-10 bg-brand-gradient text-white rounded-2xl flex items-center justify-center shadow-lg">
              <User size={18} />
           </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-10 space-y-10">
        
        {/* --- VISTA: PANEL (OVERVIEW) --- */}
        {activeTab === 'panel' && (
          <>
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-1 text-center md:text-left">
                 <h1 className="text-4xl font-black font-outfit tracking-tight">Estadísticas Boutique</h1>
                 <p className="text-gray-400 text-sm italic italic">Resumen en vivo de tu plataforma de melodías.</p>
              </div>
              <div className="flex gap-4 h-fit">
                <button 
                  onClick={() => setActiveTab('seguimiento')}
                  className="px-8 py-4 bg-[#1A1A1A] text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-[#FF6B00] transition-all shadow-xl flex items-center gap-3"
                >
                  Ir al Seguimiento <ArrowRight size={14}/>
                </button>
              </div>
            </header>

            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
               {[
                 { label: 'Usuarios Reales', value: stats.totalUsers, icon: <Users className="text-blue-500" /> },
                 { label: 'Historias Creadas', value: stats.totalSongs, icon: <Music className="text-pink-500" /> },
                 { label: 'Ingresos Est. (USD)', value: `$${stats.revenue}`, icon: <DollarSign className="text-emerald-500" /> },
                 { label: 'Conversión', value: `${stats.conversionRate}%`, icon: <TrendingUp className="text-orange-500" /> }
               ].map((metric, i) => (
                 <div key={i} className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm space-y-4 text-center items-center flex flex-col">
                    <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mb-2">
                       {metric.icon}
                    </div>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em]">{metric.label}</p>
                    <p className="text-4xl font-black font-outfit">{metric.value}</p>
                 </div>
               ))}
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
               <section className="lg:col-span-2 bg-white p-12 rounded-[3.5rem] border border-gray-100 shadow-sm space-y-10">
                  <h3 className="text-xl font-black font-outfit flex items-center gap-3 text-gray-800">
                     <BarChart3 className="text-[#FF6B00]" /> Eficiencia del Embudo
                  </h3>
                  <div className="space-y-10">
                     {[
                       { label: 'Registro Base', value: stats.totalUsers, color: 'bg-emerald-400' },
                       { label: 'Diseño Activo', value: stats.totalSongs, color: 'bg-orange-400' },
                       { label: 'Completo / Pagado', value: stats.totalSongs - stats.activeCreations, color: 'bg-pink-400' }
                     ].map((step, i) => (
                        <div key={i} className="space-y-3">
                           <div className="flex justify-between text-[11px] font-black uppercase tracking-widest px-1">
                              <span className="text-gray-400">{step.label}</span>
                              <span className="text-gray-900 font-outfit">{step.value}</span>
                           </div>
                           <div className="h-4 bg-gray-50 rounded-full overflow-hidden shadow-inner">
                              <div 
                                className={`h-full ${step.color} rounded-full transition-all duration-1000`}
                                style={{ width: `${(step.value / (stats.totalUsers || 1)) * 100}%` }}
                              ></div>
                           </div>
                        </div>
                     ))}
                  </div>
                  <div className="pt-8 border-t border-gray-50 flex justify-between items-center">
                     <div className="flex items-center gap-2 text-[10px] text-orange-500 font-black uppercase tracking-widest">
                        <AlertCircle size={14} /> Borradores activos: {stats.activeCreations}
                     </div>
                     <p className="text-[10px] text-emerald-500 font-black uppercase tracking-widest flex items-center gap-2">
                        <CheckCircle2 size={14}/> Sincronizado con Supabase
                     </p>
                  </div>
               </section>

               <section className="bg-white p-10 rounded-[3.5rem] border border-gray-100 shadow-sm flex flex-col justify-center items-center text-center space-y-6">
                  <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/10">
                     <TrendingUp size={40} />
                  </div>
                  <div className="space-y-2">
                     <h4 className="text-2xl font-black font-outfit">Siguiente Paso</h4>
                     <p className="text-sm text-gray-400 font-medium">Revisa el seguimiento maestro para contactar a los usuarios que dejaron diseños a medias.</p>
                  </div>
                  <button onClick={() => setActiveTab('seguimiento')} className="w-full py-4 bg-[#1A1A1A] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest">AUDITAR AHORA</button>
               </section>
            </div>
          </>
        )}

        {/* --- VISTA: SEGUIMIENTO MAESTRO (LA TABLA CORE) --- */}
        {activeTab === 'seguimiento' && (
          <section className="bg-white p-10 md:p-14 rounded-[4rem] border border-gray-100 shadow-xl space-y-12">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-8">
              <div>
                <h2 className="text-4xl font-black font-outfit tracking-tight">Seguimiento Maestro</h2>
                <p className="text-gray-400 text-sm mt-1 italic">Cada fila representa a un usuario y su historia sonora.</p>
              </div>
              <div className="relative group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#FF6B00] transition-colors" size={20} />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por email..." 
                  className="pl-14 pr-8 py-5 bg-gray-50/50 rounded-3xl text-sm border-2 border-transparent focus:border-[#FF6B00]/20 focus:bg-white w-full md:w-[400px] outline-none transition-all shadow-sm font-bold" 
                />
              </div>
            </header>

            <div className="overflow-x-auto -mx-10 md:-mx-14 px-10 md:px-14">
               <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-50 text-[11px] font-black uppercase tracking-[0.2em] text-gray-300">
                      <th className="pb-8 px-6 text-center">Identidad</th>
                      <th className="pb-8 px-6 text-center">Estado Embudo</th>
                      <th className="pb-8 px-6">Producciones / Historia Musical</th>
                      <th className="pb-8 px-6 text-right">Desde</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-sm">
                    {filteredData.length > 0 ? filteredData.map((client) => (
                      <tr key={client.id} className="hover:bg-[#FFFBF7] transition-all group">
                        <td className="py-10 px-6">
                           <div className="flex flex-col gap-1 items-center">
                              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-[#FF6B00] font-black text-xl shadow-md border border-gray-50">{client.email?.[0].toUpperCase()}</div>
                              <p className="font-black font-outfit mt-2">{client.email}</p>
                              <p className="text-[10px] text-gray-300 font-bold uppercase tracking-tighter">ID: {client.id.slice(0,8)}</p>
                           </div>
                        </td>
                        <td className="py-10 px-6">
                           <div className="flex justify-center">
                              <span className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap shadow-sm border border-white ${client.statusColor}`}>
                                {client.funnelStatus}
                              </span>
                           </div>
                        </td>
                        <td className="py-10 px-6 min-w-[400px]">
                           <div className="space-y-4">
                              {client.songs.length > 0 ? client.songs.map((song: any) => (
                                <div key={song.id} className="p-6 bg-white border border-gray-100 rounded-[2rem] shadow-sm hover:shadow-md transition-all flex items-center justify-between gap-6 group/song">
                                   <div className="flex items-center gap-4 flex-1">
                                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-inner ${song.status === 'complete' ? 'bg-pink-50 text-pink-500' : 'bg-gray-50 text-gray-300'}`}>
                                         <Music size={18} />
                                      </div>
                                      <div>
                                         <p className="font-black text-xs font-outfit truncate max-w-[200px]">{song.title || 'Sin Título'}</p>
                                         <p className="text-[9px] text-gray-300 font-bold uppercase tracking-widest">{song.status}</p>
                                      </div>
                                   </div>
                                   <div className="flex gap-2">
                                      {song.audio_url ? (
                                        <>
                                          <button 
                                            onClick={() => window.open(song.audio_url, '_blank')}
                                            className="w-10 h-10 bg-[#1A1A1A] text-white rounded-xl flex items-center justify-center hover:bg-emerald-500 transition-all shadow-lg"
                                          >
                                            <Play size={14} fill="currentColor" />
                                          </button>
                                          <a 
                                            href={song.audio_url} 
                                            download 
                                            className="w-10 h-10 bg-gray-50 text-gray-400 rounded-xl flex items-center justify-center hover:bg-[#FF6B00] hover:text-white transition-all border border-transparent"
                                          >
                                            <Download size={14} />
                                          </a>
                                        </>
                                      ) : (
                                        <div className="text-[9px] font-black text-gray-300 uppercase italic">Sin audio</div>
                                      )}
                                      <button className="w-10 h-10 bg-white border border-gray-100 text-gray-300 rounded-xl flex items-center justify-center hover:text-[#FF6B00] transition-all">
                                         <Eye size={14} />
                                      </button>
                                   </div>
                                </div>
                              )) : (
                                <div className="text-[10px] text-gray-300 font-bold uppercase tracking-widest italic flex items-center gap-2">
                                   <Database size={14} /> El usuario aún no ha iniciado un diseño
                                </div>
                              )}
                           </div>
                        </td>
                        <td className="py-10 px-6 text-right">
                           <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">{new Date(client.created_at).toLocaleDateString('es-MX')}</p>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={4} className="py-20 text-center">
                           <div className="flex flex-col items-center gap-4 text-gray-200">
                              <Search size={64} />
                              <p className="text-sm font-black uppercase tracking-widest">No se encontraron resultados para "{searchQuery}"</p>
                           </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
               </table>
            </div>
          </section>
        )}

      </main>

      <footer className="py-10 text-center">
         <p className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-200 font-outfit">
           MN Admin Studio • Master Tracking Pro v2.0
         </p>
      </footer>
    </div>
  );
}
