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
          const MAX = 1100; 
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

  const loadImage = (url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  };

  const drawWrappedText = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) => {
    const words = text.split(' ');
    let line = '';
    let currentY = y;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        ctx.fillText(line, x, currentY);
        line = words[n] + ' ';
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, currentY);
  };

  const exportPDF = async () => {
    setIsExporting(true);
    
    try {
        // 1. Configuración del Canvas (Relación A4: 210 x 297mm)
        const canvas = document.createElement('canvas');
        const dpr = 2; // Multiplicador de nitidez
        canvas.width = 1000 * dpr;
        canvas.height = 1414 * dpr;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.scale(dpr, dpr);

        // 2. Fondo Negro Base
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, 1000, 1414);

        // 3. Cargar Imagen Principal
        if (mainPhoto) {
            const img = await loadImage(mainPhoto);
            const scale = Math.max(1000 / img.width, 1414 / img.height);
            const x = (1000 / 2) - (img.width / 2) * scale;
            const y = (1414 / 2) - (img.height / 2) * scale;
            ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
        }

        // 4. Degradado Cinemático
        const grad = ctx.createLinearGradient(0, 1414 * 0.3, 0, 1414);
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(0.5, 'rgba(0,0,0,0.4)');
        grad.addColorStop(0.8, 'rgba(0,0,0,0.9)');
        grad.addColorStop(1, 'rgba(0,0,0,1)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 1000, 1414);

        // 5. Logo "LOVEFLIX"
        ctx.fillStyle = '#E50914';
        ctx.font = '900 40px Helvetica, Arial, sans-serif';
        ctx.fillText('LOVEFLIX', 50, 80);

        // 6. Contenido Principal (Textos)
        const contentY = 1000;
        
        // Etiqueta N
        ctx.fillStyle = '#E50914';
        ctx.fillRect(50, contentY - 120, 25, 35);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '900 24px Arial';
        ctx.fillText('N', 54, contentY - 93);
        
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.font = 'bold 16px Arial';
        ctx.fillText('SERIE ORIGINAL DE MEDIA NARANJA', 85, contentY - 96);

        // NOMBRES (Dancing Script)
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 110px "Dancing Script", cursive';
        ctx.fillText(names, 50, contentY);

        // Metadatos
        ctx.font = 'bold 20px Arial';
        ctx.fillStyle = '#46D369';
        ctx.fillText('98% para ti', 50, contentY + 50);
        
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(`Lanzado en ${date}`, 180, contentY + 50);
        
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.strokeRect(350, contentY + 32, 45, 25);
        ctx.font = 'bold 14px Arial';
        ctx.fillText('UHD', 356, contentY + 50);

        // Sinopsis
        ctx.font = 'normal 22px Arial';
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        drawWrappedText(ctx, synopsis, 50, contentY + 100, 900, 30);

        // 7. Botones Visuales
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.roundRect(50, contentY + 180, 200, 50, 5);
        ctx.fill();
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 20px Arial';
        ctx.fillText('▶ Reproducir', 70, contentY + 213);

        ctx.fillStyle = 'rgba(128,128,128,0.5)';
        ctx.beginPath();
        ctx.roundRect(270, contentY + 180, 200, 50, 5);
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText('✓ Mi Lista', 315, contentY + 213);

        // 8. Galería de Miniaturas
        const thumbY = 1280;
        const thumbW = 160;
        const thumbH = 100;
        const gap = 20;

        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.font = 'bold 16px Arial';
        ctx.fillText('EPISODIOS RECOMENDADOS', 50, thumbY - 20);

        for (let i = 0; i < 5; i++) {
            const tx = 50 + (thumbW + gap) * i;
            if (galleryPhotos[i]) {
                const thumbImg = await loadImage(galleryPhotos[i]!);
                ctx.drawImage(thumbImg, tx, thumbY, thumbW, thumbH);
            } else {
                ctx.fillStyle = '#1a1a1a';
                ctx.fillRect(tx, thumbY, thumbW, thumbH);
            }
            ctx.strokeStyle = 'rgba(255,255,255,0.1)';
            ctx.strokeRect(tx, thumbY, thumbW, thumbH);
        }

        // 9. Generar PDF Final
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const pdf = new jsPDF({
            orientation: 'p',
            unit: 'mm',
            format: 'a4'
        });

        pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
        pdf.save(`Serie_MediaNaranja_${names.replace(/\s+/g, '_')}.pdf`);

    } catch (err: any) {
        console.error("Master Renderer Error:", err);
        alert(`Error en el motor de dibujo: ${err.message}. Asegúrate de que las imágenes hayan cargado.`);
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
            <header className="border-b border-white/5 pb-6">
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_#3b82f6]"></div>
                    <span className="text-[10px] uppercase font-bold text-gray-400 tracking-tighter">Motor de Dibujo Activo</span>
                </div>
                <h1 className="text-2xl font-serif italic text-white leading-tight">Estudio <span className="text-[#E50914]">Loveflix</span></h1>
            </header>

            <section className="space-y-4">
              <h3 className="text-[10px] font-black uppercase text-[#E50914] tracking-widest">1. Portada del Recuerdo</h3>
              <div onClick={() => document.getElementById('main-upload')?.click()} className="w-full aspect-video bg-[#0a0a0a] rounded-2xl border-2 border-dashed border-gray-800 flex items-center justify-center cursor-pointer hover:border-[#E50914] overflow-hidden transition-all group">
                {mainPhoto ? <img src={mainPhoto} className="w-full h-full object-cover" /> : <div className="text-center group-hover:scale-110 transition-transform"><Upload className="mx-auto text-gray-700 mb-2" /><span className="text-[10px] font-bold text-gray-800 uppercase tracking-widest">Subir Imagen</span></div>}
                <input type="file" id="main-upload" hidden onChange={(e) => handlePhotoUpload(e)} />
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-[10px] font-black uppercase text-[#E50914] tracking-widest">2. Momentos Galería</h3>
              <div className="grid grid-cols-5 gap-2">
                {galleryPhotos.map((photo, i) => (
                  <div key={i} onClick={() => document.getElementById(`gallery-${i}`)?.click()} className="aspect-square bg-[#0a0a0a] rounded-lg border border-gray-800 flex items-center justify-center cursor-pointer hover:border-[#E50914] overflow-hidden transition-all">
                    {photo ? <img src={photo} className="w-full h-full object-cover" /> : <Camera size={14} className="text-gray-700" />}
                    <input type="file" id={`gallery-${i}`} hidden onChange={(e) => handlePhotoUpload(e, i)} />
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-3">
              <input type="text" value={names} onChange={(e) => setNames(e.target.value)} placeholder="Nombres" className="w-full bg-[#080808] border border-gray-800 rounded-xl px-5 py-4 outline-none focus:border-[#E50914] text-sm text-white" />
              <input type="text" value={date} onChange={(e) => setDate(e.target.value)} placeholder="Año lanzamiento" className="w-full bg-[#080808] border border-gray-800 rounded-xl px-5 py-4 outline-none focus:border-[#E50914] text-sm text-white" />
              <textarea value={synopsis} onChange={(e) => setSynopsis(e.target.value)} rows={3} placeholder="Sinopsis..." className="w-full bg-[#080808] border border-gray-800 rounded-xl px-5 py-4 outline-none focus:border-[#E50914] text-sm text-white resize-none"></textarea>
            </section>

            <button onClick={exportPDF} disabled={isExporting} className={`w-full py-6 bg-[#E50914] text-white rounded-full font-black text-xs uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3 shadow-[0_10px_40px_rgba(229,9,20,0.3)] ${isExporting ? 'opacity-50 cursor-wait' : 'hover:scale-[1.02] active:scale-95'}`}>
              {isExporting ? <><Loader2 className="animate-spin" size={20} /> DIBUJANDO PDF...</> : <><Download size={20} /> FINALIZAR RECUERDO </>}
            </button>
          </div>
        </div>

        {/* ÁREA DE PREVISUALIZACIÓN */}
        <div className="xl:col-span-8 flex justify-center sticky top-24">
          <div 
            id="capture-area"
            className="w-full max-w-[550px] aspect-[1/1.414] bg-black shadow-2xl relative overflow-hidden ring-1 ring-white/10"
          >
            {/* PORTADA */}
            <div className="absolute inset-0 z-0">
               {mainPhoto ? (
                 <img src={mainPhoto} className="w-full h-full object-cover object-center" />
               ) : (
                 <div className="w-full h-full bg-[#0a0a0a] flex items-center justify-center text-white/5 font-black text-9xl italic">LOVE</div>
               )}
               <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
            </div>

            {/* HEADER */}
            <header className="absolute top-0 inset-x-0 h-14 flex items-center justify-between px-10 z-50 bg-black/60">
               <div className="text-[#E50914] text-lg font-black tracking-tighter">LOVEFLIX</div>
               <div className="flex gap-4 items-center opacity-40 scale-75 text-white">
                 <Search size={16}/> <Bell size={16}/>
                 <div className="w-7 h-7 bg-[#E50914] rounded-sm"></div>
               </div>
            </header>

            {/* CONTENIDO */}
            <div className="absolute inset-x-10 bottom-44 z-40 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="bg-[#E50914] text-white text-[10px] font-black px-1.5 py-0.5 rounded-sm">N</span>
                  <span className="text-white/80 font-bold tracking-[0.4em] text-[7px] uppercase italic underline decoration-[#E50914] underline-offset-4">Producción Naranja</span>
                </div>
                
                <h2 className="text-6xl font-script text-white leading-none">
                    {names}
                </h2>

                <div className="flex items-center gap-4 text-[10px] font-bold text-white/90">
                    <span className="text-[#46D369]">98% para ti</span>
                    <span>{date}</span>
                    <span className="border border-white/40 px-1.5 py-0.5 rounded-sm text-[8px] font-black uppercase">HD+</span>
                </div>

                <p className="text-xs text-white/80 max-w-sm font-medium leading-relaxed italic">
                   {synopsis}
                </p>

                <div className="flex items-center gap-3 pt-2">
                    <div className="px-8 py-2.5 bg-white text-black rounded font-black text-[9px] uppercase tracking-widest shadow-xl">Jugar</div>
                    <div className="px-8 py-2.5 bg-gray-500/30 text-white rounded font-black text-[9px] uppercase tracking-widest border border-white/10">+ Mi Lista</div>
                </div>
            </div>

            {/* GALERÍA */}
            <div className="absolute inset-x-10 bottom-6 z-40">
               <h4 className="text-[10px] font-black mb-3 uppercase tracking-[0.3em] text-white/10 italic">Más recomendados</h4>
               <div className="grid grid-cols-5 gap-3">
                  {galleryPhotos.map((photo, i) => (
                    <div key={i} className="aspect-[3/4.2] bg-[#050505] rounded-sm border border-white/5 overflow-hidden shadow-xl">
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
