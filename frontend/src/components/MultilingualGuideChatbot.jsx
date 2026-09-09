import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  Sparkles,
  X,
  Minimize2,
  Maximize2,
  Send,
  RotateCcw,
  Languages,
  ExternalLink,
  Shield,
  HelpCircle,
  FolderPlus,
  FileCheck,
  Gavel,
  ShieldCheck,
  Lock,
  ChevronDown,
  Info
} from 'lucide-react';
import {
  SUPPORTED_LANGUAGES,
  QUICK_TOPICS,
  findKnowledgeAnswer,
  isSecurityOrArchitectureQuery,
  GUARDRAIL_REFUSAL_MESSAGES
} from '../services/systemGuideKnowledge';

import { api } from '../services/api';

export const MultilingualGuideChatbot = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [selectedLang, setSelectedLang] = useState('en');
  const [inputQuery, setInputQuery] = useState('');
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const messagesEndRef = useRef(null);
  const langDropdownRef = useRef(null);

  // Initialize with greeting in chosen language
  useEffect(() => {
    const greeting = findKnowledgeAnswer('', selectedLang);
    setMessages([
      {
        id: 'init-1',
        sender: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'general',
        text: greeting.text
      }
    ]);
  }, [selectedLang]);

  // Listen to custom navbar trigger event
  useEffect(() => {
    const handleToggle = () => {
      setIsOpen(prev => !prev);
      setIsMinimized(false);
    };
    window.addEventListener('toggle-nyayasahayak-guide', handleToggle);
    return () => window.removeEventListener('toggle-nyayasahayak-guide', handleToggle);
  }, []);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isMinimized, isTyping]);

  // Close language dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(e.target)) {
        setLangMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSend = async (queryText) => {
    const textToSend = (queryText || inputQuery).trim();
    if (!textToSend) return;

    const userMsg = {
      id: `user-${Date.now()}`,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: textToSend
    };

    setMessages(prev => [...prev, userMsg]);
    setInputQuery('');
    setIsTyping(true);

    // 1. Guardrail check first: strictly refuse system code / credentials
    if (isSecurityOrArchitectureQuery(textToSend)) {
      setTimeout(() => {
        setMessages(prev => [
          ...prev,
          {
            id: `bot-${Date.now()}`,
            sender: 'assistant',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            type: 'refusal',
            text: GUARDRAIL_REFUSAL_MESSAGES[selectedLang] || GUARDRAIL_REFUSAL_MESSAGES.en
          }
        ]);
        setIsTyping(false);
      }, 300);
      return;
    }

    // 2. Match curated workflow guides
    const localAnswer = findKnowledgeAnswer(textToSend, selectedLang);
    if (localAnswer.type === 'guide') {
      setTimeout(() => {
        setMessages(prev => [
          ...prev,
          {
            id: `bot-${Date.now()}`,
            sender: 'assistant',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            ...localAnswer
          }
        ]);
        setIsTyping(false);
      }, 350);
      return;
    }

    // 3. For custom queries, query backend AI guideChat if available
    try {
      const activeLang = SUPPORTED_LANGUAGES.find(l => l.code === selectedLang) || SUPPORTED_LANGUAGES[0];
      const res = await api.guideChat(textToSend, activeLang.label);
      if (res && res.reply && res.reply.trim().length > 0) {
        setMessages(prev => [
          ...prev,
          {
            id: `bot-${Date.now()}`,
            sender: 'assistant',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            type: 'ai-reply',
            text: res.reply
          }
        ]);
        setIsTyping(false);
        return;
      }
    } catch (_) {
      // Backend not running or offline, proceed to fallback
    }

    // 4. Default fallback guidance
    setMessages(prev => [
      ...prev,
      {
        id: `bot-${Date.now()}`,
        sender: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        ...localAnswer
      }
    ]);
    setIsTyping(false);
  };

  const handleTopicClick = (topic) => {
    const titleText = topic.title[selectedLang] || topic.title.en;
    handleSend(titleText);
  };

  const handleActionClick = (route) => {
    if (route) {
      if (route.includes('new=true')) {
        navigate('/cases?new=true', { state: { openModal: true } });
        window.dispatchEvent(new CustomEvent('open-new-dossier-modal'));
      } else {
        navigate(route);
      }
      setIsMinimized(true);
    }
  };

  const resetChat = () => {
    const greeting = findKnowledgeAnswer('', selectedLang);
    setMessages([
      {
        id: `reset-${Date.now()}`,
        sender: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'general',
        text: greeting.text
      }
    ]);
  };

  const activeLangObj = SUPPORTED_LANGUAGES.find(l => l.code === selectedLang) || SUPPORTED_LANGUAGES[0];

  const getTopicIcon = (iconName) => {
    switch (iconName) {
      case 'FolderPlus': return <FolderPlus className="w-3.5 h-3.5 text-violet-400" />;
      case 'FileCheck': return <FileCheck className="w-3.5 h-3.5 text-amber-400" />;
      case 'Gavel': return <Gavel className="w-3.5 h-3.5 text-indigo-400" />;
      case 'ShieldCheck': return <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />;
      case 'Lock': return <Lock className="w-3.5 h-3.5 text-rose-400" />;
      default: return <Sparkles className="w-3.5 h-3.5 text-cyan-400" />;
    }
  };

  return (
    <>
      {/* Interactive Guide Assistant Window (Opened via Navbar Guide button) */}
      {isOpen && (
        <div
          className={`fixed bottom-5 right-5 z-50 flex flex-col bg-[#0A0C16] border border-white/[0.14] rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.85)] overflow-hidden transition-all duration-300 backdrop-blur-2xl ${
            isMinimized
              ? 'w-80 h-16'
              : 'w-[95vw] sm:w-[440px] md:w-[480px] h-[600px] max-h-[85vh]'
          }`}
        >
          {/* Header Bar */}
          <div className="px-4 py-3 bg-[#0F1222] border-b border-white/[0.08] flex items-center justify-between select-none">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-2xl bg-gradient-to-tr from-violet-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-violet-600/30">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-extrabold text-xs sm:text-sm text-white font-mono tracking-wide">
                    Saarthi
                  </h3>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold uppercase bg-violet-500/20 text-violet-300 border border-violet-500/40">
                    सारथी 🇮🇳
                  </span>
                </div>
                {!isMinimized && (
                  <p className="text-[10px] text-slate-400 font-medium">
                    Legal & Investigation Workflow Assistant
                  </p>
                )}
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-1">
              {/* Language Selector Dropdown */}
              {!isMinimized && (
                <div className="relative" ref={langDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setLangMenuOpen(!langMenuOpen)}
                    className="flex items-center gap-1 px-2 py-1 rounded-xl bg-[#171B30] hover:bg-[#1E2340] text-slate-200 border border-white/[0.08] text-[11px] font-medium transition cursor-pointer"
                    title="Change Guidance Language"
                  >
                    <Languages className="w-3 h-3 text-cyan-400" />
                    <span className="font-bold">{activeLangObj.flag} {activeLangObj.native}</span>
                    <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${langMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {langMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-[#0C0E1C] border border-white/15 rounded-2xl shadow-2xl p-1.5 z-50 max-h-64 overflow-y-auto space-y-0.5 custom-scrollbar">
                      <div className="px-2 py-1 text-[9px] font-mono uppercase text-slate-400 border-b border-white/[0.06] mb-1 font-bold">
                        Select Indian Language (10)
                      </div>
                      {SUPPORTED_LANGUAGES.map((lang) => (
                        <button
                          key={lang.code}
                          type="button"
                          onClick={() => {
                            setSelectedLang(lang.code);
                            setLangMenuOpen(false);
                          }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between transition cursor-pointer ${
                            selectedLang === lang.code
                              ? 'bg-violet-600/30 text-white font-bold border border-violet-500/40'
                              : 'text-slate-300 hover:bg-[#171B30] hover:text-white'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <span>{lang.flag}</span>
                            <span>{lang.native}</span>
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {lang.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Clear chat */}
              {!isMinimized && (
                <button
                  type="button"
                  onClick={resetChat}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#171B30] transition cursor-pointer"
                  title="Reset conversation"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Minimize / Maximize */}
              <button
                type="button"
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#171B30] transition cursor-pointer"
                title={isMinimized ? 'Expand' : 'Minimize'}
              >
                {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
              </button>

              {/* Close */}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-[#171B30] transition cursor-pointer"
                title="Close Guide"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Main Content Area (Hidden if Minimized) */}
          {!isMinimized && (
            <>
              {/* Quick Action Suggestion Chips Bar */}
              <div className="p-2.5 bg-[#0D101E]/90 border-b border-white/[0.06] overflow-x-auto custom-scrollbar flex items-center gap-1.5 whitespace-nowrap select-none">
                <span className="text-[10px] font-mono uppercase text-slate-500 pl-1 font-bold flex items-center gap-1">
                  <HelpCircle className="w-3 h-3 text-cyan-400" />
                  Guide:
                </span>
                {QUICK_TOPICS.map((topic, idx) => (
                  <button
                    key={topic.id}
                    type="button"
                    onClick={() => handleTopicClick(topic)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#14182B] hover:bg-violet-600/20 hover:border-violet-500/50 border border-white/[0.08] text-[11px] font-medium text-slate-300 hover:text-white transition cursor-pointer group"
                  >
                    <span className="w-4 h-4 rounded-full bg-cyan-500/20 group-hover:bg-cyan-500/40 text-cyan-300 font-mono font-bold text-[10px] flex items-center justify-center border border-cyan-500/40">
                      {idx + 1}
                    </span>
                    {getTopicIcon(topic.icon)}
                    <span>{topic.title[selectedLang] || topic.title.en}</span>
                  </button>
                ))}
              </div>

              {/* Messages Stream */}
              <div className="flex-1 p-3 sm:p-4 overflow-y-auto space-y-3.5 custom-scrollbar bg-gradient-to-b from-[#0A0C16] to-[#0D0F1D]">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${
                      msg.sender === 'user' ? 'items-end' : 'items-start'
                    } animate-in fade-in duration-200`}
                  >
                    {/* Message Bubble */}
                    <div
                      className={`max-w-[92%] rounded-2xl p-3 text-xs leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-br-none shadow-md shadow-violet-900/40'
                          : 'bg-[#12162A] border border-white/[0.08] text-slate-200 rounded-bl-none shadow-lg'
                      }`}
                    >
                      {/* Guide Title if present */}
                      {msg.title && (
                        <div className="flex items-center gap-1.5 font-bold text-cyan-300 text-xs sm:text-sm mb-2 border-b border-white/[0.08] pb-1.5">
                          {msg.optionNumber && (
                            <span className="w-5 h-5 rounded-lg bg-cyan-500/20 text-cyan-300 font-mono font-bold text-xs flex items-center justify-center border border-cyan-500/40 flex-shrink-0">
                              {msg.optionNumber}
                            </span>
                          )}
                          <Sparkles className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                          <span>{msg.title}</span>
                        </div>
                      )}

                      {/* General or Refusal Text */}
                      {msg.text && (
                        <div className="whitespace-pre-line space-y-1 text-[11.5px] leading-relaxed">
                          {msg.text}
                        </div>
                      )}

                      {/* Step-by-Step Guidance List */}
                      {msg.steps && (
                        <div className="space-y-2 mt-1">
                          {msg.steps.map((step, idx) => (
                            <div
                              key={idx}
                              className="p-2 rounded-xl bg-[#161B33]/80 border border-white/[0.04] text-[11px] leading-normal text-slate-200"
                            >
                              <div
                                dangerouslySetInnerHTML={{
                                  __html: step
                                    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
                                    .replace(/\*(.*?)\*/g, '<em class="text-cyan-300 font-normal">$1</em>')
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Pro Tip Card */}
                      {msg.tip && (
                        <div className="mt-2.5 p-2 rounded-xl bg-violet-950/40 border border-violet-800/40 text-[10.5px] text-violet-200 flex items-start gap-1.5">
                          <span className="flex-shrink-0">{msg.tip}</span>
                        </div>
                      )}

                      {/* Direct Deep-Link Action Button */}
                      {msg.actionRoute && (
                        <div className="mt-3 pt-2 border-t border-white/[0.06]">
                          <button
                            type="button"
                            onClick={() => handleActionClick(msg.actionRoute)}
                            className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600/30 to-violet-600/30 hover:from-cyan-500/40 hover:to-violet-500/40 border border-cyan-400/30 text-cyan-200 text-xs font-semibold transition cursor-pointer group"
                          >
                            <span>{msg.actionLabel || 'Go to Page'}</span>
                            <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 transition" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Timestamp */}
                    <span className="text-[9px] text-slate-500 font-mono mt-1 px-1">
                      {msg.timestamp}
                    </span>
                  </div>
                ))}

                {/* Typing Indicator */}
                {isTyping && (
                  <div className="flex items-center gap-1.5 p-3 rounded-2xl bg-[#12162A] border border-white/[0.08] w-24">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.4s]" />
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-3 bg-[#0F1222] border-t border-white/[0.08]">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSend();
                  }}
                  className="relative flex items-center"
                >
                  <input
                    type="text"
                    value={inputQuery}
                    onChange={(e) => setInputQuery(e.target.value)}
                    placeholder={
                      selectedLang === 'hi'
                        ? '1-5 टाइप करें या अपनी भाषा में पूछें...'
                        : `Type 1-5 or ask how to use the system in ${activeLangObj.native}...`
                    }
                    className="w-full bg-[#161B30] border border-white/[0.1] focus:border-cyan-400/60 rounded-2xl pl-3.5 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition shadow-inner"
                  />
                  <button
                    type="submit"
                    disabled={!inputQuery.trim()}
                    className="absolute right-2 w-7 h-7 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:hover:bg-violet-600 text-white flex items-center justify-center transition cursor-pointer shadow-sm"
                    aria-label="Send Query"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>

                {/* Security and Scope Notice */}
                <div className="flex items-center justify-between text-[9px] text-slate-500 font-mono mt-1.5 px-1">
                  <span className="flex items-center gap-1 text-slate-400">
                    <Shield className="w-2.5 h-2.5 text-emerald-400" />
                    Workflow Navigation Only • Strictly No System Code
                  </span>
                  <span>10 Indian Languages</span>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default MultilingualGuideChatbot;
