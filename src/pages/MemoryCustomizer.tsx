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

  // NUEVO MÉTODO: Convertir a Base64 para máxima estabilidad
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, index?: number) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        if (index === undefined) setMainPhoto(base64);
        else {
          const newGallery = [...galleryPhotos];
          newGallery[index] = base64;
          setGalleryPhotos(newGallery);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const exportPDF = async () => {
    if (!previewRef.current) return;
    setIsExporting(true);
    
    try {
        // Pausa breve para estabilizar el DOM
        await new Promise(resolve => setTimeout(resolve, 500));

        const canvas = await html2canvas(previewRef.current, { 
            scale: 1, // Escala 1 para evitar "Out of Memory"
            useCORS: true,
            backgroundColor: '#141414',
            logging: false,
            removeContainer: true
        });
        
        const imgData = canvas.toDataURL('image/jpeg', 0.85);
        const pdf = new jsPDF({
            orientation: 'p',
            unit: 'mm',
            format: 'a4'
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`MediaNaranja_${names.replace(/\s+/g, '')}.pdf`);
    } catch (err: any) {
        console.error("Export Error:", err);
        alert("Error de memoria al generar el archivo. Por favor, intenta usar fotos de menor tamaño (menos de 2MB) o cierra otras pestañas del navegador.");
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
        <div className="xl:col-span-4 space-y-6 pb-20">
          <Link to="/galeria-recuerdos" className="inline-flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-[10px] font-bold uppercase mb-4">
            <ArrowLeft size={14} /> Volver al catálogo
          </Link>

          <div className="bg-[#111] p-8 rounded-[2.5rem] border border-white/5 space-y-8 shadow-2xl">
            <header>
                <h1 className="text-3xl font-serif italic text-white">Boutique <span className="text-[#E50914]">Naranja</span></h1>
                <p className="text-gray-500 text-[10px] uppercase tracking-widest mt-1">Estudio de Diseño Premium</p>
            </header>

            <section className="space-y-4">
              <h3 className="text-[10px] font-black uppercase text-[#E50914] tracking-tight">Imagen de Portada</h3>
              <div onClick={() => document.getElementById('main-upload')?.click()} className="w-full aspect-video bg-[#1a1a1a] rounded-2xl border-2 border-dashed border-gray-700 flex items-center justify-center cursor-pointer hover:border-[#E50914] overflow-hidden group">
                {mainPhoto ? <img src={mainPhoto} className="w-full h-full object-cover" /> : <div className="text-center"><Upload className="mx-auto text-gray-600 mb-2" /><span className="text-[10px] text-gray-600 uppercase font-bold tracking-widest">Subir Foto</span></div>}
                <input type="file" id="main-upload" hidden onChange={(e) => handlePhotoUpload(e)} />
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-[10px] font-black uppercase text-[#E50914] tracking-tight">Galería de Momentos</h3>
              <div className="grid grid-cols-5 gap-2">
                {galleryPhotos.map((photo, i) => (
                  <div key={i} onClick={() => document.getElementById(`gallery-${i}`)?.click()} className="aspect-square bg-[#1a1a1a] rounded-lg border border-gray-800 flex items-center justify-center cursor-pointer hover:border-[#E50914] overflow-hidden text-gray-700">
                    {photo ? <img src={photo} className="w-full h-full object-cover" /> : <Camera size={14} />}
                    <input type="file" id={`gallery-${i}`} hidden onChange={(e) => handlePhotoUpload(e, i)} />
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-3">
              <input type="text" value={names} onChange={(e) => setNames(e.target.value)} placeholder="¿Quiénes son los protagonistas?" className="w-full bg-black border border-gray-800 rounded-xl px-4 py-4 outline-none focus:border-[#E50914] text-sm text-gray-300 placeholder:text-gray-700" />
              <input type="text" value={date} onChange={(e) => setDate(e.target.value)} placeholder="¿En qué año empezó la historia?" className="w-full bg-black border border-gray-800 rounded-xl px-4 py-4 outline-none focus:border-[#E50914] text-sm text-gray-300 placeholder:text-gray-700" />
              <textarea value={synopsis} onChange={(e) => setSynopsis(e.target.value)} rows={3} placeholder="Escribe vuestra sinopsis..." className="w-full bg-black border border-gray-800 rounded-xl px-4 py-4 outline-none focus:border-[#E50914] text-sm text-gray-300 placeholder:text-gray-700 resize-none"></textarea>
            </section>

            <button onClick={exportPDF} disabled={isExporting} className={`w-full py-6 bg-[#E50914] text-white rounded-2xl font-black tracking-widest transition-all flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(229,9,20,0.3)] ${isExporting ? 'opacity-50 cursor-wait' : 'hover:scale-[1.02] active:scale-[0.98]'}`}>
              {isExporting ? <><Loader2 className="animate-spin" size={24} /> DESCARGANDO...</> : <><Download size={22} /> DESCARGAR DISEÑO</>}
            </button>
          </div>
        </div>

        {/* PREVIEW AREA (OPTIMIZADA) */}
        <div className="xl:col-span-8">
          <div ref={previewRef} className="w-full aspect-[3/4.2] bg-[#000] shadow-[0_50px_100px_-20px_rgba(0,0,0,1)] relative overflow-hidden">
            {/* PHOTO */}
            <div className="absolute inset-0">
               {mainPhoto ? (
                 <img src={mainPhoto} className="w-full h-full object-cover object-center" />
               ) : (
                 <div className="w-full h-full bg-[#050505]"></div>
               )}
               <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
               <div className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-black/30 via-transparent to-transparent"></div>
            </div>

            {/* LOGO BAR */}
            <header className="absolute top-0 inset-x-0 h-12 flex items-center justify-between px-10 z-50 bg-black/80">
               <div className="text-[#E50914] text-lg font-black tracking-tighter">LOVEFLIX</div>
               <div className="flex gap-4 items-center opacity-60">
                 <Search size={14}/> <Bell size={14}/>
                 <div className="w-6 h-6 bg-[#E50914] rounded"></div>
               </div>
            </header>

            {/* MAIN CONTENT */}
            <div className="absolute inset-x-10 bottom-44 z-40 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="bg-[#E50914] text-white text-[10px] font-black px-1.5 py-0.5 rounded-sm">N</span>
                  <span className="text-white/80 font-bold tracking-[0.4em] text-[7px] uppercase">Serie Original</span>
                </div>
                
                <h2 className="text-6xl md:text-8xl font-script text-white leading-none">
                    {names}
                </h2>

                <div className="flex items-center gap-3 text-[10px] font-bold text-white/90">
                    <span className="text-[#46d369]">98% para ti</span>
                    <span>Lanzado en {date}</span>
                    <span className="border border-white/40 px-1 rounded-sm text-[7px] font-black">HD</span>
                </div>

                <p className="text-xs md:text-sm text-white/80 max-w-lg font-medium leading-relaxed">
                   {synopsis}
                </p>

                <div className="flex items-center gap-4">
                    <div className="px-8 py-2.5 bg-white text-black rounded font-black text-xs uppercase tracking-widest shadow-xl">Reproducir</div>
                    <div className="px-8 py-2.5 bg-gray-700/80 text-white rounded font-black text-xs uppercase tracking-widest border border-white/10">Favorito</div>
                </div>

                <div className="pt-4 text-[7px] font-bold text-white/40 uppercase tracking-[0.2em] flex items-center gap-3">
                   <div>Escrita por: {writtenBy}</div>
                   <div className="w-1 h-1 bg-white/10 rounded-full"></div>
                   <div>Protagonista: {destinedTo}</div>
                </div>
            </div>

            {/* EPISODES GAL */}
            <div className="absolute inset-x-10 bottom-6 z-40">
               <h4 className="text-[10px] font-black mb-3 uppercase tracking-[0.3em] text-white/30 italic">Más episodios recomendados</h4>
               <div className="grid grid-cols-5 gap-3">
                  {galleryPhotos.map((photo, i) => (
                    <div key={i} className="aspect-[3/4] bg-gray-900/50 rounded-sm overflow-hidden border border-white/5">
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
