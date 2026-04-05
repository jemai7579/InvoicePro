import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { 
  CreditCard, 
  Search, 
  TrendingUp, 
  Calendar,
  CheckCircle2, 
  Clock,
  Loader2,
  AlertCircle,
  Building2,
  Euro
} from 'lucide-react';

const AdminSubscriptions = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await api.get('/admin/subscriptions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSubscriptions(res.data);
    } catch (err) {
      setError('Erreur lors du chargement des abonnements.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <Loader2 className="w-8 h-8 text-premium-600 animate-spin" />
      <p className="text-sm font-bold text-slate-500 animate-pulse uppercase tracking-widest">Chargement des abonnements...</p>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom duration-500">
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-4 mb-3">
             <div className="p-2.5 bg-premium-50 rounded-xl text-premium-600">
                <CreditCard className="w-5 h-5" />
             </div>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Actifs</p>
          </div>
          <p className="text-2xl font-black text-slate-900">{subscriptions.filter(s => s.status === 'ACTIVE').length}</p>
        </div>
        
        <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-4 mb-3">
             <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600">
                <TrendingUp className="w-5 h-5" />
             </div>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Taux de Rétention</p>
          </div>
          <p className="text-2xl font-black text-slate-900">92%</p>
        </div>

        <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="flex items-center gap-4 mb-3 relative z-10">
             <div className="p-2.5 bg-amber-50 rounded-xl text-amber-600 group-hover:scale-110 transition-transform">
                <Euro className="w-5 h-5" />
             </div>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Revenu Mensuel Est.</p>
          </div>
          <p className="text-2xl font-black text-slate-900 relative z-10">14,350 DT</p>
          <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <TrendingUp className="w-24 h-24 text-slate-900" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex items-center justify-between">
           <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Liste des abonnements</h3>
           <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 text-slate-500 rounded-xl text-[10px] font-bold border border-slate-100 cursor-not-allowed">
              <Calendar className="w-3.5 h-3.5" />
              Trier par: Date
           </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Entreprise</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Plan</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Début</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Statut</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {subscriptions.map((sub) => (
                <tr key={sub.id} className="hover:bg-slate-50/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs border border-slate-50 shadow-inner">
                        {sub.company.name.charAt(0)}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-slate-800 line-clamp-1">{sub.company.name}</span>
                        <span className="text-[10px] font-medium text-slate-400">{sub.company.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-premium-50 text-premium-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-premium-100/50">
                       PRO PLATINUM
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-[10px] font-bold text-slate-600 block">{new Date(sub.createdAt).toLocaleDateString('fr-TN')}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className={`mx-auto flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black tracking-widest uppercase ${
                      sub.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                    }`}>
                      {sub.status === 'ACTIVE' ? <CheckCircle2 className="w-2.5 h-2.5" /> : <Clock className="w-2.5 h-2.5" />}
                      {sub.status}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-xs font-black text-slate-400 hover:text-premium-600 transition-colors">Détails</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminSubscriptions;
