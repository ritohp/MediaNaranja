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
  Coffee
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
      label: 'Para Papá', 
      icon: <User size={18}/>,
      title: 'Un Corrido a su Valentía',
      desc: 'Él que nos enseñó a ser fuertes merece que su historia se cante con orgullo. Un corrido o una balada que honre su esfuerzo y su legado para siempre.',
      color: 'bg-orange-500'
    },
    { 
      id: 'mamá', 
      label: 'Para Mamá', 
      icon: <Heart size={18}/>,
      title: 'Lo que nunca sabemos decir',
      desc: 'A veces las palabras se quedan cortas. Una canción que le diga lo valiosa que es, agradeciendo cada sacrificio y cada abrazo que nos trajo hasta aquí.',
      color: 'bg-pink-500'
    },
    { 
      id: 'hijo', 
      label: 'Para mis Hijos', 
      icon: <Baby size={18}/>,
      title: 'Su primera gran lección',
      desc: 'Un mensaje de aliento que puedan escuchar cuando duden, una canción que les recuerde que siempre seremos su refugio y su mayor fan.',
      color: 'bg-blue-500'
    },
    { 
      id: 'pareja', 
      label: 'Para mi Pareja', 
      icon: <Users size={18}/>,
      title: 'Nuestra Serie Favorita',
      desc: 'Aniversarios, bodas o simplemente porque sí. Celebra vuestra historia única con los detalles que solo vosotros conocéis.',
      color: 'bg-red-500'
    },
    { 
      id: 'maestro', 
      label: 'Maestros y Guías', 
      icon: <GraduationCap size={18}/>,
      title: 'Gracias por el camino',
      desc: 'A esos mentores que cambiaron nuestro rumbo. Un regalo grupal o personal que les demuestre que su enseñanza dejó huella eterna.',
      color: 'bg-emerald-500'
    },
    { 
      id: 'superacion', 
      label: 'Mí canción', 
      icon: <Trophy size={18}/>,
      title: 'Un himno a mi victoria',
      desc: 'Para esos momentos de superación personal. Una canción que te recuerde de donde vienes y hacia donde vas. Eres tu propio héroe.',
      color: 'bg-amber-500'
    }
  ];

  return (
    <div className="min-h-screen bg-[#FFFBF7] text-[#2D2D2D] font-sans selection:bg-[#FF6B00]/20">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&family=Playfair+Display:ital,wght@0,700;1,700&display=swap');
        
        .font-outfit { font-family: 'Outfit', sans-serif; }
        .font-playfair { font-family: 'Playfair Display', serif; }
        
        .text-brand-gradient {
          background: linear-gradient(135deg, #FF6B00 0%, #FF2D55 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

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

        .category-transition {
          transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .bg-silk {
           background: radial-gradient(circle at top right, rgba(255, 107, 0, 0.05), transparent),
                       radial-gradient(circle at bottom left, rgba(255, 45, 85, 0.05), transparent);
        }
      `}</style>

      {/* --- HERO: EMOCIÓN PURA Y LUZ --- */}
      <section className="relative min-h-[90vh] flex items-center justify-center pt-24 px-6 bg-silk overflow-hidden">
        <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
          <div className="space-y-10">
            <div className="inline-flex items-center gap-3 px-5 py-2 bg-white rounded-full shadow-sm border border-orange-100">
              <Sparkles className="w-4 h-4 text-[#FF6B00]" />
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#FF6B00] font-outfit">Boutique de Historias Musicales</span>
            </div>
            
            <h1 className="text-6xl md:text-8xl font-playfair leading-[1] text-[#1A1A1A]">
              Dile lo que <br /> sientes, <span className="italic text-[#FF2D55]">convertido</span> <br /> 
              en una <span className="text-[#FF6B00] font-bold">canción.</span>
            </h1>
            
            <p className="text-xl text-gray-500 font-outfit max-w-lg leading-relaxed">
              No es solo música. Es capturar ese sentimiento que las palabras no alcanzan, en un <span className="font-bold text-[#1A1A1A]">himno eterno</span> creado para honrar su vida.
            </p>

            <div className="flex flex-col sm:flex-row gap-5 pt-4">
              <button 
                onClick={() => navigate('/crear-cancion')}
                className="px-12 py-6 bg-brand-gradient text-white rounded-2xl font-outfit font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:scale-105 transition-all flex items-center justify-center gap-3"
              >
                Crear canción inolvidable <ArrowRight size={18} />
              </button>
              <button 
                onClick={() => document.getElementById('tags')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-12 py-6 bg-white text-gray-700 rounded-2xl font-outfit font-black text-xs uppercase tracking-[0.3em] border border-gray-100 shadow-sm hover:bg-gray-50 transition-all flex items-center justify-center gap-3"
              >
                ¿Para quién es?
              </button>
            </div>
          </div>

          <div className="relative group">
            <div className="absolute inset-0 bg-brand-gradient opacity-10 blur-[100px] rounded-full animate-pulse"></div>
            <div className="relative z-10 animate-float">
               <img 
                src="file:///C:/Users/LAPTOP-HP/.gemini/antigravity/brain/e46d2668-bc05-44e5-bd76-d803b3a84a54/mama_llorando_felicidad_cancion_1776729215826.png" 
                alt="Madre emocionada" 
                className="w-full h-auto rounded-[3rem] shadow-2xl skew-y-1 group-hover:skew-y-0 transition-transform duration-700"
               />
               <div className="absolute -bottom-8 -right-8 glass-premium p-8 rounded-3xl space-y-2 max-w-[280px]">
                  <Music className="text-[#FF2D55] mb-2" />
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Lo que sienten</p>
                  <p className="text-lg font-playfair italic">"Es el regalo más hermoso que me han dado jamás..."</p>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- SECCIÓN TAGS: PARA CADA ALMA --- */}
      <section id="tags" className="py-32 px-6 bg-white border-y border-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center space-y-4 mb-20">
            <h2 className="text-4xl md:text-6xl font-playfair text-[#1A1A1A]">Honra su historia, <span className="italic">sea cual sea.</span></h2>
            <p className="text-gray-400 font-outfit max-w-xl mx-auto">Selecciona a quién quieres sorprender y descubre por qué una canción es el tributo perfecto.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Nav de Tags */}
            <div className="lg:col-span-4 space-y-3">
              {tags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => setActiveTag(tag.id)}
                  className={`w-full flex items-center gap-4 p-6 rounded-2xl transition-all font-outfit font-bold text-sm ${activeTag === tag.id ? 'bg-white shadow-xl border-l-[6px] border-[#FF6B00] translate-x-3 text-[#1A1A1A]' : 'text-gray-400 hover:text-gray-600 grayscale opacity-60'}`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${tag.color}`}>{tag.icon}</div>
                  {tag.label}
                </button>
              ))}
            </div>

            {/* Contenido Dinámico */}
            <div className="lg:col-span-8">
              {tags.map((tag) => (
                <div key={tag.id} className={`glass-premium p-12 md:p-16 rounded-[3rem] space-y-8 category-transition ${activeTag === tag.id ? 'opacity-100 scale-100' : 'hidden opacity-0 scale-95'}`}>
                   <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white ${tag.color}`}>{tag.icon}</div>
                      <h3 className="text-3xl md:text-5xl font-playfair italic">{tag.title}</h3>
                   </div>
                   <p className="text-xl text-gray-500 leading-relaxed font-outfit">{tag.desc}</p>
                   <div className="pt-6">
                      <button 
                        onClick={() => navigate('/crear-cancion')}
                        className="flex items-center gap-3 text-[#FF6B00] font-black text-xs uppercase tracking-[0.3em] group"
                      >
                        Comenzar tributo <ArrowRight className="group-hover:translate-x-2 transition-transform" />
                      </button>
                   </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* --- SECCIÓN EMOCIONES: FOTOS GENERADAS --- */}
      <section className="py-32 px-6 bg-silk">
        <div className="max-w-6xl mx-auto space-y-32">
           {/* FOTO PADRE */}
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
              <div className="order-2 lg:order-1">
                <img 
                  src="file:///C:/Users/LAPTOP-HP/.gemini/antigravity/brain/e46d2668-bc05-44e5-bd76-d803b3a84a54/padre_escuchando_corrido_emocionado_1776729202451.png" 
                  alt="Padre orgulloso" 
                  className="w-full h-auto rounded-[3.5rem] shadow-2xl" 
                />
              </div>
              <div className="space-y-8 order-1 lg:order-2">
                 <h3 className="text-5xl font-playfair italic leading-tight">Dile que es tu <br /><span className="text-[#FF6B00] font-bold">héroe</span>, sin decir una palabra.</h3>
                 <p className="text-lg text-gray-500 font-outfit">
                    Un padre no olvida el momento en que sus hijos le honran por su valentía. Imagina su rostro escuchando un corrido o una balada dedicada a cada sacrificio que hizo por ti. Ese orgullo durará para siempre.
                 </p>
                 <div className="p-6 bg-white/50 rounded-2xl border border-white flex items-center gap-4 italic italic text-gray-600 font-playfair text-lg">
                    "Nunca antes me habían dado algo que realmente hablara de mi vida."
                 </div>
              </div>
           </div>

           {/* FOTO SUPERACIÓN */}
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
              <div className="space-y-8">
                 <h3 className="text-5xl font-playfair italic leading-tight">Tu propio <span className="text-emerald-500 font-bold">himno</span> de victoria.</h3>
                 <p className="text-lg text-gray-500 font-outfit">
                    A veces el regalo es para ti. Para recordar esa batalla que ganaste, ese sueño que alcanzaste o simplemente para recordarte que puedes con todo. Una canción de superación es combustible para tu alma.
                 </p>
                 <button onClick={() => navigate('/crear-cancion')} className="px-10 py-4 bg-emerald-500 text-white rounded-full font-outfit font-black text-xs uppercase tracking-widest shadow-xl">Crear mi himno</button>
              </div>
              <div>
                <img 
                  src="file:///C:/Users/LAPTOP-HP/.gemini/antigravity/brain/e46d2668-bc05-44e5-bd76-d803b3a84a54/joven_inspirada_cancion_superacion_1776729230296.png" 
                  alt="Superación personal" 
                  className="w-full h-auto rounded-[3.5rem] shadow-2xl" 
                />
              </div>
           </div>
        </div>
      </section>

      {/* --- EL REGALO PERFECTO (SIN TECNOLOGÍA) --- */}
      <section className="py-32 px-6 bg-[#1A1A1A] text-white rounded-[4rem] mx-6 mb-20 overflow-hidden relative">
         <div className="absolute inset-0 bg-brand-gradient opacity-10"></div>
         <div className="max-w-4xl mx-auto text-center space-y-12 relative z-10">
            <h2 className="text-5xl md:text-7xl font-playfair leading-tight italic">No es un regalo común, <br /> es <span className="text-orange-gradient">magia sonora.</span></h2>
            <p className="text-xl text-white/50 font-outfit max-w-2xl mx-auto">
              Cada canción es una pieza artesanal única. Desde la composición de la letra hasta el arreglo final, cuidamos cada nota para que sea indistinguible de un éxito mundial grabado en estudio.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
               <div className="p-8 bg-white/5 rounded-3xl border border-white/5">
                  <Star className="text-[#FF6B00] mb-4" size={32} />
                  <h4 className="font-bold font-outfit mb-2">Inspiración Pura</h4>
                  <p className="text-xs text-white/40 leading-relaxed font-outfit">Nuestros poetas dan forma a tus emociones de manera sublime.</p>
               </div>
               <div className="p-8 bg-white/5 rounded-3xl border border-white/5">
                  <Mic2 className="text-[#FF2D55] mb-4" size={32} />
                  <h4 className="font-bold font-outfit mb-2">Voz con Alma</h4>
                  <p className="text-xs text-white/40 leading-relaxed font-outfit">Voces humanas, cálidas y profesionales que transmiten el mensaje real.</p>
               </div>
               <div className="p-8 bg-white/5 rounded-3xl border border-white/5">
                  <CloudLightning className="text-blue-400 mb-4" size={32} />
                  <h4 className="font-bold font-outfit mb-2">Eternidad Digital</h4>
                  <p className="text-xs text-white/40 leading-relaxed font-outfit">Un archivo para toda la vida, listo para ser escuchado siempre.</p>
               </div>
            </div>
         </div>
      </section>

      {/* --- CTA FINAL --- */}
      <section className="py-40 px-6 text-center">
         <div className="max-w-4xl mx-auto space-y-12">
            <h2 className="text-6xl md:text-8xl font-playfair italic leading-[1] text-[#1A1A1A]">
              Haz que hoy <br /> <span className="text-brand-gradient">nunca se olvide.</span>
            </h2>
            <p className="text-xl text-gray-400 font-outfit max-w-xl mx-auto">
              Solo toma 5 minutos. Los resultados durarán toda una vida.
            </p>
            <button 
              onClick={() => navigate('/crear-cancion')}
              className="px-16 py-8 bg-brand-gradient text-white rounded-[2rem] font-outfit font-black text-sm uppercase tracking-[0.4em] shadow-[0_30px_60px_rgba(255,107,0,0.3)] hover:scale-105 transition-all flex items-center justify-center gap-4 mx-auto"
            >
              Comenzar mi canción <ArrowRight />
            </button>
         </div>
      </section>

      <footer className="py-16 border-t border-gray-100 text-center">
         <p className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-300 font-outfit">
           © 2026 Media Naranja • Masterpiece Studio • Made with Heart
         </p>
      </footer>
    </div>
  );
}
