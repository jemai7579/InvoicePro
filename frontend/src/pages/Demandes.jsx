import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import {
  ClipboardList, Plus, X, CheckCircle2, XCircle, Clock,
  Loader, FileText, ChevronDown, ChevronUp, PlusCircle, MinusCircle,
  AlertCircle, Zap, ExternalLink, Lightbulb
} from 'lucide-react';
import api from '../services/api';

// ── Status badge ──────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const statusConfig = {
    PENDING: {
      label: 'En attente',
      color: 'bg-amber-50 text-amber-700 border-amber-100',
      icon: <Clock className="w-3 h-3" />
    },
    ACCEPTED: {
      label: 'Acceptée',
      color: 'bg-emerald-50 text-emerald-700 border-emerald-100',
      icon: <CheckCircle2 className="w-3 h-3" />
    },
    REJECTED: {
      label: 'Refusée',
      color: 'bg-rose-50 text-rose-700 border-rose-100',
      icon: <XCircle className="w-3 h-3" />
    }
  };
  const meta = statusConfig[status] ?? { label: status, color: 'bg-gray-100 text-gray-500', icon: <Clock className="w-3 h-3" /> };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${meta.color}`}>
      {meta.icon} {meta.label.toUpperCase()}
    </span>
  );
};

// ── New Request Modal ─────────────────────────────────────────────────────────
const RequestModal = ({ clients, onClose, onSaved }) => {
  const [clientId, setClientId]   = useState('');
  const [product, setProduct]     = useState('');
  const [desc, setDesc]           = useState('');
  const [lines, setLines]         = useState([{ description: '', quantity: 1, unitPrice: 0, tvaRate: 19 }]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);

  const addLine    = () => setLines(l => [...l, { description: '', quantity: 1, unitPrice: 0, tvaRate: 19 }]);
  const removeLine = (i) => setLines(l => l.filter((_, idx) => idx !== i));
  const setLine    = (i, field, val) => setLines(l => l.map((ln, idx) => idx === i ? { ...ln, [field]: val } : ln));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!clientId) return setError('Veuillez sélectionner un client.');
    if (!product)  return setError('Veuillez entrer l\'intitulé de la prestation.');
    setLoading(true);
    try {
      await api.post('/devis', {
        clientId,
        note: `${product}${desc ? ` - ${desc}` : ''}`,
        lines,
        status: 'PENDING',
      });
      onSaved(); onClose();
    } catch (err) {
      setError(err.response?.data?.message ?? 'Erreur lors de l\'envoi.');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Nouvelle Demande</h2>
            <p className="text-sm text-slate-500 font-medium">Envoyez une demande de service à vore client.</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Choisir le client *</label>
              <select value={clientId} onChange={e => setClientId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-medium">
                <option value="">— Client —</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Prestation principale *</label>
              <input value={product} onChange={e => setProduct(e.target.value)}
                placeholder="Ex: Maintenance Annuelle"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-medium" />
            </div>
          </div>

          <div className="space-y-3">
             <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Détails des articles</label>
                <button type="button" onClick={addLine} className="text-xs font-bold text-blue-600 flex items-center gap-1 hover:underline">
                  <PlusCircle className="w-4 h-4" /> Ajouter
                </button>
             </div>
             {lines.map((ln, i) => (
                <div key={i} className="flex gap-2 items-start bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="flex-1">
                    <input value={ln.description} onChange={e => setLine(i, 'description', e.target.value)}
                      placeholder="Désignation" className="w-full bg-transparent border-b border-slate-200 py-1 text-sm outline-none focus:border-blue-500 font-medium" />
                  </div>
                  <div className="w-16">
                    <input type="number" value={ln.quantity} onChange={e => setLine(i, 'quantity', parseFloat(e.target.value))}
                      className="w-full bg-transparent border-b border-slate-200 py-1 text-sm outline-none focus:border-blue-500 text-center font-mono" />
                  </div>
                  <div className="w-24">
                    <input type="number" value={ln.unitPrice} onChange={e => setLine(i, 'unitPrice', parseFloat(e.target.value))}
                      className="w-full bg-transparent border-b border-slate-200 py-1 text-sm outline-none focus:border-blue-500 text-right font-mono" />
                  </div>
                  {lines.length > 1 && (
                    <button type="button" onClick={() => removeLine(i)} className="text-rose-400 hover:text-rose-600 pt-1">
                      <MinusCircle className="w-5 h-5" />
                    </button>
                  )}
                </div>
             ))}
          </div>

          {error && <div className="text-xs font-bold text-rose-600 bg-rose-50 p-4 rounded-xl border border-rose-100">{error}</div>}
        </form>

        <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-4">
          <button type="button" onClick={onClose} className="px-6 py-3 text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors">Annuler</button>
          <button onClick={handleSubmit} disabled={loading} className="px-8 py-3 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2">
            {loading ? <Loader className="w-5 h-5 animate-spin" /> : <ClipboardList className="w-5 h-5" />}
            Envoyer la demande
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const Demandes = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [demandes, setDemandes] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [converting, setConverting] = useState(null);
  const [recording, setRecording] = useState(null);

  const fetchData = async () => {
    try {
      const [demRes, cliRes] = await Promise.all([api.get('/devis'), api.get('/clients')]);
      setDemandes(demRes.data);
      setClients(cliRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleRecordResponse = async (id, status) => {
    try {
      await api.patch(`/devis/${id}/status`, { status });
      setRecording(null);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleConvert = async (id) => {
    setConverting(id);
    try {
      await api.post(`/devis/${id}/convert`);
      navigate('/invoices');
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur conversion');
    } finally {
      setConverting(null);
    }
  };

  return (
    <>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 px-1">
          <div className="space-y-1">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-1">Centre des Demandes</h1>
            <p className="text-slate-500 font-medium">Suivez vos prestations de service et convertissez les accords en factures.</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center justify-center gap-2 bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 active:scale-95"
          >
            <Plus className="w-6 h-6" />
            Nouvelle Demande
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
           <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 text-center">En attente</p>
              <p className="text-4xl font-black text-slate-900 text-center">{demandes.filter(d => d.status === 'PENDING').length}</p>
           </div>
           <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm border-b-emerald-500 border-b-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 text-center font-bold">Acceptées</p>
              <p className="text-4xl font-black text-emerald-600 text-center">{demandes.filter(d => d.status === 'ACCEPTED').length}</p>
           </div>
           <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 text-center">Refusées</p>
              <p className="text-4xl font-black text-slate-400 text-center">{demandes.filter(d => d.status === 'REJECTED').length}</p>
           </div>
        </div>

        {/* Guided Tip */}
        <div className="mb-6 bg-blue-50 border border-blue-100 p-4 rounded-2xl flex items-center gap-4 text-blue-800">
           <div className="bg-blue-100 p-2 rounded-lg">
              <Lightbulb className="w-5 h-5" />
           </div>
           <p className="text-sm font-semibold">
              {t('guide.demandes.tip')}
           </p>
        </div>

        <div className="bg-white rounded-[2rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-[0.15em] border-b border-slate-100">
                  <th className="px-8 py-5">Identifiant & Date</th>
                  <th className="px-8 py-5">Client & Prestation</th>
                  <th className="px-8 py-5 text-right">Montant (TND)</th>
                  <th className="px-8 py-5 text-center">Statut</th>
                  <th className="px-8 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr><td colSpan="5" className="py-20 text-center"><Loader className="w-8 h-8 animate-spin mx-auto text-blue-500" /></td></tr>
                ) : demandes.length === 0 ? (
                  <tr><td colSpan="5" className="py-20 text-center font-bold text-slate-300">Aucune demande transmise.</td></tr>
                ) : (
                  demandes.map(d => (
                    <tr key={d.id} className="hover:bg-slate-50/30 transition-all group">
                      <td className="px-8 py-6">
                        <p className="font-bold text-slate-900 text-sm">#DEM-{d.id.substring(0, 6)}</p>
                        <p className="text-xs text-slate-400 font-medium">{new Date(d.createdAt).toLocaleDateString()}</p>
                      </td>
                      <td className="px-8 py-6">
                        <p className="font-bold text-slate-900 text-sm">{d.client?.name}</p>
                        <p className="text-xs text-slate-500 font-medium italic truncate max-w-[200px]">{d.note || 'Pas de description'}</p>
                      </td>
                      <td className="px-8 py-6 text-right font-mono font-black text-slate-900">
                        {d.netToPay.toFixed(3)}
                      </td>
                      <td className="px-8 py-6 text-center">
                        <StatusBadge status={d.status} />
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-3">
                          {d.status === 'PENDING' && (
                            <div className="relative">
                              <button
                                onClick={() => setRecording(recording === d.id ? null : d.id)}
                                className="bg-blue-50 text-blue-600 px-4 py-1.5 rounded-xl text-[11px] font-black hover:bg-blue-100 transition-all flex items-center gap-1"
                              >
                                RÉPONSE
                              </button>
                              {recording === d.id && (
                                <div className="absolute right-0 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 z-10 flex flex-col gap-1 w-40">
                                  <button onClick={() => handleRecordResponse(d.id, 'ACCEPTED')} className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all">
                                    <CheckCircle2 className="w-4 h-4" /> ACCEPTER
                                  </button>
                                  <button onClick={() => handleRecordResponse(d.id, 'REJECTED')} className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-all">
                                    <XCircle className="w-4 h-4" /> REJETER
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                          {d.status === 'ACCEPTED' && (
                            <button
                              onClick={() => handleConvert(d.id)}
                              disabled={converting === d.id}
                              className="bg-emerald-600 text-white px-5 py-2 rounded-xl text-[11px] font-black hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 flex items-center gap-1 active:scale-95"
                            >
                              {converting === d.id ? <Loader className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                              FACTURER
                            </button>
                          )}
                          <button
                             onClick={() => window.open(`${api.defaults.baseURL}/devis/${d.id}/pdf`, '_blank')}
                             className="p-2 text-slate-300 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                          >
                             <FileText className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      {showModal && <RequestModal clients={clients} onClose={() => setShowModal(false)} onSaved={fetchData} />}
    </>
  );
};

export default Demandes;
