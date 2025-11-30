
import React, { useState, useRef, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Message, AppStatus, PersonaId } from './types';
import { PERSONAS } from './constants';
import { CouncilMember } from './components/CouncilMember';
import { Transcript } from './components/Transcript';
import { generatePersonaResponse, generateConclusion } from './services/geminiService';
import { Play, Square, FastForward, RotateCcw, Send, Gavel, Settings, X, ExternalLink, CheckCircle2, AlertCircle, Key, Trash2 } from 'lucide-react';

const App: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentSpeakerId, setCurrentSpeakerId] = useState<PersonaId | null>(null);
  
  // Settings State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [debateSpeed, setDebateSpeed] = useState(1500);
  const [apiKeyStatus, setApiKeyStatus] = useState<'checked' | 'unchecked' | 'missing'>('unchecked');
  
  // Manual API Key State (for Vercel/Public deployment)
  const [manualApiKey, setManualApiKey] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  
  // Refs for tracking state inside effects without dependency loops
  const messagesRef = useRef<Message[]>([]);
  const statusRef = useRef<AppStatus>(AppStatus.IDLE);
  const debateSpeedRef = useRef(1500);

  // Sync refs
  useEffect(() => {
    messagesRef.current = messages;
    statusRef.current = status;
    debateSpeedRef.current = debateSpeed;
  }, [messages, status, debateSpeed]);

  // Check API Key Status on Mount & Settings Open
  useEffect(() => {
    const checkKey = async () => {
      // 1. Check LocalStorage (Manual Entry)
      const localKey = localStorage.getItem('gemini_api_key');
      if (localKey) {
        setApiKeyStatus('checked');
        setManualApiKey(localKey); // Pre-fill for UX
        return;
      }

      // 2. Check AI Studio (Project IDX Environment)
      if (window.aistudio && window.aistudio.hasSelectedApiKey) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        if (hasKey) {
            setApiKeyStatus('checked');
            return;
        }
      }

      // 3. Check Environment Variable (Vercel Env Vars)
      // Note: process.env.API_KEY is replaced at build time, so we check if it exists as a string
      if (process.env.API_KEY) {
        setApiKeyStatus('checked');
        return;
      }

      setApiKeyStatus('missing');
    };
    checkKey();
  }, [isSettingsOpen]);

  const handleStart = async () => {
    if (!topic.trim()) return;
    setStatus(AppStatus.DEBATING);
    setMessages([]);
    
    // Initial Moderator Intro (Joy starts the conversation)
    const introId = crypto.randomUUID();
    const introMsg: Message = {
      id: introId,
      personaId: PersonaId.JOY, // Joy acts as moderator
      text: `안녕 얘들아! 오늘 우리가 이야기해 볼 주제는 "${topic}"이야! 다들 어떻게 생각해? 신나게 이야기해보자!`,
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

  const handleOpenApiKeySelector = async () => {
    if (window.aistudio) {
        try {
            await window.aistudio.openSelectKey();
            setApiKeyStatus('checked');
        } catch (e) {
            console.error("API Key selection failed:", e);
            setApiKeyStatus('missing');
        }
    } else {
        // Fallback to manual input view
        setShowManualInput(true);
    }
  };

  const handleSaveManualKey = () => {
    if (manualApiKey.trim().startsWith('AIza')) {
        localStorage.setItem('gemini_api_key', manualApiKey.trim());
        setApiKeyStatus('checked');
        setShowManualInput(false);
        alert('API Key가 안전하게 저장되었습니다.');
    } else {
        alert('유효하지 않은 API Key 형식입니다. (AIza로 시작해야 합니다)');
    }
  };

  const handleClearKey = () => {
      localStorage.removeItem('gemini_api_key');
      setManualApiKey('');
      setApiKeyStatus('missing');
      alert('저장된 API Key가 삭제되었습니다.');
  };

  const getNextSpeaker = (lastSpeakerId: PersonaId): PersonaId => {
    // Simple round robin excluding JOY (Moderator) for the main debate
    const speakers = [
      PersonaId.SADNESS, 
      PersonaId.ANGER, 
      PersonaId.DISGUST, 
      PersonaId.FEAR
    ];
    
    // If Joy just spoke, pick random first speaker
    if (lastSpeakerId === PersonaId.JOY) {
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

            // Simulate "thinking" time briefly for UX (variable based on speed settings)
            await new Promise(r => setTimeout(r, Math.min(1000, debateSpeedRef.current * 0.6)));

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
             setCurrentSpeakerId(PersonaId.JOY);
             // Generate conclusion
             const history = messagesRef.current;
             
             await new Promise(r => setTimeout(r, Math.min(1000, debateSpeedRef.current * 0.6)));
             
             const text = await generateConclusion(topic, history);
             
             const finalMsg: Message = {
                 id: crypto.randomUUID(),
                 personaId: PersonaId.JOY,
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
       if (status === AppStatus.CONCLUDING && messages.length > 0 && messages[messages.length-1].personaId === PersonaId.JOY && messages[messages.length-1].text.length > 20) {
           // Already concluded
           setStatus(AppStatus.FINISHED);
       } else {
           timeoutId = setTimeout(processTurn, debateSpeedRef.current); // Dynamic delay
       }
    }

    return () => clearTimeout(timeoutId);
  }, [messages, status, topic]);


  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-950 text-white selection:bg-primary-500 selection:text-white">
      {/* Header */}
      <header className="flex-none p-6 border-b border-gray-800 bg-gray-900/50 backdrop-blur-md z-10 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-blue-500 bg-clip-text text-transparent">
            감정 본부 회의
          </h1>
          <p className="text-xs text-gray-500">Inside Out 감정 토론 시뮬레이션</p>
        </div>
        <div className="flex items-center gap-3">
            <button 
                onClick={() => setIsSettingsOpen(true)}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                title="설정"
            >
                <Settings size={20} />
            </button>
        </div>
      </header>

      {/* Main Stage (Visuals of Personas) */}
      <div className="flex-none py-6 px-4 bg-gray-900 border-b border-gray-800">
        <div className="flex justify-center items-start gap-4 md:gap-8 overflow-x-auto pb-2 scrollbar-hide">
          {Object.values(PERSONAS).map((p) => (
             <CouncilMember 
                key={p.id} 
                persona={p} 
                isActive={currentSpeakerId === p.id || (p.id === PersonaId.JOY && status === AppStatus.CONCLUDING)}
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
                    placeholder={status === AppStatus.IDLE ? "라일리가 고민 중인 주제는?" : "감정들이 의논 중..."}
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
                            className="flex items-center gap-2 px-6 py-3 bg-yellow-600 hover:bg-yellow-500 text-white font-semibold rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                        >
                            <Play size={18} fill="currentColor" />
                            회의 시작
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
                                className="flex items-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg shadow-lg transition-all"
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

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in px-4">
            <div className="bg-gray-900 border border-gray-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden transform transition-all">
                
                {/* Modal Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-800 bg-gray-800/50">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Settings size={22} className="text-primary-500"/>
                        환경 설정
                    </h2>
                    <button 
                        onClick={() => setIsSettingsOpen(false)}
                        className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-gray-700 rounded-full"
                    >
                        <X size={22} />
                    </button>
                </div>
                
                <div className="p-6 space-y-8">
                    {/* API Key Section */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                                <Key size={16} /> Gemini API 키 관리
                            </h3>
                            {apiKeyStatus === 'checked' ? (
                                <span className="flex items-center gap-1.5 text-xs font-medium text-green-400 bg-green-900/30 px-2.5 py-1 rounded-full border border-green-800">
                                    <CheckCircle2 size={12} />
                                    연동됨
                                </span>
                            ) : (
                                <span className="flex items-center gap-1.5 text-xs font-medium text-amber-400 bg-amber-900/30 px-2.5 py-1 rounded-full border border-amber-800">
                                    <AlertCircle size={12} />
                                    연동 필요
                                </span>
                            )}
                        </div>
                        
                        <div className="bg-gray-800 rounded-xl p-5 border border-gray-700 shadow-inner">
                            <p className="text-sm text-gray-400 mb-4 leading-relaxed">
                                안전한 토론을 위해 Gemini API Key가 필요합니다. 
                                입력된 키는 브라우저(LocalStorage)에만 안전하게 저장됩니다.
                            </p>
                            
                            {!showManualInput && apiKeyStatus !== 'checked' && (
                                <button 
                                    onClick={handleOpenApiKeySelector}
                                    className="w-full py-3 px-4 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors border border-gray-600 flex items-center justify-center gap-2"
                                >
                                    <Key size={18} />
                                    API Key 연결 / 입력하기
                                </button>
                            )}

                            {/* Manual Input Form (Shown if not supported or explicitly requested) */}
                            {showManualInput && apiKeyStatus !== 'checked' && (
                                <div className="space-y-3 animate-fade-in">
                                    <input 
                                        type="password" 
                                        value={manualApiKey}
                                        onChange={(e) => setManualApiKey(e.target.value)}
                                        placeholder="sk-..."
                                        className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
                                    />
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={handleSaveManualKey}
                                            className="flex-1 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg font-medium transition-colors"
                                        >
                                            저장
                                        </button>
                                        <button 
                                            onClick={() => setShowManualInput(false)}
                                            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors"
                                        >
                                            취소
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Connected State Actions */}
                            {apiKeyStatus === 'checked' && (
                                <div className="flex gap-2">
                                     <button 
                                        onClick={handleClearKey}
                                        className="flex-1 py-2.5 bg-red-900/30 hover:bg-red-900/50 text-red-300 hover:text-red-200 border border-red-800/50 rounded-lg transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Trash2 size={16} />
                                        키 삭제 / 연결 해제
                                    </button>
                                </div>
                            )}

                            <div className="mt-4 flex justify-end">
                                <a 
                                    href="https://aistudio.google.com/app/apikey" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1 hover:underline transition-all"
                                >
                                    Gemini API Key 발급받기 <ExternalLink size={10} />
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-gray-800 w-full"></div>

                    {/* Speed Control Section */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                             <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                                <FastForward size={16} /> 토론 속도
                             </h3>
                             <span className="text-xs text-primary-400 font-mono bg-primary-900/20 px-2 py-0.5 rounded border border-primary-900/50">
                                {debateSpeed < 1000 ? '빠름' : debateSpeed > 3000 ? '느림' : '보통'} ({debateSpeed}ms)
                             </span>
                        </div>
                        <div className="bg-gray-800 rounded-xl p-5 border border-gray-700 shadow-inner">
                            <input 
                                type="range" 
                                min="500" 
                                max="4000" 
                                step="100"
                                value={debateSpeed}
                                onChange={(e) => setDebateSpeed(Number(e.target.value))}
                                className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-primary-500 hover:accent-primary-400 transition-all"
                            />
                            <div className="flex justify-between text-xs text-gray-500 mt-2 font-mono">
                                <span>빠르게 (0.5초)</span>
                                <span>느리게 (4초)</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-5 border-t border-gray-800 bg-gray-900/50 flex justify-end gap-3">
                    <button 
                        onClick={() => setIsSettingsOpen(false)}
                        className="px-6 py-2.5 bg-primary-600 hover:bg-primary-500 text-white font-bold rounded-lg transition-colors shadow-lg hover:shadow-primary-500/20"
                    >
                        설정 완료
                    </button>
                </div>
            </div>
        </div>
      )}
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
