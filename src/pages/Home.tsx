import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Music, 
  Heart, 
  Sparkles, 
  ArrowRight, 
  Play, 
  CheckCircle2, 
  Star, 
  Mic2, 
  Gift,
  CloudLightning,
  User,
  Users,
  GraduationCap,
  Baby,
  Trophy,
  Coffee,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Home() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [activeTag, setActiveTag] = useState('papá');

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, []);

  const tags = [
    { 
      id: 'papá', 
      label: 'Papá', 
      icon: <User size={18}/>,
      title: 'Su valentía hecha canción',
      desc: 'Para el hombre que lo dio todo sin pedir nada. Un corrido o una balada que guarde para siempre el orgullo de ser su hijo.',
      color: 'bg-orange-500'
    },
    { 
      id: 'mamá', 
      label: 'Mamá', 
      icon: <Heart size={18}/>,
      title: 'Gracias en cada nota',
      desc: 'Lo que las palabras no alcanzan a decir, la música lo hace eterno. Un regalo que ella escuchará una y mil veces con lágrimas de felicidad.',
      color: 'bg-pink-500'
    },
    { 
      id: 'hijo', 
      label: 'Hijos', 
      icon: <Baby size={18}/>,
      title: 'Un legado sonoro',
      desc: 'Un mensaje de aliento para que escuchen cuando crezcan, recordándoles que siempre creerás en ellos.',
      color: 'bg-blue-500'
    },
    { 
      id: 'pareja', 
      label: 'Pareja', 
      icon: <Users size={18}/>,
      title: 'Nuestra historia favorita',
      desc: 'Celebra ese momento mágico donde vuestras vidas se cruzaron. Un detalle que redefine lo que significa amar.',
      color: 'bg-red-500'
    },
    { 
      id: 'maestro', 
      label: 'Maestros', 
      icon: <GraduationCap size={18}/>,
      title: 'Huella eterna',
      desc: 'Para quienes nos guiaron con paciencia. Un tributo musical que les demuestra que su dedicación valió la pena.',
      color: 'bg-emerald-500'
    },
    { 
      id: 'superacion', 
      label: 'Motivación', 
      icon: <Trophy size={18}/>,
      title: 'Mi propia victoria',
      desc: 'Una melodía que celebre tu camino, tus retos vencidos y la fuerza que te trajo hasta hoy.',
      color: 'bg-amber-500'
    }
  ];

  return (
    <div className="min-h-screen bg-[#FFFBF7] text-[#2D2D2D] font-sans selection:bg-[#FF6B00]/20 pb-20">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&family=Playfair+Display:ital,wght@0,700;1,700&display=swap');
        
        .font-outfit { font-family: 'Outfit', sans-serif; }
        .font-playfair { font-family: 'Playfair Display', serif; }
        
        .bg-brand-gradient {
          background: linear-gradient(135deg, #FF6B00 0%, #FF2D55 100%);
        }

        .glass-premium {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.8);
          box-shadow: 0 20px 40px rgba(0,0,0,0.03);
        }

        .animate-float {
          animation: float 6s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }

        .bg-silk {
           background: radial-gradient(circle at top right, rgba(255, 107, 0, 0.05), transparent),
                       radial-gradient(circle at bottom left, rgba(255, 45, 85, 0.05), transparent);
        }

        /* Hide scrollbar for category list */
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

        .mask-fade {
          mask-image: linear-gradient(to right, black 85%, transparent 100%);
          -webkit-mask-image: linear-gradient(to right, black 85%, transparent 100%);
        }
        
        @media (min-width: 1024px) {
          .mask-fade { mask-image: none; -webkit-mask-image: none; }
        }
      `}</style>

      {/* --- HERO SECTION --- */}
      <section className="relative min-h-[90vh] flex items-center justify-center pt-24 px-6 bg-silk overflow-hidden">
        <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
          <div className="space-y-10">
            <div className="inline-flex items-center gap-3 px-5 py-2 bg-white rounded-full shadow-sm border border-orange-100">
              <Sparkles className="w-4 h-4 text-[#FF6B00]" />
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#FF6B00] font-outfit text-center">Boutique de Historias Musicales</span>
            </div>
            
            <h1 className="text-6xl md:text-8xl font-playfair leading-[1] text-[#1A1A1A]">
               Su historia <span className="italic text-[#FF2D55]">hecha</span> <br /> 
               <span className="text-[#FF6B00] font-bold">canción.</span>
            </h1>
            
            <p className="text-xl text-gray-500 font-outfit max-w-lg leading-relaxed">
              Convierte los recuerdos más profundos en una <span className="font-bold text-[#1A1A1A]">melodía eterna</span>. Un regalo que no solo se escucha, se siente para siempre.
            </p>

            <div className="flex flex-col sm:flex-row gap-5 pt-4">
              <button 
                onClick={() => navigate('/crear-cancion')}
                className="px-12 py-6 bg-brand-gradient text-white rounded-2xl font-outfit font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:scale-105 transition-all flex items-center justify-center gap-3"
              >
                Crear canción inolvidable <ArrowRight size={18} />
              </button>
            </div>
          </div>

          <div className="relative group hidden lg:block">
            <div className="absolute inset-0 bg-brand-gradient opacity-10 blur-[100px] rounded-full animate-pulse"></div>
            <div className="relative z-10 animate-float">
               <img 
                src="/madre-emocionada.png" 
                alt="Madre emocionada" 
                className="w-full h-auto rounded-[3rem] shadow-2xl"
               />
               <div className="absolute -bottom-8 -right-8 glass-premium p-8 rounded-3xl space-y-2 max-w-[280px]">
                  <p className="text-lg font-playfair italic">"Es el regalo más hermoso que me han dado jamás..."</p>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- SECCIÓN CATEGORÍAS (REDISEÑADA PARA MÓVIL) --- */}
      <section className="py-24 px-6 bg-white overflow-hidden" id="tags">
        <div className="max-w-6xl mx-auto">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl md:text-6xl font-playfair text-[#1A1A1A]">Dile lo que sientes</h2>
            <p className="text-gray-400 font-outfit max-w-xl mx-auto italic">Selecciona a quién quieres sorprender y descubre la magia.</p>
          </div>

          {/* Nav de Tags (Scroll horizontal intuitivo con recorte visual) */}
          <div className="flex lg:grid lg:grid-cols-6 gap-4 mb-10 overflow-x-auto no-scrollbar pb-6 px-1 mask-fade">
            {tags.map((tag) => (
              <button
                key={tag.id}
                onClick={() => setActiveTag(tag.id)}
                className={`flex-shrink-0 lg:flex-shrink lg:w-full flex items-center justify-center lg:flex-col gap-3 p-5 lg:p-7 rounded-[2rem] transition-all font-outfit font-black text-[11px] uppercase tracking-[0.2em] transition-all duration-300 border ${activeTag === tag.id ? 'bg-brand-gradient text-white shadow-xl shadow-orange-500/20 border-transparent scale-105' : 'bg-white text-gray-400 border-gray-100 hover:border-[#FF6B00] hover:text-[#FF6B00] shadow-sm'}`}
              >
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-lg ${tag.color} ${activeTag === tag.id ? 'bg-white !text-[#FF6B00]' : ''}`}>{tag.icon}</div>
                {tag.label}
              </button>
            ))}
            {/* Espaciador invisible para forzar el recorte visual en móvil */}
            <div className="flex-shrink-0 w-8 lg:hidden"></div>
          </div>

          {/* Contenido Dinámico (Unificado para móvil) */}
          <div className="relative">
            {tags.map((tag) => (
               <div key={tag.id} className={`transition-all duration-700 ${activeTag === tag.id ? 'opacity-100 translate-y-0 relative z-10' : 'opacity-0 translate-y-10 absolute inset-0 pointer-events-none'}`}>
                 <div className="glass-premium p-10 md:p-14 rounded-[3rem] text-center md:text-left grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
                    <div className="space-y-6">
                       <h3 className="text-3xl md:text-5xl font-playfair italic leading-tight">{tag.title}</h3>
                       <p className="text-lg text-gray-500 font-outfit leading-relaxed">{tag.desc}</p>
                       <button 
                        onClick={() => navigate('/crear-cancion')}
                        className="flex items-center gap-3 text-[#FF6B00] font-black text-[10px] uppercase tracking-[0.4em] group mx-auto md:mx-0"
                       >
                        Hacer historia hecha canción <ArrowRight size={14} className="group-hover:translate-x-2 transition-transform" />
                       </button>
                    </div>
                    <div className="hidden md:block">
                       <div className="w-full h-64 bg-gray-50 rounded-3xl flex items-center justify-center">
                          <Music className="text-gray-200 animate-pulse" size={64} />
                       </div>
                    </div>
                 </div>
               </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- SECCIÓN EMOCIONES: FOTOS GENERADAS --- */}
      <section className="py-24 px-6 bg-silk">
        <div className="max-w-6xl mx-auto space-y-40">
           {/* FOTO PADRE */}
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
              <div className="relative">
                <div className="absolute inset-x-0 -bottom-10 h-40 bg-gradient-to-t from-[#FFFBF7] to-transparent z-10"></div>
                <img 
                  src="/padre-emocionado.png" 
                  alt="Padre orgulloso" 
                  className="w-full h-auto rounded-[3.5rem] shadow-2xl relative z-0" 
                />
              </div>
              <div className="space-y-8">
                 <h3 className="text-5xl font-playfair italic leading-tight text-center md:text-left">Dile que es tu <br /><span className="text-[#FF6B00] font-bold">héroe.</span></h3>
                 <p className="text-lg text-gray-500 font-outfit text-center md:text-left">
                    Un regalo que habla de su valentía y esfuerzo. Imagina su rostro al escuchar su vida cantada con honor.
                 </p>
                 <div className="p-8 bg-white rounded-3xl shadow-sm border border-orange-50 italic text-gray-600 font-playfair text-xl text-center">
                    "Es la primera vez que siento que mi vida se convirtió en arte."
                 </div>
              </div>
           </div>
        </div>
      </section>

      {/* --- CTA FINAL --- */}
      <section className="py-20 px-6 text-center">
         <div className="max-w-4xl mx-auto space-y-12">
            <h2 className="text-6xl md:text-8xl font-playfair italic leading-[1] text-[#1A1A1A]">
              Tu vida <br /> <span className="text-brand-gradient">hecha canción.</span>
            </h2>
            <button 
              onClick={() => navigate('/crear-cancion')}
              className="px-16 py-8 bg-brand-gradient text-white rounded-full font-outfit font-black text-sm uppercase tracking-[0.4em] shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-4 mx-auto"
            >
              Comenzar mi canción <ArrowRight />
            </button>
         </div>
      </section>

      <footer className="py-16 text-center">
         <p className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-300 font-outfit">
           © 2026 Media Naranja • Masterpiece Studio
         </p>
      </footer>
    </div>
  );
}
