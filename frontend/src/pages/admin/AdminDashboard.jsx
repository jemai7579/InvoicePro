import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { 
  Users, 
  Receipt, 
  TrendingUp, 
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  AlertCircle
} from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, trend, trendValue, color }) => (
  <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm hover:shadow-md transition-all group">
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 rounded-2xl ${color} bg-opacity-10 group-hover:scale-110 transition-transform`}>
        <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
      </div>
      {trend && (
        <div className={`flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-full ${trend === 'up' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
          {trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {trendValue}
        </div>
      )}
    </div>
    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">{title}</p>
    <p className="text-2xl font-black text-slate-900 mt-1 tracking-tight">{value}</p>
  </div>
);

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        const res = await api.get('/admin/stats', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStats(res.data);
      } catch (err) {
        setError('Impossible de charger les statistiques globales.');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <Loader2 className="w-8 h-8 text-premium-600 animate-spin" />
      <p className="text-sm font-bold text-slate-500 animate-pulse uppercase tracking-widest">Calcul des données globales...</p>
    </div>
  );

  if (error) return (
    <div className="bg-red-50 border border-red-100 p-6 rounded-3xl flex items-center gap-4 text-red-600">
      <AlertCircle className="w-6 h-6" />
      <p className="font-bold">{error}</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Vue d'ensemble</h2>
          <p className="text-slate-500 font-medium text-sm">Surveillance du réseau El Fatoora en temps réel.</p>
        </div>
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl shadow-sm border border-slate-100">
          <Activity className="w-4 h-4 text-premium-500" />
          <span className="text-xs font-bold text-slate-700">Mise à jour activée</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Entreprises Totales" 
          value={stats.totalCompanies} 
          icon={Users} 
          color="bg-blue-500"
          trend="up"
          trendValue="+12%"
        />
        <StatCard 
          title="Volume de Facturation" 
          value={`${stats.totalVolume.toLocaleString()} DT`} 
          icon={TrendingUp} 
          color="bg-premium-600"
          trend="up"
          trendValue="+24%"
        />
        <StatCard 
          title="Factures Générées" 
          value={stats.totalInvoices} 
          icon={Receipt} 
          color="bg-orange-500"
        />
        <StatCard 
          title="Taux de Validation" 
          value="98.2%" 
          icon={Activity} 
          color="bg-emerald-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Statuts TTN */}
        <div className="lg:col-span-1 bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
          <h3 className="text-lg font-black text-slate-900 mb-6 tracking-tight">Répartition TTN</h3>
          <div className="space-y-4">
            {Object.entries(stats.statsByStatus).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    status === 'VALIDATED' ? 'bg-emerald-500' : 
                    status === 'REJECTED' ? 'bg-red-500' : 
                    'bg-amber-500'
                  }`} />
                  <span className="text-xs font-bold text-slate-700">{status}</span>
                </div>
                <span className="text-sm font-black text-slate-900">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Dernières Activités */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="flex items-center justify-between mb-6">
             <h3 className="text-lg font-black text-slate-900 tracking-tight">Dernières Activités</h3>
             <button onClick={() => window.location.href='/admin/activity'} className="text-[10px] font-black text-premium-600 uppercase tracking-widest hover:underline">Voir tout</button>
          </div>
          <div className="flex-1 space-y-4">
            {stats.recentLogs && stats.recentLogs.length > 0 ? (
              stats.recentLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 transition-hover hover:border-premium-100">
                  <div className="p-2 bg-white rounded-xl shadow-sm">
                    <Activity className="w-4 h-4 text-premium-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between">
                      <p className="text-xs font-black text-slate-900 truncate uppercase tracking-tight">{log.action}</p>
                      <span className="text-[9px] font-bold text-slate-400">{new Date(log.createdAt).toLocaleTimeString('fr-TN')}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-medium italic line-clamp-1">{log.details}</p>
                    <p className="text-[9px] font-black text-slate-400 uppercase mt-1">Par: {log.admin.name}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                <Activity className="w-12 h-12 mb-4 opacity-10" />
                <p className="text-sm font-medium italic text-center px-8">Aucune activité récente enregistrée dans le journal d'audit.</p>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default AdminDashboard;
