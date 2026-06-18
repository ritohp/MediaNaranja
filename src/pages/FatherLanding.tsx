import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Play, 
  Pause, 
  Music, 
  BookOpen, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  FileText, 
  Volume2,
  Calendar,
  Users,
  Award,
  Heart,
  QrCode,
  Shield,
  Star,
  Briefcase,
  Hammer,
  Feather,
  User
} from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function FatherLanding() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'pop' | 'corrido'>('pop');
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [previewTab, setPreviewTab] = useState<'biografia' | 'pdf' | 'significado'>('biografia');

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const demoTracks = {
    pop: {
      url: 'https://tempfile.aiquickdraw.com/r/41c5b3929a984d83a34e06abe047dbef.mp3',
      title: 'Homenaje a Don José',
      style: 'Pop / Balada Acústica Emotiva',
      description: 'Ideal para papás sentimentales, con guitarras acústicas y un ritmo suave y tierno.'
    },
    corrido: {
      url: 'https://tempfile.aiquickdraw.com/r/85b9498fe0f54ec681581a86accf5e05.mp3',
      title: 'El Corrido de Don Rito',
      style: 'Corrido / Ranchero Tradicional',
      description: 'Ideal para papás que disfrutan de la música norteña, el acordeón y los relatos de esfuerzo y campo.'
    }
  };

  useEffect(() => {
    // Si cambia de track, pausar el anterior
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime(0);
    }
  }, [activeTab]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(err => {
        console.error("Audio playback failed:", err);
      });
    }
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    const current = audioRef.current.currentTime;
    const dur = audioRef.current.duration || 0;
    setCurrentTime(current);
    setDuration(dur);
    if (dur > 0) {
      setProgress((current / dur) * 100);
    }
  };

  const handleLoadedMetadata = () => {
    if (!audioRef.current) return;
    setDuration(audioRef.current.duration || 0);
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    setProgress(0);
    setCurrentTime(0);
  };

  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || duration === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const newTime = (clickX / width) * duration;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
    setProgress((clickX / width) * 100);
  };

  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    localStorage.removeItem('mn_draft_song');
    navigate('/crear-cancion?flow=papa');
  };

  return (
    <div className="min-h-screen bg-[#FFFBF7] text-[#2D2D2D] font-sans selection:bg-[#FF6B00]/20 pb-24 relative overflow-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&family=Playfair+Display:ital,wght@0,700;1,700&display=swap');
        .font-outfit { font-family: 'Outfit', sans-serif; }
        .font-playfair { font-family: 'Playfair Display', serif; }
        .bg-brand-gradient {
          background: linear-gradient(135deg, #FF6B00 0%, #FF2D55 100%);
        }
        .bg-blue-gradient {
          background: linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%);
        }
        .text-gradient-blue {
          background: linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          color: transparent;
        }
        .glass-card {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.9);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.04);
        }
        .pulse-soft {
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.03); }
        }
      `}</style>

      {/* Elementos flotantes decorativos */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-blue-100/30 rounded-full blur-3xl -z-10"></div>
      <div className="absolute top-80 right-20 w-96 h-96 bg-orange-100/30 rounded-full blur-3xl -z-10"></div>

      {/* --- HERO SECTION --- */}
      <section className="pt-16 pb-20 px-6 max-w-6xl mx-auto">
        <div className="text-center space-y-6 max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full border border-blue-100 text-xs font-bold uppercase tracking-widest font-outfit">
            🎁 Regalo Exclusivo del Día del Padre
          </div>
          <h1 className="text-5xl md:text-7xl font-playfair leading-[1.1] text-gray-900">
            Regálale a Papá una <span className="text-blue-600 italic">canción personalizada</span> con su historia de vida.
          </h1>
          <p className="text-xl text-gray-600 font-outfit leading-relaxed">
            Mucho más que un detalle. Convierte sus anécdotas, origen y enseñanzas en una obra de arte interactiva y musical única. 
          </p>
        </div>

        {/* --- GRID PRINCIPAL: AUDIO PLAYER & INTRO --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Lado izquierdo: Explicación & Valor */}
          <div className="lg:col-span-6 space-y-8 order-2 lg:order-1">
            <h2 className="text-3xl font-playfair font-bold text-gray-800">
              ¿Por qué es el mejor regalo que recibirá jamás?
            </h2>
            
            <div className="space-y-6 font-outfit">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
                  <Music size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">Canción 100% suya</h3>
                  <p className="text-gray-500 text-sm mt-1">
                    No es una plantilla. Nuestro sistema de IA y compositores adapta cada verso para mencionar sus pasiones, su origen, su esposa, hijos y frases típicas.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-500 border border-orange-100">
                  <BookOpen size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">Biografía Digital Interactiva</h3>
                  <p className="text-gray-500 text-sm mt-1">
                    Incluye un portal web exclusivo para él con un árbol familiar interactivo, línea de tiempo con sus hitos clave y dedicatorias de la familia.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100">
                  <FileText size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">Certificado Imprimible con QR</h3>
                  <p className="text-gray-500 text-sm mt-1">
                    Descarga un PDF premium listo para enmarcar. Al escanear el código QR, cualquier familiar podrá escuchar su canción y ver su biografía.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 bg-blue-50/50 rounded-2xl border border-blue-100 font-outfit">
              <p className="text-sm font-bold text-blue-700 italic">
                👉 Crea la canción gratis en menos de 5 minutos. Solo pagas si te emociona el resultado preliminar.
              </p>
            </div>

            <button 
              onClick={handleStart}
              className="w-full py-5 bg-blue-600 text-white rounded-2xl font-outfit font-black text-sm uppercase tracking-[0.2em] shadow-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-3 pulse-soft"
            >
              Comenzar Biografía Gratis <ArrowRight size={18} />
            </button>
          </div>

          {/* Lado derecho: Audio Player Demo Card */}
          <div className="lg:col-span-6 order-1 lg:order-2">
            <div className="glass-card rounded-[2.5rem] p-8 md:p-10 border border-white shadow-2xl relative">
              <span className="absolute -top-3 right-8 px-3 py-1 bg-orange-500 text-white rounded-full text-[10px] font-bold uppercase tracking-widest shadow-md">
                Prueba el audio
              </span>

              <h3 className="text-2xl font-playfair font-bold text-gray-800 mb-2">
                Escucha un ejemplo real:
              </h3>
              <p className="text-sm text-gray-500 font-outfit mb-6">
                Selecciona el estilo que más le guste a tu papá y dale play para sentir la emoción:
              </p>

              {/* Tabs de estilo */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <button
                  onClick={() => setActiveTab('pop')}
                  className={`py-3 px-4 rounded-2xl font-outfit font-bold text-xs uppercase tracking-wider transition-all border ${
                    activeTab === 'pop'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                      : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  🎸 Pop Acústico
                </button>
                <button
                  onClick={() => setActiveTab('corrido')}
                  className={`py-3 px-4 rounded-2xl font-outfit font-bold text-xs uppercase tracking-wider transition-all border ${
                    activeTab === 'corrido'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                      : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  🤠 Corrido Ranchero
                </button>
              </div>

              {/* Información del track activo */}
              <div className="bg-blush-50/40 p-5 rounded-2xl border border-blush-100/50 mb-6 font-outfit">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest block mb-1">
                      {demoTracks[activeTab].style}
                    </span>
                    <h4 className="text-lg font-bold text-gray-800">
                      {demoTracks[activeTab].title}
                    </h4>
                  </div>
                  <Volume2 className="text-blue-500 animate-pulse" size={20} />
                </div>
                <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                  {demoTracks[activeTab].description}
                </p>
              </div>

              {/* Controladores del Player */}
              <div className="space-y-4 font-outfit">
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>

                {/* Barra de progreso */}
                <div 
                  onClick={handleProgressBarClick}
                  className="w-full h-3 bg-gray-100 rounded-full cursor-pointer relative overflow-hidden group"
                >
                  <div 
                    className="absolute top-0 left-0 h-full bg-blue-600 rounded-full transition-all duration-100" 
                    style={{ width: `${progress}%` }}
                  ></div>
                  <div 
                    className="absolute top-0 h-full w-1 bg-white opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ left: `${progress}%` }}
                  ></div>
                </div>

                {/* Botón Play/Pause central */}
                <div className="flex justify-center pt-2">
                  <button
                    onClick={togglePlay}
                    className="w-16 h-16 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95"
                  >
                    {isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-1" />}
                  </button>
                </div>
              </div>

              {/* Elemento HTML5 Audio Oculto */}
              <audio
                ref={audioRef}
                src={demoTracks[activeTab].url}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={handleAudioEnded}
                className="hidden"
              />
            </div>
          </div>
        </div>
      </section>

      {/* --- CÓMO FUNCIONA --- */}
      <section className="py-20 bg-white border-y border-gray-100 px-6">
        <div className="max-w-5xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-playfair font-bold text-gray-800">
              Crear su Homenaje es muy sencillo
            </h2>
            <p className="text-gray-500 font-outfit max-w-xl mx-auto text-base">
              Solo necesitas tu celular y 5 minutos para iniciar un regalo que durará toda la vida.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 font-outfit">
            <div className="bg-blush-50/20 p-8 rounded-3xl border border-blush-100/50 space-y-4">
              <span className="inline-flex w-10 h-10 rounded-full bg-blue-50 text-blue-600 font-bold items-center justify-center border border-blue-100">
                1
              </span>
              <h3 className="text-lg font-bold text-gray-800">Escribe su Nombre</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Ingresa cómo se llama tu papá para activar el flujo de co-creación personalizado.
              </p>
            </div>

            <div className="bg-blush-50/20 p-8 rounded-3xl border border-blush-100/50 space-y-4">
              <span className="inline-flex w-10 h-10 rounded-full bg-blue-50 text-blue-600 font-bold items-center justify-center border border-blue-100">
                2
              </span>
              <h3 className="text-lg font-bold text-gray-800">Responde la Entrevista</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Cuéntanos un poco sobre su vida, anécdotas divertidas y enseñanzas valiosas.
              </p>
            </div>

            <div className="bg-blush-50/20 p-8 rounded-3xl border border-blush-100/50 space-y-4">
              <span className="inline-flex w-10 h-10 rounded-full bg-blue-50 text-blue-600 font-bold items-center justify-center border border-blue-100">
                3
              </span>
              <h3 className="text-lg font-bold text-gray-800">Genera y Escucha</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Nuestra Inteligencia Artificial creará la letra y la música. Podrás escuchar un demo gratis antes de adquirir la versión final.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- SECCIÓN DETALLE INTERACTIVO: EXPLORA EL HOMENAJE --- */}
      <section className="py-24 px-6 max-w-6xl mx-auto bg-gradient-to-b from-white to-[#FFFBF7] rounded-[3rem] border border-orange-100/30 my-12 shadow-sm">
        <div className="text-center space-y-4 mb-16">
          <span className="text-xs font-black text-blue-600 uppercase tracking-widest block font-outfit">
            ¿Qué vas a recibir?
          </span>
          <h2 className="text-4xl md:text-5xl font-playfair font-bold text-gray-900 leading-tight">
            Explora cada elemento del Homenaje
          </h2>
          <p className="text-gray-500 font-outfit max-w-2xl mx-auto">
            Interactúa con los botones de abajo para ver una vista previa interactiva de lo que crearemos para tu papá.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Lado izquierdo: Selector de Elementos */}
          <div className="lg:col-span-5 space-y-4">
            <button
              onClick={() => setPreviewTab('biografia')}
              className={`w-full text-left p-6 rounded-3xl border transition-all flex items-start gap-4 font-outfit ${
                previewTab === 'biografia'
                  ? 'bg-white border-blue-500 shadow-lg ring-1 ring-blue-500'
                  : 'bg-white/50 border-gray-150 hover:bg-white hover:shadow-md'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
                <BookOpen size={20} />
              </div>
              <div>
                <h3 className="font-bold text-gray-800 text-base">📱 Portal de Biografía Digital</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Una página web interactiva con reproductor musical, árbol de pilares familiares, dedicatorias y fotos familiares.
                </p>
              </div>
            </button>

            <button
              onClick={() => setPreviewTab('pdf')}
              className={`w-full text-left p-6 rounded-3xl border transition-all flex items-start gap-4 font-outfit ${
                previewTab === 'pdf'
                  ? 'bg-white border-blue-500 shadow-lg ring-1 ring-blue-500'
                  : 'bg-white/50 border-gray-150 hover:bg-white hover:shadow-md'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 flex-shrink-0">
                <FileText size={20} />
              </div>
              <div>
                <h3 className="font-bold text-gray-800 text-base">📄 Certificado Homenaje (PDF)</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Certificado oficial en PDF listo para enmarcar con diseño premium, dedicatoria especial y un código QR de acceso rápido.
                </p>
              </div>
            </button>

            <button
              onClick={() => setPreviewTab('significado')}
              className={`w-full text-left p-6 rounded-3xl border transition-all flex items-start gap-4 font-outfit ${
                previewTab === 'significado'
                  ? 'bg-white border-blue-500 shadow-lg ring-1 ring-blue-500'
                  : 'bg-white/50 border-gray-150 hover:bg-white hover:shadow-md'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 flex-shrink-0">
                <Shield size={20} />
              </div>
              <div>
                <h3 className="font-bold text-gray-800 text-base">✨ Significado de Nombre y Apellido</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Un análisis poético detallado del origen de su nombre y el legado heráldico de su apellido integrado en su homenaje.
                </p>
              </div>
            </button>
          </div>

          {/* Lado derecho: Visualizador del Mockup */}
          <div className="lg:col-span-7 flex justify-center w-full">
            <div className="w-full max-w-lg bg-transparent relative flex justify-center">
              {/* VISTA PREVIA 1: BIOGRAFÍA DIGITAL (Simulador de Teléfono con Biografía Real) */}
              {previewTab === 'biografia' && (
                <div className="mx-auto w-[320px] h-[580px] bg-slate-950 rounded-[3rem] p-3 shadow-2xl border-[6px] border-slate-800 relative overflow-hidden animate-in fade-in duration-500">
                  {/* Cámara/Notch */}
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-slate-800 rounded-b-2xl z-20 flex justify-center items-center">
                    <div className="w-3 h-3 bg-slate-900 rounded-full"></div>
                  </div>

                  {/* Contenido Pantalla (Fiel al estilo real de la biografía) */}
                  <div className="w-full h-full bg-[#F8F3E9] text-[#1C2A39] rounded-[2.5rem] overflow-y-auto px-4 pt-10 pb-8 space-y-6 font-serif selection:bg-orange-200 scrollbar-none relative">
                    
                    {/* Bordes Decorativos del Sistema */}
                    <div className="absolute inset-2 border-[1.2px] border-[#B69D74]/60 z-0 pointer-events-none rounded-[2rem]"></div>
                    <div className="absolute inset-3.5 border-[0.4px] border-[#B69D74]/40 z-0 pointer-events-none rounded-[1.8rem]"></div>

                    {/* Ornamentos Esquinas */}
                    <div className="absolute top-3 left-3 w-4 h-4 border-t border-l border-[#B69D74]/80 z-0 pointer-events-none"></div>
                    <div className="absolute top-3 right-3 w-4 h-4 border-t border-r border-[#B69D74]/80 z-0 pointer-events-none"></div>
                    <div className="absolute bottom-3 left-3 w-4 h-4 border-b border-l border-[#B69D74]/80 z-0 pointer-events-none"></div>
                    <div className="absolute bottom-3 right-3 w-4 h-4 border-b border-r border-[#B69D74]/80 z-0 pointer-events-none"></div>

                    <div className="relative z-10 text-center space-y-6 pt-2">
                      {/* Título Principal */}
                      <div className="text-center">
                        <span className="text-[7.5px] font-bold tracking-[0.25em] uppercase text-[#1C2A39]/65 block">La Historia de</span>
                        <h1 className="text-xl font-bold uppercase tracking-widest text-[#1C2A39] mt-0.5">Javier Rayas</h1>
                        <div className="flex items-center justify-center gap-2 mt-1.5 opacity-80">
                          <div className="h-[1px] w-6 bg-[#B69D74]"></div>
                          <span className="text-[#B69D74] uppercase tracking-[0.25em] text-[6.5px] font-bold">Una vida que dejó huella</span>
                          <div className="h-[1px] w-6 bg-[#B69D74]"></div>
                        </div>
                      </div>

                      {/* Foto Circular con Laureles */}
                      <div className="relative flex items-center justify-center w-32 h-32 mx-auto my-3">
                        <div className="w-full h-full rounded-full overflow-hidden border-[4px] border-[#FAF7F0] shadow-md relative z-10">
                          <img src="/papa-sorpresa.png" alt="Javier Rayas" className="w-full h-full object-cover sepia-[0.1]" />
                        </div>
                        {/* Laureles exactamente sobre la foto como el original */}
                        <img 
                          src="/assets/laureles.png" 
                          alt="Laureles" 
                          className="absolute w-[125%] h-[125%] max-w-none opacity-95 object-contain pointer-events-none z-20"
                          style={{ left: '-12.5%', top: '-12.5%' }}
                        />
                      </div>

                      {/* Quote */}
                      <div className="px-2">
                        <p className="text-[10px] italic font-medium leading-relaxed">
                          "Javier, el hombre que con sus manos sembró un legado de amor y gratitud."
                        </p>
                        <Heart size={10} className="mx-auto mt-2 text-[#B69D74]" fill="currentColor" />
                      </div>

                      {/* Separador Línea del Tiempo */}
                      <div className="flex items-center justify-center gap-2 my-4">
                        <div className="h-[1px] w-12 bg-[#B69D74]/40"></div>
                        <span className="text-[#1C2A39] tracking-[0.2em] text-[7.5px] font-bold uppercase">Línea del Tiempo</span>
                        <div className="h-[1px] w-12 bg-[#B69D74]/40"></div>
                      </div>

                      {/* Línea del Tiempo Vertical */}
                      <div className="relative pl-6 pr-2 space-y-4 text-left">
                        {/* Línea vertical */}
                        <div className="absolute left-[31px] top-1.5 bottom-1.5 w-[1px] bg-[#B69D74]/40"></div>
                        
                        {/* Hito 1 */}
                        <div className="relative flex gap-3.5 items-start">
                          <div className="w-5 h-5 rounded-full bg-white border border-[#B69D74] flex items-center justify-center text-[#1C2A39] z-10 shrink-0 shadow-sm">
                            <Star size={10} />
                          </div>
                          <div>
                            <h4 className="text-[9px] font-bold text-[#1C2A39] uppercase tracking-wide">1965 - Origen en La Sandía</h4>
                            <p className="text-[8.5px] text-gray-600 mt-0.5 leading-snug">Nació y creció en el campo de Guanajuato, aprendiendo el amor al trabajo campesino.</p>
                          </div>
                        </div>

                        {/* Hito 2 */}
                        <div className="relative flex gap-3.5 items-start">
                          <div className="w-5 h-5 rounded-full bg-white border border-[#B69D74] flex items-center justify-center text-[#1C2A39] z-10 shrink-0 shadow-sm">
                            <Briefcase size={10} />
                          </div>
                          <div>
                            <h4 className="text-[9px] font-bold text-[#1C2A39] uppercase tracking-wide">1985 - Viaje y Sacrificio</h4>
                            <p className="text-[8.5px] text-gray-600 mt-0.5 leading-snug">Trabajó duramente en Estados Unidos con el único fin de darles un futuro digno a los suyos.</p>
                          </div>
                        </div>

                        {/* Hito 3 */}
                        <div className="relative flex gap-3.5 items-start">
                          <div className="w-5 h-5 rounded-full bg-white border border-[#B69D74] flex items-center justify-center text-[#1C2A39] z-10 shrink-0 shadow-sm">
                            <Hammer size={10} />
                          </div>
                          <div>
                            <h4 className="text-[9px] font-bold text-[#1C2A39] uppercase tracking-wide">2005 - El Regreso a su Tierra</h4>
                            <p className="text-[8.5px] text-gray-600 mt-0.5 leading-snug">Establecido en su amada huerta de sandías, disfrutando del fruto de su esfuerzo.</p>
                          </div>
                        </div>
                      </div>

                      {/* Significados (Estructura de dos columnas con bordes superior e inferior) */}
                      <div className="border-t border-b border-[#B69D74]/30 py-4 grid grid-cols-2 gap-3 text-left">
                        <div className="pr-2 border-r border-[#B69D74]/20 flex flex-col justify-start">
                          <span className="text-[7px] font-bold tracking-wider text-gray-500 uppercase block mb-1">Nombre</span>
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <h4 className="text-[11px] font-bold text-[#1C2A39]">Javier</h4>
                            <Feather size={8} className="text-[#B69D74] opacity-80" />
                          </div>
                          <p className="text-[7.5px] leading-relaxed text-gray-600">
                            Proviene del euskera y significa "casa nueva". Representa el hombre protector, cimiento y pilar del hogar.
                          </p>
                        </div>

                        <div className="pl-1 flex flex-col justify-start">
                          <span className="text-[7px] font-bold tracking-wider text-gray-500 uppercase block mb-1">Apellido</span>
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <h4 className="text-[11px] font-bold text-[#1C2A39]">Rayas</h4>
                            <span className="text-[9px] text-[#B69D74]">🌳</span>
                          </div>
                          <p className="text-[7.5px] leading-relaxed text-gray-600">
                            Apellido hispánico que denota límites y senderos. Simboliza rectitud, paso firme y camino propio.
                          </p>
                        </div>
                      </div>

                      {/* Escudos / Biografía */}
                      <div className="space-y-3">
                        <div>
                          <span className="text-[#1C2A39] tracking-[0.2em] text-[7.5px] font-bold uppercase block">Su Biografía</span>
                          <p className="text-[7px] text-gray-500 italic mt-0.5">Valores que marcaron su vida.</p>
                        </div>
                        <div className="flex justify-center gap-3">
                          <div className="flex flex-col items-center w-12 text-center">
                            <div className="relative mb-1 w-8 h-9 flex items-center justify-center">
                              <svg width="24" height="28" viewBox="0 0 48 56" fill="#1C2A39" xmlns="http://www.w3.org/2000/svg">
                                <path d="M24 0L48 10.6667V24C48 38.0133 37.7067 51.1067 24 56C10.2933 51.1067 0 38.0133 0 24V10.6667L24 0Z" stroke="#B69D74" strokeWidth="2.5"/>
                              </svg>
                              <div className="absolute inset-0 flex items-center justify-center text-[#B69D74]">
                                <Shield size={10} fill="currentColor" strokeWidth={0} />
                              </div>
                            </div>
                            <span className="text-[6.5px] font-bold text-[#1C2A39] uppercase tracking-wider leading-none">VALOR</span>
                          </div>

                          <div className="flex flex-col items-center w-12 text-center">
                            <div className="relative mb-1 w-8 h-9 flex items-center justify-center">
                              <svg width="24" height="28" viewBox="0 0 48 56" fill="#1C2A39" xmlns="http://www.w3.org/2000/svg">
                                <path d="M24 0L48 10.6667V24C48 38.0133 37.7067 51.1067 24 56C10.2933 51.1067 0 38.0133 0 24V10.6667L24 0Z" stroke="#B69D74" strokeWidth="2.5"/>
                              </svg>
                              <div className="absolute inset-0 flex items-center justify-center text-[#B69D74]">
                                <Briefcase size={10} fill="currentColor" strokeWidth={0} />
                              </div>
                            </div>
                            <span className="text-[6.5px] font-bold text-[#1C2A39] uppercase tracking-wider leading-none">TRABAJO</span>
                          </div>

                          <div className="flex flex-col items-center w-12 text-center">
                            <div className="relative mb-1 w-8 h-9 flex items-center justify-center">
                              <svg width="24" height="28" viewBox="0 0 48 56" fill="#1C2A39" xmlns="http://www.w3.org/2000/svg">
                                <path d="M24 0L48 10.6667V24C48 38.0133 37.7067 51.1067 24 56C10.2933 51.1067 0 38.0133 0 24V10.6667L24 0Z" stroke="#B69D74" strokeWidth="2.5"/>
                              </svg>
                              <div className="absolute inset-0 flex items-center justify-center text-[#B69D74]">
                                <Heart size={10} fill="currentColor" strokeWidth={0} />
                              </div>
                            </div>
                            <span className="text-[6.5px] font-bold text-[#1C2A39] uppercase tracking-wider leading-none">AMOR</span>
                          </div>
                        </div>
                      </div>

                      {/* Legado vive en */}
                      <div className="pt-2 border-t border-[#B69D74]/20 space-y-2">
                        <span className="text-[#1C2A39] tracking-[0.2em] text-[7.5px] font-bold uppercase block">Su Legado Vive En</span>
                        <div className="flex justify-center gap-3 flex-wrap">
                          {['Mary', 'Javier', 'Valeria', 'Edgar', 'Ulises', 'Aníbal'].map((member, idx) => (
                            <div key={idx} className="flex flex-col items-center">
                              <div className="w-6 h-6 rounded-full border border-[#B69D74] flex items-center justify-center text-[#B69D74] bg-transparent shadow-sm">
                                <User size={12} />
                              </div>
                              <span className="text-[6.5px] font-bold text-[#1C2A39] mt-0.5 uppercase">{member}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Reproductor de Música del Sistema */}
                      <div className="bg-[#1C2A39] p-3 rounded-xl shadow-lg border border-[#2A3F54] text-left relative overflow-hidden mt-4">
                        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent"></div>
                        <div className="relative z-10 flex gap-2.5 items-center">
                          <img src="/papa-sorpresa.png" className="w-10 h-10 rounded object-cover border border-[#B69D74]/30" />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-white text-[9.5px] tracking-wide font-bold truncate">El Corrido de Javier Rayas</h4>
                            <p className="text-[#B69D74] text-[6.5px] uppercase tracking-widest mt-0.5">Corrido Mariachi Especial</p>
                          </div>
                          <button className="w-7 h-7 rounded-full border border-[#B69D74] text-[#B69D74] flex items-center justify-center hover:bg-[#B69D74] hover:text-[#1C2A39] transition-colors shrink-0 shadow">
                            <Play size={10} fill="currentColor" className="ml-0.5" />
                          </button>
                        </div>
                        <div className="relative z-10 mt-2.5">
                          <div className="flex items-center justify-between text-[6.5px] text-[#B69D74] font-mono mb-0.5">
                            <span>0:00</span>
                            <span>3:24</span>
                          </div>
                          <div className="w-full h-[2px] bg-[#2A3F54] rounded-full relative">
                            <div className="absolute top-0 left-0 w-1/3 h-full bg-[#B69D74] rounded-full"></div>
                          </div>
                        </div>
                      </div>

                      {/* Footer text */}
                      <p className="text-[7.5px] text-center italic font-semibold mt-4 text-[#555] leading-relaxed">
                        Gracias por enseñarnos con tu ejemplo que el verdadero éxito<br/>
                        es dejar un legado en el corazón de los demás.
                      </p>
                    </div>

                  </div>
                </div>
              )}

              {/* VISTA PREVIA 2: CERTIFICADO IMPRESO (Efecto Cuadro de Madera Realista - Fiel a la foto) */}
              {previewTab === 'pdf' && (
                <div className="mx-auto w-[380px] sm:w-[440px] bg-neutral-900 rounded-2xl shadow-2xl p-4 border-[14px] border-neutral-950 relative font-serif animate-in fade-in duration-500">
                  {/* Borde interno metalizado */}
                  <div className="absolute inset-0 border-2 border-amber-800/10 pointer-events-none rounded-md"></div>
                  
                  {/* El Canvas de la biografía impreso */}
                  <div className="bg-[#FAF7F0] border-[1px] border-amber-800/40 p-4 text-[#1C2A39] rounded-sm space-y-4 relative shadow-inner">
                    {/* Borde fino doble */}
                    <div className="absolute inset-1.5 border border-amber-800/20 pointer-events-none"></div>
                    <div className="absolute top-1 left-1 w-3 h-3 border-t border-l border-amber-800/30"></div>
                    <div className="absolute top-1 right-1 w-3 h-3 border-t border-r border-amber-800/30"></div>
                    <div className="absolute bottom-1 left-1 w-3 h-3 border-b border-l border-amber-800/30"></div>
                    <div className="absolute bottom-1 right-1 w-3 h-3 border-b border-r border-amber-800/30"></div>

                    {/* HEADER */}
                    <div className="text-center pt-1 z-10 relative">
                      <span className="text-[6px] font-bold tracking-[0.25em] uppercase text-gray-500 block mb-0.5">La Historia De</span>
                      <h4 className="text-lg font-black tracking-wide uppercase text-[#1C2A39] leading-none">
                        JAVIER RAYAS
                      </h4>
                      <span className="text-[6.5px] italic font-semibold text-amber-700 tracking-wider block mt-1">
                        — Una vida que dejó huella —
                      </span>
                    </div>

                    {/* FILA SUPERIOR: 3 COLUMNAS */}
                    <div className="grid grid-cols-12 gap-2.5 items-stretch min-h-[145px] relative z-10">
                      {/* Columna Izquierda: Significado del Nombre */}
                      <div className="col-span-3 border border-amber-800/20 p-2 rounded bg-white/40 flex flex-col justify-center text-center relative">
                        <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 bg-[#FAF7F0] px-1 text-[5px] font-bold tracking-wider text-gray-500 uppercase whitespace-nowrap">
                          Significado de Nombre
                        </span>
                        <h5 className="text-[10px] font-bold italic text-amber-950 mt-1">Javier</h5>
                        <p className="text-[5.5px] leading-relaxed text-gray-700 mt-1">
                          De origen vasco, significa <strong>"casa nueva"</strong> y <strong>"castillo nuevo"</strong>. Con la fuerza de su nombre, ha edificado una vida de amor y dedicación.
                        </p>
                      </div>

                      {/* Columna Central: Foto Circular con Laureles */}
                      <div className="col-span-6 flex flex-col items-center justify-center text-center relative">
                        <div className="relative w-24 h-24 flex items-center justify-center">
                          {/* Laureles de fondo simulados en SVG */}
                          <svg viewBox="0 0 100 100" fill="none" className="absolute w-[115%] h-[115%] opacity-85 stroke-amber-700/40">
                            <path d="M 25,75 C 10,60 10,40 25,25 C 30,20 40,15 50,25 C 60,15 70,20 75,25 C 90,40 90,60 75,75" strokeWidth="1.5" strokeLinecap="round" />
                            <circle cx="20" cy="50" r="1.5" fill="#B69D74" />
                            <circle cx="80" cy="50" r="1.5" fill="#B69D74" />
                          </svg>
                          {/* Foto */}
                          <div className="w-18 h-18 rounded-full overflow-hidden border-4 border-white shadow-md relative z-10">
                            <img src="/papa-sorpresa.png" alt="Javier" className="w-full h-full object-cover sepia-[0.1]" />
                          </div>
                        </div>
                        <p className="text-[6.5px] italic font-medium mt-2 text-gray-700 leading-snug px-2">
                          "Javier, el hombre que con sus manos sembró un legado de amor y gratitud."
                        </p>
                        <span className="text-amber-600 text-[6px] mt-0.5">❤️</span>
                      </div>

                      {/* Columna Derecha: Lo que dicen de el */}
                      <div className="col-span-3 border border-amber-800/20 p-2 rounded bg-white/40 flex flex-col justify-start relative">
                        <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 bg-[#FAF7F0] px-1 text-[5px] font-bold tracking-wider text-gray-500 uppercase whitespace-nowrap">
                          Lo que dicen de él
                        </span>
                        <div className="space-y-1.5 mt-1">
                          <p className="text-[5.5px] text-gray-700 leading-snug">
                            ⭐ <em>Su apoyo y consejos siempre fueron su fortaleza.</em>
                          </p>
                          <p className="text-[5.5px] text-gray-700 leading-snug">
                            ⭐ <em>Trabajador honesto y de un corazón inmenso.</em>
                          </p>
                          <p className="text-[5.5px] text-gray-700 leading-snug">
                            ⭐ <em>Su ejemplo ha enseñado el verdadero valor de la familia.</em>
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* FILA MEDIA: APELLIDOS & SHIELDS */}
                    <div className="grid grid-cols-12 gap-2.5 items-stretch min-h-[75px] relative z-10">
                      {/* Origen del apellido */}
                      <div className="col-span-4 border border-amber-800/20 p-2 rounded bg-white/40 flex flex-col justify-center text-center relative">
                        <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 bg-[#FAF7F0] px-1 text-[5px] font-bold tracking-wider text-gray-500 uppercase whitespace-nowrap">
                          Origen del Apellido
                        </span>
                        <h5 className="text-[8px] font-bold italic text-amber-950 mt-0.5">Rayas</h5>
                        <p className="text-[5.5px] leading-relaxed text-gray-700">
                          Apellido hispánico español asociado a límites o caminos. Lo llevó con la rectitud de quien traza su sendero con esfuerzo.
                        </p>
                      </div>

                      {/* Biografía y Escudos */}
                      <div className="col-span-8 border border-amber-800/20 p-2 rounded bg-white/40 flex flex-col justify-center relative">
                        <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 bg-[#FAF7F0] px-1 text-[5px] font-bold tracking-wider text-gray-500 uppercase whitespace-nowrap">
                          Su Biografía
                        </span>
                        <p className="text-[5.5px] text-center italic text-gray-400 mb-1.5">Los valores y pilares de su historia de vida</p>
                        <div className="flex justify-around items-center">
                          <div className="flex flex-col items-center text-center">
                            <span className="text-amber-700 text-xs">🛡️</span>
                            <span className="text-[5.5px] font-bold mt-0.5 text-gray-800">VALOR</span>
                          </div>
                          <div className="flex flex-col items-center text-center">
                            <span className="text-amber-700 text-xs">💼</span>
                            <span className="text-[5.5px] font-bold mt-0.5 text-gray-800">TRABAJO</span>
                          </div>
                          <div className="flex flex-col items-center text-center">
                            <span className="text-amber-700 text-xs">❤️</span>
                            <span className="text-[5.5px] font-bold mt-0.5 text-gray-800">AMOR FAMILIAR</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* LÍNEA DEL TIEMPO */}
                    <div className="border border-amber-800/20 p-2 rounded bg-white/40 relative z-10">
                      <span className="absolute -top-1.5 left-4 bg-[#FAF7F0] px-1 text-[5px] font-bold tracking-wider text-gray-500 uppercase">
                        Línea del Tiempo
                      </span>
                      <div className="flex items-center justify-between text-center pt-1 px-1">
                        <div className="w-[18%]">
                          <span className="text-[6px] font-bold text-amber-800 block">Infancia</span>
                          <span className="text-[4.5px] text-gray-500 block leading-tight">Donde empezó su historia.</span>
                        </div>
                        <span className="text-gray-300 text-[6px]">➔</span>
                        <div className="w-[18%]">
                          <span className="text-[6px] font-bold text-amber-800 block">Adolescente</span>
                          <span className="text-[4.5px] text-gray-500 block leading-tight">Cultivando con pasión.</span>
                        </div>
                        <span className="text-gray-300 text-[6px]">➔</span>
                        <div className="w-[18%]">
                          <span className="text-[6px] font-bold text-amber-800 block">Trabajó E.U.</span>
                          <span className="text-[4.5px] text-gray-500 block leading-tight">Esfuerzo y sacrificio.</span>
                        </div>
                        <span className="text-gray-300 text-[6px]">➔</span>
                        <div className="w-[18%]">
                          <span className="text-[6px] font-bold text-amber-800 block">La Sandía</span>
                          <span className="text-[4.5px] text-gray-500 block leading-tight">Trabajo y cosecha.</span>
                        </div>
                        <span className="text-gray-300 text-[6px]">➔</span>
                        <div className="w-[18%]">
                          <span className="text-[6px] font-bold text-amber-800 block">El Arrullo</span>
                          <span className="text-[4.5px] text-gray-500 block leading-tight">Su legado familiar.</span>
                        </div>
                      </div>
                    </div>

                    {/* FILA INFERIOR: LEGADO VIVE EN, MENSAJE, QR */}
                    <div className="grid grid-cols-12 gap-2 items-center relative z-10 pt-1">
                      {/* Legado Vive En */}
                      <div className="col-span-3 text-center">
                        <span className="text-[5px] font-black uppercase text-gray-400 tracking-wider block">Su Legado Vive En</span>
                        <p className="text-[5px] font-semibold text-gray-700 leading-tight mt-1">
                          Mary, Javier, Valeria, Edgar, Ulises, Aníbal
                        </p>
                      </div>

                      {/* Mensaje */}
                      <div className="col-span-6 text-center border-x border-amber-800/10 px-2">
                        <span className="text-[5px] font-black uppercase text-gray-400 tracking-wider block">Mensaje para él</span>
                        <p className="text-[5px] text-gray-700 italic leading-normal mt-0.5">
                          "Hoy celebramos al hombre que ha sido nuestro guía y mayor apoyo. Gracias por tu amor incondicional. Tu historia es épica, tu legado eterno."
                        </p>
                      </div>

                      {/* QR Code */}
                      <div className="col-span-3 flex flex-col items-center text-center">
                        <div className="bg-white p-1 border border-amber-600/10 rounded">
                          <QrCode size={24} className="text-[#1C2A39]" />
                        </div>
                        <span className="text-[4.5px] font-bold text-gray-500 tracking-wide mt-1">ESCANEA CANCIÓN</span>
                      </div>
                    </div>

                    {/* Footer text */}
                    <div className="text-center text-[5.5px] font-bold tracking-[0.2em] text-amber-900/60 pt-1">
                      UNA VIDA QUE INSPIRA, UN LEGADO QUE PERDURA.
                    </div>
                  </div>
                </div>
              )}

              {/* VISTA PREVIA 3: SIGNIFICADO DE NOMBRE */}
              {previewTab === 'significado' && (
                <div className="mx-auto w-full max-w-sm bg-white rounded-3xl p-6 border-2 border-naranja-100 shadow-xl space-y-6 font-outfit animate-in fade-in duration-500">
                  <div className="text-center">
                    <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold uppercase tracking-widest">
                      Análisis de Legado
                    </span>
                    <h4 className="text-xl font-bold text-gray-800 mt-2">Significado de su Nombre</h4>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 bg-blush-50/40 rounded-2xl border border-blush-100/50">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-blue-600 uppercase tracking-widest">Nombre</span>
                        <span className="text-sm font-bold text-gray-800">JAVIER</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                        Proviene del euskera y significa <strong>"casa nueva"</strong> o <strong>"castillo nuevo"</strong>. Simboliza a un hombre protector, que cimienta la seguridad de su hogar y edifica su vida con bases sólidas de lealtad y amor incondicional.
                      </p>
                    </div>

                    <div className="p-4 bg-blush-50/40 rounded-2xl border border-blush-100/50">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-blue-600 uppercase tracking-widest">Apellido</span>
                        <span className="text-sm font-bold text-gray-800">RAYAS</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                        Apellido de origen español. Históricamente hace referencia a límites, marcas de tierras o caminos. Simboliza **rectitud, determinación y la capacidad de labrar y trazar un sendero propio** e inconfundible con paso firme.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* --- CTA FINAL --- */}
      <section className="py-20 px-6 text-center max-w-4xl mx-auto space-y-8">
        <h2 className="text-4xl md:text-5xl font-playfair leading-[1.2] text-gray-900">
          Hazle a Papá el regalo más emotivo de su vida
        </h2>
        <p className="text-gray-500 font-outfit max-w-lg mx-auto">
          Toma menos de 5 minutos y no arriesgas nada. Pruébalo y escucha la canción de tu papá totalmente gratis.
        </p>
        <button 
          onClick={handleStart}
          className="px-12 py-6 bg-blue-600 text-white rounded-2xl font-outfit font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:bg-blue-700 transition-all flex items-center justify-center gap-3 mx-auto"
        >
          Crear Biografía de Papá Gratis <Heart size={16} />
        </button>
      </section>
    </div>
  );
}
