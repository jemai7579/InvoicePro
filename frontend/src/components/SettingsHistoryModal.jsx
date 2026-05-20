import React, { useState, useCallback, useEffect } from 'react';
import { 
  X, History, Clock, Calendar, ArrowRight, 
  ArrowLeftRight, Loader, AlertCircle 
} from 'lucide-react';
import api from '../services/api';
import { useLanguage } from '../context/LanguageContext';

const SettingsHistoryModal = ({ isOpen, onClose }) => {
  const { lang } = useLanguage();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await api.get('/settings/history');
      setHistory(resp.data);
    } catch (err) {
      console.error('Error fetching settings history:', err);
      setError(lang === 'fr' ? "Impossible de charger l'historique." : "Failed to load history.");
    } finally {
      setLoading(false);
    }
  }, [lang]);

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen, fetchHistory]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl shadow-slate-900/40 border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-300">
        <header className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100">
              <History className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 font-display uppercase tracking-tight">
                {lang === 'fr' ? 'Historique des modifications' : 'Settings History'}
              </h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                {lang === 'fr' ? 'Suivi complet de votre compte' : 'Complete account audit trail'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-3 hover:bg-white hover:text-indigo-600 rounded-2xl transition-all active:scale-90 text-slate-400 shadow-sm border border-transparent hover:border-slate-100"
          >
            <X className="w-6 h-6" />
          </button>
        </header>

        <div className="p-4 max-h-[60vh] overflow-y-auto no-scrollbar">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-4">
              <Loader className="w-10 h-10 animate-spin text-indigo-600" />
              <p className="text-[10px] font-black text-slate-400 uppercase">{lang === 'fr' ? 'Chargement...' : 'Loading...'}</p>
            </div>
          ) : error ? (
            <div className="py-20 flex flex-col items-center justify-center gap-4 text-center">
              <AlertCircle className="w-12 h-12 text-rose-500" />
              <p className="text-sm font-bold text-slate-600">{error}</p>
            </div>
          ) : history.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center gap-4 text-center">
              <History className="w-12 h-12 text-slate-200" />
              <p className="text-sm font-bold text-slate-400">
                {lang === 'fr' ? 'Aucun historique disponible.' : 'No history found.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4 px-4 pb-4">
              {history.map((entry) => {
                const dateObj = new Date(entry.createdAt);
                const date = dateObj.toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US');
                const time = dateObj.toLocaleTimeString(lang === 'fr' ? 'fr-FR' : 'en-US', { hour: '2-digit', minute: '2-digit' });

                return (
                  <div key={entry.id} className="group relative bg-white border border-slate-100 rounded-[1.75rem] p-6 hover:shadow-xl hover:shadow-slate-200/40 hover:border-indigo-100 transition-all duration-300">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                       <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 rounded-full text-slate-500 text-[10px] font-black uppercase">
                             <Calendar className="w-3 h-3" /> {date}
                          </div>
                          <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 rounded-full text-slate-500 text-[10px] font-black uppercase">
                             <Clock className="w-3 h-3" /> {time}
                          </div>
                       </div>
                       <span className="text-[11px] font-black uppercase text-indigo-600 tracking-wider bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100/50">
                          {entry.field}
                       </span>
                    </div>

                    <div className="flex items-center gap-4 p-4 bg-slate-50/50 rounded-2x border border-slate-50">
                       <div className="flex-1">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Ancienne</p>
                          <p className="text-sm font-bold text-slate-600 truncate max-w-[200px]" title={entry.oldValue}>{entry.oldValue || '—'}</p>
                       </div>
                       <ArrowLeftRight className="w-4 h-4 text-slate-300 shrink-0" />
                       <div className="flex-1 text-right">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Nouvelle</p>
                          <p className="text-sm font-bold text-slate-900 truncate max-w-[200px]" title={entry.newValue}>{entry.newValue || '—'}</p>
                       </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <footer className="p-8 border-t border-slate-50 bg-slate-50/30 flex justify-center">
            <button 
              onClick={onClose}
              className="px-10 py-3 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all hover:bg-indigo-600 active:scale-95 shadow-xl shadow-slate-200"
            >
              {lang === 'fr' ? 'Fermer' : 'Close'}
            </button>
        </footer>
      </div>
    </div>
  );
};

export default SettingsHistoryModal;
