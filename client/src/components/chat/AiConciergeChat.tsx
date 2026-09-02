import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext.js';
import { api } from '../../services/api.js';
import {
  Bot, Send, X, Sparkles, User, CheckCircle2,
  Calendar, PhoneCall, MessageCircle, Minimize2, Maximize2,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  suggestedActions?: string[];
  requiresHuman?: boolean;
  whatsappAlertSent?: boolean;
}

export const AiConciergeChat: React.FC = () => {
  const { openSiteVisitModal, setActiveTab } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [inputMsg, setInputMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'assistant',
      text: 'Namaste! 🙏 I am your **RKS Property AI Concierge**.\n\nI can help you explore plot sizes, check current rates (₹850–₹900/sq.ft), calculate total prices, or arrange a **free site visit with cab pickup**.\n\nHow can I help you today?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestedActions: [
        'What are the rates in RKS Prime Layout?',
        'Show plots under ₹15 Lakhs',
        'Book a free site visit',
        'Can I speak with a sales advisor?',
      ],
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  // Listen for openAiChat event fired by PropertyDetailsModal CTA
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { propertyCode: string; projectName: string };
      setIsOpen(true);
      setIsMinimized(false);
      // Pre-populate a prompt about the specific property
      const propertySuggestion = `Tell me more about ${detail.propertyCode} in ${detail.projectName}`;
      setInputMsg(propertySuggestion);
    };
    window.addEventListener('openAiChat', handler);
    return () => window.removeEventListener('openAiChat', handler);
  }, []);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputMsg).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: 'msg-' + Date.now(),
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages(prev => [...prev, userMsg]);
    setInputMsg('');
    setIsLoading(true);

    try {
      const res = await api.sendAiChatMessage({
        message: text,
        history: messages.slice(-6).map(m => ({ role: m.sender, content: m.text })),
      });

      const aiMsg: ChatMessage = {
        id: 'msg-ai-' + Date.now(),
        sender: 'assistant',
        text: res.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedActions: res.suggestedActions || [],
        requiresHuman: res.requiresHuman,
        whatsappAlertSent: res.whatsappAlertSent,
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      const errMsg: ChatMessage = {
        id: 'msg-err-' + Date.now(),
        sender: 'assistant',
        text: 'I apologize, I am temporarily unavailable. Please try again shortly or call us directly.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedActions: ['Book a Site Visit', 'Call Sales Team'],
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderText = (text: string) => {
    return text
      .split('\n')
      .map((line, i) => {
        const formatted = line
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.*?)\*/g, '<em>$1</em>');
        return <p key={i} className="text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: formatted }} />;
      });
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex h-16 w-16 items-center justify-center rounded-full shadow-2xl transition-all hover:scale-110 active:scale-95"
        style={{ background: 'linear-gradient(135deg, #8b5cf6, #ec4899)' }}
        title="Chat with AI Concierge"
      >
        <MessageCircle className="h-7 w-7 text-white" />
        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-black text-white animate-bounce">
          AI
        </span>
      </button>
    );
  }

  return (
    <div className={`fixed bottom-6 right-6 z-50 flex flex-col rounded-3xl shadow-2xl transition-all ${isMinimized ? 'h-16 w-80' : 'h-[580px] w-96'}`}
      style={{ background: 'linear-gradient(180deg, #0f0a1e 0%, #0d1117 100%)', border: '1px solid rgba(139,92,246,0.3)' }}>
      
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-t-3xl" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.3), rgba(236,72,153,0.2))', borderBottom: '1px solid rgba(139,92,246,0.2)' }}>
        <div className="flex h-9 w-9 items-center justify-center rounded-2xl text-white" style={{ background: 'linear-gradient(135deg, #8b5cf6, #ec4899)' }}>
          <Bot className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white">RKS AI Concierge</p>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] text-emerald-400 font-semibold">Online · Replies instantly</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setIsMinimized(!isMinimized)} className="flex h-7 w-7 items-center justify-center rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors">
            {isMinimized ? <Maximize2 className="h-3.5 w-3.5" /> : <Minimize2 className="h-3.5 w-3.5" />}
          </button>
          <button onClick={() => setIsOpen(false)} className="flex h-7 w-7 items-center justify-center rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-zinc-700">
            {messages.map(msg => (
              <div key={msg.id} className={`flex gap-2.5 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl text-white text-xs font-bold ${
                  msg.sender === 'user'
                    ? 'bg-gradient-to-br from-violet-500 to-indigo-600'
                    : 'bg-gradient-to-br from-fuchsia-500 to-violet-600'
                }`}>
                  {msg.sender === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </div>

                <div className={`max-w-[75%] space-y-2 ${msg.sender === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
                  <div className={`rounded-2xl px-4 py-3 text-sm ${
                    msg.sender === 'user'
                      ? 'text-white'
                      : 'bg-zinc-800/80 text-zinc-100 border border-zinc-700/50'
                  }`} style={msg.sender === 'user' ? { background: 'linear-gradient(135deg, #8b5cf6, #6366f1)' } : {}}>
                    <div className="space-y-1">{renderText(msg.text)}</div>
                  </div>

                  {msg.whatsappAlertSent && (
                    <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-semibold">
                      <CheckCircle2 className="h-3 w-3" />
                      WhatsApp alert sent to Sales Team
                    </div>
                  )}

                  {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {msg.suggestedActions.map((action, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            if (action.toLowerCase().includes('site visit') || action.toLowerCase().includes('visit')) {
                              openSiteVisitModal?.();
                            } else if (action.toLowerCase().includes('properties') || action.toLowerCase().includes('plots')) {
                              setActiveTab('properties');
                            } else {
                              handleSend(action);
                            }
                          }}
                          className="rounded-xl px-3 py-1.5 text-[11px] font-semibold text-violet-300 border border-violet-500/40 hover:bg-violet-500/20 transition-colors"
                        >
                          {action}
                        </button>
                      ))}
                    </div>
                  )}

                  <span className="text-[10px] text-zinc-600">{msg.timestamp}</span>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl text-white" style={{ background: 'linear-gradient(135deg, #ec4899, #8b5cf6)' }}>
                  <Bot className="h-4 w-4" />
                </div>
                <div className="rounded-2xl bg-zinc-800/80 border border-zinc-700/50 px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    {[0, 1, 2].map(i => (
                      <span key={i} className="h-2 w-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: i * 150 + 'ms' }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-zinc-800/60">
            <div className="flex items-center gap-2 rounded-2xl border border-zinc-700/60 bg-zinc-800/60 px-4 py-2.5 focus-within:border-violet-500/60 transition-colors">
              <input
                type="text"
                value={inputMsg}
                onChange={(e) => setInputMsg(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder="Ask about plots, pricing, site visits..."
                disabled={isLoading}
                className="flex-1 bg-transparent text-sm text-zinc-100 placeholder-zinc-500 outline-none"
              />
              <button
                onClick={() => handleSend()}
                disabled={!inputMsg.trim() || isLoading}
                className="flex h-8 w-8 items-center justify-center rounded-xl text-white disabled:opacity-30 transition-all hover:scale-110"
                style={{ background: 'linear-gradient(135deg, #8b5cf6, #ec4899)' }}
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 text-center text-[10px] text-zinc-600">RKS AI · Powered by real property database</p>
          </div>
        </>
      )}
    </div>
  );
};
