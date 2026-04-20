import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Camera, Upload, ArrowLeft, Search, Bell, ThumbsUp, ThumbsDown, Download, Loader2, Save, Trash2, User } from 'lucide-react';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import { supabase } from '../lib/supabase';

export default function MemoryCustomizer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loadingMemory, setLoadingMemory] = useState(!!id);
  
  const [names, setNames] = useState("Valentina & Alejandro");
  const [date, setDate] = useState("2018");
  const [synopsis, setSynopsis] = useState("Mirada a los ojos y mi mundo se detuvo, fue extraño cómo todo comenzó. Quise pasar de nuevo por allí y en ese instante me di cuenta...");
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
      console.error("Error loading memory:", err);
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
          const MAX = 1200; 
          if (width > height && width > MAX) { height *= MAX / width; width = MAX; }
          else if (height > MAX) { width *= MAX / height; height = MAX; }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.85));
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
      if (!base64String || base64String.length < 100) throw new Error("Imagen inválida o vacía");
      if (base64String.startsWith('http')) return base64String;
      
      const base64Data = base64String.split(',')[1];
      const blob = await fetch(`data:image/png;base64,${base64Data}`).then(res => res.blob());
      const { data, error } = await supabase.storage
        .from('memories')
        .upload(path, blob, { contentType: 'image/png', upsert: true });
      if (error) throw error;
      return supabase.storage.from('memories').getPublicUrl(path).data.publicUrl;
    } catch (err: any) {
        throw new Error(`Subida fallida: ${err.message || "Error de conexión"}`);
    }
  };

  const saveMemory = async () => {
    if (!user) { alert("Inicia sesión de nuevo."); return; }
    if (!mainPhoto) { alert("Sube la foto principal."); return; }

    setIsSaving(true);
    const area = document.getElementById('capture-area');
    
    try {
      if (!area) throw new Error("No se detectó el área de diseño.");
      
      // 1. Generar Captura Maestra (VERSION ESTABLE PNG)
      await new Promise(r => setTimeout(r, 2000));
      
      const masterShotDataUrl = await toPng(area, { 
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: '#000000',
      });

      if (!masterShotDataUrl || masterShotDataUrl.length < 500) {
        throw new Error("La captura falló. Inténtalo de nuevo.");
      }

      // 2. Subir Todo
      const timestamp = Date.now();
      const masterUrl = await uploadBase64(masterShotDataUrl, `${user.id}/${timestamp}_master.png`);
      const mainUrl = await uploadBase64(mainPhoto, `${user.id}/${timestamp}_main.jpg`);
      
      const galleryUrls = [];
      for (let i = 0; i < galleryPhotos.length; i++) {
        const p = galleryPhotos[i];
        if (p) {
          const url = await uploadBase64(p, `${user.id}/${timestamp}_gal_${i}.jpg`);
          galleryUrls.push(url);
        }
      }

      const memoryData = {
        user_id: user.id,
        names,
        date_text: date,
        synopsis,
        main_photo_url: mainUrl,
        gallery_photos_urls: galleryUrls,
        full_design_url: masterUrl,
        style: 'loveflix'
      };

      const { data, error } = id 
        ? await supabase.from('memories').update(memoryData).eq('id', id).select()
        : await supabase.from('memories').insert(memoryData).select();

      if (error) throw error;
      alert("¡Recuerdo guardado con éxito!");
      navigate('/mis-recuerdos');

    } catch (err: any) {
      console.error("Critical Save Error:", err);
      alert(`Error: ${err.message}`);
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
        const imgData = await toPng(area, { pixelRatio: 2 });
        const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
        pdf.addImage(imgData, 'PNG', 0, 0, 210, 297);
        pdf.save(`MediaNaranja_${names.split(' ')[0]}.pdf`);
    } catch (err: any) {
        alert(`Error: ${err.message}`);
    } finally {
        setIsExporting(false);
    }
  };

  if (loadingMemory) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#E50914]" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white pt-20 pb-20">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&display=swap');
        .font-script { font-family: 'Dancing Script', cursive; }
        .netflix-gradient { background: linear-gradient(to top, #000 0%, transparent 70%); }
        .header-gradient { background: linear-gradient(to bottom, #000 0%, transparent 100%); }
        .profile-avatar {
          background: linear-gradient(135deg, #E50914 0%, #b20710 100%);
          border-radius: 4px;
        }
      `}</style>

      <div className="max-w-[1500px] mx-auto px-6 grid grid-cols-1 xl:grid-cols-12 gap-10">
        
        {/* PANEL DE EDICIÓN */}
        <div className="xl:col-span-4 space-y-6">
          <div className="bg-[#111] p-8 rounded-[2.5rem] border border-white/5 space-y-8 shadow-2xl">
            <header className="border-b border-white/5 pb-6">
                <div className="flex items-center justify-between">
                   <h1 className="text-2xl font-serif italic text-white leading-tight">Estudio <span className="text-[#E50914]">Loveflix</span></h1>
                   {id && <button onClick={() => navigate('/mis-recuerdos')} className="text-[10px] text-gray-500 hover:text-white uppercase tracking-widest font-bold">Mis Series</button>}
                </div>
                <p className="text-gray-500 text-[10px] uppercase tracking-[0.3em] mt-2 italic font-bold">Procesado de Máxima Fidelidad</p>
            </header>

            <section className="space-y-4">
              <h3 className="text-[10px] font-black uppercase text-[#E50914] tracking-widest">1. Portada del Recuerdo</h3>
              <div onClick={() => document.getElementById('main-upload')?.click()} className="w-full aspect-video bg-[#0a0a0a] rounded-2xl border-2 border-dashed border-gray-800 flex items-center justify-center cursor-pointer hover:border-[#E50914] overflow-hidden group">
                {mainPhoto ? <img src={mainPhoto} className="w-full h-full object-cover" /> : <Upload className="text-gray-700 group-hover:scale-110 transition-transform" />}
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
              <input type="text" value={names} onChange={(e) => setNames(e.target.value)} placeholder="Protagonistas" className="w-full bg-[#080808] border border-gray-800 rounded-xl px-5 py-4 outline-none focus:border-[#E50914] text-sm" />
              <input type="text" value={date} onChange={(e) => setDate(e.target.value)} placeholder="Año" className="w-full bg-[#080808] border border-gray-800 rounded-xl px-5 py-4 outline-none focus:border-[#E50914] text-sm" />
              <textarea value={synopsis} onChange={(e) => setSynopsis(e.target.value)} rows={3} placeholder="Sinopsis..." className="w-full bg-[#080808] border border-gray-800 rounded-xl px-5 py-4 outline-none focus:border-[#E50914] text-sm resize-none"></textarea>
            </section>

            <div className="space-y-3 pt-4">
              <button onClick={saveMemory} disabled={isSaving} className={`w-full py-6 bg-[#E50914] text-white rounded-full font-black text-xs uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3 shadow-[0_10px_40px_rgba(229,9,20,0.3)] ${isSaving ? 'opacity-50 cursor-wait' : 'hover:bg-[#ff1f2d] active:scale-95'}`}>
                {isSaving ? <><Loader2 className="animate-spin" size={20} /> GENERANDO MASTER...</> : <><Save size={20} /> GUARDAR RECUERDO </>}
              </button>
              
              <button onClick={exportPDF} disabled={isExporting} className="w-full py-6 border border-white/5 text-gray-400 rounded-full font-black text-xs uppercase tracking-[0.3em] hover:bg-white hover:text-black transition-all">
                {isExporting ? <Loader2 className="animate-spin mx-auto" /> : "Descargar PDF Prueba"}
              </button>
            </div>
          </div>
        </div>

        {/* ÁREA DE PREVISUALIZACIÓN */}
        <div className="xl:col-span-8 flex justify-center sticky top-24">
          <div id="capture-area" className="w-[550px] aspect-[1/1.414] bg-black shadow-2xl relative overflow-hidden flex flex-col">
            <div className="absolute inset-0 z-0">
               {mainPhoto ? <img src={mainPhoto} crossOrigin="anonymous" className="w-full h-full object-cover object-center" /> : <div className="w-full h-full bg-[#111]"></div>}
               <div className="absolute inset-0 netflix-gradient"></div>
               <div className="absolute top-0 inset-x-0 h-32 header-gradient"></div>
            </div>

            <header className="absolute top-0 inset-x-0 h-20 flex items-center justify-between px-10 z-50">
               <div className="text-[#E50914] text-3xl font-black tracking-tighter drop-shadow-2xl">LOVEFLIX</div>
               <div className="flex gap-6 items-center text-white drop-shadow-lg">
                  <Search size={22}/>
                  <Bell size={22}/>
                  <div className="w-9 h-9 profile-avatar flex items-center justify-center p-1 border border-white/20">
                     <div className="w-full h-full bg-[#E50914] rounded-sm flex items-center justify-center">
                        <User size={18} fill="white" className="text-white opacity-80" />
                     </div>
                  </div>
               </div>
            </header>

            <div className="absolute inset-x-12 bottom-48 z-40 space-y-4">
                <div className="flex items-center gap-3">
                  <span className="bg-[#E50914] text-white text-[10px] font-black px-2 py-0.5 rounded-sm shadow-lg">N</span>
                  <span className="text-white/90 font-bold tracking-[0.5em] text-[9px] uppercase italic underline decoration-[#E50914] underline-offset-4 drop-shadow-lg">Producción Media Naranja</span>
                </div>
                <h2 className="text-7xl font-script text-white leading-none drop-shadow-[0_10px_30px_rgba(0,0,0,1)]">{names}</h2>
                <div className="flex items-center gap-5 text-[14px] font-bold text-white/90 drop-shadow-md">
                   <span className="text-[#46D369]">98% para ti</span>
                   <span>{date}</span>
                   <span className="border border-white/50 px-2 py-0.5 rounded-sm text-[10px] font-black uppercase tracking-widest">HD 4K</span>
                </div>
                <p className="text-[14px] text-white/90 max-w-md font-medium leading-relaxed italic drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">{synopsis}</p>
                <div className="flex items-center gap-4 pt-3">
                    <div className="px-12 py-3.5 bg-white text-black rounded font-black text-xs uppercase tracking-widest shadow-2xl">Jugar</div>
                    <div className="px-12 py-3.5 bg-zinc-800/80 text-white rounded font-black text-xs uppercase tracking-widest border border-white/10">+ Mi Lista</div>
                </div>
            </div>

            <div className="absolute inset-x-12 bottom-10 z-40">
               <h4 className="text-[11px] font-black mb-4 uppercase tracking-[0.4em] text-white/40 italic drop-shadow-lg">Sigue viendo tus momentos</h4>
               <div className="grid grid-cols-5 gap-4">
                  {galleryPhotos.map((photo, i) => (
                    <div key={i} className="aspect-[3/4.2] bg-[#0a0a0a] rounded-sm border border-white/5 overflow-hidden shadow-[0_15px_40px_rgba(0,0,0,0.8)]">
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
