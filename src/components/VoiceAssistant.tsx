import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, MicOff, X, Volume2, VolumeX, MessageSquare, History, Settings, Languages, ChevronRight, Play, Sparkles, Zap, Info, Send, FileText, Building2, CheckCircle2 } from 'lucide-react';
import { VoiceMessage, VoiceLanguage, VoiceCommand } from '../types';
import { processVoiceQuery } from '../services/voiceAssistantService';

interface VoiceAssistantProps {
  onCommand: (command: VoiceCommand['command']) => void;
}

const LANGUAGES: { label: string; value: VoiceLanguage }[] = [
  { label: 'English', value: 'en-US' },
  { label: 'Hindi', value: 'hi-IN' },
  { label: 'Telugu', value: 'te-IN' },
  { label: 'Kannada', value: 'kn-IN' },
  { label: 'Malayalam', value: 'ml-IN' },
  { label: 'Marathi', value: 'mr-IN' },
  { label: 'Gujarati', value: 'gu-IN' },
  { label: 'Tamil', value: 'ta-IN' },
];

const WAKE_WORD = "hey ecovision";

export const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ onCommand }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [messages, setMessages] = useState<VoiceMessage[]>(() => {
    const saved = localStorage.getItem('ecovision_voice_history');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('ecovision_voice_history', JSON.stringify(messages.slice(-20)));
  }, [messages]);
  const [selectedLang, setSelectedLang] = useState<VoiceLanguage>('en-US');
  const [transcript, setTranscript] = useState('');
  const [inputText, setInputText] = useState('');
  const [isWakeWordActive, setIsWakeWordActive] = useState(true);
  const [draftedLetter, setDraftedLetter] = useState<VoiceCommand['letterData'] | null>(null);
  const [isLetterSent, setIsLetterSent] = useState(false);
  
  const recognitionRef = useRef<any>(null);
  const wakeWordRecognitionRef = useRef<any>(null);
  const isMainActiveRef = useRef(false);
  const isWakeWordActiveRef = useRef(false);
  const isStartingWakeWordRef = useRef(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const safeStartWakeWord = useCallback(() => {
    if (!wakeWordRecognitionRef.current || isWakeWordActiveRef.current || isMainActiveRef.current || !isWakeWordActive || isStartingWakeWordRef.current) {
      return;
    }

    try {
      isStartingWakeWordRef.current = true;
      wakeWordRecognitionRef.current.start();
    } catch (e: any) {
      isStartingWakeWordRef.current = false;
      if (e.name !== 'InvalidStateError') {
        console.error("Failed to start wake word recognition", e);
      }
    }
  }, [isWakeWordActive]);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onstart = () => {
        isMainActiveRef.current = true;
        setIsListening(true);
      };

      recognitionRef.current.onerror = (event: any) => {
        if (event.error !== 'no-speech' && event.error !== 'aborted') {
          console.error("Main recognition error", event.error);
        }
        isMainActiveRef.current = false;
        setIsListening(false);
      };

      recognitionRef.current.onresult = (event: any) => {
        const current = event.resultIndex;
        const resultTranscript = event.results[current][0].transcript;
        setTranscript(resultTranscript);
        
        if (event.results[current].isFinal) {
          handleQuery(resultTranscript);
        }
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        isMainActiveRef.current = false;
        if (isWakeWordActive) {
          setTimeout(safeStartWakeWord, 300);
        }
      };

      // Wake Word Recognition
      wakeWordRecognitionRef.current = new SpeechRecognition();
      wakeWordRecognitionRef.current.continuous = true;
      wakeWordRecognitionRef.current.interimResults = false;

      wakeWordRecognitionRef.current.onstart = () => {
        isWakeWordActiveRef.current = true;
        isStartingWakeWordRef.current = false;
      };

      wakeWordRecognitionRef.current.onerror = (event: any) => {
        isStartingWakeWordRef.current = false;
        if (event.error === 'not-allowed') {
          setIsWakeWordActive(false);
        }
        if (event.error !== 'no-speech' && event.error !== 'aborted') {
          console.error("Wake word recognition error", event.error);
        }
        isWakeWordActiveRef.current = false;
      };

      wakeWordRecognitionRef.current.onresult = (event: any) => {
        const last = event.results.length - 1;
        const text = event.results[last][0].transcript.toLowerCase();
        if (text.includes(WAKE_WORD)) {
          setIsOpen(true);
          startListening();
        }
      };

      wakeWordRecognitionRef.current.onend = () => {
        isWakeWordActiveRef.current = false;
        isStartingWakeWordRef.current = false;
        if (isWakeWordActive && !isListening && !isMainActiveRef.current) {
          setTimeout(safeStartWakeWord, 300);
        }
      };
      
      if (isWakeWordActive) {
        safeStartWakeWord();
      }
    }

    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
      if (wakeWordRecognitionRef.current) {
        try { wakeWordRecognitionRef.current.stop(); } catch (e) {}
      }
      isMainActiveRef.current = false;
      isWakeWordActiveRef.current = false;
      isStartingWakeWordRef.current = false;
    };
  }, [isWakeWordActive, safeStartWakeWord, isListening]);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startListening = () => {
    if (recognitionRef.current && !isMainActiveRef.current) {
      if (wakeWordRecognitionRef.current) {
        try {
          wakeWordRecognitionRef.current.stop();
          isWakeWordActiveRef.current = false;
          isStartingWakeWordRef.current = false;
        } catch (e) {}
      }
      recognitionRef.current.lang = selectedLang;
      try {
        recognitionRef.current.start();
      } catch (e: any) {
        if (e.name !== 'InvalidStateError') {
          console.error("Failed to start main recognition", e);
        }
      }
      setIsListening(true);
      setTranscript('');
      setupAudioVisualization();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isMainActiveRef.current) {
      recognitionRef.current.stop();
      isMainActiveRef.current = false;
      setIsListening(false);
    }
  };

  const setupAudioVisualization = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);
      drawWaveform();
    } catch (err) {
      console.error("Error accessing microphone for visualization:", err);
    }
  };

  const drawWaveform = () => {
    if (!canvasRef.current || !analyserRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      animationFrameRef.current = requestAnimationFrame(render);
      analyserRef.current!.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] / 2;
        const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
        gradient.addColorStop(0, '#10b981');
        gradient.addColorStop(1, '#34d399');
        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        x += barWidth + 1;
      }
    };
    render();
  };

  const handleQuery = async (query: string) => {
    if (!query.trim()) return;

    const userMsg: VoiceMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: query,
      language: selectedLang,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setIsThinking(true);

    const result = await processVoiceQuery(query, selectedLang, messages.slice(-5));
    
    const assistantMsg: VoiceMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      text: result.response || '',
      language: selectedLang,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, assistantMsg]);
    setIsThinking(false);
    
    if (result.command === 'generate_letter' && result.letterData) {
      setDraftedLetter(result.letterData);
      setIsLetterSent(false);
    } else if (result.command !== 'none') {
      onCommand(result.command);
    }

    speak(result.response || '', selectedLang);
  };

  const handleSendLetter = () => {
    setIsThinking(true);
    // Simulate sending to municipality
    setTimeout(() => {
      setIsThinking(false);
      setIsLetterSent(true);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        text: "The formal letter has been successfully sent to the municipality. They will act on your report soon.",
        language: selectedLang,
        timestamp: Date.now()
      }]);
      setDraftedLetter(null);
    }, 2000);
  };

  const speak = (text: string, lang: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-8 right-8 z-[100] w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-colors ${
          isOpen ? 'bg-emerald-600 text-white' : 'glass text-emerald-600'
        }`}
      >
        {isOpen ? <X className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
        {!isOpen && (
          <motion.div
            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute inset-0 bg-emerald-400 rounded-full -z-10"
          />
        )}
      </motion.button>

      {/* Assistant Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            className="fixed bottom-28 right-8 z-[100] w-[400px] max-w-[calc(100vw-4rem)] h-[600px] glass rounded-[2.5rem] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-emerald-100/50 flex items-center justify-between glass-emerald">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-200/50">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-emerald-900 leading-none">EcoVision AI</h3>
                  <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Assistant Active</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={selectedLang}
                  onChange={(e) => setSelectedLang(e.target.value as VoiceLanguage)}
                  className="glass border border-emerald-100/50 rounded-lg text-xs font-bold px-2 py-1 text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {LANGUAGES.map(lang => (
                    <option key={lang.value} value={lang.value}>{lang.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
                  <div className="w-16 h-16 glass-emerald rounded-full flex items-center justify-center">
                    <MessageSquare className="w-8 h-8 text-emerald-300" />
                  </div>
                  <p className="text-emerald-900 font-bold">How can I help you today?</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {['Open scanner', 'Recycling tips', 'Show stats'].map(tip => (
                      <button
                        key={tip}
                        onClick={() => handleQuery(tip)}
                        className="text-xs glass-emerald text-emerald-600 px-3 py-1.5 rounded-full font-bold hover:bg-emerald-100 transition-colors"
                      >
                        "{tip}"
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] p-4 rounded-2xl ${
                    msg.role === 'user' 
                      ? 'bg-emerald-600 text-white rounded-tr-none shadow-lg shadow-emerald-200/50' 
                      : 'glass border border-emerald-100/50 text-emerald-900 rounded-tl-none'
                  }`}>
                    <p className="text-sm leading-relaxed">{msg.text}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className={`text-[10px] font-bold opacity-50 ${msg.role === 'user' ? 'text-white' : 'text-emerald-400'}`}>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {msg.role === 'assistant' && (
                        <button 
                          onClick={() => speak(msg.text, msg.language)}
                          className="flex items-center gap-1.5 px-2 py-1 glass-emerald hover:bg-emerald-100 transition-colors group/replay"
                        >
                          <Volume2 className="w-3 h-3 text-emerald-600" />
                          <span className="text-[10px] font-bold text-emerald-600">Replay</span>
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}

              {draftedLetter && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="glass border-2 border-emerald-100/50 rounded-3xl p-6 shadow-xl space-y-4"
                >
                  <div className="flex items-center gap-3 text-emerald-600">
                    <div className="w-10 h-10 glass-emerald rounded-xl flex items-center justify-center">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-black text-sm">Civic Report Draft</h4>
                      <p className="text-[10px] font-bold uppercase tracking-wider opacity-60">Ready to send</p>
                    </div>
                  </div>

                  <div className="glass-emerald rounded-2xl p-4 space-y-3 text-xs">
                    <div>
                      <span className="font-bold text-emerald-900 block mb-1">To:</span>
                      <p className="text-emerald-700">{draftedLetter.recipient}</p>
                    </div>
                    <div>
                      <span className="font-bold text-emerald-900 block mb-1">Subject:</span>
                      <p className="text-emerald-700 font-medium">{draftedLetter.subject}</p>
                    </div>
                    <div className="pt-2 border-t border-emerald-100/50">
                      <p className="text-emerald-800 leading-relaxed whitespace-pre-wrap">{draftedLetter.body}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleSendLetter}
                      className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-200/50 hover:bg-emerald-700 transition-colors"
                    >
                      <Building2 className="w-4 h-4" />
                      Send to Municipality
                    </button>
                    <button
                      onClick={() => setDraftedLetter(null)}
                      className="px-4 py-3 glass border-2 border-emerald-100/50 text-emerald-600 rounded-xl font-bold text-sm hover:bg-white transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </motion.div>
              )}
              
              {isThinking && (
                <div className="flex justify-start">
                  <div className="glass border border-emerald-100/50 p-4 rounded-2xl rounded-tl-none flex items-center gap-2">
                    <motion.div
                      animate={{ scale: [1, 1.5, 1] }}
                      transition={{ repeat: Infinity, duration: 1 }}
                      className="w-1.5 h-1.5 bg-emerald-400 rounded-full"
                    />
                    <motion.div
                      animate={{ scale: [1, 1.5, 1] }}
                      transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
                      className="w-1.5 h-1.5 bg-emerald-400 rounded-full"
                    />
                    <motion.div
                      animate={{ scale: [1, 1.5, 1] }}
                      transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
                      className="w-1.5 h-1.5 bg-emerald-400 rounded-full"
                    />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-6 glass-emerald border-t border-emerald-100/50">
              {isListening ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Listening...</span>
                    <button onClick={stopListening} className="text-red-500 hover:text-red-600">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <canvas ref={canvasRef} width={350} height={40} className="w-full h-10 rounded-lg" />
                  <p className="text-sm text-emerald-900 font-medium italic truncate">
                    {transcript || "Say something..."}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (inputText.trim()) {
                        handleQuery(inputText);
                        setInputText('');
                      }
                    }}
                    className="flex items-center gap-2"
                  >
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Ask me anything..."
                        className="w-full glass border-2 border-emerald-100/50 rounded-2xl px-4 py-3 pr-12 text-sm font-medium text-emerald-900 focus:outline-none focus:border-emerald-500 transition-all"
                      />
                      <button
                        type="submit"
                        disabled={!inputText.trim() || isThinking}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-emerald-600 disabled:text-emerald-200 transition-colors"
                      >
                        <Send className="w-5 h-5" />
                      </button>
                    </div>
                    
                    <button
                      type="button"
                      onClick={startListening}
                      disabled={isThinking}
                      className="p-3 glass border-2 border-emerald-100/50 rounded-2xl text-emerald-600 hover:border-emerald-500 transition-all disabled:opacity-50"
                      title="Voice input"
                    >
                      <Mic className="w-6 h-6" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsWakeWordActive(!isWakeWordActive)}
                      className={`p-3 rounded-2xl border-2 transition-all ${
                        isWakeWordActive 
                          ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-200/50' 
                          : 'glass border-emerald-100/50 text-emerald-400'
                      }`}
                      title={isWakeWordActive ? "Wake word active" : "Wake word disabled"}
                    >
                      <Zap className="w-6 h-6" />
                    </button>
                  </form>
                </div>
              )}
              <div className="mt-4 flex items-center justify-center gap-2 text-[10px] font-bold text-emerald-400 uppercase tracking-tighter">
                <Info className="w-3 h-3" />
                <span>Try saying "Hey EcoVision" or type your query</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
