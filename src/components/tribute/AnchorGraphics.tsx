import React from 'react';

interface AnchorProps {
  archetype: string;
  initialName?: string;
  className?: string;
}

export default function AnchorGraphic({ archetype, initialName = 'A', className = '' }: AnchorProps) {
  const initial = initialName.charAt(0).toUpperCase() || 'M';

  if (archetype === 'LOVE') {
    return (
      <div className={`relative flex items-center justify-center ${className}`}>
        {/* Sello de cera (Wax Seal) */}
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xl" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Base irregular del sello */}
          <path d="M49.5 5C60 4 75 12 85 22C95 32 98 48 93 62C88 76 75 92 52 95C29 98 12 82 5 65C-2 48 4 28 15 15C26 2 39 6 49.5 5Z" fill="#8B0000" stroke="#600000" strokeWidth="2"/>
          {/* Círculo interno presionado */}
          <circle cx="50" cy="50" r="35" fill="#7A0000" stroke="#500000" strokeWidth="1.5" />
          <circle cx="50" cy="50" r="32" fill="#8B0000" stroke="#9B2222" strokeWidth="0.5" strokeDasharray="2 2" />
          {/* Inicial romántica en el centro */}
          <text x="50%" y="54%" dominantBaseline="middle" textAnchor="middle" fill="#FFD700" fontSize="38" fontFamily="Georgia, serif" fontStyle="italic" opacity="0.8">
            {initial}
          </text>
        </svg>
      </div>
    );
  }

  // Por defecto (LEGACY)
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* Escudo Heráldico (Crest) */}
      <svg viewBox="0 0 100 120" className="w-full h-full drop-shadow-xl" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M50 5L95 20V50C95 80 75 105 50 115C25 105 5 80 5 50V20L50 5Z" fill="#1C2A39" stroke="#B69D74" strokeWidth="3"/>
        <path d="M50 15L85 28V52C85 75 68 95 50 102C32 95 15 75 15 52V28L50 15Z" fill="#2A3F54" stroke="#B69D74" strokeWidth="1.5" opacity="0.5"/>
        {/* Inicial elegante en el centro */}
        <text x="50%" y="54%" dominantBaseline="middle" textAnchor="middle" fill="#B69D74" fontSize="48" fontFamily="Georgia, serif" fontWeight="bold">
          {initial}
        </text>
      </svg>
    </div>
  );
}
