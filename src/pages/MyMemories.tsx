import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Download, Trash2, Heart, Plus, Loader2, Calendar, Eye, Play, Film } from 'lucide-react';
import { supabase } from '../lib/supabase';
import jsPDF from 'jspdf';

export default function MyMemories() {
  const [memories, setMemories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMemories();
  }, []);

  const fetchMemories = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/');
      return;
    }

    const { data, error } = await supabase
      .from('memories')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error) setMemories(data || []);
    setLoading(false);
  };

  const deleteMemory = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!confirm('¿Seguro que quieres eliminar este recuerdo?')) return;
    const { error } = await supabase.from('memories').delete().eq('id', id);
    if (!error) setMemories(prev => prev.filter(m => m.id !== id));
  };

  const downloadMasterPDF = async (memory: any, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (!memory.full_design_url) {
      alert("Este diseño antiguo no tiene Captura Maestra. Por favor, ábrelo en el editor y dale a 'Guardar' para generarla.");
      return;
    }

    setDownloadingId(memory.id);
    try {
      const response = await fetch(memory.full_design_url);
      const blob = await response.blob();
      const reader = new FileReader();
      
      reader.onloadend = () => {
        const base64data = reader.result as string;
        const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
        // La imagen maestra ya tiene la proporción correcta (1:1.414)
        pdf.addImage(base64data, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
        pdf.save(`ProductoraNaranja_${memory.names.split(' ')[0]}.pdf`);
        setDownloadingId(null);
      };
      reader.readAsDataURL(blob);
    } catch (err) {
      console.error("Download Error:", err);
      alert("Error al descargar el PDF.");
      setDownloadingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDF7F8] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#FF6B6B]" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDF7F8] pt-32 pb-20 px-6">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-serif italic text-[#4A4A4A] mb-2 uppercase tracking-tight">Estudio <span className="text-[#E50914] font-black non-italic">Loveflix</span></h1>
            <p className="text-gray-400 font-medium">Tus producciones originales guardadas en alta fidelidad</p>
          </div>
          <Link 
            to="/personalizar-cuadro" 
            className="flex items-center justify-center gap-3 bg-[#FF6B6B] text-white px-8 py-5 rounded-full font-bold shadow-xl hover:bg-[#FF8585] transition-all hover:scale-105 active:scale-95"
          >
            <Plus size={20} /> NUEVA PRODUCCIÓN
          </Link>
        </header>

        {memories.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-[4rem] shadow-sm border border-[#FFE4E4]">
             <Film className="mx-auto text-[#FFC0C0] mb-6" size={64} />
             <h2 className="text-2xl font-serif text-[#4A4A4A] mb-2">Tu cartelera está vacía</h2>
             <p className="text-gray-400 mb-8 max-w-sm mx-auto">Empieza a inmortalizar tus mejores momentos con el estilo Loveflix.</p>
             <Link to="/personalizar-cuadro" className="bg-gray-100 px-6 py-3 rounded-full text-sm font-bold text-gray-600 hover:bg-gray-200 transition-all">Crear mi primer poster</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {memories.map((memory) => (
              <div 
                key={memory.id} 
                className="group bg-[#0a0a0a] rounded-[2rem] overflow-hidden shadow-2xl hover:shadow-[0_20px_50px_rgba(229,9,20,0.2)] transition-all duration-500 flex flex-col"
              >
                {/* Thumbnail (Usa la Captura Maestra si existe, si no la foto principal) */}
                <div onClick={() => navigate(`/personalizar-cuadro/${memory.id}`)} className="aspect-[16/9] relative cursor-pointer overflow-hidden">
                   <img src={memory.full_design_url || memory.main_photo_url} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-all duration-500 group-hover:scale-110" />
                   <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent"></div>
                   
                   <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-14 h-14 bg-[#E50914] rounded-full flex items-center justify-center shadow-2xl scale-75 group-hover:scale-100 transition-transform duration-300">
                         <Play fill="white" className="text-white ml-1" size={24}/>
                      </div>
                   </div>
                </div>

                <div className="p-8 flex-1 flex flex-col">
                  <div className="flex items-center gap-2 mb-4">
                     <span className="bg-[#E50914] text-white font-black text-[10px] px-1.5 py-0.5 rounded-[2px]">N</span>
                     <h3 className="text-white font-black text-sm tracking-widest truncate uppercase italic">{memory.names}</h3>
                  </div>
                  
                  <p className="text-xs text-gray-500 italic line-clamp-2 mb-6">"{memory.synopsis}"</p>

                  <div className="mt-auto flex gap-3">
                    <button 
                      onClick={(e) => downloadMasterPDF(memory, e)}
                      disabled={downloadingId === memory.id}
                      className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
                        memory.full_design_url 
                          ? 'bg-white text-black hover:bg-[#E50914] hover:text-white' 
                          : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {downloadingId === memory.id ? <Loader2 className="animate-spin" size={16}/> : <Download size={16}/>}
                      {downloadingId === memory.id ? 'PROCESANDO...' : 'DESCARGAR PDF'}
                    </button>
                    
                    <button 
                      onClick={(e) => deleteMemory(memory.id, e)}
                      className="p-4 text-gray-600 hover:text-red-500 hover:bg-white transition-all rounded-xl border border-white/5"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  
                  {!memory.full_design_url && (
                    <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                       <p className="text-[9px] text-blue-400 font-bold uppercase tracking-widest leading-relaxed">
                          ⚠️ Falta captura maestra. Haz clic en el póster para abrir el editor y dale a "Guardar".
                       </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
