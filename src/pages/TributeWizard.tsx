import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, Wand2, RefreshCw, BookOpen, ArrowLeft, Camera, Image as ImageIcon, Music, Check, Sparkles, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { generateInfographicData } from '../services/ai';

export default function TributeWizard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [song, setSong] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [fullName, setFullName] = useState<string>('');
  const [customDedication, setCustomDedication] = useState<string>('');
  const [majorMilestone, setMajorMilestone] = useState<string>('');
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<number>(1);

  useEffect(() => {
    async function loadData() {
      try {
        const { data, error } = await supabase.from('mn_songs').select('*').eq('id', id).single();
        if (error) throw error;
        setSong(data);
        
        if (data) {
          const recipientName = data.form_data?.nombreDestinatario || data.form_data?.childName || "";
          const recipientLastName = data.form_data?.apellidoDestinatario || "";
          setFullName(`${recipientName} ${recipientLastName}`.trim());

          if (data.form_data?.selected_version) {
            setSelectedVersion(data.form_data.selected_version);
          }

          if (data.form_data?.custom_dedication) {
            setCustomDedication(data.form_data.custom_dedication);
          }

          if (data.form_data?.major_milestone) {
            setMajorMilestone(data.form_data.major_milestone);
          }

          if (data.form_data?.legacy_photo_url) {
            setPhotoUrl(data.form_data.legacy_photo_url);
          }
        }
      } catch (err) {
        console.error("Error al cargar datos en TributeWizard:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  const compressImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob((blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error("Canvas toBlob failed"));
            }
          }, 'image/jpeg', 0.8);
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !song) return;

    try {
      setIsUploading(true);
      
      const compressedBlob = await compressImage(file);
      const compressedFile = new File([compressedBlob], `image.jpg`, { type: 'image/jpeg' });

      const fileName = `${song.id}-legacy-${Date.now()}.jpg`;
      const path = `${song.user_id || 'anonymous'}/${fileName}`;

      const { error } = await supabase.storage
        .from('memories')
        .upload(path, compressedFile);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('memories')
        .getPublicUrl(path);

      setPhotoUrl(publicUrl);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Hubo un error al subir la imagen. Intenta con una imagen más pequeña.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleGenerate = async () => {
    if (!fullName.trim() || !fullName.includes(' ')) {
      alert("Por favor ingresa el nombre y al menos un apellido para poder rastrear el origen de su legado.");
      return;
    }

    if (!customDedication.trim() || !majorMilestone.trim()) {
      alert("Por favor completa los campos de dedicatoria e hito de vida para diseñar tu Biografía Digital.");
      return;
    }
    
    setIsGenerating(true);
    try {
      const archetype = song.form_data?.category?.toUpperCase() || "LEGACY";
      
      // Separación inteligente de nombre y apellido
      const clean = fullName.trim();
      let firstName = clean;
      let lastName = "";

      const originalFirstName = song.form_data?.nombreDestinatario || "";
      if (originalFirstName && clean.toLowerCase().startsWith(originalFirstName.toLowerCase())) {
        firstName = clean.substring(0, originalFirstName.length).trim();
        lastName = clean.substring(originalFirstName.length).trim();
      } else {
        const parts = clean.split(/\s+/);
        if (parts.length > 1) {
          const firstLower = parts[0].toLowerCase().replace(/\./g, '');
          const isAbbreviation = parts[0].length <= 2 || ['ma', 'maria', 'jose', 'juan', 'luis', 'ana'].includes(firstLower);
          
          if (parts.length === 3 && isAbbreviation) {
            firstName = `${parts[0]} ${parts[1]}`;
            lastName = parts[2];
          } else if (parts.length >= 4) {
            firstName = `${parts[0]} ${parts[1]}`;
            lastName = parts.slice(2).join(' ');
          } else {
            firstName = parts[0];
            lastName = parts.slice(1).join(' ');
          }
        }
      }

      // Reconstruir la historia a partir del contexto del tema original
      const storyParts = [
        song.form_data?.initialContext,
        song.form_data?.specificDetails,
        song.form_data?.familyNames ? `Familiares: ${song.form_data.familyNames}` : null,
        song.form_data?.interviewAnswers ? JSON.stringify(song.form_data.interviewAnswers) : null
      ].filter(Boolean);
      const story = storyParts.join(". ");

      // Las respuestas combinadas para la IA
      const combinedAnswers = [
        ...Object.values(song.form_data?.interviewAnswers || {}),
        customDedication ? `Dedicatoria especial: ${customDedication}` : null,
        majorMilestone ? `Mayor logro/hito: ${majorMilestone}` : null
      ].filter(Boolean) as string[];

      const infographicData = await generateInfographicData(
        story, 
        combinedAnswers, 
        firstName, 
        lastName, 
        archetype, 
        "legacy"
      );

      const newFormData = {
        ...song.form_data,
        nombreDestinatario: firstName,
        apellidoDestinatario: lastName,
        infographic_data: infographicData,
        legacy_photo_url: photoUrl,
        custom_dedication: customDedication,
        major_milestone: majorMilestone,
        selected_version: selectedVersion
      };

      const { error } = await supabase
        .from('mn_songs')
        .update({ form_data: newFormData })
        .eq('id', song.id);

      if (error) throw error;

      navigate(`/cancion/${song.id}`);
    } catch (err) {
      console.error(err);
      alert("Hubo un error al generar tu Biografía Digital. Intenta de nuevo.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F3E9] p-6 text-center">
        <div className="relative mb-6">
          <img 
            src="/mascota_loading.png" 
            alt="Naranjín" 
            className="w-48 h-48 md:w-56 md:h-56 object-contain animate-pulse" 
          />
          <div className="absolute inset-0 border-4 border-dashed border-[#B69D74]/30 rounded-full animate-spin-slow pointer-events-none"></div>
        </div>
        <h2 className="text-2xl font-serif font-bold text-[#1C2A39] mb-2">Conectando con Naranjín...</h2>
        <p className="text-[#1C2A39]/60 max-w-sm text-sm">
          Estamos recopilando la historia y preparando el lienzo para tu Biografía Digital.
        </p>
        <style>{`
          @keyframes spinSlow {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          .animate-spin-slow {
            animation: spinSlow 12s linear infinite;
          }
        `}</style>
      </div>
    );
  }

  if (isGenerating) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F3E9] p-6 text-center">
        <div className="relative mb-6">
          <img 
            src="/mascota_loading.png" 
            alt="Naranjín diseñando pergamino" 
            className="w-48 h-48 md:w-56 md:h-56 object-contain animate-pulse" 
          />
          <div className="absolute inset-0 border-4 border-dashed border-[#B69D74]/30 rounded-full animate-spin-slow pointer-events-none"></div>
        </div>
        <h2 className="text-3xl font-serif font-bold text-[#1C2A39] mb-2">Diseñando la Biografía...</h2>
        <p className="text-[#1C2A39]/60 max-w-sm text-sm">
          Naranjín está redactando la heráldica, la línea de tiempo y los hitos más bellos de esta historia. Tardará solo unos segundos.
        </p>
        <style>{`
          @keyframes spinSlow {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          .animate-spin-slow {
            animation: spinSlow 12s linear infinite;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F3E9] text-[#1C2A39] py-12 px-4 md:px-8 animate-in fade-in duration-500">
      <div className="max-w-3xl mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-[#B69D74] hover:text-[#1C2A39] transition font-bold uppercase tracking-widest text-xs mb-8">
          <ArrowLeft size={16} /> Volver
        </button>

        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-2xl border border-[#B69D74]/30 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Star size={180} />
          </div>

          <div className="relative z-10">
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#B69D74]/20 text-[#B69D74] mb-6">
                <BookOpen size={32} />
              </div>
              <h1 className="text-4xl md:text-5xl font-serif text-[#1C2A39] mb-4 tracking-tight">Crea su <span className="text-[#B69D74] italic">Biografía Digital</span></h1>
              <p className="text-[#1C2A39]/70 text-lg max-w-xl mx-auto">Completa los siguientes campos para que Naranjín diseñe el portal web interactivo de homenaje.</p>
            </div>

            <div className="space-y-8">
              {/* Nombre Completo */}
              <div className="bg-[#B69D74]/10 p-6 md:p-8 rounded-3xl border border-[#B69D74]/30 shadow-inner">
                <label className="block text-xl font-serif font-bold text-[#1C2A39] mb-2 flex items-center gap-3"><Wand2 className="text-[#B69D74]" size={24} /> Nombre Completo</label>
                <p className="text-sm text-[#1C2A39]/70 mb-4 italic">El sistema necesita obligatoriamente <strong>nombre y apellidos</strong> para investigar el origen de la familia y el significado del nombre para la heráldica.</p>
                <input 
                  type="text" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-white border border-[#B69D74]/30 rounded-2xl p-4 text-base outline-none focus:ring-2 focus:ring-[#B69D74] transition-all font-bold"
                  placeholder="Ej. Rito Herrera Pérez"
                  required
                />
              </div>

              {/* Fotografía de Portada */}
              <div className="bg-[#F8F3E9]/50 p-6 rounded-2xl border border-[#E8DCC8] space-y-4">
                <div>
                  <label className="block text-base font-bold text-[#1C2A39] mb-1 flex items-center gap-2">
                    <Camera className="text-[#B69D74]" size={20} />
                    Foto de Portada Oficial (Opcional)
                  </label>
                  <p className="text-sm text-[#1C2A39]/60">Sube una fotografía memorable del homenajeado para ilustrar su pergamino digital de legado.</p>
                </div>
                
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  accept="image/*" 
                  className="hidden" 
                />
                
                {photoUrl ? (
                  <div className="relative rounded-2xl overflow-hidden border-2 border-[#B69D74] aspect-video max-w-sm shadow-md">
                    <img src={photoUrl} alt="Foto Legado" className="w-full h-full object-cover" />
                    <button 
                      type="button"
                      onClick={() => setPhotoUrl('')}
                      className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-2 hover:bg-black/80 transition text-xs font-bold px-3"
                    >
                      Cambiar Foto
                    </button>
                  </div>
                ) : (
                  <button 
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="w-full sm:w-auto px-6 py-4 border-2 border-dashed border-[#B69D74] text-[#B69D74] rounded-xl font-bold uppercase tracking-widest hover:bg-[#B69D74]/10 transition flex items-center justify-center gap-3"
                  >
                    {isUploading ? <RefreshCw className="animate-spin" size={20} /> : <Camera size={20} />}
                    {isUploading ? "Subiendo..." : "Subir Fotografía"}
                  </button>
                )}
              </div>

              {/* Dedicatoria Especial */}
              <div className="bg-[#F8F3E9]/50 p-6 rounded-2xl border border-[#E8DCC8] space-y-2">
                <label className="block text-base font-bold text-[#1C2A39] flex items-center gap-2">
                  <Sparkles className="text-[#B69D74]" size={20} />
                  Dedicatoria Especial *
                </label>
                <p className="text-sm text-[#1C2A39]/60 italic">Una hermosa frase corta para recibir a toda la familia en su portal biográfico.</p>
                <input
                  type="text"
                  value={customDedication}
                  onChange={(e) => setCustomDedication(e.target.value)}
                  placeholder="Ej: Para el hombre que me enseñó a caminar con la frente en alto. Te amo, papá."
                  className="w-full bg-white border border-[#E8DCC8] rounded-xl p-4 text-base outline-none focus:border-[#B69D74] shadow-sm font-medium"
                  required
                />
              </div>

              {/* Mayor Logro o Hito */}
              <div className="bg-[#F8F3E9]/50 p-6 rounded-2xl border border-[#E8DCC8] space-y-2">
                <label className="block text-base font-bold text-[#1C2A39] flex items-center gap-2">
                  <BookOpen className="text-[#B69D74]" size={20} />
                  Mayor Logro o Hito de su Vida *
                </label>
                <p className="text-sm text-[#1C2A39]/60 italic">Un orgullo familiar (ej: su carrera, su negocio, sus hijos, un gran aprendizaje).</p>
                <input
                  type="text"
                  value={majorMilestone}
                  onChange={(e) => setMajorMilestone(e.target.value)}
                  placeholder="Ej: Dedicar 40 años a la enseñanza y construir nuestro hogar con amor y esfuerzo."
                  className="w-full bg-white border border-[#E8DCC8] rounded-xl p-4 text-base outline-none focus:border-[#B69D74] shadow-sm font-medium"
                  required
                />
              </div>

              {/* Selección de versión de canción */}
              {(song?.audio_url || song?.demo_url || song?.form_data?.version2?.audio_url || song?.form_data?.version2?.demo_url) && (
                <div className="bg-[#F8F3E9]/50 p-6 rounded-2xl border border-[#E8DCC8] space-y-6">
                  <div>
                    <label className="block text-base font-bold text-[#1C2A39] mb-1 flex items-center gap-2">
                      <Music className="text-[#B69D74]" size={20} />
                      Canción Activa del Legado
                    </label>
                    <p className="text-sm text-[#1C2A39]/60">
                      Escucha las versiones disponibles de tu canción y selecciona cuál se escuchará en la mini-web pública de este Legado.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Opción 1 */}
                    {(song?.audio_url || song?.demo_url) && (
                      <div 
                        onClick={() => setSelectedVersion(1)}
                        className={`cursor-pointer p-5 rounded-2xl border-2 transition-all flex flex-col justify-between space-y-3 bg-white ${
                          selectedVersion === 1 
                            ? 'border-[#B69D74] shadow-md ring-2 ring-[#B69D74]/20' 
                            : 'border-transparent hover:border-[#B69D74]/20 shadow-sm'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-serif font-bold text-[#1C2A39] text-base">Opción 1</span>
                          {selectedVersion === 1 && (
                            <span className="bg-[#B69D74]/20 text-[#B69D74] p-1 rounded-full animate-in zoom-in duration-300">
                              <Check size={14} />
                            </span>
                          )}
                        </div>
                        
                        <audio 
                          src={song?.audio_url || song?.demo_url} 
                          controls 
                          controlsList="nodownload" 
                          className="w-full custom-audio-player h-9"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    )}

                    {/* Opción 2 */}
                    {(song?.form_data?.version2?.audio_url || song?.form_data?.version2?.demo_url) && (
                      <div 
                        onClick={() => setSelectedVersion(2)}
                        className={`cursor-pointer p-5 rounded-2xl border-2 transition-all flex flex-col justify-between space-y-3 bg-white ${
                          selectedVersion === 2 
                            ? 'border-[#B69D74] shadow-md ring-2 ring-[#B69D74]/20' 
                            : 'border-transparent hover:border-[#B69D74]/20 shadow-sm'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-serif font-bold text-[#1C2A39] text-base">Opción 2</span>
                          {selectedVersion === 2 && (
                            <span className="bg-[#B69D74]/20 text-[#B69D74] p-1 rounded-full animate-in zoom-in duration-300">
                              <Check size={14} />
                            </span>
                          )}
                        </div>
                        
                        <audio 
                          src={song?.form_data?.version2?.audio_url || song?.form_data?.version2?.demo_url} 
                          controls 
                          controlsList="nodownload" 
                          className="w-full custom-audio-player h-9"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-12 text-center">
              <button 
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating || isUploading || !fullName.trim() || !customDedication.trim() || !majorMilestone.trim() || !photoUrl}
                className="w-full md:w-auto px-12 py-5 bg-[#1C2A39] text-[#B69D74] rounded-2xl font-bold uppercase tracking-widest hover:bg-black transition shadow-xl disabled:opacity-50 inline-flex items-center justify-center gap-3 cursor-pointer"
              >
                {isGenerating ? <RefreshCw className="animate-spin" size={24} /> : <Wand2 size={24} />}
                {isGenerating ? "Diseñando Biografía..." : "Generar Biografía Digital Ahora"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
