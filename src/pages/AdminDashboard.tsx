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
  FileText
} from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('panel'); // 'panel', 'clientes', 'producciones'
  
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalSongs: 0,
    conversionRate: 0,
    revenue: 0,
    activeCreations: 0
  });

  const [allSongs, setAllSongs] = useState<any[]>([]);
  const [allProfiles, setAllProfiles] = useState<any[]>([]);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || user.email !== 'ritohp@gmail.com') {
        navigate('/');
        return;
      }
      setChecking(false);

      try {
        // 1. Traer Perfiles
        const { data: profiles } = await supabase.from('mn_profiles').select('*').order('created_at', { ascending: false });
        
        // 2. Traer Canciones
        const { data: songs } = await supabase.from('mn_songs').select('*').order('created_at', { ascending: false });

        setAllProfiles(profiles || []);
        setAllSongs(songs || []);

        const profileMap = profiles?.reduce((acc: any, p: any) => {
          acc[p.id] = p.email;
          return acc;
        }, {});

        // 3. Procesar Actividad Reciente (basado en canciones)
        const processedActivity = songs?.slice(0, 5).map((song: any) => ({
          id: song.id,
          name: profileMap?.[song.user_id]?.split('@')[0] || 'Anónimo',
          email: profileMap?.[song.user_id] || 'N/A',
          status: song.status === 'complete' ? 'Pagado' : 'Diseñando',
          progress: song.status === 'complete' ? 100 : 45,
          lastActive: new Date(song.created_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
        })) || [];

        setRecentUsers(processedActivity);

        // 4. Calcular Estadísticas (usamos el length del array para ser precisos)
        const totalU = profiles?.length || 0;
        const totalS = songs?.length || 0;
        const active = songs?.filter(s => s.status !== 'complete').length || 0;
        const conv = totalU > 0 ? (totalS / totalU) * 100 : 0;
        
        setStats({
          totalUsers: totalU,
          totalSongs: totalS,
          conversionRate: parseFloat(conv.toFixed(1)),
          revenue: (totalS - active) * 49,
          activeCreations: active
        });

      } catch (error) {
        console.error("Error fetching admin stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  if (checking || loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
           <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FF6B00]"></div>
           <p className="text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Sincronizando Boutique de Media Naranja...</p>
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
               Panel
             </button>
             <button 
               onClick={() => setActiveTab('clientes')}
               className={`text-[10px] font-black uppercase tracking-widest pb-1 transition-all ${activeTab === 'clientes' ? 'border-b-2 border-[#FF6B00]' : 'text-gray-400 hover:text-gray-600'}`}
             >
               Clientes
             </button>
             <button 
               onClick={() => setActiveTab('producciones')}
               className={`text-[10px] font-black uppercase tracking-widest pb-1 transition-all ${activeTab === 'producciones' ? 'border-b-2 border-[#FF6B00]' : 'text-gray-400 hover:text-gray-600'}`}
             >
               Producciones
             </button>
          </div>
        </div>
        <div className="flex items-center gap-4">
           <div className="hidden sm:block text-right">
              <p className="text-[9px] font-black uppercase text-gray-300">Administrator</p>
              <p className="text-xs font-bold font-outfit">ritohp@gmail.com</p>
           </div>
           <div className="w-10 h-10 bg-brand-gradient text-white rounded-2xl flex items-center justify-center shadow-lg">
              <User size={18} />
           </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-10 space-y-10 focus:outline-none">
        
        {/* --- VISTA: PANEL (PRINCIPAL) --- */}
        {activeTab === 'panel' && (
          <>
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-1">
                 <h1 className="text-4xl font-black font-outfit tracking-tight">Control de Mando</h1>
                 <p className="text-gray-400 text-sm italic">Datos de la boutique sincronizados en tiempo real.</p>
              </div>
              <button 
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-[#1A1A1A] text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-[#FF6B00] transition-all shadow-xl"
              >
                 Recargar Datos
              </button>
            </header>

            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
               {[
                 { label: 'Usuarios Reales', value: stats.totalUsers, status: 'Total', icon: <Users className="text-blue-500" /> },
                 { label: 'Historias Iniciadas', value: stats.totalSongs, status: 'Vivas', icon: <Music className="text-pink-500" /> },
                 { label: 'Ingresos Est. (USD)', value: `$${stats.revenue}`, status: 'Boutique', icon: <DollarSign className="text-emerald-500" /> },
                 { label: 'Tasa Conversión', value: `${stats.conversionRate}%`, status: 'Embudo', icon: <TrendingUp className="text-orange-500" /> }
               ].map((metric, i) => (
                 <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-5">
                    <div className="flex items-center justify-between">
                       <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center">
                          {metric.icon}
                       </div>
                       <div className="text-[9px] font-black px-3 py-1 rounded-full bg-orange-50 text-[#FF6B00] uppercase tracking-widest">
                          {metric.status}
                       </div>
                    </div>
                    <div>
                       <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em]">{metric.label}</p>
                       <p className="text-4xl font-black font-outfit mt-1">{metric.value}</p>
                    </div>
                 </div>
               ))}
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
               <section className="lg:col-span-2 bg-white p-12 rounded-[3rem] border border-gray-100 shadow-sm space-y-10">
                  <h3 className="text-xl font-black font-outfit flex items-center gap-3">
                     <BarChart3 className="text-[#FF6B00]" /> Eficiencia de Producción
                  </h3>
                  <div className="space-y-8">
                     {[
                       { label: 'Usuarios Registrados', value: stats.totalUsers, color: 'bg-emerald-400' },
                       { label: 'Diseños Iniciados', value: stats.totalSongs, color: 'bg-orange-400' },
                       { label: 'Producciones Finalizadas', value: stats.totalSongs - stats.activeCreations, color: 'bg-pink-400' }
                     ].map((step, i) => (
                        <div key={i} className="space-y-3">
                           <div className="flex justify-between text-[10px] font-black uppercase tracking-widest px-1">
                              <span className="text-gray-400">{step.label}</span>
                              <span className="text-gray-900">{step.value}</span>
                           </div>
                           <div className="h-3 bg-gray-50 rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${step.color} rounded-full transition-all duration-1000`}
                                style={{ width: `${(step.value / (stats.totalUsers || 1)) * 100}%` }}
                              ></div>
                           </div>
                        </div>
                     ))}
                  </div>
                  <div className="pt-8 border-t border-gray-50 flex justify-between">
                     <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Borradores en curso: <span className="text-orange-500 font-black">{stats.activeCreations}</span></p>
                     <p className="text-[10px] text-emerald-500 font-black uppercase tracking-widest">Sincronizado</p>
                  </div>
               </section>

               <section className="bg-white p-12 rounded-[3rem] border border-gray-100 shadow-sm space-y-10">
                  <h3 className="text-xl font-black font-outfit">Actividad Real</h3>
                  <div className="space-y-8">
                     {recentUsers.map((user) => (
                        <div key={user.id} className="flex items-center gap-4 border-b border-gray-50 pb-4 last:border-0 last:pb-0">
                           <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center font-black text-gray-300 text-sm uppercase">
                              {user.name.charAt(0)}
                           </div>
                           <div className="flex-1 space-y-1">
                              <div className="flex justify-between">
                                 <p className="text-xs font-black font-outfit truncate max-w-[100px]">{user.name}</p>
                                 <span className="text-[9px] text-[#FF6B00] font-black uppercase">{user.lastActive}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                 <div className="flex-1 h-1 bg-gray-50 rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full ${user.status === 'Pagado' ? 'bg-emerald-500' : 'bg-[#FF6B00]'}`} style={{ width: `${user.progress}%` }}></div>
                                 </div>
                              </div>
                           </div>
                        </div>
                     ))}
                  </div>
               </section>
            </div>
          </>
        )}

        {/* --- VISTA: CLIENTES --- */}
        {activeTab === 'clientes' && (
          <section className="bg-white p-12 rounded-[3rem] border border-gray-100 shadow-sm space-y-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-3xl font-black font-outfit">Directorio de Clientes</h2>
                <p className="text-gray-400 text-xs italic">Total: {allProfiles.length} usuarios registrados</p>
              </div>
              <div className="flex gap-4">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                  <input type="text" placeholder="Buscar por email..." className="pl-12 pr-6 py-3 bg-gray-50 rounded-xl text-sm border-none focus:ring-2 focus:ring-orange-100 w-64" />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
               <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-50 text-[10px] font-black uppercase tracking-widest text-gray-400">
                      <th className="pb-6 px-4">Usuario</th>
                      <th className="pb-6 px-4 text-center">Tokens</th>
                      <th className="pb-6 px-4 text-center">Desde</th>
                      <th className="pb-6 px-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {allProfiles.map((profile) => (
                      <tr key={profile.id} className="hover:bg-gray-50 transition-all group">
                        <td className="py-6 px-4">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-[#FF6B00] font-black">{profile.email?.[0].toUpperCase()}</div>
                            <p className="font-bold text-sm">{profile.email}</p>
                          </div>
                        </td>
                        <td className="py-6 px-4 text-center">
                          <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase">{profile.tokens_balance} Créditos</span>
                        </td>
                        <td className="py-6 px-4 text-center text-xs text-gray-400">
                          {new Date(profile.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-6 px-4 text-right">
                          <button className="p-2 text-gray-300 hover:text-[#FF6B00] transition-all"><MessageSquare size={18} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
               </table>
            </div>
          </section>
        )}

        {/* --- VISTA: PRODUCCIONES --- */}
        {activeTab === 'producciones' && (
          <section className="bg-white p-12 rounded-[3rem] border border-gray-100 shadow-sm space-y-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-3xl font-black font-outfit">Producciones Musicales</h2>
                <p className="text-gray-400 text-xs italic">Total: {allSongs.length} canciones en base de datos</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allSongs.map((song) => (
                <div key={song.id} className="p-8 bg-gray-50/50 border border-gray-100 rounded-[2rem] space-y-6 hover:shadow-xl transition-all">
                  <div className="flex justify-between items-start">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-pink-500"><Music size={24}/></div>
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${song.status === 'complete' ? 'bg-emerald-100 text-emerald-600' : 'bg-orange-100 text-orange-600'}`}>
                      {song.status === 'complete' ? 'Producción Finalizada' : 'En Diseño (Borrador)'}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-xl font-black font-outfit truncate">{song.title || 'Canción sin título'}</h4>
                    <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest mt-1">ID: {song.id.slice(0,8)}...</p>
                  </div>
                  <div className="p-4 bg-white rounded-2xl h-32 overflow-hidden relative">
                    <p className="text-[10px] text-gray-400 leading-relaxed italic line-clamp-4">{song.lyrics || 'Sin letra registrada aún.'}</p>
                    <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-white to-transparent"></div>
                  </div>
                  <div className="flex gap-4">
                    <button className="flex-1 py-3 bg-[#1A1A1A] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#FF6B00] transition-all">Ver Letra</button>
                    {song.audio_url && <button className="p-3 bg-white border border-gray-100 rounded-xl text-[#FF2D55] hover:scale-110 transition-all"><Play size={18} fill="currentColor" /></button>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

      </main>
    </div>
  );
}
