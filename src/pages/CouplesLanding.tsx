import { Link, useNavigate } from 'react-router-dom';
import { Music, Heart, ArrowRight, Sparkles, Star, CheckCircle2 } from 'lucide-react';
import Footer from '../components/Footer';

export default function CouplesLanding() {
  const navigate = useNavigate();

  const handleStart = () => {
    localStorage.removeItem('mn_draft_song');
    navigate('/crear-cancion?category=parejas');
  };

  return (
    <div className="min-h-screen bg-[#FFFBF7] font-outfit selection:bg-pink-200">
      
      {/* HERO SECTION */}
      <section className="relative pt-24 pb-20 px-6 overflow-hidden">
        <div className="absolute top-0 right-0 -mr-32 -mt-32 w-[500px] h-[500px] bg-pink-100/50 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -ml-32 -mb-32 w-[500px] h-[500px] bg-orange-100/50 rounded-full blur-[100px] pointer-events-none"></div>
        
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
          <div className="space-y-8 order-2 lg:order-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-pink-50 text-pink-600 rounded-full border border-pink-100 text-[10px] font-black uppercase tracking-widest mx-auto lg:mx-0">
              <Heart size={14} fill="currentColor" /> El Regalo de Aniversario Definitivo
            </div>
            
            <h1 className="text-5xl md:text-7xl font-playfair leading-[1.1] text-[#1A1A1A]">
              Haz que se enamore <br className="hidden md:block"/>
              de ti otra vez con <br />
              <span className="italic text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-rose-400">su propia canción.</span>
            </h1>
            
            <p className="text-lg md:text-xl text-gray-600 leading-relaxed max-w-lg mx-auto lg:mx-0">
              Imagina su rostro al escuchar su historia real cantada en una canción profesional. Es mejor que mil cartas, peluches o rosas. Es un recuerdo eterno.
            </p>

            <button 
              onClick={handleStart}
              className="w-full sm:w-auto px-12 py-6 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-pink-500/30 hover:scale-105 hover:shadow-pink-500/50 transition-all flex items-center justify-center gap-3 mx-auto lg:mx-0"
            >
              Crear nuestra canción <ArrowRight size={20} />
            </button>
            
            <div className="flex items-center justify-center lg:justify-start gap-4 text-xs font-bold text-gray-500 uppercase tracking-widest pt-4">
              <span className="flex items-center gap-1"><CheckCircle2 size={14} className="text-emerald-500"/> Calidad de Radio</span>
              <span className="flex items-center gap-1"><CheckCircle2 size={14} className="text-emerald-500"/> Lista en 3 minutos</span>
            </div>
          </div>
          
          <div className="order-1 lg:order-2 relative group">
            <div className="absolute -inset-4 bg-gradient-to-tr from-pink-200 to-orange-200 blur-2xl opacity-40 rounded-full pointer-events-none"></div>
            <img 
              src="/pareja-amor.png" 
              alt="Pareja emocionada escuchando su canción" 
              className="relative z-10 w-full max-w-md mx-auto rounded-[3rem] shadow-2xl border-4 border-white rotate-2 hover:rotate-0 transition-transform duration-500"
            />
            
            {/* Flotante 1 */}
            <div className="absolute top-10 -left-6 md:-left-12 glass-premium p-4 rounded-2xl shadow-xl z-20 flex items-center gap-3 animate-float delay-100">
              <div className="w-10 h-10 rounded-full bg-pink-100 text-pink-500 flex items-center justify-center shrink-0">
                <Music size={18} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Estilo Musical</p>
                <p className="text-sm font-bold text-[#1A1A1A]">Balada Romántica</p>
              </div>
            </div>

            {/* Flotante 2 */}
            <div className="absolute -bottom-6 -right-4 md:-right-8 glass-premium p-4 rounded-2xl shadow-xl z-20 flex items-center gap-2 animate-float">
               <div className="flex text-amber-400">
                 <Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" />
               </div>
               <p className="text-xs font-bold text-[#1A1A1A] ml-2">"No paraba de llorar"</p>
            </div>
          </div>
        </div>
      </section>

      {/* SECCIÓN: QUÉ INCLUIR */}
      <section className="py-24 px-6 bg-white relative">
        <div className="max-w-4xl mx-auto text-center space-y-16">
          <div className="space-y-4">
            <h2 className="text-4xl md:text-5xl font-playfair font-bold text-[#1A1A1A]">
              Tu historia. <span className="italic text-pink-500">Sus lágrimas.</span>
            </h2>
            <p className="text-gray-500 text-lg">
              Solo necesitas contarnos los pequeños detalles que los hacen únicos. Naranjín los convertirá en poesía musical.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            {[
              { title: "El primer cruce de miradas", desc: "¿Dónde estaban? ¿Qué llevaban puesto? ¿Qué sentiste al verle?" },
              { title: "Esa fecha inolvidable", desc: "Su aniversario, el día del primer beso, o esa madrugada platicando." },
              { title: "Sus chistes locales", desc: "Esas frases o apodos divertidos que solo ustedes dos entienden." },
              { title: "Los obstáculos superados", desc: "La distancia, los miedos, todo lo que vencieron para estar juntos." }
            ].map((item, i) => (
              <div key={i} className="p-8 rounded-3xl bg-[#FFFBF7] border border-orange-100 hover:shadow-xl hover:shadow-pink-100 transition-all group">
                <div className="w-12 h-12 bg-pink-50 text-pink-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Sparkles size={24} />
                </div>
                <h3 className="text-xl font-bold text-[#1A1A1A] mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
          
          <button 
            onClick={handleStart}
            className="px-10 py-5 bg-[#1A1A1A] text-white rounded-2xl font-bold text-sm uppercase tracking-widest shadow-xl hover:bg-gray-800 transition-colors mx-auto flex items-center justify-center gap-3"
          >
            Comenzar mi sorpresa <Heart size={16} fill="currentColor" />
          </button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
