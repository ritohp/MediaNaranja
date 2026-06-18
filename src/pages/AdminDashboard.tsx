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
  RotateCcw,
  Mail,
  Key,
  Feather
} from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('panel'); // panel, seguimiento, recientes, marketing
  const [searchQuery, setSearchQuery] = useState('');
  const [sessionSearch, setSessionSearch] = useState('');
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [xrayData, setXrayData] = useState<any | null>(null);
  
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalSongs: 0,
    conversionRate: 0,
    revenue: 0,
    activeCreations: 0,
    uniqueVisitors: 0,
    pageViews: 0
  });

  const [masterData, setMasterData] = useState<any[]>([]);
  const [analyticsData, setAnalyticsData] = useState<any[]>([]);

  const fetchData = async () => {
    try {
      const { data: profiles } = await supabase.rpc('get_admin_profiles_v2');
      const { data: songs } = await supabase.from('mn_songs').select('*').order('created_at', { ascending: false });

      const unified = (profiles || []).map((profile: any) => {
        const userSongs = (songs || []).filter(s => s.user_id === profile.id);
        
        let funnelStatus = profile.email_confirmed ? '🔖 Registro' : '📩 SIN CONFIRMAR';
        let statusColor = profile.email_confirmed ? 'bg-gray-100 text-gray-500' : 'bg-red-50 text-red-500 border border-red-100';
        
        if (userSongs.some(s => s.status === 'completed')) {
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
      const activeS = (songs || []).filter(s => s.status !== 'completed').length || 0;
      
      const { data: payments } = await supabase.from('mn_payments').select('*');
      const realRevenue = (payments || []).filter(p => p.status === 'completed').reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

      // Analytics Fetching
      const { data: analytics } = await supabase.from('mn_analytics').select('*');
      setAnalyticsData(analytics || []);
      const uniqueVisitors = new Set((analytics || []).map(a => a.visitor_id)).size;
      const pageViews = (analytics || []).filter(a => a.event_type === 'pageview').length;
      
      // Nueva métrica de conversión más realista: (Registrados / Visitantes Únicos)
      const conv = uniqueVisitors > 0 ? (totalU / uniqueVisitors) * 100 : 0;

      setStats({
        totalUsers: totalU,
        totalSongs: totalS,
        conversionRate: parseFloat(conv.toFixed(1)),
        revenue: realRevenue,
        activeCreations: activeS,
        uniqueVisitors,
        pageViews
      });

    } catch (error) {
      console.error("Critical Admin Sync Error:", error);
    }
  };

  useEffect(() => {
    let intervalId: any;
    const checkAdmin = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user || session.user.email !== 'ritohp@gmail.com') {
          navigate('/');
          return;
        }
        setChecking(false);
        await fetchData();

        // Configurar actualización automática en tiempo real cada 10 segundos
        intervalId = setInterval(() => {
          fetchData();
        }, 10000);
      } catch (err) {
        console.error("Auth check failed:", err);
      } finally {
        setLoading(false);
      }
    };
    checkAdmin();

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
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

  const handleRefundToken = async (userId: string, currentBalance: number) => {
    if (isProcessing) return;
    setIsProcessing(`refund-${userId}`);
    try {
      const { error } = await supabase
        .from('mn_profiles')
        .update({ tokens_balance: currentBalance + 1 })
        .eq('id', userId);
      if (!error) {
        alert("1 crédito devuelto exitosamente.");
        await fetchData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(null);
    }
  };

  const handleTogglePaid = async (songId: string, currentPaidStatus: boolean) => {
    if (isProcessing) return;
    setIsProcessing(`paid-${songId}`);
    try {
      const { error } = await supabase
        .from('mn_songs')
        .update({ is_paid: !currentPaidStatus })
        .eq('id', songId);
      if (!error) {
        alert(!currentPaidStatus ? "Canción liberada (PAGADA)." : "Canción devuelta a modo DEMO.");
        await fetchData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(null);
    }
  };

  const handleResetSongStatus = async (songId: string) => {
    if (isProcessing) return;
    setIsProcessing(songId);
    if (!confirm("¿Seguro que quieres borrar el audio y letra, y regresar la canción a modo Borrador?")) {
      setIsProcessing(null);
      return;
    }
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

  const handleResetToLyrics = async (songId: string) => {
    if (!confirm('¿Estás seguro de regresar esta canción a Letra? Esto borrará el audio generado y permitirá al usuario volver a intentar desde la fase de Generación de Música.')) return;
    try {
      setIsProcessing(`lyrics-${songId}`);
      // Borramos audio y video, seteamos status a lyrics_ready
      const { error } = await supabase.from('mn_songs').update({ 
        status: 'lyrics_ready',
        audio_url: null,
        demo_url: null
      }).eq('id', songId);
      
      if (error) throw error;
      fetchData();
    } catch (e) {
      console.error(e);
      alert('Error al regresar a letra.');
    } finally {
      setIsProcessing(null);
    }
  };

  const handleRegenerateLegacy = async (song: any) => {
    if (!confirm('¿Estás seguro de regenerar SOLO el legado web/PDF con la IA? Esto usará el prompt actualizado de nombres y no afectará el audio ni los créditos.')) return;
    try {
      setIsProcessing(`legacy-${song.id}`);
      const { generateInfographicData } = await import('../services/ai');
      
      let recipientName = song.form_data?.recipientName || song.form_data?.nombreDestinatario || song.form_data?.childName || "Homenajeado";
      if (!recipientName.includes(' ')) {
        const newName = window.prompt(`El nombre actual es "${recipientName}". Para que la IA funcione correctamente, necesita Apellidos. Ingresa el nombre completo:`, recipientName);
        if (!newName || !newName.trim() || !newName.includes(' ')) {
          alert('Debes ingresar al menos un nombre y un apellido separados por espacio.');
          setIsProcessing(null);
          return;
        }
        recipientName = newName.trim();
      }

      const storyParts = [
        song.form_data?.initialContext,
        song.form_data?.specificDetails,
        song.form_data?.familyNames ? `Familiares: ${song.form_data.familyNames}` : null,
        song.form_data?.interviewAnswers ? JSON.stringify(song.form_data.interviewAnswers) : null
      ].filter(Boolean);
      const story = storyParts.join(". ");

      const answers = song.form_data?.tributeAnswers || [];
      const archetype = song.form_data?.archetype || song.form_data?.category?.toUpperCase() || "LEGACY";
      
      const infoData = await generateInfographicData(
        story, 
        answers, 
        recipientName, 
        archetype, 
        "legacy"
      );
      
      if (!infoData) throw new Error("No se pudo generar");

      const newFormData = { ...song.form_data, infographic_data: infoData };
      const { error } = await supabase.from('mn_songs').update({ form_data: newFormData }).eq('id', song.id);
      
      if (error) throw error;
      alert('Legado regenerado con éxito.');
      fetchData();
    } catch (e) {
      console.error(e);
      alert('Hubo un error al regenerar el legado.');
    } finally {
      setIsProcessing(null);
    }
  };

  const handleResendConfirmation = async (email: string) => {
    if (isProcessing) return;
    setIsProcessing(`email-${email}`);
    try {
      const { error } = await supabase.auth.resend({ type: 'signup', email });
      if (error) alert("Error: " + error.message);
      else alert("Correo de confirmación reenviado a " + email);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(null);
    }
  };

  const handleSendPasswordReset = async (email: string) => {
    if (isProcessing) return;
    setIsProcessing(`pwd-${email}`);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) alert("Error: " + error.message);
      else alert("Enlace de recuperación enviado a " + email);
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

  const getSessionsTimeline = () => {
    if (!analyticsData || analyticsData.length === 0) return [];

    // Agrupar por session_id
    const groups: Record<string, any[]> = {};
    analyticsData.forEach(ev => {
      if (!ev.session_id) return;
      if (!groups[ev.session_id]) groups[ev.session_id] = [];
      groups[ev.session_id].push(ev);
    });

    // Crear lista de sesiones
    const sessions = Object.entries(groups).map(([sessionId, events]) => {
      // Ordenar eventos de la sesión cronológicamente ascendente
      const sortedEvents = [...events].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      
      const firstEvent = sortedEvents[0];
      const lastEvent = sortedEvents[sortedEvents.length - 1];
      const startTime = new Date(firstEvent.created_at).getTime();
      const endTime = new Date(lastEvent.created_at).getTime();
      const durationSecs = Math.floor((endTime - startTime) / 1000);

      // Buscar si hay email asociado en los eventos
      let email = null;
      for (const ev of sortedEvents) {
        if (ev.event_details?.email) {
          email = ev.event_details.email;
          break;
        }
      }

      // Origen de tráfico
      let source = 'Directo / Anuncio';
      const pathWithSearch = firstEvent.path || '';
      if (pathWithSearch.includes('flow=papa') || pathWithSearch.includes('c=papa')) {
        source = 'Campaña Papá (Facebook Ads)';
      } else if (firstEvent.referrer && firstEvent.referrer !== 'Direct') {
        if (firstEvent.referrer.toLowerCase().includes('facebook') || firstEvent.referrer.toLowerCase().includes('fb.com')) {
          source = 'Facebook Referrer';
        } else {
          try {
            source = new URL(firstEvent.referrer).hostname;
          } catch (e) {
            source = String(firstEvent.referrer).substring(0, 30);
          }
        }
      }

      // Dispositivo
      const device = `${firstEvent.device_type || 'Desconocido'} (${firstEvent.os || 'OS'} - ${firstEvent.browser || 'Browser'})`;

      // Formatear acciones
      const actions = sortedEvents.map(ev => {
        const timeStr = new Date(ev.created_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        let label = '';
        if (ev.event_type === 'pageview') {
          if (ev.path.includes('flow=papa') || ev.path.includes('c=papa')) {
            label = `📥 Landed on Father's Day Landing Page (?flow=papa)`;
          } else {
            label = `📥 Pageview: ${ev.path}`;
          }
        } else {
          const btnText = ev.event_details?.text || '';
          if (btnText.toUpperCase().includes('CONTINUAR') && ev.path.includes('flow=papa')) {
            label = `✍️ Completed Name form step (Micro-commitment)`;
          } else {
            label = `⚡ Clicked: "${btnText}"`;
          }
        }
        return { time: timeStr, label, raw: ev };
      });

      return {
        sessionId,
        visitorId: firstEvent.visitor_id,
        startTime,
        firstEventDate: new Date(firstEvent.created_at),
        durationSecs,
        email,
        source,
        device,
        actions
      };
    });

    // Ordenar sesiones por startTime ascendente para asignar número correlativo
    sessions.sort((a, b) => a.startTime - b.startTime);

    // Asignar número consecutivo de visitante (ej. Visitante #001)
    const sessionsWithNumbers = sessions.map((s, index) => {
      const numStr = String(index + 1).padStart(3, '0');
      return {
        ...s,
        visitorNumber: `Visitante #${numStr}`
      };
    });

    // Devolver ordenados por más reciente primero
    return sessionsWithNumbers.sort((a, b) => b.startTime - a.startTime);
  };

  const getAdFunnelStats = () => {
    const sessions = getSessionsTimeline();
    // Filtrar sesiones de campaña de Papá/Facebook
    const adSessions = sessions.filter(s => 
      s.source.includes('Campaña Papá') || 
      s.source.toLowerCase().includes('facebook') ||
      s.actions.some(a => a.raw.path?.includes('flow=papa') || a.raw.path?.includes('c=papa'))
    );

    const totalAdSessions = adSessions.length;

    // Paso 2: Escribió nombre y dio Continuar en micro-compromiso
    const wroteName = adSessions.filter(s => 
      s.actions.some(a => a.label.includes('Completed Name form step') || a.label.toUpperCase().includes('CONTINUAR'))
    ).length;

    // Paso 3: Completó formulario largo y dio continuar a preguntas
    const completedDetails = adSessions.filter(s => 
      s.actions.some(a => a.label.toLowerCase().includes('entrevista') || a.label.toUpperCase().includes('CONTINUAR') || a.label.toUpperCase().includes('DISEÑANDO ENTREVISTA'))
    ).length;

    // Paso 4: Generó la letra
    const generatedLyrics = adSessions.filter(s => 
      s.actions.some(a => a.label.toUpperCase().includes('COMPONER') || a.label.toUpperCase().includes('CREAR'))
    ).length;

    // Paso 5: Intento de pago (Clic en Stripe / Comprar / Desbloquear)
    const paymentAttempts = adSessions.filter(s => 
      s.actions.some(a => a.label.toUpperCase().includes('PAGAR') || a.label.toUpperCase().includes('DESBLOQUEAR') || a.label.toUpperCase().includes('STRIPE') || a.label.toUpperCase().includes('COMPRAR'))
    ).length;

    // Paso 6: Pagados reales del flujo (buscamos en canciones si hay alguna con landing_flow = 'direct-papa' y is_paid = true)
    const paidSongs = masterData.flatMap(u => u.songs || []).filter(song => 
      (song.form_data?.landing_flow === 'direct-papa') && song.is_paid
    ).length;

    return {
      totalAdSessions,
      wroteName,
      completedDetails,
      generatedLyrics,
      paymentAttempts,
      paidSongs
    };
  };

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
              <button onClick={() => setActiveTab('trafico')} className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-1 ${activeTab === 'trafico' ? 'text-indigo-500 border-b-2 border-indigo-500' : 'text-gray-300'}`}>Inteligencia</button>
              <button onClick={() => setActiveTab('seguimiento')} className={`text-[10px] font-black uppercase tracking-widest ${activeTab === 'seguimiento' ? 'text-naranja-500 border-b-2 border-naranja-500' : 'text-gray-300'}`}>Seguimiento</button>
              <button onClick={() => setActiveTab('recientes')} className={`text-[10px] font-black uppercase tracking-widest ${activeTab === 'recientes' ? 'text-naranja-500 border-b-2 border-naranja-500' : 'text-gray-300'}`}>Recientes</button>
              <button onClick={() => setActiveTab('marketing')} className={`text-[10px] font-black uppercase tracking-widest ${activeTab === 'marketing' ? 'text-naranja-500 border-b-2 border-naranja-500' : 'text-gray-300'}`}>Marketing</button>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-full border border-emerald-100 shadow-sm">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
          <span className="text-[9px] font-black uppercase tracking-widest">En Vivo (10s)</span>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-10 space-y-8">
        
        {activeTab === 'panel' && (
          <div className="animate-in fade-in duration-500 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {[
               { label: 'Visitantes Únicos', value: stats.uniqueVisitors, icon: <Search /> },
               { label: 'Vistas de Página', value: stats.pageViews, icon: <Play /> },
               { label: 'Conversión (Visitante -> Reg.)', value: `${stats.conversionRate}%`, icon: <TrendingUp /> },
               { label: 'Usuarios Registrados', value: stats.totalUsers, icon: <Users /> },
               { label: 'Historias Creadas', value: stats.totalSongs, icon: <Music /> },
               { label: 'Ingresos MXN', value: `$${stats.revenue.toLocaleString()}`, icon: <DollarSign /> },
             ].map((m, i) => (
               <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-orange-50 shadow-sm hover:shadow-md transition-all">
                  <div className="text-naranja-500 mb-4 opacity-50">{m.icon}</div>
                  <p className="text-[10px] font-black uppercase text-gray-400 mb-1 tracking-widest">{m.label}</p>
                  <p className="text-4xl font-black font-outfit text-blush-800">{m.value}</p>
               </div>
             ))}
           </div>
        )}
            {activeTab === 'trafico' && (() => {
          const funnel = getAdFunnelStats();
          const sessions = getSessionsTimeline();
          
          const filteredSessions = sessions.filter(s => {
            if (!sessionSearch) return true;
            const q = sessionSearch.toLowerCase();
            return (
              s.visitorNumber.toLowerCase().includes(q) ||
              (s.email && s.email.toLowerCase().includes(q)) ||
              s.sessionId.toLowerCase().includes(q) ||
              s.source.toLowerCase().includes(q) ||
              s.device.toLowerCase().includes(q)
            );
          });

          // Helper percentage function
          const pct = (val: number, base: number) => {
            if (!base) return '0%';
            return `${((val / base) * 100).toFixed(1)}%`;
          };

          return (
            <div className="animate-in slide-in-from-right-8 duration-500 space-y-10">
              <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-black font-outfit text-indigo-900">Inteligencia de Tráfico</h2>
                  <p className="text-sm text-indigo-500 font-bold uppercase tracking-widest mt-1">Embudo de Campañas y Modo Espía Cronológico</p>
                </div>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400" size={16} />
                  <input 
                    type="text" 
                    placeholder="Filtrar sesiones por email o #..." 
                    value={sessionSearch} 
                    onChange={(e) => setSessionSearch(e.target.value)}
                    className="pl-11 pr-4 py-3 bg-white border border-indigo-100 rounded-xl text-xs font-bold w-64 outline-none focus:ring-2 focus:ring-indigo-400 shadow-sm"
                  />
                </div>
              </header>

              {/* Embudo de Conversión de Campaña */}
              <div className="bg-white p-8 rounded-[2.5rem] border border-indigo-50 shadow-sm space-y-6">
                <h3 className="text-xs font-black uppercase text-indigo-500 tracking-widest flex items-center gap-2">
                  <TrendingUp size={16} /> Embudo CRO: Campaña Direct-Papa / Facebook
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                  {[
                    { title: "1. Landing (Visita)", val: funnel.totalAdSessions, conversion: "100%", desc: "Entraron al link directo", color: "bg-indigo-500" },
                    { title: "2. Nombre (Micro)", val: funnel.wroteName, conversion: pct(funnel.wroteName, funnel.totalAdSessions), desc: "Escribió el nombre de papá", color: "bg-indigo-600" },
                    { title: "3. Detalles Biográficos", val: funnel.completedDetails, conversion: pct(funnel.completedDetails, funnel.wroteName), desc: "Completó la biografía larga", color: "bg-indigo-700" },
                    { title: "4. Creó Letras", val: funnel.generatedLyrics, conversion: pct(funnel.generatedLyrics, funnel.completedDetails), desc: "Avanzó al paso de la letra", color: "bg-indigo-800" },
                    { title: "5. Intento Pago", val: funnel.paymentAttempts, conversion: pct(funnel.paymentAttempts, funnel.generatedLyrics), desc: "Clic en pagar o Stripe", color: "bg-orange-500" },
                    { title: "6. Compra Real", val: funnel.paidSongs, conversion: pct(funnel.paidSongs, funnel.totalAdSessions), desc: "Canciones pagadas en base", color: "bg-emerald-500" },
                  ].map((step, idx) => (
                    <div key={idx} className="relative bg-[#FDF9F8]/50 p-5 rounded-2xl border border-indigo-50 flex flex-col justify-between">
                      <div>
                        <div className="text-[10px] font-black uppercase text-gray-400 tracking-wider mb-1">{step.title}</div>
                        <div className="text-3xl font-black font-outfit text-indigo-900">{step.val}</div>
                        <div className="text-[11px] font-bold text-gray-500 mt-1">{step.desc}</div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-indigo-50/50 flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-500">Conv.</span>
                        <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-black">{step.conversion}</span>
                      </div>
                      {/* Línea de progreso interna */}
                      <div className="absolute bottom-0 left-0 right-0 h-1 rounded-b-2xl overflow-hidden bg-gray-100">
                        <div 
                          className={`h-full ${step.color}`} 
                          style={{ width: step.conversion === '0%' ? '0%' : step.conversion.includes('%') ? step.conversion : '100%' }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Lista de Sesiones - Modo Espía */}
              <div className="space-y-6">
                <h3 className="text-xs font-black uppercase text-indigo-500 tracking-widest flex items-center gap-2">
                  <Search size={16} /> Caminos de Usuario en Tiempo Real (Mostrando {filteredSessions.length} de {sessions.length} sesiones)
                </h3>

                <div className="space-y-6">
                  {filteredSessions.length === 0 ? (
                    <div className="bg-white p-12 rounded-[2rem] border border-indigo-50 text-center text-gray-400 font-medium text-sm">
                      No se encontraron sesiones con el filtro actual.
                    </div>
                  ) : (
                    filteredSessions.map((session, sIdx) => {
                      const durationText = session.durationSecs > 60 
                        ? `${Math.floor(session.durationSecs / 60)}m ${session.durationSecs % 60}s` 
                        : `${session.durationSecs}s`;

                      return (
                        <div key={session.sessionId} className="bg-white rounded-[2rem] border border-indigo-50 shadow-sm overflow-hidden hover:border-indigo-200 transition-all">
                          {/* Cabecera de la sesión */}
                          <div className="bg-indigo-50/30 px-6 py-5 border-b border-indigo-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex flex-wrap items-center gap-3">
                              <span className="bg-indigo-600 text-white text-xs font-black px-3 py-1 rounded-full">{session.visitorNumber}</span>
                              <span className="text-xs text-gray-500 font-bold">
                                {session.firstEventDate.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })} a las {session.firstEventDate.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              <span className="text-[10px] font-bold px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                                Duración: {durationText}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                              {session.email && (
                                <span className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-black px-3 py-1 rounded-full flex items-center gap-1">
                                  ✉️ {session.email}
                                </span>
                              )}
                              <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded ${session.source.includes('Campaña') ? 'bg-orange-50 text-orange-600 border border-orange-100' : 'bg-gray-100 text-gray-600'}`}>
                                {session.source}
                              </span>
                            </div>
                          </div>

                          {/* Cuerpo: Detalles del camino del usuario */}
                          <div className="p-6">
                            <div className="text-[10px] font-black uppercase text-indigo-400 tracking-wider mb-4">Camino del usuario:</div>
                            
                            <div className="relative border-l-2 border-indigo-50 pl-6 space-y-4 ml-2">
                              {session.actions.map((action, aIdx) => (
                                <div key={aIdx} className="relative flex items-start gap-4">
                                  {/* Punto en el timeline */}
                                  <div className="absolute -left-[31px] top-1.5 w-4.5 h-4.5 rounded-full bg-white border-2 border-indigo-300 flex items-center justify-center">
                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                                  </div>
                                  
                                  <div className="flex-1 bg-gray-50/50 p-3 rounded-xl border border-gray-50 flex items-center justify-between gap-4 hover:bg-gray-50 transition-colors">
                                    <span className="text-xs font-bold text-gray-700 leading-relaxed">
                                      {action.label}
                                    </span>
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] font-mono text-gray-400 font-medium">
                                        {action.time}
                                      </span>
                                      {action.raw.event_type === 'click' && (
                                        <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[9px] font-black uppercase">
                                          CLICK
                                        </span>
                                      )}
                                      {action.raw.event_type === 'pageview' && (
                                        <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[9px] font-black uppercase">
                                          PAGINA
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>

                            <div className="mt-5 pt-4 border-t border-gray-50 flex items-center justify-between text-[10px] text-gray-400 font-bold">
                              <span>Dispositivo: {session.device}</span>
                              <span className="font-mono text-[9px]">Session ID: {session.sessionId}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          );
        })()}

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
                          <td className="py-6 px-8 font-black text-sm">
                            <div className="flex items-center gap-2">
                              <span>{u?.email || 'N/A'}</span>
                              {(u?.songs || []).some((s: any) => s?.form_data?.audio_issue_reported) && (
                                <span className="text-[9px] font-bold uppercase bg-red-500 text-white px-2 py-0.5 rounded-full animate-pulse shadow-sm flex items-center gap-1 whitespace-nowrap">
                                  ⚠️ REVISAR AUDIO
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="py-6 px-8"><div className="flex items-center gap-2"><Coins size={14} className="text-amber-500" /> <span className="font-bold">{u?.tokens_balance ?? 0}</span></div></td>
                          <td className="py-6 px-8"><span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase ${u?.statusColor || 'bg-gray-100'}`}>{u?.funnelStatus || 'Unknown'}</span></td>
                          <td className="py-6 px-8 text-right">
                             <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                {!u?.email_confirmed && (
                                  <button onClick={() => u?.email && handleResendConfirmation(u.email)} title="Reenviar Confirmación" className="p-3 bg-white border border-indigo-100 rounded-xl text-indigo-500 hover:bg-indigo-500 hover:text-white transition-all shadow-sm">
                                    <Mail size={16} />
                                  </button>
                                )}
                                <button onClick={() => u?.email && handleSendPasswordReset(u.email)} title="Enviar Reset de Contraseña" className="p-3 bg-white border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-500 hover:text-white transition-all shadow-sm">
                                  <Key size={16} />
                                </button>
                                <button onClick={() => u?.id && handleResetTokens(u.id)} disabled={isProcessing === u?.id} title="Resetear a 3 Créditos" className="p-3 bg-white border border-orange-100 rounded-xl text-amber-500 hover:bg-amber-500 hover:text-white transition-all shadow-sm">
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
                                          <Music size={24} className={s?.status === 'completed' ? 'text-emerald-500' : 'text-gray-300'} />
                                          <div className="flex flex-col items-end gap-2">
                                             {s?.form_data?.audio_issue_reported && (
                                                <span className="text-[10px] font-bold uppercase bg-red-500 text-white px-3 py-1 rounded-full animate-pulse shadow-md flex items-center gap-1">
                                                  ⚠️ AUDIO REPORTADO
                                                </span>
                                             )}
                                             <div className="flex items-center gap-2">
                                                <button onClick={() => s?.id && handleTogglePaid(s.id, !!s?.is_paid)} className={`text-[9px] font-black uppercase px-3 py-1 rounded-full cursor-pointer hover:opacity-80 transition-opacity ${s?.is_paid ? 'bg-pink-100 text-pink-600' : 'bg-gray-100 text-gray-500'}`} title="Clic para alternar estado de pago">
                                                   {isProcessing === `paid-${s?.id}` ? <Loader2 size={10} className="animate-spin inline mr-1" /> : null}
                                                   {s?.is_paid ? '💰 PAGADA' : '⏳ DEMO'}
                                                </button>
                                                <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full ${s?.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-50'}`}>{s?.status || 'Draft'}</span>
                                             </div>
                                             
                                             <div className="flex items-center gap-2 mt-2">
                                                <button onClick={() => s?.id && handleResetSongStatus(s.id)} className="text-[8px] font-black uppercase text-red-400 hover:text-red-600 transition-colors flex items-center gap-1" title="Borrar todo y regresar a borrador">
                                                   {isProcessing === s?.id ? <Loader2 size={10} className="animate-spin" /> : <RotateCcw size={10} />} A Borrador
                                                </button>
                                                <button onClick={() => s?.id && handleResetToLyrics(s.id)} className="text-[8px] font-black uppercase text-naranja-400 hover:text-naranja-600 transition-colors flex items-center gap-1" title="Conservar letra, regenerar audio">
                                                   {isProcessing === `lyrics-${s?.id}` ? <Loader2 size={10} className="animate-spin" /> : <Music size={10} />} A Letra
                                                </button>
                                                <button onClick={() => s?.id && handleRegenerateLegacy(s)} className="text-[8px] font-black uppercase text-purple-500 hover:text-purple-600 transition-colors flex items-center gap-1" title="Regenerar solo el PDF y Web con IA">
                                                   {isProcessing === `legacy-${s?.id}` ? <Loader2 size={10} className="animate-spin" /> : <Feather size={10} />} Regen. Legado
                                                </button>
                                                <button onClick={() => u?.id && handleRefundToken(u.id, u.tokens_balance)} className="text-[8px] font-black uppercase text-amber-500 hover:text-amber-600 transition-colors flex items-center gap-1" title="Devolver 1 Crédito al Usuario">
                                                   {isProcessing === `refund-${u?.id}` ? <Loader2 size={10} className="animate-spin" /> : <Coins size={10} />} +1 Crédito
                                                </button>
                                             </div>
                                          </div>
                                       </div>
                                       <h4 className="text-base font-black truncate">{s?.title || 'Historia Sonora'}</h4>
                                       
                                       <div className="space-y-4">
                                          {/* Opción 1 */}
                                          {s?.audio_url || s?.demo_url ? (
                                            <div className="space-y-2">
                                              <p className="text-[8px] font-black uppercase text-gray-400">Opción 1</p>
                                              <audio src={s.audio_url || s.demo_url} controls referrerPolicy="no-referrer" className="w-full h-8" />
                                              <button onClick={() => window.open(s.audio_url || s.demo_url, '_blank')} className="text-[8px] text-naranja-500 underline">¿No carga? Clic aquí</button>
                                            </div>
                                          ) : <div className="py-3 bg-gray-50 text-gray-300 rounded-xl text-[9px] font-black uppercase text-center border border-dashed border-gray-200">Sin Audio 1</div>}

                                          {/* Opción 2 */}
                                          {s?.form_data?.version2 ? (
                                            <div className="space-y-2">
                                              <p className="text-[8px] font-black uppercase text-gray-400">Opción 2</p>
                                              <audio src={s.form_data.version2.audio_url || s.form_data.version2.demo_url} controls referrerPolicy="no-referrer" className="w-full h-8" />
                                              <button onClick={() => window.open(s.form_data.version2.audio_url || s.form_data.version2.demo_url, '_blank')} className="text-[8px] text-naranja-500 underline">¿No carga? Clic aquí</button>
                                            </div>
                                          ) : null}
                                       </div>

                                       <div className="pt-4 border-t border-gray-50 grid grid-cols-2 gap-2">
                                          {(s?.audio_url || s?.form_data?.version2?.audio_url) && (
                                            <div className="col-span-2 flex gap-2">
                                              {s?.audio_url && (
                                                <a href={s.audio_url} target="_blank" rel="noreferrer" className="flex-1 py-3 bg-gray-50 text-gray-400 rounded-xl text-[9px] font-black uppercase text-center hover:bg-naranja-500 hover:text-white transition-all flex items-center justify-center gap-2">
                                                  <Download size={14} /> Opción 1
                                                </a>
                                              )}
                                              {s?.form_data?.version2?.audio_url && (
                                                <a href={s.form_data.version2.audio_url} target="_blank" rel="noreferrer" className="flex-1 py-3 bg-gray-50 text-gray-400 rounded-xl text-[9px] font-black uppercase text-center hover:bg-naranja-500 hover:text-white transition-all flex items-center justify-center gap-2">
                                                  <Download size={14} /> Opción 2
                                                </a>
                                              )}
                                            </div>
                                          )}
                                          <button onClick={() => setXrayData(s)} className="py-3 bg-indigo-50 text-indigo-500 rounded-xl text-[9px] font-black uppercase text-center hover:bg-indigo-500 hover:text-white transition-all flex items-center justify-center gap-2 shadow-sm">
                                             <Search size={14} /> Rayos X
                                          </button>
                                          <button onClick={() => window.open(`/tribute/${s.id}`, '_blank')} className="py-3 bg-pink-50 text-pink-500 rounded-xl text-[9px] font-black uppercase text-center hover:bg-pink-500 hover:text-white transition-all flex items-center justify-center gap-2 shadow-sm">
                                             <Play size={14} /> Legado
                                          </button>
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
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm truncate">{s.title || 'Sin Título'}</h4>
                        {s?.form_data?.audio_issue_reported && (
                          <span className="text-[8px] font-bold bg-red-500 text-white px-2 py-0.5 rounded-full animate-pulse" title="El usuario reportó que el audio no se escucha o está mal">⚠️</span>
                        )}
                      </div>
                      <audio src={s.audio_url || s.demo_url} controls referrerPolicy="no-referrer" className="w-full h-8" />
                      <button onClick={() => window.open(s.audio_url || s.demo_url, '_blank')} className="text-[8px] text-naranja-500 underline mt-1">Abrir Audio</button>
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

        {/* Modal Rayos X */}
        {xrayData && (
          <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-[2rem] w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="sticky top-0 bg-white/80 backdrop-blur-md p-6 border-b border-gray-100 flex justify-between items-center z-10">
                <div>
                  <h3 className="text-xl font-black font-outfit text-indigo-900">🔍 Rayos X: {xrayData.title || 'Sin Título'}</h3>
                  <p className="text-xs text-gray-500 mt-1 font-mono">ID: {xrayData.id}</p>
                </div>
                <button onClick={() => setXrayData(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"><X size={20}/></button>
              </div>
              
              <div className="p-8 space-y-8">
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Datos Crudos (Formulario y Entrevista)</h4>
                  <div className="bg-gray-50 rounded-2xl p-6 font-mono text-[11px] text-gray-600 whitespace-pre-wrap break-all border border-gray-100">
                    {JSON.stringify(xrayData.form_data || {}, null, 2)}
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-naranja-400">Letra Generada (IA)</h4>
                  <div className="bg-[#FFF9F5] rounded-2xl p-6 font-serif text-sm text-gray-800 whitespace-pre-wrap border border-naranja-100 leading-relaxed">
                    {xrayData.lyrics || <span className="italic text-gray-400">Letra no generada aún o no disponible.</span>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
