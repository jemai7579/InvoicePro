import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Plus, Trash2, X, Loader, PlusCircle, MinusCircle, FileText, CheckCircle, Send, Download } from 'lucide-react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

const Devis = () => {
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

  const getStatusColor = (currentStatus) => {
    switch(currentStatus?.toLowerCase()) {
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Devis</h1>
          <p className="text-sm text-gray-500">Gérer les devis et estimations clients</p>
        </div>
        <button 
          onClick={openModal}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" /> Nouveau Devis
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID Devis</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {devisList.length > 0 ? (
                  devisList.map((devis) => (
                    <tr key={devis.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {devis.id.slice(0, 8).toUpperCase()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{devis.client?.name || 'Client Inconnu'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {new Date(devis.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(devis.status)}`}>
                          {devis.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                        {devis.netToPay.toLocaleString(undefined, { minimumFractionDigits: 3 })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button 
                            onClick={() => handleSendEmail(devis.id)}
                            className="text-gray-400 hover:text-purple-600 p-1 transition-colors"
                            title="Send via Email"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDownloadPdf(devis.id)}
                            className="text-gray-400 hover:text-blue-600 p-1 transition-colors"
                            title="Download PDF"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleConvertToInvoice(devis.id)}
                            className="text-gray-400 hover:text-green-600 p-1 transition-colors"
                            title="Convert to Invoice"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(devis.id)}
                            className="text-gray-400 hover:text-red-600 p-1 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-sm text-gray-500">
                      Aucun devis trouvé. Cliquez sur "Nouveau Devis" pour générer des estimations.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
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
                    <PlusCircle className="h-4 w-4 mr-2 text-gray-400" />
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
                  {isSubmitting ? <Loader className="w-4 h-4 animate-spin mr-2" /> : null}
                  Enregistrer
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </Layout>
  );
};

export default Devis;
