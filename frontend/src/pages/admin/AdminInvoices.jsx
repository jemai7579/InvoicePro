import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { 
  Receipt, 
  Search, 
  Filter, 
  ArrowUpRight, 
  Building2, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ArrowLeft,
  Loader2,
  FileCode2,
  ChevronRight
} from 'lucide-react';

const AdminInvoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await api.get('/admin/all-invoices', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInvoices(res.data);
    } catch (err) {
      setError('Erreur lors du chargement des factures.');
    } finally {
      setLoading(false);
    }
  };

  const filteredInvoices = invoices.filter(inv => 
    inv.id.toLowerCase().includes(search.toLowerCase()) || 
    inv.company.name.toLowerCase().includes(search.toLowerCase()) ||
    inv.client.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <Loader2 className="w-8 h-8 text-premium-600 animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      
      {/* Search & Stats Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 group-focus-within:text-premium-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Chercher par numéro, entreprise, client..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-2.5 ps-11 pe-4 text-sm focus:ring-4 focus:ring-premium-500/10 focus:border-premium-500 outline-none transition-all"
            />
          </div>
          <button className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-slate-50 text-slate-600 rounded-xl text-xs font-bold border border-slate-100 hover:bg-slate-100 transition-all">
            <Filter className="w-4 h-4" />
            Filtrer
          </button>
        </div>

        <div className="bg-premium-600 p-6 rounded-[24px] shadow-lg shadow-premium-100 flex items-center justify-between group overflow-hidden relative">
           <div className="relative z-10">
              <p className="text-white/60 text-[10px] font-black uppercase tracking-widest mb-1">Moyenne plateforme</p>
              <p className="text-2xl font-black text-white">450.5 DT</p>
           </div>
           <Receipt className="w-16 h-16 text-white/10 absolute -right-4 -bottom-4 rotate-12 group-hover:rotate-0 transition-transform duration-500" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-50">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-20">Réf</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Émetteur</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Date</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Total TTC</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Statut TTN</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-slate-900 line-clamp-1">#{inv.id.slice(0, 8)}</span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">{inv.ttnStatus || 'LOCAL'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-[10px]">
                        {inv.company.name.charAt(0)}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-slate-800 line-clamp-1">{inv.company.name}</span>
                        <span className="text-[10px] font-medium text-slate-400">Vers: {inv.client.name}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-[10px] font-bold text-slate-600 block">{new Date(inv.createdAt).toLocaleDateString('fr-TN')}</span>
                    <span className="text-[9px] text-slate-400 tracking-tighter italic">Source: App</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-sm font-black text-slate-900">{inv.totalTTC.toFixed(2)} DT</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className={`mx-auto flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black tracking-widest uppercase border ${
                      inv.status === 'VALIDATED' || inv.status === 'PAID' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                      inv.status === 'REJECTED' ? 'bg-red-50 text-red-600 border-red-100' : 
                      'bg-amber-50 text-amber-600 border-amber-100'
                    }`}>
                      {inv.status === 'VALIDATED' || inv.status === 'PAID' ? <CheckCircle2 className="w-2.5 h-2.5" /> : 
                       inv.status === 'REJECTED' ? <XCircle className="w-2.5 h-2.5" /> : 
                       <Clock className="w-2.5 h-2.5" />}
                      {inv.status}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 text-slate-300 hover:text-premium-600 transition-colors opacity-0 group-hover:opacity-100">
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredInvoices.length === 0 && (
          <div className="p-12 text-center">
            <Receipt className="w-12 h-12 text-slate-100 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-400">Aucune facture ne correspond à votre recherche.</p>
          </div>
        )}
      </div>

    </div>
  );
};

export default AdminInvoices;
