import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext.js';
import { api } from '../../services/api.js';
import {
  Bot, Send, X, Sparkles, User, CheckCircle2,
  Calendar, PhoneCall, MessageCircle, Minimize2, Maximize2,
  Database, ShieldCheck
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  suggestedActions?: string[];
  requiresHuman?: boolean;
  whatsappAlertSent?: boolean;
  leadCaptured?: boolean;
}

const CHAT_STORAGE_KEY = 'rks_assistant_conversation';
const SESSION_ID_KEY = 'rks_assistant_session_id';

export const AiConciergeChat: React.FC = () => {
  const { openSiteVisitModal, setActiveTab } = useApp();
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [inputMsg, setInputMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSearchingDb, setIsSearchingDb] = useState(false);

  // Initialize session ID
  const [sessionId] = useState<string>(() => {
    let sid = sessionStorage.getItem(SESSION_ID_KEY);
    if (!sid) {
      sid = `rks-session-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      sessionStorage.setItem(SESSION_ID_KEY, sid);
    }
    return sid;
  });

  // Welcome message based on language
  const getWelcomeText = (lang: string) => {
    if (lang === 'ta') {
      return 'வணக்கம்! 🙏 நான் உங்கள் **RKS Assistant**.\n\nஎங்கள் நேரடி தரவுத்தளத்தில் இருந்து சரிபார்க்கப்பட்ட மனை விவரங்கள், சதுர அடி விலை, DTCP/பட்டா அங்கீகார நிலை அல்லது **இலவச வாகன தளப் பார்வை முன்பதிவு** செய்ய நான் உங்களுக்கு உதவ முடியும்.\n\nஇன்று நான் உங்களுக்கு எவ்வாறு உதவலாம்?';
    }
    return 'Namaste! 🙏 I am your **RKS Assistant**.\n\nI am grounded in our live real-estate registry to give you accurate plot rates, availability, survey numbers, DTCP status, or schedule a **free site visit with cab pickup**.\n\nHow can I help you today?';
  };

  const getDefaultSuggestedActions = (lang: string) => {
    if (lang === 'ta') {
      return ['விற்பனைக்கு உள்ள மனைகள்', 'திருச்சி மனைகள்', 'இலவச வாகன தளப் பார்வை', 'DTCP அங்கீகார விவரங்கள்'];
    }
    return ['Available Plots', 'Trichy Plots Under 15L', 'Book Free Cab Site Visit', 'Check DTCP Status'];
  };

  // Load persisted messages from sessionStorage or fallback to welcome
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = sessionStorage.getItem(CHAT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Ignore parse errors
    }
    return [
      {
        id: 'msg-welcome',
        sender: 'assistant',
        text: getWelcomeText(i18n.language || 'en'),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedActions: getDefaultSuggestedActions(i18n.language || 'en'),
      },
    ];
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Persist messages whenever updated
  useEffect(() => {
    try {
      sessionStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
    } catch {
      // Ignore storage errors
    }
    if (isOpen) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  // Listen for openAiChat custom event fired by Property Cards / Modals
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { propertyCode: string; projectName: string };
      setIsOpen(true);
      setIsMinimized(false);
      const isTa = i18n.language === 'ta';
      const prompt = isTa 
        ? `${detail.propertyCode} மனையின் விலை மற்றும் பரப்பளவு விவரங்கள் என்ன?`
        : `What is the price, size and DTCP status of ${detail.propertyCode}?`;
      setInputMsg(prompt);
    };
    window.addEventListener('openAiChat', handler);
    return () => window.removeEventListener('openAiChat', handler);
  }, [i18n.language]);

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
    setIsSearchingDb(true);

    try {
      const res = await api.sendAiChatMessage({
        message: text,
        history: messages.slice(-6).map(m => ({ role: m.sender, content: m.text })),
        locale: i18n.language || 'en',
        session_id: sessionId
      });

      const aiMsg: ChatMessage = {
        id: 'msg-ai-' + Date.now(),
        sender: 'assistant',
        text: res.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedActions: res.suggestedActions || [],
        requiresHuman: res.requiresHuman,
        whatsappAlertSent: res.whatsappAlertSent,
        leadCaptured: res.leadCaptured,
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      const isTa = i18n.language === 'ta';
      const errMsg: ChatMessage = {
        id: 'msg-err-' + Date.now(),
        sender: 'assistant',
        text: isTa 
          ? 'மன்னிக்கவும், தரவுத்தள இணைப்பு தற்காலிகமாக தடைபட்டுள்ளது. தயவுசெய்து சிறிது நேரம் கழித்து முயற்சிக்கவும் அல்லது எங்கள் விற்பனை குழுவை நேரடியாக அழைக்கவும்.'
          : 'I apologize, I am temporarily experiencing a connectivity delay with our registry. Please try again shortly or connect directly with our sales desk.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedActions: isTa ? ['தளப் பார்வை முன்பதிவு', 'அழைக்க: +91 98400 11223'] : ['Book a Site Visit', 'Call: +91 98400 11223'],
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
      setIsSearchingDb(false);
    }
  };

  const renderText = (text: string) => {
    return text
      .split('\n')
      .map((line, i) => {
        // Simple markdown replacement for bold and italic
        const formatted = line
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.*?)\*/g, '<em>$1</em>');
        return <p key={i} className="text-xs leading-relaxed" dangerouslySetInnerHTML={{ __html: formatted }} />;
      });
  };

  // Coordinated Mobile & Desktop Positioning:
  // On desktop: bottom-6 right-24 (smoothly beside bottom-6 right-6 WhatsApp button)
  // On mobile: bottom-20 right-4 (stacked cleanly above sticky WhatsApp floating button)
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-4 md:bottom-6 md:right-24 z-40 flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl shadow-luxury-dark transition-all hover:scale-105 active:scale-95 bg-gradient-to-r from-[#0B1424] via-[#0E1D2D] to-brand-teal/40 border border-brand-teal/60 backdrop-blur-md group"
        title="Open RKS Grounded AI Assistant"
      >
        <div className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-brand-teal/25 border border-brand-teal/50 text-brand-teal-light group-hover:bg-brand-teal group-hover:text-white transition-colors">
          <Bot className="h-4 w-4" />
          <span className="absolute -top-1 -right-1 flex h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-brand-navy animate-pulse" />
        </div>
        <div className="text-left hidden sm:block">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-white tracking-wide">RKS Assistant</span>
            <span className="text-[8px] uppercase font-mono px-1 py-0.2 rounded bg-brand-gold/20 text-brand-gold-light border border-brand-gold/30">
              Live DB
            </span>
          </div>
          <p className="text-[10px] text-slate-400">Ask rates, DTCP & plots</p>
        </div>
      </button>
    );
  }

  return (
    <div 
      className={`fixed bottom-20 right-4 md:bottom-6 md:right-6 z-50 flex flex-col rounded-3xl shadow-luxury-dark transition-all ${
        isMinimized ? 'h-16 w-80' : 'h-[580px] w-96 max-w-[calc(100vw-32px)]'
      } bg-[#0B0F17] border border-slate-700/80 overflow-hidden animate-fade-in`}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-t-3xl bg-gradient-to-r from-brand-navy via-[#101726] to-brand-teal/30 border-b border-slate-800">
        <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-brand-teal/20 border border-brand-teal/40 text-brand-teal-light">
          <Bot className="h-5 w-5" />
          <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-400 ring-1 ring-black" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-xs font-bold text-white font-sans truncate">RKS Assistant</p>
            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-brand-gold/15 text-brand-gold border border-brand-gold/30">
              RAG
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Database className="h-3 w-3 text-brand-teal-light" />
            <span className="text-[10px] text-emerald-400 font-medium">Grounded in Live Registry</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setIsMinimized(!isMinimized)} 
            className="flex h-7 w-7 items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            title={isMinimized ? 'Expand' : 'Minimize'}
          >
            {isMinimized ? <Maximize2 className="h-3.5 w-3.5" /> : <Minimize2 className="h-3.5 w-3.5" />}
          </button>
          <button 
            onClick={() => setIsOpen(false)} 
            className="flex h-7 w-7 items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Close"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin scrollbar-thumb-zinc-700">
            {messages.map(msg => (
              <div key={msg.id} className={`flex gap-2.5 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl text-white text-xs font-bold ${
                  msg.sender === 'user'
                    ? 'bg-gradient-to-br from-brand-teal to-teal-700'
                    : 'bg-gradient-to-br from-brand-navy to-slate-800 border border-brand-teal/40 text-brand-teal-light'
                }`}>
                  {msg.sender === 'user' ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                </div>

                <div className={`max-w-[80%] space-y-1.5 ${msg.sender === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
                  <div 
                    className={`rounded-2xl px-3.5 py-2.5 text-xs ${
                      msg.sender === 'user'
                        ? 'bg-brand-teal text-white shadow-md'
                        : 'bg-[#121824] text-slate-200 border border-slate-800/90 shadow-sm'
                    }`}
                  >
                    <div className="space-y-1">{renderText(msg.text)}</div>
                  </div>

                  {msg.leadCaptured && (
                    <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-semibold bg-emerald-950/30 px-2 py-0.5 rounded border border-emerald-500/30">
                      <ShieldCheck className="h-3 w-3" />
                      Lead registered with sales desk
                    </div>
                  )}

                  {msg.whatsappAlertSent && (
                    <div className="flex items-center gap-1.5 text-[10px] text-amber-400 font-semibold">
                      <CheckCircle2 className="h-3 w-3" />
                      WhatsApp notification dispatched
                    </div>
                  )}

                  {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {msg.suggestedActions.map((action, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            const actLower = action.toLowerCase();
                            if (actLower.includes('site visit') || actLower.includes('visit') || actLower.includes('தளப் பார்வை')) {
                              openSiteVisitModal?.();
                            } else if (actLower.includes('properties') || actLower.includes('plots') || actLower.includes('மனைகள்')) {
                              setActiveTab('properties');
                            } else {
                              handleSend(action);
                            }
                          }}
                          className="rounded-lg px-2.5 py-1 text-[11px] font-semibold text-brand-teal-light bg-brand-teal/10 border border-brand-teal/30 hover:bg-brand-teal/20 transition-colors"
                        >
                          {action}
                        </button>
                      ))}
                    </div>
                  )}

                  <span className="text-[9px] text-slate-500">{msg.timestamp}</span>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-2.5 items-start">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-brand-navy border border-brand-teal/40 text-brand-teal-light">
                  <Bot className="h-3.5 w-3.5" />
                </div>
                <div className="rounded-2xl bg-[#121824] border border-slate-800 px-3.5 py-2 space-y-1">
                  {isSearchingDb && (
                    <div className="flex items-center gap-1.5 text-[10px] text-brand-teal-light font-mono animate-pulse">
                      <Database className="h-3 w-3" />
                      <span>Querying live database records...</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    {[0, 1, 2].map(i => (
                      <span key={i} className="h-1.5 w-1.5 rounded-full bg-brand-teal animate-bounce" style={{ animationDelay: i * 150 + 'ms' }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Box */}
          <div className="p-3 border-t border-slate-800 bg-[#0A0D15]">
            <div className="flex items-center gap-2 rounded-2xl border border-slate-700/80 bg-slate-900/90 px-3 py-2 focus-within:border-brand-teal transition-colors">
              <input
                type="text"
                value={inputMsg}
                onChange={(e) => setInputMsg(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder={i18n.language === 'ta' ? 'மனைகள், விலை, DTCP பற்றி கேளுங்கள்...' : 'Ask about plots, pricing, DTCP, site visits...'}
                disabled={isLoading}
                className="flex-1 bg-transparent text-xs text-white placeholder-slate-500 outline-none"
              />
              <button
                onClick={() => handleSend()}
                disabled={!inputMsg.trim() || isLoading}
                className="flex h-7 w-7 items-center justify-center rounded-xl bg-brand-teal text-white disabled:opacity-30 transition-all hover:scale-105 active:scale-95"
                title="Send"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="flex items-center justify-between mt-1.5 px-1 text-[9px] text-slate-500 font-mono">
              <span>Ground Truth RAG · Multi-Language</span>
              <span>English / தமிழ்</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
