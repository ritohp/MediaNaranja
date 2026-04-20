import { useState, useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Camera, Upload, ArrowLeft, CheckCircle2, ChevronRight, Play, Info, Search, Gift, Bell, ThumbsUp, ThumbsDown, Plus, Download, Printer } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export default function MemoryCustomizer() {
  const [names, setNames] = useState("Valentina & Alejandro");
  const [date, setDate] = useState("2018");
  const [synopsis, setSynopsis] = useState("Desde aquel café en la esquina, supe que nuestra historia sería mi serie favorita. Eres la dueña de esa mirada que es más de lo que podía imaginar, risueña, cariñosa y entrañable. Lo suficiente como para amar para siempre.");
  const [writtenBy, setWrittenBy] = useState("Alejandro");
  const [destinedTo, setDestinedTo] = useState("Valentina");
  
  const [mainPhoto, setMainPhoto] = useState<string | null>(null);
  const [galleryPhotos, setGalleryPhotos] = useState<(string | null)[]>([null, null, null, null, null]);
  
  const previewRef = useRef<HTMLDivElement>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, index?: number) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      if (index === undefined) {
        setMainPhoto(url);
      } else {
        const newGallery = [...galleryPhotos];
        newGallery[index] = url;
        setGalleryPhotos(newGallery);
      }
    }
  };

  const exportPDF = async () => {
    if (!previewRef.current) return;
    const canvas = await html2canvas(previewRef.current, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('l', 'mm', 'a4'); // Paisaje para este diseño
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`MediaNaranja_Recuerdo_${names}.pdf`);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white pt-20">
      <div className="max-w-[1700px] mx-auto px-6 grid grid-cols-1 xl:grid-cols-12 gap-10">
        
        {/* 🛠️ PANEL DE EDICIÓN (IZQUIERDA) */}
        <div className="xl:col-span-4 space-y-6 pb-20 max-h-[85vh] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-gray-800">
          <Link to="/galeria-recuerdos" className="inline-flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest">
            <ArrowLeft size={14} /> Volver al catálogo
          </Link>

          <div className="bg-[#111] p-8 rounded-[2.5rem] border border-white/5 space-y-8">
            <section>
              <h3 className="text-sm font-black uppercase tracking-[0.2em] mb-6 text-[#E50914]">1. Imagen Principal (Fondo)</h3>
              <div 
                onClick={() => document.getElementById('main-upload')?.click()}
                className="w-full aspect-video bg-[#1a1a1a] rounded-2xl border-2 border-dashed border-gray-700 flex flex-col items-center justify-center cursor-pointer hover:border-[#E50914] transition-all overflow-hidden relative group"
              >
                {mainPhoto ? (
                  <img src={mainPhoto} className="absolute inset-0 w-full h-full object-cover opacity-60" alt="Main Photo" />
                ) : (
                  <Upload className="text-gray-600 group-hover:text-[#E50914]" size={32} />
                )}
                <input type="file" id="main-upload" hidden onChange={(e) => handlePhotoUpload(e)} />
              </div>
            </section>

            <section>
              <h3 className="text-sm font-black uppercase tracking-[0.2em] mb-6 text-[#E50914]">2. Galería de Momentos (Abajo)</h3>
              <div className="grid grid-cols-5 gap-2">
                {galleryPhotos.map((photo, i) => (
                  <div 
                    key={i}
                    onClick={() => document.getElementById(`gallery-${i}`)?.click()}
                    className="aspect-square bg-[#1a1a1a] rounded-lg border border-gray-800 flex items-center justify-center cursor-pointer hover:border-[#E50914] overflow-hidden"
                  >
                    {photo ? <img src={photo} className="w-full h-full object-cover" alt="Moment" /> : <Camera size={16} className="text-gray-700" />}
                    <input type="file" id={`gallery-${i}`} hidden onChange={(e) => handlePhotoUpload(e, i)} />
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-sm font-black uppercase tracking-[0.2em] mb-2 text-[#E50914]">3. Contenido de la "Serie"</h3>
              <div className="space-y-4">
                <input type="text" value={names} onChange={(e) => setNames(e.target.value)} placeholder="Nombres" className="w-full bg-[#050505] border border-gray-800 rounded-xl px-4 py-3 focus:border-[#E50914] outline-none text-sm" />
                <input type="text" value={date} onChange={(e) => setDate(e.target.value)} placeholder="Año inicial" className="w-full bg-[#050505] border border-gray-800 rounded-xl px-4 py-3 focus:border-[#E50914] outline-none text-sm" />
                <textarea value={synopsis} onChange={(e) => setSynopsis(e.target.value)} rows={3} placeholder="Nuestra historia..." className="w-full bg-[#050505] border border-gray-800 rounded-xl px-4 py-3 focus:border-[#E50914] outline-none text-sm resize-none"></textarea>
                <div className="grid grid-cols-2 gap-4">
                  <input type="text" value={writtenBy} onChange={(e) => setWrittenBy(e.target.value)} placeholder="Escrito por" className="w-full bg-[#050505] border border-gray-800 rounded-xl px-4 py-3 focus:border-[#E50914] outline-none text-sm" />
                  <input type="text" value={destinedTo} onChange={(e) => setDestinedTo(e.target.value)} placeholder="Destinado a" className="w-full bg-[#050505] border border-gray-800 rounded-xl px-4 py-3 focus:border-[#E50914] outline-none text-sm" />
                </div>
              </div>
            </section>

            <button onClick={exportPDF} className="w-full py-5 bg-white text-black rounded-2xl font-black tracking-widest hover:bg-gray-200 transition-all flex items-center justify-center gap-3">
              <Download size={20} /> DESCARGAR PDF PARA IMPRIMIR
            </button>
          </div>
        </div>

        {/* 🖼️ PREVISUALIZACIÓN COMPLETA (DERECHA) */}
        <div className="xl:col-span-8">
          <div 
            ref={previewRef}
            className="w-full aspect-[16/11] bg-black shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden relative"
            id="print-area"
          >
            {/* 🍿 BARRA SUPERIOR ESTILO NETFLIX */}
            <header className="absolute top-0 inset-x-0 h-16 md:h-20 bg-gradient-to-b from-black/80 to-transparent z-40 flex items-center justify-between px-8 md:px-12">
               <div className="flex items-center gap-8">
                  <div className="text-[#E50914] text-2xl md:text-3xl font-black tracking-tighter">MEDIA NARANJA</div>
                  <nav className="hidden md:flex items-center gap-6 text-[11px] font-medium text-white/90">
                     <span>Inicio</span>
                     <span>Series</span>
                     <span>Películas</span>
                     <span>Novedades</span>
                  </nav>
               </div>
               <div className="flex items-center gap-6">
                  <Search size={18} />
                  <Gift size={18} />
                  <Bell size={18} />
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded bg-[#E50914] flex items-center justify-center overflow-hidden">
                     <img src="https://wallpapers.com/images/hd/netflix-profile-pictures-1000-x-1000-qo9h82134t9nv0j0.jpg" className="w-full h-full object-cover" alt="Profile" />
                  </div>
               </div>
            </header>

            {/* 🌆 FONDO PRINCIPAL */}
            <div className="absolute inset-x-0 top-0 h-[80%]">
               {mainPhoto ? (
                 <img src={mainPhoto} className="w-full h-full object-cover" alt="Hero" />
               ) : (
                 <div className="w-full h-full bg-gray-900 border-b border-white/5"></div>
               )}
               <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>
               <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-transparent"></div>
            </div>

            {/* ✍️ TEXTOS Y UI PRINCIPAL */}
            <div className="absolute inset-x-0 top-40 md:top-56 px-12 z-30 space-y-6">
                <div className="flex items-center gap-2 opacity-80 scale-90 origin-left">
                  <span className="bg-[#E50914] text-white text-[12px] font-black px-2 py-0.5 rounded-sm">N</span>
                  <span className="text-white font-bold tracking-[0.3em] text-[10px] uppercase">Parejas</span>
                </div>
                
                <h2 className="text-5xl md:text-8xl font-serif italic text-white drop-shadow-2xl leading-none tracking-tight">
                    {names}
                </h2>

                <div className="flex items-center gap-5 text-sm font-bold">
                    <span className="text-[#46d369]">98% para ti</span>
                    <span className="text-white/80">Juntos desde {date}</span>
                    <span className="border border-white/40 px-2 py-0.5 rounded-sm text-[10px]">L</span>
                    <span className="text-white/80">1º Gran Amor</span>
                    <span className="border border-white/40 px-1.5 rounded-sm text-[9px] font-black">HD</span>
                </div>

                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#E50914] rounded-md flex flex-col items-center justify-center font-black leading-none">
                        <span className="text-[7px] opacity-70">TOP</span>
                        <span className="text-lg">10</span>
                    </div>
                    <span className="text-xl font-bold italic">Mejores Parejas Del Mundo</span>
                </div>

                <p className="text-lg text-white/90 max-w-2xl font-light leading-relaxed">
                   {synopsis}
                </p>

                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-4">
                      <button className="flex items-center gap-2 px-10 py-4 bg-white text-black rounded-lg font-black text-xl"><Play fill="black" size={24} /> Tocar</button>
                      <button className="flex items-center gap-2 px-10 py-4 bg-gray-500/40 backdrop-blur-md text-white rounded-lg font-black text-xl border border-white/20"><CheckCircle2 size={24} /> Favorito</button>
                      <div className="flex gap-2">
                        <div className="w-12 h-12 rounded-full border-2 border-white/40 flex items-center justify-center"><ThumbsUp size={20}/></div>
                        <div className="w-12 h-12 rounded-full border-2 border-white/40 flex items-center justify-center"><ThumbsDown size={20}/></div>
                      </div>
                   </div>

                   <div className="text-right text-[10px] font-bold text-white/40 uppercase tracking-widest leading-loose">
                      Escrito por: <span className="text-white/70">{writtenBy}</span><br />
                      Destinado a: <span className="text-white/70">{destinedTo}</span>
                   </div>
                </div>
            </div>

            {/* 🎞️ CARRUSEL INFERIOR DE MOMENTOS */}
            <div className="absolute inset-x-0 bottom-4 px-12 z-30">
               <h4 className="text-sm font-bold mb-4 uppercase tracking-widest text-white/60 flex items-center gap-3">
                  Nuestros Mejores Momentos <Plus size={16} />
               </h4>
               <div className="grid grid-cols-5 md:grid-cols-7 gap-3">
                  {galleryPhotos.map((photo, i) => (
                    <div key={i} className="aspect-square bg-gray-800/20 rounded-md border border-white/5 overflow-hidden group">
                       {photo && <img src={photo} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt="Moment" />}
                    </div>
                  ))}
               </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
