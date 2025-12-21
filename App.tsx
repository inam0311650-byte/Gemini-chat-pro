
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Conversation, Message, Role, ChatMode, Attachment } from './types';
import { Sidebar } from './components/Sidebar';
import { ChatWindow } from './components/ChatWindow';
import { LiveVoiceOverlay } from './components/LiveVoiceOverlay';
import { LandingPage } from './components/LandingPage';
import { geminiService } from './services/geminiService';

const App: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    const saved = localStorage.getItem('conversations');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('isAuthenticated') === 'true';
  });

  const [activeId, setActiveId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [mode, setMode] = useState<ChatMode>('fast');
  const [isLiveOpen, setIsLiveOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('conversations', JSON.stringify(conversations));
  }, [conversations]);

  const handleLogin = () => {
    setIsAuthenticated(true);
    localStorage.setItem('isAuthenticated', 'true');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('isAuthenticated');
    setActiveId(null);
  };

  const activeConversation = conversations.find(c => c.id === activeId) || null;

  const handleNewChat = useCallback(() => {
    const newId = Date.now().toString();
    const newConversation: Conversation = {
      id: newId,
      title: 'New Chat',
      messages: [],
      createdAt: Date.now()
    };
    setConversations(prev => [newConversation, ...prev]);
    setActiveId(newId);
  }, []);

  const handleDeleteChat = useCallback((id: string) => {
    setConversations(prev => prev.filter(c => c.id !== id));
    if (activeId === id) {
      setActiveId(null);
    }
  }, [activeId]);

  const handleSendMessage = async (text: string, attachments?: Attachment[]) => {
    if ((!text.trim() && (!attachments || attachments.length === 0)) || isTyping) return;

    let currentConversation = activeConversation;
    if (!currentConversation) {
      const newId = Date.now().toString();
      currentConversation = {
        id: newId,
        title: text ? text.slice(0, 30) : 'New Image Chat',
        messages: [],
        createdAt: Date.now()
      };
      setConversations(prev => [currentConversation!, ...prev]);
      setActiveId(newId);
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: Role.USER,
      content: text,
      timestamp: Date.now(),
      attachments
    };

    setConversations(prev => prev.map(c => 
      c.id === currentConversation!.id 
        ? { ...c, messages: [...c.messages, userMessage], title: c.messages.length === 0 ? (text || 'New Chat').slice(0, 30) : c.title } 
        : c
    ));

    setIsTyping(true);

    const botMessageId = (Date.now() + 1).toString();
    const botMessage: Message = {
      id: botMessageId,
      role: Role.MODEL,
      content: '',
      timestamp: Date.now(),
      isThinking: mode === 'reasoning'
    };

    setConversations(prev => prev.map(c => 
      c.id === currentConversation!.id 
        ? { ...c, messages: [...c.messages, botMessage] } 
        : c
    ));

    try {
      let accumulatedResponse = '';
      let groundingSources: any[] = [];
      const stream = geminiService.streamChat(currentConversation!.messages, text, mode, attachments);
      
      for await (const chunk of stream) {
        accumulatedResponse += chunk.text || '';
        if (chunk.grounding && chunk.grounding.length > 0) {
          groundingSources = [...groundingSources, ...chunk.grounding];
        }
        
        setConversations(prev => prev.map(c => 
          c.id === currentConversation!.id 
            ? {
                ...c,
                messages: c.messages.map(m => m.id === botMessageId ? { 
                  ...m, 
                  content: accumulatedResponse,
                  groundingSources: groundingSources.length > 0 ? Array.from(new Set(groundingSources.map(s => s.uri))).map(uri => groundingSources.find(s => s.uri === uri)) : undefined
                } : m)
              }
            : c
        ));
      }
    } catch (error) {
      setConversations(prev => prev.map(c => 
        c.id === currentConversation!.id 
          ? {
              ...c,
              messages: c.messages.map(m => m.id === botMessageId ? { ...m, content: "Error communicating with Gemini." } : m)
            }
          : c
      ));
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex h-screen w-full text-gray-900 overflow-hidden font-sans relative">
      {/* Background Video */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="fixed top-0 left-0 w-full h-full object-cover -z-20 pointer-events-none brightness-75"
      >
        <source src="input_file_1.mp4" type="video/mp4" />
      </video>

      {/* Dark Gradient Overlay for readability */}
      <div className="fixed top-0 left-0 w-full h-full bg-black/30 -z-10 pointer-events-none" />

      {!isAuthenticated ? (
        <LandingPage onLogin={handleLogin} />
      ) : (
        <>
          <Sidebar 
            conversations={conversations} 
            activeId={activeId} 
            onSelect={setActiveId} 
            onNewChat={handleNewChat} 
            onDeleteChat={handleDeleteChat}
            isOpen={isSidebarOpen}
            setIsOpen={setIsSidebarOpen}
            onLogout={handleLogout}
          />
          
          <main className="flex-1 flex flex-col min-w-0 bg-transparent">
            <ChatWindow 
              conversation={activeConversation} 
              onSendMessage={handleSendMessage} 
              isTyping={isTyping}
              toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
              isSidebarOpen={isSidebarOpen}
              mode={mode}
              setMode={setMode}
              onOpenLive={() => setIsLiveOpen(true)}
            />
          </main>

          {isLiveOpen && <LiveVoiceOverlay onClose={() => setIsLiveOpen(false)} />}
        </>
      )}
    </div>
  );
};

export default App;
