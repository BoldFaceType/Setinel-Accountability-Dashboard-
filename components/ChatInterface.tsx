import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User } from 'lucide-react';
import { ChatMessage } from '../types';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, onSendMessage }) => {
  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSendMessage(input.trim());
    setInput('');
  };

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-lg flex flex-col h-[500px]">
      <div className="p-3 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-300 font-mono flex items-center gap-2">
          <Bot size={16} className="text-emerald-400"/> OVERSEER_UPLINK
        </h3>
        <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 animate-pulse">
          ONLINE
        </span>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 ${msg.sender === 'User' ? 'flex-row-reverse' : ''}`}>
             <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.sender === 'User' ? 'bg-slate-700 text-slate-300' : 'bg-emerald-900/50 text-emerald-400'}`}>
               {msg.sender === 'User' ? <User size={14}/> : <Bot size={14}/>}
             </div>
             <div className={`max-w-[80%] rounded-lg p-3 text-sm font-mono ${msg.sender === 'User' ? 'bg-blue-900/20 text-blue-100 border border-blue-800/50' : 'bg-slate-800/50 text-slate-300 border border-slate-700'}`}>
                <div className="flex justify-between items-center mb-1 opacity-50 text-[10px] uppercase">
                  <span>{msg.sender}</span>
                  <span>{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
                {msg.content}
             </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <form onSubmit={handleSend} className="p-3 border-t border-slate-800 bg-slate-900/50">
        <div className="flex gap-2">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Report status or justify complexity..."
            className="flex-1 bg-black/50 border border-slate-700 rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-emerald-500/50 transition-colors"
            maxLength={500}
          />
          <button 
            type="submit"
            className="bg-emerald-600 hover:bg-emerald-500 text-white rounded px-4 transition-colors"
          >
            <Send size={16} />
          </button>
        </div>
      </form>
    </div>
  );
};