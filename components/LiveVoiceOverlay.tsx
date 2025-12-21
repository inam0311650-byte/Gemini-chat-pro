
import React, { useEffect, useRef, useState } from 'react';
import { X, Mic, MicOff, Volume2, Sparkles } from 'lucide-react';
import { geminiService } from '../services/geminiService';

interface LiveVoiceOverlayProps {
  onClose: () => void;
}

export const LiveVoiceOverlay: React.FC<LiveVoiceOverlayProps> = ({ onClose }) => {
  const [isActive, setIsActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [status, setStatus] = useState('Connecting...');
  
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sessionRef = useRef<any>(null);
  const nextStartTimeRef = useRef<number>(0);

  const startLive = async () => {
    try {
      inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const sessionPromise = geminiService.connectLive({
        onopen: () => {
          setStatus('Listening...');
          setIsActive(true);
          const source = inputAudioContextRef.current!.createMediaStreamSource(streamRef.current!);
          const scriptProcessor = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
          
          scriptProcessor.onaudioprocess = (e) => {
            if (isMuted) return;
            const inputData = e.inputBuffer.getChannelData(0);
            const int16 = new Int16Array(inputData.length);
            for (let i = 0; i < inputData.length; i++) {
              int16[i] = inputData[i] * 32768;
            }
            const base64 = btoa(String.fromCharCode(...new Uint8Array(int16.buffer)));
            sessionPromise.then(session => {
              session.sendRealtimeInput({ media: { data: base64, mimeType: 'audio/pcm;rate=16000' } });
            });
          };
          
          source.connect(scriptProcessor);
          scriptProcessor.connect(inputAudioContextRef.current!.destination);
        },
        onmessage: async (msg) => {
          const audioBase64 = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
          if (audioBase64) {
            setStatus('Speaking...');
            const binaryString = atob(audioBase64);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
            
            const buffer = await geminiService.decodeAudioData(bytes, outputAudioContextRef.current!);
            const source = outputAudioContextRef.current!.createBufferSource();
            source.buffer = buffer;
            source.connect(outputAudioContextRef.current!.destination);
            
            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContextRef.current!.currentTime);
            source.start(nextStartTimeRef.current);
            nextStartTimeRef.current += buffer.duration;
            source.onended = () => {
              if (outputAudioContextRef.current!.currentTime >= nextStartTimeRef.current - 0.1) {
                setStatus('Listening...');
              }
            };
          }
          if (msg.serverContent?.interrupted) {
            nextStartTimeRef.current = 0;
            setStatus('Interrupted');
          }
        },
        onerror: (e) => {
          console.error("Live Error", e);
          setStatus('Error occurred');
        },
        onclose: () => {
          setIsActive(false);
          setStatus('Closed');
        }
      });

      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error(err);
      setStatus('Microphone access denied');
    }
  };

  useEffect(() => {
    startLive();
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
      sessionRef.current?.close();
      inputAudioContextRef.current?.close();
      outputAudioContextRef.current?.close();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center text-white backdrop-blur-xl animate-in fade-in zoom-in duration-300">
      <button onClick={onClose} className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-full transition-colors"><X size={32}/></button>
      
      <div className="flex flex-col items-center">
        <div className={`w-64 h-64 rounded-full border-4 flex items-center justify-center transition-all duration-700 relative ${isActive ? 'border-blue-500/50 shadow-[0_0_80px_rgba(59,130,246,0.3)] scale-110' : 'border-white/10'}`}>
          <div className={`absolute inset-0 rounded-full animate-ping bg-blue-500/20 ${status === 'Speaking' ? 'block' : 'hidden'}`}></div>
          <Sparkles size={80} className={`${status === 'Speaking' ? 'text-blue-400' : 'text-gray-600'} transition-colors duration-500`} />
        </div>
        
        <h2 className="mt-12 text-3xl font-bold tracking-tight">{status}</h2>
        <p className="mt-2 text-gray-400 font-medium">Conversational Mode (Native Audio)</p>
      </div>

      <div className="absolute bottom-20 flex items-center gap-8">
        <button 
          onClick={() => setIsMuted(!isMuted)}
          className={`p-6 rounded-full transition-all ${isMuted ? 'bg-red-500 text-white' : 'bg-white/10 hover:bg-white/20'}`}
        >
          {isMuted ? <MicOff size={32} /> : <Mic size={32} />}
        </button>
        <button className="p-6 rounded-full bg-white/10 hover:bg-white/20 transition-all">
          <Volume2 size={32} />
        </button>
      </div>
    </div>
  );
};
