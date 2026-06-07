import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, Wand2, RefreshCw, BookOpen, ArrowLeft, Camera, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { generateInfographicData, generateTributeQuestions } from '../services/ai';

export default function TributeWizard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [song, setSong] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>(['', '', '', '', '']);
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    async function loadData() {
      const { data } = await supabase.from('mn_songs').select('*').eq('id', id).single();
      setSong(data);
      
      if (data) {
        const recipientName = data.form_data?.nombreDestinatario || data.form_data?.childName || "tu ser querido";
        const story = data.form_data?.initialContext || data.form_data?.specificDetails || "";
        
        let previousAnswers: string[] = [];
        if (data.form_data?.interviewAnswers) {
          previousAnswers = Object.values(data.form_data.interviewAnswers);
        } else {
          previousAnswers = [
            data.form_data?.familyNames,
            data.form_data?.specificDetails
          ].filter(Boolean) as string[];
        }

        const aiQuestions = await generateTributeQuestions(story, previousAnswers, recipientName);
        setQuestions(aiQuestions);
        setAnswers(new Array(aiQuestions.length).fill(''));
        if (data.form_data?.legacy_photo_url) {
          setPhotoUrl(data.form_data.legacy_photo_url);
        }
      }
      setLoading(false);
    }
    loadData();
  }, [id]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !song) return;

    try {
      setIsUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${song.id}-legacy-${Date.now()}.${fileExt}`;
      const path = `${song.user_id || 'anonymous'}/${fileName}`;

      const { error } = await supabase.storage
        .from('memories')
        .upload(path, file);

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
    if (answers.some(a => !a.trim())) {
      alert("Por favor completa todas las preguntas para que Naranjín pueda hacer su magia.");
      return;
    }
    
    setIsGenerating(true);
    try {
      const recipientName = song.form_data?.recipientName || "Tu Ser Querido";
      const archetype = song.form_data?.category?.toUpperCase() || "LEGACY";
      const story = song.form_data?.initialContext || "";
      
      const infographicData = await generateInfographicData(
        story, 
        answers, 
        recipientName, 
        archetype, 
        "legacy"
      );

      const newFormData = {
        ...song.form_data,
        infographic_data: infographicData,
        legacy_photo_url: photoUrl
      };

      const { error } = await supabase
        .from('mn_songs')
        .update({ form_data: newFormData })
        .eq('id', song.id);

      if (error) throw error;

      navigate(`/cancion/${song.id}`);
    } catch (err) {
      console.error(err);
      alert("Hubo un error al generar tu Legado Digital. Intenta de nuevo.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#F8F3E9]"><RefreshCw className="animate-spin text-[#B69D74]" /></div>;
  }

  return (
    <div className="min-h-screen bg-[#F8F3E9] text-[#1C2A39] py-12 px-4 md:px-8">
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
              <h1 className="text-4xl md:text-5xl font-serif text-[#1C2A39] mb-4 tracking-tight">Construyendo un <span className="text-[#B69D74] italic">Legado</span></h1>
              <p className="text-[#1C2A39]/70 text-lg max-w-xl mx-auto">Para generar una línea de tiempo espectacular y extraer los valores clave, necesitamos unos últimos detalles sobre la historia de <strong>{song?.form_data?.recipientName || "tu ser querido"}</strong>.</p>
            </div>

            <div className="space-y-8">
              {questions.map((q, idx) => (
                <div key={idx} className="bg-[#F8F3E9]/50 p-6 rounded-2xl border border-[#E8DCC8]">
                  <label className="block text-base font-bold text-[#1C2A39] mb-4">{idx + 1}. {q}</label>
                  <textarea 
                    value={answers[idx]}
                    onChange={e => {
                      const newAnswers = [...answers];
                      newAnswers[idx] = e.target.value;
                      setAnswers(newAnswers);
                    }}
                    className="w-full bg-white border border-[#E8DCC8] rounded-xl p-4 outline-none focus:border-[#B69D74] resize-none text-base shadow-sm"
                    rows={3}
                    placeholder="Escribe tu respuesta aquí..."
                  ></textarea>
                </div>
              ))}
              
              {/* Sección de carga de fotografía */}
              <div className="bg-[#F8F3E9]/50 p-6 rounded-2xl border border-[#E8DCC8]">
                <label className="block text-base font-bold text-[#1C2A39] mb-2">Una fotografía para la historia (Opcional)</label>
                <p className="text-sm text-[#1C2A39]/60 mb-4">Sube una foto memorable de {song?.form_data?.recipientName || "él"} para que luzca en la cabecera del pergamino de legado.</p>
                
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  accept="image/*" 
                  className="hidden" 
                />
                
                {photoUrl ? (
                  <div className="relative rounded-xl overflow-hidden border-2 border-[#B69D74] aspect-video max-w-sm">
                    <img src={photoUrl} alt="Foto Legado" className="w-full h-full object-cover" />
                    <button 
                      onClick={() => setPhotoUrl('')}
                      className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-2 hover:bg-black/80 transition"
                    >
                      Cambiar
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="w-full sm:w-auto px-6 py-4 border-2 border-dashed border-[#B69D74] text-[#B69D74] rounded-xl font-bold uppercase tracking-widest hover:bg-[#B69D74]/10 transition flex items-center justify-center gap-3"
                  >
                    {isUploading ? <RefreshCw className="animate-spin" size={20} /> : <Camera size={20} />}
                    {isUploading ? "Subiendo..." : "Subir Fotografía"}
                  </button>
                )}
              </div>
            </div>

            <div className="mt-12 text-center">
              <button 
                onClick={handleGenerate}
                disabled={isGenerating || isUploading}
                className="w-full md:w-auto px-12 py-5 bg-[#1C2A39] text-[#B69D74] rounded-2xl font-bold uppercase tracking-widest hover:bg-black transition shadow-xl disabled:opacity-70 inline-flex items-center justify-center gap-3"
              >
                {isGenerating ? <RefreshCw className="animate-spin" size={24} /> : <Wand2 size={24} />}
                {isGenerating ? "Diseñando Pergamino..." : "Generar Legado Digital Ahora"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
