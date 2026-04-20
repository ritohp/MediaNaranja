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
  
  // OPTIMIZADOR EXTREMO: 800px máximo para seguridad total
  const optimizeImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const MAX = 800; // Resolución "Blindada" 
          if (width > height && width > MAX) { height *= MAX / width; width = MAX; }
          else if (height > MAX) { width *= MAX / height; height = MAX; }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.6)); // Compresión fuerte pero invisible
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
        // Pausa de 1.5 segundos para que el navegador descanse
        await new Promise(r => setTimeout(r, 1500));

        const canvas = await html2canvas(area, { 
            scale: 1, // Escala 1 para consumo mínimo de RAM
            useCORS: true,
            backgroundColor: '#000000',
            logging: false,
            width: area.clientWidth,
            height: area.clientHeight
        });
        
        const imgData = canvas.toDataURL('image/jpeg', 0.7);
        const pdf = new jsPDF({
            orientation: 'p',
            unit: 'mm',
            format: 'a4'
        });

        pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
        pdf.save(`Serie_MediaNaranja_${names.split(' ')[0]}.pdf`);
    } catch (err: any) {
        console.error("PDF Error:", err);
        alert(`Error al generar: ${JSON.stringify(err, Object.getOwnPropertyNames(err))}`);
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

      <div className="max-w-[1400px] mx-auto px-6 grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* PANEL EDICIÓN */}
        <div className="xl:col-span-4">
          <div className="bg-[#111] p-8 rounded-[2.5rem] border border-white/5 space-y-8">
            <header>
                <h1 className="text-2xl font-serif italic text-white leading-tight">Estudio <span className="text-[#E50914]">Loveflix</span></h1>
                <p className="text-gray-500 text-[9px] uppercase tracking-widest mt-1 italic">Edición Blindada (Máxima Compatibilidad)</p>
            </header>

            <section className="space-y-4">
              <h3 className="text-[10px] font-black uppercase text-[#E50914] tracking-widest">Subir Imagen</h3>
              <div onClick={() => document.getElementById('main-upload')?.click()} className="w-full aspect-video bg-[#0a0a0a] rounded-2xl border-2 border-dashed border-gray-800 flex items-center justify-center cursor-pointer hover:border-[#E50914] overflow-hidden">
                {mainPhoto ? <img src={mainPhoto} className="w-full h-full object-cover" /> : <Upload className="text-gray-800" />}
                <input type="file" id="main-upload" hidden onChange={(e) => handlePhotoUpload(e)} />
              </div>
            </section>

            <section className="space-y-3">
              <input type="text" value={names} onChange={(e) => setNames(e.target.value)} placeholder="Nombres" className="w-full bg-[#080808] border border-gray-800 rounded-xl px-5 py-4 outline-none focus:border-[#E50914] text-sm" />
              <textarea value={synopsis} onChange={(e) => setSynopsis(e.target.value)} rows={3} placeholder="Sinopsis..." className="w-full bg-[#080808] border border-gray-800 rounded-xl px-5 py-4 outline-none focus:border-[#E50914] text-sm resize-none"></textarea>
            </section>

            <button onClick={exportPDF} disabled={isExporting} className="w-full py-6 bg-white text-black rounded-full font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-3">
              {isExporting ? <><Loader2 className="animate-spin" size={20} /> GENERANDO...</> : <><Download size={20} /> DESCARGAR PDF</>}
            </button>
          </div>
        </div>

        {/* ÁREA CAPTURA LIGERA */}
        <div className="xl:col-span-8 flex justify-center sticky top-24">
          <div 
            id="capture-area"
            className="w-full max-w-[500px] aspect-[1/1.414] bg-black relative overflow-hidden"
          >
            {mainPhoto && <img src={mainPhoto} className="absolute inset-0 w-full h-full object-cover opacity-60" />}
            <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black via-black to-transparent"></div>

            <header className="absolute top-0 inset-x-0 h-14 flex items-center justify-between px-10 z-50 bg-black">
               <div className="text-[#E50914] text-lg font-black tracking-tighter">LOVEFLIX</div>
            </header>

            <div className="absolute inset-x-10 bottom-32 z-40 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="bg-[#E50914] text-white text-[10px] font-black px-1.5 py-0.5 rounded-sm">N</span>
                  <span className="text-white/70 font-bold tracking-[0.4em] text-[7px] uppercase italic">Pelicula Exclusiva</span>
                </div>
                
                <h2 className="text-6xl font-script text-white leading-none">
                    {names}
                </h2>

                <div className="flex items-center gap-4 text-[10px] font-bold text-white/80">
                    <span className="text-[#46D369]">98% para ti</span>
                    <span>Desde {date}</span>
                    <span className="border border-white/20 px-1 rounded-sm text-[8px] uppercase">HD</span>
                </div>

                <p className="text-xs text-white/70 max-w-sm font-medium leading-relaxed italic">
                   {synopsis}
                </p>

                <div className="flex items-center gap-3 pt-2">
                    <div className="px-8 py-2 bg-white text-black rounded font-black text-[9px] uppercase tracking-widest">Play</div>
                    <div className="px-8 py-2 bg-[#222] text-white rounded font-black text-[9px] uppercase tracking-widest border border-white/10">+ Mi Lista</div>
                </div>
            </div>

            <div className="absolute inset-x-10 bottom-6 z-40 flex gap-2 overflow-hidden">
               {galleryPhotos.map((photo, i) => (
                    <div key={i} className="w-16 aspect-[3/4] bg-[#050505] rounded-sm border border-white/5 overflow-hidden">
                       {photo && <img src={photo} className="w-full h-full object-cover" />}
                    </div>
               ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
