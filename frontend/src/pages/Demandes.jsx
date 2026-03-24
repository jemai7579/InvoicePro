import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import {
  ClipboardList, Plus, X, CheckCircle2, XCircle, Clock,
  Loader, FileText, ChevronDown, ChevronUp, PlusCircle, MinusCircle,
  AlertCircle, Zap, ExternalLink, Lightbulb, ArrowRight, MousePointer2,
  Search
} from 'lucide-react';
import api from '../services/api';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';

// ── Pipeline Stepper ──────────────────────────────────────────────────────────
const DemandeStepper = ({ status, hasInvoice }) => {
  const { t } = useLanguage();
  
  // Define steps: Draft -> Sent -> Accepted -> Invoiced -> Signed -> Submitted
  const steps = [
    { id: 'sent',      label: t('demandes.steps.sent'),      icon: <Clock className="w-3 h-3" /> },
    { id: 'accepted',  label: t('demandes.steps.accepted'),  icon: <CheckCircle2 className="w-3 h-3" /> },
    { id: 'invoiced',  label: t('demandes.steps.invoiced'),  icon: <Zap className="w-3 h-3" /> },
    { id: 'submitted', label: t('demandes.steps.submitted'), icon: <ExternalLink className="w-3 h-3" /> }
  ];

  const getActiveIndex = () => {
    if (status === 'REJECTED') return -1;
    if (status === 'PENDING') return 0;
    if (status === 'ACCEPTED' && !hasInvoice) return 1;
    if (hasInvoice) return 2; // Simplified logic, assuming if has invoice it's at least invoiced
    return 1;
  };

  const activeIndex = getActiveIndex();

  return (
    <div className="flex items-center gap-2">
      {steps.map((step, i) => {
        const isCompleted = i < activeIndex;
        const isActive    = i === activeIndex;
        const isFuture    = i > activeIndex;

        return (
          <React.Fragment key={step.id}>
            <div className={`
              flex flex-col items-center gap-1 min-w-[60px] transition-all duration-300
              ${isActive ? 'scale-110' : 'scale-100'}
            `}>
              <div className={`
                w-6 h-6 rounded-full flex items-center justify-center border-2
                transition-all duration-500
                ${isCompleted ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-100' : ''}
                ${isActive ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100 animate-pulse' : ''}
                ${isFuture ? 'bg-white border-slate-200 text-slate-300' : ''}
                ${status === 'REJECTED' ? 'bg-rose-50 border-rose-100 text-rose-300' : ''}
              `}>
                {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5" /> : step.icon}
              </div>
              <span className={`
                text-[9px] font-black uppercase tracking-tighter
                ${isActive ? 'text-indigo-600' : (isCompleted ? 'text-emerald-600' : 'text-slate-400')}
                ${status === 'REJECTED' ? 'text-slate-300' : ''}
              `}>
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`h-[2px] w-6 rounded-full transition-all duration-500 ${isCompleted ? 'bg-emerald-500' : 'bg-slate-100'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// ── New Request Modal ─────────────────────────────────────────────────────────
const RequestModal = ({ clients, onClose, onSaved }) => {
  const { t } = useLanguage();
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
    if (!clientId) return setError(t('error.clientRequired'));
    if (!product)  return setError(t('error.prestationRequired'));
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
      setError(err.response?.data?.message ?? t('error.saveFailed'));
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden border border-white/20 animate-in fade-in zoom-in duration-300">
        <div className="px-10 py-8 bg-gradient-to-br from-slate-50 to-white border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">{t('demandes.new')}</h2>
              <p className="text-slate-500 font-medium text-sm mt-1">{t('demandes.subtitle')}</p>
            </div>
            <button onClick={onClose} className="p-3 text-slate-400 hover:text-slate-900 hover:bg-white rounded-2xl transition-all shadow-sm">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-8 max-h-[65vh] overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">{t('demandes.form.client_label')}</label>
              <select value={clientId} onChange={e => setClientId(e.target.value)}
                className="w-full bg-slate-50 border-none ring-1 ring-slate-200 rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-700 appearance-none shadow-sm transition-all">
                <option value="">{t('demandes.form.client_placeholder')}</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">{t('demandes.form.prestation_label')}</label>
              <input value={product} onChange={e => setProduct(e.target.value)}
                placeholder={t('demandes.form.prestation_placeholder')}
                className="w-full bg-slate-50 border-none ring-1 ring-slate-200 rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-700 shadow-sm transition-all" />
            </div>
          </div>

          <div className="space-y-4">
             <div className="flex items-center justify-between px-1">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{t('demandes.form.items_label')}</label>
                <button type="button" onClick={addLine} className="text-xs font-black text-indigo-600 flex items-center gap-1.5 hover:text-indigo-700 transition-colors">
                  <PlusCircle className="w-4 h-4" /> {t('form.add')}
                </button>
             </div>
             <div className="space-y-3">
              {lines.map((ln, i) => (
                  <div key={i} className="flex gap-4 items-center bg-slate-50/50 p-2 rounded-2xl ring-1 ring-slate-100 group transition-all hover:ring-indigo-100 hover:bg-white hover:shadow-xl hover:shadow-indigo-50/20">
                    <div className="flex-1 px-4">
                      <input value={ln.description} onChange={e => setLine(i, 'description', e.target.value)}
                        placeholder={t('demandes.form.desc_placeholder')} className="w-full bg-transparent border-none py-2 text-sm outline-none font-bold text-slate-700 placeholder:text-slate-300" />
                    </div>
                    <div className="w-20 px-2 border-x border-slate-100">
                      <input type="number" value={ln.quantity} onChange={e => setLine(i, 'quantity', parseFloat(e.target.value))}
                        className="w-full bg-transparent border-none py-2 text-sm outline-none text-center font-black text-indigo-600" />
                    </div>
                    <div className="w-32 px-4">
                      <input type="number" value={ln.unitPrice} onChange={e => setLine(i, 'unitPrice', parseFloat(e.target.value))}
                        className="w-full bg-transparent border-none py-2 text-sm outline-none text-right font-black text-slate-900" />
                    </div>
                    {lines.length > 1 && (
                      <button type="button" onClick={() => removeLine(i)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors me-2">
                        <MinusCircle className="w-5 h-5" />
                      </button>
                    )}
                  </div>
              ))}
             </div>
          </div>

          {error && (
            <div className="flex items-center gap-3 bg-rose-50 text-rose-600 p-4 rounded-2xl border border-rose-100 animate-shake">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-xs font-bold leading-tight">{error}</p>
            </div>
          )}
        </form>

        <div className="p-10 bg-slate-50/50 border-t border-slate-100 flex justify-end gap-6">
          <button type="button" onClick={onClose} className="text-sm font-black text-slate-400 hover:text-slate-600 transition-colors">
            {t('form.cancel')}
          </button>
          <Button onClick={handleSubmit} loading={loading} variant="primary" className="px-10 py-4 shadow-xl shadow-indigo-100">
            <ClipboardList className="w-5 h-5" />
            {t('form.send')}
          </Button>
        </div>
      </div>
    </div>
  );
};

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

  const [searchTerm, setSearchTerm] = useState('');

  const filteredDemandes = demandes.filter(d => 
    d.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.client?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (d.note || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="pb-12 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div>
          <h2 className="text-2xl font-black text-slate-900 font-display tracking-tight">{t('demandes.title')}</h2>
          <p className="text-sm text-slate-500 font-medium">{t('demandes.subtitle')}</p>
        </div>
        <Button
          onClick={() => setShowModal(true)}
          className="shadow-lg shadow-indigo-100 group w-full md:w-auto"
        >
          <Plus className="w-5 h-5 transition-transform group-hover:rotate-90 me-2" />
          {t('demandes.new')}
        </Button>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
         {[
           { id: 'total',    icon: <ClipboardList />, color: 'text-indigo-600', bg: 'bg-indigo-50', label: t('demandes.total'), count: demandes.length },
           { id: 'pending',  icon: <Clock />,         color: 'text-amber-600',  bg: 'bg-amber-50',  label: t('demandes.pending'), count: demandes.filter(d => d.status === 'PENDING').length },
           { id: 'accepted', icon: <CheckCircle2 />,  color: 'text-emerald-600', bg: 'bg-emerald-50', label: t('demandes.accepted'), count: demandes.filter(d => d.status === 'ACCEPTED').length },
           { id: 'rejected', icon: <XCircle />,       color: 'text-rose-600',    bg: 'bg-rose-50',    label: t('demandes.rejected'), count: demandes.filter(d => d.status === 'REJECTED').length }
         ].map(stat => (
           <div key={stat.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between group">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                <p className="text-2xl font-black text-slate-900 leading-none">{stat.count}</p>
              </div>
              <div className={`${stat.bg} ${stat.color} p-3 rounded-xl transition-transform group-hover:scale-110`}>
                {React.cloneElement(stat.icon, { className: 'w-5 h-5' })}
              </div>
           </div>
         ))}
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          <input 
            type="text" 
            placeholder={t('common.search') || "Rechercher..."} 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm placeholder:text-slate-300"
          />
        </div>
        <div className="px-5 py-3 bg-indigo-50/50 rounded-2xl border border-indigo-100/30 flex items-center justify-center">
          <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest leading-none">
            {filteredDemandes.length} {t('common.results') || 'Items'}
          </span>
        </div>
      </div>

      {/* Demandes Display */}
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
                <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                  <th className="px-10 py-5">{t('demandes.table.details')}</th>
                  <th className="px-10 py-5">{t('demandes.table.pipeline')}</th>
                  <th className="px-10 py-5 text-right">{t('demandes.table.amount')}</th>
                  <th className="px-10 py-5 text-right">{t('demandes.table.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredDemandes.length > 0 ? (
                  filteredDemandes.map(d => (
                    <tr key={d.id} className="hover:bg-indigo-50/30 transition-all group">
                      <td className="px-10 py-6">
                        <div className="flex flex-col">
                           <div className="flex items-center gap-2 mb-1">
                             <span className="text-[9px] font-black text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100/30">#DEM-{d.id.substring(0, 4)}</span>
                             <p className="font-bold text-slate-900 text-sm">{d.client?.name}</p>
                           </div>
                           <p className="text-[10px] text-slate-400 font-bold mb-2">{t('demandes.table.sentAt')} {new Date(d.createdAt).toLocaleDateString()}</p>
                           <p className="text-[11px] text-slate-500 font-medium bg-slate-50 px-3 py-1 rounded-xl border border-slate-100 max-w-[220px] truncate italic">
                             {d.note || t('demandes.table.noDesc')}
                           </p>
                        </div>
                      </td>
                      <td className="px-10 py-6">
                        <DemandeStepper status={d.status} hasInvoice={false} />
                      </td>
                      <td className="px-10 py-6 text-right">
                        <div className="flex flex-col items-end">
                           <span className="text-sm font-black text-slate-900 tracking-tight font-display">{d.netToPay.toLocaleString(undefined, { minimumFractionDigits: 3 })}</span>
                           <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('common.tnd')}</span>
                        </div>
                      </td>
                      <td className="px-10 py-6 text-right">
                        <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          {d.status === 'PENDING' && (
                            <div className="relative">
                              <button
                                onClick={() => setRecording(recording === d.id ? null : d.id)}
                                className="bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black hover:bg-slate-800 transition-all shadow-md flex items-center gap-2"
                              >
                                {t('demandes.record').toUpperCase()}
                                <ChevronDown className={`w-3 h-3 transition-transform ${recording === d.id ? 'rotate-180' : ''}`} />
                              </button>
                              {recording === d.id && (
                                <div className="absolute right-0 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 z-20 flex flex-col gap-1 w-48 animate-in slide-in-from-top-2 duration-200">
                                  <button onClick={() => handleRecordResponse(d.id, 'ACCEPTED')} className="w-full flex items-center gap-3 px-3 py-2 text-[10px] font-black text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all">
                                    <div className="bg-emerald-100 p-1 rounded-lg"><CheckCircle2 className="w-3.5 h-3.5" /></div> {t('demandes.recordAccept').toUpperCase()}
                                  </button>
                                  <button onClick={() => handleRecordResponse(d.id, 'REJECTED')} className="w-full flex items-center gap-3 px-3 py-2 text-[10px] font-black text-rose-600 hover:bg-rose-50 rounded-xl transition-all">
                                    <div className="bg-rose-100 p-1 rounded-lg"><XCircle className="w-3.5 h-3.5" /></div> {t('demandes.recordReject').toUpperCase()}
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                          {d.status === 'ACCEPTED' && (
                            <button
                              onClick={() => handleConvert(d.id)}
                              disabled={converting === d.id}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-[10px] font-black transition-all shadow-md flex items-center gap-2"
                            >
                              {converting === d.id ? <Loader className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                              {t('demandes.createInvoice').toUpperCase()}
                            </button>
                          )}
                          {d.status === 'REJECTED' && (
                            <Badge variant="rejected" className="py-2 px-3">{t('demandes.rejected_label').toUpperCase()}</Badge>
                          )}
                          <button
                             onClick={() => window.open(`${api.defaults.baseURL}/devis/${d.id}/pdf`, '_blank')}
                             className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-slate-100 transition-all"
                             title="PDF"
                          >
                             <FileText className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="4" className="py-24 text-center">
                    <div className="flex flex-col items-center gap-4">
                       <div className="h-20 w-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mb-2 border border-slate-100">
                          <ClipboardList className="w-10 h-10 text-slate-200" />
                       </div>
                       <p className="text-slate-400 font-black uppercase text-xs tracking-widest">{t('demandes.none')}</p>
                    </div>
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {filteredDemandes.length > 0 ? (
              filteredDemandes.map(d => (
                <div key={d.id} className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 flex flex-col gap-6">
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col gap-2">
                       <span className="text-[9px] font-black text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100/30 self-start">#DEM-{d.id.substring(0, 4)}</span>
                       <h4 className="text-base font-black text-slate-900 font-display">{d.client?.name}</h4>
                       <p className="text-[10px] text-slate-400 font-bold">{new Date(d.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                       <span className="text-base font-black text-slate-900 tracking-tight font-display">{d.netToPay.toLocaleString(undefined, { minimumFractionDigits: 3 })}</span>
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('common.tnd')}</span>
                    </div>
                  </div>

                  <div className="py-4 border-y border-slate-50">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Pipeline</p>
                    <div className="flex justify-center">
                       <DemandeStepper status={d.status} hasInvoice={false} />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-[11px] text-slate-400 font-medium italic truncate max-w-[150px]">
                       {d.note || t('demandes.table.noDesc')}
                    </p>
                    <div className="flex gap-2">
                       <button
                          onClick={() => window.open(`${api.defaults.baseURL}/devis/${d.id}/pdf`, '_blank')}
                          className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-all border border-slate-100"
                       >
                          <FileText className="w-5 h-5" />
                       </button>
                       {d.status === 'PENDING' && (
                         <button
                           onClick={() => setRecording(recording === d.id ? null : d.id)}
                           className="bg-slate-900 text-white px-5 rounded-2xl text-[10px] font-black hover:bg-slate-800 transition-all shadow-md h-11"
                         >
                           {t('demandes.record').toUpperCase()}
                         </button>
                       )}
                       {d.status === 'ACCEPTED' && (
                         <button
                           onClick={() => handleConvert(d.id)}
                           className="bg-emerald-600 text-white px-5 rounded-2xl text-[10px] font-black transition-all shadow-md h-11"
                         >
                           <Zap className="w-4 h-4" />
                         </button>
                       )}
                    </div>
                  </div>

                  {recording === d.id && (
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <button onClick={() => handleRecordResponse(d.id, 'ACCEPTED')} className="flex items-center justify-center gap-2 px-4 py-3 text-[10px] font-black text-emerald-600 bg-emerald-50 rounded-2xl transition-all border border-emerald-100">
                        <CheckCircle2 className="w-4 h-4" /> {t('demandes.recordAccept').toUpperCase()}
                      </button>
                      <button onClick={() => handleRecordResponse(d.id, 'REJECTED')} className="flex items-center justify-center gap-2 px-4 py-3 text-[10px] font-black text-rose-600 bg-rose-50 rounded-2xl transition-all border border-rose-100">
                        <XCircle className="w-4 h-4" /> {t('demandes.recordReject').toUpperCase()}
                      </button>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-slate-400 text-sm font-medium italic bg-white rounded-3xl border border-dashed border-slate-200">
                {t('demandes.none')}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Help Tip */}
      <div className="mt-8 bg-indigo-50/50 border border-indigo-100/50 p-6 rounded-[2rem] flex items-start gap-5">
         <div className="bg-white p-3 rounded-2xl shadow-sm text-indigo-600">
            <Lightbulb className="w-6 h-6" />
         </div>
         <div className="flex-1">
           <h4 className="text-[10px] font-black text-indigo-900 uppercase tracking-widest mb-1">{t('demandes.guide.title')}</h4>
           <p className="text-xs text-indigo-800/70 font-medium leading-relaxed">
              {t('guide.demandes.tip')}
           </p>
         </div>
      </div>

      {showModal && <RequestModal clients={clients} onClose={() => setShowModal(false)} onSaved={fetchData} />}
    </div>
  );
};

export default Demandes;

