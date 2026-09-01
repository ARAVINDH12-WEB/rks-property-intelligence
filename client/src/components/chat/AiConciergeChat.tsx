import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext.js';
import { api } from '../../services/api.js';
import {
  Bot,
  Send,
  X,
  Sparkles,
  User,
  CheckCircle2,
  Calendar,
  PhoneCall,
  MessageCircle,
  Minimize2,
  Maximize2,
  ArrowRight,
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputMsg).trim();
    if (!text || isLoading) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMsg('');
    setIsLoading(true);

    try {
      const res = await api.sendAiChatMessage({
        message: text,
        history: messages.slice(-6).map((m) => ({ role: m.sender, content: m.text })),
      });

      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'assistant',
        text: res.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedActions: res.suggestedActions,
        requiresHuman: res.requiresHuman,
        whatsappAlertSent: res.whatsappAlertSent,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now() + 1}`,
          sender: 'assistant',
          text: 'I apologize, I am temporarily having trouble accessing the property network. You can book a site visit directly using the button below or contact our sales hotline.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          suggestedActions: ['Book a free site visit'],
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleActionClick = (action: string) => {
    if (action.toLowerCase().includes('site visit') || action.toLowerCase().includes('tour')) {
      openSiteVisitModal();
    } else if (action.toLowerCase().includes('available plots') || action.toLowerCase().includes('browse')) {
      setActiveTab('properties');
    } else {
      handleSend(action);
    }
  };

  return (
    <>
      {/* Floating Chat Trigger Button */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-40">
          <button
            onClick={() => setIsOpen(true)}
            className="group flex items-center gap-3 rounded-full border border-amber-500/40 bg-gradient-to-r from-amber-500 via-[#181B24] to-[#12161F] p-1.5 pr-5 shadow-2xl transition-all duration-300 hover:scale-105 hover:border-amber-400 hover:shadow-amber-500/20"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500 text-black shadow-md shadow-amber-500/40 animate-pulse">
              <Bot className="h-6 w-6" />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-white text-xs tracking-wide">RKS AI Concierge</span>
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              </div>
              <span className="text-[10px] text-amber-300 font-medium">Ask rates, plots & book visits</span>
            </div>
          </button>
        </div>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex flex-col overflow-hidden rounded-3xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#0D1017] shadow-2xl backdrop-blur-2xl transition-all duration-300 ${
            isMinimized ? 'h-16 w-80' : 'h-[580px] w-96 sm:w-[420px]'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-[#12161F] px-5 py-3.5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-black shadow-inner">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white font-sans">RKS Property Concierge</h3>
                  <span className="rounded-full bg-emerald-100 dark:bg-emerald-950/80 px-1.5 py-0.2 text-[9px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                    LIVE
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-zinc-400">Grounded in verified RKS inventory</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsMinimized((prev) => !prev)}
                className="rounded-lg p-1.5 text-slate-400 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                title={isMinimized ? 'Expand' : 'Minimize'}
              >
                {isMinimized ? <Maximize2 className="h-3.5 w-3.5" /> : <Minimize2 className="h-3.5 w-3.5" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages Body */}
          {!isMinimized && (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-50/50 dark:bg-[#0A0C10]/60 text-xs">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl p-3.5 shadow-sm dark:shadow-md ${
                        msg.sender === 'user'
                          ? 'bg-amber-500 text-black font-medium rounded-tr-none'
                          : 'bg-white dark:bg-[#12161F] text-slate-800 dark:text-zinc-200 border border-slate-200 dark:border-zinc-800 rounded-tl-none leading-relaxed'
                      }`}
                    >
                      <div className="whitespace-pre-line">{msg.text}</div>

                      {/* WhatsApp Notification Alert Banner inside Chat */}
                      {msg.whatsappAlertSent && (
                        <div className="mt-3 flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/60 p-2.5 text-[11px] text-emerald-800 dark:text-emerald-300">
                          <MessageCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <div>
                            <span className="font-bold">Sales Advisor Alerted on WhatsApp</span>
                            <div className="text-[10px] text-emerald-700 dark:text-emerald-400/80">An executive has been dispatched for direct follow-up.</div>
                          </div>
                        </div>
                      )}
                    </div>

                    <span className="mt-1 text-[9px] font-mono text-slate-400 dark:text-zinc-500 px-1">
                      {msg.timestamp}
                    </span>

                    {/* Action Chips */}
                    {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5 max-w-[90%]">
                        {msg.suggestedActions.map((action, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleActionClick(action)}
                            className="flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-[10px] font-semibold text-amber-700 dark:text-amber-300 hover:bg-amber-500 hover:text-black transition-all cursor-pointer"
                          >
                            <Sparkles className="h-2.5 w-2.5" />
                            <span>{action}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {isLoading && (
                  <div className="flex items-center gap-2 text-slate-400 dark:text-zinc-400">
                    <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
                      <Bot className="h-4 w-4" />
                    </div>
                    <div className="flex items-center gap-1 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#12161F] px-3 py-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-bounce" />
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-bounce [animation-delay:0.2s]" />
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Footer */}
              <div className="border-t border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#12161F] p-3">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSend();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={inputMsg}
                    onChange={(e) => setInputMsg(e.target.value)}
                    placeholder="Ask about plot prices, rates, or book a visit..."
                    className="flex-1 rounded-xl border border-slate-300 dark:border-zinc-800 bg-slate-50 dark:bg-[#0A0C10] px-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 outline-none focus:border-amber-500"
                  />

                  <button
                    type="submit"
                    disabled={!inputMsg.trim() || isLoading}
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-black hover:bg-amber-400 transition-colors disabled:opacity-40 cursor-pointer"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};
