import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Download, Trash2, Heart, Plus, Loader2, Calendar, Users, Eye, Play } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function MyMemories() {
  const [memories, setMemories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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
            <h1 className="text-4xl font-serif italic text-[#4A4A4A] mb-2 uppercase tracking-tight">Mis Producciones <span className="text-[#E50914] non-italic">Loveflix</span></h1>
            <p className="text-gray-400 font-medium">Gestiona y descarga tus posters con la máxima calidad original</p>
          </div>
          <Link 
            to="/personalizar-cuadro" 
            className="flex items-center justify-center gap-2 bg-[#FF6B6B] text-white px-8 py-4 rounded-full font-bold shadow-lg hover:shadow-xl transition-all"
          >
            <Plus size={20} /> NUEVO CUADRO
          </Link>
        </header>

        {memories.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[3rem] shadow-sm border border-[#FFE4E4]">
             <Heart className="mx-auto text-[#FFC0C0] mb-6" size={60} />
             <h2 className="text-2xl font-serif text-[#4A4A4A] mb-2">Aún no tienes series guardadas</h2>
             <p className="text-gray-400 mb-8 max-w-sm mx-auto">Tus mejores historias merecen ser guardadas en la biblioteca de Media Naranja.</p>
             <Link to="/personalizar-cuadro" className="text-[#FF6B6B] font-bold underline">Empezar a crear</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {memories.map((memory) => (
              <Link 
                key={memory.id} 
                to={`/personalizar-cuadro/${memory.id}`}
                className="group relative bg-[#111] rounded-2xl overflow-hidden shadow-2xl hover:scale-[1.02] transition-all duration-500"
              >
                {/* Visual Estilo Netflix Grid */}
                <div className="aspect-[16/9] relative">
                   <img src={memory.main_photo_url} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                   <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-transparent to-transparent"></div>
                   
                   {/* Play Button Overlay */}
                   <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30">
                         <Play fill="white" className="text-white ml-1" size={24}/>
                      </div>
                   </div>
                </div>

                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                     <span className="bg-[#E50914] text-white font-black text-[10px] px-1.5 py-0.5 rounded-sm">N</span>
                     <h3 className="text-white font-bold text-sm tracking-wide truncate">{memory.names}</h3>
                  </div>
                  
                  <div className="flex items-center justify-between text-[9px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-4">
                     <span className="flex items-center gap-1"><Calendar size={12}/> {memory.date_text}</span>
                     <span className="text-[#46D369]">98% para ti</span>
                  </div>

                  <div className="flex gap-2">
                     <div className="flex-1 bg-white text-black text-center py-2.5 rounded-md font-black text-[10px] uppercase tracking-widest group-hover:bg-[#E50914] group-hover:text-white transition-colors">
                        Abrir y Descargar
                     </div>
                     <button 
                        onClick={(e) => deleteMemory(memory.id, e)}
                        className="p-2.5 text-gray-600 hover:text-red-500 hover:bg-red-500/10 rounded-md transition-all"
                        title="Eliminar"
                     >
                        <Trash2 size={16} />
                     </button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
