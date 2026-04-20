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
  Clock, 
  ShieldCheck,
  ChevronDown,
  Gift,
  CloudLightning
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
    <div className="min-h-screen bg-[#050505] text-white overflow-hidden font-sans">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&family=Playfair+Display:ital,wght@0,700;1,700&display=swap');
        
        .font-outfit { font-family: 'Outfit', sans-serif; }
        .font-playfair { font-family: 'Playfair Display', serif; }
        
        .bg-orange-gradient {
          background: linear-gradient(135deg, #FF6B00 0%, #FF2D55 100%);
        }
        
        .text-orange-gradient {
          background: linear-gradient(135deg, #FF6B00 0%, #FF2D55 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .glass-card {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .floating {
          animation: floating 3s ease-in-out infinite;
        }

        @keyframes floating {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
          100% { transform: translateY(0px); }
        }

        .glow-button {
          box-shadow: 0 0 20px rgba(255, 107, 0, 0.3);
          transition: all 0.3s ease;
        }
        
        .glow-button:hover {
          box-shadow: 0 0 40px rgba(255, 107, 0, 0.6);
          transform: scale(1.05);
        }
      `}</style>

      {/* --- HERO SECTION: EL GANCHO EMOCIONAL --- */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 px-6">
        {/* Orbes de luz decorativos */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#FF6B00]/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#FF2D55]/10 blur-[120px] rounded-full"></div>

        <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10">
              <Sparkles className="w-4 h-4 text-[#FF6B00]" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60 font-outfit">Lanzamiento Exclusivo • Media Naranja</span>
            </div>
            
            <h1 className="text-6xl md:text-8xl font-playfair leading-[0.9] italic">
              ¿Cómo suena tu <br />
              <span className="text-orange-gradient">historia de amor?</span>
            </h1>
            
            <p className="text-lg md:text-xl text-white/50 font-outfit max-w-lg leading-relaxed">
              Las flores se marchitan, los perfumes se acaban... <br />
              Regala un <span className="text-white font-bold">himno eterno</span> creado exclusivamente para esa persona especial.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button 
                onClick={() => navigate('/crear-cancion')}
                className="px-10 py-5 bg-orange-gradient rounded-full font-outfit font-black text-xs uppercase tracking-[0.2em] glow-button flex items-center justify-center gap-3"
              >
                Crear mi canción ahora <ArrowRight size={18} />
              </button>
              <button 
                onClick={() => {
                  const el = document.getElementById('demo');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-10 py-5 bg-white/5 hover:bg-white/10 rounded-full font-outfit font-black text-xs uppercase tracking-[0.2em] border border-white/10 transition-all flex items-center justify-center gap-3"
              >
                <Play size={18} fill="white" /> Escuchar ejemplo
              </button>
            </div>

            <div className="flex items-center gap-6 pt-4 text-white/40 font-outfit text-[11px] font-bold uppercase tracking-widest">
              <div className="flex items-center gap-2"><CheckCircle2 className="text-[#FF6B00] w-4 h-4" /> Calidad de Estudio</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="text-[#FF2D55] w-4 h-4" /> Entrega inmediata</div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-orange-gradient opacity-20 blur-[80px] rounded-full floating"></div>
            <div className="glass-card p-4 rounded-[3rem] relative z-10 floating">
              <img 
                src="https://images.unsplash.com/photo-1516280440614-37939bbacd81?q=80&w=2070&auto=format&fit=crop" 
                alt="Romantic Music Studio" 
                className="w-full h-auto rounded-[2.5rem] shadow-2xl grayscale-[20%] hover:grayscale-0 transition-all duration-700"
              />
              <div className="absolute -bottom-6 -left-6 glass-card p-6 rounded-2xl flex items-center gap-4 shadow-2xl">
                 <div className="w-12 h-12 bg-orange-gradient rounded-full flex items-center justify-center">
                    <Mic2 className="text-white" />
                 </div>
                 <div>
                    <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Mastering</p>
                    <p className="text-sm font-bold font-outfit">Voz e Instrumentos Pro</p>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- SECCIÓN MOFO / FOMO: POR QUÉ NO PUEDES FALLAR ESTA VEZ --- */}
      <section className="py-32 px-6 bg-[#080808] relative">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h2 className="text-3xl md:text-5xl font-playfair italic underline decoration-[#FF6B00]/40 underline-offset-8">
            No seas otro regalo en el fondo del cajón
          </h2>
          <p className="text-lg text-white/40 font-outfit max-w-2xl mx-auto italic">
            El 85% de los regalos de aniversario se olvidan en menos de un año. Una canción personalizada es la única forma de garantizar que tu historia de amor se escuche generación tras generación.
          </p>
        </div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
          <div className="glass-card p-10 rounded-[2rem] space-y-6 hover:translate-y-[-10px] transition-all duration-500">
             <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-[#FF6B00]">
                <CloudLightning size={32} />
             </div>
             <h3 className="text-xl font-bold font-outfit">Impacto Psicológico</h3>
             <p className="text-sm text-white/40 leading-relaxed font-outfit">
               La música activa las zonas de memoria emocional más profundas. Escuchar su propia historia hará que asocie tu amor con felicidad pura para siempre.
             </p>
          </div>
          <div className="glass-card p-10 rounded-[2rem] space-y-6 bg-white/5 border-white/20 transform scale-105 shadow-2xl">
             <div className="w-16 h-16 bg-[#FF6B00]/20 rounded-2xl flex items-center justify-center text-[#FF6B00]">
                <Gift size={32} />
             </div>
             <h3 className="text-xl font-bold font-outfit">Exclusividad Extrema</h3>
             <p className="text-sm text-white/60 leading-relaxed font-outfit">
               Nadie más en el planeta tendrá este regalo. Es una pieza única de arte sonoro que solo existe para ustedes dos.
             </p>
          </div>
          <div className="glass-card p-10 rounded-[2rem] space-y-6 hover:translate-y-[-10px] transition-all duration-500">
             <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-[#FF2D55]">
                <Star size={32} />
             </div>
             <h3 className="text-xl font-bold font-outfit">Efecto WOW Garantizado</h3>
             <p className="text-sm text-white/40 leading-relaxed font-outfit">
               Hemos visto lágrimas de alegría, abrazos infinitos y compromisos sellados por una canción. El nivel de detalle es simplemente imbatible.
             </p>
          </div>
        </div>
      </section>

      {/* --- SECCIÓN DEMO: LA PRUEBA DE CALIDAD --- */}
      <section id="demo" className="py-32 px-6">
        <div className="max-w-6xl mx-auto glass-card rounded-[4rem] p-12 md:p-24 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-orange-gradient opacity-10 blur-[100px] pointer-events-none"></div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
            <div className="space-y-8">
              <h2 className="text-5xl font-playfair leading-tight italic">
                ¿Aún tienes dudas? <br />
                <span className="text-orange-gradient">Escucha la magia</span>
              </h2>
              <p className="text-lg text-white/50 font-outfit">
                No usamos voces robóticas. Nuestras canciones tienen alma, ritmo y una calidez profesional que te hará erizar la piel.
              </p>
              
              <div className="space-y-4">
                 {[
                   "Voz profesional femenina o masculina",
                   "Letras escritas por poetas e IA artesana",
                   "Arreglos musicales de nivel internacional",
                   "Archivo digital HD listo para compartir"
                 ].map((item, i) => (
                   <div key={i} className="flex items-center gap-3 text-sm font-outfit font-bold">
                      <div className="w-5 h-5 rounded-full bg-[#FF6B00]/20 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-[#FF6B00]"></div>
                      </div>
                      {item}
                   </div>
                 ))}
              </div>
            </div>

            <div className="bg-black/40 rounded-[2rem] p-8 border border-white/5 shadow-inner">
               <div className="flex items-center justify-between mb-10">
                  <div className="flex items-center gap-4">
                     <div className="w-16 h-16 bg-orange-gradient rounded-xl flex items-center justify-center">
                        <Music className="text-white" size={32} />
                     </div>
                     <div>
                        <p className="font-bold text-lg font-outfit">Un Amor Eterno</p>
                        <p className="text-xs text-white/40 uppercase tracking-widest font-bold">Pop Acústico / Romántico</p>
                     </div>
                  </div>
                  <div className="text-[#FF6B00] animate-pulse">
                     <Sparkles />
                  </div>
               </div>

               <div className="space-y-8">
                  {/* Waveform Mockup */}
                  <div className="h-24 flex items-end gap-1 px-4">
                     {[...Array(30)].map((_, i) => (
                       <div 
                        key={i} 
                        className="flex-1 bg-white/5 rounded-t-full transition-all hover:bg-[#FF6B00]/50"
                        style={{ height: `${Math.random() * 100}%` }}
                       ></div>
                     ))}
                  </div>
                  
                  <button className="w-full py-6 bg-white text-black rounded-full font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-orange-gradient hover:text-white transition-all duration-500">
                     <Play size={24} fill="currentColor" /> Reproducir Demo
                  </button>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- SECCIÓN DE OBJECIONES: EL EXPERTO QUE ELIMINA EL MIEDO --- */}
      <section className="py-32 px-6 bg-[#050505]">
        <div className="max-w-5xl mx-auto space-y-20">
          <div className="text-center">
             <h2 className="text-4xl font-playfair italic">Dudas frecuentes (Resueltas)</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-16">
             <div className="space-y-4">
                <h4 className="flex items-center gap-3 text-lg font-bold font-outfit">
                   <ShieldCheck className="text-[#FF6B00]" /> ¿Qué pasa si no soy bueno escribiendo?
                </h4>
                <p className="text-sm text-white/40 leading-relaxed">
                  No te preocupes. Tú solo nos das los momentos clave (vuestra primera cita, ese chiste interno) y nuestra IA Boutique redacta una letra poética que suena 100% a vosotros.
                </p>
             </div>
             <div className="space-y-4">
                <h4 className="flex items-center gap-3 text-lg font-bold font-outfit">
                   <ShieldCheck className="text-[#FF6B00]" /> ¿Cómo recibo mi canción?
                </h4>
                <p className="text-sm text-white/40 leading-relaxed">
                  Recibes un enlace exclusivo y un archivo MP3 en alta calidad directamente en tu perfil. Listo para reproducir en una cena romántica o enviar por WhatsApp.
                </p>
             </div>
             <div className="space-y-4">
                <h4 className="flex items-center gap-3 text-lg font-bold font-outfit">
                   <ShieldCheck className="text-[#FF6B00]" /> ¿La canción suena real o robótica?
                </h4>
                <p className="text-sm text-white/40 leading-relaxed">
                  Usamos los motores de audio más avanzados del mundo (Suno v3.5 Pro), garantizando voces humanas con emoción, respiraciones reales y armonías profesionales.
                </p>
             </div>
             <div className="space-y-4">
                <h4 className="flex items-center gap-3 text-lg font-bold font-outfit">
                   <ShieldCheck className="text-[#FF6B00]" /> ¿Es un regalo seguro para impactar?
                </h4>
                <p className="text-sm text-white/40 leading-relaxed">
                  Totalmente. Es el regalo con mayor tasa de éxito emocional. Es virtualmente imposible no emocionar a alguien cuando escucha su vida convertida en una obra de arte.
                </p>
             </div>
          </div>
        </div>
      </section>

      {/* --- CTA FINAL: EL CIERRE DE VENTAS --- */}
      <section className="py-40 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-orange-gradient opacity-10 blur-[150px]"></div>
        
        <div className="max-w-4xl mx-auto text-center space-y-12 relative z-10">
          <div className="inline-block p-4 rounded-full bg-white/5 border border-white/10 floating">
             <Heart className="w-8 h-8 text-[#FF2D55]" fill="#FF2D55" />
          </div>
          
          <h2 className="text-5xl md:text-7xl font-playfair italic leading-tight">
            Hoy es el día para ser <br />
            <span className="text-orange-gradient">inolvidable</span>
          </h2>
          
          <p className="text-xl text-white/50 max-w-xl mx-auto font-outfit">
             No dejes para mañana el detalle que puede cambiar vuestra relación para siempre.
          </p>

          <button 
            onClick={() => navigate('/crear-cancion')}
            className="px-16 py-8 bg-orange-gradient rounded-full font-outfit font-black text-sm uppercase tracking-[0.4em] glow-button group flex items-center justify-center gap-4 mx-auto"
          >
            Quiero mi canción personalizada <ArrowRight className="group-hover:translate-x-2 transition-transform" />
          </button>

          <div className="pt-10 flex items-center justify-center gap-8 text-white/20">
             <div className="flex flex-col items-center gap-1">
                <ShieldCheck size={20} />
                <span className="text-[10px] font-bold uppercase tracking-widest">Seguro</span>
             </div>
             <div className="flex flex-col items-center gap-1">
                <Clock size={20} />
                <span className="text-[10px] font-bold uppercase tracking-widest">Rápido</span>
             </div>
             <div className="flex flex-col items-center gap-1">
                <Heart size={20} />
                <span className="text-[10px] font-bold uppercase tracking-widest">Eterno</span>
             </div>
          </div>
        </div>
      </section>

      <footer className="py-10 border-t border-white/5 text-center px-6">
        <p className="text-white/20 text-[10px] font-bold uppercase tracking-[0.4em] font-outfit">
          © 2026 Media Naranja • Masterpiece Music Studio • Made for Lovers
        </p>
      </footer>
    </div>
  );
}
