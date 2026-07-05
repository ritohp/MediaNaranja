import React, { useState } from 'react';
import { Star, Wand2, Sparkles, Heart, Crown, ArrowRight, CheckCircle2, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface TributeAddonProps {
  song: any;
  variant?: 'full' | 'card';
}

export default function TributeAddon({ song, variant = 'full' }: TributeAddonProps) {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCheckout = () => {
    setIsProcessing(true);
    // TODO: Usar el link de Stripe real para el Upsell de $49 MXN.
    // Pasamos el ID de la canción para desbloquear la biografía después del pago.
    setTimeout(() => {
      // Simulando que vamos a Stripe
      // window.location.href = `https://buy.stripe.com/upsell-link?client_reference_id=${song.id}`;
      // Mientras tanto navegamos directo para que el usuario llene los datos
      navigate(`/legado/${song.id}?upsell=true`);
    }, 800);
  };

  if (variant === 'card') {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1C2A39] to-black p-[2px] mt-4 shadow-xl group cursor-pointer transition-transform hover:scale-[1.02]">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-200 opacity-20 blur-xl group-hover:opacity-40 transition-opacity animate-pulse"></div>
        <div className="bg-[#1C2A39] rounded-[14px] p-5 relative z-10">
          <div className="absolute top-0 right-0 p-3 opacity-10">
            <Crown size={60} />
          </div>
          <div className="flex justify-between items-start mb-3">
            <span className="bg-gradient-to-r from-yellow-400 to-amber-600 text-transparent bg-clip-text font-black text-[10px] tracking-widest uppercase flex items-center gap-1">
              <Sparkles size={12} className="text-yellow-500" /> Mejora tu Regalo
            </span>
            <span className="text-white font-bold text-lg bg-white/10 px-3 py-1 rounded-full border border-white/20">
              +$49 <span className="text-[9px] font-normal">MXN</span>
            </span>
          </div>
          <h3 className="text-white font-serif text-lg leading-tight mb-2">Añade la Biografía Digital Interactiva</h3>
          <p className="text-gray-400 text-xs mb-4 line-clamp-2">Una página web exclusiva para él, árbol genealógico interactivo y un póster PDF certificado de alta resolución.</p>
          <button 
            onClick={handleCheckout}
            disabled={isProcessing}
            className="w-full py-3 bg-gradient-to-r from-yellow-400 to-amber-500 text-[#1C2A39] rounded-xl font-bold text-xs uppercase tracking-widest hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(251,191,36,0.3)] disabled:opacity-50"
          >
            {isProcessing ? <RefreshCw size={14} className="animate-spin" /> : <Lock size={14} />}
            {isProcessing ? "PROCESANDO..." : "AGREGAR AL PEDIDO AHORA"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto my-12 relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1C2A39] via-[#2A3F54] to-black text-white p-1 shadow-[0_20px_50px_rgba(0,0,0,0.5)] group cursor-pointer hover:shadow-[0_20px_60px_rgba(251,191,36,0.2)] transition-all">
      <div className="absolute inset-0 bg-gradient-to-r from-amber-300 via-yellow-500 to-amber-300 animate-[spin_4s_linear_infinite] opacity-30"></div>
      
      <div className="relative bg-[#1C2A39] rounded-[22px] p-8 md:p-12 h-full flex flex-col items-center text-center overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <Crown size={180} />
        </div>
        
        <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-yellow-500/20 to-amber-600/20 text-yellow-400 text-xs font-black uppercase tracking-widest mb-6 border border-yellow-500/30 shadow-[0_0_20px_rgba(251,191,36,0.2)]">
          <Sparkles size={16} className="animate-pulse" /> Hazlo Inolvidable
        </div>
        
        <h2 className="text-3xl md:text-5xl font-serif mb-4 leading-tight">Inmortaliza su historia en un <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-500 italic">Legado Digital Eterno</span></h2>
        
        <p className="text-gray-300 mb-8 max-w-lg text-sm md:text-base leading-relaxed font-light">
          No le des solo una canción. Regálale una experiencia completa: una cápsula del tiempo interactiva, su árbol genealógico y un póster de colección con calidad de galería.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full text-left mb-10 max-w-lg">
           <div className="flex items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/10">
             <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0"><CheckCircle2 size={16}/></div>
             <p className="text-xs font-medium text-gray-200">Portal interactivo privado con su foto y canción</p>
           </div>
           <div className="flex items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/10">
             <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0"><CheckCircle2 size={16}/></div>
             <p className="text-xs font-medium text-gray-200">PDF certificado Alta Resolución listo para impresión</p>
           </div>
           <div className="flex items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/10">
             <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0"><CheckCircle2 size={16}/></div>
             <p className="text-xs font-medium text-gray-200">Árbol familiar interactivo incluido</p>
           </div>
           <div className="flex items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/10">
             <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0"><CheckCircle2 size={16}/></div>
             <p className="text-xs font-medium text-gray-200">Hospedaje de por vida garantizado</p>
           </div>
        </div>
        
        <button 
          onClick={handleCheckout}
          disabled={isProcessing}
          className="group relative px-8 py-5 bg-gradient-to-r from-yellow-400 to-amber-500 text-[#1C2A39] rounded-2xl font-black text-lg uppercase tracking-widest hover:brightness-110 transition-all shadow-[0_0_30px_rgba(251,191,36,0.4)] flex items-center gap-3 hover:scale-105 disabled:opacity-50"
        >
          {isProcessing ? <RefreshCw size={24} className="animate-spin" /> : <Lock size={24} />}
          {isProcessing ? "PROCESANDO..." : "DESBLOQUEAR POR SÓLO $49 MXN"}
          {!isProcessing && <ArrowRight size={24} className="group-hover:translate-x-2 transition-transform" />}
        </button>
        <p className="text-[10px] text-gray-500 mt-4 font-medium uppercase tracking-widest">
          Normalmente $299 MXN - Oferta única al comprar tu canción hoy
        </p>
      </div>
    </div>
  );
}

// Simple fallback icon for loading state
function RefreshCw(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2v6h-6"></path><path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path><path d="M3 22v-6h6"></path><path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path></svg>
}
