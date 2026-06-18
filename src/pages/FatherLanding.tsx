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
  Heart
} from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function FatherLanding() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'pop' | 'corrido'>('pop');
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

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

      {/* --- SECCIÓN MOSTRANDO LA BIOGRAFÍA DIGITAL --- */}
      <section className="py-20 px-6 max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div>
          <img 
            src="/papa-sorpresa.png" 
            alt="Biografía Digital Interactiva" 
            className="w-full h-auto rounded-[2.5rem] shadow-2xl border-4 border-white"
          />
        </div>
        <div className="space-y-6 font-outfit">
          <span className="text-xs font-black text-blue-600 uppercase tracking-widest block">
            Portal Familiar
          </span>
          <h2 className="text-3xl md:text-4xl font-playfair font-bold text-gray-900 leading-tight">
            La Biografía Digital Interactiva
          </h2>
          <p className="text-gray-500 leading-relaxed">
            Al adquirir la canción, no solo te llevas un archivo de audio. También desbloqueas una **página web única y privada** para tu papá que contiene:
          </p>
          <ul className="space-y-3">
            {[
              "Línea de tiempo biográfica interactiva",
              "Árbol con las personas pilares de su vida",
              "Una dedicatoria firmada por los hijos y nietos",
              "Galeria de recuerdos familiares",
              "Reproductor musical integrado"
            ].map((item, index) => (
              <li key={index} className="flex items-center gap-3 text-sm text-gray-600 font-semibold">
                <CheckCircle2 size={16} className="text-blue-500" /> {item}
              </li>
            ))}
          </ul>
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
