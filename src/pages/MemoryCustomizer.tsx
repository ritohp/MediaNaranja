import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { 
  Camera, Upload, ArrowLeft, ArrowRight, Loader2, Save, Trash2, Search, Bell, 
  Gift, Heart, Music, Check, Volume2, Sparkles, MapPin, Phone, 
  Download, Eye, Lock, ShieldCheck, CheckCircle2 
} from 'lucide-react';
import { toJpeg, toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '../lib/supabase';
import VoiceRecorder from '../components/VoiceRecorder';

export default function MemoryCustomizer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(window.location.search);
  const songIdParam = searchParams.get('songId');

  const [user, setUser] = useState<any>(null);
  const [loadingMemory, setLoadingMemory] = useState(true);
  
  // Canción vinculada
  const [songId, setSongId] = useState<string | null>(songIdParam || null);
  const [selectedSong, setSelectedSong] = useState<any | null>(null);
  const [userPaidSongs, setUserPaidSongs] = useState<any[]>([]);
  const [songNotPaidWarning, setSongNotPaidWarning] = useState(false);

  // Campos de personalización Loveflix
  const [names, setNames] = useState("Adam & Emily");
  const [date, setDate] = useState("2015");
  const [authorName, setAuthorName] = useState("Adam Foster");
  const [recipientName, setRecipientName] = useState("Emily Willians");
  const [synopsis, setSynopsis] = useState(
    "Mirada a los ojos y mi mundo se detuvo, fue extraño cómo todo comenzó. Quise pasar de nuevo por allí y en ese instante me di cuenta. La dueña de esa mirada era más de lo que podría imaginar. Sonriente, cariñosa, sensible y envolvente. Lo suficiente para que pudiera amarla para siempre."
  );
  
  // Fotos
  const [mainPhoto, setMainPhoto] = useState<string | null>(null);
  const [galleryPhotos, setGalleryPhotos] = useState<(string | null)[]>([null, null, null, null, null]);

  // Audio / Nota de Voz
  const [voiceNoteUrl, setVoiceNoteUrl] = useState<string>('');

  // Tipo de producto y envío
  const [productType, setProductType] = useState<'physical_box' | 'digital_poster'>('physical_box');
  const [shippingAddress, setShippingAddress] = useState({
    street: '',
    colony: '',
    city: '',
    state: '',
    zipCode: '',
    references: ''
  });
  const [phone, setPhone] = useState('');

  // Estados de carga y feedback
  const [isExporting, setIsExporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'design' | 'audio' | 'order'>('design');

  // Memory ID generado o actual para el código QR
  const [memoryUid, setMemoryUid] = useState<string>(id || crypto.randomUUID());

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      setUser(user);
      if (user) {
        // Cargar canciones pagadas del usuario
        const { data: songs } = await supabase
          .from('mn_songs')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        const paid = (songs || []).filter(s => s.is_paid || user.email === 'ritohp@gmail.com');
        setUserPaidSongs(paid);

        // Si hay songId en URL, cargar y validar
        if (songIdParam) {
          const targetSong = (songs || []).find(s => s.id === songIdParam);
          if (targetSong) {
            handleSelectSong(targetSong, user);
          } else {
            // Cargar de base de datos directa
            const { data: singleSong } = await supabase
              .from('mn_songs')
              .select('*')
              .eq('id', songIdParam)
              .single();
            if (singleSong) handleSelectSong(singleSong, user);
          }
        }
      }

      if (id) {
        fetchSavedMemory(id);
      } else {
        setLoadingMemory(false);
      }
    });
  }, [id, songIdParam]);

  const handleSelectSong = (s: any, currentUser?: any) => {
    setSelectedSong(s);
    setSongId(s.id);

    const isAdmin = currentUser?.email === 'ritohp@gmail.com';
    if (!s.is_paid && !isAdmin) {
      setSongNotPaidWarning(true);
    } else {
      setSongNotPaidWarning(false);
    }

    // Auto-relleno inteligente desde los datos de la canción (formato nuevo o anterior)
    const formData = s.form_data || {};
    const recipient = (formData.nombreDestinatario || formData.recipientName || '').trim();
    const author = (formData.authorName || formData.nombreRemitente || '').trim();

    if (recipient) {
      // Capitalizar nombre
      const capRecipient = recipient.charAt(0).toUpperCase() + recipient.slice(1);
      setRecipientName(capRecipient);
      if (author) {
        const capAuthor = author.charAt(0).toUpperCase() + author.slice(1);
        setAuthorName(capAuthor);
        setNames(`${capAuthor} & ${capRecipient}`);
      } else {
        setNames(`${capRecipient} & Amor`);
      }
    }

    // Extraer historia de amor / sinopsis
    const storyParts = [
      formData.comoSeConocieron,
      formData.momentosImportantes,
      formData.anecdota,
      formData.queSientes,
      formData.initialContext,
      formData.specificDetails
    ].filter(Boolean);

    if (storyParts.length > 0) {
      const fullStory = storyParts.join(' ').replace(/\s+/g, ' ').trim();
      setSynopsis(fullStory.slice(0, 360));
    }

    // Extraer año / fecha especial
    const dateSource = [
      formData.fechaEspecial,
      formData.fecha,
      formData.date,
      formData.initialContext,
      formData.birthDate
    ].filter(Boolean).join(' ');

    const yearMatch = dateSource.match(/\b(19\d{2}|20\d{2})\b/);
    if (yearMatch) {
      setDate(yearMatch[1]);
    } else if (s.created_at) {
      setDate(new Date(s.created_at).getFullYear().toString());
    }

    // Cargar foto principal si ya existía en la canción
    if (formData.custom_photo_url) {
      setMainPhoto(formData.custom_photo_url);
    }
  };

  const fetchSavedMemory = async (memoryId: string) => {
    try {
      const { data, error } = await supabase
        .from('memories')
        .select('*')
        .eq('id', memoryId)
        .single();
      
      if (error) throw error;
      if (data) {
        setNames(data.names || "Adam & Emily");
        setDate(data.date_text || "2015");
        setSynopsis(data.synopsis || "");
        setMainPhoto(data.main_photo_url || null);
        setGalleryPhotos(data.gallery_photos_urls || [null, null, null, null, null]);
        setSongId(data.song_id || null);
        setVoiceNoteUrl(data.voice_note_url || '');
        setAuthorName(data.author_name || '');
        setRecipientName(data.recipient_name || '');
        setProductType(data.product_type || 'physical_box');
        setPhone(data.phone || '');
        if (data.shipping_address) {
          try {
            setShippingAddress(JSON.parse(data.shipping_address));
          } catch {
            setShippingAddress(prev => ({ ...prev, street: data.shipping_address }));
          }
        }
        setMemoryUid(data.id);
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
          const MAX = 1400;
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
      if (!base64String || base64String.length < 500) throw new Error("Captura inválida");
      const base64Data = base64String.split(',')[1];
      const blob = await fetch(`data:image/jpeg;base64,${base64Data}`).then(res => res.blob());
      const { data, error } = await supabase.storage
        .from('memories')
        .upload(path, blob, { contentType: 'image/jpeg', upsert: true });
      if (error) throw error;
      return supabase.storage.from('memories').getPublicUrl(path).data.publicUrl;
    } catch (err: any) {
      throw new Error(`Error de subida: ${err.message}`);
    }
  };

  const saveMemory = async () => {
    if (!user) {
      alert("Por favor inicia sesión para guardar tu pedido.");
      return;
    }

    if (songNotPaidWarning) {
      alert("Para procesar tu pedido de Caja Musical o Lámina Digital, primero debes desbloquear tu canción.");
      return;
    }

    if (!mainPhoto) {
      alert("Por favor sube la foto principal de fondo.");
      return;
    }

    if (productType === 'physical_box' && (!shippingAddress.street || !shippingAddress.zipCode || !phone)) {
      alert("Por favor completa los datos de envío (calle, código postal y teléfono).");
      setActiveTab('order');
      return;
    }

    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const area = document.getElementById('capture-area');
      if (!area) throw new Error("Área de captura no encontrada");

      // Pequeño retardo para asegurar que imágenes y fuentes carguen perfectamente
      await new Promise(r => setTimeout(r, 1200));

      // Captura en ultra alta resolución (300 DPI aprox para impresión en madera MDF)
      const masterShotDataUrl = await toJpeg(area, {
        quality: 0.95,
        pixelRatio: 2.5,
        cacheBust: true,
        backgroundColor: '#000000',
      });

      const targetId = id || memoryUid;
      const masterUrl = await uploadBase64(masterShotDataUrl, `${user.id}/${targetId}_print_master.jpg`);
      
      let mainUrl = mainPhoto;
      if (mainPhoto.startsWith('data:')) {
        mainUrl = await uploadBase64(mainPhoto, `${user.id}/${targetId}_main.jpg`);
      }

      const galleryUrls = [];
      for (let i = 0; i < galleryPhotos.length; i++) {
        const p = galleryPhotos[i];
        if (p) {
          if (p.startsWith('data:')) {
            const url = await uploadBase64(p, `${user.id}/${targetId}_gal_${i}.jpg`);
            galleryUrls.push(url);
          } else {
            galleryUrls.push(p);
          }
        } else {
          galleryUrls.push(null);
        }
      }

      const payload = {
        user_id: user.id,
        song_id: songId,
        names,
        date_text: date,
        author_name: authorName,
        recipient_name: recipientName,
        synopsis,
        main_photo_url: mainUrl,
        gallery_photos_urls: galleryUrls,
        full_design_url: masterUrl,
        voice_note_url: voiceNoteUrl,
        product_type: productType,
        shipping_address: JSON.stringify(shippingAddress),
        phone,
        style: 'loveflix',
        status: 'pending_payment'
      };

      const { error } = id
        ? await supabase.from('memories').update(payload).eq('id', id)
        : await supabase.from('memories').insert({ id: targetId, ...payload });

      if (error) throw error;

      setSaveSuccess(true);
      alert("¡Diseño guardado con éxito! Tu pedido ha sido registrado.");
      navigate('/mis-recuerdos');

    } catch (err: any) {
      console.error("Save memory error:", err);
      alert(`Error al guardar: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLaunchDemo = async () => {
    if (!user) {
      alert("Por favor inicia sesión con tu cuenta para guardar y ver el demo interactivo de tu serie.");
      return;
    }

    setIsSaving(true);
    try {
      const targetId = id || memoryUid;

      // 1. Guardar la foto principal si es data URL
      let mainUrl = mainPhoto;
      if (mainPhoto && mainPhoto.startsWith('data:')) {
        mainUrl = await uploadBase64(mainPhoto, `${user.id}/${targetId}_main.jpg`);
      }

      // 2. Guardar las fotos de galería que sean data URLs
      const galleryUrls = [];
      for (let i = 0; i < galleryPhotos.length; i++) {
        const p = galleryPhotos[i];
        if (p) {
          if (p.startsWith('data:')) {
            const url = await uploadBase64(p, `${user.id}/${targetId}_gal_${i}.jpg`);
            galleryUrls.push(url);
          } else {
            galleryUrls.push(p);
          }
        } else {
          galleryUrls.push(null);
        }
      }

      // 3. Capturar el render para la impresión física
      let masterUrl = undefined;
      const area = document.getElementById('capture-area');
      if (area) {
        try {
          const masterShotDataUrl = await toJpeg(area, {
            quality: 0.92,
            pixelRatio: 2.0,
            cacheBust: true,
            backgroundColor: '#000000',
          });
          masterUrl = await uploadBase64(masterShotDataUrl, `${user.id}/${targetId}_print_master.jpg`);
        } catch (captureErr) {
          console.warn("Capture warning:", captureErr);
        }
      }

      const payload: any = {
        user_id: user.id,
        song_id: songId,
        names,
        date_text: date,
        author_name: authorName,
        recipient_name: recipientName,
        synopsis,
        main_photo_url: mainUrl,
        gallery_photos_urls: galleryUrls,
        voice_note_url: voiceNoteUrl,
        product_type: productType,
        shipping_address: JSON.stringify(shippingAddress),
        phone,
        style: 'loveflix',
        status: 'pending_payment'
      };

      if (masterUrl) {
        payload.full_design_url = masterUrl;
      }

      const { error } = id
        ? await supabase.from('memories').update(payload).eq('id', id)
        : await supabase.from('memories').insert({ id: targetId, ...payload });

      if (error) throw error;

      // Navegar inmediatamente a la mini página web en modo demo interactivo
      navigate(`/escuchar/${targetId}?demo=true`);

    } catch (err: any) {
      console.error("Error generando demo:", err);
      alert(`No se pudo cargar el demo: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const exportPDF = async () => {
    const area = document.getElementById('capture-area');
    if (!area) return;
    setIsExporting(true);
    try {
      await new Promise(r => setTimeout(r, 800));
      const imgData = await toPng(area, { pixelRatio: 2 });
      const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
      pdf.addImage(imgData, 'PNG', 0, 0, 210, 297);
      pdf.save(`Loveflix_${names.replace(/\s+/g, '_')}.pdf`);
    } catch (err: any) {
      alert("Error exportando PDF: " + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  const publicGiftUrl = `${window.location.origin}/escuchar/${memoryUid}`;

  if (loadingMemory) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6 text-center text-white">
        <div className="relative mb-6">
          <img 
            src="/mascota_loading.png" 
            alt="Naranjín" 
            className="w-44 h-44 object-contain animate-pulse mx-auto" 
          />
          <div className="absolute inset-0 border-4 border-dashed border-red-600/30 rounded-full animate-spin-slow pointer-events-none"></div>
        </div>
        <h2 className="text-2xl font-serif font-bold text-white mb-2">Abriendo el Estudio Loveflix...</h2>
        <p className="text-zinc-400 max-w-sm text-sm">
          Naranjín está preparando la mesa de diseño para tu Caja Musical.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080808] text-white pt-20 pb-24 selection:bg-red-900 font-sans">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Dancing+Script:wght@700&display=swap');
        .font-script { font-family: 'Dancing Script', cursive; }
        .font-bebas { font-family: 'Bebas Neue', cursive; letter-spacing: 2.5px; }
        .netflix-gradient-bottom { background: linear-gradient(to top, rgba(0,0,0,0.96) 0%, rgba(0,0,0,0.7) 45%, transparent 80%); }
        .netflix-gradient-top { background: linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, transparent 100%); }
      `}</style>

      {/* HEADER DE NAVEGACIÓN */}
      <div className="max-w-[1500px] mx-auto px-6 mb-6 flex flex-wrap items-center justify-between gap-4">
        <Link 
          to="/mis-recuerdos"
          className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-xs font-bold uppercase tracking-wider"
        >
          <ArrowLeft size={16} /> Volver a mis recuerdos
        </Link>

        {/* ALERTA DE CANCIÓN SIN DESBLOQUEAR */}
        {songNotPaidWarning && (
          <div className="bg-amber-950/80 border border-amber-600/80 text-amber-200 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-3">
            <Lock size={14} className="text-amber-400" />
            <span>Esta canción aún no está desbloqueada.</span>
            <button
              onClick={() => {
                if (songId) {
                  window.location.href = `https://buy.stripe.com/dRmdR23mZ07ZdIEfQf2Ry01?client_reference_id=${songId}`;
                }
              }}
              className="bg-amber-500 hover:bg-amber-600 text-black px-3 py-1 rounded-lg text-[10px] uppercase font-black tracking-wider transition-all"
            >
              Desbloquear ($249 MXN)
            </button>
          </div>
        )}
      </div>

      <div className="max-w-[1500px] mx-auto px-6 grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        
        {/* PANEL DE CONTROL / EDICIÓN */}
        <div className="xl:col-span-5 space-y-6">
          <div className="bg-[#121212] border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
            
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div>
                <h1 className="text-2xl font-serif font-bold text-white flex items-center gap-2">
                  Caja Musical <span className="text-red-600 italic">Loveflix</span>
                </h1>
                <p className="text-xs text-zinc-400 mt-1">Personaliza el diseño para la tapa en madera MDF</p>
              </div>
              <span className="px-3 py-1 bg-red-950/80 text-red-400 border border-red-800/60 rounded-full text-[10px] font-black uppercase tracking-widest">
                Edición Parejas
              </span>
            </div>

            {/* SELECCIÓN DE PESTAÑAS DE CONFIGURACIÓN */}
            <div className="grid grid-cols-3 gap-2 p-1 bg-zinc-900 rounded-xl border border-zinc-800 text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveTab('design')}
                className={`py-2.5 rounded-lg transition-all ${activeTab === 'design' ? 'bg-red-600 text-white shadow-md' : 'text-zinc-400 hover:text-white'}`}
              >
                1. Diseño & Fotos
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('audio')}
                className={`py-2.5 rounded-lg transition-all ${activeTab === 'audio' ? 'bg-red-600 text-white shadow-md' : 'text-zinc-400 hover:text-white'}`}
              >
                2. Canción & Voz
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('order')}
                className={`py-2.5 rounded-lg transition-all ${activeTab === 'order' ? 'bg-red-600 text-white shadow-md' : 'text-zinc-400 hover:text-white'}`}
              >
                3. Producto & Envío
              </button>
            </div>

            {/* PESTAÑA 1: DISEÑO Y FOTOS */}
            {activeTab === 'design' && (
              <div className="space-y-5 animate-in fade-in duration-300">
                {/* SUBIDA DE FOTO PRINCIPAL */}
                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
                    Foto Principal (Fondo de Portada) *
                  </label>
                  <div
                    onClick={() => document.getElementById('main-photo-input')?.click()}
                    className="w-full aspect-video bg-zinc-950 rounded-2xl border-2 border-dashed border-zinc-700 hover:border-red-600 flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden relative group"
                  >
                    {mainPhoto ? (
                      <>
                        <img src={mainPhoto} alt="Foto Principal" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-xs font-bold">
                          Cambiar Foto Principal
                        </div>
                      </>
                    ) : (
                      <div className="text-center p-4">
                        <Upload size={28} className="text-zinc-500 mx-auto mb-2" />
                        <p className="text-xs font-bold text-zinc-300">Haz clic para subir la foto principal</p>
                        <p className="text-[10px] text-zinc-500 mt-1">Recomendado: Foto horizontal o de pareja abrazada</p>
                      </div>
                    )}
                    <input 
                      type="file" 
                      id="main-photo-input" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => handlePhotoUpload(e)} 
                    />
                  </div>
                </div>

                {/* GALERÍA DE 5 MOMENTOS */}
                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
                    Galería "Nuestros Mejores Momentos" (5 fotos)
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {galleryPhotos.map((photo, i) => (
                      <div
                        key={i}
                        onClick={() => document.getElementById(`gal-upload-${i}`)?.click()}
                        className="aspect-[3/4] bg-zinc-950 rounded-xl border border-zinc-700 hover:border-red-600 flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden relative group"
                      >
                        {photo ? (
                          <img src={photo} alt={`Momento ${i + 1}`} className="w-full h-full object-cover" />
                        ) : (
                          <div className="text-center p-1">
                            <Camera size={14} className="text-zinc-600 mx-auto mb-1" />
                            <span className="text-[9px] text-zinc-500 font-bold">#{i + 1}</span>
                          </div>
                        )}
                        <input
                          type="file"
                          id={`gal-upload-${i}`}
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handlePhotoUpload(e, i)}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* TEXTOS DEL AFICHE */}
                <div className="space-y-3 pt-2">
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                      Nombres de los Protagonistas (Título Cursivo)
                    </label>
                    <input
                      type="text"
                      value={names}
                      onChange={(e) => setNames(e.target.value)}
                      placeholder="Ej: Adam & Emily"
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm focus:border-red-600 outline-none transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                        Juntos Desde (Año)
                      </label>
                      <input
                        type="text"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        placeholder="Ej: 2018"
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm focus:border-red-600 outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                        Destinado a (Nombre)
                      </label>
                      <input
                        type="text"
                        value={recipientName}
                        onChange={(e) => setRecipientName(e.target.value)}
                        placeholder="Ej: Emily Willians"
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm focus:border-red-600 outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                      Escrito por (Tu Nombre)
                    </label>
                    <input
                      type="text"
                      value={authorName}
                      onChange={(e) => setAuthorName(e.target.value)}
                      placeholder="Ej: Adam Foster"
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm focus:border-red-600 outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                      Sinopsis / Historia de Amor (Párrafo Central)
                    </label>
                    <textarea
                      value={synopsis}
                      onChange={(e) => setSynopsis(e.target.value)}
                      rows={4}
                      placeholder="Escribe la historia o anécdota..."
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm focus:border-red-600 outline-none transition-colors resize-none leading-relaxed"
                    ></textarea>
                  </div>
                </div>

                {/* NAVEGACIÓN PASO 1 */}
                <div className="pt-4 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setActiveTab('audio')}
                    className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-red-950/50 flex items-center justify-center gap-2 transition-all active:scale-95"
                  >
                    <span>Continuar a Canción & Voz</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* PESTAÑA 2: CANCIÓN Y NOTA DE VOZ */}
            {activeTab === 'audio' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                {/* VINCULACIÓN DE CANCIÓN */}
                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
                    Canción Vinculada de Media Naranja
                  </label>
                  {userPaidSongs.length > 0 ? (
                    <select
                      value={songId || ''}
                      onChange={(e) => {
                        const target = userPaidSongs.find(s => s.id === e.target.value);
                        if (target) handleSelectSong(target, user);
                      }}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white focus:border-red-600 outline-none"
                    >
                      <option value="">-- Selecciona una de tus canciones --</option>
                      {userPaidSongs.map(s => (
                        <option key={s.id} value={s.id}>
                          🎵 {s.title || 'Canción Personalizada'} ({new Date(s.created_at).toLocaleDateString()})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 text-xs text-zinc-400 space-y-2">
                      <p>No se encontraron canciones pagadas en tu cuenta.</p>
                      <Link to="/crear-cancion" className="text-red-500 font-bold hover:underline inline-block">
                        Crear una canción ahora →
                      </Link>
                    </div>
                  )}
                </div>

                {/* GRABADOR DE NOTA DE VOZ */}
                <VoiceRecorder 
                  userId={user?.id}
                  initialAudioUrl={voiceNoteUrl}
                  onAudioSaved={(url) => setVoiceNoteUrl(url)}
                />

                {/* NAVEGACIÓN PASO 2 */}
                <div className="pt-4 border-t border-zinc-800 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab('design')}
                    className="py-3.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
                  >
                    <ArrowLeft size={16} />
                    <span>Volver al Diseño</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('order')}
                    className="py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black text-xs uppercase tracking-[0.15em] shadow-lg shadow-red-950/50 flex items-center justify-center gap-2 transition-all active:scale-95"
                  >
                    <span>Continuar a Envío</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* PESTAÑA 3: PRODUCTO Y ENVÍO */}
            {activeTab === 'order' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                {/* SELECCIÓN DE PRODUCTO */}
                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-3">
                    Selecciona tu Presentación:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div
                      onClick={() => setProductType('physical_box')}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all ${productType === 'physical_box' ? 'bg-red-950/40 border-red-600 ring-2 ring-red-600/50' : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xl">📦</span>
                        {productType === 'physical_box' && <CheckCircle2 size={16} className="text-red-500" />}
                      </div>
                      <h4 className="text-sm font-bold text-white">Caja Musical MDF</h4>
                      <p className="text-[11px] text-zinc-400 mt-1 leading-snug">
                        Caja de madera con chip de música recargable + impresión en la tapa + envío a domicilio.
                      </p>
                    </div>

                    <div
                      onClick={() => setProductType('digital_poster')}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all ${productType === 'digital_poster' ? 'bg-red-950/40 border-red-600 ring-2 ring-red-600/50' : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xl">🖼️</span>
                        {productType === 'digital_poster' && <CheckCircle2 size={16} className="text-red-500" />}
                      </div>
                      <h4 className="text-sm font-bold text-white">Lámina Digital con QR</h4>
                      <p className="text-[11px] text-zinc-400 mt-1 leading-snug">
                        Descarga el póster en ultra-alta resolución listo para imprimir y enmarcar en tu ciudad.
                      </p>
                    </div>
                  </div>
                </div>

                {/* FORMULARIO DE ENVÍO (SOLO SI ES FÍSICA) */}
                {productType === 'physical_box' ? (
                  <div className="space-y-4 pt-2 border-t border-zinc-800">
                    <div className="flex items-center gap-2 text-xs font-bold text-red-500 uppercase tracking-wider">
                      <MapPin size={16} /> Dirección de Envío en México
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-zinc-400 uppercase mb-1">Calle y Número *</label>
                      <input
                        type="text"
                        value={shippingAddress.street}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, street: e.target.value })}
                        placeholder="Ej: Av. Reforma 123, Depto 4B"
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm focus:border-red-600 outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-zinc-400 uppercase mb-1">Colonia *</label>
                        <input
                          type="text"
                          value={shippingAddress.colony}
                          onChange={(e) => setShippingAddress({ ...shippingAddress, colony: e.target.value })}
                          placeholder="Ej: Juárez"
                          className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm focus:border-red-600 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-zinc-400 uppercase mb-1">Código Postal *</label>
                        <input
                          type="text"
                          value={shippingAddress.zipCode}
                          onChange={(e) => setShippingAddress({ ...shippingAddress, zipCode: e.target.value })}
                          placeholder="Ej: 06600"
                          className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm focus:border-red-600 outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-zinc-400 uppercase mb-1">Ciudad / Municipio *</label>
                        <input
                          type="text"
                          value={shippingAddress.city}
                          onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                          placeholder="Ej: Cuauhtémoc"
                          className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm focus:border-red-600 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-zinc-400 uppercase mb-1">Estado *</label>
                        <input
                          type="text"
                          value={shippingAddress.state}
                          onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })}
                          placeholder="Ej: CDMX"
                          className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm focus:border-red-600 outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-zinc-400 uppercase mb-1">Teléfono / WhatsApp para entrega *</label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Ej: 55 1234 5678"
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm focus:border-red-600 outline-none"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800 text-xs text-zinc-400 space-y-2">
                    <p className="font-bold text-white">✨ Entrega Digital Inmediata</p>
                    <p>
                      Al completar el pedido, podrás descargar tu archivo listo para imprenta en formato PDF y JPG de alta resolución (300 DPI), con el código QR que reproduce la canción y tu nota de voz.
                    </p>
                  </div>
                )}

                {/* BOTÓN ESTRELLA: VER DEMO INTERACTIVO */}
                <div className="pt-4 border-t border-zinc-800 space-y-3">
                  <button
                    type="button"
                    onClick={handleLaunchDemo}
                    disabled={isSaving}
                    className="w-full py-4.5 bg-gradient-to-r from-red-600 via-rose-600 to-red-600 hover:from-red-500 hover:to-red-700 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-red-950/60 flex items-center justify-center gap-2.5 transition-all active:scale-95 disabled:opacity-50 group border border-red-500/30"
                  >
                    {isSaving ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Sparkles size={18} className="text-amber-300 animate-pulse group-hover:rotate-12 transition-transform" />
                    )}
                    <span className="text-sm">
                      {isSaving ? "Guardando y Preparando Demo..." : "🎬 Ver Demo Interactivo"}
                    </span>
                  </button>

                  <p className="text-[11px] text-zinc-400 text-center">
                    Disfruta la experiencia Loveflix en vivo con tu música y fotos antes de confirmar.
                  </p>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('audio')}
                      className="py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white rounded-xl font-bold text-[11px] uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
                    >
                      <ArrowLeft size={14} />
                      <span>Volver a Audio</span>
                    </button>

                    <button
                      type="button"
                      onClick={exportPDF}
                      disabled={isExporting}
                      className="py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white rounded-xl font-bold text-[11px] uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
                    >
                      {isExporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                      <span>Muestra PDF</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* ÁREA DE CAPTURA - PREVIEW EXACTO DEL DISEÑO LOVEFLIX */}
        <div className="xl:col-span-7 flex flex-col items-center sticky top-24">
          <div className="mb-3 flex items-center justify-between w-full max-w-[550px] text-xs font-bold text-zinc-400">
            <span>Vista Previa del Arte (Proporción para Tapa MDF)</span>
            <span className="text-red-500">Formato HD</span>
          </div>

          {/* CONTENEDOR DE CAPTURA HTML2CANVAS / HTML-TO-IMAGE */}
          <div 
            id="capture-area" 
            className="w-full max-w-[550px] aspect-[1/1.414] bg-black relative overflow-hidden shadow-2xl rounded-sm select-none"
          >
            {/* FONDO PRINCIPAL CON FOTO */}
            <div className="absolute inset-0">
              {mainPhoto ? (
                <img 
                  src={mainPhoto} 
                  alt="Pareja" 
                  crossOrigin="anonymous" 
                  className="w-full h-full object-cover object-center" 
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-b from-zinc-800 to-zinc-950 flex items-center justify-center text-zinc-600 text-xs font-bold uppercase tracking-widest">
                  [Sube la Foto Principal]
                </div>
              )}
              {/* Degradados cinemáticos estilo Netflix */}
              <div className="absolute inset-0 netflix-gradient-bottom"></div>
              <div className="absolute top-0 inset-x-0 h-28 netflix-gradient-top"></div>
            </div>

            {/* HEADER LOVEFLIX ESTILO NETFLIX */}
            <header className="absolute top-0 inset-x-0 h-16 flex items-center justify-between px-7 z-40">
              <div className="flex items-center gap-4">
                <span 
                  className="text-[#E50914] text-3xl font-normal leading-none select-none drop-shadow-sm font-bebas"
                >
                  LOVEFLIX
                </span>
                <div className="hidden sm:flex items-center gap-3 text-[10px] font-bold text-white/80">
                  <span>Inicio</span>
                  <span>Series</span>
                  <span>Películas</span>
                  <span>Tendencia</span>
                </div>
              </div>

              <div className="flex items-center gap-3 text-white/80">
                <span className="text-sm">⌕</span>
                <span className="text-sm">🎁</span>
                <span className="text-sm">🔔</span>
                <div className="w-6 h-6 rounded-sm bg-[#E50914] border border-white/20 overflow-hidden flex items-center justify-center">
                  {mainPhoto ? (
                    <img src={mainPhoto} alt="Avatar" crossOrigin="anonymous" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[10px] text-white">☺</span>
                  )}
                </div>
              </div>
            </header>

            {/* CONTENIDO INFERIOR: ESTRUCTURA FLEX PARA EVITAR TODO TIPO DE SOLAPAMIENTO */}
            <div className="absolute inset-x-7 bottom-4 z-40 flex flex-col justify-end space-y-3">
              
              {/* BLOQUE DE TÍTULO, BADGES Y SINOPSIS */}
              <div className="space-y-1.5">
                {/* BADGE N PAREJAS */}
                <div className="flex items-center gap-2">
                  <span className="bg-[#E50914] text-white font-black text-[9px] px-1.5 py-0.5 rounded-xs shadow-md leading-none">
                    N
                  </span>
                  <span className="text-white/90 font-black text-[10px] tracking-[0.25em] uppercase">
                    PAREJAS
                  </span>
                </div>

                {/* NOMBRES DE LOS PROTAGONISTAS */}
                <h2 className="text-5xl font-script text-white leading-tight drop-shadow-xl py-0.5">
                  {names || "Nombre & Nombre"}
                </h2>

                {/* FILA DE BADGES */}
                <div className="flex items-center gap-2.5 text-[11px] font-bold text-white/90">
                  <span className="text-emerald-400 font-extrabold">Juntos Desde {date || "2015"}</span>
                  <span className="bg-emerald-600 text-white px-1 py-0.2 rounded-[2px] text-[9px] font-black">L</span>
                  <span className="text-white/80 text-[10px]">1° Gran Amor</span>
                  <span className="border border-white/40 px-1 py-0.2 rounded-[2px] text-[8px] font-bold text-white/70">HD</span>
                </div>

                {/* TOP 10 RANKING */}
                <div className="flex items-center gap-2">
                  <span className="bg-[#E50914] text-white font-black text-[8px] px-1 py-0.5 rounded-[2px] tracking-tighter">
                    TOP 10
                  </span>
                  <span className="text-white font-bold text-[10px] tracking-wide">
                    Las Mejores Parejas Del Mundo
                  </span>
                </div>

                {/* SINOPSIS / TEXTO DE AMOR */}
                <p className="text-[10px] sm:text-[10.5px] text-white/85 font-normal leading-relaxed max-w-[430px] drop-shadow-md pr-2 line-clamp-3">
                  {synopsis}
                </p>

                {/* BOTONES INTERFAZ NETFLIX + CRÉDITOS */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2">
                    <div className="px-4 py-1.5 bg-white text-black rounded font-black text-[10px] uppercase tracking-wider flex items-center gap-1 shadow-md">
                      <span>▶</span> Play
                    </div>
                    <div className="px-3.5 py-1.5 bg-white/20 backdrop-blur-md text-white rounded font-bold text-[10px] uppercase tracking-wider border border-white/20 flex items-center gap-1">
                      <span>✓</span> Favorito
                    </div>
                    <div className="w-6 h-6 rounded-full bg-white/20 border border-white/30 flex items-center justify-center text-[10px] text-white">
                      👍
                    </div>
                    <div className="w-6 h-6 rounded-full bg-white/20 border border-white/30 flex items-center justify-center text-[10px] text-white">
                      👎
                    </div>
                  </div>

                  <div className="text-right text-[8px] sm:text-[8.5px] text-white/70 leading-tight">
                    {authorName && <div><span className="opacity-70">Escrito por:</span> {authorName}</div>}
                    {recipientName && <div><span className="opacity-70">Destinado a:</span> {recipientName}</div>}
                  </div>
                </div>
              </div>

              {/* SECCIÓN INFERIOR SEPARADA: NUESTROS MEJORES MOMENTOS + CÓDIGO QR */}
              <div className="pt-2.5 border-t border-white/15">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-[10.5px] font-black uppercase tracking-wider text-white">
                    Nuestros Mejores Momentos
                  </h4>
                  <span className="text-[8px] text-white/60 font-mono tracking-widest uppercase">
                    Escanea para escuchar 🎵
                  </span>
                </div>

                <div className="grid grid-cols-5 gap-2.5 items-end">
                  {galleryPhotos.slice(0, 4).map((photo, i) => (
                    <div 
                      key={i} 
                      className="aspect-[3/4] bg-zinc-900 rounded-sm border border-white/20 overflow-hidden shadow-lg"
                    >
                      {photo ? (
                        <img src={photo} alt={`Momento ${i + 1}`} crossOrigin="anonymous" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[9px] text-zinc-600 font-bold">
                          Foto {i + 1}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* ÚLTIMO SLOT: 5TA FOTO O CÓDIGO QR DE ESCUCHA */}
                  <div className="aspect-[3/4] bg-white rounded-sm border border-white/30 p-1.5 flex flex-col items-center justify-center shadow-lg relative group overflow-hidden">
                    <QRCodeSVG
                      value={publicGiftUrl}
                      size={64}
                      level="M"
                      fgColor="#000000"
                      bgColor="#ffffff"
                    />
                    <span className="text-[7px] font-black text-black uppercase tracking-tighter mt-1">
                      Escanéame
                    </span>
                  </div>
                </div>
              </div>

            </div>

          </div>

          <p className="text-[11px] text-zinc-500 mt-4 text-center max-w-sm">
            💡 Este arte se imprimirá directamente en la tapa de la caja musical MDF o podrás descargarlo en formato póster digital.
          </p>
        </div>

      </div>
    </div>
  );
}
