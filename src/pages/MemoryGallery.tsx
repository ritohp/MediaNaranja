import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Play, Plus, ThumbsUp, Heart, ArrowRight, Camera, Monitor, Image as ImageIcon, Info } from 'lucide-react';

const CATALOG_STYLES = [
  {
    id: 'amorflix',
    title: "Amorflix Original",
    subtitle: "Sobre los mejores momentos de nuestra historia",
    category: "Cinema Style",
    price: 1290,
    primaryColor: "#E50914",
    image: "/media__1776644053916.png",
    badge: "TOP 1",
    description: "Diseño clásico de plataforma de streaming con cuadrícula de momentos favoritos."
  },
  {
    id: 'namorix',
    title: "Namorix Cinema",
    subtitle: "Historias de Amor",
    category: "Player Style",
    price: 1150,
    primaryColor: "#E50914",
    image: "/media__1776644053676.png",
    badge: "VORTEX",
    description: "Estilo reproductor de video con barra de tiempo y controles de reproducción."
  },
  {
    id: 'netflix-gold',
    title: "Netflix Moments",
    subtitle: "Mejores Parejas del Mundo",
    category: "Premium Dashboard",
    price: 1450,
    primaryColor: "#E50914",
    image: "/media__1776644053702.png",
    badge: "SPECIAL",
    description: "Interfaz completa con héroe de impacto y secciones de 'Populares' y 'Tendencias'."
  }
];

export default function MemoryGallery() {
  return (
    <div className="min-h-screen bg-[#141414] text-white font-sans pb-20">
      {/* 🎬 HERO CINEMATOGRÁFICO */}
      <div className="relative h-[85vh] w-full flex items-end pb-24 px-6 md:px-16 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=2670&auto=format&fit=crop" 
            className="w-full h-full object-cover opacity-60"
            alt="Hero Background"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/40 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-[#141414] via-transparent to-transparent"></div>
        </div>

        <div className="relative z-10 max-w-2xl animate-slide-up">
          <div className="flex items-center gap-2 mb-4">
            <span className="bg-[#E50914] text-white text-[10px] font-black px-1.5 py-0.5 rounded-sm">N</span>
            <span className="text-gray-400 font-bold tracking-[0.3em] text-[10px] uppercase">Original de Media Naranja</span>
          </div>
          <h1 className="text-6xl md:text-8xl font-black mb-6 tracking-tighter uppercase italic leading-none">
            Nuestra <br/><span className="text-[#E50914]">Historia</span>
          </h1>
          <p className="text-lg text-gray-300 mb-8 font-medium leading-relaxed">
            Convierte tus fotos en la mejor serie de la historia. El regalo perfecto para quienes protagonizan tu vida cada día.
          </p>
          
          <div className="flex flex-wrap gap-4">
            <Link to="/personalizar-cuadro?style=amorflix" className="flex items-center gap-3 px-8 py-3 bg-white text-black rounded-md font-bold hover:bg-white/90 transition-all scale-105">
              <Play fill="black" size={20} /> Empezar Ahora
            </Link>
          </div>
        </div>
      </div>

      <div className="px-6 md:px-16 -mt-20 relative z-20 space-y-16">
        <div>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            Explorar Estilos "Cinema" <ArrowRight className="text-[#E50914]" size={20} />
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {CATALOG_STYLES.map((style) => (
              <div key={style.id} className="group relative bg-[#181818] rounded-lg overflow-hidden transition-all duration-500 hover:scale-105 hover:z-30 shadow-2xl">
                <div className="aspect-video relative overflow-hidden">
                  <img src={style.image} alt={style.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#181818] to-transparent opacity-60"></div>
                  <div className="absolute top-4 left-4 w-10 h-10 bg-red-600 flex flex-col items-center justify-center font-black rounded-sm shadow-lg text-[10px]">
                    <span className="text-[8px] opacity-70">TOP</span>
                    <span className="text-lg">10</span>
                  </div>
                </div>

                <div className="p-6 text-left">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex gap-2">
                       <Link to={`/personalizar-cuadro?style=${style.id}`} className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-black hover:bg-gray-200 transition-all"><Play size={18} fill="black"/></Link>
                       <button className="w-10 h-10 border-2 border-gray-500 rounded-full flex items-center justify-center text-white hover:border-white transition-all"><Plus size={18}/></button>
                       <button className="w-10 h-10 border-2 border-gray-500 rounded-full flex items-center justify-center text-white hover:border-white transition-all"><ThumbsUp size={18}/></button>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-1">{style.title}</h3>
                  <p className="text-gray-400 text-sm mb-4 line-clamp-2">{style.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs font-bold">
                        <span className="text-green-500">98% para ti</span>
                        <span className="text-gray-400">Desde ${style.price} MXN</span>
                    </div>
                  </div>
                  <Link to={`/personalizar-cuadro?style=${style.id}`} className="w-full mt-6 py-4 bg-[#E50914] text-white rounded-md font-black tracking-widest hover:brightness-110 transition-all uppercase inline-block text-center text-xs">
                    Personalizar mi Serie
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

