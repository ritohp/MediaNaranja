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

  const optimizeImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const MAX = 1200; 
          if (width > height && width > MAX) { height *= MAX / width; width = MAX; }
          else if (height > MAX) { width *= MAX / height; height = MAX; }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.8));
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
      const optimized = await optimizeImage(file);
      if (index === undefined) setMainPhoto(optimized);
      else {
        const newGallery = [...galleryPhotos];
        newGallery[index] = optimized;
        setGalleryPhotos(newGallery);
      }
    }
  };

  const exportPDF = async () => {
    const area = document.getElementById('capture-area');
    if (!area) return;
    
    setIsExporting(true);
    
    try {
        await new Promise(r => setTimeout(r, 800));

        const canvas = await html2canvas(area, { 
            scale: 2, 
            useCORS: true,
            backgroundColor: '#000000',
            logging: false,
            onclone: (clonedDoc) => {
                // ELIMINACIÓN RADICAL DE OKLAB Y FILTROS
                const all = clonedDoc.getElementsByTagName('*');
                for (let i = 0; i < all.length; i++) {
                    const el = all[i] as HTMLElement;
                    el.style.filter = 'none';
                    el.style.backdropFilter = 'none';
                    el.style.textShadow = 'none';
                    el.style.boxShadow = 'none';
                }
            }
        });
        
        const imgData = canvas.toDataURL('image/jpeg', 0.85);
        const pdf = new jsPDF({
            orientation: 'p',
            unit: 'mm',
            format: 'a4'
        });

        pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
        pdf.save(`Media_Naranja_Serie_${Date.now()}.pdf`);
    } catch (err: any) {
        console.error("PDF Error:", err);
        alert(`Error técnico: ${err.message}. Intentaremos otro método si persiste.`);
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

      <div className="max-w-[1500px] mx-auto px-6 grid grid-cols-1 xl:grid-cols-12 gap-10">
        
        {/* PANEL DE EDICIÓN */}
        <div className="xl:col-span-4 space-y-6">
          <div className="bg-[#111] p-8 rounded-[2.5rem] border border-white/5 space-y-8 shadow-2xl">
            <header className="border-b border-white/5 pb-4">
                <h1 className="text-2xl font-serif italic text-white leading-tight">Estudio <span className="text-[#E50914]">Loveflix</span></h1>
                <p className="text-gray-500 text-[10px] uppercase tracking-widest mt-1">Garantía de salida PDF</p>
            </header>

            <section className="space-y-4">
              <h3 className="text-[10px] font-black uppercase text-[#E50914]">Imagen de Portada</h3>
              <div onClick={() => document.getElementById('main-upload')?.click()} className="w-full aspect-video bg-[#1a1a1a] rounded-2xl border-2 border-dashed border-gray-800 flex items-center justify-center cursor-pointer hover:border-[#E50914] overflow-hidden">
                {mainPhoto ? <img src={mainPhoto} className="w-full h-full object-cover" /> : <Upload className="text-gray-700" />}
                <input type="file" id="main-upload" hidden onChange={(e) => handlePhotoUpload(e)} />
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-[10px] font-black uppercase text-[#E50914]">Momentos</h3>
              <div className="grid grid-cols-5 gap-2">
                {galleryPhotos.map((photo, i) => (
                  <div key={i} onClick={() => document.getElementById(`gallery-${i}`)?.click()} className="aspect-[3/4] bg-[#1a1a1a] rounded-lg border border-gray-800 flex items-center justify-center cursor-pointer hover:border-[#E50914] overflow-hidden">
                    {photo ? <img src={photo} className="w-full h-full object-cover" /> : <Camera size={14} className="text-gray-700" />}
                    <input type="file" id={`gallery-${i}`} hidden onChange={(e) => handlePhotoUpload(e, i)} />
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-3">
              <input type="text" value={names} onChange={(e) => setNames(e.target.value)} placeholder="Protagonistas" className="w-full bg-[#080808] border border-gray-800 rounded-xl px-5 py-4 outline-none focus:border-[#E50914] text-sm" />
              <input type="text" value={date} onChange={(e) => setDate(e.target.value)} placeholder="Año lanzamiento" className="w-full bg-[#080808] border border-gray-800 rounded-xl px-5 py-4 outline-none focus:border-[#E50914] text-sm" />
              <textarea value={synopsis} onChange={(e) => setSynopsis(e.target.value)} rows={3} placeholder="Sinopsis..." className="w-full bg-[#080808] border border-gray-800 rounded-xl px-5 py-4 outline-none focus:border-[#E50914] text-sm resize-none"></textarea>
            </section>

            <button onClick={exportPDF} disabled={isExporting} className={`w-full py-6 bg-white text-black rounded-full font-black text-xs uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3 shadow-2xl ${isExporting ? 'opacity-50' : 'hover:scale-[1.02]'}`}>
              {isExporting ? <><Loader2 className="animate-spin" size={20} /> PREPARANDO PDF...</> : <><Download size={20} /> DESCARGAR DISEÑO </>}
            </button>
          </div>
        </div>

        {/* ÁREA DE CAPTURA (ULTRA-LIMPIA) */}
        <div className="xl:col-span-8 flex justify-center sticky top-24">
          <div 
            id="capture-area"
            className="w-full max-w-[550px] aspect-[1/1.414] bg-black shadow-2xl relative overflow-hidden"
          >
            {/* PORTADA */}
            <div className="absolute inset-0 z-0">
               {mainPhoto ? (
                 <img src={mainPhoto} className="w-full h-full object-cover object-center" />
               ) : (
                 <div className="w-full h-full bg-[#0a0a0a]"></div>
               )}
               <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
            </div>

            {/* HEADER (SIN BLUR) */}
            <header className="absolute top-0 inset-x-0 h-14 flex items-center justify-between px-10 z-50 bg-[#000000]">
               <div className="text-[#E50914] text-lg font-black tracking-tighter">LOVEFLIX</div>
               <div className="flex gap-4 items-center opacity-40 scale-75 text-white">
                 <Search size={16}/> <Bell size={16}/>
                 <div className="w-7 h-7 bg-[#E50914] rounded-sm"></div>
               </div>
            </header>

            {/* CONTENIDO (SIN SOMBRAS DINÁMICAS) */}
            <div className="absolute inset-x-10 bottom-44 z-40 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="bg-[#E50914] text-white text-[10px] font-black px-1.5 py-0.5 rounded-sm">N</span>
                  <span className="text-white/90 font-bold tracking-[0.4em] text-[7px] uppercase">Serie Original</span>
                </div>
                
                <h2 className="text-6xl font-script text-white leading-none">
                    {names}
                </h2>

                <div className="flex items-center gap-4 text-[10px] font-bold text-white/90">
                    <span className="text-[#46D369]">98% para ti</span>
                    <span>Juntos Desde {date}</span>
                    <span className="border border-white/40 px-1.5 py-0.5 rounded-sm text-[8px] font-black uppercase">HD</span>
                </div>

                <p className="text-xs text-white/80 max-w-sm font-medium leading-relaxed">
                   {synopsis}
                </p>

                <div className="flex items-center gap-3 pt-2">
                    <div className="px-8 py-2 bg-white text-black rounded font-black text-[9px] uppercase tracking-widest shadow-xl">Ver Ahora</div>
                    <div className="px-8 py-2 bg-[#222] text-white rounded font-black text-[9px] uppercase tracking-widest border border-white/10">+ Favorito</div>
                </div>
                
                <div className="pt-4 text-[7px] font-bold text-white/40 uppercase tracking-[0.2em] flex items-center gap-3">
                   <div>Escrita por: {writtenBy}</div>
                   <div className="w-1 h-1 bg-white/20 rounded-full"></div>
                   <div>Interpretada por: {destinedTo}</div>
                </div>
            </div>

            {/* GALLERÍA */}
            <div className="absolute inset-x-10 bottom-6 z-40">
               <h4 className="text-[10px] font-black mb-3 uppercase tracking-[0.3em] text-white/10 italic">Más recomendados</h4>
               <div className="grid grid-cols-5 gap-3">
                  {galleryPhotos.map((photo, i) => (
                    <div key={i} className="aspect-[3/4.2] bg-[#050505] rounded-sm border border-white/5 overflow-hidden">
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
