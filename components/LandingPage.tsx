
import React, { useState } from 'react';
import { Sparkles, ArrowRight, Chrome } from 'lucide-react';

interface LandingPageProps {
  onLogin: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLogin }) => {
  const [showAuth, setShowAuth] = useState(false);

  return (
    <div className="relative h-screen w-full flex flex-col items-center justify-center text-white overflow-hidden">
      {/* Top Navigation */}
      <nav className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-20">
        <div className="flex items-center gap-2">
          <Sparkles className="text-blue-400" size={24} />
          <span className="text-xl font-bold tracking-tight">Gemini Pro</span>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowAuth(true)}
            className="px-5 py-2 text-sm font-semibold hover:bg-white/10 rounded-full transition-all"
          >
            Log in
          </button>
          <button 
            onClick={() => setShowAuth(true)}
            className="px-6 py-2 text-sm font-bold bg-blue-600 text-white rounded-full hover:bg-blue-500 transition-all shadow-xl shadow-blue-500/20"
          >
            Sign up
          </button>
        </div>
      </nav>

      {/* Hero Content */}
      <div className="relative z-10 text-center max-w-4xl px-6">
        <div className="mb-8 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-600/10 border border-blue-500/30 backdrop-blur-md text-sm font-medium animate-fade-in text-blue-400">
          <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
          Next-Gen Intelligence
        </div>
        <h1 className="text-6xl md:text-8xl font-extrabold tracking-tighter mb-8 leading-tight drop-shadow-2xl">
          The future of <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400">
            conversation.
          </span>
        </h1>
        <p className="text-xl md:text-2xl text-white/70 mb-12 max-w-2xl mx-auto font-medium">
          Meet Gemini. The most capable and versatile AI model from Google, built to be helpful in everything you do.
        </p>
        <button 
          onClick={() => setShowAuth(true)}
          className="group relative px-8 py-4 bg-white text-black text-lg font-bold rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-[0_0_40px_rgba(255,255,255,0.2)] flex items-center gap-2 mx-auto"
        >
          Get Started for Free
          <ArrowRight className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {/* Auth Modal */}
      {showAuth && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setShowAuth(false)} />
          <div className="relative bg-neutral-900 border-2 border-blue-500/20 p-8 rounded-[2.5rem] w-full max-w-md shadow-[0_0_100px_rgba(59,130,246,0.2)] animate-in zoom-in-95 duration-300">
            <div className="text-center mb-10">
              <div className="w-20 h-20 bg-blue-600/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-blue-500/30">
                <Sparkles size={40} className="text-blue-400" />
              </div>
              <h2 className="text-3xl font-bold mb-2">Welcome Back</h2>
              <p className="text-gray-400">Join the next era of computing</p>
            </div>

            <div className="space-y-4">
              <button 
                onClick={onLogin}
                className="w-full flex items-center justify-center gap-3 bg-white text-black py-4 rounded-2xl font-bold hover:bg-gray-100 transition-all shadow-lg active:scale-95"
              >
                <Chrome size={20} />
                Continue with Google
              </button>
              <button 
                onClick={() => setShowAuth(false)}
                className="w-full py-4 rounded-2xl font-semibold border border-white/10 hover:bg-white/5 transition-all text-gray-400"
              >
                Go Back
              </button>
            </div>

            <p className="mt-8 text-center text-xs text-gray-500 px-8 leading-relaxed">
              By continuing, you agree to our Terms and recognize our Privacy Commitment.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
