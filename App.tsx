import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { Message, AppStatus, PersonaId } from './types';
import { PERSONAS } from './constants';
import { CouncilMember } from './components/CouncilMember';
import { Transcript } from './components/Transcript';
import { generatePersonaResponse, generateConclusion } from './services/geminiService';
import { Play, Square, FastForward, RotateCcw, Send, Gavel } from 'lucide-react';

const App: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentSpeakerId, setCurrentSpeakerId] = useState<PersonaId | null>(null);
  
  // Refs for tracking state inside effects without dependency loops
  const messagesRef = useRef<Message[]>([]);
  const statusRef = useRef<AppStatus>(AppStatus.IDLE);

  // Sync refs
  useEffect(() => {
    messagesRef.current = messages;
    statusRef.current = status;
  }, [messages, status]);

  const handleStart = async () => {
    if (!topic.trim()) return;
    setStatus(AppStatus.DEBATING);
    setMessages([]);
    
    // Initial Moderator Intro
    const introId = crypto.randomUUID();
    const introMsg: Message = {
      id: introId,
      personaId: PersonaId.MODERATOR,
      text: `지금부터 위원회를 개회합니다. 오늘의 토론 주제는 "${topic}"입니다. 위원님들께서는 각자의 견해를 말씀해 주십시오.`,
      timestamp: Date.now()
    };
    setMessages([introMsg]);
    
    // Trigger the debate loop via effect
  };

  const handleStop = () => {
    setStatus(AppStatus.IDLE);
    setCurrentSpeakerId(null);
  };

  const handleConclude = () => {
    setStatus(AppStatus.CONCLUDING);
  };

  const handleReset = () => {
    setStatus(AppStatus.IDLE);
    setMessages([]);
    setTopic('');
    setCurrentSpeakerId(null);
  };

  const getNextSpeaker = (lastSpeakerId: PersonaId): PersonaId => {
    // Simple round robin excluding Moderator for the main debate
    const speakers = [
      PersonaId.SKEPTIC, 
      PersonaId.FUTURIST, 
      PersonaId.ETHICIST, 
      PersonaId.HISTORIAN
    ];
    
    // If moderator just spoke, pick random first speaker
    if (lastSpeakerId === PersonaId.MODERATOR) {
        return speakers[Math.floor(Math.random() * speakers.length)];
    }

    const currentIndex = speakers.indexOf(lastSpeakerId);
    const nextIndex = (currentIndex + 1) % speakers.length;
    return speakers[nextIndex];
  };

  // Main Debate Loop
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    const processTurn = async () => {
        if (statusRef.current === AppStatus.DEBATING) {
            const history = messagesRef.current;
            const lastMsg = history[history.length - 1];
            
            // Determine next speaker
            const nextSpeakerId = getNextSpeaker(lastMsg.personaId);
            setCurrentSpeakerId(nextSpeakerId);
            const nextPersona = PERSONAS[nextSpeakerId];

            // Simulate "thinking" time briefly for UX
            await new Promise(r => setTimeout(r, 1000));

            // Generate Content
            const text = await generatePersonaResponse(topic, history, nextPersona);
            
            if (statusRef.current !== AppStatus.DEBATING) return; // Check if stopped during await

            const newMsg: Message = {
                id: crypto.randomUUID(),
                personaId: nextSpeakerId,
                text: text,
                timestamp: Date.now()
            };

            setMessages(prev => [...prev, newMsg]);
            
        } else if (statusRef.current === AppStatus.CONCLUDING) {
             setCurrentSpeakerId(PersonaId.MODERATOR);
             // Generate conclusion
             const history = messagesRef.current;
             
             await new Promise(r => setTimeout(r, 1000));
             
             const text = await generateConclusion(topic, history);
             
             const finalMsg: Message = {
                 id: crypto.randomUUID(),
                 personaId: PersonaId.MODERATOR,
                 text: text,
                 timestamp: Date.now()
             };

             setMessages(prev => [...prev, finalMsg]);
             setStatus(AppStatus.FINISHED);
             setCurrentSpeakerId(null);
        }
    };

    // Only run if we are in an active state and not processing
    if (status === AppStatus.DEBATING || status === AppStatus.CONCLUDING) {
       // Only proceed if the last message wasn't the conclusion and we aren't finished
       if (status === AppStatus.CONCLUDING && messages.length > 0 && messages[messages.length-1].personaId === PersonaId.MODERATOR && messages[messages.length-1].text.length > 50) {
           // Already concluded
           setStatus(AppStatus.FINISHED);
       } else {
           timeoutId = setTimeout(processTurn, 1500); // Delay between turns
       }
    }

    return () => clearTimeout(timeoutId);
  }, [messages, status, topic]);


  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-950 text-white selection:bg-primary-500 selection:text-white">
      {/* Header */}
      <header className="flex-none p-6 border-b border-gray-800 bg-gray-900/50 backdrop-blur-md z-10 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            AI 토론 위원회
          </h1>
          <p className="text-xs text-gray-500">자율 토론 시뮬레이션</p>
        </div>
        <div className="text-xs font-mono text-gray-600 border border-gray-800 rounded px-2 py-1">
          v1.0.0 (KO)
        </div>
      </header>

      {/* Main Stage (Visuals of Personas) */}
      <div className="flex-none py-6 px-4 bg-gray-900 border-b border-gray-800">
        <div className="flex justify-center items-start gap-4 md:gap-8 overflow-x-auto pb-2 scrollbar-hide">
          {Object.values(PERSONAS).map((p) => (
             <CouncilMember 
                key={p.id} 
                persona={p} 
                isActive={currentSpeakerId === p.id || (p.id === PersonaId.MODERATOR && status === AppStatus.CONCLUDING)}
                isSpeaking={currentSpeakerId === p.id}
             />
          ))}
        </div>
      </div>

      {/* Transcript Area */}
      <div className="flex-1 overflow-y-auto relative bg-[#0f172a]">
        <div className="max-w-4xl mx-auto min-h-full">
            <Transcript messages={messages} />
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex-none p-4 bg-gray-900 border-t border-gray-800">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-4 items-center">
            
            {/* Input Area */}
            <div className="relative flex-1 w-full">
                <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    disabled={status !== AppStatus.IDLE}
                    placeholder={status === AppStatus.IDLE ? "토론 주제를 입력하세요..." : "토론 진행 중..."}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg py-3 pl-4 pr-12 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                    <Send size={18} />
                </div>
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                {status === AppStatus.IDLE || status === AppStatus.FINISHED ? (
                    <>
                        <button 
                            onClick={handleStart}
                            disabled={!topic.trim()}
                            className="flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-500 text-white font-semibold rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                        >
                            <Play size={18} fill="currentColor" />
                            시작
                        </button>
                        {status === AppStatus.FINISHED && (
                             <button 
                             onClick={handleReset}
                             className="flex items-center gap-2 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-gray-200 font-semibold rounded-lg transition-all"
                         >
                             <RotateCcw size={18} />
                             초기화
                         </button>
                        )}
                    </>
                ) : (
                    <>
                         {status === AppStatus.DEBATING && (
                            <button 
                                onClick={handleConclude}
                                className="flex items-center gap-2 px-4 py-3 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-lg shadow-lg transition-all"
                            >
                                <Gavel size={18} />
                                결론 도출
                            </button>
                        )}
                        <button 
                            onClick={handleStop}
                            className="flex items-center gap-2 px-4 py-3 bg-red-600/90 hover:bg-red-500 text-white font-semibold rounded-lg shadow-lg transition-all"
                        >
                            <Square size={18} fill="currentColor" />
                            중지
                        </button>
                    </>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = createRoot(rootElement);
root.render(
    <App />
);