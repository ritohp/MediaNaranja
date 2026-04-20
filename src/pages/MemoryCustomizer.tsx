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

  // FUNCIÓN MAESTRA: Optimiza y comprime la imagen antes de guardarla
  const optimizeImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const MAX_SIZE = 1600; // Tamaño ideal para impresión A4 sin saturar memoria

          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            // Comprimimos al 75% de calidad JPEG
            resolve(canvas.toDataURL('image/jpeg', 0.75));
          }
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, index?: number) => {
    const file = e.target.files?.[0];
    if (file) {
      const optimizedBase64 = await optimizeImage(file);
      if (index === undefined) setMainPhoto(optimizedBase64);
      else {
        const newGallery = [...galleryPhotos];
        newGallery[index] = optimizedBase64;
        setGalleryPhotos(newGallery);
      }
    }
  };

  const exportPDF = async () => {
    if (!previewRef.current) return;
    setIsExporting(true);
    
    try {
        await new Promise(resolve => setTimeout(resolve, 600));

        const canvas = await html2canvas(previewRef.current, { 
            scale: 2, // Ahora que las fotos son ligeras, podemos subir un poco la calidad del canvas
            useCORS: true,
            backgroundColor: '#141414',
            logging: false,
            removeContainer: true
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
        pdf.save(`MediaNaranja_Boutique_${names.replace(/\s+/g, '')}.pdf`);
    } catch (err: any) {
        console.error("PDF Export failed:", err);
        alert("Lo sentimos, tu navegador se quedó sin memoria para el PDF. Intenta cerrar otras pestañas.");
    } finally {
        setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white pt-20 pb-20">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&display=swap');
        .font-script { font-family: 'Dancing Script', cursive; }
      `}</style>

      <div className="max-w-[1700px] mx-auto px-6 grid grid-cols-1 xl:grid-cols-12 gap-12">
        
        {/* PANEL DE EDICIÓN INTELIGENTE */}
        <div className="xl:col-span-4 space-y-6">
          <Link to="/galeria-recuerdos" className="inline-flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-[10px] font-bold uppercase mb-4">
            <ArrowLeft size={14} /> Volver al catálogo
          </Link>

          <div className="bg-[#111] p-8 rounded-[2.5rem] border border-white/5 space-y-8 shadow-2xl sticky top-24">
            <header>
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-[10px] uppercase font-bold text-gray-400 tracking-tighter">Optimizador Activo</span>
                </div>
                <h1 className="text-3xl font-serif italic text-white leading-tight">Estudio de <span className="text-[#E50914]">Personalización</span></h1>
            </header>

            <section className="space-y-4">
              <h3 className="text-[10px] font-black uppercase text-[#E50914] tracking-[0.2em]">Foto Principal</h3>
              <div onClick={() => document.getElementById('main-upload')?.click()} className="w-full aspect-video bg-[#1a1a1a] rounded-3xl border-2 border-dashed border-gray-800 flex items-center justify-center cursor-pointer hover:border-[#E50914] transition-all overflow-hidden relative group">
                {mainPhoto ? (
                    <>
                        <img src={mainPhoto} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="text-[10px] font-bold uppercase tracking-widest">Cambiar Imagen</span>
                        </div>
                    </>
                ) : (
                    <div className="text-center opacity-40">
                        <Upload className="mx-auto mb-2" />
                        <span className="text-[10px] font-bold uppercase tracking-widest leading-none">Subir & Optimizar</span>
                    </div>
                )}
                <input type="file" id="main-upload" hidden onChange={(e) => handlePhotoUpload(e)} />
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-[10px] font-black uppercase text-[#E50914] tracking-[0.2em]">Mis 5 Momentos</h3>
              <div className="grid grid-cols-5 gap-2">
                {galleryPhotos.map((photo, i) => (
                  <div key={i} onClick={() => document.getElementById(`gallery-${i}`)?.click()} className="aspect-[3/4] bg-[#1a1a1a] rounded-xl border border-gray-800 flex items-center justify-center cursor-pointer hover:border-[#E50914] overflow-hidden transition-all text-gray-700">
                    {photo ? <img src={photo} className="w-full h-full object-cover" /> : <Camera size={14} />}
                    <input type="file" id={`gallery-${i}`} hidden onChange={(e) => handlePhotoUpload(e, i)} />
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-3">
              <input type="text" value={names} onChange={(e) => setNames(e.target.value)} placeholder="Nombres protagonistas" className="w-full bg-[#0a0a0a] border border-gray-800 rounded-2xl px-6 py-5 outline-none focus:border-[#E50914] text-sm transition-all" />
              <input type="text" value={date} onChange={(e) => setDate(e.target.value)} placeholder="Año especial" className="w-full bg-[#0a0a0a] border border-gray-800 rounded-2xl px-6 py-5 outline-none focus:border-[#E50914] text-sm transition-all" />
              <textarea value={synopsis} onChange={(e) => setSynopsis(e.target.value)} rows={3} placeholder="Escribe vuestra historia..." className="w-full bg-[#0a0a0a] border border-gray-800 rounded-2xl px-6 py-5 outline-none focus:border-[#E50914] text-sm resize-none transition-all"></textarea>
            </section>

            <button onClick={exportPDF} disabled={isExporting} className={`w-full py-6 bg-white text-black rounded-3xl font-black tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-[0_20px_40px_rgba(255,255,255,0.1)] ${isExporting ? 'opacity-50 cursor-wait' : 'hover:bg-[#f0f0f0] hover:translate-y-[-2px] active:translate-y-[0px]'}`}>
              {isExporting ? <><Loader2 className="animate-spin" size={24} /> PROCESANDO PDF...</> : <><Download size={22} /> DESCARGAR PARA IMPRIMIR</>}
            </button>
          </div>
        </div>

        {/* PREVIEW AREA (OPTIMIZADA) */}
        <div className="xl:col-span-8">
          <div ref={previewRef} className="w-full aspect-[1/1.414] bg-[#000] shadow-[0_60px_120px_-30px_rgba(0,0,0,1)] relative overflow-hidden" id="pdf-safe-area">
            {/* BACKGROUND PHOTO (OPTIMIZADA) */}
            <div className="absolute inset-0">
               {mainPhoto ? (
                 <img src={mainPhoto} className="w-full h-full object-cover object-center" />
               ) : (
                 <div className="w-full h-full bg-[#050505] flex items-center justify-center text-white/5 font-black text-9xl italic select-none">LOVE</div>
               )}
               <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent"></div>
               <div className="absolute inset-y-0 left-0 w-2/5 bg-gradient-to-r from-black/40 via-transparent to-transparent"></div>
            </div>

            {/* LOGO BAR */}
            <header className="absolute top-0 inset-x-0 h-16 flex items-center justify-between px-10 z-50 bg-[#000000]">
               <div className="text-[#E50914] text-xl font-black tracking-tighter">LOVEFLIX</div>
               <div className="flex gap-4 items-center opacity-40 scale-75">
                 <Search size={16}/> <Bell size={16}/>
                 <div className="w-7 h-7 bg-[#E50914] rounded-sm"></div>
               </div>
            </header>

            {/* MAIN CONTENT AREA */}
            <div className="absolute inset-x-12 bottom-52 z-40 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="bg-[#E50914] text-white text-[11px] font-black px-1.5 py-0.5 rounded-sm">N</span>
                  <span className="text-white/90 font-bold tracking-[0.5em] text-[8px] uppercase">Serie Original</span>
                </div>
                
                <h2 className="text-7xl md:text-9xl font-script text-white leading-none drop-shadow-2xl">
                    {names}
                </h2>

                <div className="flex items-center gap-4 text-[11px] font-bold text-white/90">
                    <span className="text-[#46d369]">98% para ti</span>
                    <span>Juntos Desde {date}</span>
                    <span className="border border-white/50 px-1.5 py-0.5 rounded-sm text-[8px] font-black uppercase">Ultra HD</span>
                </div>

                <div className="flex items-center gap-2">
                    <div className="w-9 h-9 bg-[#E50914] rounded-sm flex flex-col items-center justify-center font-black leading-none text-white">
                        <span className="text-[6px] opacity-70 italic font-sans uppercase">TOP</span>
                        <span className="text-sm">10</span>
                    </div>
                    <span className="text-base font-bold italic text-white drop-shadow-md">Nº 1 en vuestro mundo hoy</span>
                </div>

                <p className="text-sm md:text-base text-white/90 max-w-xl font-medium leading-relaxed drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                   {synopsis}
                </p>

                <div className="flex items-center gap-4 pt-2">
                    <div className="px-10 py-3 bg-white text-black rounded font-black text-xs uppercase tracking-[0.2em] shadow-2xl">Reproducir</div>
                    <div className="px-10 py-3 bg-gray-900/60 text-white rounded font-black text-xs uppercase tracking-[0.2em] border border-white/10 backdrop-blur-sm">+ Mi Lista</div>
                </div>

                <div className="pt-6 text-[8px] font-bold text-white/30 uppercase tracking-[0.3em] flex items-center gap-4">
                   <div>Escrita por: {writtenBy}</div>
                   <div className="w-1 h-1 bg-white/20 rounded-full"></div>
                   <div>Interpretada por: {destinedTo}</div>
                </div>
            </div>

            {/* LOWER GALLERY */}
            <div className="absolute inset-x-12 bottom-8 z-40 bg-black/30 p-3 rounded-lg border border-white/5">
               <h4 className="text-[10px] font-black mb-3 uppercase tracking-[0.3em] text-white/30 italic">Capítulos destacados</h4>
               <div className="grid grid-cols-5 gap-4">
                  {galleryPhotos.map((photo, i) => (
                    <div key={i} className="aspect-[3/4.5] bg-gray-950 rounded border border-white/10 overflow-hidden shadow-2xl transition-transform">
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
