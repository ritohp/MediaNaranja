import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Music, 
  Heart, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  Star, 
  User, 
  Users,
  Baby,
  Gift,
  MessageSquare,
  ShieldCheck
} from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Home() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, []);

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

        .text-gradient {
          background: linear-gradient(135deg, #FF6B00 0%, #FF2D55 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          color: transparent;
        }
      `}</style>

      {/* --- 1. SECCIÓN ESPECIAL: DÍA DEL PADRE --- */}
      <section className="py-20 px-6 relative overflow-hidden bg-gradient-to-b from-[#FFFBF7] to-[#F0F7FF] border-b border-blue-50">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="order-2 lg:order-1 space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full border border-blue-100 text-[10px] font-black uppercase tracking-widest">
              Edición Especial Día del Padre
            </div>
            <h2 className="text-6xl md:text-8xl font-playfair leading-[1] text-[#1A1A1A]">
              Para el rey de la casa, <br />
              <span className="italic text-blue-600">su legado.</span>
            </h2>
            <p className="text-xl text-gray-500 font-outfit leading-relaxed max-w-lg">
              Las corbatas pasan de moda y los relojes se olvidan, pero una canción que narre su vida y sacrificios es un tesoro que guardará en el alma para siempre. Dile "gracias" con la melodía que se merece.
            </p>
            <button 
              onClick={() => { localStorage.removeItem('mn_draft_song'); navigate('/crear-cancion'); }}
              className="w-full sm:w-auto px-12 py-6 bg-blue-600 text-white rounded-2xl font-outfit font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:shadow-blue-200 transition-all flex items-center justify-center gap-3"
            >
              Crear canción para Papá <User size={18} />
            </button>
          </div>
          <div className="order-1 lg:order-2 relative group">
            <div className="absolute -inset-4 bg-blue-200/20 blur-3xl rounded-full"></div>
            <img 
              src="/papa-sorpresa.png" 
              alt="Papá emocionado" 
              className="relative z-10 w-full h-auto rounded-[3rem] shadow-2xl border-4 border-white animate-float"
            />
            <div className="absolute -bottom-8 -right-8 glass-premium p-8 rounded-3xl space-y-2 max-w-[280px] z-20">
               <p className="text-lg font-playfair italic">"Es el mejor regalo que me han dado jamás..."</p>
            </div>
          </div>
        </div>
      </section>

      {/* --- 2. SECCIÓN: HISTORIAS DE AMOR (PAREJAS) --- */}
      <section className="py-32 px-6 bg-white border-b border-orange-50">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="relative group">
            <div className="absolute -inset-10 bg-orange-100/30 blur-[80px] rounded-full"></div>
            <img 
              src="/pareja-amor.png" 
              alt="Historia de Amor" 
              className="relative z-10 w-full h-auto rounded-[4rem] shadow-2xl transform -rotate-2 hover:rotate-0 transition-transform duration-500"
            />
          </div>
          <div className="space-y-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-orange-50 text-orange-600 rounded-full border border-orange-100 text-[10px] font-black uppercase tracking-widest">
              Historias de Amor
            </div>
            <h2 className="text-5xl md:text-7xl font-playfair leading-[1.1] text-[#1A1A1A]">
              Nuestra vida <br />
              <span className="text-[#FF6B00] font-bold">cantada.</span>
            </h2>
            <p className="text-xl text-gray-500 font-outfit leading-relaxed">
              Celebra ese momento mágico donde vuestras vidas se cruzaron. Convierte vuestros secretos, viajes y promesas en una balada o un ritmo que defina vuestra unión.
            </p>
            <div className="space-y-4">
              {["Letras basadas en vuestros momentos reales", "Producción boutique personalizada", "Un detalle que redefine el romance"].map((t, i) => (
                <div key={i} className="flex items-center gap-3 text-gray-600 font-outfit font-medium">
                  <CheckCircle2 size={16} className="text-[#FF6B00]" /> {t}
                </div>
              ))}
            </div>
            <button 
              onClick={() => { localStorage.removeItem('mn_draft_song'); navigate('/crear-cancion'); }}
              className="w-full sm:w-auto px-10 py-5 bg-[#FF6B00] text-white rounded-2xl font-outfit font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-[#E66000] transition-all flex items-center justify-center gap-3"
            >
              Comenzar nuestra historia <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* --- 3. SECCIÓN: TRIBUTO A MAMÁ --- */}
      <section className="py-32 px-6 bg-silk border-b border-pink-50">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="order-2 lg:order-1 space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-pink-50 text-pink-500 rounded-full border border-pink-100 text-[10px] font-black uppercase tracking-widest">
              Tributo a Mamá
            </div>
            <h2 className="text-5xl md:text-7xl font-playfair leading-[1.1] text-[#1A1A1A]">
              Dile que es <br />
              <span className="text-pink-500 font-bold italic">tu heroína.</span>
            </h2>
            <p className="text-xl text-gray-500 font-outfit leading-relaxed">
              Las flores se marchitan, pero una canción que narre su amor es un tesoro que guardará en su alma para siempre. Sorpréndela con la melodía que se merece.
            </p>
            <div className="p-8 bg-white/80 backdrop-blur rounded-3xl shadow-sm border border-pink-50 italic text-gray-600 font-playfair text-xl">
               "Lloré de emoción al escuchar mi historia hecha arte."
            </div>
            <button 
              onClick={() => { localStorage.removeItem('mn_draft_song'); navigate('/crear-cancion'); }}
              className="w-full sm:w-auto px-10 py-5 bg-[#FF2D55] text-white rounded-2xl font-outfit font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-[#E6284C] transition-all flex items-center justify-center gap-3"
            >
              Crear tributo para Mamá <Heart size={18} />
            </button>
          </div>
          <div className="order-1 lg:order-2">
            <img 
              src="/madre-emocionada.png" 
              alt="Madre orgullosa" 
              className="w-full h-auto rounded-[3.5rem] shadow-2xl border-4 border-white" 
            />
          </div>
        </div>
      </section>

      {/* --- 4. SECCIÓN: NIÑOS (CANCIÓN DE CUNA) --- */}
      <section className="py-32 px-6 bg-white border-b border-indigo-50 overflow-hidden">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="relative group">
            <div className="absolute -inset-20 bg-indigo-100/30 blur-[100px] rounded-full"></div>
            <img 
              src="/bebe-cuna.png" 
              alt="Canción de Cuna" 
              className="relative z-10 w-full h-auto rounded-[5rem] shadow-2xl animate-float"
            />
          </div>
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full border border-indigo-100 text-[10px] font-black uppercase tracking-widest">
              Sueños de Amor
            </div>
            <h2 className="text-5xl md:text-7xl font-playfair leading-[1.1] text-[#1A1A1A]">
              Su primera <br />
              <span className="text-indigo-400 font-bold italic">canción de cuna.</span>
            </h2>
            <p className="text-xl text-gray-500 font-outfit leading-relaxed">
              Personaliza su descanso con una melodía que incluya su nombre y el significado de su llegada. El arrullo perfecto para que sepa, desde el primer día, que es el centro de tu mundo.
            </p>
            <div className="flex flex-wrap gap-3">
              {["Incluye su nombre", "Fecha de nacimiento", "Significado especial"].map((tag, i) => (
                <span key={i} className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold font-outfit">{tag}</span>
              ))}
            </div>
            <button 
              onClick={() => { localStorage.removeItem('mn_draft_song'); navigate('/crear-cancion'); }}
              className="w-full sm:w-auto px-10 py-5 bg-indigo-400 text-white rounded-2xl font-outfit font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-indigo-500 transition-all flex items-center justify-center gap-3"
            >
              Crear arrullo mágico <Baby size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* --- 5. SECCIÓN: HERMANOS Y AMIGOS --- */}
      <section className="py-32 px-6 bg-silk">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 text-[10px] font-black uppercase tracking-widest">
              Cómplices de Vida
            </div>
            <h2 className="text-5xl md:text-7xl font-playfair leading-[1.1] text-[#1A1A1A]">
              Hermanos y <br />
              <span className="text-emerald-500 font-bold">amigos.</span>
            </h2>
            <p className="text-xl text-gray-500 font-outfit leading-relaxed">
              Para quienes conocen tus mejores historias porque las vivieron contigo. Celebra esa lealtad incondicional con una canción llena de anécdotas, risas y gratitud.
            </p>
            <button 
              onClick={() => { localStorage.removeItem('mn_draft_song'); navigate('/crear-cancion'); }}
              className="w-full sm:w-auto px-10 py-5 bg-emerald-500 text-white rounded-2xl font-outfit font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-emerald-600 transition-all flex items-center justify-center gap-3"
            >
              Sorprender a mi cómplice <Users size={18} />
            </button>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-emerald-100/20 blur-[60px] rounded-full"></div>
            <img 
              src="/amigos-hermanos.png" 
              alt="Hermanos y Amigos" 
              className="relative z-10 w-full h-auto rounded-[3.5rem] shadow-2xl border-4 border-white" 
            />
          </div>
        </div>
      </section>

      {/* --- SECCIÓN: CÓMO FUNCIONA --- */}
      <section className="py-32 px-6 bg-gradient-to-b from-white to-[#FFFBF7]">
        <div className="max-w-6xl mx-auto space-y-20">
          <div className="text-center space-y-6">
            <h2 className="text-5xl md:text-6xl font-playfair leading-[1.1] text-[#1A1A1A]">
              Cómo funciona crear una canción en <br /> <span className="text-naranja-500 italic">Media Naranja MX</span>
            </h2>
            <p className="text-xl text-gray-500 font-outfit max-w-2xl mx-auto">
              Nuestro compositor Naranjín te guiará paso a paso para extraer los mejores recuerdos y convertirlos en arte.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative z-10">
            {/* Paso 1 */}
            <div className="glass-premium p-10 rounded-[2.5rem] space-y-6 relative hover:-translate-y-2 transition-transform duration-300">
              <div className="w-16 h-16 rounded-full bg-orange-50 flex items-center justify-center text-orange-500 shadow-sm border border-orange-100">
                <MessageSquare size={28} />
                <Sparkles size={14} className="absolute top-8 right-8 text-orange-400" />
              </div>
              <h3 className="text-2xl font-playfair font-bold text-[#1A1A1A]">Una conversación <span className="italic text-orange-500">interactiva</span></h3>
              <p className="text-gray-500 font-outfit leading-relaxed">
                Nuestro compositor Naranjín no usa cuestionarios repetitivos. Escucha tus respuestas en tiempo real y te hace preguntas de seguimiento personalizadas acordes a las anécdotas y detalles que compartes.
              </p>
            </div>

            {/* Paso 2 */}
            <div className="glass-premium p-10 rounded-[2.5rem] space-y-6 relative hover:-translate-y-2 transition-transform duration-300 delay-100">
              <div className="w-16 h-16 rounded-full bg-pink-50 flex items-center justify-center text-pink-500 shadow-sm border border-pink-100">
                <Music size={28} />
              </div>
              <h3 className="text-2xl font-playfair font-bold text-[#1A1A1A]">Co-creación <br/><span className="italic text-pink-500">desde el corazón</span></h3>
              <p className="text-gray-500 font-outfit leading-relaxed">
                Nuestro compositor Naranjín toma tus propias palabras, emociones y vivencias para entrelazarlas en una composición musical única y hecha a la medida, adaptada al estilo sonoro que imaginas.
              </p>
            </div>

            {/* Paso 3 */}
            <div className="glass-premium p-10 rounded-[2.5rem] space-y-6 relative hover:-translate-y-2 transition-transform duration-300 delay-200">
              <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 shadow-sm border border-emerald-100">
                <ShieldCheck size={28} />
              </div>
              <h3 className="text-2xl font-playfair font-bold text-[#1A1A1A]">Hasta 3 pruebas <span className="italic text-emerald-500">sin riesgo</span></h3>
              <p className="text-gray-500 font-outfit leading-relaxed">
                Recibe un demo de tu canción. Si sientes que le falta algún detalle o quieres explorar un enfoque diferente, puedes generar hasta 3 demos distintos gratis. Solo desbloqueas la versión completa si te encanta.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- CTA FINAL --- */}
      <section className="py-40 px-6 text-center bg-white border-t border-gray-50">
         <div className="max-w-4xl mx-auto space-y-12">
            <h2 className="text-6xl md:text-8xl font-playfair italic leading-[1] text-[#1A1A1A]">
              Tu vida <br /> <span className="text-gradient">hecha canción.</span>
            </h2>
            <button 
              onClick={() => { localStorage.removeItem('mn_draft_song'); navigate('/crear-cancion'); }}
              className="px-16 py-8 bg-brand-gradient text-white rounded-full font-outfit font-black text-sm uppercase tracking-[0.4em] shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-4 mx-auto"
            >
              Comenzar mi canción <ArrowRight />
            </button>
         </div>
      </section>

      <footer className="py-16 text-center border-t border-gray-50">
         <p className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-300 font-outfit">
           © 2026 Media Naranja • Masterpiece Studio
         </p>
      </footer>
    </div>
  );
}
