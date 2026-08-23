import { Link, useNavigate } from 'react-router-dom';
import { Music, Heart, ArrowRight, Sparkles, Star, CheckCircle2, Play, BookOpen } from 'lucide-react';

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
        
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 md:gap-16 items-center relative z-10">
          <div className="lg:col-span-5 space-y-6 md:space-y-8 order-2 lg:order-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-pink-50 text-pink-600 rounded-full border border-pink-100 text-[10px] font-black uppercase tracking-widest mx-auto lg:mx-0">
              <Heart size={14} fill="currentColor" /> El Regalo de Aniversario Definitivo
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-playfair font-bold leading-[1.1] text-[#1A1A1A] tracking-tight">
              Toda pareja tiene <br className="hidden md:block"/>
              su canción especial... <br />
              <span className="italic font-normal text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-rose-400">La suya será inédita.</span>
            </h1>
            
            <p className="text-base md:text-lg text-gray-600 leading-relaxed max-w-sm mx-auto lg:mx-0">
              ¿Recuerdas esa melodía que se dedicaron? Ahora imagina su emoción al escuchar una canción creada especialmente que cante <strong>exactamente cómo se conocieron y lo que han vivido.</strong>
            </p>

            <button 
              onClick={handleStart}
              className="w-full sm:w-auto px-12 py-6 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-pink-500/30 hover:scale-105 hover:shadow-pink-500/50 transition-all flex items-center justify-center gap-3 mx-auto lg:mx-0"
            >
              Crear nuestra canción <ArrowRight size={20} />
            </button>
            
            {/* Reproductor Demo Separado */}
            <div className="pt-6">
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-3">Escucha un ejemplo real:</p>
              <div className="bg-white p-3 rounded-2xl shadow-lg border border-pink-100 flex items-center gap-4 max-w-sm mx-auto lg:mx-0">
                <button className="w-12 h-12 bg-pink-50 text-pink-500 rounded-full flex items-center justify-center shrink-0 hover:bg-pink-100 transition-colors">
                  <Play size={20} className="ml-1" fill="currentColor" />
                </button>
                <div className="flex-1 text-left">
                  <p className="text-sm font-bold text-gray-800">"El Café de la Condesa"</p>
                  <p className="text-xs text-gray-500">Balada Romántica</p>
                </div>
                <div className="flex text-amber-400 pr-2">
                 <Star size={12} fill="currentColor" /><Star size={12} fill="currentColor" /><Star size={12} fill="currentColor" /><Star size={12} fill="currentColor" /><Star size={12} fill="currentColor" />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center lg:justify-start gap-4 text-xs font-bold text-gray-500 uppercase tracking-widest pt-4">
              <span className="flex items-center gap-1"><CheckCircle2 size={14} className="text-emerald-500"/> Calidad de Radio</span>
              <span className="flex items-center gap-1"><CheckCircle2 size={14} className="text-emerald-500"/> Lista en 3 minutos</span>
            </div>
          </div>
          
          <div className="lg:col-span-7 order-1 lg:order-2 relative group w-full flex justify-center lg:justify-end">
            <div className="absolute -inset-4 bg-gradient-to-tr from-pink-200 to-orange-200 blur-2xl opacity-40 rounded-full pointer-events-none"></div>
            <img 
              src="/pareja-joven.png" 
              alt="Pareja joven enamorada escuchando su canción" 
              className="relative z-10 w-full max-w-[280px] sm:max-w-md lg:max-w-lg xl:max-w-xl mx-auto lg:mr-0 rounded-[3rem] shadow-2xl border-4 border-white rotate-2 hover:rotate-0 transition-transform duration-500"
            />
            
            {/* Flotante 1 (Ahora mejor posicionado y más sutil) */}
            <div className="absolute top-10 -left-6 md:-left-8 glass-premium p-3 rounded-2xl shadow-xl z-20 flex items-center gap-3 animate-float delay-100 bg-white/90 backdrop-blur border border-pink-50">
              <div className="w-8 h-8 rounded-full bg-pink-100 text-pink-500 flex items-center justify-center shrink-0">
                <Heart size={14} fill="currentColor" />
              </div>
              <div className="pr-2">
                <p className="text-[9px] font-black uppercase text-gray-400 tracking-wider">Reacción</p>
                <p className="text-xs font-bold text-[#1A1A1A]">"No paraba de llorar"</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECCIÓN: CÓMO FUNCIONA */}
      <section className="py-20 px-6 bg-pink-50/50 border-y border-pink-100">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-playfair font-bold text-[#1A1A1A]">
              La magia ocurre en <span className="italic text-pink-500">3 pasos</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Línea conectora (solo desktop) */}
            <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-[2px] bg-gradient-to-r from-pink-200 via-pink-400 to-pink-200 opacity-50"></div>

            {/* Paso 1 */}
            <div className="relative flex flex-col items-center text-center space-y-4 group">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-pink-500 shadow-xl border border-pink-100 group-hover:scale-110 transition-transform relative z-10">
                <span className="absolute -top-2 -right-2 w-8 h-8 bg-[#1A1A1A] text-white text-xs font-black rounded-full flex items-center justify-center shadow-lg">1</span>
                <Heart size={32} fill="currentColor" />
              </div>
              <h3 className="text-xl font-bold text-[#1A1A1A]">Test de 2 Minutos</h3>
              <p className="text-gray-500 text-sm leading-relaxed max-w-[250px]">
                Cuéntale a nuestra IA los detalles íntimos de su historia a través de un test rápido, fácil y ultra-personalizado.
              </p>
            </div>

            {/* Paso 2 */}
            <div className="relative flex flex-col items-center text-center space-y-4 group">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-pink-500 shadow-xl border border-pink-100 group-hover:scale-110 transition-transform relative z-10">
                <span className="absolute -top-2 -right-2 w-8 h-8 bg-[#1A1A1A] text-white text-xs font-black rounded-full flex items-center justify-center shadow-lg">2</span>
                <BookOpen size={32} />
              </div>
              <h3 className="text-xl font-bold text-[#1A1A1A]">Aprueba la Letra</h3>
              <p className="text-gray-500 text-sm leading-relaxed max-w-[250px]">
                Naranjín compondrá una letra profunda y emotiva. Podrás revisarla, pedir ajustes y darle tu visto bueno.
              </p>
            </div>

            {/* Paso 3 */}
            <div className="relative flex flex-col items-center text-center space-y-4 group">
              <div className="w-24 h-24 bg-gradient-to-br from-pink-500 to-rose-500 rounded-full flex items-center justify-center text-white shadow-xl group-hover:scale-110 transition-transform relative z-10 shadow-pink-500/40">
                <span className="absolute -top-2 -right-2 w-8 h-8 bg-[#1A1A1A] text-white text-xs font-black rounded-full flex items-center justify-center shadow-lg">3</span>
                <Music size={32} />
              </div>
              <h3 className="text-xl font-bold text-[#1A1A1A]">Magia Pura</h3>
              <p className="text-gray-500 text-sm leading-relaxed max-w-[250px]">
                ¡Listo! Se crea tu canción con música profesional. <strong>Solo pagas hasta el final, y solo si te hizo sentir un nudo en la garganta.</strong>
              </p>
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


    </div>
  );
}
