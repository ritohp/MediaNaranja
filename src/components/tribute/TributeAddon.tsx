import React from 'react';
import { Star, Wand2, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface TributeAddonProps {
  song: any;
  variant?: 'full' | 'card';
}

export default function TributeAddon({ song, variant = 'full' }: TributeAddonProps) {
  const navigate = useNavigate();

  const handleOpenWizard = () => {
    navigate(`/legado/${song.id}`);
  };

  if (variant === 'card') {
    return (
      <button 
        onClick={handleOpenWizard}
        className="w-full py-3 md:py-4 bg-[#1C2A39] text-[#B69D74] rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-black transition-colors flex items-center justify-center gap-2 mt-3 shadow-md"
      >
        <Sparkles size={14} /> ✨ Crear Biografía Digital
      </button>
    );
  }

  return (
    <div className="max-w-2xl mx-auto my-12 relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1C2A39] to-black text-white p-8 md:p-10 shadow-2xl border border-[#B69D74]/30">
      <div className="absolute top-0 right-0 p-8 opacity-10">
        <Star size={120} />
      </div>
      <div className="relative z-10 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#B69D74]/20 text-[#B69D74] text-xs font-bold uppercase tracking-widest mb-6 border border-[#B69D74]/30">
          <Sparkles size={14} /> Nueva Función
        </div>
        <h2 className="text-3xl md:text-4xl font-serif mb-4">Inmortaliza esta canción en una <span className="text-[#B69D74] italic">Biografía Digital</span></h2>
        <p className="text-gray-300 mb-8 max-w-md text-sm md:text-base leading-relaxed">
          Convierte tu canción en un Homenaje Digital Interactivo con una hermosa biografía y descarga un PDF certificado de alta resolución listo para imprimir con un código QR exclusivo.
        </p>
        <button 
          onClick={handleOpenWizard}
          className="px-8 py-4 bg-[#B69D74] text-[#1C2A39] rounded-2xl font-bold uppercase tracking-widest hover:bg-[#A88B5B] transition shadow-[0_0_20px_rgba(182,157,116,0.3)] flex items-center gap-3"
        >
          <Wand2 size={20} /> Crear Biografía Digital
        </button>
      </div>
    </div>
  );
}
