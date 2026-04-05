import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { 
  Activity, 
  User, 
  Terminal, 
  Clock, 
  Search,
  Filter,
  Loader2,
  AlertCircle,
  ShieldCheck,
  Globe,
  Settings,
  LogIn
} from 'lucide-react';

const AdminActivity = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await api.get('/admin/logs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLogs(res.data);
    } catch (err) {
      setError('Erreur lors du chargement des logs d\'activité.');
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'LOGIN': return <LogIn className="w-4 h-4 text-emerald-500" />;
      case 'UPDATE_COMPANY_STATUS': return <Activity className="w-4 h-4 text-amber-500" />;
      case 'UPDATE_SYSTEM_SETTING': return <Settings className="w-4 h-4 text-premium-500" />;
      case 'SEND_GLOBAL_NOTIFICATION': return <Globe className="w-4 h-4 text-blue-500" />;
      default: return <Terminal className="w-4 h-4 text-slate-500" />;
    }
  };

  const filteredLogs = logs.filter(log => 
    log.action.toLowerCase().includes(search.toLowerCase()) || 
    log.details.toLowerCase().includes(search.toLowerCase()) ||
    log.admin.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4 text-slate-400">
      <Loader2 className="w-8 h-8 text-premium-600 animate-spin" />
      <p className="text-sm font-bold uppercase tracking-widest animate-pulse">Consultation de l'audit trail...</p>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      
      {/* Header & Filter */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
           <div className="p-3 bg-slate-100 rounded-2xl text-slate-500">
              <ShieldCheck className="w-6 h-6" />
           </div>
           <div>
              <h3 className="text-sm font-black text-slate-900 uppercase">Journal d'Audit Système</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Traçabilité complète des actions administratives</p>
           </div>
        </div>
        <div className="relative w-full md:w-80 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-premium-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Rechercher par action, admin..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-2 ps-10 pe-4 text-xs font-bold focus:ring-4 focus:ring-premium-500/10 focus:border-premium-500 outline-none transition-all"
          />
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex items-center justify-between">
           <div className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest">
              <Clock className="w-4 h-4" />
              Chronologie des événements
           </div>
           <span className="px-3 py-1 bg-premium-50 text-premium-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-premium-100/50">
              {filteredLogs.length} événements
           </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/30">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Horodatage</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Administrateur</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Action</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Détails</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-slate-900">{new Date(log.createdAt).toLocaleDateString('fr-TN')}</span>
                      <span className="text-[10px] font-medium text-slate-400">{new Date(log.createdAt).toLocaleTimeString('fr-TN')}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                       <div className="w-7 h-7 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center text-[10px] font-black">
                          {log.admin.name.charAt(0)}
                       </div>
                       <span className="text-xs font-bold text-slate-700">{log.admin.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {getActionIcon(log.action)}
                      <span className="text-[10px] font-black text-slate-600 text-xs tracking-tight">{log.action}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs text-slate-500 font-medium italic line-clamp-1">{log.details}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredLogs.length === 0 && (
            <div className="p-16 text-center text-slate-300">
               <Activity className="w-12 h-12 mx-auto mb-4 opacity-10" />
               <p className="text-sm font-bold italic tracking-tight">Aucun log correspondant à vos critères.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminActivity;
