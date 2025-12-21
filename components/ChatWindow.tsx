
import React, { useState, useRef, useEffect } from 'react';
import { Conversation, Role, ChatMode, Attachment } from '../types';
import { Send, Menu, Bot, User, Sparkles, Paperclip, Mic, X, Volume2, Globe, Brain, Zap, ExternalLink } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { geminiService } from '../services/geminiService';

interface ChatWindowProps {
  conversation: Conversation | null;
  onSendMessage: (text: string, attachments?: Attachment[]) => void;
  isTyping: boolean;
  toggleSidebar: () => void;
  isSidebarOpen: boolean;
  mode: ChatMode;
  setMode: (mode: ChatMode) => void;
  onOpenLive: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ 
  conversation, 
  onSendMessage, 
  isTyping,
  toggleSidebar,
  mode,
  setMode,
  onOpenLive
}) => {
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [conversation?.messages, isTyping]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((input.trim() || attachments.length > 0) && !isTyping) {
      onSendMessage(input, attachments);
      setInput('');
      setAttachments([]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach((file: File) => {
        const reader = new FileReader();
        reader.onload = (rev) => {
          setAttachments(prev => [...prev, {
            data: rev.target?.result as string,
            mimeType: file.type
          }]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const playTTS = async (text: string) => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const audioData = await geminiService.generateSpeech(text);
      const buffer = await geminiService.decodeAudioData(audioData, audioContextRef.current);
      const source = audioContextRef.current.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContextRef.current.destination);
      source.start();
    } catch (err) {
      console.error("TTS Error:", err);
    }
  };

  return (
    <div className="flex flex-col h-full bg-transparent relative">
      {/* Header */}
      <header className="h-14 flex items-center justify-between px-4 shrink-0 bg-white/10 backdrop-blur-xl z-10 sticky top-0 border-b border-white/5">
        <div className="flex items-center gap-2">
          <button onClick={toggleSidebar} className="p-2 hover:bg-white/10 rounded-lg md:hidden text-white"><Menu size={20} /></button>
          <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10">
            <button 
              onClick={() => setMode('fast')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${mode === 'fast' ? 'bg-white/20 shadow-inner text-white' : 'text-gray-400 hover:text-gray-200'}`}
            >
              <Zap size={14} className={mode === 'fast' ? 'text-yellow-400' : ''} /> Fast
            </button>
            <button 
              onClick={() => setMode('reasoning')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${mode === 'reasoning' ? 'bg-white/20 shadow-inner text-white' : 'text-gray-400 hover:text-gray-200'}`}
            >
              <Brain size={14} className={mode === 'reasoning' ? 'text-purple-400' : ''} /> Think
            </button>
            <button 
              onClick={() => setMode('search')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${mode === 'search' ? 'bg-white/20 shadow-inner text-white' : 'text-gray-400 hover:text-gray-200'}`}
            >
              <Globe size={14} className={mode === 'search' ? 'text-blue-400' : ''} /> Search
            </button>
          </div>
        </div>
        <button 
          onClick={onOpenLive}
          className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-600 text-white text-xs font-bold hover:bg-blue-500 transition-all shadow-lg active:scale-95"
        >
          <Mic size={14} /> Live
        </button>
      </header>

      {/* Message List */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto pt-6 pb-32">
        {!conversation || conversation.messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 max-w-2xl mx-auto mt-10">
            <div className="w-16 h-16 bg-blue-600/20 text-blue-400 rounded-3xl flex items-center justify-center mb-8 shadow-2xl backdrop-blur-md border border-blue-500/30 animate-pulse">
              <Sparkles size={32} />
            </div>
            <h1 className="text-4xl font-extrabold tracking-tighter text-white mb-10 drop-shadow-lg">How can I help you today?</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full px-4">
              {[
                { icon: <Brain size={18} />, text: "Explain how AI works" },
                { icon: <Zap size={18} />, text: "Draft a simple contract" },
                { icon: <Globe size={18} />, text: "Recent space discoveries" },
                { icon: <Sparkles size={18} />, text: "Describe what's in this image" }
              ].map((s, i) => (
                <button
                  key={i}
                  onClick={() => onSendMessage(s.text)}
                  className="flex items-center gap-4 p-5 text-sm text-left border border-white/10 bg-white/5 backdrop-blur-sm rounded-2xl hover:bg-blue-600/10 hover:border-blue-500/50 transition-all group shadow-sm text-white"
                >
                  <span className="text-blue-400 group-hover:scale-110 transition-transform">{s.icon}</span>
                  <span className="font-semibold">{s.text}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto px-4 w-full flex flex-col">
            {conversation.messages.map((message) => (
              <div 
                key={message.id} 
                className={`flex w-full mb-6 ${message.role === Role.USER ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`
                  group relative max-w-[85%] px-5 py-4 rounded-2xl border-2 transition-all duration-300
                  ${message.role === Role.USER 
                    ? 'bg-blue-600/20 border-blue-500/60 text-white rounded-tr-none shadow-[0_0_20px_rgba(59,130,246,0.2)]' 
                    : 'bg-black/40 border-blue-500/40 text-white/90 rounded-tl-none backdrop-blur-md shadow-xl'}
                `}>
                  
                  {/* Attachments */}
                  {message.attachments && message.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-3 mb-4">
                      {message.attachments.map((att, idx) => (
                        <img key={idx} src={att.data} alt="Attached" className="max-w-[280px] h-44 object-cover rounded-xl border border-white/10 shadow-2xl" />
                      ))}
                    </div>
                  )}

                  {/* Thinking Tag (Shown for Model only) */}
                  {message.isThinking && message.role === Role.MODEL && (
                    <div className="flex items-center gap-1.5 text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/30 mb-3 w-fit">
                      <Brain size={10}/> Analyzing...
                    </div>
                  )}

                  {/* Text Content */}
                  <div className="markdown-body text-[15.5px] leading-relaxed antialiased">
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  </div>

                  {/* Grounding Sources */}
                  {message.groundingSources && (
                    <div className="mt-4 pt-4 border-t border-white/5">
                      <div className="flex flex-wrap gap-2">
                        {message.groundingSources.map((source, i) => (
                          <a key={i} href={source.uri} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 py-1 bg-blue-600/10 text-blue-300 text-[11px] rounded-lg border border-blue-500/30 hover:bg-blue-600/20 transition-all">
                            <span className="truncate max-w-[140px] font-medium">{source.title || 'Source'}</span>
                            <ExternalLink size={10} />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  {message.role === Role.MODEL && (
                    <div className="absolute -bottom-10 left-0 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                      <button 
                        onClick={() => playTTS(message.content)} 
                        className="p-1.5 text-gray-400 hover:text-white bg-white/5 hover:bg-blue-600/20 rounded-lg transition-all" 
                        title="Read Aloud"
                      >
                        <Volume2 size={15} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex w-full justify-start mb-8">
                <div className="bg-black/40 border-2 border-blue-500/40 px-6 py-4 rounded-2xl rounded-tl-none backdrop-blur-md shadow-xl flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input Box */}
      <div className="absolute bottom-0 left-0 right-0 p-4 pb-10 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
        <div className="max-w-3xl mx-auto">
          {attachments.length > 0 && (
            <div className="flex gap-2 p-3 bg-white/10 backdrop-blur-xl rounded-t-3xl border-x border-t border-white/10">
              {attachments.map((att, i) => (
                <div key={i} className="relative group/att">
                  <img src={att.data} className="w-16 h-16 object-cover rounded-xl border border-white/10 shadow-lg" />
                  <button onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))} className="absolute -top-2 -right-2 bg-white text-black rounded-full p-0.5 shadow-xl group-hover/att:scale-110 transition-transform"><X size={12}/></button>
                </div>
              ))}
            </div>
          )}
          <form 
            onSubmit={handleSubmit}
            className={`flex items-end gap-2 bg-white/10 backdrop-blur-2xl border-2 border-blue-500/20 p-2.5 shadow-2xl focus-within:border-blue-500/50 focus-within:bg-white/15 transition-all ${attachments.length > 0 ? 'rounded-b-3xl' : 'rounded-3xl'}`}
          >
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-3 text-white/50 hover:text-blue-400 transition-colors"
            >
              <Paperclip size={22} />
            </button>
            <input type="file" multiple ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
            
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSubmit(e)}
              placeholder="Ask anything..."
              rows={1}
              className="flex-1 bg-transparent border-0 py-3.5 px-2 focus:ring-0 resize-none max-h-48 text-[16px] text-white placeholder-white/30 font-medium"
              onInput={(e) => {
                const t = e.target as HTMLTextAreaElement;
                t.style.height = 'auto';
                t.style.height = `${Math.min(t.scrollHeight, 192)}px`;
              }}
            />
            
            <button 
              type="submit"
              disabled={(!input.trim() && attachments.length === 0) || isTyping}
              className={`p-3.5 rounded-2xl transition-all ${input.trim() || attachments.length > 0 ? 'bg-blue-600 text-white hover:bg-blue-500 hover:scale-105 active:scale-95 shadow-xl shadow-blue-500/20' : 'bg-white/5 text-white/20 cursor-not-allowed'}`}
            >
              <Send size={22} />
            </button>
          </form>
          <p className="text-[10px] text-white/40 text-center mt-4 font-bold tracking-widest uppercase">
            Gemini may hallucinate. verify important info.
          </p>
        </div>
      </div>
    </div>
  );
};
