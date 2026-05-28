import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User, Loader } from 'lucide-react';
import api from '../services/api';

const AIAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { role: 'assistant', text: "Bonjour ! Je suis votre assistant virtuel InvoicePro. Comment puis-je vous aider aujourd'hui ?" }
  ]);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  useEffect(() => {
    const handleOpenAI = () => setIsOpen(true);
    window.addEventListener('open-ai-assistant', handleOpenAI);
    return () => window.removeEventListener('open-ai-assistant', handleOpenAI);
  }, []);

  const toggleChat = () => setIsOpen(!isOpen);

  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    // Add user message
    const newMessage = { role: 'user', text: input };
    const historyPayload = [...messages]; // History before current message
    
    setMessages(prev => [...prev, newMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Send message to our new backend route
      const { data } = await api.post('/ai/chat', { 
         message: newMessage.text,
         contextHistory: historyPayload
      });
      
      setMessages(prev => [...prev, { role: 'assistant', text: data.reply }]);
    } catch (error) {
      const quotaExceeded = error.response?.data?.code === 'AI_MONTHLY_QUOTA_EXCEEDED';
      if (!quotaExceeded) {
        console.error('AI Error:', error);
      }
      const errorMessage = quotaExceeded
        ? "Votre limite mensuelle d'utilisation de l'assistant IA a été atteinte."
        : error.response?.data?.message || "Je suis désolé, j'éprouve actuellement des difficultés à me connecter à mes serveurs.";
      setMessages(prev => [...prev, { role: 'assistant', text: errorMessage }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={toggleChat}
        className={`fixed bottom-[max(1rem,env(safe-area-inset-bottom))] end-4 sm:bottom-6 sm:end-6 p-3.5 sm:p-4 rounded-2xl shadow-2xl transition-all duration-500 z-50 flex items-center justify-center group ${
          isOpen ? 'scale-90 opacity-0 pointer-events-none rotate-90' : 'bg-slate-900 text-white hover:bg-indigo-600 scale-100 opacity-100 hover:shadow-indigo-200'
        }`}
      >
        <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 group-hover:scale-110 transition-transform" />
      </button>

      {/* Chat Window — full-width on mobile, fixed width on sm+ */}
      <div
        className={`fixed inset-x-2 bottom-[max(0.5rem,env(safe-area-inset-bottom))] w-auto sm:inset-x-auto sm:bottom-6 sm:end-6 sm:w-[380px] max-w-[420px] bg-white/95 backdrop-blur-xl rounded-2xl sm:rounded-[2.5rem] shadow-[0_30px_100px_-20px_rgba(0,0,0,0.15)] border border-white/50 flex flex-col overflow-hidden transition-all duration-500 transform origin-bottom-right z-50 ${
          isOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-75 opacity-0 translate-y-20 pointer-events-none'
        }`}
        style={{ height: 'min(520px, calc(100dvh - 1rem))', maxHeight: 'calc(100dvh - 1rem)' }}
      >
        {/* Header */}
        <div className="bg-slate-900 px-4 py-4 sm:px-6 sm:py-5 flex justify-between items-center gap-3 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-indigo-500/20 to-transparent"></div>
          <div className="flex items-center space-x-3 relative z-10">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-black text-sm font-display tracking-tight text-white/90">Assistant InvoicePro</h3>
              <p className="text-[10px] text-emerald-400 font-black uppercase tracking-widest flex items-center mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 me-2 animate-pulse"></span>
                AI Connecté
              </p>
            </div>
          </div>
          <button onClick={toggleChat} className="p-2 hover:bg-white/10 rounded-xl transition-all group relative z-10">
            <X className="w-5 h-5 group-hover:rotate-90 transition-transform" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4 bg-slate-50/30 scroll-smooth custom-scrollbar sm:p-6 sm:space-y-6">
          {messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
              <div className={`flex max-w-[95%] sm:max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} items-end gap-2 sm:gap-3`}>
                
                <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center border ${
                  msg.role === 'user' ? 'bg-white border-slate-100' : 'bg-indigo-50 border-indigo-100'
                }`}>
                  {msg.role === 'user' ? (
                    <User className="w-4 h-4 text-slate-400" />
                  ) : (
                    <Bot className="w-4 h-4 text-indigo-600" />
                  )}
                </div>

                <div className={`min-w-0 break-words p-3 sm:p-4 rounded-[1.5rem] text-sm font-medium leading-relaxed shadow-sm ring-1 ${
                  msg.role === 'user' 
                    ? 'bg-slate-900 text-white rounded-br-none ring-slate-800' 
                    : 'bg-white text-slate-700 rounded-bl-none ring-slate-100'
                }`}>
                  {msg.text}
                </div>

              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start animate-in fade-in duration-300">
               <div className="flex max-w-[80%] flex-row items-end gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center bg-indigo-50 border border-indigo-100">
                     <Bot className="w-4 h-4 text-indigo-600 animate-pulse" />
                  </div>
                  <div className="p-4 bg-white ring-1 ring-slate-100 text-slate-400 rounded-[1.5rem] rounded-bl-none flex items-center space-x-3 shadow-sm">
                     <div className="flex gap-1.5">
                        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></div>
                     </div>
                  </div>
               </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <div className="border-t border-slate-50 bg-white p-3 sm:p-5">
          <form onSubmit={handleSubmit} className="relative flex items-center group">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Comment puis-je vous aider ?"
              className="w-full pl-5 pr-14 py-4 bg-slate-50 border border-slate-100 rounded-[1.5rem] text-sm font-medium focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 focus:bg-white transition-all placeholder:text-slate-400"
            />
            <button 
              type="submit" 
              disabled={!input.trim()}
              className="absolute right-2 p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-slate-900 disabled:bg-slate-100 disabled:text-slate-300 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-100"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <div className="text-center mt-3 flex items-center justify-center gap-2">
            <div className="h-px w-8 bg-slate-100"></div>
            <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">InvoicePro Intelligence</span>
            <div className="h-px w-8 bg-slate-100"></div>
          </div>
          <p className="mt-2 hidden text-center text-[10px] font-bold text-slate-400 leading-4 min-[375px]:block">
            L’assistant IA peut aider à comprendre l’étape E-Houwiya / Mobile ID, mais la création, la validité et l’usage officiel de cet identifiant doivent être vérifiés auprès des organismes concernés.
          </p>
        </div>
      </div>
    </>
  );
};

export default AIAssistant;
