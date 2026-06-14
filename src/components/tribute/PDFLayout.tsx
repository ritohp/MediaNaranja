import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Shield, Star, Mountain, Home, Heart, Feather, TreeDeciduous, Users, CheckCircle2 } from 'lucide-react';
import type { InfographicData } from '../../services/ai';

const IconMap: Record<string, any> = {
  Home, Mountain, Heart, Star, Shield, Users, Feather, TreeDeciduous
};

interface PDFLayoutProps {
  infoData: InfographicData;
  recipient: string;
  photoUrl: string;
  songId: string;
  theme: string;
  archetype: string;
}

export default function PDFLayout({ infoData, recipient, photoUrl, songId, theme, archetype }: PDFLayoutProps) {
  // Configuración de colores dinámica
  const bg = theme === 'love' ? 'bg-[#FFF0F5]' : 'bg-[#FDF8EE]';
  const text = theme === 'love' ? 'text-[#4A0E2E]' : 'text-[#1C2A39]';
  const accent = theme === 'love' ? 'text-[#D64060]' : 'text-[#B69D74]';
  const border = theme === 'love' ? 'border-[#D64060]' : 'border-[#B69D74]';
  const bgOverlay = theme === 'love' ? 'bg-[#FFF0F5]' : 'bg-[#FDF8EE]';
  const overlayHex = theme === 'love' ? '#FFF0F5' : '#FDF8EE';
  
  // Separadores y decoraciones SVGs
  const accentHex = theme === 'love' ? '#D64060' : '#B69D74';

  return (
    <div className={`w-[800px] h-[1035px] ${bg} relative p-6 overflow-hidden`} style={{ fontFamily: 'Georgia, serif' }}>
      
      {/* Borde Exterior Doble */}
      <div className={`absolute inset-3 border ${border} opacity-50`}></div>
      <div className={`absolute inset-[15px] border-[0.5px] ${border} opacity-30`}></div>
      
      {/* Ornamentos Esquinas */}
      <div className={`absolute top-2.5 left-2.5 w-5 h-5 border-t-2 border-l-2 ${border}`}></div>
      <div className={`absolute top-2.5 right-2.5 w-5 h-5 border-t-2 border-r-2 ${border}`}></div>
      <div className={`absolute bottom-2.5 left-2.5 w-5 h-5 border-b-2 border-l-2 ${border}`}></div>
      <div className={`absolute bottom-2.5 right-2.5 w-5 h-5 border-b-2 border-r-2 ${border}`}></div>

      <div className="relative z-10 h-full flex flex-col justify-between">
        
        {/* HEADER: TÍTULO */}
        <div className="text-center mt-1 mb-2">
          <h3 className={`text-[10px] font-bold tracking-[0.3em] uppercase ${text} mb-0.5`}>La Historia De</h3>
          <h1 className={`text-[34px] leading-none font-bold uppercase tracking-wider ${text} mb-2 mt-0.5`}>{recipient}</h1>
          <div className="flex items-center justify-center gap-3">
            <div className={`h-[1px] w-14 ${theme === 'love' ? 'bg-[#D64060]' : 'bg-[#B69D74]'}`}></div>
            <span className={`text-[9px] tracking-[0.2em] uppercase font-semibold ${accent}`}>Una vida que dejó huella</span>
            <div className={`h-[1px] w-14 ${theme === 'love' ? 'bg-[#D64060]' : 'bg-[#B69D74]'}`}></div>
          </div>
        </div>

        {/* TOP SECTION: 3 COLUMNS */}
        <div className="flex justify-between items-stretch gap-4 h-[320px]">
          
          {/* Columna Izquierda: Significado del Nombre */}
          <div className="w-[28%] flex flex-col">
            {/* Box 1: Nombre */}
            <div className={`border-[1.5px] ${border} border-opacity-40 p-4 rounded-md text-center bg-white/50 shadow-sm relative flex-1 flex flex-col justify-center`}>
              <div className={`absolute -top-[10px] left-1/2 -translate-x-1/2 ${bgOverlay} px-3 text-[9px] font-bold uppercase tracking-widest ${text} whitespace-nowrap`}>
                El Significado de su Nombre
              </div>
              <div className="relative mt-2 mb-2">
                 <h3 className={`text-3xl italic ${text}`}>{infoData.nameMeaning.name}</h3>
              </div>
              <p className="text-[11.5px] text-[#444] font-medium leading-relaxed mt-2 whitespace-pre-line relative z-10">
                {infoData.nameMeaning.meaning}
              </p>
              <img src="/assets/pluma.png" alt="Pluma" className="absolute bottom-2 right-2 w-12 h-12 opacity-20 pointer-events-none object-contain drop-shadow-sm mix-blend-multiply" crossOrigin="anonymous"/>
            </div>
          </div>

          {/* Columna Central: Foto */}
          <div className="w-[44%] flex flex-col items-center justify-start relative pt-2">
            <div className="relative flex items-center justify-center w-52 h-52 mt-1">
               {/* Foto Circular */}
               <div className="w-44 h-44 rounded-full overflow-hidden border-[5px] border-white shadow-lg relative z-10">
                 <img src={photoUrl} alt={recipient} className="w-full h-full object-cover sepia-[0.1] contrast-110" crossOrigin="anonymous"/>
               </div>
               {/* Laureles */}
               <img src="/assets/laureles.png" alt="Laureles" className="absolute w-[125%] h-[125%] max-w-none opacity-90 object-contain drop-shadow-sm pointer-events-none z-20" style={{ left: '-12.5%', top: '-12.5%' }} crossOrigin="anonymous"/>
            </div>
            {/* Quote */}
            <p className={`text-[11px] italic font-medium mt-4 px-4 text-center leading-snug ${text}`}>"{infoData.quote}"</p>
            <Heart size={12} className={`mx-auto mt-1.5 ${accent}`} fill="currentColor" />
          </div>

          {/* Columna Derecha: Lo que dicen de el */}
          <div className="w-[28%] flex flex-col">
            <div className={`flex-1 border-[1.5px] ${border} border-opacity-40 p-4 rounded-md bg-white/50 shadow-sm relative flex flex-col justify-start`}>
              <div className={`absolute -top-[10px] left-1/2 -translate-x-1/2 ${bgOverlay} px-3 text-[9px] font-bold uppercase tracking-widest ${text} whitespace-nowrap`}>
                Lo que dicen de él
              </div>
              <Heart className={`mx-auto mb-3 mt-1 opacity-60 ${accent}`} fill="currentColor" size={12} />
              
              <div className="flex flex-col gap-3.5">
                {infoData.testimonials?.slice(0, 3).map((test, i) => {
                  const SIcon = [Star, Heart, Feather, Shield][i % 4];
                  return (
                    <div key={i} className="flex items-start gap-2">
                      <div className={`w-7 h-7 rounded-full border-[1.5px] ${border} border-opacity-60 flex items-center justify-center shrink-0 shadow-sm bg-white`}>
                        <SIcon size={12} className={text} fill={i === 1 ? 'currentColor' : 'none'} />
                      </div>
                      <p className="text-[10px] text-[#333] leading-snug font-medium line-clamp-5">
                        {test.text}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* MIDDLE SECTION: APELLIDO (32%) & LEGADO (65%) */}
        <div className="flex justify-between items-stretch gap-4 mb-3 mt-2 px-4 h-[120px]">
          {/* Box 1: Apellidos (32%) */}
          <div className={`w-[32%] border-[1.5px] ${border} border-opacity-40 p-3 rounded-md text-center bg-white/50 shadow-sm relative flex flex-col justify-center`}>
            <div className={`absolute -top-[10px] left-1/2 -translate-x-1/2 ${bgOverlay} px-3 text-[9px] font-bold uppercase tracking-widest ${text} whitespace-nowrap`}>
              Origen de sus Apellidos
            </div>
            <div className="relative mt-1 mb-0.5">
               <h3 className={`text-xl italic ${text} leading-none`}>{infoData.lastNameMeaning.lastName}</h3>
            </div>
            <p className="text-[10px] text-[#444] font-medium leading-snug whitespace-pre-line relative z-10 line-clamp-3">
              {infoData.lastNameMeaning.meaning}
            </p>
            <img src="/assets/arbol.png" alt="Árbol" className="absolute bottom-1.5 right-1.5 w-10 h-10 opacity-15 pointer-events-none object-contain drop-shadow-sm mix-blend-multiply" crossOrigin="anonymous"/>
          </div>

          {/* Box 2: Legado (65%) */}
          <div className={`w-[65%] border-[1.5px] ${border} border-opacity-40 p-3.5 rounded-md bg-white/50 relative flex flex-col justify-center`}>
            <div className={`absolute -top-[10px] left-1/2 -translate-x-1/2 px-3 text-[9px] font-bold uppercase tracking-widest ${text} whitespace-nowrap`} style={{ backgroundColor: overlayHex }}>
              Su Biografía
            </div>
            <p className="text-[8.5px] text-center italic text-[#555] mb-2 leading-none">Los valores y pilares que marcaron su historia de vida.</p>
            <div className="flex justify-center gap-10 items-start h-full pt-1">
              {infoData.shields.slice(0, 3).map((shield, i) => {
                const SIcon = IconMap[shield.icon] || Shield;
                return (
                  <div key={i} className="flex flex-col items-center w-[25%]">
                    <div className="relative w-10 h-12 flex items-center justify-center mb-1.5">
                      <svg viewBox="0 0 48 56" fill="#1C2A39" xmlns="http://www.w3.org/2000/svg" className="absolute inset-0 w-full h-full drop-shadow-md">
                        <path d="M24 0L48 10.6667V24C48 38.0133 37.7067 51.1067 24 56C10.2933 51.1067 0 38.0133 0 24V10.6667L24 0Z" stroke={accentHex} strokeWidth="2.5"/>
                      </svg>
                      <SIcon size={14} className="relative z-10" fill="currentColor" strokeWidth={0} style={{ color: accentHex }} />
                    </div>
                    <span className="text-[8.5px] font-bold uppercase text-[#333] tracking-widest text-center leading-[1.2]">{shield.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* BOTTOM SECTION: LÍNEA DEL TIEMPO */}
        <div className="my-3 mb-4">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className={`h-[1px] w-28 ${border} opacity-50`}></div>
            <span className={`text-[11px] font-bold uppercase tracking-widest ${text}`}>Línea del Tiempo</span>
            <div className={`h-[1px] w-28 ${border} opacity-50`}></div>
          </div>
          
          <div className="flex justify-between items-start relative px-4">
            <div className="absolute top-5 left-12 right-12 h-[2px] opacity-100 z-0" style={{ backgroundColor: accentHex }}></div>
            {infoData.timeline.slice(0, 5).map((item, idx) => {
              const Icon = IconMap[item.icon] || Star;
              return (
                <div key={idx} className="flex flex-col items-center w-[18%] relative z-10" style={{ backgroundColor: overlayHex }}>
                  <div className={`w-10 h-10 rounded-full bg-white border-[1.5px] ${border} flex items-center justify-center mb-2 shadow-sm relative z-20`}>
                    <Icon size={15} className={text} />
                  </div>
                  <h4 className={`text-[9px] font-bold uppercase text-center mb-1 min-h-[28px] flex items-center justify-center leading-tight ${text}`}>{item.title}</h4>
                  <p className="text-[8.5px] text-[#555] text-center leading-[1.3] px-1 line-clamp-3 break-words w-full">{item.subtitle}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* FOOTER SECTION: FAMILIA, MENSAJE, QR */}
        <div className="flex gap-4 h-[145px]">
          
          {/* Su Legado Vive En (Familia) */}
          <div className={`w-[38%] border-[1.5px] ${border} border-opacity-40 p-3 rounded-md bg-white/50 relative overflow-hidden flex flex-col justify-start items-center`}>
            <div className={`absolute -top-[10px] left-1/2 -translate-x-1/2 px-3 text-[9px] font-bold uppercase tracking-widest ${text} whitespace-nowrap`} style={{ backgroundColor: overlayHex }}>
              Su Legado Vive En
            </div>
            <Heart className={`mx-auto mb-2 mt-3 opacity-60 ${accent}`} fill="currentColor" size={12} />
            <p className="text-[9px] text-center italic text-[#555] mb-2 leading-tight">Toda historia importante continúa a través de las personas que inspira.</p>
            <div className="flex justify-center items-center flex-wrap px-2 gap-1.5 mt-1">
              <span className="text-[10px] font-bold text-[#333] uppercase tracking-[0.15em] text-center leading-relaxed">
                {infoData.familyMembers.join(" • ")}
              </span>
            </div>
          </div>

          {/* Mensaje */}
          <div className={`w-[37%] border-[1.5px] ${border} border-opacity-40 p-3 rounded-md bg-white/50 relative flex flex-col items-center justify-center text-center`}>
            <div className={`absolute -top-[10px] left-1/2 -translate-x-1/2 px-3 text-[9px] font-bold uppercase tracking-widest ${text} whitespace-nowrap`} style={{ backgroundColor: overlayHex }}>
              Mensaje Para Él
            </div>
            <img src="/assets/pluma.png" alt="Pluma" className="w-6 h-6 opacity-40 mb-1" crossOrigin="anonymous"/>
            <p className="text-[10px] leading-snug text-[#333] font-medium px-1">
              Hoy celebramos al hombre que ha sido nuestro guía, nuestro ejemplo y nuestro mayor apoyo. Gracias por cada sacrificio silencioso, por cada enseñanza y por el amor incondicional.
            </p>
            <h4 className={`text-[10.5px] font-bold uppercase mt-1 tracking-wider ${text} leading-tight`}>
              Tu historia es única.<br/>Tu legado, eterno.
            </h4>
          </div>

          {/* Escucha su cancion */}
          <div className={`w-[25%] border-[1.5px] ${border} border-opacity-40 p-3 rounded-md bg-white/50 relative flex flex-col items-center justify-center`}>
            <div className={`absolute -top-[10px] left-1/2 -translate-x-1/2 px-3 text-[9px] font-bold uppercase tracking-widest ${text} whitespace-nowrap`} style={{ backgroundColor: overlayHex }}>
              Escucha su Canción
            </div>
            <p className="text-[7.5px] text-center text-[#555] mb-1.5 leading-tight">Escanea el código QR para escuchar la canción que cuenta su historia.</p>
            <div className="bg-white p-1.5 rounded-md shadow-sm border border-gray-200">
               <QRCodeSVG value={`https://www.medianaranja.mx/cancion/${songId}`} size={70} fgColor="#1C2A39" />
            </div>
            <p className="text-[7px] text-center font-bold uppercase text-[#444] mt-2 leading-tight">
              Guarda, comparte y<br/>celebra su historia.
            </p>
          </div>
        </div>

        {/* BOTTOM MOTTO */}
        <div className="text-center mt-3 border-t-[1.5px] border-b-[1.5px] border-[#B69D74] border-opacity-40 py-2 relative">
           <Heart size={10} className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 ${accent} px-1`} style={{ backgroundColor: overlayHex }} fill="currentColor" />
           <p className={`text-[9px] font-bold uppercase tracking-[0.4em] ${text}`}>Una vida que inspira, un legado que perdura.</p>
        </div>

      </div>
    </div>
  );
}
