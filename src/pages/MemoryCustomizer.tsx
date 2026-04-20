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
        // Intervalo para asegurar carga total
        await new Promise(resolve => setTimeout(resolve, 800));

        const canvas = await html2canvas(previewRef.current, { 
            scale: 1.5, // Bajamos un poco para estabilidad
            useCORS: true,
            allowTaint: false,
            backgroundColor: '#141414',
            logging: true, // Activamos logs para debug
            onclone: (clonedDoc) => {
                // Forzamos visibilidad en el clon
                const area = clonedDoc.getElementById('pdf-area');
                if (area) {
                    area.style.transform = 'none';
                    area.style.position = 'relative';
                    area.style.left = '0';
                    area.style.top = '0';
                }
            }
        });
        
        const imgData = canvas.toDataURL('image/jpeg', 0.9);
        const pdf = new jsPDF({
            orientation: 'p',
            unit: 'mm',
            format: 'a4'
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`Recuerdo_Media_Naranja_${names.replace(/\s+/g, '_')}.pdf`);
    } catch (err: any) {
        console.error("PDF Export Error:", err);
        // El alert ahora nos dirá el error técnico real
        alert(`Error técnico: ${err.message || "Error desconocido"}. Por favor intenta con fotos más pequeñas o refresca la página.`);
    } finally {
        setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white pt-20">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&display=swap');
        .font-script { font-family: 'Dancing Script', cursive; }
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
                <p className="text-gray-500 text-xs uppercase tracking-widest">Personalizador Pro</p>
            </header>

            <section className="space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#E50914]">Fondo de Serie</h3>
              <div 
                onClick={() => document.getElementById('main-upload')?.click()}
                className="w-full aspect-video bg-[#1a1a1a] rounded-2xl border-2 border-dashed border-gray-700 flex items-center justify-center cursor-pointer hover:border-[#E50914] overflow-hidden"
              >
                {mainPhoto ? <img src={mainPhoto} className="w-full h-full object-cover" /> : <Upload size={24} className="text-gray-600" />}
                <input type="file" id="main-upload" hidden onChange={(e) => handlePhotoUpload(e)} />
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#E50914]">Galería de Capítulos</h3>
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
                <> <Loader2 className="animate-spin" size={20} /> Capturando...</>
              ) : (
                <> <Download size={20} /> DESCARGAR PDF </>
              )}
            </button>
          </div>
        </div>

        {/* PREVIEW AREA */}
        <div className="xl:col-span-8 sticky top-24">
          <div 
            ref={previewRef}
            id="pdf-area"
            className="w-full aspect-[3/4.2] bg-[#141414] shadow-[0_40px_100px_rgba(0,0,0,0.8)] relative overflow-hidden"
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
            <header className="absolute top-0 inset-x-0 h-14 flex items-center justify-between px-10 z-50 bg-black/60 backdrop-blur-md">
               <div className="flex items-center gap-6">
                  <div className="text-[#E50914] text-lg font-black tracking-tighter">LOVEFLIX</div>
                  <nav className="hidden md:flex gap-4 text-[8px] font-bold text-white/50 uppercase tracking-widest">
                     <span>Inicio</span>
                     <span>Series</span>
                     <span>Películas</span>
                  </nav>
               </div>
               <div className="flex items-center gap-4 text-white/80 scale-75">
                  <Search size={16} /> <Gift size={16} /> <Bell size={16} />
                  <div className="w-8 h-8 rounded bg-[#E50914] overflow-hidden">
                     <img src="https://wallpapers.com/images/hd/netflix-profile-pictures-1000-x-1000-qo9h82134t9nv0j0.jpg" className="w-full h-full object-cover" />
                  </div>
               </div>
            </header>

            {/* INFO */}
            <div className="absolute inset-x-10 bottom-44 z-40 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="bg-[#E50914] text-white text-[9px] font-black px-1.2 py-0.5 rounded-sm">N</span>
                  <span className="text-white/80 font-bold tracking-[0.3em] text-[7px] uppercase underline decoration-[#E50914] underline-offset-4">Parejas</span>
                </div>
                
                <h2 className="text-5xl md:text-8xl font-script text-white leading-none drop-shadow-[0_5px_20px_rgba(0,0,0,0.8)]">
                    {names}
                </h2>

                <div className="flex items-center gap-3 text-[9px] font-bold text-white/90">
                    <span className="text-[#46d369]">98% para ti</span>
                    <span>Juntos Desde {date}</span>
                    <span className="border border-white/40 px-1 rounded-sm text-[7px]">HD</span>
                    <span>1º Gran Amor</span>
                </div>

                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-[#E50914] rounded-sm flex flex-col items-center justify-center font-black leading-none">
                        <span className="text-[5px] opacity-70 italic font-sans">TOP</span>
                        <span className="text-[11px]">10</span>
                    </div>
                </div>

                <p className="text-xs md:text-sm text-white/80 max-w-lg font-medium leading-relaxed drop-shadow-md pb-2">
                   {synopsis}
                </p>

                <div className="flex items-center gap-3">
                  <div className="px-6 py-2 bg-white text-black rounded font-bold text-sm shadow-xl flex items-center gap-2"><Play fill="black" size={14} /> Play</div>
                  <div className="px-6 py-2 bg-gray-500/40 backdrop-blur-md text-white rounded font-bold text-sm border border-white/10 flex items-center gap-2"><CheckCircle2 size={14} /> My List</div>
                </div>

                <div className="pt-4 text-[7px] font-bold text-white/40 uppercase tracking-[0.3em] flex items-center gap-3">
                   <div>Escrito por: <span className="text-white/80">{writtenBy}</span></div>
                   <div className="w-0.5 h-0.5 bg-white/20 rounded-full"></div>
                   <div>Para: <span className="text-white/80">{destinedTo}</span></div>
                </div>
            </div>

            {/* GALLERÍA */}
            <div className="absolute inset-x-10 bottom-6 z-40">
               <h4 className="text-[9px] font-black mb-2 uppercase tracking-[0.2em] text-white/30">Episodios Recomendados</h4>
               <div className="grid grid-cols-5 gap-2.5">
                  {galleryPhotos.map((photo, i) => (
                    <div key={i} className="aspect-[2/2.5] bg-white/5 rounded-sm border border-white/10 overflow-hidden shadow-2xl">
                       {photo ? <img src={photo} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center opacity-20"><Camera size={16}/></div>}
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
