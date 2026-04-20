import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, ShoppingCart, Star, Heart, ArrowRight, Expand } from 'lucide-react';

const PRODUCTS = [
  {
    id: 1,
    name: "Cuadro Eternidad Minimalista",
    category: "Moderno",
    price: 890,
    image: "/cuadro_recuerdo_moderno_lujo_1776643644757.png",
    rating: 5,
    tag: "Más Vendido"
  },
  {
    id: 2,
    name: "Collage Historias de Amor",
    category: "Romántico",
    price: 1250,
    image: "/cuadro_recuerdo_collage_romantic_1776643659226.png",
    rating: 5,
    tag: "Premium"
  },
  {
    id: 3,
    name: "Marco Clásico 'Nuestra Fecha'",
    category: "Clásico",
    price: 750,
    image: "https://images.unsplash.com/photo-1544450610-ad587c6a946e?q=80&w=2670&auto=format&fit=crop",
    rating: 4,
    tag: "Nuevo"
  },
  {
    id: 4,
    name: "Cuadro Abstracto Familiar",
    category: "Contemporáneo",
    price: 1100,
    image: "https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?q=80&w=2680&auto=format&fit=crop",
    rating: 5,
    tag: ""
  }
];

export default function MemoryGallery() {
  const [activeCategory, setActiveCategory] = useState("Todos");
  const categories = ["Todos", "Moderno", "Romántico", "Clásico", "Contemporáneo"];

  const filteredProducts = activeCategory === "Todos" 
    ? PRODUCTS 
    : PRODUCTS.filter(p => p.category === activeCategory);

  return (
    <div className="min-h-screen bg-blush-50 pb-20">
      {/* Hero Section Corto */}
      <div className="relative h-[40vh] overflow-hidden bg-ink-950 flex items-center justify-center">
        <img 
          src="https://images.unsplash.com/photo-1513519245088-0e12902e5a38?q=80&w=2670&auto=format&fit=crop" 
          className="absolute inset-0 w-full h-full object-cover opacity-40"
          alt="Galería de arte"
        />
        <div className="relative text-center z-10 px-6">
          <span className="text-naranja-400 font-bold tracking-[0.3em] uppercase text-xs mb-4 block animate-slide-up">Catálogo Exclusivo</span>
          <h1 className="text-5xl md:text-7xl text-white font-serif mb-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>Galería de <span className="italic text-blush-200">Recuerdos</span></h1>
          <p className="text-blush-100/70 max-w-xl mx-auto font-light animate-slide-up" style={{ animationDelay: '0.2s' }}>Inmortaliza tus momentos más valiosos en lienzos y marcos diseñados para durar toda la vida.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 -mt-12 relative z-20">
        {/* Barra de Filtros y Búsqueda */}
        <div className="bg-white/80 backdrop-blur-xl p-4 md:p-6 rounded-[2.5rem] shadow-2xl border border-white/50 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all whitespace-nowrap ${
                  activeCategory === cat 
                  ? 'bg-naranja-500 text-white shadow-lg shadow-naranja-200' 
                  : 'bg-blush-50 text-blush-600 hover:bg-blush-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-blush-300" size={18} />
            <input 
              type="text" 
              placeholder="Buscar cuadro..." 
              className="w-full bg-blush-50 border border-blush-100 rounded-full py-3 pl-12 pr-6 outline-none focus:ring-2 focus:ring-naranja-400 transition-all text-sm font-medium"
            />
          </div>
        </div>

        {/* Grid de Productos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 mt-16 px-2">
          {filteredProducts.map((product) => (
            <div key={product.id} className="group relative flex flex-col animate-slide-up" style={{ animationDelay: `${product.id * 0.1}s` }}>
              {/* Contenedor de Imagen */}
              <div className="relative aspect-[4/5] overflow-hidden rounded-[2.5rem] bg-white shadow-xl hover:shadow-2xl transition-all duration-700">
                <img 
                  src={product.image} 
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                />
                
                {/* Overlay de acciones hover */}
                <div className="absolute inset-0 bg-ink-950/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center gap-3">
                  <button className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-ink-900 hover:bg-naranja-500 hover:text-white transition-all transform translate-y-4 group-hover:translate-y-0 duration-500 shadow-lg">
                    <Expand size={20} />
                  </button>
                  <button className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-ink-900 hover:bg-naranja-500 hover:text-white transition-all transform translate-y-4 group-hover:translate-y-0 duration-500 delay-75 shadow-lg">
                    <Heart size={20} />
                  </button>
                </div>

                {/* Badge de Tag */}
                {product.tag && (
                  <div className="absolute top-6 left-6 px-4 py-1.5 bg-naranja-500 text-white text-[10px] font-bold uppercase tracking-widest rounded-full shadow-lg">
                    {product.tag}
                  </div>
                )}
              </div>

              {/* Info del Producto */}
              <div className="mt-6 px-2">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-xs font-bold text-naranja-600 uppercase tracking-widest mb-1">{product.category}</p>
                    <h3 className="text-2xl font-serif text-blush-800 group-hover:text-naranja-600 transition-colors">{product.name}</h3>
                  </div>
                  <div className="flex items-center gap-1 text-amber-500">
                    <Star size={14} fill="currentColor" />
                    <span className="text-xs font-bold">{product.rating}.0</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-ink-400 font-bold uppercase tracking-wider">Desde</span>
                    <span className="text-2xl font-bold text-ink-900">${product.price} <span className="text-xs text-ink-400">MXN</span></span>
                  </div>
                  <button className="flex items-center gap-2 px-6 py-3 bg-blush-800 text-white rounded-2xl font-bold text-sm hover:bg-naranja-600 transition-all shadow-lg hover:shadow-naranja-200/50">
                    Personalizar <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Banner de Calidad */}
      <div className="max-w-7xl mx-auto px-6 mt-32">
        <div className="bg-blush-800 rounded-[3rem] p-12 md:p-20 relative overflow-hidden flex flex-col md:flex-row items-center gap-12">
          <div className="relative z-10 md:w-1/2">
            <h2 className="text-4xl md:text-5xl text-white font-serif mb-6">Calidad de <span className="italic text-blush-200">Museo</span> en tu Hogar</h2>
            <p className="text-blush-100/70 mb-8 leading-relaxed">Cada recuerdo es impreso en papel fine-art y enmarcado a mano por artesanos expertos. Utilizamos vidrios con máxima protección UV para que tus momentos no pierdan brillo.</p>
            <div className="flex gap-10">
              <div className="text-white">
                <p className="text-3xl font-bold mb-1">100%</p>
                <p className="text-xs text-blush-300 font-bold uppercase tracking-widest">Artesanal</p>
              </div>
              <div className="text-white">
                <p className="text-3xl font-bold mb-1">50+</p>
                <p className="text-xs text-blush-300 font-bold uppercase tracking-widest">Estilos</p>
              </div>
            </div>
          </div>
          <div className="md:w-1/2 relative">
            <div className="absolute inset-0 bg-naranja-500 rounded-full blur-[100px] opacity-20"></div>
            <img 
              src="https://images.unsplash.com/photo-1544450610-ad587c6a946e?q=80&w=2670&auto=format&fit=crop" 
              className="relative z-10 w-full h-80 object-cover rounded-3xl shadow-2xl"
              alt="Detalle de enmarcado"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
