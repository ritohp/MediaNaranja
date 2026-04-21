import { useState, useEffect } from 'react';
import { 
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
  const [stats, setStats] = useState({
    totalUsers: 142,
    totalSongs: 56,
    conversionRate: 12.5,
    revenue: 2840,
    activeCreations: 8
  });

  const [activeTab, setActiveTab] = useState('overview');

  const funnelSteps = [
    { label: 'Visitas Landing', value: 1200, color: 'bg-blue-500' },
    { label: 'Click Crear Canción', value: 450, color: 'bg-emerald-500' },
    { label: 'Completó Diseño', value: 180, color: 'bg-orange-500' },
    { label: 'Pago Exitoso', value: 56, color: 'bg-pink-500' }
  ];

  const recentUsers = [
    { id: 1, name: 'Valentina', status: 'Diseñando', progress: 60, lastActive: 'Hace 5 min' },
    { id: 2, name: 'Alejandro', status: 'Pagado', progress: 100, lastActive: 'Hace 12 min' },
    { id: 3, name: 'María José', status: 'Visitante', progress: 10, lastActive: 'Hace 1 hr' },
    { id: 4, name: 'Roberto F.', status: 'Carrito Abandonado', progress: 90, lastActive: 'Hace 3 hr' }
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans pb-20">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&display=swap');
        .font-outfit { font-family: 'Outfit', sans-serif; }
      `}</style>
      
      {/* SIDEBAR MOCKUP (TOP NAVBAR FOR NOW) */}
      <nav className="bg-white border-b border-gray-200 px-8 py-5 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-8">
          <div className="text-2xl font-black tracking-tighter text-[#FF6B00]">MN<span className="text-[#FF2D55]">ADMIN</span></div>
          <div className="hidden md:flex items-center gap-6">
             <button className="text-sm font-bold border-b-2 border-[#FF6B00] pb-1">Dashboard</button>
             <button className="text-sm font-bold text-gray-400 hover:text-gray-600 transition-all">Usuarios</button>
             <button className="text-sm font-bold text-gray-400 hover:text-gray-600 transition-all">Canciones</button>
          </div>
        </div>
        <div className="flex items-center gap-4">
           <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-[#FF6B00]">
              <User size={20} />
           </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-10 space-y-10">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
           <div className="space-y-1">
              <h1 className="text-3xl font-black font-outfit">Control de Mando</h1>
              <p className="text-gray-400 text-sm">Monitorizando el pulso de Media Naranja en tiempo real.</p>
           </div>
           <div className="flex gap-3">
              <button className="px-5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-gray-50 transition-all shadow-sm">
                 <Filter size={16} /> Filtrar Fechas
              </button>
              <button className="px-5 py-2.5 bg-[#FF6B00] text-white rounded-xl text-sm font-black flex items-center gap-2 hover:bg-[#FF2D55] transition-all shadow-lg shadow-orange-500/20">
                 Actualizar Datos
              </button>
           </div>
        </header>

        {/* METRICS GRID */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
           {[
             { label: 'Usuarios Totales', value: stats.totalUsers, change: '+12%', up: true, icon: <Users className="text-blue-500" /> },
             { label: 'Canciones Creadas', value: stats.totalSongs, change: '+5%', up: true, icon: <Music className="text-pink-500" /> },
             { label: 'Ingresos (USD)', value: `$${stats.revenue}`, change: '+18%', up: true, icon: <DollarSign className="text-emerald-500" /> },
             { label: 'Conversión', value: `${stats.conversionRate}%`, change: '-2%', up: false, icon: <TrendingUp className="text-orange-500" /> }
           ].map((metric, i) => (
             <div key={i} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                   <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center">
                      {metric.icon}
                   </div>
                   <div className={`flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-full ${metric.up ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                      {metric.up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />} {metric.change}
                   </div>
                </div>
                <div>
                   <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{metric.label}</p>
                   <p className="text-3xl font-black font-outfit mt-1">{metric.value}</p>
                </div>
             </div>
           ))}
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           
           {/* FUNNEL DE VENTAS */}
           <section className="lg:col-span-2 bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-8">
              <div className="flex items-center justify-between">
                 <h3 className="text-xl font-black font-outfit flex items-center gap-3">
                    <BarChart3 className="text-[#FF6B00]" /> Embudo de Conversión
                 </h3>
                 <button className="text-xs font-bold text-gray-400 hover:text-[#FF6B00]">Ver detalles <ChevronRight size={14} className="inline"/></button>
              </div>

              <div className="space-y-6">
                 {funnelSteps.map((step, i) => (
                    <div key={i} className="space-y-2">
                       <div className="flex justify-between text-xs font-bold uppercase tracking-widest px-1">
                          <span>{step.label}</span>
                          <span>{step.value} pers.</span>
                       </div>
                       <div className="h-4 bg-gray-50 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${step.color} rounded-full`}
                            style={{ width: `${(step.value / funnelSteps[0].value) * 100}%` }}
                          ></div>
                       </div>
                    </div>
                 ))}
              </div>

              <div className="pt-6 border-t border-gray-50 grid grid-cols-2 gap-8">
                 <div className="space-y-1">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Abandonos totales</p>
                    <p className="text-2xl font-black text-red-500 font-outfit">842</p>
                 </div>
                 <div className="space-y-1">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Efficiency</p>
                    <p className="text-2xl font-black text-emerald-500 font-outfit">High</p>
                 </div>
              </div>
           </section>

           {/* LISTA DE USUARIOS ACTIVOS */}
           <section className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-8">
              <div className="flex items-center justify-between">
                 <h3 className="text-xl font-black font-outfit">Actividad Reciente</h3>
                 <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-[#FF6B00]">
                    <Clock size={16} className="animate-pulse" />
                 </div>
              </div>

              <div className="space-y-6">
                 {recentUsers.map((user) => (
                    <div key={user.id} className="flex items-center gap-4 group cursor-pointer">
                       <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center font-bold text-gray-400">
                          {user.name.charAt(0)}
                       </div>
                       <div className="flex-1 space-y-1">
                          <div className="flex justify-between">
                             <p className="text-sm font-bold hover:text-[#FF6B00] transition-all">{user.name}</p>
                             <span className="text-[10px] text-gray-300 font-bold">{user.lastActive}</span>
                          </div>
                          <div className="flex items-center gap-2">
                             <div className="flex-1 h-1 bg-gray-50 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full ${user.status === 'Pagado' ? 'bg-emerald-500' : 'bg-[#FF6B00]'}`} 
                                  style={{ width: `${user.progress}%` }}
                                ></div>
                             </div>
                             <span className="text-[9px] font-black uppercase text-gray-400">{user.status}</span>
                          </div>
                       </div>
                    </div>
                 ))}
              </div>

              <button className="w-full py-4 bg-gray-50 hover:bg-gray-100 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2">
                 Ver todo el tráfico <ChevronRight size={14}/>
              </button>
           </section>
        </div>

        {/* SECCION WHATSAPP / HERRAMIENTAS FUTURAS */}
        <section className="bg-brand-gradient p-1 bg-white rounded-3xl overflow-hidden shadow-2xl">
           <div className="bg-white p-10 rounded-[calc(1.5rem-1px)] grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
              <div className="space-y-6">
                 <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 rounded-full">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></div>
                    <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Próxima Integración</span>
                 </div>
                 <h2 className="text-4xl font-black font-outfit leading-tight leading-tight">Conecta tu estudio <br /> con <span className="text-emerald-500">WhatsApp Business</span></h2>
                 <p className="text-gray-400 text-sm">Pronto podrás enviar las canciones directamente, recuperar carritos abandonados y dar soporte VIP sin salir de este dashboard.</p>
                 <button className="px-8 py-4 bg-[#1A1A1A] text-white rounded-xl text-xs font-black uppercase tracking-widest">NOTIFICARME CUANDO ESTÉ LISTO</button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="p-6 bg-gray-50 rounded-2xl space-y-2">
                    <MessageSquare className="text-emerald-500" />
                    <p className="text-xs font-bold">Bots de Ventas</p>
                 </div>
                 <div className="p-6 bg-gray-50 rounded-2xl space-y-2 opacity-50">
                    <Layout className="text-blue-500" />
                    <p className="text-xs font-bold">Multi-dominio</p>
                 </div>
                 <div className="p-6 bg-gray-50 rounded-2xl space-y-2 opacity-50">
                    <ExternalLink className="text-orange-500" />
                    <p className="text-xs font-bold">Exportar CSV</p>
                 </div>
              </div>
           </div>
        </section>

      </main>
    </div>
  );
}
