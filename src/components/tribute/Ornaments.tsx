import React from 'react';

interface OrnamentProps {
  className?: string;
  color?: string;
}

export const VintageFeather = ({ className = '', color = '#B69D74' }: OrnamentProps) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M85 15C85 15 65 20 45 40C30 55 20 75 15 85C15 85 20 70 35 55C50 40 70 25 85 15Z" fill={color} opacity="0.8"/>
    <path d="M82 18C75 25 60 40 45 55C30 70 20 82 20 82" stroke="#FFF" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M75 25C70 30 55 35 45 45" stroke="#FFF" strokeWidth="1" opacity="0.5"/>
    <path d="M65 35C60 40 45 45 35 55" stroke="#FFF" strokeWidth="1" opacity="0.5"/>
    <path d="M80 30C75 35 60 40 50 50" stroke="#FFF" strokeWidth="1" opacity="0.5"/>
    <path d="M15 85C15 85 10 95 5 95C10 90 18 88 15 85Z" fill={color}/>
  </svg>
);

export const VintageTree = ({ className = '', color = '#B69D74' }: OrnamentProps) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Trunk */}
    <path d="M45 95C45 85 48 70 48 60C48 50 40 40 35 35C42 42 48 50 50 60C52 50 58 42 65 35C60 40 52 50 52 60C52 70 55 85 55 95L45 95Z" fill="#5C4033" opacity="0.9"/>
    {/* Leaves/Canopy - Using multiple overlapping circles for a lush look */}
    <circle cx="50" cy="35" r="25" fill={color} opacity="0.8"/>
    <circle cx="35" cy="45" r="20" fill={color} opacity="0.7"/>
    <circle cx="65" cy="45" r="20" fill={color} opacity="0.7"/>
    <circle cx="30" cy="30" r="18" fill={color} opacity="0.9"/>
    <circle cx="70" cy="30" r="18" fill={color} opacity="0.9"/>
    <circle cx="50" cy="20" r="22" fill={color} opacity="0.85"/>
    {/* Details */}
    <path d="M35 45C40 40 45 45 50 35" stroke="#FFF" strokeWidth="1" opacity="0.4"/>
    <path d="M65 45C60 40 55 45 50 35" stroke="#FFF" strokeWidth="1" opacity="0.4"/>
    <path d="M40 95C35 95 30 98 25 100M60 95C65 95 70 98 75 100" stroke="#5C4033" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export const VintageLaurels = ({ className = '', color = '#B69D74' }: OrnamentProps) => (
  <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Left Branch */}
    <path d="M100 180C60 180 20 140 20 100C20 60 40 30 60 10" stroke={color} strokeWidth="3" strokeLinecap="round"/>
    {/* Right Branch */}
    <path d="M100 180C140 180 180 140 180 100C180 60 160 30 140 10" stroke={color} strokeWidth="3" strokeLinecap="round"/>
    
    {/* Leaves Left */}
    <path d="M20 100C20 90 10 85 5 90C10 100 20 100 20 100Z" fill={color}/>
    <path d="M23 80C15 75 5 75 5 80C10 90 23 80 23 80Z" fill={color}/>
    <path d="M30 60C20 55 10 60 12 65C20 70 30 60 30 60Z" fill={color}/>
    <path d="M42 42C30 40 25 45 28 50C35 50 42 42 42 42Z" fill={color}/>
    <path d="M60 25C50 25 45 35 50 40C55 35 60 25 60 25Z" fill={color}/>
    <path d="M20 120C10 120 5 130 10 135C20 130 20 120 20 120Z" fill={color}/>
    <path d="M30 140C20 145 15 155 22 155C30 150 30 140 30 140Z" fill={color}/>
    <path d="M45 160C35 165 35 175 42 175C50 165 45 160 45 160Z" fill={color}/>
    <path d="M70 175C60 180 65 190 75 185C80 180 70 175 70 175Z" fill={color}/>

    {/* Leaves Right */}
    <path d="M180 100C180 90 190 85 195 90C190 100 180 100 180 100Z" fill={color}/>
    <path d="M177 80C185 75 195 75 195 80C190 90 177 80 177 80Z" fill={color}/>
    <path d="M170 60C180 55 190 60 188 65C180 70 170 60 170 60Z" fill={color}/>
    <path d="M158 42C170 40 175 45 172 50C165 50 158 42 158 42Z" fill={color}/>
    <path d="M140 25C150 25 155 35 150 40C145 35 140 25 140 25Z" fill={color}/>
    <path d="M180 120C190 120 195 130 190 135C180 130 180 120 180 120Z" fill={color}/>
    <path d="M170 140C180 145 185 155 178 155C170 150 170 140 170 140Z" fill={color}/>
    <path d="M155 160C165 165 165 175 158 175C150 165 155 160 155 160Z" fill={color}/>
    <path d="M130 175C140 180 135 190 125 185C120 180 130 175 130 175Z" fill={color}/>
    
    {/* Bottom Ribbon */}
    <path d="M90 180L80 195L95 190L100 195L105 190L120 195L110 180Z" fill={color}/>
  </svg>
);

export const VintageCrest = ({ className = '', color = '#B69D74', secondaryColor = '#1C2A39' }: OrnamentProps & { secondaryColor?: string }) => (
  <svg viewBox="0 0 100 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Outer Ornaments */}
    <path d="M20 30C10 20 5 40 10 50C0 40 5 60 15 65" stroke={color} strokeWidth="2" fill="none"/>
    <path d="M80 30C90 20 95 40 90 50C100 40 95 60 85 65" stroke={color} strokeWidth="2" fill="none"/>
    <path d="M30 90C15 90 20 110 40 105" stroke={color} strokeWidth="2" fill="none"/>
    <path d="M70 90C85 90 80 110 60 105" stroke={color} strokeWidth="2" fill="none"/>
    <path d="M50 5C45 0 55 0 50 5Z" fill={color}/>
    <path d="M40 15C45 10 55 10 60 15" stroke={color} strokeWidth="2" fill="none"/>
    
    {/* Main Shield */}
    <path d="M50 15L85 25V55C85 85 65 110 50 115C35 110 15 85 15 55V25L50 15Z" fill={secondaryColor} stroke={color} strokeWidth="4" strokeLinejoin="round"/>
    
    {/* Inner Shield border */}
    <path d="M50 22L78 30V55C78 80 62 100 50 106C38 100 22 80 22 55V30L50 22Z" stroke={color} strokeWidth="1.5" strokeDasharray="3 3"/>
    
    {/* Crown above shield */}
    <path d="M35 12L40 5L50 10L60 5L65 12L50 15L35 12Z" fill={color}/>
  </svg>
);
