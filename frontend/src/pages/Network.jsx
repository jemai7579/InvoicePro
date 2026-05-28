import React, { useCallback, useEffect, useState } from 'react';
import { Check, Loader, Mail, Send, Users, X } from 'lucide-react';
import api from '../services/api';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';

const badgeFor = (status) => {
  if (status === 'ACCEPTED') return { variant: 'success', label: 'Acceptée' };
  if (status === 'REFUSED' || status === 'REJECTED') return { variant: 'rejected', label: 'Refusée' };
  return { variant: 'pending', label: 'En attente' };
};

const Network = () => {
  const [network, setNetwork] = useState({ partners: [], sent: [], received: [] });
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [toast, setToast] = useState(null);
  const [sending, setSending] = useState(false);

  const showToast = useCallback((type, text) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const fetchNetwork = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/network');
      setNetwork(res.data);
    } catch (error) {
      showToast('error', error.response?.data?.message || 'Impossible de charger le réseau.');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchNetwork();
  }, [fetchNetwork]);

  const invite = async (event) => {
    event.preventDefault();
    setSending(true);
    try {
      await api.post('/network/invitations', { email, message });
      setEmail('');
      setMessage('');
      showToast('success', 'Invitation interne envoyée.');
      fetchNetwork();
    } catch (error) {
      showToast('error', error.response?.data?.message || 'Invitation impossible.');
    } finally {
      setSending(false);
    }
  };

  const respond = async (id, action) => {
    try {
      await api.post(`/network/invitations/${id}/respond`, { action });
      fetchNetwork();
    } catch (error) {
      showToast('error', error.response?.data?.message || 'Réponse impossible.');
    }
  };

  return (
    <div className="pb-20 animate-in fade-in duration-500 space-y-6">
      {toast && (
        <div className={`fixed left-3 right-3 top-16 z-[100] rounded-2xl border px-4 py-3 text-sm font-semibold shadow-2xl sm:left-auto sm:right-6 sm:top-20 sm:max-w-sm sm:px-5 sm:py-4 ${
          toast.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          {toast.text}
        </div>
      )}

      <div>
        <h2 className="text-2xl font-black text-slate-900 font-display tracking-tight uppercase">Réseau professionnel</h2>
        <p className="text-sm text-slate-500 font-medium max-w-4xl">
          Un partenaire réseau est une société ou un utilisateur inscrit sur la plateforme. Vous l’invitez par email via une invitation interne.
          Après acceptation, vous pouvez discuter avec lui, partager des idées de projet, des offres ou des devis.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6">
        <div className="space-y-6">
          <Card title="Partenaires connectés" subtitle="Seules les connexions acceptées peuvent échanger des messages ou recevoir des éléments partagés.">
            {loading ? (
              <div className="py-10 text-center"><Loader className="w-8 h-8 animate-spin text-indigo-600 inline" /></div>
            ) : network.partners.length === 0 ? (
              <div className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">Aucun partenaire connecté pour le moment.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {network.partners.map((partner) => (
                  <div key={partner.id} className="rounded-2xl border border-slate-100 p-5 bg-white">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="font-black text-slate-900">{partner.name}</div>
                        <div className="text-sm text-slate-500">{partner.email}</div>
                      </div>
                      <Badge variant="success">Connecté</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card title="Invitations envoyées">
              <div className="space-y-3">
                {network.sent.length === 0 ? <div className="text-sm text-slate-500">Aucune invitation envoyée.</div> : network.sent.map((invite) => {
                  const badge = badgeFor(invite.status);
                  return (
                    <div key={invite.id} className="rounded-2xl bg-slate-50 p-4 flex items-start justify-between gap-3">
                      <div>
                        <div className="font-bold text-slate-900">{invite.recipientCompany?.name || invite.recipientEmail}</div>
                        <div className="text-xs text-slate-500">{invite.recipientEmail}</div>
                      </div>
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card title="Invitations reçues">
              <div className="space-y-3">
                {network.received.length === 0 ? <div className="text-sm text-slate-500">Aucune invitation reçue.</div> : network.received.map((invite) => {
                  const badge = badgeFor(invite.status);
                  return (
                    <div key={invite.id} className="rounded-2xl bg-slate-50 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-bold text-slate-900">{invite.senderCompany?.name || invite.recipientEmail}</div>
                          <div className="text-xs text-slate-500">{invite.senderCompany?.email}</div>
                        </div>
                        <Badge variant={badge.variant}>{badge.label}</Badge>
                      </div>
                      {invite.status === 'PENDING' && (
                        <div className="flex gap-2 mt-4">
                          <Button variant="secondary" size="sm" icon={X} onClick={() => respond(invite.id, 'REFUSE')}>Refuser</Button>
                          <Button size="sm" icon={Check} onClick={() => respond(invite.id, 'ACCEPT')}>Accepter</Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        </div>

        <Card title="Ajouter un partenaire par email" subtitle="Cette invitation est interne à la plateforme. Elle ne crée pas de fiche client.">
          <form onSubmit={invite} className="space-y-5">
            <Input type="email" label="Email du partenaire" value={email} onChange={(event) => setEmail(event.target.value)} icon={Mail} required />
            <textarea
              rows="4"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Message d’invitation"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-premium-500 focus:bg-white"
            />
            <Button type="submit" loading={sending} icon={Send} className="w-full">Inviter un partenaire</Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Network;
