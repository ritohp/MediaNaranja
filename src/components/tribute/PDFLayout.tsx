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
  // Configuración de colores
  const bg = theme === 'love' ? 'bg-[#FFF0F5]' : 'bg-[#FDF8EE]';
  const text = theme === 'love' ? 'text-[#4A0E2E]' : 'text-[#1C2A39]';
  const accent = theme === 'love' ? 'text-[#D64060]' : 'text-[#B69D74]';
  const border = theme === 'love' ? 'border-[#D64060]' : 'border-[#B69D74]';
  
  // Separadores y decoraciones SVGs simplificados
  const accentHex = theme === 'love' ? '#D64060' : '#B69D74';
  const textHex = theme === 'love' ? '#4A0E2E' : '#1C2A39';

  return (
    <div className={`w-[800px] h-[1131px] ${bg} relative p-8 overflow-hidden`} style={{ fontFamily: 'Georgia, serif' }}>
      
      {/* Borde Exterior Doble */}
      <div className={`absolute inset-4 border ${border} opacity-50`}></div>
      <div className={`absolute inset-[20px] border-[0.5px] ${border} opacity-30`}></div>
      
      {/* Ornamentos Esquinas */}
      <div className={`absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 ${border}`}></div>
      <div className={`absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 ${border}`}></div>
      <div className={`absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 ${border}`}></div>
      <div className={`absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 ${border}`}></div>

      <div className="relative z-10 h-full flex flex-col justify-between">
        
        {/* HEADER: TITULO */}
        <div className="text-center mt-2 mb-4">
          <h3 className={`text-[11px] font-bold tracking-[0.3em] uppercase ${text} mb-1`}>La Historia De</h3>
          <h1 className={`text-[40px] leading-none font-bold uppercase tracking-wider ${text} mb-3 mt-1`}>{recipient}</h1>
          <div className="flex items-center justify-center gap-3">
            <div className={`h-[1px] w-16 ${bg === '#FDF8EE' ? 'bg-[#B69D74]' : 'bg-[#D64060]'}`}></div>
            <span className={`text-[10px] tracking-[0.2em] uppercase font-semibold ${accent}`}>Una vida que dejó huella</span>
            <div className={`h-[1px] w-16 ${bg === '#FDF8EE' ? 'bg-[#B69D74]' : 'bg-[#D64060]'}`}></div>
          </div>
        </div>

        {/* TOP SECTION: 3 COLUMNS */}
        <div className="flex justify-between items-stretch gap-4 h-[380px]">
          
          {/* Columna Izquierda: Nombres y Apellidos */}
          <div className="w-[28%] flex flex-col gap-6">
            {/* Box 1: Nombre */}
            <div className={`border-[1.5px] ${border} border-opacity-40 p-5 rounded-md text-center bg-white/50 shadow-sm relative`}>
              <div className={`absolute -top-[10px] left-1/2 -translate-x-1/2 bg-[#FDF8EE] px-3 text-[9px] font-bold uppercase tracking-widest ${text} whitespace-nowrap`}>
                El Significado de su Nombre
              </div>
              <div className="relative mt-2 mb-2">
                 <h3 className={`text-4xl italic ${text}`}>{infoData.nameMeaning.name}</h3>
              </div>
              <p className="text-[11px] text-[#444] font-medium leading-relaxed mt-2 whitespace-pre-line relative z-10 line-clamp-5">
                {infoData.nameMeaning.meaning}
              </p>
              <img src="/assets/pluma.png" alt="Pluma" className="absolute bottom-2 right-2 w-12 h-12 opacity-30 pointer-events-none object-contain drop-shadow-sm mix-blend-multiply" crossOrigin="anonymous"/>
            </div>

            {/* Box 2: Apellidos */}
            <div className={`border-[1.5px] ${border} border-opacity-40 p-5 rounded-md text-center bg-white/50 shadow-sm relative flex-1`}>
              <div className={`absolute -top-[10px] left-1/2 -translate-x-1/2 bg-[#FDF8EE] px-3 text-[9px] font-bold uppercase tracking-widest ${text} whitespace-nowrap`}>
                Origen de sus Apellidos
              </div>
              <div className="relative mt-2 mb-2">
                 <h3 className={`text-3xl italic ${text} leading-tight`}>{infoData.lastNameMeaning.lastName}</h3>
              </div>
              <p className="text-[11px] text-[#444] font-medium leading-relaxed mt-2 whitespace-pre-line relative z-10 line-clamp-6">
                {infoData.lastNameMeaning.meaning}
              </p>
              <img src="/assets/arbol.png" alt="Árbol" className="absolute bottom-2 right-2 w-14 h-14 opacity-20 pointer-events-none object-contain drop-shadow-sm mix-blend-multiply" crossOrigin="anonymous"/>
            </div>
          </div>

          {/* Columna Central: Foto */}
          <div className="w-[44%] flex flex-col items-center justify-start relative pt-4">
            <div className="relative flex items-center justify-center w-64 h-64 mt-2">
               {/* Foto Circular */}
               <div className="w-56 h-56 rounded-full overflow-hidden border-[6px] border-[#FDF8EE] shadow-xl relative z-10">
                 <img src={photoUrl} alt={recipient} className="w-full h-full object-cover sepia-[0.1] contrast-110" crossOrigin="anonymous"/>
               </div>
               {/* Laureles */}
               <img src="/assets/laureles.png" alt="Laureles" className="absolute w-[125%] h-[125%] max-w-none opacity-90 object-contain drop-shadow-sm pointer-events-none z-20" style={{ left: '-12.5%', top: '-12.5%' }} crossOrigin="anonymous"/>
            </div>
            {/* Quote */}
            <p className={`text-[12px] italic font-medium mt-6 px-6 text-center leading-snug ${text}`}>"{infoData.quote}"</p>
            <Heart size={14} className={`mx-auto mt-2 ${accent}`} fill="currentColor" />
          </div>

          {/* Columna Derecha: Lo que dicen de el */}
          <div className="w-[28%] flex flex-col">
            <div className={`flex-1 border-[1.5px] ${border} border-opacity-40 p-4 rounded-md bg-white/50 shadow-sm relative flex flex-col justify-start`}>
              <div className={`absolute -top-[10px] left-1/2 -translate-x-1/2 bg-[#FDF8EE] px-3 text-[9px] font-bold uppercase tracking-widest ${text} whitespace-nowrap`}>
                Lo que dicen de él
              </div>
              <Heart className={`mx-auto mb-5 mt-2 opacity-60 ${accent}`} fill="currentColor" size={14} />
              
              <div className="flex flex-col gap-5">
                {infoData.testimonials?.slice(0, 3).map((test, i) => {
                  const SIcon = [Star, Heart, Feather, Shield][i % 4];
                  return (
                    <div key={i} className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-full border-[1.5px] ${border} border-opacity-60 flex items-center justify-center shrink-0 shadow-sm bg-[#FDF8EE]`}>
                        <SIcon size={14} className={text} fill={i === 1 ? 'currentColor' : 'none'} />
                      </div>
                      <p className="text-[11px] text-[#333] leading-snug font-medium line-clamp-4">
                        {test.text}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* MIDDLE SECTION: LÍNEA DEL TIEMPO */}
        <div className="my-5">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className={`h-[1px] w-32 ${border} opacity-50`}></div>
            <span className={`text-[12px] font-bold uppercase tracking-widest ${text}`}>Línea del Tiempo</span>
            <div className={`h-[1px] w-32 ${border} opacity-50`}></div>
          </div>
          
          <div className="flex justify-between items-start relative px-4">
            <div className="absolute top-6 left-12 right-12 h-[3px] opacity-100 z-0" style={{ backgroundColor: accentHex }}></div>
            {infoData.timeline.slice(0, 5).map((item, idx) => {
              const Icon = IconMap[item.icon] || Star;
              return (
                <div key={idx} className="flex flex-col items-center w-[18%] relative z-10" style={{ backgroundColor: bg === 'bg-[#FFF0F5]' ? '#FFF0F5' : '#FDF8EE' }}>
                  <div className={`w-12 h-12 rounded-full bg-white border-[2px] ${border} flex items-center justify-center mb-3 shadow-sm relative z-20`}>
                    <Icon size={18} className={text} />
                  </div>
                  <h4 className={`text-[10px] font-bold uppercase text-center mb-1 min-h-[32px] flex items-center justify-center leading-tight ${text}`}>{item.title}</h4>
                  <p className="text-[9px] text-[#555] text-center leading-[1.3] px-1 line-clamp-4 break-words w-full">{item.subtitle}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* BOTTOM SECTION: LEGADO Y FAMILIA */}
        <div className="flex gap-4 h-[150px] mb-6">
          
          {/* Su Legado (Escudos) */}
          <div className={`w-[45%] border-[1.5px] ${border} border-opacity-40 p-4 rounded-md bg-white/50 relative flex flex-col justify-center`}>
            <div className={`absolute -top-[10px] left-1/2 -translate-x-1/2 px-3 text-[9px] font-bold uppercase tracking-widest ${text} whitespace-nowrap`} style={{ backgroundColor: bg === 'bg-[#FFF0F5]' ? '#FFF0F5' : '#FDF8EE' }}>
              Su Legado
            </div>
            <p className="text-[9px] text-center italic text-[#555] mb-4">Los valores que dejó y que seguirán vivos por siempre.</p>
            <div className="flex justify-center gap-2 lg:gap-4 items-start h-full pt-1">
              {infoData.shields.slice(0, 5).map((shield, i) => {
                const SIcon = IconMap[shield.icon] || Shield;
                return (
                  <div key={i} className="flex flex-col items-center w-[18%]">
                    <div className="relative w-10 h-12 flex items-center justify-center mb-3">
                      <svg viewBox="0 0 48 56" fill="#1C2A39" xmlns="http://www.w3.org/2000/svg" className="absolute inset-0 w-full h-full drop-shadow-md">
                        <path d="M24 0L48 10.6667V24C48 38.0133 37.7067 51.1067 24 56C10.2933 51.1067 0 38.0133 0 24V10.6667L24 0Z" stroke={accentHex} strokeWidth="2.5"/>
                      </svg>
                      <SIcon size={14} className="relative z-10" fill="currentColor" strokeWidth={0} style={{ color: accentHex }} />
                    </div>
                    <span className="text-[8px] font-bold uppercase text-[#333] tracking-widest text-center leading-[1.2]">{shield.name}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Su Legado Vive En */}
          <div className={`w-[55%] border-[1.5px] ${border} border-opacity-40 p-4 rounded-md bg-white/50 relative flex flex-col justify-center items-center`}>
            <div className={`absolute -top-[10px] left-1/2 -translate-x-1/2 px-3 text-[9px] font-bold uppercase tracking-widest ${text} whitespace-nowrap`} style={{ backgroundColor: bg === 'bg-[#FFF0F5]' ? '#FFF0F5' : '#FDF8EE' }}>
              Su Legado Vive En
            </div>
            <p className="text-[9px] text-center italic text-[#555] mb-4">Toda historia importante continúa a través de las personas que inspira.</p>
            <div className="flex flex-wrap justify-center gap-3">
              {infoData.familyMembers.map((member, idx) => (
                <div key={idx} className="flex flex-col items-center w-12">
                  <div className="w-9 h-9 rounded-full border-[1.5px] flex items-center justify-center bg-transparent shadow-sm mb-2" style={{ borderColor: accentHex }}>
                    <Users size={14} className={text} />
                  </div>
                  <span className="text-[9px] font-bold text-[#333] uppercase text-center w-full truncate leading-tight tracking-wider">{member}</span>
                </div>
              ))}
            </div>
            <Heart size={12} className={`mx-auto mt-3 ${accent}`} fill="currentColor" />
          </div>
        </div>

        {/* FOOTER SECTION: ESCUDO, MENSAJE, QR */}
        <div className="flex gap-4 h-[170px]">
          
          {/* Cresta / Checkmarks */}
          <div className={`w-[38%] border-[1.5px] ${border} border-opacity-40 p-4 rounded-md bg-white/50 relative overflow-hidden flex flex-col justify-start`}>
            <div className={`absolute -top-[10px] left-1/2 -translate-x-1/2 px-3 text-[9px] font-bold uppercase tracking-widest ${text} whitespace-nowrap`} style={{ backgroundColor: bg === 'bg-[#FFF0F5]' ? '#FFF0F5' : '#FDF8EE' }}>
              El Peso de su Apellido
            </div>
            <p className="text-[9px] text-[#555] italic text-center mb-3 mt-2">Cuando alguien escuche el apellido {infoData.lastNameMeaning.lastName}...</p>
            <div className="flex gap-4 items-center">
              <div className="w-[45%] flex flex-col items-center">
                <div className="relative flex items-center justify-center w-24 h-24">
                  <img src="/assets/escudo.png" alt="Escudo" className="w-full h-full object-contain drop-shadow-md opacity-90" crossOrigin="anonymous"/>
                  <div className={`absolute inset-0 flex items-center justify-center font-bold text-4xl ${text} font-serif pb-1`}>
                    {infoData.lastNameMeaning.lastName.charAt(0)}
                  </div>
                </div>
                <h4 className="text-[10px] font-bold uppercase -mt-1 tracking-wider">{infoData.lastNameMeaning.lastName}</h4>
              </div>
              <div className="w-[55%] flex flex-col gap-2">
                {infoData.shields.slice(0, 3).map((shield, idx) => (
                  <div key={idx} className="flex items-start gap-1 mb-1">
                    <CheckCircle2 size={12} className={`${accent} shrink-0 mt-[1px]`} />
                    <span className="text-[9px] text-[#333] font-medium leading-tight">Que recuerde su {shield.name.toLowerCase()}.</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Mensaje */}
          <div className={`w-[37%] border-[1.5px] ${border} border-opacity-40 p-4 rounded-md bg-white/50 relative flex flex-col items-center justify-center text-center`}>
            <div className={`absolute -top-[10px] left-1/2 -translate-x-1/2 px-3 text-[9px] font-bold uppercase tracking-widest ${text} whitespace-nowrap`} style={{ backgroundColor: bg === 'bg-[#FFF0F5]' ? '#FFF0F5' : '#FDF8EE' }}>
              Mensaje Para Él
            </div>
            <img src="/assets/pluma.png" alt="Pluma" className="w-8 h-8 opacity-50 mb-2" crossOrigin="anonymous"/>
            <p className="text-[11px] leading-relaxed text-[#333] font-medium">
              Hoy celebramos al hombre que ha sido nuestro guía, nuestro ejemplo y nuestro mayor apoyo. Gracias por cada sacrificio silencioso, por cada enseñanza y por el amor incondicional.
            </p>
            <h4 className={`text-[12px] font-bold uppercase mt-4 tracking-widest ${text}`}>
              Tu historia es única.<br/>Tu legado, eterno.
            </h4>
          </div>

          {/* Escucha su cancion */}
          <div className={`w-[25%] border-[1.5px] ${border} border-opacity-40 p-4 rounded-md bg-white/50 relative flex flex-col items-center justify-center`}>
            <div className={`absolute -top-[10px] left-1/2 -translate-x-1/2 px-3 text-[9px] font-bold uppercase tracking-widest ${text} whitespace-nowrap`} style={{ backgroundColor: bg === 'bg-[#FFF0F5]' ? '#FFF0F5' : '#FDF8EE' }}>
              Escucha su Canción
            </div>
            <p className="text-[8px] text-center text-[#555] mb-2 leading-tight">Escanea el código QR para escuchar la canción que cuenta su historia.</p>
            <div className="bg-white p-2 rounded-md shadow-sm border border-gray-200">
               <QRCodeSVG value={`https://app.medianaranja.com/cancion/${songId}`} size={80} fgColor="#1C2A39" />
            </div>
            <p className="text-[7px] text-center font-bold uppercase text-[#444] mt-3">
              Guarda, comparte y<br/>celebra su historia.
            </p>
          </div>
        </div>

        {/* BOTTOM MOTTO */}
        <div className="text-center mt-6 border-t-[1.5px] border-b-[1.5px] border-[#B69D74] border-opacity-40 py-3 relative">
           <Heart size={10} className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 ${accent} bg-[#FDF8EE] px-1`} fill="currentColor" />
           <p className={`text-[10px] font-bold uppercase tracking-[0.4em] ${text}`}>Una vida que inspira, un legado que perdura.</p>
        </div>

      </div>
    </div>
  );
}
