import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileCode2, Download, Send, CheckCircle2, Clock, XCircle,
  ChevronDown, ChevronUp, Loader, RefreshCw, ShieldCheck,
  AlertTriangle, Eye, FileText, Upload, X, Settings,
  Wifi, WifiOff, BadgeCheck
} from 'lucide-react';
import api from '../services/api';

// ── TTN status helpers ────────────────────────────────────────────────────────
const TTN_STATUS = {
  NOT_SENT:  { label: 'Non envoyée',  color: 'bg-gray-100 text-gray-500',     icon: WifiOff },
  SENT:      { label: 'Envoyée',      color: 'bg-blue-100 text-blue-600',      icon: Wifi },
  ACCEPTED:  { label: 'Acceptée',     color: 'bg-green-100 text-green-700',    icon: BadgeCheck },
  REJECTED:  { label: 'Rejetée',      color: 'bg-red-100 text-red-600',        icon: XCircle },
};

// Map invoice status → TTN status bucket
const ttnBucket = (inv) => {
  if (inv.status === 'SENT_TO_TTN') return TTN_STATUS.SENT;
  if (inv.status === 'VALIDATED' || inv.status === 'PAID') return TTN_STATUS.ACCEPTED;
  if (inv.status === 'REJECTED')   return TTN_STATUS.REJECTED;
  return TTN_STATUS.NOT_SENT;
};

// Map invoice status → label in French
const INV_LABEL = {
  DRAFT:              'Brouillon',
  SENT_TO_TTN:        'Envoyé à TTN',
  PENDING_VALIDATION: 'En attente',
  VALIDATED:          'Validée',
  PAID:               'Payée',
  REJECTED:           'Rejetée',
};
const INV_COLOR = {
  DRAFT:              'bg-gray-100 text-gray-500',
  SENT_TO_TTN:        'bg-blue-100 text-blue-600',
  PENDING_VALIDATION: 'bg-yellow-100 text-yellow-700',
  VALIDATED:          'bg-green-100 text-green-700',
  PAID:               'bg-emerald-100 text-emerald-700',
  REJECTED:           'bg-red-100 text-red-600',
};

const InvBadge = ({ status }) => (
  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${INV_COLOR[status] ?? 'bg-gray-100 text-gray-500'}`}>
    {INV_LABEL[status] ?? status}
  </span>
);

const TtnBadge = ({ inv }) => {
  const b = ttnBucket(inv);
  const Icon = b.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${b.color}`}>
      <Icon className="w-3 h-3" />
      {b.label}
    </span>
  );
};

// ── XML Preview modal ─────────────────────────────────────────────────────────
const XmlModal = ({ xml, onClose }) => (
  <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col"
         onClick={e => e.stopPropagation()}>
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-2 text-gray-800 font-semibold">
          <FileCode2 className="w-5 h-5 text-blue-600" />
          Aperçu XML TEIF
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 rounded-lg p-1 transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="flex-1 overflow-auto p-6">
        <pre className="text-xs font-mono bg-gray-950 text-green-400 rounded-xl p-5 overflow-auto whitespace-pre-wrap leading-relaxed">
          {xml}
        </pre>
      </div>
      <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
        <button onClick={onClose}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors">
          Fermer
        </button>
      </div>
    </div>
  </div>
);

// ── Import XML modal ──────────────────────────────────────────────────────────
const ImportModal = ({ onClose, onSuccess }) => {
  const [file, setFile]       = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg]         = useState(null);
  const inputRef              = useRef();

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (f && (f.name.endsWith('.xml') || f.type === 'application/xml' || f.type === 'text/xml')) {
      setFile(f);
      setMsg(null);
    } else {
      setMsg({ type: 'error', text: 'Veuillez sélectionner un fichier .xml valide.' });
    }
  };

  const handleImport = async () => {
    if (!file) return;
    setLoading(true);
    setMsg(null);
    try {
      const form = new FormData();
      form.append('xml', file);
      const res = await api.post('/invoices/import-xml', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMsg({ type: 'success', text: res.data.message ?? 'Facture importée avec succès !' });
      setTimeout(() => { onSuccess(); onClose(); }, 1800);
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message ?? 'Erreur lors de l\'import.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2 font-semibold text-gray-800">
            <Upload className="w-5 h-5 text-blue-600" />
            Importer un fichier XML TEIF
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Drop zone */}
          <div
            onClick={() => inputRef.current?.click()}
            className="border-2 border-dashed border-blue-200 rounded-xl p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
          >
            <FileCode2 className="w-10 h-10 text-blue-300 mx-auto mb-3" />
            {file ? (
              <p className="text-sm font-medium text-blue-700">{file.name}</p>
            ) : (
              <>
                <p className="text-sm font-medium text-gray-700">Glissez votre fichier XML ici</p>
                <p className="text-xs text-gray-400 mt-1">ou cliquez pour sélectionner</p>
              </>
            )}
            <input ref={inputRef} type="file" accept=".xml,application/xml,text/xml"
              className="hidden" onChange={handleFile} />
          </div>

          {/* Info */}
          <p className="text-xs text-gray-400">
            Format attendu : UBL 2.1 TEIF · Le client sera créé automatiquement s'il n'existe pas.
          </p>

          {/* Feedback */}
          {msg && (
            <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
              msg.type === 'success'
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {msg.type === 'success'
                ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                : <AlertTriangle className="w-4 h-4 flex-shrink-0" />}
              {msg.text}
            </div>
          )}
        </div>

        <div className="px-6 pb-6 flex justify-end gap-3">
          <button onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors">
            Annuler
          </button>
          <button
            onClick={handleImport}
            disabled={!file || loading}
            className="px-5 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            Importer
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────
const Teif = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [previewXml, setPreviewXml] = useState(null);
  const [showImport, setShowImport] = useState(false);
  const [loadingXml, setLoadingXml] = useState({});
  const [submitting, setSubmitting] = useState({});
  const [expanded, setExpanded]     = useState({});
  const [hasCert, setHasCert]       = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [invRes, settingsRes] = await Promise.all([
        api.get('/invoices'),
        api.get('/settings'),
      ]);
      setInvoices(invRes.data);
      setHasCert(!!(settingsRes.data?.certificatePath && settingsRes.data?.certificatePassword));
    } catch (err) {
      console.error('TEIF data error', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // ── Actions ──────────────────────────────────────────────────────────────
  const handlePreview = async (id) => {
    setLoadingXml(p => ({ ...p, [id]: true }));
    try {
      const res = await api.get(`/invoices/${id}/xml`, { responseType: 'text' });
      setPreviewXml(res.data);
    } catch { alert('Impossible de charger le XML TEIF.'); }
    finally { setLoadingXml(p => ({ ...p, [id]: false })); }
  };

  const handleDownload = async (id, ref) => {
    try {
      const res = await api.get(`/invoices/${id}/xml`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/xml' }));
      Object.assign(document.createElement('a'), { href: url, download: `TEIF_${ref}.xml` }).click();
      URL.revokeObjectURL(url);
    } catch { alert('Erreur téléchargement XML.'); }
  };

  const handleTTN = async (id) => {
    if (!window.confirm('Soumettre cette facture à TTN ?')) return;
    setSubmitting(p => ({ ...p, [id]: true }));
    try {
      await api.post(`/invoices/${id}/submit-ttn`);
      await fetchData();
    } catch (err) {
      alert(err.response?.data?.message ?? 'Erreur soumission TTN.');
    } finally { setSubmitting(p => ({ ...p, [id]: false })); }
  };

  const toggleExpand = (id) => setExpanded(p => ({ ...p, [id]: !p[id] }));

  // ── Stats ─────────────────────────────────────────────────────────────────
  const teifInvoices = invoices.filter(i => i.status !== 'DRAFT');
  const stats = [
    { label: 'Total TEIF',     value: teifInvoices.length,                                      color: 'text-blue-700',    bg: 'bg-blue-50',    border: 'border-blue-100'     },
    { label: 'Acceptées TTN',  value: teifInvoices.filter(i => ['VALIDATED','PAID'].includes(i.status)).length, color: 'text-green-700',   bg: 'bg-green-50',   border: 'border-green-100'    },
    { label: 'Envoyées TTN',   value: teifInvoices.filter(i => i.status === 'SENT_TO_TTN').length,              color: 'text-indigo-700',  bg: 'bg-indigo-50',  border: 'border-indigo-100'   },
    { label: 'Rejetées',       value: teifInvoices.filter(i => i.status === 'REJECTED').length,                 color: 'text-red-700',     bg: 'bg-red-50',     border: 'border-red-100'      },
  ];

  const invoiceRef = (inv) =>
    `F-${new Date(inv.createdAt).getFullYear()}${String(new Date(inv.createdAt).getMonth() + 1).padStart(2, '0')}-${inv.id.slice(0, 8).toUpperCase()}`;

  return (
    <>
      <div className="max-w-6xl mx-auto space-y-5 pb-10">

        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FileCode2 className="w-6 h-6 text-blue-600" />
              Composant TEIF
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">
              Gestion des factures électroniques — format UBL 2.1 / Tunisie Trade Net
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={fetchData}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors shadow-sm">
              <RefreshCw className="w-4 h-4" /> Actualiser
            </button>
            <button onClick={() => setShowImport(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm">
              <Upload className="w-4 h-4" /> Importer XML
            </button>
          </div>
        </div>

        {/* ── Certificate banner ─────────────────────────────────────── */}
        {hasCert ? (
          <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-5 py-3">
            <ShieldCheck className="w-5 h-5 text-green-600 flex-shrink-0" />
            <p className="text-sm font-medium text-green-800">
              Certificat TunTrust configuré — signature électronique XAdES-B / RSA-SHA256 active
            </p>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-4 bg-amber-50 border border-amber-200 rounded-xl px-5 py-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-800">Certificat non configuré</p>
                <p className="text-xs text-amber-600 mt-0.5">
                  La signature XAdES-B ne sera pas appliquée. Un certificat est requis pour soumettre à TTN.
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/settings')}
              className="flex-shrink-0 inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold transition-colors whitespace-nowrap">
              <Settings className="w-3.5 h-3.5" />
              Configurer certificat
            </button>
          </div>
        )}

        {/* ── Stats ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map(s => (
            <div key={s.label} className={`${s.bg} border ${s.border} rounded-xl p-5 shadow-sm`}>
              <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-1.5 font-medium">{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── Table ──────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-800">
              Factures TEIF
              <span className="ml-2 text-sm font-normal text-gray-400">({teifInvoices.length} factures)</span>
            </h2>
            <span className="text-xs text-gray-400">Brouillons exclus · devise TND</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader className="w-6 h-6 animate-spin text-blue-500" />
            </div>
          ) : teifInvoices.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <FileCode2 className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm font-medium">Aucune facture TEIF</p>
              <p className="text-xs mt-1">Créez une facture ou importez un XML ci-dessus.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {teifInvoices.map(inv => {
                const ref  = invoiceRef(inv);
                const open = expanded[inv.id];
                const ttn  = ttnBucket(inv);

                return (
                  <div key={inv.id}>
                    {/* ── Row ─────────────────────────────────────── */}
                    <div className="flex items-center px-6 py-4 gap-3 hover:bg-gray-50 transition-colors">

                      {/* Reference + client */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold font-mono text-gray-900 truncate">{ref}</p>
                        <p className="text-xs text-gray-400 mt-0.5 truncate">
                          {inv.client?.name ?? '—'} · {new Date(inv.createdAt).toLocaleDateString('fr-TN')}
                        </p>
                      </div>

                      {/* Status facture */}
                      <div className="hidden sm:block"><InvBadge status={inv.status} /></div>

                      {/* Statut TTN */}
                      <div className="hidden md:block"><TtnBadge inv={inv} /></div>

                      {/* Amount */}
                      <div className="hidden lg:block text-right">
                        <p className="text-sm font-bold text-gray-800">{inv.netToPay?.toFixed(3)}</p>
                        <p className="text-xs text-gray-400">TND TTC</p>
                      </div>

                      {/* Actions ────────────────────────────────── */}
                      <div className="flex items-center gap-1 flex-shrink-0">

                        {/* View XML */}
                        <button
                          onClick={() => handlePreview(inv.id)}
                          disabled={!!loadingXml[inv.id]}
                          title="Aperçu XML"
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors disabled:opacity-50">
                          {loadingXml[inv.id]
                            ? <Loader className="w-3.5 h-3.5 animate-spin" />
                            : <Eye className="w-3.5 h-3.5" />}
                          XML
                        </button>

                        {/* Download XML */}
                        <button
                          onClick={() => handleDownload(inv.id, ref)}
                          title="Télécharger XML"
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                          <Download className="w-3.5 h-3.5" />
                          DL
                        </button>

                        {/* Send to TTN */}
                        {!['SENT_TO_TTN', 'VALIDATED', 'PAID'].includes(inv.status) && (
                          <button
                            onClick={() => handleTTN(inv.id)}
                            disabled={!!submitting[inv.id]}
                            title="Envoyer au TTN"
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors disabled:opacity-50">
                            {submitting[inv.id]
                              ? <Loader className="w-3.5 h-3.5 animate-spin" />
                              : <Send className="w-3.5 h-3.5" />}
                            TTN
                          </button>
                        )}

                        {/* Expand */}
                        <button
                          onClick={() => toggleExpand(inv.id)}
                          className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg transition-colors">
                          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* ── Expanded detail ─────────────────────────── */}
                    {open && (
                      <div className="px-6 pb-5 pt-3 bg-gray-50/70 border-t border-gray-100">
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 text-sm">

                          <div>
                            <p className="text-xs text-gray-400 mb-1">Référence interne</p>
                            <p className="font-mono font-semibold text-gray-800 text-xs">{ref}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400 mb-1">Total HT</p>
                            <p className="font-semibold text-gray-800">{inv.totalHT?.toFixed(3)} TND</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400 mb-1">Total TVA</p>
                            <p className="font-semibold text-gray-800">{inv.totalTVA?.toFixed(3)} TND</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400 mb-1">Net à Payer (TTC)</p>
                            <p className="font-bold text-blue-700">{inv.netToPay?.toFixed(3)} TND</p>
                          </div>

                          <div>
                            <p className="text-xs text-gray-400 mb-1">Statut TTN</p>
                            <TtnBadge inv={inv} />
                          </div>
                          <div>
                            <p className="text-xs text-gray-400 mb-1">N° TTN</p>
                            <p className="font-mono text-xs text-gray-700">{inv.ttnId || '—'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400 mb-1">Signature électronique</p>
                            {hasCert
                              ? <span className="inline-flex items-center gap-1 text-xs text-green-700 font-medium"><ShieldCheck className="w-3.5 h-3.5" /> XAdES-B active</span>
                              : <span className="inline-flex items-center gap-1 text-xs text-amber-600"><AlertTriangle className="w-3.5 h-3.5" /> Non signée</span>
                            }
                          </div>
                          <div>
                            <p className="text-xs text-gray-400 mb-1">Articles</p>
                            <p className="text-gray-700 text-xs">{inv.lines?.length ?? '—'} ligne(s)</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <p className="text-xs text-gray-400 text-center">
          Format : UBL 2.1 · Devise TND · Cadre TTN — Tunisie Trade Net
        </p>
      </div>

      {previewXml  && <XmlModal xml={previewXml} onClose={() => setPreviewXml(null)} />}
      {showImport  && <ImportModal onClose={() => setShowImport(false)} onSuccess={fetchData} />}
    </>
  );
};

export default Teif;
