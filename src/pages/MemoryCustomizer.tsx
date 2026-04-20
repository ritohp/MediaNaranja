import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Camera, Upload, ArrowLeft, Loader2, Save, Trash2, Search, Bell } from 'lucide-react';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import { supabase } from '../lib/supabase';

export default function MemoryCustomizer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loadingMemory, setLoadingMemory] = useState(!!id);
  
  const [names, setNames] = useState("Valentina & Alejandro");
  const [date, setDate] = useState("2028");
  const [synopsis, setSynopsis] = useState("Todo comenzó con un 'Hola'. Una mirada que detuvo el tiempo y un sentimiento que hoy es nuestra serie favorita...");
  const [isExporting, setIsExporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [mainPhoto, setMainPhoto] = useState<string | null>(null);
  const [galleryPhotos, setGalleryPhotos] = useState<(string | null)[]>([null, null, null, null, null]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (id) fetchSavedMemory(id);
    });
  }, [id]);

  const fetchSavedMemory = async (memoryId: string) => {
    try {
      const { data, error } = await supabase
        .from('memories')
        .select('*')
        .eq('id', memoryId)
        .single();
      
      if (error) throw error;
      if (data) {
        setNames(data.names);
        setDate(data.date_text);
        setSynopsis(data.synopsis);
        setMainPhoto(data.main_photo_url);
        setGalleryPhotos(data.gallery_photos_urls || [null, null, null, null, null]);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoadingMemory(false);
    }
  };
  
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

  const uploadBase64 = async (base64String: string, path: string) => {
    try {
      if (!base64String || base64String.length < 500) throw new Error("Captura inválida");
      const base64Data = base64String.split(',')[1];
      const blob = await fetch(`data:image/png;base64,${base64Data}`).then(res => res.blob());
      const { data, error } = await supabase.storage
        .from('memories')
        .upload(path, blob, { contentType: 'image/png', upsert: true });
      if (error) throw error;
      return supabase.storage.from('memories').getPublicUrl(path).data.publicUrl;
    } catch (err: any) {
        throw new Error(`Error de subida: ${err.message}`);
    }
  };

  const saveMemory = async () => {
    if (!user) return;
    if (!mainPhoto) { alert("Sube la foto principal."); return; }

    setIsSaving(true);
    const area = document.getElementById('capture-area');
    
    try {
      if (!area) throw new Error("Área no encontrada");
      
      // ESPERAR PARA RENDERIZADO TOTAL
      await new Promise(r => setTimeout(r, 2000));
      
      const masterShotDataUrl = await toPng(area, { 
        pixelRatio: 1.5, // RESOLUCION SEGURA Y NITIDA
        cacheBust: true,
        backgroundColor: '#000000',
      });

      const masterUrl = await uploadBase64(masterShotDataUrl, `${user.id}/${Date.now()}_master.png`);
      const mainUrl = await uploadBase64(mainPhoto, `${user.id}/${Date.now()}_main.jpg`);
      
      const galleryUrls = [];
      for (let i = 0; i < galleryPhotos.length; i++) {
        const p = galleryPhotos[i];
        if (p) {
          const url = await uploadBase64(p, `${user.id}/${Date.now()}_gal_${i}.jpg`);
          galleryUrls.push(url);
        }
      }

      const { error } = id 
        ? await supabase.from('memories').update({ names, date_text: date, synopsis, main_photo_url: mainUrl, gallery_photos_urls: galleryUrls, full_design_url: masterUrl, style: 'loveflix' }).eq('id', id)
        : await supabase.from('memories').insert({ user_id: user.id, names, date_text: date, synopsis, main_photo_url: mainUrl, gallery_photos_urls: galleryUrls, full_design_url: masterUrl, style: 'loveflix' });

      if (error) throw error;
      alert("¡Guardado correctamente!");
      navigate('/mis-recuerdos');

    } catch (err: any) {
      console.error(err);
      alert(`Error al capturar: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const exportPDF = async () => {
    const area = document.getElementById('capture-area');
    if (!area) return;
    setIsExporting(true);
    try {
        await new Promise(r => setTimeout(r, 1000));
        const imgData = await toPng(area, { pixelRatio: 1.5 });
        const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
        pdf.addImage(imgData, 'PNG', 0, 0, 210, 297);
        pdf.save(`Serie_MediaNaranja_${names.split(' ')[0]}.pdf`);
    } catch (err: any) {
        alert(err.message);
    } finally {
        setIsExporting(false);
    }
  };

  if (loadingMemory) return <div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="animate-spin text-red-600" /></div>;

  return (
    <div className="min-h-screen bg-[#050505] text-white pt-20 pb-20">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&display=swap');
        .font-script { font-family: 'Dancing Script', cursive; }
        .netflix-gradient { background: linear-gradient(to top, #000 0%, transparent 60%); }
        .header-gradient { background: linear-gradient(to bottom, #000 0%, transparent 100%); }
      `}</style>

      <div className="max-w-[1500px] mx-auto px-6 grid grid-cols-1 xl:grid-cols-12 gap-10">
        
        {/* PANEL DE CONTROL */}
        <div className="xl:col-span-4 space-y-6">
          <div className="bg-[#111] p-8 rounded-3xl border border-white/5 space-y-6 shadow-2xl">
            <h1 className="text-2xl font-serif italic text-white leading-tight">Estudio <span className="text-red-600">Loveflix</span></h1>
            
            <div onClick={() => document.getElementById('main-upload')?.click()} className="w-full aspect-video bg-black rounded-2xl border-2 border-dashed border-zinc-800 flex items-center justify-center cursor-pointer hover:border-red-600 transition-all overflow-hidden">
               {mainPhoto ? <img src={mainPhoto} className="w-full h-full object-cover" /> : <Upload className="text-zinc-700" />}
               <input type="file" id="main-upload" hidden onChange={(e) => handlePhotoUpload(e)} />
            </div>

            <div className="grid grid-cols-5 gap-2">
                {galleryPhotos.map((photo, i) => (
                  <div key={i} onClick={() => document.getElementById(`gallery-${i}`)?.click()} className="aspect-square bg-black rounded-lg border border-zinc-800 flex items-center justify-center cursor-pointer hover:border-red-600 overflow-hidden">
                    {photo ? <img src={photo} className="w-full h-full object-cover" /> : <Camera size={14} className="text-zinc-700" />}
                    <input type="file" id={`gallery-${i}`} hidden onChange={(e) => handlePhotoUpload(e, i)} />
                  </div>
                ))}
            </div>

            <div className="space-y-3">
              <input type="text" value={names} onChange={(e) => setNames(e.target.value)} placeholder="Protagonistas" className="w-full bg-black border border-zinc-800 rounded-xl px-5 py-4 outline-none focus:border-red-600 text-sm" />
              <input type="text" value={date} onChange={(e) => setDate(e.target.value)} placeholder="Año" className="w-full bg-black border border-zinc-800 rounded-xl px-5 py-4 outline-none focus:border-red-600 text-sm" />
              <textarea value={synopsis} onChange={(e) => setSynopsis(e.target.value)} rows={3} placeholder="Sinopsis..." className="w-full bg-black border border-zinc-800 rounded-xl px-5 py-4 outline-none focus:border-red-600 text-sm resize-none"></textarea>
            </div>

            <div className="space-y-4 pt-4">
              <button onClick={saveMemory} disabled={isSaving} className="w-full py-5 bg-red-600 text-white rounded-full font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3">
                {isSaving ? <Loader2 className="animate-spin" /> : "Guardar Producción"}
              </button>
              <button onClick={exportPDF} disabled={isExporting} className="w-full py-5 border border-white/5 text-zinc-500 rounded-full font-black text-xs uppercase tracking-[0.2em] hover:bg-white hover:text-black transition-all">
                {isExporting ? <Loader2 className="animate-spin mx-auto" /> : "Prueba de Impresión (PDF)"}
              </button>
            </div>
          </div>
        </div>

        {/* ÁREA DE CAPTURA - ESTABILIDAD TOTAL */}
        <div className="xl:col-span-8 flex justify-center sticky top-24">
          <div id="capture-area" className="w-[550px] aspect-[1/1.414] bg-black relative overflow-hidden shadow-2xl">
            {/* FONDO */}
            <div className="absolute inset-0">
               {mainPhoto ? <img src={mainPhoto} crossOrigin="anonymous" className="w-full h-full object-cover object-center" /> : <div className="w-full h-full bg-zinc-900 line-grid"></div>}
               <div className="absolute inset-0 netflix-gradient"></div>
               <div className="absolute top-0 inset-x-0 h-32 header-gradient"></div>
            </div>

            {/* HEADER SIMPLIFICADO PARA CAPTURA (SIN ICONOS EXTERNOS) */}
            <header className="absolute top-0 inset-x-0 h-20 flex items-center justify-between px-10 z-50">
               <div className="text-red-600 text-3xl font-black tracking-tighter">LOVEFLIX</div>
               <div className="flex gap-6 items-center">
                  <div className="text-white opacity-60 text-xl font-bold">⌕</div>
                  <div className="text-white opacity-60 text-xl font-bold">🕭</div>
                  <div className="w-10 h-10 bg-red-600 rounded-sm flex items-center justify-center border border-white/20">
                     <div className="text-white text-xl">☺</div>
                  </div>
               </div>
            </header>

            {/* CONTENIDO PRINCIPAL */}
            <div className="absolute inset-x-12 bottom-48 z-40 space-y-4">
                <div className="flex items-center gap-3">
                  <span className="bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-sm">N</span>
                  <span className="text-white/80 font-bold tracking-[0.4em] text-[9px] uppercase italic underline decoration-red-600 underline-offset-4">Producción Naranja</span>
                </div>
                <h2 className="text-7xl font-script text-white leading-none drop-shadow-lg">{names}</h2>
                <div className="flex items-center gap-5 text-[14px] font-bold text-white/90">
                   <span className="text-green-500">98% para ti</span>
                   <span>{date}</span>
                   <span className="border border-white/40 px-2 py-0.5 rounded-sm text-[10px] font-black">HD 4K</span>
                </div>
                <p className="text-[14px] text-white/80 max-w-md font-medium leading-relaxed italic">{synopsis}</p>
                <div className="flex items-center gap-4 pt-3">
                    <div className="px-12 py-3 bg-white text-black rounded font-black text-xs uppercase tracking-widest">Jugar</div>
                    <div className="px-12 py-3 bg-zinc-800 text-white rounded font-black text-xs uppercase tracking-widest border border-white/10">+ Mi Lista</div>
                </div>
            </div>

            {/* GALERÍA MOMENTOS */}
            <div className="absolute inset-x-12 bottom-10 z-40">
               <h4 className="text-[10px] font-black mb-4 uppercase tracking-[0.3em] text-white/30 italic">Sigue viendo tus momentos</h4>
               <div className="grid grid-cols-5 gap-4">
                  {galleryPhotos.map((photo, i) => (
                    <div key={i} className="aspect-[3/4.2] bg-zinc-950 rounded-sm border border-white/10 overflow-hidden shadow-2xl">
                      {photo && <img src={photo} crossOrigin="anonymous" className="w-full h-full object-cover" />}
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
