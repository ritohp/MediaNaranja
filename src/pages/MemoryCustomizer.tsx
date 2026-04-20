import { useState, useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Camera, Upload, ArrowLeft, CheckCircle2, ChevronRight, Layout, Type, Calendar as CalendarIcon, Info, Sparkles } from 'lucide-react';

export default function MemoryCustomizer() {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const styleId = queryParams.get('style') || 'amorflix';

  // ESTADO DE PERSONALIZACIÓN
  const [names, setNames] = useState("Tu Nombre & Su Nombre");
  const [date, setDate] = useState("2024");
  const [synopsis, setSynopsis] = useState("Miro a los ojos y mi mundo se detuvo, fue extraño como empezó todo quería ir allí de nuevo...");
  const [mainPhoto, setMainPhoto] = useState<string | null>(null);
  const [step, setStep] = useState(1); // 1: Edición, 2: Revisión

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setMainPhoto(url);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pt-20">
      <div className="max-w-[1600px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        {/* ⬅️ COLUMNA IZQUIERDA: PANEL DE CONTROL (EDICIÓN) */}
        <div className="lg:col-span-4 space-y-8 pb-20">
          <Link to="/galeria-recuerdos" className="inline-flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest mb-4">
            <ArrowLeft size={14} /> Volver al catálogo
          </Link>

          <header>
            <h1 className="text-4xl font-serif mb-2 italic">Personaliza tu <span className="text-[#E50914]">Obra</span></h1>
            <p className="text-gray-400 text-sm">Estás editando el estilo: <span className="text-white font-bold uppercase tracking-widest">{styleId}</span></p>
          </header>

          <div className="space-y-6">
            {/* SUBIR FOTO */}
            <div className="bg-[#181818] p-6 rounded-3xl border border-white/5">
              <h3 className="text-sm font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                <Camera size={16} className="text-[#E50914]" /> 1. Sube tu foto principal
              </h3>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-full aspect-video bg-[#222] rounded-2xl border-2 border-dashed border-gray-700 flex flex-col items-center justify-center cursor-pointer hover:border-[#E50914] transition-all group overflow-hidden relative"
              >
                {mainPhoto ? (
                  <>
                    <img src={mainPhoto} className="absolute inset-0 w-full h-full object-cover opacity-70" alt="Preview" />
                    <div className="relative z-10 bg-black/50 p-2 rounded-lg backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity">
                        <Upload size={20} />
                    </div>
                  </>
                ) : (
                  <>
                    <Upload className="text-gray-500 mb-2 group-hover:text-[#E50914] transition-colors" size={32} />
                    <p className="text-[10px] uppercase font-bold tracking-widest text-gray-400">Artes o clic para subir</p>
                  </>
                )}
                <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} className="hidden" accept="image/*" />
              </div>
            </div>

            {/* TEXTOS */}
            <div className="bg-[#181818] p-6 rounded-3xl border border-white/5 space-y-6">
              <h3 className="text-sm font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                <Type size={16} className="text-[#E50914]" /> 2. Personaliza los Textos
              </h3>
              
              <div className="space-y-2">
                <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Nombres de la pareja</label>
                <input 
                  type="text" 
                  value={names}
                  onChange={(e) => setNames(e.target.value)}
                  className="w-full bg-[#111] border border-gray-800 rounded-xl px-4 py-4 focus:ring-2 focus:ring-[#E50914] outline-none text-sm transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Año / Fecha "Juntos desde"</label>
                <input 
                  type="text" 
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  placeholder="Ej. 2015"
                  className="w-full bg-[#111] border border-gray-800 rounded-xl px-4 py-4 focus:ring-2 focus:ring-[#E50914] outline-none text-sm transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Sinopsis / Mensaje Especial</label>
                <textarea 
                  value={synopsis}
                  onChange={(e) => setSynopsis(e.target.value)}
                  rows={4}
                  className="w-full bg-[#111] border border-gray-800 rounded-xl px-4 py-4 focus:ring-2 focus:ring-[#E50914] outline-none text-sm transition-all resize-none"
                ></textarea>
              </div>
            </div>

            <button className="w-full py-5 bg-[#E50914] text-white rounded-2xl font-black tracking-[0.2em] shadow-xl shadow-red-900/20 hover:brightness-110 transition-all uppercase flex items-center justify-center gap-3">
              Confirmar Diseño <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* 📺 COLUMNA DERECHA: PREVIEW EN TIEMPO REAL (EL CUADRO) */}
        <div className="lg:col-span-8 sticky top-24 h-fit">
          <div className="relative aspect-[3/4] md:aspect-video w-full max-w-4xl mx-auto bg-black rounded-[2rem] shadow-2xl overflow-hidden border border-white/10 group">
            
            {/* FONDO IMAGEN (La foto del usuario) */}
            <div className="absolute inset-0">
               {mainPhoto ? (
                 <img src={mainPhoto} className="w-full h-full object-cover animate-in fade-in duration-700" alt="Main" />
               ) : (
                 <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex flex-col items-center justify-center text-gray-600 italic">
                    <Sparkles size={64} className="mb-4 opacity-20" />
                    <p>Sube una foto para ver la magia</p>
                 </div>
               )}
               {/* Degradado Cinematográfico */}
               <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
               <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent"></div>
            </div>

            {/* UI ESTILO NETFLIX INTERACTIVA */}
            <div className="absolute inset-x-0 bottom-0 p-8 md:p-16 space-y-4 md:space-y-6">
                
                {/* Logo y Tipo de Contenido */}
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-[#E50914] text-2xl md:text-3xl font-black tracking-tighter">N</span>
                    <span className="text-white/80 font-bold tracking-[0.4em] text-[10px] md:text-xs uppercase">Parejas</span>
                </div>

                {/* Título (Nombres) */}
                <h2 className="text-4xl md:text-7xl font-serif italic text-white drop-shadow-2xl leading-none">
                    {names}
                </h2>

                {/* MetaData */}
                <div className="flex items-center gap-4 text-xs md:text-sm font-bold">
                    <span className="text-[#46d369]">98% para ti</span>
                    <span className="text-white/60">{date}</span>
                    <span className="border border-white/40 px-1.5 py-0.5 rounded-sm text-[10px]">13+</span>
                    <span className="text-white/80">1º Gran Amor</span>
                    <span className="border border-white/40 px-1 rounded-sm text-[8px] font-black uppercase">HD</span>
                </div>

                {/* Top 10 Medalla */}
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-[#E50914] rounded-sm flex flex-col items-center justify-center font-black leading-none shadow-lg">
                        <span className="text-[6px] md:text-[8px] opacity-70">TOP</span>
                        <span className="text-sm md:text-lg">10</span>
                    </div>
                    <span className="text-sm md:text-xl font-bold italic">Top 1 de las parejas más enamoradas</span>
                </div>

                {/* Sinopsis */}
                <p className="text-sm md:text-lg text-white/80 max-w-2xl line-clamp-3 md:line-clamp-none leading-relaxed font-medium drop-shadow-md">
                    {synopsis}
                </p>

                {/* Botones UI */}
                <div className="flex items-center gap-3 pt-4">
                    <button className="flex items-center gap-2 px-6 md:px-10 py-3 md:py-4 bg-white text-black rounded-lg font-bold text-sm md:text-xl shadow-2xl"><Play size={20} fill="black" /> Tocar</button>
                    <button className="flex items-center gap-2 px-6 md:px-10 py-3 md:py-4 bg-gray-500/50 backdrop-blur-md text-white rounded-lg font-bold text-sm md:text-xl border border-white/10"><CheckCircle2 size={20} /> Favorito</button>
                    <div className="w-10 h-10 md:w-14 md:h-14 border-2 border-white/40 rounded-full flex items-center justify-center opacity-70"><Info size={24}/></div>
                </div>
            </div>

            {/* MARCA DE AGUA DEL STUDIO */}
            <div className="absolute top-8 right-8 text-white/20 text-[10px] font-bold tracking-[1em] uppercase -rotate-90 origin-right">
                Media Naranja Boutique
            </div>
          </div>

          {/* Tips de Producción */}
          <div className="mt-8 flex justify-center gap-8">
             <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div> Vista Previa en Vivo
             </div>
             <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                <Info size={14}/> Alta resolución al descargar
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}

function Play({ size, fill }: { size: number, fill: string }) {
    return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="6 3 20 12 6 21 6 3"/></svg>;
}
