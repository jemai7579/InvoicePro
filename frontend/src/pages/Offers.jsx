import React, { useEffect, useState } from 'react';
import { ClipboardCheck, Loader, Plus, Send, FileText } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import api from '../services/api';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';

const emptyForm = {
  title: '',
  clientId: '',
  description: '',
  estimatedAmount: '',
  deliveryDelay: '',
  validUntil: '',
  terms: '',
  purchaseOrderReference: '',
};

const statusVariant = (status) => {
  if (['ACCEPTED', 'CONVERTED_TO_DEVIS', 'CONVERTED_TO_INVOICE'].includes(status)) return 'success';
  if (['REJECTED', 'EXPIRED'].includes(status)) return 'rejected';
  if (['SENT', 'MODIFICATION_REQUESTED'].includes(status)) return 'primary';
  return 'warning';
};

const Offers = () => {
  const location = useLocation();
  const prefilledProject = location.state?.project;
  const [offers, setOffers] = useState([]);
  const [clients, setClients] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [offersRes, clientsRes] = await Promise.all([api.get('/offers'), api.get('/clients')]);
      setOffers(offersRes.data || []);
      setClients(clientsRes.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!prefilledProject) return;
    setEditingId(null);
    setForm({
      title: prefilledProject.title || '',
      clientId: prefilledProject.clientId || '',
      description: prefilledProject.description || prefilledProject.estimatedNeeds || '',
      estimatedAmount: prefilledProject.optionalBudget || '',
      deliveryDelay: prefilledProject.deadline ? `Échéance: ${new Date(prefilledProject.deadline).toLocaleDateString()}` : '',
      validUntil: prefilledProject.deadline ? String(prefilledProject.deadline).slice(0, 10) : '',
      terms: prefilledProject.projectReference ? `Projet: ${prefilledProject.projectReference}` : '',
      purchaseOrderReference: prefilledProject.projectReference || '',
    });
  }, [prefilledProject]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setNotice(null);
    const payload = {
      ...form,
      clientId: form.clientId || null,
      estimatedAmount: Number(form.estimatedAmount || 0),
    };
    try {
      if (editingId) {
        await api.put(`/offers/${editingId}`, payload);
        setNotice({ type: 'success', text: 'Offre mise à jour avec succès.' });
      } else {
        await api.post('/offers', payload);
        setNotice({ type: 'success', text: 'Offre créée avec succès.' });
      }
      resetForm();
      await fetchData();
    } catch (error) {
      setNotice({ type: 'error', text: error.response?.data?.message || 'Impossible d’enregistrer l’offre.' });
    } finally {
      setSubmitting(false);
    }
  };

  const edit = (offer) => {
    setEditingId(offer.id);
    setForm({
      title: offer.title || '',
      clientId: offer.clientId || '',
      description: offer.description || '',
      estimatedAmount: offer.estimatedAmount || '',
      deliveryDelay: offer.deliveryDelay || '',
      validUntil: offer.validUntil ? offer.validUntil.slice(0, 10) : '',
      terms: offer.terms || '',
      purchaseOrderReference: offer.purchaseOrderReference || '',
    });
  };

  const action = async (offer, type) => {
    setBusyId(offer.id);
    try {
      if (type === 'send') await api.post(`/offers/${offer.id}/send`);
      if (type === 'devis') await api.post(`/offers/${offer.id}/convert-to-devis`);
      await fetchData();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 font-display">Mes offres & bons de commande</h1>
          <p className="text-sm text-slate-500 font-medium">Proposition commerciale avant devis ou facture fiscale.</p>
        </div>
      </div>

      <Card>
        <div className="space-y-3">
          <p className="text-sm font-bold text-slate-700 leading-6">
            Une offre ou un bon de commande intervient avant la facture. Il sert à proposer un service, un prix, des conditions et un délai au client. Après acceptation, vous pouvez transformer l’offre en devis ou en facture.
          </p>
          <p className="text-sm font-bold text-slate-500 leading-6">
            À l’inverse, un règlement intervient après la facture pour suivre si le client a payé, combien il a payé, et combien reste à payer.
          </p>
          <div className="text-xs font-black text-slate-400 uppercase tracking-widest">Offre → Devis → Facture → Règlement</div>
        </div>
      </Card>

      {notice ? (
        <div className={`rounded-2xl px-5 py-4 text-sm font-bold ${notice.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'}`}>
          {notice.text}
        </div>
      ) : null}

      <Card title={editingId ? 'Modifier une offre' : 'Nouvelle offre'} icon={Plus}>
        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold" placeholder="Titre de l'offre" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required />
          <select className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold" value={form.clientId} onChange={(event) => setForm({ ...form, clientId: event.target.value })}>
            <option value="">Client optionnel</option>
            {clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
          </select>
          <input className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold" type="number" step="0.001" placeholder="Montant estime HT" value={form.estimatedAmount} onChange={(event) => setForm({ ...form, estimatedAmount: event.target.value })} />
          <input className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold" placeholder="Delai de livraison" value={form.deliveryDelay} onChange={(event) => setForm({ ...form, deliveryDelay: event.target.value })} />
          <input className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold" type="date" value={form.validUntil} onChange={(event) => setForm({ ...form, validUntil: event.target.value })} />
          <input className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold" placeholder="Reference bon de commande" value={form.purchaseOrderReference} onChange={(event) => setForm({ ...form, purchaseOrderReference: event.target.value })} />
          <textarea className="md:col-span-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold" placeholder="Description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          <textarea className="md:col-span-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold" placeholder="Conditions commerciales" value={form.terms} onChange={(event) => setForm({ ...form, terms: event.target.value })} />
          <div className="md:col-span-2 flex gap-3">
            <Button type="submit" loading={submitting} disabled={submitting}>{editingId ? 'Enregistrer' : 'Créer l\'offre'}</Button>
            {editingId ? <Button type="button" variant="secondary" onClick={resetForm}>Annuler</Button> : null}
          </div>
        </form>
      </Card>

      <Card title="Offres" icon={ClipboardCheck} noPadding>
        {loading ? (
          <div className="py-16 flex justify-center"><Loader className="w-6 h-6 animate-spin text-indigo-600" /></div>
        ) : offers.length === 0 ? (
          <div className="py-16 text-center text-sm text-slate-400 font-semibold">Aucune offre pour le moment.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {offers.map((offer) => (
              <div key={offer.id} className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="text-xs font-black text-slate-400">{offer.number || offer.id.slice(0, 8).toUpperCase()}</span>
                    <Badge variant={statusVariant(offer.status)}>{offer.status}</Badge>
                  </div>
                  <h3 className="text-sm font-black text-slate-900">{offer.title}</h3>
                  <p className="text-xs text-slate-500 mt-1">{offer.client?.name || 'Sans client'} · {Number(offer.estimatedAmount || 0).toFixed(3)} TND</p>
                  {offer.comments?.length ? <p className="text-xs text-indigo-600 font-semibold mt-2">{offer.comments[0].message}</p> : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="secondary" onClick={() => edit(offer)}>Modifier</Button>
                  <Button size="sm" icon={Send} loading={busyId === offer.id} onClick={() => action(offer, 'send')}>Envoyer</Button>
                  <Button size="sm" variant="secondary" icon={FileText} loading={busyId === offer.id} onClick={() => action(offer, 'devis')}>Convertir en devis</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default Offers;
