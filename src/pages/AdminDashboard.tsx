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
  ExternalLink
} from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalSongs: 0,
    conversionRate: 0,
    revenue: 0,
    activeCreations: 0
  });

  const [recentUsers, setRecentUsers] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      // 1. Verificar Admin
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || user.email !== 'ritohp@gmail.com') {
        navigate('/');
        return;
      }
      setChecking(false);

      try {
        // 2. Traer Usuarios
        const { count: usersCount } = await supabase
          .from('mn_profiles')
          .select('*', { count: 'exact', head: true });

        // 3. Traer Canciones
        const { data: songs, count: songsCount } = await supabase
          .from('mn_songs')
          .select('*, user_id')
          .order('created_at', { ascending: false });

        // 4. Traer correos para la actividad reciente
        const { data: profiles } = await supabase
          .from('mn_profiles')
          .select('id, email');

        const profileMap = profiles?.reduce((acc: any, p: any) => {
          acc[p.id] = p.email;
          return acc;
        }, {});

        // 5. Procesar Actividad Reciente
        const processedActivity = songs?.slice(0, 5).map((song: any) => ({
          id: song.id,
          name: profileMap?.[song.user_id]?.split('@')[0] || 'Anónimo',
          email: profileMap?.[song.user_id] || 'N/A',
          status: song.status === 'complete' ? 'Pagado' : 'Diseñando',
          progress: song.status === 'complete' ? 100 : 45,
          lastActive: new Date(song.created_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
        })) || [];

        setRecentUsers(processedActivity);

        // 6. Calcular Estadísticas
        const finalUsers = usersCount || 0;
        const finalSongs = songsCount || 0;
        const conv = finalUsers > 0 ? (finalSongs / finalUsers) * 100 : 0;
        
        setStats({
          totalUsers: finalUsers,
          totalSongs: finalSongs,
          conversionRate: parseFloat(conv.toFixed(1)),
          revenue: finalSongs * 49, // Estimado $49 USD
          activeCreations: songs?.filter(s => s.status !== 'complete').length || 0
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
           <p className="text-xs font-black text-gray-400 uppercase tracking-[0.3em] animate-pulse italic">Media Naranja Studio • Cargando Datos</p>
        </div>
      </div>
    );
  }

  const funnelSteps = [
    { label: 'Visitas Boutique (Est.)', value: stats.totalUsers * 8, color: 'bg-blue-400' },
    { label: 'Usuarios Registrados', value: stats.totalUsers, color: 'bg-emerald-400' },
    { label: 'Diseños Iniciados', value: stats.totalSongs, color: 'bg-orange-400' },
    { label: 'Producciones Finalizadas', value: stats.totalSongs - stats.activeCreations, color: 'bg-pink-400' }
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans pb-20">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&display=swap');
        .font-outfit { font-family: 'Outfit', sans-serif; }
      `}</style>
      
      {/* SIDEBAR MOCKUP (TOP NAVBAR) */}
      <nav className="bg-white border-b border-gray-100 px-8 py-5 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-8">
          <div className="text-2xl font-black tracking-tighter text-[#FF6B00] font-outfit">MN<span className="text-[#FF2D55]">ADMIN</span></div>
          <div className="hidden md:flex items-center gap-8">
             <button className="text-[10px] font-black uppercase tracking-widest border-b-2 border-[#FF6B00] pb-1">Dashboard</button>
             <button className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-600 transition-all">Clientes</button>
             <button className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-600 transition-all">Producciones</button>
          </div>
        </div>
        <div className="flex items-center gap-4">
           <div className="hidden sm:block text-right">
              <p className="text-[9px] font-black uppercase text-gray-300">Administrator</p>
              <p className="text-xs font-bold font-outfit">ritohp@gmail.com</p>
           </div>
           <div className="w-10 h-10 bg-brand-gradient text-white rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20">
              <User size={18} />
           </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-10 space-y-10">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
           <div className="space-y-1">
              <h1 className="text-4xl font-black font-outfit tracking-tight">Control de Mando</h1>
              <p className="text-gray-400 text-sm italic">Datos de la boutique sincronizados en tiempo real.</p>
           </div>
           <div className="flex gap-3">
              <div className="px-5 py-3 bg-white border border-gray-100 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-sm">
                 <Clock size={14} className="text-orange-500" /> {new Date().toLocaleDateString('es-MX')}
              </div>
              <button 
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-[#1A1A1A] text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-[#FF6B00] transition-all shadow-xl"
              >
                 Recargar
              </button>
           </div>
        </header>

        {/* METRICS GRID */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
           {[
             { label: 'Usuarios Reales', value: stats.totalUsers, status: 'Total', icon: <Users className="text-blue-500" /> },
             { label: 'Historias Iniciadas', value: stats.totalSongs, status: 'Vivas', icon: <Music className="text-pink-500" /> },
             { label: 'Ingresos Est. (USD)', value: `$${stats.revenue}`, status: 'Boutique', icon: <DollarSign className="text-emerald-500" /> },
             { label: 'Tasa Conversión', value: `${stats.conversionRate}%`, status: 'Embudo', icon: <TrendingUp className="text-orange-500" /> }
           ].map((metric, i) => (
             <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-5 hover:translate-y-[-5px] transition-transform">
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
           
           {/* FUNNEL DE VENTAS REAL */}
           <section className="lg:col-span-2 bg-white p-12 rounded-[3rem] border border-gray-100 shadow-sm space-y-10">
              <h3 className="text-xl font-black font-outfit flex items-center gap-3">
                 <BarChart3 className="text-[#FF6B00]" /> Eficiencia de Producción
              </h3>

              <div className="space-y-8">
                 {funnelSteps.map((step, i) => (
                    <div key={i} className="space-y-3">
                       <div className="flex justify-between text-[10px] font-black uppercase tracking-widest px-1">
                          <span className="text-gray-400">{step.label}</span>
                          <span className="text-gray-900">{step.value}</span>
                       </div>
                       <div className="h-3 bg-gray-50 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${step.color} rounded-full transition-all duration-1000 shadow-sm`}
                            style={{ width: `${(step.value / (funnelSteps[0].value || 1)) * 100}%` }}
                          ></div>
                       </div>
                    </div>
                 ))}
              </div>

              <div className="pt-8 border-t border-gray-50 grid grid-cols-2 gap-8">
                 <div className="space-y-1">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Borradores en curso</p>
                    <p className="text-2xl font-black text-orange-500 font-outfit">{stats.activeCreations}</p>
                 </div>
                 <div className="space-y-1 text-right">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Estado Boutique</p>
                    <p className="text-2xl font-black text-emerald-500 font-outfit">Sincronizado</p>
                 </div>
              </div>
           </section>

           {/* ACTIVIDAD RECIENTE REAL */}
           <section className="bg-white p-12 rounded-[3rem] border border-gray-100 shadow-sm space-y-10">
              <div className="flex items-center justify-between">
                 <h3 className="text-xl font-black font-outfit">Actividad Real</h3>
                 <div className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center text-[#FF6B00]">
                    <Clock size={16} className="animate-pulse" />
                 </div>
              </div>

              <div className="space-y-8">
                 {recentUsers.length > 0 ? recentUsers.map((user) => (
                    <div key={user.id} className="flex items-center gap-4 group cursor-pointer border-b border-gray-50 pb-4 last:border-0 last:pb-0">
                       <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center font-black text-gray-300 text-lg uppercase shadow-inner">
                          {user.name.charAt(0)}
                       </div>
                       <div className="flex-1 space-y-1">
                          <div className="flex justify-between">
                             <p className="text-sm font-black font-outfit">{user.name}</p>
                             <span className="text-[9px] text-[#FF6B00] font-black uppercase">{user.lastActive}</span>
                          </div>
                          <div className="flex items-center gap-3">
                             <div className="flex-1 h-1 bg-gray-50 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full ${user.status === 'Pagado' ? 'bg-emerald-500' : 'bg-[#FF6B00]'}`} 
                                  style={{ width: `${user.progress}%` }}
                                ></div>
                             </div>
                             <span className="text-[8px] font-black uppercase text-gray-400 tracking-tighter">{user.status}</span>
                          </div>
                       </div>
                    </div>
                 )) : (
                    <div className="text-center py-10 space-y-3">
                       <Search className="mx-auto text-gray-100" size={48} />
                       <p className="text-xs font-bold text-gray-300 uppercase tracking-widest">Sin actividad hoy</p>
                    </div>
                 )}
              </div>

              <button className="w-full py-5 bg-gray-50 hover:bg-[#1A1A1A] hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 group">
                 AUDITAR TODO EL TRÁFICO <ArrowRight size={14} className="group-hover:translate-x-2 transition-transform"/>
              </button>
           </section>
        </div>

        {/* PROYECCIÓN WHATSAPP */}
        <section className="bg-brand-gradient p-1 bg-white rounded-[3rem] overflow-hidden shadow-2xl">
           <div className="bg-white p-12 rounded-[calc(3rem-1px)] grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
              <div className="space-y-8">
                 <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-50 rounded-full">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></div>
                    <span className="text-[9px] font-black text-emerald-600 uppercase tracking-[0.2em]">Ready to connect</span>
                 </div>
                 <h2 className="text-4xl font-black font-outfit leading-tight tracking-tight">Ventas por <span className="text-emerald-500">WhatsApp Business</span></h2>
                 <p className="text-gray-400 text-sm leading-relaxed">Estamos a un paso de integrar tu CRM. Pronto recibirás notificaciones en tu celular cada vez que una historia se convierta en canción.</p>
                 <button className="px-8 py-5 bg-[#1A1A1A] text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.3em] hover:scale-105 transition-all">SABER MÁS</button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 {[
                   { icon: <MessageSquare />, label: 'Chat Sales', color: 'text-emerald-500' },
                   { icon: <Layout />, label: 'Analytics', color: 'text-blue-500' },
                   { icon: <Music />, label: 'Automate', color: 'text-pink-500' },
                   { icon: <Search />, label: 'Tracking', color: 'text-orange-500' }
                 ].map((item, i) => (
                   <div key={i} className="p-8 bg-gray-50 rounded-[2.5rem] space-y-3 border border-transparent hover:border-gray-200 transition-all">
                      <div className={item.color}>{item.icon}</div>
                      <p className="text-[10px] font-black uppercase tracking-widest">{item.label}</p>
                   </div>
                 ))}
              </div>
           </div>
        </section>

      </main>
    </div>
  );
}

function ArrowRight({ size, className }: { size: number, className?: string }) {
  return <ChevronRight size={size} className={className} />;
}
