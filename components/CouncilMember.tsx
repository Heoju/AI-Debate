import React from 'react';
import { Persona, PersonaId } from '../types';
import { Gavel, ShieldAlert, Rocket, Scale, ScrollText } from 'lucide-react';

interface CouncilMemberProps {
  persona: Persona;
  isActive: boolean;
  isSpeaking: boolean;
}

const IconMap: Record<string, React.ElementType> = {
  'Gavel': Gavel,
  'ShieldAlert': ShieldAlert,
  'Rocket': Rocket,
  'Scale': Scale,
  'ScrollText': ScrollText
};

export const CouncilMember: React.FC<CouncilMemberProps> = ({ persona, isActive, isSpeaking }) => {
  const Icon = IconMap[persona.iconName] || Gavel;

  return (
    <div className={`flex flex-col items-center transition-all duration-300 ${isActive ? 'scale-110 opacity-100' : 'scale-95 opacity-60 grayscale'}`}>
      <div 
        className={`
          relative w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center border-2 
          ${isActive ? persona.borderColor : 'border-gray-700'}
          ${isActive ? persona.bgColor : 'bg-gray-800'}
          shadow-lg transition-colors duration-300
        `}
      >
        <Icon 
          className={`w-8 h-8 md:w-10 md:h-10 ${isActive ? persona.color : 'text-gray-500'}`} 
        />
        
        {/* Speaking Indicator */}
        {isSpeaking && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${persona.color.replace('text-', 'bg-')} opacity-75`}></span>
            <span className={`relative inline-flex rounded-full h-4 w-4 ${persona.color.replace('text-', 'bg-')}`}></span>
          </span>
        )}
      </div>
      <span className={`mt-2 text-xs md:text-sm font-semibold ${isActive ? 'text-gray-200' : 'text-gray-500'}`}>
        {persona.name}
      </span>
      <span className="text-[10px] uppercase tracking-wider text-gray-600 font-bold">
        {persona.role}
      </span>
    </div>
  );
};
