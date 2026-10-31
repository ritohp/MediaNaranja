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
  const isUpgradeParam = searchParams.get('upgrade') === 'true';

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
  const [activeTab, setActiveTab] = useState<'design' | 'audio'>('design');

  // Memory ID generado o actual para el código QR
  const [memoryUid, setMemoryUid] = useState<string>(id || crypto.randomUUID());

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      setUser(user);
      if (user) {
        // Cargar todas las canciones del usuario (pagadas o en demo)
        const { data: songs } = await supabase
          .from('mn_songs')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        setUserPaidSongs(songs || []);

        // Si ya hay un ID específico de recuerdo en la URL
        if (id) {
          fetchSavedMemory(id);
          return;
        }

        // Si hay songId en URL pero no ID de recuerdo, verificar si ya existe un diseño guardado para esta canción
        if (songIdParam) {
          const { data: existingMem } = await supabase
            .from('memories')
            .select('*')
            .eq('song_id', songIdParam)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (existingMem) {
            fetchSavedMemory(existingMem.id);
            return;
          }

          // Si es un diseño nuevo para esta canción, vincularla
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

  const [selectedVersion, setSelectedVersion] = useState<1 | 2>(1);

  const handleVersionChange = async (version: 1 | 2) => {
    setSelectedVersion(version);
    if (!selectedSong) return;

    const updatedFormData = {
      ...(selectedSong.form_data || {}),
      selected_version: version
    };

    setSelectedSong((prev: any) => ({
      ...prev,
      form_data: updatedFormData
    }));

    try {
      await supabase
        .from('mn_songs')
        .update({ form_data: updatedFormData })
        .eq('id', selectedSong.id);
    } catch (err) {
      console.error("Error al actualizar versión seleccionada:", err);
    }
  };

  const handleSelectSong = (s: any, currentUser?: any) => {
    setSelectedSong(s);
    setSongId(s.id);
    setSelectedVersion(s.form_data?.selected_version === 2 ? 2 : 1);

    const isAdmin = currentUser?.email === 'ritohp@gmail.com';
    if (!s.is_paid && !isAdmin) {
      setSongNotPaidWarning(true);
    } else {
      setSongNotPaidWarning(false);
    }

    // Auto-relleno inteligente SOLO si los campos aún conservan su valor por defecto
    const formData = s.form_data || {};
    const recipient = (formData.nombreDestinatario || formData.recipientName || '').trim();
    const author = (formData.authorName || formData.nombreRemitente || '').trim();

    const isNamesDefault = !names || names === "Adam & Emily";
    if (recipient && isNamesDefault) {
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

    // Extraer historia de amor / sinopsis solo si aún está la predeterminada
    const defaultSynopsis = "Mirada a los ojos y mi mundo se detuvo, fue extraño cómo todo comenzó. Quise pasar de nuevo por allí y en ese instante me di cuenta. La dueña de esa mirada era más de lo que podría imaginar. Sonriente, cariñosa, sensible y envolvente. Lo suficiente para que pudiera amarla para siempre.";
    const isSynopsisDefault = !synopsis || synopsis === defaultSynopsis;
    if (isSynopsisDefault) {
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
    }

    // Extraer año / fecha especial solo si aún está la predeterminada
    const isDateDefault = !date || date === "2015";
    if (isDateDefault) {
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
    }

    // Cargar foto principal si no hay ninguna foto subida
    if (!mainPhoto && formData.custom_photo_url) {
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

        // Si tiene canción asociada, cargarla para el reproductor y selector de versiones
        if (data.song_id) {
          const { data: s } = await supabase
            .from('mn_songs')
            .select('*')
            .eq('id', data.song_id)
            .single();
          if (s) {
            setSelectedSong(s);
            setSelectedVersion(s.form_data?.selected_version === 2 ? 2 : 1);
            if (s.is_paid || user?.email === 'ritohp@gmail.com') {
              setSongNotPaidWarning(false);
            } else {
              setSongNotPaidWarning(true);
            }
          }
        }
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
      const isUpgrade = isUpgradeParam || !!selectedSong?.is_paid;
      navigate(`/escuchar/${targetId}?demo=true${isUpgrade ? '&upgrade=true' : ''}`);

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
        <div className="flex items-center gap-3">
          <Link 
            to="/mis-canciones"
            className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors text-xs font-bold uppercase tracking-wider shadow-sm"
          >
            <ArrowLeft size={14} /> Mis Canciones
          </Link>
          <Link 
            to="/mis-recuerdos"
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-xs font-medium"
          >
            Mis Recuerdos
          </Link>
        </div>

        {/* INFORMACIÓN DE PRECIO O MODO PRUEBA */}
        {(isUpgradeParam || (selectedSong && selectedSong.is_paid)) ? (
          <div className="bg-gradient-to-r from-red-950/80 via-amber-950/70 to-zinc-900 border border-amber-500/50 text-amber-200 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-3 shadow-lg">
            <span className="text-base shrink-0">✨</span>
            <div className="flex-1">
              <span className="text-white font-black">¡Tu canción ya está lista!</span> Tu plantilla personalizada de Netflix de Amor solo cuesta <strong className="text-amber-400 font-black">$199 MXN</strong>.
            </div>
          </div>
        ) : songNotPaidWarning ? (
          <div className="bg-zinc-900/90 border border-zinc-700 text-zinc-300 px-4 py-2.5 rounded-xl text-xs flex items-center gap-3">
            <Sparkles size={16} className="text-red-400 shrink-0" />
            <div className="flex-1">
              <strong className="text-white">Estás diseñando tu Netflix de Amor.</strong> Al terminar podrás ver tu demo interactivo antes de elegir tu opción.
            </div>
          </div>
        ) : null}
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
            <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-900 rounded-xl border border-zinc-800 text-xs font-bold">
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
                {/* CANCIÓN ASIGNADA Y SELECTOR DE VERSIONES */}
                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
                    Canción Asignada a la Serie
                  </label>
                  {selectedSong ? (
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-red-600/20 text-red-500 flex items-center justify-center font-bold">
                            <Music size={20} />
                          </div>
                          <div>
                            <h4 className="text-white text-sm font-bold">
                              {selectedSong.title || 'Canción Personalizada'}
                            </h4>
                            <p className="text-[11px] text-zinc-400">
                              {selectedSong.is_paid ? '✓ Canción Liberada' : 'Muestra de 1.5 min'} • {new Date(selectedSong.created_at || Date.now()).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <span className="px-2.5 py-1 bg-red-950 text-red-400 border border-red-800/50 rounded-full text-[9px] font-black uppercase tracking-wider">
                          Vinculada
                        </span>
                      </div>

                      {/* SELECTOR DE LAS 2 VERSIONES DE LA GENERACIÓN */}
                      {selectedSong.form_data?.version2 ? (
                        <div className="pt-3 border-t border-zinc-800 space-y-3">
                          <label className="block text-[11px] font-bold text-amber-300 uppercase tracking-wider">
                            ¿Cuál de las 2 versiones deseas para tu serie Loveflix?
                          </label>
                          <div className="grid grid-cols-2 gap-2.5">
                            {/* BOTÓN VERSIÓN 1 */}
                            <button
                              type="button"
                              onClick={() => handleVersionChange(1)}
                              className={`p-3 rounded-xl border text-left transition-all ${
                                selectedVersion === 1
                                  ? 'bg-red-950/70 border-red-500 ring-2 ring-red-500/40 text-white shadow-lg'
                                  : 'bg-zinc-950/80 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-black uppercase">Opción A</span>
                                {selectedVersion === 1 && <Check size={14} className="text-red-400" />}
                              </div>
                              <p className="text-[10px] text-zinc-400">Versión 1 generada</p>
                            </button>

                            {/* BOTÓN VERSIÓN 2 */}
                            <button
                              type="button"
                              onClick={() => handleVersionChange(2)}
                              className={`p-3 rounded-xl border text-left transition-all ${
                                selectedVersion === 2
                                  ? 'bg-red-950/70 border-red-500 ring-2 ring-red-500/40 text-white shadow-lg'
                                  : 'bg-zinc-950/80 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-black uppercase">Opción B</span>
                                {selectedVersion === 2 && <Check size={14} className="text-red-400" />}
                              </div>
                              <p className="text-[10px] text-zinc-400">Versión 2 generada</p>
                            </button>
                          </div>

                          {/* REPRODUCTOR DE PRUEBA DE LA VERSIÓN SELECCIONADA */}
                          <div className="pt-1">
                            <audio 
                              key={selectedVersion === 1 
                                ? (selectedSong.audio_url || selectedSong.demo_url) 
                                : (selectedSong.form_data?.version2?.audio_url || selectedSong.form_data?.version2?.demo_url)}
                              src={
                                (() => {
                                  const raw = selectedVersion === 1 
                                    ? (selectedSong.audio_url || selectedSong.demo_url) 
                                    : (selectedSong.form_data?.version2?.audio_url || selectedSong.form_data?.version2?.demo_url);
                                  if (!raw || raw.includes('tempfile.aiquickdraw.com') || raw.includes('cloudinary.com/demo')) {
                                    return '/audio/love_song_sample.mp3';
                                  }
                                  return raw;
                                })()
                              }
                              controls
                              className="w-full h-9 rounded-lg"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="pt-2 border-t border-zinc-800">
                          <p className="text-[10px] text-zinc-400 mb-2">Versión única disponible de tu canción:</p>
                          <audio 
                            key={selectedSong.audio_url || selectedSong.demo_url}
                            src={selectedSong.audio_url || selectedSong.demo_url || '/audio/love_song_sample.mp3'}
                            controls
                            className="w-full h-9 rounded-lg"
                          />
                        </div>
                      )}
                    </div>
                  ) : userPaidSongs.length > 0 ? (
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
                          🎵 {s.title || 'Canción Personalizada'} {s.is_paid ? '✓' : '(Demo)'} ({new Date(s.created_at).toLocaleDateString()})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 text-xs text-zinc-400 space-y-2">
                      <p>No se encontraron canciones creadas en tu cuenta.</p>
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
                      {isSaving ? "Guardando y Preparando Demo..." : "🎬 Ver Demo Interactivo de Nuestra Serie"}
                    </span>
                  </button>

                  <p className="text-[11px] text-zinc-400 text-center">
                    Disfruta la experiencia Loveflix en vivo con tu música y fotos antes de confirmar tu pedido.
                  </p>

                  <button
                    type="button"
                    onClick={() => setActiveTab('design')}
                    className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
                  >
                    <ArrowLeft size={14} />
                    <span>Volver a Editar Diseño</span>
                  </button>
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
