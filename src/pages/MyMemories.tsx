import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Download, Trash2, Heart, Plus, Loader2, Calendar, Users, Eye } from 'lucide-react';
import { supabase } from '../lib/supabase';
import html2canvas from 'html2canvas';
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

  const deleteMemory = async (id: string) => {
    if (!confirm('¿Seguro que quieres eliminar este recuerdo?')) return;
    const { error } = await supabase.from('memories').delete().eq('id', id);
    if (!error) setMemories(prev => prev.filter(m => m.id !== id));
  };

  const downloadPDF = async (memory: any) => {
    setDownloadingId(memory.id);
    
    // Crear un contenedor temporal invisible para el renderizado
    const renderNode = document.createElement('div');
    renderNode.id = 'hidden-render';
    renderNode.style.position = 'fixed';
    renderNode.style.left = '-9999px';
    renderNode.style.top = '0';
    document.body.appendChild(renderNode);

    // Diseño Loveflix idéntico al de personalización
    renderNode.innerHTML = `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&display=swap');
        .pdf-area {
          width: 550px;
          height: 778px;
          background: black;
          color: white;
          position: relative;
          overflow: hidden;
          font-family: sans-serif;
        }
        .pdf-script { font-family: 'Dancing Script', cursive; }
        .pdf-gradient {
            background: linear-gradient(to top, #000 0%, transparent 60%);
            position: absolute; inset: 0; z-index: 1;
        }
        .pdf-names { font-size: 60px; line-height: 1; margin: 0; text-shadow: 0 5px 15px rgba(0,0,0,0.8); }
        .pdf-header { position: absolute; top: 0; left: 0; right: 0; padding: 25px 40px; display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.4); z-index: 10; }
        .pdf-loveflix { color: #E50914; font-weight: 900; font-size: 18px; letter-spacing: -1px; }
        .pdf-content { position: absolute; bottom: 176px; left: 40px; right: 40px; z-index: 5; }
        .pdf-gallery { position: absolute; bottom: 25px; left: 40px; right: 40px; display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; z-index: 5; }
        .pdf-thumb { aspect-ratio: 3/4.2; background: #050505; border: 1px solid rgba(255,255,255,0.1); border-radius: 2px; overflow: hidden; }
        .pdf-main-img { width: 100%; height: 100%; object-fit: cover; }
      </style>
      <div class="pdf-area">
        <div class="pdf-header">
           <div class="pdf-loveflix">LOVEFLIX</div>
           <div style="font-size: 10px; opacity: 0.5; color: white;">PRODUCCIÓN NARANJA</div>
        </div>
        <img class="pdf-main-img" src="${memory.main_photo_url}" crossOrigin="anonymous" />
        <div class="pdf-gradient"></div>
        <div class="pdf-content">
            <div style="display:flex; align-items:center; gap:8px; margin-bottom:15px;">
                <span style="background:#E50914; color:white; font-weight:900; padding:2px 6px; font-size:10px; border-radius:2px;">N</span>
                <span style="font-size:7px; font-weight:bold; letter-spacing:4px; text-transform:uppercase; color:white;">Película Exclusiva</span>
            </div>
            <h1 class="pdf-script pdf-names">${memory.names}</h1>
            <div style="display:flex; align-items:center; gap:15px; font-size:10px; font-weight:bold; color:white; margin:15px 0;">
                <span style="color:#46D369;">98% para ti</span>
                <span>${memory.date_text}</span>
                <span style="border:1px solid rgba(255,255,255,0.4); padding:2px 6px; font-size:8px;">4K Ultra HD</span>
            </div>
            <p style="font-size:11px; margin:0; line-height:1.6; opacity:0.8; font-style:italic;">${memory.synopsis}</p>
        </div>
        <div class="pdf-gallery">
            ${(memory.gallery_photos_urls || []).map((url: string) => `
                <div class="pdf-thumb"><img src="${url}" crossOrigin="anonymous" style="width:100%; height:100%; object-fit:cover;" /></div>
            `).join('')}
            ${Array(5 - (memory.gallery_photos_urls?.length || 0)).fill(0).map(() => `<div class="pdf-thumb"></div>`).join('')}
        </div>
      </div>
    `;

    try {
        await new Promise(r => setTimeout(r, 1500)); // Espera para carga de imágenes remotas
        const canvas = await html2canvas(renderNode.querySelector('.pdf-area') as HTMLElement, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#000000'
        });
        
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
        pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
        pdf.save(`MediaNaranja_Serie_${memory.names.split(' ')[0]}.pdf`);
    } catch (err) {
        console.error("PDF Generate Error:", err);
    } finally {
        document.body.removeChild(renderNode);
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
            <h1 className="text-4xl font-serif italic text-[#4A4A4A] mb-2">Mis Películas de Amor</h1>
            <p className="text-[#FF8E8E] font-medium">Tus recuerdos transformados en series exclusivas</p>
          </div>
          <Link 
            to="/personalizar-cuadro" 
            className="flex items-center justify-center gap-2 bg-[#FF6B6B] text-white px-8 py-4 rounded-full font-bold shadow-lg hover:bg-[#FF8585] transition-all"
          >
            <Plus size={20} /> NUEVA SERIE
          </Link>
        </header>

        {memories.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[3rem] shadow-sm border border-[#FFE4E4]">
             <Heart className="mx-auto text-[#FFC0C0] mb-6" size={60} />
             <h2 className="text-2xl font-serif text-[#4A4A4A] mb-2">Aún no tienes series guardadas</h2>
             <p className="text-gray-400 mb-8 max-w-sm mx-auto">Cada gran historia de amor merece su propia portada en Loveflix.</p>
             <Link to="/personalizar-cuadro" className="text-[#FF6B6B] font-bold underline">Comenzar mi primera producción</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {memories.map((memory) => (
              <div key={memory.id} className="group bg-white rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-xl transition-all border border-[#FFE4E4]">
                <div className="aspect-[16/9] relative overflow-hidden">
                   <img src={memory.main_photo_url} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                   <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-6">
                      <div className="flex items-center gap-2">
                         <span className="bg-[#E50914] text-white font-black text-[10px] px-1.5 py-0.5 rounded-sm">N</span>
                         <span className="text-white text-[10px] uppercase font-bold tracking-widest">{memory.names}</span>
                      </div>
                   </div>
                </div>
                
                <div className="p-8">
                  <div className="flex items-center justify-between mb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                     <span className="flex items-center gap-1.5"><Calendar size={12} className="text-[#FF6B6B]"/> {memory.date_text}</span>
                     <span className="flex items-center gap-1.5"><Users size={12} className="text-[#FF6B6B]"/> {memory.style}</span>
                  </div>
                  
                  <p className="text-sm text-gray-600 line-clamp-2 italic mb-6">"{memory.synopsis}"</p>
                  
                  <div className="flex gap-2">
                    <button 
                      onClick={() => downloadPDF(memory)}
                      className="flex-1 flex items-center justify-center gap-2 bg-[#4A4A4A] text-white py-4 rounded-2xl font-bold text-xs hover:bg-black transition-colors"
                      disabled={downloadingId === memory.id}
                    >
                      {downloadingId === memory.id ? <Loader2 className="animate-spin" size={16}/> : <Download size={16}/>}
                      {downloadingId === memory.id ? 'GENERANDO...' : 'DESCARGAR PDF'}
                    </button>
                    <button 
                      onClick={() => deleteMemory(memory.id)}
                      className="p-4 text-red-300 hover:text-red-500 bg-red-50 hover:bg-red-100 rounded-2xl transition-all"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
