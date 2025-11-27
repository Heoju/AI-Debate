import React, { useEffect, useRef } from 'react';
import { Message } from '../types';
import { PERSONAS } from '../constants';

interface TranscriptProps {
  messages: Message[];
}

export const Transcript: React.FC<TranscriptProps> = ({ messages }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500 opacity-50 italic">
        <p>위원회 회의실이 조용합니다.</p>
        <p>회의를 시작하려면 주제를 제안하세요.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-4 p-4 pb-24 md:pb-4">
      {messages.map((msg) => {
        const persona = PERSONAS[msg.personaId];
        const isModerator = msg.personaId === 'MODERATOR';
        
        return (
          <div 
            key={msg.id}
            className={`flex w-full ${isModerator ? 'justify-center' : 'justify-start'} animate-fade-in`}
          >
            <div 
              className={`
                max-w-[85%] md:max-w-[70%] rounded-2xl p-4 shadow-md border 
                ${isModerator 
                  ? 'bg-gray-800 border-purple-500/30 text-center' 
                  : `bg-gray-800/80 ${persona.borderColor} border-l-4`
                }
              `}
            >
              <div className="flex items-center gap-2 mb-1">
                {!isModerator && (
                  <span className={`text-xs font-bold uppercase tracking-wider ${persona.color}`}>
                    {persona.role}
                  </span>
                )}
                {isModerator && (
                  <span className="w-full text-xs font-bold uppercase tracking-wider text-purple-400">
                    공식 판결
                  </span>
                )}
              </div>
              <p className="text-sm md:text-base leading-relaxed text-gray-200">
                {msg.text}
              </p>
            </div>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
};