'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send } from 'lucide-react';
import { getSocket } from '../lib/socket';
import { SOCKET_EVENTS } from '../socket/events';
import { useUserStore } from '../stores/userStore';

interface ChatMessage {
  id: string;
  userId: string;
  name: string;
  color: string;
  text: string;
  timestamp: number;
}

export default function ChatDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  
  const { me } = useUserStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const socket = getSocket();
    
    const handleMessage = (msg: ChatMessage) => {
      setMessages(prev => [...prev, msg]);
      if (!isOpen) {
        setUnreadCount(prev => prev + 1);
      }
    };
    
    // Also need to receive chat history when joining a room
    const handleRoomState = (state: { chat: ChatMessage[] }) => {
      if (state.chat) setMessages(state.chat);
    };
    
    socket.on(SOCKET_EVENTS.CHAT_MESSAGE, handleMessage);
    socket.on(SOCKET_EVENTS.ROOM_STATE, handleRoomState);
    
    return () => { 
      socket.off(SOCKET_EVENTS.CHAT_MESSAGE, handleMessage);
      socket.off(SOCKET_EVENTS.ROOM_STATE, handleRoomState);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, messages]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !me) return;

    const msg: ChatMessage = {
      id: Math.random().toString(36).substring(7),
      userId: me.id,
      name: me.name,
      color: me.color,
      text: inputText.trim(),
      timestamp: Date.now()
    };

    getSocket().emit(SOCKET_EVENTS.CHAT_MESSAGE, msg);
    setMessages(prev => [...prev, msg]);
    setInputText('');
  };

  return (
    <>
      <button 
        onClick={() => { setIsOpen(true); setUnreadCount(0); }}
        className={`absolute bottom-6 right-6 z-10 glass-heavy rounded-full p-4 flex items-center justify-center transition-all shadow-xl hover:shadow-2xl border border-white/5 ${isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100 text-white/80 hover:text-white'}`}
      >
        <MessageSquare size={24} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-pink-500 rounded-full text-[10px] font-bold flex items-center justify-center text-white border border-[#0a0a0f]">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <div className={`absolute top-0 right-0 h-full w-[350px] glass-heavy border-l border-white/5 shadow-2xl transition-transform duration-300 z-30 flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <MessageSquare size={18} className="text-indigo-400" />
            Team Chat
          </h2>
          <button onClick={() => setIsOpen(false)} className="text-white/40 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/10">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          {messages.length === 0 ? (
            <div className="m-auto text-center text-white/30 text-sm">No messages yet.<br/>Say hello to your team!</div>
          ) : (
            messages.map((msg, i) => {
              const isMe = msg.userId === me?.id;
              const showName = i === 0 || messages[i - 1].userId !== msg.userId;
              
              return (
                <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  {showName && !isMe && (
                    <span className="text-[11px] mb-1 font-semibold px-1" style={{ color: msg.color }}>
                      {msg.name}
                    </span>
                  )}
                  <div 
                    className={`px-3.5 py-2.5 rounded-2xl max-w-[85%] text-[13px] leading-relaxed shadow-sm ${isMe ? 'bg-indigo-600 text-white rounded-tr-sm' : 'bg-white/10 text-white/90 rounded-tl-sm border border-white/5'}`}
                  >
                    {msg.text}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={sendMessage} className="p-4 border-t border-white/5 bg-black/20">
          <div className="flex gap-2">
            <input 
              type="text" 
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-[13px] outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all placeholder:text-white/30"
            />
            <button 
              type="submit"
              disabled={!inputText.trim()}
              className="bg-indigo-500 hover:bg-indigo-400 disabled:bg-white/5 disabled:text-white/20 text-white rounded-xl w-[42px] shrink-0 flex items-center justify-center transition-all disabled:border disabled:border-white/5"
            >
              <Send size={16} className={inputText.trim() ? "translate-x-[-1px] translate-y-[1px]" : ""} />
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
