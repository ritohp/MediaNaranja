import { useState, useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Camera, Upload, ArrowLeft, CheckCircle2, Play, Search, Gift, Bell, ThumbsUp, ThumbsDown, Plus, Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export default function MemoryCustomizer() {
  const [names, setNames] = useState("Valentina & Alejandro");
  const [date, setDate] = useState("2018");
  const [synopsis, setSynopsis] = useState("Mirada a los ojos y mi mundo se detuvo, fue extraño cómo todo comenzó. Quise pasar de nuevo por allí y en ese instante me di cuenta...");
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
    const pdf = new jsPDF('p', 'mm', 'a4'); // Cambiado a vertical (Portrait) para este diseño
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`MediaNaranja_Obra_${names}.pdf`);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white pt-20">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&display=swap');
        .font-script { font-family: 'Dancing Script', cursive; }
      `}</style>

      <div className="max-w-[1700px] mx-auto px-6 grid grid-cols-1 xl:grid-cols-12 gap-12">
        
        {/* 🛠️ PANEL DE EDICIÓN */}
        <div className="xl:col-span-4 space-y-6 pb-20 max-h-[90vh] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-gray-800">
          <Link to="/galeria-recuerdos" className="inline-flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-[10px] font-bold uppercase tracking-widest mb-4">
            <ArrowLeft size={14} /> Volver al catálogo
          </Link>

          <div className="bg-[#111] p-8 rounded-[2.5rem] border border-white/5 space-y-8">
            <header>
                <h1 className="text-3xl font-serif mb-2 italic">Estudio <span className="text-[#E50914]">Loveflix</span></h1>
                <p className="text-gray-500 text-xs uppercase tracking-widest">Creando una historia original</p>
            </header>

            <section className="space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#E50914]">Imagen de Portada</h3>
              <div 
                onClick={() => document.getElementById('main-upload')?.click()}
                className="w-full aspect-video bg-[#1a1a1a] rounded-2xl border-2 border-dashed border-gray-700 flex items-center justify-center cursor-pointer hover:border-[#E50914] overflow-hidden"
              >
                {mainPhoto ? <img src={mainPhoto} className="w-full h-full object-cover" /> : <Upload size={24} className="text-gray-600" />}
                <input type="file" id="main-upload" hidden onChange={(e) => handlePhotoUpload(e)} />
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#E50914]">Tus 5 Capítulos (Momentos)</h3>
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
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#E50914]">Nombres de Protagonistas</h3>
              <input type="text" value={names} onChange={(e) => setNames(e.target.value)} className="w-full bg-black border border-gray-800 rounded-xl px-4 py-3 outline-none focus:border-[#E50914] text-sm" />
              
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#E50914]">Año de Lanzamiento</h3>
              <input type="text" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-black border border-gray-800 rounded-xl px-4 py-3 outline-none focus:border-[#E50914] text-sm" />
              
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#E50914]">Tu Mensaje (Sinopsis)</h3>
              <textarea value={synopsis} onChange={(e) => setSynopsis(e.target.value)} rows={3} className="w-full bg-black border border-gray-800 rounded-xl px-4 py-3 outline-none focus:border-[#E50914] text-sm resize-none"></textarea>
            </section>

            <button onClick={exportPDF} className="w-full py-5 bg-[#E50914] text-white rounded-2xl font-black tracking-widest hover:brightness-110 shadow-xl transition-all flex items-center justify-center gap-3">
              <Download size={20} /> DESCARGAR OBRA MAESTRA
            </button>
          </div>
        </div>

        {/* 🖼️ PREVIEW FINAL (ESTILO LOVEFLIX) */}
        <div className="xl:col-span-8 sticky top-24">
          <div 
            ref={previewRef}
            className="w-full aspect-[2/3] md:aspect-[3/4.2] bg-[#141414] shadow-[0_40px_100px_rgba(0,0,0,0.8)] relative overflow-hidden"
            id="render-area"
          >
            {/* FOTO PRINCIPAL (Ocupa casi todo) */}
            <div className="absolute inset-0">
               {mainPhoto ? (
                 <img src={mainPhoto} className="w-full h-full object-cover" />
               ) : (
                 <div className="w-full h-full bg-gradient-to-br from-[#222] to-[#111]"></div>
               )}
               {/* Degradado tipo cine */}
               <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent"></div>
               <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-transparent"></div>
            </div>

            {/* HEADER NETFLIX REALISTA */}
            <header className="absolute top-0 inset-x-0 h-16 flex items-center justify-between px-10 z-50">
               <div className="flex items-center gap-6">
                  <div className="text-[#E50914] text-xl font-black tracking-tighter">LOVEFLIX</div>
                  <nav className="flex gap-4 text-[9px] font-bold text-white/60 uppercase tracking-widest">
                     <span>Inicio</span>
                     <span>Series</span>
                     <span>Películas</span>
                     <span>Tendencia</span>
                  </nav>
               </div>
               <div className="flex items-center gap-4 text-white/80 scale-90">
                  <Search size={16} /> <Gift size={16} /> <Bell size={16} />
                  <div className="w-8 h-8 rounded bg-[#E50914] overflow-hidden">
                     <img src="https://wallpapers.com/images/hd/netflix-profile-pictures-1000-x-1000-qo9h82134t9nv0j0.jpg" className="w-full" />
                  </div>
               </div>
            </header>

            {/* CONTENIDO CENTRADO-BAJO */}
            <div className="absolute inset-x-10 bottom-44 z-40 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="bg-[#E50914] text-white text-[10px] font-black px-1.5 py-0.5 rounded-sm">N</span>
                  <span className="text-white/80 font-bold tracking-[0.3em] text-[8px] uppercase">Parejas</span>
                </div>
                
                <h2 className="text-5xl md:text-7xl font-script text-white leading-none drop-shadow-[0_5px_15px_rgba(0,0,0,0.5)]">
                    {names}
                </h2>

                <div className="flex items-center gap-4 text-[10px] md:text-xs font-bold text-white">
                    <span className="text-[#46d369]">Juntos Desde {date}</span>
                    <span className="bg-green-600 text-white px-1.5 rounded-sm text-[8px]">L</span>
                    <span>1º Gran Amor</span>
                    <span className="border border-white/50 px-1 rounded-sm text-[8px] font-black">HD</span>
                </div>

                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-[#E50914] rounded-sm flex flex-col items-center justify-center font-black leading-none">
                        <span className="text-[5px] opacity-70 italic">TOP</span>
                        <span className="text-xs">10</span>
                    </div>
                    <span className="text-sm md:text-base font-bold italic border-b border-white/20 pb-0.5">Las Mejores Parejas Del Mundo</span>
                </div>

                <p className="text-xs md:text-sm text-white/90 max-w-xl font-medium leading-relaxed drop-shadow-md">
                   {synopsis}
                </p>

                <div className="flex items-center gap-3 pt-3">
                  <button className="flex items-center gap-2 px-8 py-3 bg-white text-black rounded font-bold text-sm md:text-lg shadow-xl"><Play fill="black" size={18} /> Play</button>
                  <button className="flex items-center gap-2 px-8 py-3 bg-gray-500/40 backdrop-blur-md text-white rounded font-bold text-sm md:text-lg border border-white/20"><CheckCircle2 size={18} /> Favorito</button>
                  <div className="flex gap-2 pl-2">
                    <div className="w-9 h-9 rounded-full border border-white/30 flex items-center justify-center"><ThumbsUp size={14}/></div>
                    <div className="w-9 h-9 rounded-full border border-white/30 flex items-center justify-center"><ThumbsDown size={14}/></div>
                  </div>
                </div>

                {/* Sub-Metadata */}
                <div className="pt-2 text-[8px] font-bold text-white/40 uppercase tracking-[0.2em] leading-relaxed">
                   Escrito por: <span className="text-white/80">{writtenBy}</span> <span className="mx-2">|</span> Destinado a: <span className="text-white/80">{destinedTo}</span>
                </div>
            </div>

            {/* BARRA DE MOMENTOS (PEGADA AL BORDE) */}
            <div className="absolute inset-x-10 bottom-6 z-40">
               <h4 className="text-[10px] font-black mb-3 uppercase tracking-[0.3em] text-white/60">Nuestros Mejores Momentos</h4>
               <div className="grid grid-cols-5 gap-3">
                  {galleryPhotos.map((photo, i) => (
                    <div key={i} className="aspect-square bg-white/5 rounded-sm border border-white/10 overflow-hidden shadow-2xl">
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
