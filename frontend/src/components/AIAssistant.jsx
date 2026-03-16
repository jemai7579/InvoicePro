import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User, Loader } from 'lucide-react';
import api from '../services/api';

const AIAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { role: 'assistant', text: "Bonjour ! Je suis votre assistant virtuel El Fatoora. Comment puis-je vous aider aujourd'hui ?" }
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
      console.error('AI Error:', error);
      const errorMessage = error.response?.data?.message || "Je suis désolé, j'éprouve actuellement des difficultés à me connecter à mes serveurs.";
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
        className={`fixed bottom-6 right-6 p-4 rounded-full shadow-2xl transition-all duration-300 z-50 flex items-center justify-center ${
          isOpen ? 'bg-indigo-700 text-white scale-90 opacity-0 pointer-events-none' : 'bg-blue-600 text-white hover:bg-blue-700 scale-100 opacity-100 hover:shadow-blue-500/50'
        }`}
        style={{ boxShadow: '0 10px 25px -5px rgba(37, 99, 235, 0.4)' }}
      >
        <MessageSquare className="w-6 h-6" />
      </button>

      {/* Chat Window */}
      <div
        className={`fixed bottom-6 right-6 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden transition-all duration-300 transform origin-bottom-right z-50 ${
          isOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-75 opacity-0 translate-y-10 pointer-events-none'
        }`}
        style={{ height: '500px', maxHeight: '80vh' }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 flex justify-between items-center text-white">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Assistant Virtuel</h3>
              <p className="text-xs text-blue-100 flex items-center">
                <span className="w-2 h-2 rounded-full bg-green-400 mr-1 animate-pulse"></span>
                En ligne
              </p>
            </div>
          </div>
          <button onClick={toggleChat} className="p-1 hover:bg-white/20 rounded-md transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 bg-opacity-50">
          {messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  msg.role === 'user' ? 'bg-gray-200 ml-2' : 'bg-blue-100 mr-2'
                }`}>
                  {msg.role === 'user' ? (
                    <User className="w-4 h-4 text-gray-600" />
                  ) : (
                    <Bot className="w-4 h-4 text-blue-600" />
                  )}
                </div>

                <div className={`p-3 rounded-2xl text-sm ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-tr-none shadow-sm' 
                    : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none shadow-sm'
                }`}>
                  {msg.text}
                </div>

              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
               <div className="flex max-w-[80%] flex-row shadow-sm">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-blue-100 mr-2">
                     <Bot className="w-4 h-4 text-blue-600 animate-pulse" />
                  </div>
                  <div className="p-3 bg-white border border-gray-200 text-gray-800 rounded-2xl rounded-tl-none flex items-center space-x-2">
                     <Loader className="w-4 h-4 animate-spin text-blue-500" />
                     <span className="text-xs text-gray-400">Réflexion en cours...</span>
                  </div>
               </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <div className="p-3 bg-white border-t border-gray-100">
          <form onSubmit={handleSubmit} className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Posez-moi une question..."
              className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            <button 
              type="submit" 
              disabled={!input.trim()}
              className="absolute right-1 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <div className="text-center mt-2">
            <span className="text-[10px] text-gray-400">Propulsé par El Fatoora AI</span>
          </div>
        </div>
      </div>
    </>
  );
};

export default AIAssistant;
