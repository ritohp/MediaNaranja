import { useState, useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Camera, Upload, ArrowLeft, CheckCircle2, Play, Search, Gift, Bell, ThumbsUp, ThumbsDown, Plus, Download, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export default function MemoryCustomizer() {
  const [names, setNames] = useState("Valentina & Alejandro");
  const [date, setDate] = useState("2018");
  const [synopsis, setSynopsis] = useState("Mirada a los ojos y mi mundo se detuvo, fue extraño cómo todo comenzó. Quise pasar de nuevo por allí y en ese instante me di cuenta...");
  const [writtenBy, setWrittenBy] = useState("Alejandro");
  const [destinedTo, setDestinedTo] = useState("Valentina");
  const [isExporting, setIsExporting] = useState(false);
  
  const [mainPhoto, setMainPhoto] = useState<string | null>(null);
  const [galleryPhotos, setGalleryPhotos] = useState<(string | null)[]>([null, null, null, null, null]);
  
  const previewRef = useRef<HTMLDivElement>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, index?: number) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      if (index === undefined) setMainPhoto(url);
      else {
        const newGallery = [...galleryPhotos];
        newGallery[index] = url;
        setGalleryPhotos(newGallery);
      }
    }
  };

  const exportPDF = async () => {
    if (!previewRef.current) return;
    setIsExporting(true);
    
    try {
        // Pequeña espera para asegurar que todo el DOM esté listo
        await new Promise(resolve => setTimeout(resolve, 500));

        const canvas = await html2canvas(previewRef.current, { 
            scale: 2, 
            useCORS: true,
            backgroundColor: '#141414',
            logging: false,
            // Importante: Eliminar allowTaint para evitar problemas de seguridad en el canvas
        });
        
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const pdf = new jsPDF({
            orientation: 'p',
            unit: 'mm',
            format: 'a4'
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`MediaNaranja_Serie_${names.replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
        console.error("PDF Export Error:", err);
        alert("Error al generar PDF. Prueba refrescando la página o revisando que las fotos hayan cargado bien.");
    } finally {
        setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white pt-20">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&display=swap');
        .font-script { font-family: 'Dancing Script', cursive; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
      `}</style>

      <div className="max-w-[1700px] mx-auto px-6 grid grid-cols-1 xl:grid-cols-12 gap-12">
        
        {/* PANEL DE EDICIÓN */}
        <div className="xl:col-span-4 space-y-6 pb-20 max-h-[90vh] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-gray-800">
          <Link to="/galeria-recuerdos" className="inline-flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-[10px] font-bold uppercase tracking-widest mb-4">
            <ArrowLeft size={14} /> Volver al catálogo
          </Link>

          <div className="bg-[#111] p-8 rounded-[2.5rem] border border-white/5 space-y-8">
            <header>
                <h1 className="text-3xl font-serif mb-2 italic">Estudio <span className="text-[#E50914]">Loveflix</span></h1>
                <p className="text-gray-500 text-xs uppercase tracking-widest">Diseño Naranja Original</p>
            </header>

            <section className="space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#E50914]">Portada de Serie</h3>
              <div 
                onClick={() => document.getElementById('main-upload')?.click()}
                className="w-full aspect-video bg-[#1a1a1a] rounded-2xl border-2 border-dashed border-gray-700 flex items-center justify-center cursor-pointer hover:border-[#E50914] overflow-hidden"
              >
                {mainPhoto ? <img src={mainPhoto} className="w-full h-full object-cover" /> : <Upload size={24} className="text-gray-600" />}
                <input type="file" id="main-upload" hidden onChange={(e) => handlePhotoUpload(e)} />
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#E50914]">Miniaturas de Capítulos</h3>
              <div className="grid grid-cols-5 gap-2">
                {galleryPhotos.map((photo, i) => (
                  <div key={i} onClick={() => document.getElementById(`gallery-${i}`)?.click()} className="aspect-square bg-[#1a1a1a] rounded-lg border border-gray-800 flex items-center justify-center cursor-pointer hover:border-[#E50914] overflow-hidden">
                    {photo ? <img src={photo} className="w-full h-full object-cover" /> : <Camera size={14} className="text-gray-700" />}
                    <input type="file" id={`gallery-${i}`} hidden onChange={(e) => handlePhotoUpload(e, i)} />
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-4">
              <input type="text" value={names} onChange={(e) => setNames(e.target.value)} placeholder="Nombres" className="w-full bg-black border border-gray-800 rounded-xl px-4 py-3 outline-none focus:border-[#E50914] text-sm" />
              <input type="text" value={date} onChange={(e) => setDate(e.target.value)} placeholder="Año" className="w-full bg-black border border-gray-800 rounded-xl px-4 py-3 outline-none focus:border-[#E50914] text-sm" />
              <textarea value={synopsis} onChange={(e) => setSynopsis(e.target.value)} rows={3} className="w-full bg-black border border-gray-800 rounded-xl px-4 py-3 outline-none focus:border-[#E50914] text-sm resize-none"></textarea>
              <div className="grid grid-cols-2 gap-4">
                  <input type="text" value={writtenBy} onChange={(e) => setWrittenBy(e.target.value)} placeholder="Escrito por" className="w-full bg-black border border-gray-800 rounded-xl px-4 py-3 outline-none focus:border-[#E50914] text-xs" />
                  <input type="text" value={destinedTo} onChange={(e) => setDestinedTo(e.target.value)} placeholder="Para" className="w-full bg-black border border-gray-800 rounded-xl px-4 py-3 outline-none focus:border-[#E50914] text-xs" />
              </div>
            </section>

            <button 
                onClick={exportPDF} 
                disabled={isExporting}
                className={`w-full py-5 bg-[#E50914] text-white rounded-2xl font-black tracking-widest hover:brightness-110 shadow-xl transition-all flex items-center justify-center gap-3 ${isExporting ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isExporting ? (
                <> <Loader2 className="animate-spin" size={20} /> Generando...</>
              ) : (
                <> <Download size={20} /> DESCARGAR PDF </>
              )}
            </button>
          </div>
        </div>

        {/* PREVIEW FINAL */}
        <div className="xl:col-span-8 sticky top-24">
          <div 
            ref={previewRef}
            className="w-full aspect-[3/4.2] bg-[#141414] shadow-[0_40px_100px_rgba(0,0,0,0.8)] relative overflow-hidden"
            id="pdf-area"
          >
            {/* PORTADA */}
            <div className="absolute inset-0 z-0">
               {mainPhoto ? (
                 <img src={mainPhoto} className="w-full h-full object-cover object-center" />
               ) : (
                 <div className="w-full h-full bg-[#1a1a1a]"></div>
               )}
               <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
               <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent"></div>
            </div>

            {/* NAV BAR */}
            <header className="absolute top-0 inset-x-0 h-16 flex items-center justify-between px-10 z-50 bg-black/60 backdrop-blur-md border-b border-white/5">
               <div className="flex items-center gap-6">
                  <div className="text-[#E50914] text-xl font-black tracking-tighter">LOVEFLIX</div>
                  <nav className="flex gap-4 text-[9px] font-bold text-white/50 uppercase tracking-widest">
                     <span>Inicio</span>
                     <span>Series</span>
                     <span>Películas</span>
                  </nav>
               </div>
               <div className="flex items-center gap-4 text-white/80 scale-90">
                  <Search size={16} /> <Gift size={16} /> <Bell size={16} />
                  <div className="w-8 h-8 rounded bg-[#E50914] overflow-hidden">
                     <img src="https://wallpapers.com/images/hd/netflix-profile-pictures-1000-x-1000-qo9h82134t9nv0j0.jpg" className="w-full h-full object-cover" />
                  </div>
               </div>
            </header>

            {/* INFO TEXTO */}
            <div className="absolute inset-x-10 bottom-48 z-40 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="bg-[#E50914] text-white text-[10px] font-black px-1.5 py-0.5 rounded-sm">N</span>
                  <span className="text-white/80 font-bold tracking-[0.3em] text-[8px] uppercase">Parejas</span>
                </div>
                
                <h2 className="text-6xl md:text-8xl font-script text-white leading-none drop-shadow-[0_5px_20px_rgba(0,0,0,0.8)]">
                    {names}
                </h2>

                <div className="flex items-center gap-3 text-[10px] font-bold text-white">
                    <span className="text-[#46d369]">98% para ti</span>
                    <span className="text-white/40">●</span>
                    <span>Juntos Desde {date}</span>
                    <span className="text-white/40">●</span>
                    <span className="border border-white/50 px-1 rounded-sm text-[8px]">13+</span>
                    <span>1º Gran Amor</span>
                </div>

                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-[#E50914] rounded-sm flex flex-col items-center justify-center font-black leading-none">
                        <span className="text-[5px] opacity-70 italic font-sans uppercase">TOP</span>
                        <span className="text-sm">10</span>
                    </div>
                    <span className="text-sm font-bold italic tracking-tight border-b border-white/10 pb-0.5">Mejores Parejas Del Mundo</span>
                </div>

                <p className="text-xs md:text-sm text-white/90 max-w-xl font-medium leading-relaxed drop-shadow-md pb-4">
                   {synopsis}
                </p>

                <div className="flex items-center gap-3">
                  <button className="flex items-center gap-2 px-8 py-3 bg-white text-black rounded font-bold text-sm md:text-lg shadow-xl"><Play fill="black" size={20} /> Play</button>
                  <button className="flex items-center gap-2 px-8 py-3 bg-gray-500/50 backdrop-blur-md text-white rounded font-bold text-lg border border-white/20"><CheckCircle2 size={20} /> Favorito</button>
                  <div className="flex gap-2 pl-2">
                    <div className="w-9 h-9 rounded-full border border-white/30 flex items-center justify-center opacity-70"><ThumbsUp size={14}/></div>
                    <div className="w-9 h-9 rounded-full border border-white/30 flex items-center justify-center opacity-70"><ThumbsDown size={14}/></div>
                  </div>
                </div>

                <div className="pt-6 text-[8px] font-bold text-white/50 uppercase tracking-[0.3em] flex items-center gap-4">
                   <div>Escrito por: <span className="text-white/90">{writtenBy}</span></div>
                   <div className="w-1 h-1 bg-white/20 rounded-full"></div>
                   <div>Para: <span className="text-white/90">{destinedTo}</span></div>
                </div>
            </div>

            {/* GALERÍA */}
            <div className="absolute inset-x-10 bottom-6 z-40 bg-gradient-to-t from-black to-transparent pt-4">
               <h4 className="text-[10px] font-black mb-3 uppercase tracking-[0.2em] text-white/40">Momentos Inolvidables</h4>
               <div className="grid grid-cols-5 gap-3">
                  {galleryPhotos.map((photo, i) => (
                    <div key={i} className="aspect-square bg-white/5 rounded shadow-2xl border border-white/10 overflow-hidden">
                       {photo && <img src={photo} className="w-full h-full object-cover" />}
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
