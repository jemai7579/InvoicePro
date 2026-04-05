import React, { useState, useEffect } from 'react';
import { Plus, Trash2, X, Loader, PlusCircle, MinusCircle, Download, FileCode, CheckCircle2, Send, AlertCircle } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { useLanguage } from '../context/LanguageContext';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Zap, ArrowRight, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const { t } = useLanguage();
  const { user, refreshUser } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isQuotaModalOpen, setIsQuotaModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Form State
  const [clientId, setClientId] = useState('');
  const [status, setStatus] = useState('DRAFT');
  const [lines, setLines] = useState([
    { description: '', quantity: 1, unitPrice: 0, tvaRate: 19 }
  ]);

  const fetchData = async () => {
    try {
      const [invoicesRes, clientsRes] = await Promise.all([
        api.get('/invoices'),
        api.get('/clients')
      ]);
      setInvoices(invoicesRes.data);
      setClients(clientsRes.data);
    } catch (error) {
      console.error('Error fetching data', error);
      alert(t('common.error_load'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Auto-open modal if coming from Dashboard with ?new=true
  useEffect(() => {
    if (!loading && searchParams.get('new') === 'true') {
      openModal();
    }
  }, [loading, searchParams]);

  const openModal = () => {
    // Check quota for Starter plan
    if (user?.subscription?.plan === 'STARTER' && user?.subscription?.remainingInvoices === 0) {
      setIsQuotaModalOpen(true);
      return;
    }
    
    setClientId('');
    setStatus('DRAFT');
    setLines([{ description: '', quantity: 1, unitPrice: 0, tvaRate: 19 }]);
    setErrors({});
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleAddLine = () => {
    setLines([...lines, { description: '', quantity: 1, unitPrice: 0, tvaRate: 19 }]);
  };

  const handleRemoveLine = (index) => {
    const newLines = [...lines];
    newLines.splice(index, 1);
    setLines(newLines);
  };

  const handleLineChange = (index, field, value) => {
    const newLines = [...lines];
    newLines[index][field] = value;
    setLines(newLines);
    
    // Clear error for this field if it exists
    if (errors[`line_${index}_${field}`]) {
      const newErrors = { ...errors };
      delete newErrors[`line_${index}_${field}`];
      setErrors(newErrors);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!clientId) newErrors.clientId = t('error.clientRequired') || 'Veuillez sélectionner un client';
    
    lines.forEach((line, index) => {
      if (!line.description) newErrors[`line_${index}_description`] = t('error.descriptionRequired') || 'Description requise';
      if (line.quantity <= 0) newErrors[`line_${index}_quantity`] = t('error.invalidQuantity') || 'Qté > 0';
      if (line.unitPrice < 0) newErrors[`line_${index}_unitPrice`] = t('error.invalidPrice') || 'Prix >= 0';
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Calculate Totals for Modal Preview
  const subtotalHT = lines.reduce((acc, line) => acc + (line.quantity * line.unitPrice), 0);
  const totalTVA = lines.reduce((acc, line) => acc + (line.quantity * line.unitPrice * (line.tvaRate / 100)), 0);
  const totalTTC = subtotalHT + totalTVA + 1.0; // Adding dummy 1.0 for stamp duty

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        clientId,
        status,
        lines
      };
      
      await api.post('/invoices', payload);
      await refreshUser(); // Update the counter immediately
      fetchData();
      closeModal();
    } catch (error) {
      console.error('Error saving invoice', error);
      alert(error.response?.data?.message || t('settings.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case 'PAID':
      case 'VALIDATED': return 'success';
      case 'REJECTED': return 'danger';
      case 'SENT_TO_TTN': return 'primary';
      case 'PENDING_VALIDATION': return 'warning';
      default: return 'secondary';
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      setLoading(true);
      await api.patch(`/invoices/${id}/status`, { status: newStatus });
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Error updating status');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitTTN = async (id) => {
    try {
      if (!window.confirm(t('common.confirm_submit'))) return;
      await api.post(`/invoices/${id}/submit-ttn`);
      alert(t('common.success_submit'));
      fetchData();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Error submitting to TTN');
    }
  };

  const handleDownloadXml = async (id) => {
    try {
      const response = await api.get(`/invoices/${id}/xml`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${id.slice(0, 8)}.xml`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (error) {
      console.error('Error downloading XML', error);
      alert(t('common.error_download'));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm(t('invoices.form.confirm_delete'))) {
      try {
        await api.delete(`/invoices/${id}`);
        fetchData();
      } catch (error) {
        console.error('Error deleting invoice', error);
        alert(t('common.error_delete'));
      }
    }
  };

  const handleDownloadPdf = async (id) => {
    try {
      const response = await api.get(`/invoices/${id}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${id.slice(0, 8)}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (error) {
      console.error('Error downloading PDF', error);
      alert(t('common.error_download'));
    }
  };

  const handleSendEmail = async (id) => {
    try {
      if (!window.confirm(t('invoices.form.send_email_confirm'))) return;
      const res = await api.post(`/invoices/${id}/send-email`);
      if (res.data.previewUrl) {
          alert(t('invoices.form.success_email') + ' (Preview: ' + res.data.previewUrl + ')');
      } else {
          alert(t('invoices.form.success_email'));
      }
    } catch (error) {
      console.error('Error sending email', error);
      alert(t('common.error_send'));
    }
  };

  const filteredInvoices = invoices;

  return (
    <div className="animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div>
          <h2 className="text-2xl font-black text-slate-900 font-display tracking-tight uppercase">{t('invoices.title')}</h2>
          <p className="text-sm text-slate-500 font-medium">{t('invoices.subtitle')}</p>
        </div>
        <Button onClick={openModal} icon={Plus} className="!rounded-2xl shadow-lg shadow-premium-100">
          {t('invoices.new')}
        </Button>
      </div>

      {loading && !invoices.length ? (
        <div className="py-20 flex flex-col items-center gap-4">
          <Loader className="w-10 h-10 animate-spin text-premium-600" />
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Synchronisation des factures...</p>
        </div>
      ) : (
        <Card noPadding className="overflow-hidden border-slate-100">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('invoices.table.id')}</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('invoices.table.client')}</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('invoices.table.date')}</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('invoices.table.status')}</th>
                  <th className="px-6 py-4 text-end text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('invoices.table.total')}</th>
                  <th className="px-6 py-4 text-end text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredInvoices.length > 0 ? (
                  filteredInvoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-slate-50/30 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-black text-slate-900 font-display uppercase tracking-tight">#{invoice.id.slice(0, 8)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-900 font-bold">{invoice.client?.name || t('invoices.table.unknownClient')}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-[11px] text-slate-500 font-black">
                          {new Date(invoice.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                         <div className="relative group max-w-[140px]">
                           <select
                             value={invoice.status}
                             onChange={(e) => handleStatusChange(invoice.id, e.target.value)}
                             className={`w-full rounded-xl px-3 py-1.5 border appearance-none cursor-pointer transition-all focus:ring-4 focus:ring-premium-100 outline-none text-[10px] font-black ${
                                 invoice.status === 'PAID' || invoice.status === 'VALIDATED' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                 invoice.status === 'REJECTED' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                                 invoice.status === 'SENT_TO_TTN' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                                 invoice.status === 'PENDING_VALIDATION' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                 'bg-slate-100 text-slate-600 border-slate-200'
                             }`}
                           >
                             <option value="DRAFT">{t('status.draft')}</option>
                             <option value="PENDING_VALIDATION">{t('status.pending_validation')}</option>
                             <option value="SENT_TO_TTN">{t('status.sent_to_ttn')}</option>
                             <option value="VALIDATED">{t('status.validated')}</option>
                             <option value="PAID">{t('status.paid')}</option>
                             <option value="REJECTED">{t('status.rejected')}</option>
                           </select>
                         </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-end text-sm font-black text-slate-900 font-display">
                        {invoice.netToPay.toLocaleString(undefined, { minimumFractionDigits: 3 })} <span className="text-[10px] text-slate-400 font-bold ms-1">{t('common.tnd')}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-end">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {invoice.status !== 'VALIDATED' && (
                            <button onClick={() => handleSubmitTTN(invoice.id)} className="p-2 text-slate-400 hover:text-orange-500 transition-colors" title={t('common.submit')}>
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          )}
                          <button onClick={() => handleSendEmail(invoice.id)} className="p-2 text-slate-400 hover:text-purple-600 transition-colors" title={t('invoices.form.send_email_confirm')}>
                            <Send className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDownloadXml(invoice.id)} className="p-2 text-slate-400 hover:text-emerald-600 transition-colors" title={t('teif.table.tooltip_download')}>
                            <FileCode className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDownloadPdf(invoice.id)} className="p-2 text-slate-400 hover:text-blue-600 transition-colors" title="Download PDF">
                            <Download className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(invoice.id)} className="p-2 text-slate-400 hover:text-rose-600 transition-colors" title={t('common.delete')}>
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-sm text-slate-400 italic">
                      {t('invoices.empty')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden p-4 space-y-4">
            {filteredInvoices.length > 0 ? (
              filteredInvoices.map((invoice) => (
                <div key={invoice.id} className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 flex flex-col gap-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('invoices.table.id')}</p>
                      <h4 className="text-sm font-black text-slate-900 uppercase">#{invoice.id.slice(0, 8)}</h4>
                    </div>
                    <Badge variant={getStatusVariant(invoice.status)}>
                      {t(`status.${invoice.status.toLowerCase()}`) || invoice.status}
                    </Badge>
                  </div>
                  
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('invoices.table.client')}</p>
                    <p className="text-sm font-bold text-slate-700">{invoice.client?.name || t('invoices.table.unknownClient')}</p>
                  </div>
                  
                  <div className="flex justify-between items-end pt-4 border-t border-slate-50">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('invoices.table.total')}</p>
                      <p className="text-lg font-black text-slate-900 font-display">
                        {invoice.netToPay.toLocaleString(undefined, { minimumFractionDigits: 3 })} <span className="text-xs">{t('common.tnd')}</span>
                      </p>
                    </div>
                    <div className="flex gap-2">
                       <button onClick={() => handleDownloadPdf(invoice.id)} className="p-3 bg-slate-50 rounded-2xl text-slate-600">
                          <Download className="w-5 h-5" />
                       </button>
                       <button onClick={() => handleSendEmail(invoice.id)} className="p-3 bg-slate-50 rounded-2xl text-slate-600">
                          <Send className="w-5 h-5" />
                       </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-slate-400 text-sm font-medium italic">
                {t('invoices.empty')}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-sm flex justify-center py-10 px-4 sm:px-6">
          <Card 
            className="w-full max-w-4xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-300 shadow-[0_30px_100px_-20px_rgba(0,0,0,0.15)]"
            noPadding
            title={t('invoices.form.title')}
            action={
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-xl transition-all">
                <X className="h-5 w-5" />
              </button>
            }
          >
            <div className="p-8 flex-1 overflow-y-auto custom-scrollbar">
              <form id="invoice-form" className="space-y-10" onSubmit={handleSubmit}>
                
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-xs shadow-sm shadow-indigo-100">01</div>
                    <div>
                       <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em]">{t('invoices.form.detailsTitle')}</h3>
                       <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Configuration du document</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 ps-14">
                    <Select
                      label={t('invoices.form.selectClient')}
                      value={clientId}
                      onChange={(e) => {
                        setClientId(e.target.value);
                        if (errors.clientId) setErrors(prev => {
                          const n = {...prev};
                          delete n.clientId;
                          return n;
                        });
                      }}
                      error={errors.clientId}
                      options={[
                        { value: '', label: t('invoices.form.selectClientPlaceholder'), disabled: true },
                        ...clients.map(c => ({ value: c.id, label: c.name }))
                      ]}
                    />
                    <Select
                      label={t('invoices.form.initialStatus')}
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      options={[
                        { value: 'DRAFT', label: t('status.draft') },
                        { value: 'SENT_TO_TTN', label: t('status.sent_to_ttn') },
                        { value: 'PENDING_VALIDATION', label: t('status.pending_validation') },
                        { value: 'VALIDATED', label: t('status.validated') }
                      ]}
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-xs shadow-sm shadow-indigo-100">02</div>
                      <div>
                         <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em]">{t('invoices.form.linesTitle')}</h3>
                         <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Éléments de facturation</p>
                      </div>
                    </div>
                    <Button 
                      type="button" 
                      variant="secondary" 
                      onClick={handleAddLine} 
                      size="sm"
                      icon={PlusCircle}
                      className="!rounded-2xl border-indigo-100 text-indigo-600 hover:bg-indigo-50"
                    >
                      {t('invoices.form.addLine')}
                    </Button>
                  </div>
                  
                  <div className="space-y-4 ps-14">
                    {lines.map((line, index) => (
                      <div key={index} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100 relative group hover:bg-white hover:shadow-xl hover:border-indigo-100/50 transition-all">
                          
                          <div className="md:col-span-1 pt-8 flex justify-center">
                            <button 
                              type="button" 
                              onClick={() => handleRemoveLine(index)}
                              className="text-slate-300 hover:text-rose-500 p-2 lg:-ms-2 rounded-xl hover:bg-rose-50 transition-all disabled:opacity-20"
                              disabled={lines.length === 1}
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                          
                          <div className="md:col-span-4">
                            <Input
                              label={t('invoices.form.desc')}
                              placeholder={t('invoices.form.placeholder_desc')}
                              value={line.description}
                              onChange={(e) => handleLineChange(index, 'description', e.target.value)}
                              error={errors[`line_${index}_description`]}
                            />
                          </div>
                          
                          <div className="md:col-span-2">
                            <Input
                              type="number"
                              label={t('invoices.form.qte')}
                              value={line.quantity}
                              onChange={(e) => handleLineChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                              error={errors[`line_${index}_quantity`]}
                            />
                          </div>

                          <div className="md:col-span-2">
                            <Input
                              type="number"
                              label={t('invoices.form.pu')}
                              value={line.unitPrice}
                              onChange={(e) => handleLineChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                              error={errors[`line_${index}_unitPrice`]}
                            />
                          </div>

                          <div className="md:col-span-2">
                            <Select
                              label={t('invoices.form.tva')}
                              value={line.tvaRate}
                              onChange={(e) => handleLineChange(index, 'tvaRate', parseFloat(e.target.value))}
                              options={[
                                { value: 19, label: '19%' },
                                { value: 13, label: '13%' },
                                { value: 7, label: '7%' },
                                { value: 0, label: '0%' }
                              ]}
                            />
                          </div>

                          <div className="md:col-span-1 text-end pt-8">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('invoices.form.total')}</p>
                            <p className="text-sm font-black text-slate-900 font-display">
                              {(line.quantity * line.unitPrice).toLocaleString(undefined, { minimumFractionDigits: 3 })}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {Object.keys(errors).some(k => k.startsWith('line_')) && (
                       <div className="flex items-center gap-2 px-4 py-3 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 animate-in fade-in slide-in-from-top-2">
                          <AlertCircle className="w-4 h-4" />
                          <p className="text-[10px] font-black uppercase tracking-widest">{t('error.fixBellowLines') || "Veuillez corriger les erreurs dans les lignes ci-dessus"}</p>
                       </div>
                    )}
                  </div>
                </div>
              </form>
            </div>
            
            <div className="bg-slate-50 p-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-8 rounded-b-[2.5rem]">
              <div className="w-full md:w-80 bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-3 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-indigo-500/10 transition-colors"></div>
                <div className="flex justify-between text-[11px] font-black text-slate-400 uppercase tracking-widest">
                  <span>{t('invoices.form.subtotal')}</span>
                  <span className="text-slate-900">{subtotalHT.toLocaleString(undefined, { minimumFractionDigits: 3 })}</span>
                </div>
                <div className="flex justify-between text-[11px] font-black text-slate-400 uppercase tracking-widest">
                  <span>{t('invoices.form.totalTva')}</span>
                  <span className="text-slate-900">{totalTVA.toLocaleString(undefined, { minimumFractionDigits: 3 })}</span>
                </div>
                <div className="flex justify-between text-[11px] font-black text-slate-400 uppercase tracking-widest underline decoration-dotted decoration-slate-200 cursor-help" title="Timbre fiscal fixe">
                  <span>{t('invoices.form.stampDuty')}</span>
                  <span className="text-slate-900">1.000</span>
                </div>
                <div className="border-t border-slate-100 pt-4 flex justify-between items-center relative z-10">
                  <span className="font-black text-slate-900 text-sm uppercase tracking-tight">{t('invoices.form.totalTtc')}</span>
                  <span className="text-2xl font-black text-indigo-600 font-display">
                    {totalTTC.toLocaleString(undefined, { minimumFractionDigits: 3 })} <span className="text-xs">{t('common.tnd')}</span>
                  </span>
                </div>
              </div>

              <div className="flex gap-4 w-full md:w-auto">
                <Button variant="ghost" onClick={closeModal} className="flex-1 md:flex-none !rounded-2xl">
                  {t('form.cancel')}
                </Button>
                <Button 
                  type="submit" 
                  form="invoice-form" 
                  loading={isSubmitting} 
                  className="flex-1 md:flex-none shadow-xl shadow-indigo-200 !rounded-2xl h-14 px-10" 
                  icon={CheckCircle2}
                >
                  {t('invoices.form.generate')}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
      {/* Quota Exceeded Modal */}
      {isQuotaModalOpen && (
        <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl animate-in zoom-in duration-300 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-60"></div>
            
            <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mb-6 border border-rose-100">
              <ShieldAlert size={32} />
            </div>
            
            <h3 className="text-2xl font-black text-slate-900 mb-4 font-display leading-tight">Quota Starter Épuisé</h3>
            <p className="text-slate-500 font-medium mb-8 leading-relaxed">
              Vous avez atteint votre limite de <span className="font-bold text-slate-900">7 factures</span> pour ce mois. Passez à l'offre Professional pour créer des factures en illimité et accéder à l'IA.
            </p>
            
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => navigate('/settings?tab=subscription')}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-indigo-600 transition-all shadow-lg active:scale-95"
              >
                Passer à Professional
                <Zap size={18} fill="currentColor" />
              </button>
              <button 
                onClick={() => setIsQuotaModalOpen(false)}
                className="w-full py-4 bg-slate-50 text-slate-500 rounded-2xl font-bold hover:bg-slate-100 transition-all"
              >
                Plus tard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Invoices;
