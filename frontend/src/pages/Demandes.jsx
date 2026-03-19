import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useLanguage } from '../context/LanguageContext';
import {
  ClipboardList, Plus, X, CheckCircle2, XCircle, Clock,
  Loader, FileText, ChevronDown, ChevronUp, PlusCircle, MinusCircle,
  AlertCircle, RefreshCw
} from 'lucide-react';
import api from '../services/api';

// ── Status badge ──────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const meta = {
    PENDING:  { label: 'En attente',  color: 'bg-yellow-100 text-yellow-700', icon: Clock },
    ACCEPTED: { label: 'Acceptée',    color: 'bg-green-100 text-green-700',   icon: CheckCircle2 },
    REJECTED: { label: 'Rejetée',     color: 'bg-red-100 text-red-600',       icon: XCircle },
  }[status] ?? { label: status, color: 'bg-gray-100 text-gray-500', icon: Clock };
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${meta.color}`}>
      <Icon className="w-3.5 h-3.5" /> {meta.label}
    </span>
  );
};

// ── New Request Modal ─────────────────────────────────────────────────────────
const RequestModal = ({ clients, onClose, onSaved, t }) => {
  const [clientId, setClientId]   = useState('');
  const [product, setProduct]     = useState('');
  const [desc, setDesc]           = useState('');
  const [note, setNote]           = useState('');
  const [lines, setLines]         = useState([{ description: '', quantity: 1, unitPrice: 0, tvaRate: 19 }]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);

  // Auto-fill first line description from product
  const handleProductChange = (val) => {
    setProduct(val);
    setLines(l => l.map((ln, i) => i === 0 ? { ...ln, description: val } : ln));
  };

  const addLine    = () => setLines(l => [...l, { description: '', quantity: 1, unitPrice: 0, tvaRate: 19 }]);
  const removeLine = (i) => setLines(l => l.filter((_, idx) => idx !== i));
  const setLine    = (i, field, val) => setLines(l => l.map((ln, idx) => idx === i ? { ...ln, [field]: val } : ln));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!clientId) return setError('Sélectionnez un client.');
    if (!product)  return setError('Entrez le nom du produit / service.');
    if (lines.some(l => !l.description)) return setError('Remplissez la désignation de chaque article.');
    setLoading(true); setError(null);
    try {
      await api.post('/devis', {
        clientId,
        note: [product, desc, note].filter(Boolean).join(' — '),
        lines,
        status: 'PENDING',
      });
      onSaved(); onClose();
    } catch (err) {
      setError(err.response?.data?.message ?? 'Erreur lors de l\'envoi.');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 pt-12 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mb-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 sticky top-0 bg-white rounded-t-2xl z-10">
          <div className="flex items-center gap-2 font-semibold text-gray-800">
            <ClipboardList className="w-5 h-5 text-blue-600" />
            {t('demandes.new')}
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Client */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('form.client')} *</label>
            <select value={clientId} onChange={e => setClientId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="">— Sélectionnez un client —</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}{c.matriculeFiscal ? ` — MF: ${c.matriculeFiscal}` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Product */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('form.product')} *</label>
            <input value={product} onChange={e => handleProductChange(e.target.value)}
              placeholder="Ex : Développement application web, Consulting IT…"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('form.desc')}</label>
            <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={2}
              placeholder="Détails de la prestation, périmètre, livrables…"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none" />
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('form.note')}</label>
            <input value={note} onChange={e => setNote(e.target.value)}
              placeholder="Ex : Paiement 30 jours, délai convenu le 15/03…"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>

          {/* Lines */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">{t('form.lines')} *</label>
              <button type="button" onClick={addLine}
                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium">
                <PlusCircle className="w-4 h-4" /> {t('form.add')}
              </button>
            </div>
            <div className="space-y-2">
              {lines.map((ln, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center bg-gray-50 rounded-lg p-2">
                  <input value={ln.description} onChange={e => setLine(i, 'description', e.target.value)}
                    placeholder="Désignation"
                    className="col-span-5 border border-gray-300 rounded-md px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-blue-400" />
                  <div className="col-span-2 flex flex-col">
                    <span className="text-[10px] text-gray-400 mb-0.5">{t('form.qte')}</span>
                    <input type="number" value={ln.quantity} min="0" onChange={e => setLine(i, 'quantity', parseFloat(e.target.value) || 0)}
                      className="border border-gray-300 rounded-md px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-blue-400" />
                  </div>
                  <div className="col-span-2 flex flex-col">
                    <span className="text-[10px] text-gray-400 mb-0.5">{t('form.pu')}</span>
                    <input type="number" value={ln.unitPrice} min="0" step="0.001" onChange={e => setLine(i, 'unitPrice', parseFloat(e.target.value) || 0)}
                      className="border border-gray-300 rounded-md px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-blue-400" />
                  </div>
                  <div className="col-span-2 flex flex-col">
                    <span className="text-[10px] text-gray-400 mb-0.5">{t('form.tva')}</span>
                    <input type="number" value={ln.tvaRate} min="0" max="100" onChange={e => setLine(i, 'tvaRate', parseFloat(e.target.value) || 0)}
                      className="border border-gray-300 rounded-md px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-blue-400" />
                  </div>
                  <div className="col-span-1 flex items-end justify-center pb-0.5">
                    {lines.length > 1 && (
                      <button type="button" onClick={() => removeLine(i)} className="text-red-400 hover:text-red-600">
                        <MinusCircle className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors">
              {t('form.cancel')}
            </button>
            <button type="submit" disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50">
              {loading ? <Loader className="w-4 h-4 animate-spin" /> : <ClipboardList className="w-4 h-4" />}
              {t('form.send')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────
const Demandes = () => {
  const { t }                         = useLanguage();
  const navigate                      = useNavigate();
  const [devis, setDevis]             = useState([]);
  const [clients, setClients]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [showModal, setShowModal]     = useState(false);
  const [expanded, setExpanded]       = useState({});
  const [converting, setConverting]   = useState({});
  const [recording, setRecording]     = useState({});   // per-row show "record response" panel
  const [saving, setSaving]           = useState({});

  const fetchData = async () => {
    setLoading(true);
    try {
      const [devisRes, clientsRes] = await Promise.all([api.get('/devis'), api.get('/clients')]);
      setDevis(devisRes.data);
      setClients(clientsRes.data);
    } catch (err) {
      console.error('Demandes fetch error', err);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  // Record client response (prestataire enters what the client told them)
  const handleRecordResponse = async (id, status) => {
    setSaving(p => ({ ...p, [id]: true }));
    try {
      await api.patch(`/devis/${id}/status`, { status });
      setRecording(p => ({ ...p, [id]: false }));
      await fetchData();
    } catch (err) {
      alert(err.response?.data?.message ?? 'Erreur mise à jour.');
    } finally { setSaving(p => ({ ...p, [id]: false })); }
  };

  const handleConvert = async (id) => {
    setConverting(p => ({ ...p, [id]: true }));
    try {
      const res = await api.post(`/devis/${id}/convert`);
      await fetchData();
      // Redirect to the new invoice
      navigate(`/invoices`);
    } catch (err) {
      alert(err.response?.data?.message ?? 'Erreur conversion.');
    } finally { setConverting(p => ({ ...p, [id]: false })); }
  };

  const stats = {
    total:    devis.length,
    pending:  devis.filter(d => d.status === 'PENDING').length,
    accepted: devis.filter(d => d.status === 'ACCEPTED').length,
    rejected: devis.filter(d => d.status === 'REJECTED').length,
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-5 pb-10">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <ClipboardList className="w-6 h-6 text-blue-600" />
              {t('demandes.title')}
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">{t('demandes.subtitle')}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={fetchData}
              className="p-2 text-gray-400 hover:text-gray-600 bg-white border border-gray-200 rounded-lg transition-colors">
              <RefreshCw className="w-4 h-4" />
            </button>
            <button onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm">
              <Plus className="w-4 h-4" /> {t('demandes.new')}
            </button>
          </div>
        </div>

        {/* Role info banner */}
        <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-5 py-3 text-sm text-blue-800">
          <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0" />
          <span>
            Vous êtes le <strong>prestataire</strong>. Envoyez une demande au client — il accepte ou refuse. Enregistrez sa réponse via le bouton <em>"Enregistrer la réponse"</em>.
          </span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: t('demandes.total'),    value: stats.total,    color: 'text-blue-700',   bg: 'bg-blue-50'   },
            { label: t('demandes.pending'),  value: stats.pending,  color: 'text-yellow-700', bg: 'bg-yellow-50' },
            { label: t('demandes.accepted'), value: stats.accepted, color: 'text-green-700',  bg: 'bg-green-50'  },
            { label: t('demandes.rejected'), value: stats.rejected, color: 'text-red-700',    bg: 'bg-red-50'    },
          ].map(s => (
            <div key={s.label} className={`${s.bg} rounded-xl p-5 border border-white shadow-sm`}>
              <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-1.5 font-medium">{s.label}</p>
            </div>
          ))}
        </div>

        {/* List */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-800">
              {t('demandes.all')}
              <span className="ml-2 text-sm font-normal text-gray-400">({devis.length})</span>
            </h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader className="w-6 h-6 animate-spin text-blue-500" />
            </div>
          ) : devis.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm font-medium">{t('demandes.none')}</p>
              <p className="text-xs mt-1">{t('demandes.none.sub')}</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {devis.map(d => {
                const open = expanded[d.id];
                const hasInvoice = !!d.invoice;
                const showRecord = recording[d.id];

                return (
                  <div key={d.id}>
                    {/* Row */}
                    <div className="flex items-center px-6 py-4 gap-3 hover:bg-gray-50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {d.client?.name ?? '—'}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5 truncate">
                          {new Date(d.createdAt).toLocaleDateString('fr-TN')}
                          {d.note && <span className="ml-2 italic">{d.note.split(' — ')[0]}</span>}
                        </p>
                      </div>

                      <StatusBadge status={d.status} />

                      <div className="hidden md:block text-right">
                        <p className="text-sm font-bold text-gray-800">{d.netToPay?.toFixed(3)}</p>
                        <p className="text-xs text-gray-400">TND TTC</p>
                      </div>

                      {/* Action buttons — role-aware */}
                      <div className="flex items-center gap-2 flex-shrink-0">

                        {/* PENDING: prestataire waits — shows "Record response" toggle */}
                        {d.status === 'PENDING' && (
                          <button
                            onClick={() => setRecording(p => ({ ...p, [d.id]: !p[d.id] }))}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                              showRecord
                                ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            <ClipboardList className="w-3.5 h-3.5" />
                            {t('demandes.record')}
                          </button>
                        )}

                        {/* ACCEPTED: create invoice */}
                        {d.status === 'ACCEPTED' && !hasInvoice && (
                          <button
                            onClick={() => handleConvert(d.id)}
                            disabled={!!converting[d.id]}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50">
                            {converting[d.id] ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
                            {t('demandes.createInvoice')}
                          </button>
                        )}
                        {d.status === 'ACCEPTED' && hasInvoice && (
                          <span className="inline-flex items-center gap-1 text-xs text-green-700 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" /> {t('demandes.invoiceCreated')}
                          </span>
                        )}

                        {/* REJECTED state */}
                        {d.status === 'REJECTED' && (
                          <span className="inline-flex items-center gap-1 text-xs text-red-500 font-medium">
                            <XCircle className="w-3.5 h-3.5" /> {t('demandes.rejected.label')}
                          </span>
                        )}

                        <button onClick={() => setExpanded(p => ({ ...p, [d.id]: !p[d.id] }))}
                          className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg transition-colors">
                          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Record client response panel */}
                    {showRecord && d.status === 'PENDING' && (
                      <div className="px-6 py-3 bg-indigo-50 border-t border-indigo-100 flex items-center gap-3">
                        <p className="text-xs text-indigo-700 font-medium flex-1">
                          📋 Le client vous a répondu ? Enregistrez sa décision :
                        </p>
                        <button
                          onClick={() => handleRecordResponse(d.id, 'ACCEPTED')}
                          disabled={!!saving[d.id]}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50">
                          {saving[d.id] ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                          {t('demandes.recordAccept')}
                        </button>
                        <button
                          onClick={() => handleRecordResponse(d.id, 'REJECTED')}
                          disabled={!!saving[d.id]}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-red-100 text-red-700 hover:bg-red-200 rounded-lg transition-colors disabled:opacity-50">
                          <XCircle className="w-3.5 h-3.5" />
                          {t('demandes.recordReject')}
                        </button>
                      </div>
                    )}

                    {/* Expandable detail */}
                    {open && (
                      <div className="px-6 pb-4 pt-2 bg-gray-50 border-t border-gray-100">
                        {d.note && (
                          <p className="text-xs text-gray-500 mb-3 italic">
                            <span className="font-medium text-gray-700">Note :</span> {d.note}
                          </p>
                        )}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                          <div><p className="text-xs text-gray-400 mb-1">Total HT</p><p className="font-semibold">{d.totalHT?.toFixed(3)} TND</p></div>
                          <div><p className="text-xs text-gray-400 mb-1">Total TVA</p><p className="font-semibold">{d.totalTVA?.toFixed(3)} TND</p></div>
                          <div><p className="text-xs text-gray-400 mb-1">Net à payer</p><p className="font-bold text-blue-700">{d.netToPay?.toFixed(3)} TND</p></div>
                          <div><p className="text-xs text-gray-400 mb-1">Lignes</p><p className="text-gray-700">{d.lines?.length ?? '—'} article(s)</p></div>
                        </div>
                        {d.lines?.length > 0 && (
                          <div className="overflow-x-auto rounded-lg border border-gray-200">
                            <table className="w-full text-xs border-collapse">
                              <thead>
                                <tr className="bg-gray-100 text-gray-500">
                                  <th className="px-3 py-2 text-left font-medium">Désignation</th>
                                  <th className="px-3 py-2 text-right font-medium">Qté</th>
                                  <th className="px-3 py-2 text-right font-medium">P.U. HT</th>
                                  <th className="px-3 py-2 text-right font-medium">TVA</th>
                                  <th className="px-3 py-2 text-right font-medium">Total HT</th>
                                </tr>
                              </thead>
                              <tbody>
                                {d.lines.map(l => (
                                  <tr key={l.id} className="border-t border-gray-200 hover:bg-gray-50">
                                    <td className="px-3 py-2 text-gray-800">{l.description}</td>
                                    <td className="px-3 py-2 text-right">{l.quantity}</td>
                                    <td className="px-3 py-2 text-right">{l.unitPrice?.toFixed(3)}</td>
                                    <td className="px-3 py-2 text-right">{l.tvaRate}%</td>
                                    <td className="px-3 py-2 text-right font-semibold">{l.totalHT?.toFixed(3)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {showModal && <RequestModal clients={clients} onClose={() => setShowModal(false)} onSaved={fetchData} t={t} />}
    </Layout>
  );
};

export default Demandes;
