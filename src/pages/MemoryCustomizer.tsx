import { useState, useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Camera, Upload, ArrowLeft, CheckCircle2, Play, Search, Gift, Bell, ThumbsUp, ThumbsDown, Plus, Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export default function MemoryCustomizer() {
  const [names, setNames] = useState("Valentina & Alejandro");
  const [date, setDate] = useState("2018");
  const [synopsis, setSynopsis] = useState("Miro a los ojos y mi mundo se detuvo, fue extraño como empezó todo quería ir allí de nuevo...");
  const [writtenBy, setWrittenBy] = useState("Alejandro");
  const [destinedTo, setDestinedTo] = useState("Valentina");
  
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
    const canvas = await html2canvas(previewRef.current, { scale: 3, useCORS: true });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('l', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`MediaNaranja_Recuerdo_${names}.pdf`);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white pt-20">
      <div className="max-w-[1700px] mx-auto px-6 grid grid-cols-1 xl:grid-cols-12 gap-10">
        
        {/* 🛠️ PANEL DE EDICIÓN */}
        <div className="xl:col-span-4 space-y-6 pb-20 max-h-[85vh] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-gray-800">
          <Link to="/galeria-recuerdos" className="inline-flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest">
            <ArrowLeft size={14} /> Volver al catálogo
          </Link>

          <div className="bg-[#111] p-8 rounded-[2.5rem] border border-white/5 space-y-8">
            <section className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#E50914]">Imagen de Fondo</h3>
              <div 
                onClick={() => document.getElementById('main-upload')?.click()}
                className="w-full aspect-video bg-[#1a1a1a] rounded-2xl border-2 border-dashed border-gray-700 flex items-center justify-center cursor-pointer hover:border-[#E50914] overflow-hidden"
              >
                {mainPhoto ? <img src={mainPhoto} className="w-full h-full object-cover" /> : <Upload size={24} />}
                <input type="file" id="main-upload" hidden onChange={(e) => handlePhotoUpload(e)} />
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#E50914]">Tus 5 Momentos</h3>
              <div className="grid grid-cols-5 gap-2">
                {galleryPhotos.map((photo, i) => (
                  <div key={i} onClick={() => document.getElementById(`gallery-${i}`)?.click()} className="aspect-square bg-[#1a1a1a] rounded-lg border border-gray-800 flex items-center justify-center cursor-pointer hover:border-[#E50914] overflow-hidden">
                    {photo ? <img src={photo} className="w-full h-full object-cover" /> : <Camera size={14} />}
                    <input type="file" id={`gallery-${i}`} hidden onChange={(e) => handlePhotoUpload(e, i)} />
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#E50914]">Detalles</h3>
              <div className="space-y-4">
                <input type="text" value={names} onChange={(e) => setNames(e.target.value)} placeholder="Nombres" className="w-full bg-black border border-gray-800 rounded-xl px-4 py-3 outline-none focus:border-[#E50914]" />
                <input type="text" value={date} onChange={(e) => setDate(e.target.value)} placeholder="Año" className="w-full bg-black border border-gray-800 rounded-xl px-4 py-3 outline-none focus:border-[#E50914]" />
                <textarea value={synopsis} onChange={(e) => setSynopsis(e.target.value)} rows={3} className="w-full bg-black border border-gray-800 rounded-xl px-4 py-3 outline-none focus:border-[#E50914] resize-none"></textarea>
              </div>
            </section>

            <button onClick={exportPDF} className="w-full py-5 bg-white text-black rounded-2xl font-black tracking-widest hover:bg-gray-100 transition-all flex items-center justify-center gap-3">
              <Download size={20} /> DESCARGAR PDF
            </button>
          </div>
        </div>

        {/* 🖼️ PREVIEW LIMPIO (DERECHA) */}
        <div className="xl:col-span-8">
          <div 
            ref={previewRef}
            className="w-full aspect-[16/11] bg-black shadow-2xl relative overflow-hidden"
            id="render-area"
          >
            {/* FONDO */}
            <div className="absolute inset-0">
               {mainPhoto && <img src={mainPhoto} className="w-full h-full object-cover opacity-80" />}
               <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
               <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-transparent"></div>
            </div>

            {/* HEADER COMPACTO */}
            <header className="absolute top-0 inset-x-0 h-16 flex items-center justify-between px-10 z-50">
               <div className="flex items-center gap-6">
                  <div className="text-[#E50914] text-xl font-black tracking-tighter">MEDIA NARANJA</div>
                  <nav className="flex gap-4 text-[9px] font-bold text-white/50 uppercase tracking-widest">
                     <span>Inicio</span>
                     <span>Series</span>
                     <span>Películas</span>
                  </nav>
               </div>
               <div className="flex items-center gap-4 opacity-70">
                  <Search size={14} /> <Gift size={14} /> <Bell size={14} />
                  <div className="w-8 h-8 rounded bg-[#E50914] flex items-center justify-center overflow-hidden">
                     <img src="https://wallpapers.com/images/hd/netflix-profile-pictures-1000-x-1000-qo9h82134t9nv0j0.jpg" className="w-full object-cover" />
                  </div>
               </div>
            </header>

            {/* CONTENIDO CENTRAL */}
            <div className="absolute inset-x-10 top-24 md:top-32 z-40 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="bg-[#E50914] text-white text-[9px] font-black px-1.5 py-0.5 rounded-sm">N</span>
                  <span className="text-white/60 font-bold tracking-[0.2em] text-[8px] uppercase">Original de Media Naranja</span>
                </div>
                
                <h2 className="text-6xl md:text-7xl font-serif italic text-white leading-none tracking-tight py-2">
                    {names}
                </h2>

                <div className="flex items-center gap-4 text-xs font-bold text-white/80">
                    <span className="text-[#46d369]">98% para ti</span>
                    <span className="text-white/40">●</span>
                    <span>Juntos desde {date}</span>
                    <span className="text-white/40">●</span>
                    <span className="border border-white/30 px-1 rounded-sm text-[8px]">13+</span>
                    <span>1º Gran Amor</span>
                </div>

                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-[#E50914] rounded-sm flex flex-col items-center justify-center font-black leading-none">
                        <span className="text-[6px] opacity-70 italic">TOP</span>
                        <span className="text-sm">10</span>
                    </div>
                    <span className="text-lg font-bold italic tracking-tight">Mejores Parejas Del Mundo</span>
                </div>

                <p className="text-sm text-white/70 max-w-xl font-medium leading-relaxed">
                   {synopsis}
                </p>

                <div className="flex items-center gap-3 pt-2">
                  <button className="flex items-center gap-2 px-6 py-3 bg-white text-black rounded font-bold text-lg shadow-xl"><Play fill="black" size={20} /> Tocar</button>
                  <button className="flex items-center gap-2 px-6 py-3 bg-gray-500/30 backdrop-blur-md text-white rounded font-bold text-lg border border-white/10"><Plus size={20} /> Favorito</button>
                  <div className="flex gap-2">
                    <div className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center opacity-70"><ThumbsUp size={16}/></div>
                    <div className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center opacity-70"><ThumbsDown size={16}/></div>
                  </div>
                </div>
            </div>

            {/* GALERÍA INFERIOR (Con espacio real) */}
            <div className="absolute inset-x-10 bottom-8 z-40">
               <h4 className="text-[9px] font-black mb-3 uppercase tracking-[0.3em] text-white/40">Nuestros Mejores Momentos</h4>
               <div className="flex gap-2.5">
                  {galleryPhotos.map((photo, i) => (
                    <div key={i} className="w-24 h-28 bg-gray-800/10 rounded-md border border-white/5 overflow-hidden">
                       {photo && <img src={photo} className="w-full h-full object-cover" />}
                    </div>
                  ))}
               </div>
               
               {/* Metadata Bottom Right */}
               <div className="absolute right-0 bottom-0 text-[8px] font-bold text-white/30 uppercase tracking-widest text-right leading-relaxed">
                  Escrito por: <span className="text-white/60">{writtenBy}</span><br />
                  Para: <span className="text-white/60">{destinedTo}</span>
               </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

