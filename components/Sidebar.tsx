
import React from 'react';
import { Conversation } from '../types';
import { MessageSquare, Plus, Trash2, Menu, X, LogOut } from 'lucide-react';

interface SidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  onDeleteChat: (id: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  conversations, 
  activeId, 
  onSelect, 
  onNewChat, 
  onDeleteChat,
  isOpen,
  setIsOpen,
  onLogout
}) => {
  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm" 
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-black/60 backdrop-blur-xl text-white flex flex-col transition-transform duration-300 ease-in-out border-r border-white/10
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0 md:flex-shrink-0
      `}>
        <div className="p-4 flex flex-col h-full">
          <button 
            onClick={onNewChat}
            className="flex items-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl transition-all mb-6 font-medium text-sm"
          >
            <Plus size={18} />
            New Chat
          </button>

          <div className="flex-1 overflow-y-auto space-y-1 -mx-2 px-2">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2 mb-2">History</div>
            {conversations.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500 text-sm italic">
                No history yet
              </div>
            ) : (
              conversations.map(conv => (
                <div 
                  key={conv.id}
                  className={`
                    group flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all relative mb-1
                    ${activeId === conv.id ? 'bg-white/15 text-white shadow-sm ring-1 ring-white/20' : 'text-gray-400 hover:bg-white/5 hover:text-white'}
                  `}
                  onClick={() => {
                    onSelect(conv.id);
                    if (window.innerWidth < 768) setIsOpen(false);
                  }}
                >
                  <MessageSquare size={16} className="shrink-0" />
                  <span className="truncate text-sm flex-1">{conv.title}</span>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteChat(conv.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-opacity p-1"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="mt-auto pt-4 border-t border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3 px-2 py-1 flex-1 min-w-0">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-xs font-bold border border-white/10 shadow-lg shrink-0">
                U
              </div>
              <div className="flex-1 truncate">
                <p className="text-sm font-semibold tracking-tight">Guest User</p>
                <p className="text-[10px] text-gray-400 font-medium">Free Tier</p>
              </div>
            </div>
            <button 
              onClick={onLogout}
              className="p-2 text-gray-400 hover:text-red-400 transition-colors hover:bg-white/5 rounded-lg shrink-0"
              title="Sign Out"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
