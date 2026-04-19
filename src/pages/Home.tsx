import { Heart, Sparkles, Star, Users, Baby, HandHeart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="relative overflow-hidden bg-white">
      {/* Hero Section - Master Atelier */}
      <section className="relative min-h-[85vh] md:min-h-[90vh] flex items-center justify-center overflow-hidden pt-10 md:pt-20">
        <div className="absolute inset-0 z-0">
          <img 
            src="/hero-boutique.png" 
            alt="Boutique Media Naranja" 
            className="w-full h-full object-cover opacity-100 scale-105 animate-float"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-ink-950/90 via-ink-950/50 to-white/10"></div>
        </div>

        <div className="container mx-auto px-6 relative z-10 text-center animate-slide-up">
          <span className="inline-flex items-center gap-2 px-6 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-white text-[10px] md:text-[11px] font-bold uppercase tracking-[0.4em] mb-8 shadow-2xl">
            <Sparkles size={14} className="text-naranja-300" /> El Arte de Regalar Emociones
          </span>
          <h1 className="text-5xl md:text-[8.5rem] font-serif text-white mb-6 drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)] leading-none tracking-tight hero-text-mobile">
            Eterniza tu <br />
            <span className="text-gradient italic">Historia</span>
          </h1>
          <p className="text-white text-lg md:text-3xl font-light max-w-4xl mx-auto mb-10 leading-relaxed drop-shadow-[0_5px_10px_rgba(0,0,0,0.5)]">
            Joyas de satín, melodías personalizadas y recuerdos que viven para siempre.
          </p>
          <div className="flex flex-col md:flex-row items-center justify-center gap-4">
            <a 
              href="#categorias"
              className="w-full md:w-auto px-10 md:px-16 py-5 md:py-7 bg-naranja-500 text-white rounded-2xl md:rounded-3xl font-bold text-lg md:text-xl tracking-[0.2em] hover:bg-naranja-600 active:scale-95 transition-all shadow-[0_20px_50px_rgba(249,115,22,0.4)]"
            >
              INGRESAR A LA BOUTIQUE
            </a>
          </div>
        </div>
      </section>

      {/* Target Audiences */}
      <section className="py-20 bg-blush-50/50 relative overflow-hidden">
        <div className="container mx-auto px-6 text-center">
          <div className="animate-slide-up">
            <h2 className="text-3xl md:text-5xl font-serif text-blush-800 mb-4">Regalos para <span className="italic text-naranja-600">cada historia</span></h2>
            <p className="text-ink-600/60 font-light text-sm md:text-base mb-12">Selecciona para quién es este momento especial:</p>
          </div>
          <div className="flex flex-wrap justify-center gap-4 md:gap-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            {[
              { icon: <Heart size={18} />, label: "Parejas" },
              { icon: <HandHeart size={18} />, label: "Papá y Mamá" },
              { icon: <Users size={18} />, label: "Amigos" },
              { icon: <Baby size={18} />, label: "Niños" },
              { icon: <Sparkles size={18} />, label: "Abuelos" }
            ].map((target, i) => (
              <button key={i} className="flex items-center gap-2 px-8 py-4 bg-white rounded-full border border-blush-100 shadow-sm hover:border-naranja-200 active:scale-95 transition-all text-blush-800 font-bold text-xs md:text-sm group">
                <span className="text-naranja-300 group-hover:text-naranja-500 transition-colors">{target.icon}</span>
                {target.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section id="categorias" className="py-20 md:py-32 bg-white relative">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-7xl font-serif text-blush-800 mb-6">Nuestras <span className="text-naranja-500 italic">Colecciones</span></h2>
            <div className="w-20 h-1 bg-naranja-200 mx-auto rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Category: Eternal Roses */}
            <div className="group animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <div className="bg-white rounded-[2.5rem] md:rounded-[3rem] overflow-hidden shadow-xl border border-blush-50 hover:border-naranja-200 transition-all hover:-translate-y-3 flex flex-col h-full active:scale-[0.98]">
                <div className="relative h-56 md:h-64 overflow-hidden">
                   <img src="/rosas-boutique.png" alt="Rosas Eternas" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                   <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                </div>
                <div className="p-8 md:p-10 text-center flex flex-col flex-1">
                  <h3 className="text-2xl md:text-3xl font-serif text-blush-800 mb-4">Rosas Eternas</h3>
                  <p className="text-ink-600/70 font-light mb-8 flex-1 text-sm md:text-base">
                    Cada pétalo hecho artesanalmente con listón de satín vibrante.
                  </p>
                  <button className="py-4 border-2 border-blush-100 text-blush-600 rounded-2xl font-bold tracking-widest hover:bg-naranja-500 hover:text-white transition-all uppercase text-[10px] md:text-xs">
                    Elegir mi Ramo
                  </button>
                </div>
              </div>
            </div>

            {/* Category: Personalized Songs */}
            <div className="group animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <div className="bg-white rounded-[2.5rem] md:rounded-[3rem] overflow-hidden shadow-2xl border border-naranja-100 hover:border-naranja-300 transition-all hover:-translate-y-3 flex flex-col h-full md:scale-105 z-10 active:scale-[0.98]">
                <div className="relative h-56 md:h-64 overflow-hidden">
                   <img src="/papa-sorpresa.png" alt="Canciones de Autor" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                   <div className="absolute inset-0 bg-gradient-to-t from-naranja-950/60 to-transparent"></div>
                </div>
                <div className="p-8 md:p-10 text-center flex flex-col flex-1">
                  <h3 className="text-2xl md:text-3xl font-serif text-blush-800 mb-4">Canciones de Autor</h3>
                  <p className="text-ink-600/70 font-light mb-8 flex-1 text-sm md:text-base">
                    Sorprende con una melodía que cuenta su vida.
                  </p>
                  <button 
                    onClick={() => navigate('/crear-cancion')}
                    className="py-4 bg-naranja-500 text-white rounded-2xl font-bold tracking-widest hover:bg-naranja-600 shadow-xl uppercase text-[10px] md:text-xs"
                  >
                    Hacerlo Inolvidable
                  </button>
                </div>
              </div>
            </div>

            {/* Category: Frames */}
            <div className="group animate-slide-up" style={{ animationDelay: '0.3s' }}>
              <div className="bg-white rounded-[2.5rem] md:rounded-[3rem] overflow-hidden shadow-xl border border-blush-50 hover:border-naranja-200 transition-all hover:-translate-y-3 flex flex-col h-full active:scale-[0.98]">
                <div className="relative h-56 md:h-64 overflow-hidden">
                   <img src="https://images.pexels.com/photos/563067/pexels-photo-563067.jpeg?auto=compress&cs=tinysrgb&h=800" alt="Galería de Recuerdos" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                   <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                </div>
                <div className="p-8 md:p-10 text-center flex flex-col flex-1">
                  <h3 className="text-2xl md:text-3xl font-serif text-blush-800 mb-4">Galería de Recuerdos</h3>
                  <p className="text-ink-600/70 font-light mb-8 flex-1 text-sm md:text-base">
                    Tus fotos en plantillas de diseño editoriales premium.
                  </p>
                  <button className="py-4 border-2 border-blush-100 text-blush-600 rounded-2xl font-bold tracking-widest hover:bg-naranja-500 hover:text-white transition-all uppercase text-[10px] md:text-xs">
                    Diseñar mi Cuadro
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 md:py-32 bg-ink-950 text-white">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl md:text-7xl font-serif text-center mb-24">Testimonios de <span className="text-gradient">Corazón</span></h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { name: "Andrés G.", rel: "Esposo", text: "Lloramos juntos al escucharla. Nunca imaginé algo tan profesional." },
              { name: "Lucía M.", rel: "Hija", text: "El regalo perfecto para mamá. Es lo más tierno que he visto." },
              { name: "Roberto F.", rel: "Novio", text: "La calidad es impresionante. Lograron captar mi sentimiento." }
            ].map((t, i) => (
              <div key={i} className="glass-dark p-8 md:p-12 rounded-[2.5rem] border-white/5">
                <div className="flex gap-1 mb-8">
                  {[...Array(5)].map((_, i) => <Star key={i} size={14} fill="currentColor" className="text-naranja-500" />)}
                </div>
                <p className="text-lg md:text-xl font-light italic mb-8">"{t.text}"</p>
                <div className="flex items-center gap-4 border-t border-white/10 pt-8">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-naranja-500 to-blush-600 flex items-center justify-center font-bold">
                    {t.name[0]}
                  </div>
                  <div>
                    <h5 className="font-bold text-white text-sm md:text-base">{t.name}</h5>
                    <span className="text-[10px] text-white/40 uppercase tracking-widest">{t.rel}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <div className="bg-blush-50 rounded-[3rem] p-10 md:p-24 text-center border border-blush-100 premium-shadow">
            <h2 className="text-4xl md:text-8xl font-serif text-blush-800 mb-8">Haz <span className="italic text-naranja-500">historia</span></h2>
            <button 
              onClick={() => navigate('/crear-cancion')}
              className="w-full md:w-auto px-10 md:px-16 py-5 md:py-7 bg-gradient-to-r from-naranja-500 to-naranja-600 text-white rounded-2xl md:rounded-3xl font-bold text-lg md:text-xl shadow-2xl active:scale-95 transition-all"
            >
              COMENZAR <Heart size={20} fill="white" className="ml-4 inline" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
