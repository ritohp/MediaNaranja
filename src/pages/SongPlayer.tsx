import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  Play, Pause, Download, Edit3, Image as ImageIcon, Heart, 
  Share2, Lock, FileText, CheckCircle2, Home, Briefcase, 
  Hammer, Users, Star, Mountain, Feather, TreeDeciduous, User, Copy, MessageCircle
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { toJpeg } from 'html-to-image';
import { jsPDF } from 'jspdf';
import type { InfographicData } from '../services/ai';
import AnchorGraphic from '../components/tribute/AnchorGraphics';
import PDFLayout from '../components/tribute/PDFLayout';
import TributeAddon from '../components/tribute/TributeAddon';

// Mapeo dinámico de iconos de Lucide
const IconMap: Record<string, any> = {
  Home, Briefcase, Hammer, Users, Star, Heart, Mountain, Feather, TreeDeciduous
};

export default function SongPlayer() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [song, setSong] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ photoUrl: '', dedication: '', recipient: '' });
  const [isUploading, setIsUploading] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const pdfRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
    loadSong();
  }, [id]);

  async function loadSong() {
    try {
      const { data, error } = await supabase
        .from('mn_songs')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setSong(data);
      setEditData({
        photoUrl: data.form_data?.custom_photo_url || "/papa-sorpresa.png",
        dedication: data.form_data?.custom_dedication || "Gracias por cada enseñanza y cada sonrisa.",
        recipient: data.form_data?.recipientName || data.form_data?.nombreDestinatario || "Papá"
      });
    } catch (err) {
      console.error("Error cargando canción:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (audioRef.current && song) {
      const audio = audioRef.current;
      const isAdminUser = user?.email === 'ritohp@gmail.com';
      const isSongPaid = song.is_paid || isAdminUser;

      const updateProgress = () => {
        if (!isSongPaid && audio.currentTime >= 90) {
          audio.pause();
          audio.currentTime = 0;
          setIsPlaying(false);
          alert("Has alcanzado el límite de la versión de prueba (1.5 min). ¡Desbloquea tu regalo para escucharla completa!");
        }
        setCurrentTime(audio.currentTime);
        setProgress((audio.currentTime / audio.duration) * 100);
      };
      const updateDuration = () => setDuration(audio.duration);
      const onEnded = () => setIsPlaying(false);

      audio.addEventListener('timeupdate', updateProgress);
      audio.addEventListener('loadedmetadata', updateDuration);
      audio.addEventListener('ended', onEnded);

      return () => {
        audio.removeEventListener('timeupdate', updateProgress);
        audio.removeEventListener('loadedmetadata', updateDuration);
        audio.removeEventListener('ended', onEnded);
      };
    }
  }, [song, user]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (audioRef.current) {
      const newTime = (Number(e.target.value) / 100) * duration;
      audioRef.current.currentTime = newTime;
      setProgress(Number(e.target.value));
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${song.id}-${Math.random()}.${fileExt}`;
      const filePath = `custom_photos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('memories')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('memories')
        .getPublicUrl(filePath);

      setEditData(prev => ({ ...prev, photoUrl: publicUrl }));
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Hubo un error al subir la imagen.");
    } finally {
      setIsUploading(false);
    }
  };

  const saveEdits = async () => {
    try {
      setIsUploading(true);
      const newFormData = { ...song.form_data, 
        custom_photo_url: editData.photoUrl,
        custom_dedication: editData.dedication,
        nombreDestinatario: editData.recipient
      };

      const { error } = await supabase
        .from('mn_songs')
        .update({ form_data: newFormData })
        .eq('id', song.id);

      if (error) throw error;
      setSong({ ...song, form_data: newFormData });
      setIsEditing(false);
    } catch (err) {
      console.error("Error guardando edición", err);
      alert("Error al guardar los cambios.");
    } finally {
      setIsUploading(false);
    }
  };

  const generatePDF = async () => {
    if (!pdfRef.current || !isPaid) {
      if (!isPaid) alert("Debes desbloquear la canción para descargar la Infografía en alta calidad.");
      return;
    }
    
    setIsUploading(true);
    try {
      const element = pdfRef.current;
      
      const imgData = await toJpeg(element, {
        quality: 1.0,
        backgroundColor: '#F8F3E9',
        pixelRatio: 2
      });
      
      const elementWidth = element.scrollWidth || 800;
      const elementHeight = element.scrollHeight || 1200;
      
      // Ajustamos a proporciones de Tamaño Carta (Letter)
      const pdf = new jsPDF('p', 'mm', 'letter');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Historia_${recipient.replace(/\s+/g, '_')}.pdf`);
      
    } catch (error: any) {
      console.error("Error generando PDF:", error);
      alert(`Hubo un error al generar tu certificado: ${error.message || error}`);
    } finally {
      setIsUploading(false);
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#F8F3E9]"><div className="animate-spin text-[#A88B5B]"><Heart /></div></div>;
  }

  if (!song) {
    return <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F3E9]">Canción no encontrada.</div>;
  }

  const isOwner = user?.id === song.user_id;
  const isAdmin = user?.email === 'ritohp@gmail.com';
  const isPaid = song.is_paid || isAdmin;
  
  // Bloqueo de acceso público
  if (!isPaid && !isOwner && !isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#111] p-6 text-center animate-in fade-in zoom-in duration-500">
        <div className="bg-[#1C2A39] p-8 md:p-12 rounded-[2.5rem] shadow-2xl max-w-lg w-full border border-[#2A3F54] relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 text-white">
            <Lock size={120} />
          </div>
          <div className="w-20 h-20 bg-naranja-500/20 text-naranja-400 rounded-full flex items-center justify-center mx-auto mb-6 relative z-10">
            <Lock size={40} />
          </div>
          <h2 className="text-2xl font-serif text-white mb-4 relative z-10">Legado Privado</h2>
          <p className="text-gray-400 mb-8 relative z-10 text-sm leading-relaxed">
            Esta canción y su legado aún no han sido desbloqueados públicamente por su creador.
          </p>
          <button 
            onClick={() => { localStorage.removeItem('mn_draft_song'); navigate('/crear-cancion'); }}
            className="w-full py-4 bg-gradient-to-r from-naranja-500 to-naranja-600 text-white rounded-xl font-bold uppercase tracking-widest text-xs hover:scale-105 transition-all"
          >
            CREAR MI PROPIO LEGADO
          </button>
        </div>
      </div>
    );
  }

  const selectedVersion = song.form_data?.selected_version || 1;
  const currentAudioUrl = selectedVersion === 2
    ? (song.form_data?.version2?.audio_url || song.form_data?.version2?.demo_url)
    : (song.audio_url || song.demo_url);
    
  const photoUrl = song.form_data?.legacy_photo_url || song.form_data?.custom_photo_url || "/papa-sorpresa.png";
  
  // Extraer datos infográficos
  const hasTributeData = !!song.form_data?.infographic_data;
  const infoData: InfographicData = song.form_data?.infographic_data || {
    theme: 'legacy',
    archetype: 'LEGACY',
    timeline: [],
    shields: [],
    nameMeaning: {name: "", meaning: ""},
    lastNameMeaning: {lastName: "", meaning: ""},
    quote: "",
    familyMembers: [],
    testimonials: []
  };

  const recipient = editData.recipient || 'Tu Ser Querido';
  const title = song.title || "Tu Canción";
  const theme = infoData.theme || 'legacy';
  const archetype = infoData.archetype || 'LEGACY';

  // DESIGN TOKENS (Variables de Tema Dinámicas)
  const tokens = theme === 'love' ? {
    bg: 'bg-[#FFF0F5]',
    bgHex: '#FFF0F5',
    text: 'text-[#4A0E2E]',
    accent: 'text-[#D64060]',
    border: 'border-[#D64060]',
    borderHex: '#D64060',
    svgFill: '#4A0E2E',
    svgStroke: '#D64060',
    fontTitle: 'font-serif italic',
    ornament: 'rounded-full'
  } : {
    bg: 'bg-[#F8F3E9]',
    bgHex: '#F8F3E9',
    text: 'text-[#1C2A39]',
    accent: 'text-[#B69D74]',
    border: 'border-[#B69D74]',
    borderHex: '#B69D74',
    svgFill: '#1C2A39',
    svgStroke: '#B69D74',
    fontTitle: 'font-serif',
    ornament: 'rounded-none'
  };

  // Función para renderizar el contenido infográfico compartido entre Web y PDF
  const renderInfographicContent = (isPdf = false) => {
    const legacyFullName = (infoData?.nameMeaning?.name && infoData?.lastNameMeaning?.lastName)
      ? `${infoData.nameMeaning.name} ${infoData.lastNameMeaning.lastName}`.trim()
      : recipient;
      
    return (
    <div className={`relative ${isPdf ? 'w-[800px] p-12' : 'w-full p-6 md:p-12'} mx-auto`} style={{ fontFamily: 'Georgia, serif' }}>
      
      {/* Borde Decorativo */}
      <div className={`absolute inset-4 border-[1.5px] ${tokens.border} z-0 opacity-60 ${theme === 'love' ? 'rounded-3xl' : ''}`}></div>
      <div className={`absolute inset-[20px] border-[0.5px] ${tokens.border} z-0 opacity-40 ${theme === 'love' ? 'rounded-2xl' : ''}`}></div>

      {/* Ornamentos Esquinas */}
      <div className={`absolute top-3 left-3 w-8 h-8 border-t-2 border-l-2 ${tokens.border} z-0 ${tokens.ornament}`}></div>
      <div className={`absolute top-3 right-3 w-8 h-8 border-t-2 border-r-2 ${tokens.border} z-0 ${tokens.ornament}`}></div>
      <div className={`absolute bottom-3 left-3 w-8 h-8 border-b-2 border-l-2 ${tokens.border} z-0 ${tokens.ornament}`}></div>
      <div className={`absolute bottom-3 right-3 w-8 h-8 border-b-2 border-r-2 ${tokens.border} z-0 ${tokens.ornament}`}></div>

      <div className="relative z-10 text-center">
        {/* Título Principal */}
        <h3 className={`text-[#333] tracking-[0.2em] text-sm md:text-base font-semibold uppercase mb-2 mt-4`}>La Historia de</h3>
        <h1 className={`text-4xl md:text-6xl ${tokens.text} font-bold uppercase tracking-widest mb-2`}>{legacyFullName}</h1>
        <div className="flex items-center justify-center gap-4 mb-10 opacity-70">
          <div className={`h-[2px] w-12 ${tokens.bgHex === '#F8F3E9' ? 'bg-[#B69D74]' : 'bg-[#D64060]'}`}></div>
          <span className={`${tokens.accent} uppercase tracking-[0.3em] text-xs font-bold`}>Una vida que dejó huella</span>
          <div className={`h-[2px] w-12 ${tokens.bgHex === '#F8F3E9' ? 'bg-[#B69D74]' : 'bg-[#D64060]'}`}></div>
        </div>

        {/* Anchor Graphic y Foto */}
        <div className="flex flex-col items-center mb-8 relative">
          <div className="z-20 mb-[-2.5rem] relative hidden">
             <AnchorGraphic archetype={archetype} initialName={recipient} className="w-20 h-20" />
          </div>
          
          <div className="relative flex items-center justify-center mt-6 w-56 h-56 md:w-72 md:h-72">
            {/* Foto circular */}
            <div className={`w-full h-full rounded-full overflow-hidden border-[6px] border-[#FDF8EE] shadow-xl relative z-10`}>
              <img src={photoUrl} alt={recipient} className="w-full h-full object-cover sepia-[0.1] contrast-110" crossOrigin="anonymous"/>
            </div>
            {/* Laurels perfectamente centrados sobre la foto */}
            <img src="/assets/laureles.png" alt="Laureles" className="absolute w-[125%] h-[125%] max-w-none opacity-90 object-contain drop-shadow-sm pointer-events-none z-20" style={{ left: '-12.5%', top: '-12.5%' }} crossOrigin="anonymous"/>
          </div>
          
          <div className="mt-8 w-full text-center px-4 relative z-30">
            <p className={`text-[#333] italic text-sm md:text-base font-medium font-serif`}>"{infoData.quote}"</p>
            <Heart size={16} className={`mx-auto mt-3 ${tokens.accent}`} fill="currentColor" />
          </div>
        </div>

        {/* Separador */}
        <div className="flex items-center justify-center gap-4 mt-12 mb-10">
          <div className={`h-[2px] w-24 md:w-48 ${tokens.bgHex === '#F8F3E9' ? 'bg-[#B69D74]' : 'bg-[#D64060]'} opacity-40`}></div>
          <span className="text-[#333] tracking-[0.2em] text-xs font-bold uppercase">Línea del Tiempo</span>
          <div className={`h-[2px] w-24 md:w-48 ${tokens.bgHex === '#F8F3E9' ? 'bg-[#B69D74]' : 'bg-[#D64060]'} opacity-40`}></div>
        </div>

        {/* Línea del Tiempo */}
        <div className="flex flex-col md:flex-row justify-between items-start w-full px-4 md:px-8 mb-12 relative gap-8 md:gap-0">
          <div className={`absolute top-6 bottom-6 left-10 w-[2px] md:bottom-auto md:w-auto md:top-6 md:left-12 md:right-12 md:h-[2px] ${tokens.bgHex === '#F8F3E9' ? 'bg-[#B69D74]' : 'bg-[#D64060]'} opacity-40 z-0`}></div>
          {infoData.timeline.slice(0, 5).map((item: any, idx: number) => {
            const Icon = IconMap[item.icon] || Star;
            return (
              <div key={idx} className="flex flex-row md:flex-col items-center md:w-[18%] relative z-10 w-full gap-4 md:gap-0">
                <div className={`w-12 h-12 shrink-0 rounded-full bg-white border ${tokens.border} flex items-center justify-center md:mb-4 ${tokens.text} shadow-sm`}>
                  <Icon size={20} />
                </div>
                <div className="flex flex-col items-start md:items-center text-left md:text-center w-full">
                  <h4 className={`text-[12px] md:text-[11px] font-bold ${tokens.text} mb-1 md:mb-2 uppercase`}>{item.title}</h4>
                  <p className="text-[11px] md:text-[10px] text-[#555] leading-tight">{item.subtitle}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Significados */}
        <div className={`border-t-[2px] border-b-[2px] ${tokens.border} border-opacity-30 py-8 mb-12 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-0`}>
          <div className={`md:border-r-[2px] ${tokens.border} border-opacity-30 px-6 flex flex-col items-center text-center relative`}>
            <span className="text-[#333] tracking-[0.2em] text-[10px] font-bold uppercase mb-2">El Significado de su Nombre</span>
            <div className="flex justify-center items-end mb-4 mt-2 gap-2">
               <h3 className={`text-4xl md:text-5xl ${tokens.text} ${tokens.fontTitle}`}>{infoData.nameMeaning.name}</h3>
               <img src="/assets/pluma.png" alt="Pluma" className="w-8 h-8 md:w-10 md:h-10 opacity-70 object-contain mix-blend-multiply mb-1" crossOrigin="anonymous"/>
            </div>
            <p className="text-xs text-[#333] font-medium leading-relaxed max-w-[250px] relative z-10">
              {infoData.nameMeaning.meaning}
            </p>
          </div>
          
          <div className="px-6 flex flex-col items-center text-center relative">
            <span className="text-[#333] tracking-[0.2em] text-[10px] font-bold uppercase mb-2">El Origen de sus Apellidos</span>
            <div className="flex justify-center items-end mb-4 mt-2 gap-2">
               <h3 className={`text-4xl md:text-5xl ${tokens.text} ${tokens.fontTitle}`}>{infoData.lastNameMeaning.lastName}</h3>
               <img src="/assets/arbol.png" alt="Árbol" className="w-10 h-10 md:w-12 md:h-12 opacity-60 object-contain mix-blend-multiply mb-0" crossOrigin="anonymous"/>
            </div>
            <p className="text-xs text-[#333] font-medium leading-relaxed max-w-[280px] relative z-10 whitespace-pre-line">
              {infoData.lastNameMeaning.meaning}
            </p>
          </div>
        </div>

        {/* Escudos / Legado */}
        <div className="mb-12">
          <span className="text-[#333] tracking-[0.2em] text-xs font-bold uppercase block mb-2">{theme === 'love' ? 'Nuestros Valores' : 'Su Legado'}</span>
          <p className="text-[10px] text-[#555] mb-8 italic">Los valores que dejaron y que seguirán vivos por siempre.</p>
          <div className="flex justify-center gap-4 md:gap-6 flex-wrap">
            {infoData.shields.slice(0, 5).map((shield, idx) => {
              const Icon = IconMap[shield.icon] || Heart;
              return (
                <div key={idx} className="flex flex-col items-center w-16 md:w-20">
                  <div className="relative mb-3 flex items-center justify-center">
                    <svg width="56" height="64" viewBox="0 0 48 56" fill="#1C2A39" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-lg">
                      <path d="M24 0L48 10.6667V24C48 38.0133 37.7067 51.1067 24 56C10.2933 51.1067 0 38.0133 0 24V10.6667L24 0Z" stroke="#B69D74" strokeWidth="2.5"/>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center text-[#B69D74]">
                      <Icon size={22} fill="currentColor" strokeWidth={0} />
                    </div>
                  </div>
                  <span className={`text-[8px] md:text-[9px] font-bold ${tokens.text} uppercase tracking-wider text-center`}>{shield.name}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legado vive en */}
        <div className={`mb-4 border-t-[2px] ${tokens.border} border-opacity-30 pt-8`}>
          <span className="text-[#333] tracking-[0.2em] text-xs font-bold uppercase block mb-2">{theme === 'love' ? 'Nuestra Historia Vive En' : 'Su Legado Vive En'}</span>
          <p className="text-[10px] text-[#555] mb-8 italic">Toda historia importante continúa a través de las personas que inspira.</p>
          <div className="flex justify-center flex-wrap gap-4 md:gap-8">
            {infoData.familyMembers.map((member, idx) => (
              <div key={idx} className="flex flex-col items-center">
                <div className={`w-12 h-12 rounded-full border-[1.5px] ${tokens.border} flex items-center justify-center ${tokens.accent} mb-2 bg-transparent shadow-sm`}>
                  <User size={20} />
                </div>
                <span className="text-[9px] font-bold text-[#333] uppercase tracking-wider">{member}</span>
              </div>
            ))}
          </div>
          <Heart size={16} className={`mx-auto mt-6 ${tokens.accent}`} fill="currentColor" />
        </div>

        {/* Sección Inferior Diferenciada (Web: Reproductor / PDF: QR) */}
        {isPdf ? (
          <div className={`border-[2px] ${tokens.border} border-opacity-40 p-6 rounded-lg max-w-sm mx-auto flex flex-col items-center mt-12 mb-4`}>
            <span className="text-[#333] tracking-[0.2em] text-sm font-bold uppercase mb-2">Escucha su Canción</span>
            <p className="text-xs text-[#555] mb-4 italic">Escanea el código QR para escuchar la canción que cuenta su historia.</p>
            <div className="bg-white p-3 shadow-md rounded-md border border-[#E8DCC8]">
              <QRCodeSVG value={`${window.location.origin}/cancion/${song.id}`} size={100} fgColor="#1C2A39" />
            </div>
          </div>
        ) : (
          <div className="mt-8 mb-16 px-4 pb-8">
            <span className="text-[#333] tracking-[0.2em] text-xs font-bold uppercase block mb-2">Su Canción</span>
            <p className="text-[10px] text-[#555] mb-6 italic">Cada palabra cuenta su historia, cada nota su esencia.</p>
            <div className="bg-[#1C2A39] p-6 rounded-2xl shadow-2xl max-w-md mx-auto relative overflow-hidden border border-[#2A3F54]">
               <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent"></div>
               
               <div className="relative z-10 flex gap-4 items-center">
                  <img src={photoUrl} className="w-16 h-16 rounded-lg object-cover shadow-md border border-[#B69D74]/30" crossOrigin="anonymous"/>
                  <div className="flex-1 text-left">
                    <h4 className="text-white text-xs md:text-sm tracking-widest font-bold mb-1 opacity-90 truncate">{title}</h4>
                    <p className="text-[#B69D74] text-[9px] uppercase tracking-widest">Una canción creada especialmente para él.</p>
                  </div>
               </div>
               
               <div className="relative z-10 mt-6">
                  <div className="flex items-center justify-between text-[9px] text-[#B69D74] font-mono mb-1">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={progress}
                    onChange={handleSeek}
                    className="w-full h-1 bg-[#2A3F54] rounded-lg appearance-none cursor-pointer accent-[#B69D74]"
                  />
                  <div className="flex items-center justify-center gap-6 mt-4">
                    <button className="text-gray-400 hover:text-[#B69D74] transition"><Share2 size={16} /></button>
                    <button 
                      onClick={togglePlay}
                      className="w-12 h-12 rounded-full border border-[#B69D74] text-[#B69D74] flex items-center justify-center hover:bg-[#B69D74] hover:text-[#1C2A39] transition-colors shadow-lg"
                    >
                      {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-1" />}
                    </button>
                    <button className="text-gray-400 hover:text-[#B69D74] transition"><Heart size={16} /></button>
                  </div>
               </div>
            </div>
            
            <p className="text-[9px] text-center italic font-medium mt-8 text-[#555] max-w-sm mx-auto leading-relaxed">
              Gracias por enseñarnos con tu ejemplo que el verdadero éxito<br/>
              es dejar un legado en el corazón de los demás.
            </p>
            <Heart size={12} className={`mx-auto mt-3 ${tokens.accent} opacity-50`} fill="currentColor" />
          </div>
        )}

      </div>
    </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#111] py-8 px-4 md:py-12 flex justify-center">
      
      {/* Contenedor principal de la Web (Simulando un póster flotante) */}
      <div className={`w-full max-w-2xl ${tokens.bg} shadow-2xl relative overflow-hidden rounded-md transition-colors duration-500`}>
        
        {!hasTributeData && song.form_data?.category === 'papa' ? (
          <div className="w-full">
            <TributeAddon song={song} />
          </div>
        ) : (
          renderInfographicContent(false)
        )}

        {/* Acciones Web */}
        <div className={`px-6 md:px-12 pb-12 pt-6 flex flex-col gap-4 border-t ${tokens.border} border-opacity-20 mt-4 relative z-20 ${tokens.bg}`}>
          
          {!isPaid && (isAdmin || isOwner) && (
            <div className="bg-orange-50 border border-orange-200 p-4 rounded-xl mb-2 text-center shadow-inner">
              <p className="text-[10px] text-orange-800 font-medium uppercase tracking-widest mb-1 flex items-center justify-center gap-1">
                <Lock size={12} /> LEGADO RESTRINGIDO
              </p>
              <p className="text-xs text-orange-700 leading-relaxed italic">
                Para descargar la canción completa, obtener el PDF en alta calidad y poder compartir este enlace públicamente, necesitas desbloquear tu regalo.
              </p>
            </div>
          )}

          <button 
            onClick={() => {
              if (isPaid) {
                 window.open(song.selected_version ? song.selected_version.url : currentAudioUrl, '_blank');
              } else {
                 window.location.href = `https://buy.stripe.com/dRm5kwcXzf2T7kgdI72Ry00?client_reference_id=${song.id}`;
              }
            }}
            className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-colors shadow-md tracking-wider text-[10px] md:text-xs uppercase
              ${isPaid ? 'bg-[#1C2A39] text-white hover:bg-[#2A3F54]' : 'bg-gradient-to-r from-[#D64060] to-[#B69D74] text-white'}`}
          >
            {isPaid ? <Download size={16} /> : <Lock size={16} className="opacity-60" />}
            {isPaid ? "Descargar Canción MP3" : "Desbloquear Canción + PDF + Web ($399 MXN)"}
          </button>
          
          <button 
            onClick={() => {
              if (isPaid) {
                 generatePDF();
              } else {
                 window.location.href = `https://buy.stripe.com/dRm5kwcXzf2T7kgdI72Ry00?client_reference_id=${song.id}`;
              }
            }}
            className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-colors shadow-md tracking-wider text-[10px] md:text-xs uppercase
              ${isPaid ? 'bg-[#FDF8EE] border border-[#B69D74] text-[#1C2A39] hover:bg-[#F2E8D5]' : 'bg-gradient-to-r from-[#D64060] to-[#B69D74] text-white'}`}
          >
            {isPaid ? <FileText size={16} className="text-[#B69D74]" /> : <Lock size={16} className="opacity-60" />}
            {isPaid ? "Descargar Póster PDF para Imprimir" : "Desbloquear Póster PDF ($399 MXN)"}
          </button>
          
          {isPaid && (
            <div className="pt-4 mt-2 border-t border-[#1C2A39]/10 grid grid-cols-2 gap-3">
              <button 
                onClick={() => {
                  const url = window.location.href;
                  navigator.clipboard.writeText(url);
                  alert('¡Enlace copiado al portapapeles!');
                }}
                className="py-3 bg-white text-[#1C2A39] border border-[#1C2A39]/20 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors text-[10px] uppercase tracking-widest"
              >
                <Copy size={14} /> Copiar Enlace
              </button>
              <button 
                onClick={() => {
                  const url = window.location.href;
                  const text = `¡Mira la canción mágica y el legado que me hicieron! 🎧✨%0A%0A${url}`;
                  window.open(`https://wa.me/?text=${text}`, '_blank');
                }}
                className="py-3 bg-[#25D366] text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#20bd5a] transition-colors text-[10px] uppercase tracking-widest shadow-sm"
              >
                <MessageCircle size={14} /> WhatsApp
              </button>
            </div>
          )}
          
          {isOwner && !isPaid && (
            <button 
              onClick={() => setIsEditing(true)}
              className="w-full py-3 text-[#555] text-[10px] font-medium flex items-center justify-center gap-2 hover:text-[#B69D74] transition-colors uppercase tracking-widest mt-2"
            >
              <Edit3 size={14} /> Personalizar Foto y Textos (Gratis)
            </button>
          )}
        </div>

      </div>

      {/* Contenedor Oculto para Generación PDF (Posicionado fuera de pantalla para mantener la altura completa real) */}
      <div style={{ position: 'absolute', top: '-20000px', left: '-20000px' }}>
        <div ref={pdfRef} className="bg-transparent">
          <PDFLayout 
             infoData={infoData} 
             recipient={recipient} 
             photoUrl={photoUrl} 
             songId={song.id} 
             theme={theme} 
             archetype={archetype} 
          />
        </div>
      </div>
      
      {currentAudioUrl && <audio ref={audioRef} src={currentAudioUrl} />}
      
      {/* Modal de Edición */}
      {isEditing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsEditing(false)}></div>
          <div className={`${tokens.bg} rounded-2xl p-6 md:p-8 max-w-md w-full relative z-10 border ${tokens.border} shadow-2xl max-h-[90vh] overflow-y-auto`}>
            <h3 className={`text-lg md:text-xl font-serif ${tokens.text} uppercase tracking-widest mb-6 text-center border-b ${tokens.border} border-opacity-30 pb-4`}>Personalizar Infografía</h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-bold text-[#555] uppercase tracking-widest mb-2">Foto Principal</label>
                <div className={`border border-dashed ${tokens.border} bg-white rounded-xl p-4 text-center hover:opacity-80 transition cursor-pointer relative overflow-hidden`}>
                  {isUploading ? (
                    <div className="py-4">
                      <div className="animate-spin w-6 h-6 border-2 border-[#B69D74] border-t-transparent rounded-full mx-auto"></div>
                    </div>
                  ) : editData.photoUrl && editData.photoUrl !== "/papa-sorpresa.png" ? (
                    <div className="relative group">
                      <img src={editData.photoUrl} alt="Preview" className="w-full h-32 object-cover rounded-lg sepia-[0.2]" />
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                        <span className="text-white text-xs font-bold flex items-center gap-1"><Edit3 size={12}/> Cambiar foto</span>
                      </div>
                      <input type="file" accept="image/*" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                    </div>
                  ) : (
                    <div className="py-2">
                      <ImageIcon className="mx-auto text-[#B69D74] mb-2" />
                      <span className="text-xs text-[#555]">Haz clic para subir una foto</span>
                      <input type="file" accept="image/*" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#555] uppercase tracking-widest mb-2">Nombre Completo</label>
                <input 
                  type="text" 
                  value={editData.recipient}
                  onChange={e => setEditData({...editData, recipient: e.target.value})}
                  className="w-full border border-[#E8DCC8] bg-white rounded-xl p-3 outline-none focus:border-[#B69D74] text-sm font-serif"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#555] uppercase tracking-widest mb-2">Frase Célebre (Bajo la foto)</label>
                <textarea 
                  value={editData.dedication}
                  onChange={e => setEditData({...editData, dedication: e.target.value})}
                  rows={2}
                  className="w-full border border-[#E8DCC8] bg-white rounded-xl p-3 outline-none focus:border-[#B69D74] resize-none text-sm font-serif italic"
                ></textarea>
              </div>

              <div className="flex gap-4 pt-4 border-t border-[#B69D74] border-opacity-30">
                <button onClick={() => setIsEditing(false)} className="flex-1 py-3 text-[#555] font-bold hover:bg-[#E8DCC8] rounded-xl transition text-xs uppercase tracking-widest">Cancelar</button>
                <button onClick={saveEdits} disabled={isUploading} className="flex-1 py-3 bg-[#1C2A39] text-white font-bold rounded-xl hover:bg-[#2A3F54] transition disabled:opacity-50 text-xs uppercase tracking-widest">Guardar</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
