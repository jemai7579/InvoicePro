import React, { useCallback, useEffect, useState } from 'react';
import { Loader, MessageSquare, Send } from 'lucide-react';
import api from '../services/api';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

const Messages = () => {
  const [partners, setPartners] = useState([]);
  const [activePartner, setActivePartner] = useState(null);
  const [messages, setMessages] = useState([]);
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((text) => {
    setToast(text);
    setTimeout(() => setToast(null), 3500);
  }, []);

  const fetchPartners = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/messages/conversations');
      setPartners(res.data || []);
      if (res.data?.length) {
        setActivePartner((current) => current || res.data[0]);
      }
    } catch (error) {
      showToast(error.response?.data?.message || 'Impossible de charger les conversations.');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const fetchMessages = useCallback(async (partner) => {
    if (!partner) return;
    try {
      const res = await api.get(`/messages/${partner.partnerCompanyId}`);
      setMessages(res.data || []);
    } catch (error) {
      showToast(error.response?.data?.message || 'Impossible de charger les messages.');
    }
  }, [showToast]);

  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]);

  useEffect(() => {
    fetchMessages(activePartner);
  }, [activePartner, fetchMessages]);

  const sendMessage = async (event) => {
    event.preventDefault();
    if (!activePartner || !body.trim()) return;
    try {
      await api.post('/messages', { partnerCompanyId: activePartner.partnerCompanyId, body });
      setBody('');
      fetchMessages(activePartner);
    } catch (error) {
      showToast(error.response?.data?.message || 'Message impossible.');
    }
  };

  return (
    <div className="pb-20 animate-in fade-in duration-500 space-y-6">
      {toast && <div className="fixed top-20 right-6 z-[100] px-5 py-4 rounded-2xl shadow-2xl border bg-rose-50 border-rose-200 text-rose-800 text-sm font-semibold">{toast}</div>}

      <div>
        <h2 className="text-2xl font-black text-slate-900 font-display tracking-tight uppercase">Messages</h2>
        <p className="text-sm text-slate-500 font-medium">Chat entre partenaires connectés uniquement.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 min-h-[620px]">
        <Card title="Partenaires">
          {loading ? (
            <div className="py-10 text-center"><Loader className="w-8 h-8 animate-spin text-indigo-600 inline" /></div>
          ) : partners.length === 0 ? (
            <div className="text-sm text-slate-500">Aucun partenaire accepté. Invitez un partenaire depuis le Réseau professionnel.</div>
          ) : (
            <div className="space-y-2">
              {partners.map((partner) => (
                <button
                  key={partner.id}
                  type="button"
                  onClick={() => setActivePartner(partner)}
                  className={`w-full rounded-2xl p-4 text-left transition-colors ${activePartner?.id === partner.id ? 'bg-premium-600 text-white' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'}`}
                >
                  <div className="font-black">{partner.name}</div>
                  <div className={`text-xs ${activePartner?.id === partner.id ? 'text-white/80' : 'text-slate-500'}`}>{partner.email}</div>
                </button>
              ))}
            </div>
          )}
        </Card>

        <Card title={activePartner ? activePartner.name : 'Conversation'} subtitle="Les messages sont disponibles après acceptation de l’invitation interne.">
          {!activePartner ? (
            <div className="h-[480px] flex flex-col items-center justify-center text-slate-400">
              <MessageSquare className="w-10 h-10 mb-3" />
              <div className="text-sm">Sélectionnez un partenaire connecté.</div>
            </div>
          ) : (
            <div className="flex flex-col h-[520px]">
              <div className="flex-1 overflow-y-auto rounded-2xl bg-slate-50 p-4 space-y-3">
                {messages.length === 0 ? (
                  <div className="text-sm text-slate-500">Aucun message pour cette conversation.</div>
                ) : messages.map((message) => {
                  const own = message.senderCompanyId !== activePartner.partnerCompanyId;
                  return (
                    <div key={message.id} className={`flex ${own ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm ${own ? 'bg-premium-600 text-white' : 'bg-white text-slate-700 border border-slate-100'}`}>
                        {message.body}
                      </div>
                    </div>
                  );
                })}
              </div>
              <form onSubmit={sendMessage} className="mt-4 flex gap-3">
                <input
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                  placeholder="Écrire un message..."
                  className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-premium-500 focus:bg-white"
                />
                <Button type="submit" icon={Send}>Envoyer</Button>
              </form>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Messages;
