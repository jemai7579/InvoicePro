import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { 
  Settings, 
  ShieldAlert, 
  AppWindow, 
  AtSign, 
  Database,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Globe,
  BellRing
} from 'lucide-react';

const AdminSettings = () => {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await api.get('/admin/settings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSettings(res.data);
    } catch (err) {
      setError('Erreur lors du chargement des paramètres système.');
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (id, value) => {
    setSaving(true);
    setSuccessMsg('');
    try {
      const token = localStorage.getItem('adminToken');
      await api.put(`/admin/settings/${id}`, { value }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccessMsg('Paramètre mis à jour avec succès.');
      fetchSettings();
    } catch (err) {
      alert('Erreur lors de la mise à jour.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <Loader2 className="w-8 h-8 text-premium-600 animate-spin" />
      <p className="text-sm font-black text-slate-500 uppercase tracking-widest animate-pulse">Initialisation système...</p>
    </div>
  );

  return (
    <div className="max-w-4xl space-y-8 animate-in fade-in duration-500">
      
      {/* Alert Banner */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center justify-between text-emerald-700 animate-in slide-in-from-top fade-in duration-300">
          <div className="flex items-center gap-3">
             <CheckCircle2 className="w-5 h-5" />
             <p className="text-xs font-bold">{successMsg}</p>
          </div>
          <button onClick={() => setSuccessMsg('')} className="text-[10px] font-black uppercase tracking-widest hover:text-emerald-900 transition-colors">Fermer</button>
        </div>
      )}

      {/* Settings Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Core Settings */}
        <div className="space-y-6">
           <div className="flex items-center gap-3 text-slate-400 mb-2">
              <Settings className="w-4 h-4" />
              <h3 className="text-[10px] font-black uppercase tracking-widest">Général & Infrastructure</h3>
           </div>
           
           {settings.map((setting) => (
             <div key={setting.id} className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-500">
                         {setting.key.includes('MAINTENANCE') ? <ShieldAlert className="w-4 h-4" /> : <AppWindow className="w-4 h-4" />}
                      </div>
                      <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{setting.label || setting.key}</p>
                   </div>
                </div>
                <div className="flex items-center gap-3">
                  <input 
                    type="text" 
                    defaultValue={setting.value}
                    onBlur={(e) => {
                      if (e.target.value !== setting.value) {
                         updateSetting(setting.id, e.target.value);
                      }
                    }}
                    className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-xs font-bold focus:ring-4 focus:ring-premium-500/10 focus:border-premium-500 outline-none transition-all"
                  />
                  {saving && <Loader2 className="w-4 h-4 text-premium-600 animate-spin" />}
                </div>
                <p className="text-[10px] text-slate-400 font-medium italic">Clé technique: {setting.key}</p>
             </div>
           ))}
        </div>

        {/* Info & Global actions */}
        <div className="space-y-6">
           <div className="flex items-center gap-3 text-slate-400 mb-2">
              <Globe className="w-4 h-4" />
              <h3 className="text-[10px] font-black uppercase tracking-widest">Informations Plateforme</h3>
           </div>

           <div className="bg-slate-900 p-8 rounded-[32px] text-white shadow-xl shadow-slate-200 relative overflow-hidden group">
              <div className="relative z-10 space-y-4">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-premium-400 border border-white/5 shadow-inner">
                       <Database className="w-5 h-5" />
                    </div>
                    <div>
                       <p className="text-xs font-black text-white uppercase">Version Système</p>
                       <p className="text-2xl font-black text-premium-400 font-mono">v1.2.0-stable</p>
                    </div>
                 </div>
                 <div className="h-px bg-white/10 w-full" />
                 <div className="space-y-2">
                    <div className="flex items-center justify-between text-[10px] uppercase font-black text-slate-400 tracking-widest">
                       <span>Database Health</span>
                       <span className="text-emerald-400">99.9%</span>
                    </div>
                    <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                       <div className="bg-emerald-500 h-full w-[99.9%] transition-all duration-1000" />
                    </div>
                 </div>
                 <button className="w-full py-3 bg-premium-600 hover:bg-premium-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all mt-4 border border-premium-400/20 shadow-lg shadow-premium-900/50">
                    Vidage du cache global
                 </button>
              </div>
              <Settings className="absolute -bottom-12 -right-12 w-48 h-48 text-white/5 opacity-5 group-hover:rotate-45 transition-transform duration-[2000ms]" />
           </div>

           <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm ring-4 ring-premium-50">
              <div className="flex items-center gap-3 mb-4">
                 <div className="p-2.5 bg-premium-50 rounded-xl text-premium-600">
                    <BellRing className="w-5 h-5" />
                 </div>
                 <h4 className="text-xs font-black text-slate-900 uppercase">Avis Global</h4>
              </div>
              <p className="text-xs text-slate-500 font-medium mb-4 leading-relaxed">
                 Envoyez une notification système à toutes les entreprises inscrites sur la plateforme.
              </p>
              <textarea 
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs font-bold focus:ring-4 focus:ring-premium-500/10 focus:border-premium-500 outline-none transition-all mb-4 h-24"
                placeholder="Votre message ici..."
              />
              <button 
                onClick={() => alert('Fonctionnalité de notification globale en cours...')}
                className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
              >
                 Diffuser le message
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
