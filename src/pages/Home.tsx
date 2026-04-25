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
  Gift
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

      {/* --- 1. SECCIÓN ESPECIAL: DÍA DE LAS MADRES --- */}
      <section className="py-20 px-6 relative overflow-hidden bg-gradient-to-b from-[#FFFBF7] to-[#FDF2F4] border-b border-pink-50">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="order-2 lg:order-1 space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-pink-50 text-pink-500 rounded-full border border-pink-100 text-[10px] font-black uppercase tracking-widest">
              Edición Especial 10 de Mayo
            </div>
            <h2 className="text-6xl md:text-8xl font-playfair leading-[1] text-[#1A1A1A]">
              Para ella, <br />
              <span className="italic text-[#FF2D55]">lo eterno.</span>
            </h2>
            <p className="text-xl text-gray-500 font-outfit leading-relaxed max-w-lg">
              Las flores se marchitan, pero una canción que narra su amor es un tesoro que ella guardará en su alma para siempre. Dile "gracias" con la melodía que se merece.
            </p>
            <button 
              onClick={() => navigate('/crear-cancion')}
              className="w-full sm:w-auto px-12 py-6 bg-[#FF2D55] text-white rounded-2xl font-outfit font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:shadow-pink-200 transition-all flex items-center justify-center gap-3"
            >
              Crear canción para Mamá <Heart size={18} />
            </button>
          </div>
          <div className="order-1 lg:order-2 relative group">
            <div className="absolute -inset-4 bg-pink-200/20 blur-3xl rounded-full"></div>
            <img 
              src="/madre-emocionada.png" 
              alt="Mamá emocionada" 
              className="relative z-10 w-full h-auto rounded-[3rem] shadow-2xl border-4 border-white animate-float"
            />
            <div className="absolute -bottom-8 -right-8 glass-premium p-8 rounded-3xl space-y-2 max-w-[280px] z-20">
               <p className="text-lg font-playfair italic">"Es el regalo más hermoso que me han dado jamás..."</p>
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
              onClick={() => navigate('/crear-cancion')}
              className="w-full sm:w-auto px-10 py-5 bg-[#FF6B00] text-white rounded-2xl font-outfit font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-[#E66000] transition-all flex items-center justify-center gap-3"
            >
              Comenzar nuestra historia <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* --- 3. SECCIÓN: PADRES (HÉROES) --- */}
      <section className="py-32 px-6 bg-silk border-b border-blush-50">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="order-2 lg:order-1 space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full border border-blue-100 text-[10px] font-black uppercase tracking-widest">
              Tributo a Papá
            </div>
            <h2 className="text-5xl md:text-7xl font-playfair leading-[1.1] text-[#1A1A1A]">
              Dile que es <br />
              <span className="text-blue-600 font-bold italic">tu héroe.</span>
            </h2>
            <p className="text-xl text-gray-500 font-outfit leading-relaxed">
              Para el hombre que lo dio todo sin pedir nada. Un corrido o una balada que guarde para siempre el orgullo de ser su hijo y el honor de su apellido.
            </p>
            <div className="p-8 bg-white/80 backdrop-blur rounded-3xl shadow-sm border border-blue-50 italic text-gray-600 font-playfair text-xl">
               "Es la primera vez que siento que mi vida se convirtió en arte."
            </div>
            <button 
              onClick={() => navigate('/crear-cancion')}
              className="w-full sm:w-auto px-10 py-5 bg-blue-600 text-white rounded-2xl font-outfit font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-3"
            >
              Crear tributo para Papá <User size={18} />
            </button>
          </div>
          <div className="order-1 lg:order-2">
            <img 
              src="/padre-emocionado.png" 
              alt="Padre orgulloso" 
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
              onClick={() => navigate('/crear-cancion')}
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
              onClick={() => navigate('/crear-cancion')}
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

      {/* --- CTA FINAL --- */}
      <section className="py-40 px-6 text-center bg-white border-t border-gray-50">
         <div className="max-w-4xl mx-auto space-y-12">
            <h2 className="text-6xl md:text-8xl font-playfair italic leading-[1] text-[#1A1A1A]">
              Tu vida <br /> <span className="text-gradient">hecha canción.</span>
            </h2>
            <button 
              onClick={() => navigate('/crear-cancion')}
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
