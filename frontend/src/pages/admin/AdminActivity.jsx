import React, { useCallback, useEffect, useState } from 'react';
import { Activity, Download, Eye, Filter, Loader2, Search, ShieldCheck } from 'lucide-react';
import api from '../../services/api';
import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';

const ACTION_VARIANTS = {
  LOGIN: 'success',
  UPDATE_COMPANY_STATUS: 'warning',
  UPDATE_COMPANY_PLAN: 'primary',
  SEND_GLOBAL_NOTIFICATION: 'info',
  UPDATE_SYSTEM_SETTING: 'secondary',
};

const AdminActivity = () => {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [range, setRange] = useState('30d');
  const [severity, setSeverity] = useState('all');
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (range !== 'all') {
        const days = range === 'today' ? 0 : range === '7d' ? 7 : 30;
        const from = new Date();
        from.setDate(from.getDate() - days);
        if (range === 'today') from.setHours(0, 0, 0, 0);
        params.set('from', from.toISOString());
      }
      if (actionFilter !== 'all') params.set('actionType', actionFilter);
      if (query) params.set('search', query);
      const res = await api.get(`/admin/activity-logs?${params.toString()}`);
      setRows(res.data || []);
    } catch (error) {
      console.error('Unable to fetch admin logs', error);
    } finally {
      setLoading(false);
    }
  }, [actionFilter, query, range]);

  useEffect(() => {
    load();
  }, [load]);

  const actions = [
    'all',
    'login',
    'company_status',
    'dossier_status',
    'plan_change',
    'quota_reset',
    'payment',
    'support',
    'notification',
    'settings',
    'ttn',
    'signature',
    'system_error',
  ];

  const filtered = rows.filter((row) => {
    const haystack = `${row.actor || ''} ${row.actorEmail || ''} ${row.action || ''} ${row.details || ''}`.toLowerCase();
    return haystack.includes(query.toLowerCase()) && (severity === 'all' || row.severity === severity);
  });

  const exportCsv = () => {
    const params = new URLSearchParams();
    if (actionFilter !== 'all') params.set('actionType', actionFilter);
    if (query) params.set('search', query);
    window.open(`${api.defaults.baseURL}/admin/activity-logs/export.csv?${params.toString()}`, '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-premium-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Logs d'activite</h2>
        <p className="text-sm text-slate-500 font-medium">
          Suivez les actions sensibles de la plateforme et conservez une piste d'audit claire.
        </p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <Card><div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total logs</div><div className="mt-2 text-2xl font-black text-slate-900">{rows.length}</div></Card>
        <Card><div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Connexions admin</div><div className="mt-2 text-2xl font-black text-emerald-600">{rows.filter((row) => row.action === 'LOGIN').length}</div></Card>
        <Card><div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Actions systeme</div><div className="mt-2 text-2xl font-black text-premium-600">{rows.filter((row) => (row.action || '').includes('SETTING')).length}</div></Card>
        <Card><div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Actions recentes</div><div className="mt-2 text-2xl font-black text-amber-600">{rows.filter((row) => Date.now() - new Date(row.date).getTime() < 86400000).length}</div></Card>
      </div>

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto_auto_auto] gap-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Acteur, action, detail..."
              className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-11 py-3 text-sm outline-none focus:ring-4 focus:ring-premium-100"
            />
          </div>
          <select value={actionFilter} onChange={(event) => setActionFilter(event.target.value)} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm outline-none">
            {actions.map((action) => <option key={action} value={action}>{action === 'all' ? 'Toutes les actions' : action}</option>)}
          </select>
          <select value={range} onChange={(event) => setRange(event.target.value)} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm outline-none">
            <option value="today">Aujourd'hui</option>
            <option value="7d">7 derniers jours</option>
            <option value="30d">30 derniers jours</option>
            <option value="all">Toutes les dates</option>
          </select>
          <select value={severity} onChange={(event) => setSeverity(event.target.value)} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm outline-none">
            <option value="all">Tous statuts</option>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="error">Error</option>
            <option value="success">Success</option>
          </select>
          <button onClick={exportCsv} className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white flex items-center gap-2"><Download className="w-4 h-4" />CSV</button>
        </div>
      </Card>

      <Card noPadding className="overflow-hidden">
        <div className="hidden xl:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50/60 border-b border-slate-100">
              <tr>
                {['Date', 'Acteur', 'Entreprise', 'Action en francais', 'Ancien', 'Nouveau', 'IP', 'Details'].map((label) => (
                  <th key={label} className="px-5 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/40 align-top">
                  <td className="px-5 py-4 text-sm text-slate-600">{new Date(row.date).toLocaleString()}</td>
                  <td className="px-5 py-4">
                    <div className="font-black text-slate-900">{row.actor}</div>
                    <div className="text-sm text-slate-500">{row.actorEmail || '-'}</div>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-600">{row.company || 'Plateforme'}</td>
                  <td className="px-5 py-4 text-sm font-bold text-slate-800">{row.actionLabel || row.action}</td>
                  <td className="px-5 py-4 text-sm text-slate-600">{row.oldValue || '-'}</td>
                  <td className="px-5 py-4 text-sm text-slate-600">{row.newValue || '-'}</td>
                  <td className="px-5 py-4 text-sm text-slate-600">{row.ipAddress || '-'}</td>
                  <td className="px-5 py-4 text-sm text-slate-600">
                    <button onClick={() => setSelected(row)} className="inline-flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700"><Eye className="w-4 h-4" />Details</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="xl:hidden p-4 space-y-4">
          {filtered.map((row) => (
            <div key={row.id} className="rounded-[2rem] border border-slate-100 bg-white p-5 shadow-sm space-y-4">
              <div className="flex justify-between gap-4">
                <div>
                  <div className="text-lg font-black text-slate-900">{row.actor}</div>
                  <div className="text-sm text-slate-500">{row.actorEmail || 'Plateforme'}</div>
                </div>
                <Badge variant={ACTION_VARIANTS[row.action] || 'secondary'}>{row.action}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl bg-slate-50 px-4 py-3"><strong>Date:</strong> {new Date(row.date).toLocaleDateString()}</div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3"><strong>IP:</strong> {row.ipAddress || '-'}</div>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">{row.details || '-'}</div>
            </div>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="p-16 text-center">
            <Activity className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-sm font-bold text-slate-500">Aucun log ne correspond a vos filtres.</p>
          </div>
        ) : null}
      </Card>

      {selected ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={() => setSelected(null)}>
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="mb-4 text-xl font-black text-slate-900">Details du log</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div><strong>Acteur:</strong> {selected.actor} {selected.actorEmail}</div>
              <div><strong>Entreprise:</strong> {selected.company || 'Plateforme'}</div>
              <div><strong>Action:</strong> {selected.actionLabel || selected.action}</div>
              <div><strong>Date:</strong> {new Date(selected.date).toLocaleString()}</div>
              <div><strong>Ancien:</strong> {selected.oldValue || '-'}</div>
              <div><strong>Nouveau:</strong> {selected.newValue || '-'}</div>
              <div><strong>IP:</strong> {selected.ipAddress || '-'}</div>
              <div><strong>User agent:</strong> {selected.userAgent || '-'}</div>
            </div>
            <details className="mt-4 rounded-2xl bg-slate-50 p-4 text-xs text-slate-500">
              <summary className="cursor-pointer font-black text-slate-700">Section technique</summary>
              <pre className="mt-3 whitespace-pre-wrap">{JSON.stringify(selected.metadata || selected.details, null, 2)}</pre>
            </details>
            <button onClick={() => setSelected(null)} className="mt-5 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white">Fermer</button>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-10 h-10 p-2 rounded-2xl bg-emerald-50 text-emerald-600" />
            <div>
              <div className="text-sm font-black text-slate-900">Journal sensible</div>
              <div className="text-sm text-slate-500">Les actions admin importantes sont centralisees ici pour faciliter les revues de conformite.</div>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <Activity className="w-10 h-10 p-2 rounded-2xl bg-premium-50 text-premium-600" />
            <div>
              <div className="text-sm font-black text-slate-900">Recherche rapide</div>
              <div className="text-sm text-slate-500">Utilisez les filtres pour retrouver une action precise sans ouvrir les serveurs.</div>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <Filter className="w-10 h-10 p-2 rounded-2xl bg-slate-100 text-slate-700" />
            <div>
              <div className="text-sm font-black text-slate-900">Audit exploitable</div>
              <div className="text-sm text-slate-500">L'objectif est que l'admin voie l'essentiel en quelques secondes, meme sur mobile.</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminActivity;
