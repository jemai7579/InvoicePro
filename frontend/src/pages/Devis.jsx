import React, { useState, useEffect } from 'react';
import { Plus, Trash2, X, Loader, PlusCircle, MinusCircle, FileText, CheckCircle2, Send, Download, Search } from 'lucide-react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';

const Devis = () => {
  const { t } = useLanguage();
  const [devisList, setDevisList] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  // Form State
  const [clientId, setClientId] = useState('');
  const [status, setStatus] = useState('PENDING');
  const [lines, setLines] = useState([
    { description: '', quantity: 1, unitPrice: 0, tvaRate: 19 }
  ]);

  const fetchData = async () => {
    try {
      const [devisRes, clientsRes] = await Promise.all([
        api.get('/devis'),
        api.get('/clients')
      ]);
      setDevisList(devisRes.data);
      setClients(clientsRes.data);
    } catch (error) {
      console.error('Error fetching data', error);
      alert('Failed to load devis and clients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openModal = () => {
    setClientId('');
    setStatus('PENDING');
    setLines([{ description: '', quantity: 1, unitPrice: 0, tvaRate: 19 }]);
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
  };

  const subtotalHT = lines.reduce((acc, line) => acc + (line.quantity * line.unitPrice), 0);
  const totalTVA = lines.reduce((acc, line) => acc + (line.quantity * line.unitPrice * (line.tvaRate / 100)), 0);
  const totalTTC = subtotalHT + totalTVA + 1.0; 

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!clientId) {
      return alert('Please select a client');
    }
    if (lines.length === 0 || lines.some(l => !l.description)) {
      return alert('Please add at least one valid product line');
    }

    setIsSubmitting(true);
    try {
      const payload = {
        clientId,
        status,
        lines
      };
      
      await api.post('/devis', payload);
      fetchData();
      closeModal();
    } catch (error) {
      console.error('Error saving devis', error);
      alert(error.response?.data?.message || 'Failed to save devis');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this quote?')) {
      try {
        await api.delete(`/devis/${id}`);
        fetchData();
      } catch (error) {
        console.error('Error deleting devis', error);
        alert('Failed to delete quote');
      }
    }
  };

  const handleSendEmail = async (id) => {
    try {
      if (!window.confirm('Send this quote to the client?')) return;
      const res = await api.post(`/devis/${id}/send-email`);
      if (res.data.previewUrl) {
          alert('Email sent successfully! Preview URL (Ethereal): ' + res.data.previewUrl);
      } else {
          alert('Email sent successfully!');
      }
      fetchData();
    } catch (error) {
      console.error('Error sending email', error);
      alert(error.response?.data?.message || 'Failed to send email');
    }
  };

  const handleDownloadPdf = async (id) => {
    try {
      const response = await api.get(`/devis/${id}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `devis-${id.slice(0, 8)}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (error) {
      console.error('Error downloading PDF', error);
      alert('Failed to download PDF');
    }
  };

  const handleConvertToInvoice = async (id) => {
    if (window.confirm('Convert this Quote to an Invoice?')) {
      try {
        const res = await api.post(`/devis/${id}/convert`);
        navigate('/invoices');
      } catch (error) {
        console.error('Error converting devis', error);
        alert(error.response?.data?.message || 'Failed to convert to invoice');
      }
    }
  };

  const [searchTerm, setSearchTerm] = useState('');

  const filteredDevis = devisList.filter(d => 
    d.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.client?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="pb-12 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div>
          <h2 className="text-2xl font-black text-slate-900 font-display tracking-tight">{t('nav.devis') || 'Devis'}</h2>
          <p className="text-sm text-slate-500 font-medium">Gérer les devis et estimations clients</p>
        </div>
        <button 
          onClick={openModal}
          className="inline-flex items-center px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-2xl shadow-lg shadow-indigo-100 transition-all active:scale-95 group w-full md:w-auto justify-center"
        >
          <Plus className="h-4 w-4 me-2 group-hover:rotate-90 transition-transform" />
          Nouveau Devis
        </button>
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
            {filteredDevis.length} {t('common.results') || 'Items'}
          </span>
        </div>
      </div>

      {/* Devis Display */}
      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 bg-white rounded-[2rem] border border-slate-100 shadow-sm">
          <div className="w-10 h-10 border-4 border-indigo-500/10 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
          <p className="text-slate-400 text-xs font-black uppercase tracking-widest">{t('common.loading')}</p>
        </div>
      ) : (
        <Card noPadding className="border-none shadow-sm bg-transparent md:bg-white overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-left">
              <thead className="bg-slate-50/50 text-slate-400 text-[10px] font-black tracking-widest uppercase">
                <tr>
                  <th className="px-8 py-5">ID Devis</th>
                  <th className="px-8 py-5">Client</th>
                  <th className="px-8 py-5">Date</th>
                  <th className="px-8 py-5">Statut</th>
                  <th className="px-8 py-5 text-end">Total</th>
                  <th className="px-8 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-50">
                {filteredDevis.length > 0 ? (
                  filteredDevis.map((devis) => (
                    <tr key={devis.id} className="hover:bg-slate-50/50 transition-all group">
                      <td className="px-8 py-6">
                        <span className="text-sm font-bold text-slate-900">{devis.id.slice(0, 8).toUpperCase()}</span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="text-sm font-bold text-slate-700">{devis.client?.name || 'Client Inconnu'}</div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="text-xs font-medium text-slate-400">
                          {new Date(devis.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <Badge variant={devis.status.toLowerCase() === 'accepted' ? 'success' : devis.status.toLowerCase() === 'rejected' ? 'rejected' : 'pending'}>
                          {devis.status}
                        </Badge>
                      </td>
                      <td className="px-8 py-6 text-end">
                        <div className="text-sm font-black text-slate-900">
                          {devis.netToPay.toLocaleString(undefined, { minimumFractionDigits: 3 })}
                          <span className="text-[10px] text-slate-400 ms-1 font-bold">TND</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleSendEmail(devis.id)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-xl shadow-sm transition-all border border-transparent hover:border-slate-100" title="Send Email">
                            <Send className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDownloadPdf(devis.id)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-white rounded-xl shadow-sm transition-all border border-transparent hover:border-slate-100" title="Download PDF">
                            <Download className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleConvertToInvoice(devis.id)} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-white rounded-xl shadow-sm transition-all border border-transparent hover:border-slate-100" title="Convert to Invoice">
                            <FileText className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(devis.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-white rounded-xl shadow-sm transition-all border border-transparent hover:border-slate-100" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-8 py-20 text-center">
                       <div className="flex flex-col items-center max-w-xs mx-auto text-center">
                        <div className="h-20 w-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mb-6 border border-slate-100">
                          <FileText className="w-10 h-10 text-slate-200" />
                        </div>
                        <h3 className="text-slate-400 font-black uppercase text-xs tracking-widest">Aucun devis trouvé</h3>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4 px-4 pb-4">
            {filteredDevis.length > 0 ? (
              filteredDevis.map((devis) => (
                <div key={devis.id} className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 flex flex-col gap-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">ID DEVIS</p>
                      <h4 className="text-sm font-bold text-slate-900">{devis.id.slice(0, 8).toUpperCase()}</h4>
                    </div>
                    <Badge variant={devis.status.toLowerCase() === 'accepted' ? 'success' : devis.status.toLowerCase() === 'rejected' ? 'rejected' : 'pending'}>
                      {devis.status}
                    </Badge>
                  </div>
                  
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">CLIENT</p>
                    <p className="text-sm font-bold text-slate-700">{devis.client?.name || 'Client Inconnu'}</p>
                    <p className="text-[10px] text-slate-400 font-medium">{new Date(devis.createdAt).toLocaleDateString()}</p>
                  </div>
                  
                  <div className="flex justify-between items-end pt-4 border-t border-slate-50">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">TOTAL</p>
                      <p className="text-lg font-black text-slate-900 font-display">
                        {devis.netToPay.toLocaleString(undefined, { minimumFractionDigits: 3 })} <span className="text-xs">TND</span>
                      </p>
                    </div>
                    <div className="flex gap-2">
                       <button onClick={() => handleDownloadPdf(devis.id)} className="p-2.5 bg-slate-50 rounded-xl text-slate-500 hover:bg-premium-50 hover:text-premium-600 transition-all">
                          <Download className="w-4 h-4" />
                       </button>
                       <button onClick={() => handleConvertToInvoice(devis.id)} className="p-2.5 bg-slate-50 rounded-xl text-slate-500 hover:bg-premium-50 hover:text-premium-600 transition-all">
                          <FileText className="w-4 h-4" />
                       </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-slate-400 text-sm font-medium italic bg-white rounded-3xl border border-dashed border-slate-200">
                Aucun devis trouvé.
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Full Screen Modal Overlay for Devis Creation */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-500 bg-opacity-75 flex justify-center py-10 px-4 sm:px-6">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh]">
            
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Créer un Nouveau Devis</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-500">
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6 flex-1 overflow-y-auto">
              <form id="devis-form" className="space-y-6" onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sélectionner un Client *</label>
                    <select
                      required
                      value={clientId}
                      onChange={(e) => setClientId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm bg-white"
                    >
                      <option value="" disabled>-- Sélectionner un client --</option>
                      {clients.map(client => (
                        <option key={client.id} value={client.id}>{client.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm bg-white"
                    >
                      <option value="PENDING">En attente</option>
                      <option value="ACCEPTED">Accepté</option>
                      <option value="REJECTED">Rejeté</option>
                    </select>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">Lignes de Devis</h3>
                  <div className="hidden md:grid grid-cols-12 gap-4 mb-2 text-xs font-medium text-gray-500 uppercase">
                    <div className="col-span-1"></div>
                    <div className="col-span-4">Produit / Description</div>
                    <div className="col-span-2">Quantité</div>
                    <div className="col-span-2">Prix Unitaire (HT)</div>
                    <div className="col-span-2">TVA (%)</div>
                    <div className="col-span-1 text-right">Total</div>
                  </div>

                  <div className="space-y-3">
                    {lines.map((line, index) => (
                      <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-white p-3 md:p-0 rounded-lg border border-gray-200 md:border-none shadow-sm md:shadow-none">
                        <div className="col-span-1 flex justify-center md:justify-start">
                          <button 
                            type="button" 
                            onClick={() => handleRemoveLine(index)}
                            className="text-red-400 hover:text-red-600 focus:outline-none"
                            disabled={lines.length === 1}
                          >
                            <MinusCircle className="w-5 h-5" />
                          </button>
                        </div>
                        
                        <div className="col-span-4">
                          <input
                            type="text"
                            required
                            placeholder="Description de l'article"
                            value={line.description}
                            onChange={(e) => handleLineChange(index, 'description', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                          />
                        </div>
                        
                        <div className="col-span-2">
                          <input
                            type="number"
                            min="1"
                            step="0.01"
                            required
                            value={line.quantity}
                            onChange={(e) => handleLineChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                          />
                        </div>

                        <div className="col-span-2">
                          <input
                            type="number"
                            min="0"
                            step="0.001"
                            required
                            value={line.unitPrice}
                            onChange={(e) => handleLineChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                          />
                        </div>

                        <div className="col-span-2">
                          <select
                            value={line.tvaRate}
                            onChange={(e) => handleLineChange(index, 'tvaRate', parseFloat(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                          >
                            <option value={19}>19%</option>
                            <option value={13}>13%</option>
                            <option value={7}>7%</option>
                            <option value={0}>0%</option>
                          </select>
                        </div>

                        <div className="col-span-1 text-right font-medium text-gray-900 text-sm">
                          {(line.quantity * line.unitPrice).toLocaleString(undefined, { minimumFractionDigits: 3 })}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <button 
                    type="button" 
                    onClick={handleAddLine}
                    className="mt-4 inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    <PlusCircle className="h-4 w-4 me-2 text-gray-400" />
                    Ajouter un Produit
                  </button>
                </div>
              </form>
            </div>
            
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex flex-col md:flex-row justify-between items-end gap-6">
              <div className="w-full md:w-64 bg-white p-4 rounded-lg border border-gray-200 shadow-sm space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Sous-total HT :</span>
                  <span className="font-medium">{subtotalHT.toLocaleString(undefined, { minimumFractionDigits: 3 })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Total TVA :</span>
                  <span className="font-medium">{totalTVA.toLocaleString(undefined, { minimumFractionDigits: 3 })}</span>
                </div>
                <div className="border-t border-gray-100 pt-2 mt-2 flex justify-between items-center">
                  <span className="font-semibold text-gray-900">Total TTC (Est) :</span>
                  <span className="text-base font-bold text-blue-600">{totalTTC.toLocaleString(undefined, { minimumFractionDigits: 3 })}</span>
                </div>
              </div>

              <div className="flex gap-3 w-full md:w-auto">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 md:flex-none justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  form="devis-form"
                  disabled={isSubmitting}
                  className="flex-1 md:flex-none inline-flex justify-center items-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 disabled:bg-blue-400"
                >
                  {isSubmitting ? <Loader className="w-4 h-4 animate-spin me-2" /> : null}
                  Enregistrer
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default Devis;

