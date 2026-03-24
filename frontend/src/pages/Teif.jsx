import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileCode2, Download, Send, CheckCircle2, Clock, XCircle,
  ChevronDown, ChevronUp, Loader, RefreshCw, ShieldCheck,
  AlertTriangle, Eye, FileText, Upload, X, Settings,
  Wifi, WifiOff, BadgeCheck, Zap, ShieldAlert, Cpu
} from 'lucide-react';
import api from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';

// ── TTN status helpers ────────────────────────────────────────────────────────
const Teif = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  // ── TTN status helpers ────────────────────────────────────────────────────────
  const TTN_STATUS = {
    NOT_SENT:  { label: t('teif.status.not_sent'),  color: 'bg-slate-100 text-slate-500',     icon: WifiOff },
    SENT:      { label: t('teif.status.sent'),      color: 'bg-indigo-100 text-indigo-600',   icon: Wifi },
    ACCEPTED:  { label: t('teif.status.accepted'),  color: 'bg-emerald-100 text-emerald-700', icon: BadgeCheck },
    REJECTED:  { label: t('teif.status.rejected'),  color: 'bg-rose-100 text-rose-600',       icon: XCircle },
  };

  const ttnBucket = (inv) => {
    if (inv.status === 'SENT_TO_TTN') return TTN_STATUS.SENT;
    if (inv.status === 'VALIDATED' || inv.status === 'PAID') return TTN_STATUS.ACCEPTED;
    if (inv.status === 'REJECTED')   return TTN_STATUS.REJECTED;
    return TTN_STATUS.NOT_SENT;
  };

  const TtnBadge = ({ inv }) => {
    const b = ttnBucket(inv);
    const Icon = b.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${b.color}`}>
        <Icon className="w-3.5 h-3.5" />
        {b.label}
      </span>
    );
  };

  // ── Compliance Stepper ────────────────────────────────────────────────────────
  const ComplianceStepper = ({ status, hasCert }) => {
    const steps = [
      { id: 'xml',   label: t('teif.stepper.xml'),   icon: <FileCode2 className="w-4 h-4" /> },
      { id: 'sign',  label: t('teif.stepper.sign'),  icon: <ShieldCheck className="w-4 h-4" /> },
      { id: 'ttn',   label: t('teif.stepper.ttn'),   icon: <Send className="w-4 h-4" /> }
    ];

    const getActiveIndex = () => {
      if (status === 'DRAFT') return 0;
      if (status === 'SENT_TO_TTN') return 2;
      if (['VALIDATED', 'PAID'].includes(status)) return 3;
      return 1;
    };

    const activeIndex = getActiveIndex();

    return (
      <div className="flex items-center gap-3">
        {steps.map((step, i) => (
          <React.Fragment key={step.id}>
            <div className="flex items-center gap-2">
              <div className={`
                w-8 h-8 rounded-xl flex items-center justify-center border-2 transition-all
                ${i < activeIndex ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-100' : ''}
                ${i === activeIndex ? 'bg-indigo-600 border-indigo-600 text-white animate-pulse' : ''}
                ${i > activeIndex ? 'bg-white border-slate-100 text-slate-300' : ''}
                ${i === 1 && !hasCert && i === activeIndex ? 'bg-amber-500 border-amber-500 text-white' : ''}
              `}>
                {i < activeIndex ? <CheckCircle2 className="w-4 h-4" /> : step.icon}
              </div>
              <span className={`text-[10px] font-black uppercase tracking-tighter w-16 leading-none ${i === activeIndex ? 'text-indigo-600' : 'text-slate-400'}`}>
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`h-[2px] w-6 rounded-full ${i < activeIndex ? 'bg-emerald-500' : 'bg-slate-100'}`} />
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

  // ── XML Preview modal ─────────────────────────────────────────────────────────
  const XmlModal = ({ xml, onClose }) => (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col border border-white/20 animate-in zoom-in duration-300">
        <div className="flex items-center justify-between px-10 py-8 border-b border-slate-100">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">{t('teif.modal.preview_title')}</h2>
            <p className="text-slate-500 text-sm font-medium">{t('teif.modal.preview_desc')}</p>
          </div>
          <button onClick={onClose} className="p-3 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-2xl transition-all">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="flex-1 overflow-auto p-10 bg-slate-50/30">
          <pre className="text-xs font-mono bg-slate-900 text-emerald-400 rounded-3xl p-8 overflow-auto whitespace-pre-wrap leading-relaxed shadow-inner">
            {xml}
          </pre>
        </div>
        <div className="px-10 py-6 border-t border-slate-100 flex justify-end">
          <Button onClick={onClose} variant="secondary">{t('form.close')}</Button>
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
        setFile(f); setMsg(null);
      } else {
        setMsg({ type: 'error', text: t('teif.import.error_format') });
      }
    };

    const handleImport = async () => {
      if (!file) return;
      setLoading(true); setMsg(null);
      try {
        const form = new FormData();
        form.append('xml', file);
        await api.post('/invoices/import-xml', form, { headers: { 'Content-Type': 'multipart/form-data' } });
        setMsg({ type: 'success', text: t('teif.import.success') });
        setTimeout(() => { onSuccess(); onClose(); }, 1500);
      } catch (err) {
        setMsg({ type: 'error', text: err.response?.data?.message ?? t('teif.import.error') });
      } finally { setLoading(false); }
    };

    return (
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg border border-white/20 animate-in slide-in-from-bottom-4 duration-300">
          <div className="px-10 py-8 border-b border-slate-100">
             <h2 className="text-2xl font-black text-slate-900 tracking-tight">{t('teif.modal.import_title')}</h2>
             <p className="text-slate-500 text-sm font-medium">{t('teif.modal.import_desc')}</p>
          </div>

          <div className="p-10 space-y-6">
            <div
              onClick={() => inputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 rounded-[2rem] p-12 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-all group"
            >
              <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                 <FileCode2 className="w-8 h-8 text-indigo-500" />
              </div>
              {file ? (
                <p className="text-sm font-black text-indigo-600">{file.name}</p>
              ) : (
                <>
                  <p className="text-sm font-black text-slate-700">{t('teif.import.drop_zone')}</p>
                  <p className="text-xs text-slate-400 mt-1 font-bold">{t('teif.import.max_size')}</p>
                </>
              )}
              <input ref={inputRef} type="file" accept=".xml,application/xml,text/xml" className="hidden" onChange={handleFile} />
            </div>

            {msg && (
              <div className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-3 ${msg.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                {msg.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
                {msg.text}
              </div>
            )}
          </div>

          <div className="px-10 pb-10 flex gap-4">
            <button onClick={onClose} className="flex-1 py-4 text-sm font-black text-slate-400 hover:text-slate-600">{t('form.cancel')}</button>
            <Button onClick={handleImport} disabled={!file || loading} loading={loading} className="flex-1 py-4 shadow-xl shadow-indigo-100">{t('common.import')}</Button>
          </div>
        </div>
      </div>
    );
  };

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
      const [invRes, settingsRes] = await Promise.all([api.get('/invoices'), api.get('/settings')]);
      setInvoices(invRes.data);
      setHasCert(!!(settingsRes.data?.certificatePath && settingsRes.data?.certificatePassword));
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handlePreview = async (id) => {
    setLoadingXml(p => ({ ...p, [id]: true }));
    try {
      const res = await api.get(`/invoices/${id}/xml`, { responseType: 'text' });
      setPreviewXml(res.data);
    } catch { alert(t('teif.error_xml')); }
    finally { setLoadingXml(p => ({ ...p, [id]: false })); }
  };

  const handleDownload = async (id, ref) => {
    try {
      const res = await api.get(`/invoices/${id}/xml`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/xml' }));
      Object.assign(document.createElement('a'), { href: url, download: `TEIF_${ref}.xml` }).click();
      URL.revokeObjectURL(url);
    } catch { alert(t('teif.error_xml')); }
  };

  const handleTTN = async (id) => {
    if (!hasCert) return alert(t('teif.error_cert'));
    setSubmitting(p => ({ ...p, [id]: true }));
    try {
      await api.post(`/invoices/${id}/submit-ttn`); fetchData();
    } catch (err) { alert(err.response?.data?.message || t('teif.error_ttn')); }
    finally { setSubmitting(p => ({ ...p, [id]: false })); }
  };

  const toggleExpand = (id) => setExpanded(p => ({ ...p, [id]: !p[id] }));

  const teifInvoices = invoices.filter(i => i.status !== 'DRAFT');

  const [searchTerm, setSearchTerm] = useState('');

  const filteredInvoices = teifInvoices.filter(i => {
    const ref = `F-${new Date(i.createdAt).getFullYear()}-${i.id.slice(0, 6).toUpperCase()}`;
    return (
      ref.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (i.client?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="pb-12 animate-in fade-in duration-500">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div>
          <h2 className="text-2xl font-black text-slate-900 font-display tracking-tight">{t('teif.title')}</h2>
          <p className="text-sm text-slate-500 font-medium">{t('teif.subtitle')}</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button 
            onClick={fetchData} 
            className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-indigo-600 hover:shadow-lg transition-all shadow-sm"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Button 
            onClick={() => setShowImport(true)} 
            className="flex-1 md:flex-none shadow-lg shadow-indigo-100"
          >
            <Upload className="w-4 h-4 me-2" /> {t('teif.import')}
          </Button>
        </div>
      </div>

      {/* ── Status Cards ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
         {/* Cert Status Gauge */}
         <div className={`col-span-1 lg:col-span-2 p-6 rounded-[2rem] border flex items-center gap-6 shadow-sm transition-all ${
           hasCert ? 'bg-emerald-50/30 border-emerald-100/50' : 'bg-rose-50/30 border-rose-100/50'
         }`}>
           <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg transition-transform hover:scale-105 ${
             hasCert ? 'bg-emerald-500 text-white shadow-emerald-100' : 'bg-rose-500 text-white shadow-rose-100'
           }`}>
             {hasCert ? <ShieldCheck className="w-8 h-8" /> : <ShieldAlert className="w-8 h-8" />}
           </div>
           <div className="flex-1 space-y-0.5">
             <h3 className={`text-lg font-black ${hasCert ? 'text-emerald-900' : 'text-rose-900'} font-display`}>
               {hasCert ? t('teif.signature_active') : t('teif.signature_inactive')}
             </h3>
             <p className={`text-xs font-medium ${hasCert ? 'text-emerald-700/80' : 'text-rose-700/80'}`}>
               {hasCert 
                 ? t('teif.signature_active_desc')
                 : t('teif.signature_inactive_desc')}
             </p>
             {!hasCert && (
                <button onClick={() => navigate('/settings')} className="text-[10px] font-black uppercase tracking-widest text-rose-500 flex items-center gap-2 hover:underline mt-2">
                  <Settings className="w-3.5 h-3.5" /> {t('teif.card.config_now')}
                </button>
             )}
           </div>
           {hasCert && (
              <div className="hidden sm:flex flex-col items-end gap-1">
                 <div className="flex items-center gap-2 text-[9px] font-black uppercase text-emerald-600 tracking-wider">
                    <Cpu className="w-3 h-3" /> RSA-SHA256
                 </div>
                 <div className="text-[9px] font-black uppercase text-emerald-600 tracking-wider">
                    UBL v2.1 COMPLIANT
                 </div>
              </div>
           )}
         </div>

         {/* Quick Stat */}
         <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-center gap-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('teif.quick_stat.title')}</p>
              <div className="bg-indigo-50 p-2 rounded-lg text-indigo-600"><Wifi className="w-4 h-4" /></div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 font-display">{teifInvoices.filter(i => ['VALIDATED','PAID'].includes(i.status)).length}</span>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('teif.quick_stat.validated')}</span>
            </div>
         </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1 group">
          <RefreshCw className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          <input 
            type="text" 
            placeholder={t('common.search') || "Rechercher par référence ou client..."} 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm placeholder:text-slate-300"
          />
        </div>
        <div className="px-5 py-3 bg-indigo-50/50 rounded-2xl border border-indigo-100/30 flex items-center justify-center">
          <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest leading-none">
            {filteredInvoices.length} {t('invoices.title').toUpperCase()}
          </span>
        </div>
      </div>

      {/* ── Action Display ───────────────────────────────────────────── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 bg-white rounded-[2rem] border border-slate-100 shadow-sm">
          <div className="w-10 h-10 border-4 border-indigo-500/10 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
          <p className="text-slate-400 text-xs font-black uppercase tracking-widest">{t('common.loading')}</p>
        </div>
      ) : (
        <div className="bg-transparent md:bg-white md:rounded-[2rem] md:border md:border-slate-100 md:shadow-sm overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-black tracking-widest uppercase border-b border-slate-100">
                  <th className="px-10 py-5">{t('teif.table.ref_client')}</th>
                  <th className="px-10 py-5 w-96">{t('teif.table.compliance')}</th>
                  <th className="px-10 py-5 text-right">{t('teif.table.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredInvoices.length > 0 ? (
                  filteredInvoices.map(inv => {
                    const refNum = `F-${new Date(inv.createdAt).getFullYear()}-${inv.id.slice(0, 6).toUpperCase()}`;
                    const open = expanded[inv.id];
                    return (
                      <React.Fragment key={inv.id}>
                        <tr className="hover:bg-indigo-50/30 transition-all group">
                          <td className="px-10 py-6">
                             <div className="flex flex-col">
                               <p className="font-bold text-indigo-600 text-[11px] mb-0.5">{refNum}</p>
                               <p className="font-black text-slate-900 text-sm font-display">{inv.client?.name ?? t('common.various_client')}</p>
                               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                                 {new Date(inv.createdAt).toLocaleDateString()} · {inv.netToPay?.toLocaleString(undefined, { minimumFractionDigits: 3 })} TND
                               </p>
                             </div>
                          </td>
                          <td className="px-10 py-6">
                            <ComplianceStepper status={inv.status} hasCert={hasCert} />
                          </td>
                          <td className="px-10 py-6 text-right">
                             <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handlePreview(inv.id)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-slate-100 transition-all" title={t('teif.table.tooltip_preview')}>
                                  {loadingXml[inv.id] ? <Loader className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                                </button>
                                <button onClick={() => handleDownload(inv.id, refNum)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-slate-100 transition-all" title={t('teif.table.tooltip_download')}>
                                   <Download className="w-4 h-4" />
                                </button>
                                {!['SENT_TO_TTN', 'VALIDATED', 'PAID'].includes(inv.status) && (
                                  <button onClick={() => handleTTN(inv.id)} disabled={submitting[inv.id]} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-[10px] font-black transition-all shadow-md flex items-center gap-2">
                                    {submitting[inv.id] ? <Loader className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                                    {t('common.submit').toUpperCase()}
                                  </button>
                                )}
                                <button onClick={() => toggleExpand(inv.id)} className="p-2 text-slate-300 hover:text-slate-900 transition-all ms-2">
                                   {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                </button>
                             </div>
                          </td>
                        </tr>
                        {open && (
                          <tr className="bg-slate-50/30">
                            <td colSpan="3" className="px-10 py-6 border-l-4 border-indigo-500 animate-in slide-in-from-left-4 duration-300">
                               <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                                  <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('teif.details.net_amount')}</p>
                                    <p className="font-black text-slate-900 text-base font-display">{inv.netToPay?.toLocaleString(undefined, { minimumFractionDigits: 3 })} TND</p>
                                  </div>
                                  <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('teif.details.ttn_archive')}</p>
                                    <p className="font-bold text-slate-600 text-xs font-mono">{inv.ttnId || t('common.waiting')}</p>
                                  </div>
                                  <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('teif.details.algorithm')}</p>
                                    <p className="font-black text-indigo-500 text-[10px] bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100/30 inline-block uppercase tracking-wider">XAdES RSA-SHA256</p>
                                  </div>
                                  <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('teif.details.last_action')}</p>
                                    <p className="font-bold text-slate-700 text-[10px] flex items-center gap-1.5 uppercase tracking-wider">
                                      <Zap className="w-3.5 h-3.5 text-amber-500" /> {t('teif.details.action_finalized')}
                                    </p>
                                  </div>
                               </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                ) : (
                  <tr><td colSpan="3" className="py-24 text-center">
                    <div className="flex flex-col items-center gap-4">
                       <div className="h-16 w-16 bg-slate-50 rounded-[1.5rem] flex items-center justify-center mb-2 border border-slate-100">
                          <ShieldCheck className="w-8 h-8 text-slate-200" />
                       </div>
                       <p className="text-slate-400 font-black uppercase text-xs tracking-widest">{t('teif.table.no_docs')}</p>
                    </div>
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {filteredInvoices.length > 0 ? (
              filteredInvoices.map(inv => {
                const refNum = `F-${new Date(inv.createdAt).getFullYear()}-${inv.id.slice(0, 6).toUpperCase()}`;
                const open = expanded[inv.id];
                return (
                  <div key={inv.id} className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 flex flex-col gap-6">
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col gap-1.5">
                         <span className="text-[9px] font-black text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100/30 self-start uppercase tracking-wider">{refNum}</span>
                         <h4 className="text-base font-black text-slate-900 font-display">{inv.client?.name ?? t('common.various_client')}</h4>
                         <p className="text-[10px] text-slate-400 font-bold tracking-wider">{new Date(inv.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right flex flex-col items-end gap-0.5">
                         <span className="text-sm font-black text-slate-900 tracking-tight font-display">{inv.netToPay?.toLocaleString(undefined, { minimumFractionDigits: 3 })}</span>
                         <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{t('common.tnd')}</span>
                      </div>
                    </div>

                    <div className="py-4 border-y border-slate-50">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Compliance Pipeline</p>
                      <div className="flex justify-center">
                         <ComplianceStepper status={inv.status} hasCert={hasCert} />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex gap-2">
                        <button onClick={() => handlePreview(inv.id)} className="p-3 bg-slate-50 rounded-2xl text-slate-400 border border-slate-100">
                           <Eye className="w-5 h-5" />
                        </button>
                        <button onClick={() => handleDownload(inv.id, refNum)} className="p-3 bg-slate-50 rounded-2xl text-slate-400 border border-slate-100">
                           <Download className="w-5 h-5" />
                        </button>
                      </div>
                      <div className="flex gap-2">
                         {!['SENT_TO_TTN', 'VALIDATED', 'PAID'].includes(inv.status) && (
                           <button
                             onClick={() => handleTTN(inv.id)}
                             disabled={submitting[inv.id]}
                             className="bg-emerald-600 text-white px-5 rounded-2xl text-[10px] font-black transition-all shadow-md h-12 flex items-center gap-2"
                           >
                             <Send className="w-4 h-4" /> {t('common.submit').toUpperCase()}
                           </button>
                         )}
                         <button 
                           onClick={() => toggleExpand(inv.id)} 
                           className={`p-3 rounded-2xl transition-all border ${open ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-400 border-slate-100'}`}
                         >
                            {open ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                         </button>
                      </div>
                    </div>

                    {open && (
                      <div className="grid grid-cols-2 gap-6 pt-2 bg-slate-50 px-6 py-5 rounded-[1.5rem] animate-in slide-in-from-top-2">
                         <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('teif.details.ttn_archive')}</p>
                            <p className="font-bold text-slate-700 text-xs font-mono truncate">{inv.ttnId || t('common.waiting')}</p>
                         </div>
                         <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('teif.details.algorithm')}</p>
                            <p className="font-black text-indigo-500 text-[10px]">RSA-SHA256</p>
                         </div>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="py-12 text-center text-slate-400 text-sm font-medium italic bg-white rounded-[2rem] border border-dashed border-slate-200">
                {t('teif.table.no_docs')}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer Info */}
      <div className="mt-8 bg-indigo-900 rounded-[2.5rem] p-8 text-white flex flex-col md:flex-row items-center gap-8 shadow-2xl shadow-indigo-100">
         <div className="bg-white/10 p-5 rounded-[1.5rem] border border-white/10 backdrop-blur-md hidden sm:block">
           <ShieldCheck className="w-12 h-12 text-indigo-200" />
         </div>
         <div className="space-y-3 flex-1">
            <h4 className="text-xl font-black tracking-tight font-display">{t('teif.footer.title')}</h4>
            <p className="text-indigo-100/80 text-xs font-medium leading-relaxed max-w-xl">
              {t('teif.banner.desc')}
            </p>
            <div className="flex gap-4 pt-2">
               <button onClick={() => navigate('/settings')} className="bg-white text-indigo-900 px-6 py-2.5 rounded-xl font-black text-[11px] hover:scale-105 transition-transform uppercase tracking-wider">{t('teif.banner.button')}</button>
               <button className="text-indigo-200 font-bold text-xs hover:text-white transition-colors">{t('teif.banner.learn_more')} →</button>
            </div>
         </div>
      </div>

      {previewXml  && <XmlModal xml={previewXml} onClose={() => setPreviewXml(null)} />}
      {showImport  && <ImportModal onClose={() => setShowImport(false)} onSuccess={fetchData} />}
    </div>
  );
};

export default Teif;

