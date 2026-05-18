import React, { useEffect, useState } from 'react';
import { AlertTriangle, Bug, Loader2, RefreshCcw, Search, ShieldAlert } from 'lucide-react';
import api from '../../services/api';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';

const severityVariant = (severity) => {
  if (severity === 'critical' || severity === 'high') return 'rejected';
  if (severity === 'medium') return 'warning';
  return 'secondary';
};

const statusVariant = (status) => {
  if (status === 'resolved') return 'success';
  if (status === 'investigating') return 'warning';
  return 'secondary';
};

const AdminSystemErrors = () => {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState('');

  const load = async () => {
    try {
      const res = await api.get('/admin/system-errors');
      setRows(res.data || []);
    } catch (error) {
      console.error('Unable to fetch system errors', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = rows.filter((row) =>
    `${row.type || ''} ${row.companyId || ''} ${row.message || ''} ${row.status || ''}`.toLowerCase().includes(query.toLowerCase())
  );

  const updateError = async (row, updates) => {
    if (String(row.id).startsWith('derived_')) return;
    await api.put(`/admin/system-errors/${row.id}`, { ...row, ...updates });
    await load();
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-premium-600" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Erreurs systeme</h2>
          <p className="text-sm text-slate-500 font-medium">Suivez les erreurs API, TTN, signature, paiement et email sans ouvrir les serveurs.</p>
        </div>
        <Button variant="secondary" icon={RefreshCcw} onClick={load}>Actualiser</Button>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <Card><div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total</div><div className="mt-2 text-2xl font-black text-slate-900">{rows.length}</div></Card>
        <Card><div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nouvelles</div><div className="mt-2 text-2xl font-black text-rose-600">{rows.filter((row) => row.status === 'new').length}</div></Card>
        <Card><div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Investigation</div><div className="mt-2 text-2xl font-black text-amber-600">{rows.filter((row) => row.status === 'investigating').length}</div></Card>
        <Card><div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Resolues</div><div className="mt-2 text-2xl font-black text-emerald-600">{rows.filter((row) => row.status === 'resolved').length}</div></Card>
      </div>

      <Card>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Type, entreprise, message..."
            className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-11 py-3 text-sm outline-none focus:ring-4 focus:ring-premium-100"
          />
        </div>
      </Card>

      <Card noPadding className="overflow-hidden">
        <div className="hidden xl:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50/60 border-b border-slate-100">
              <tr>
                {['Date', 'Type', 'Entreprise', 'Severite', 'Message', 'Statut', 'Note', 'Actions'].map((label) => (
                  <th key={label} className="px-5 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/40">
                  <td className="px-5 py-4 text-sm text-slate-600">{new Date(row.createdAt).toLocaleString()}</td>
                  <td className="px-5 py-4 text-sm font-bold text-slate-800">{row.type}</td>
                  <td className="px-5 py-4 text-sm text-slate-600">{row.companyId || 'Plateforme'}</td>
                  <td className="px-5 py-4"><Badge variant={severityVariant(row.severity)}>{row.severity}</Badge></td>
                  <td className="px-5 py-4 text-sm text-slate-600 max-w-[320px]"><div className="line-clamp-2">{row.message}</div></td>
                  <td className="px-5 py-4"><Badge variant={statusVariant(row.status)}>{row.status}</Badge></td>
                  <td className="px-5 py-4 text-sm text-slate-600">{row.note || '-'}</td>
                  <td className="px-5 py-4">
                    {String(row.id).startsWith('derived_') ? (
                      <Badge variant="secondary">Derive</Badge>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        <button onClick={() => updateError(row, { status: 'investigating' })} className="px-3 py-2 rounded-xl bg-amber-50 text-xs font-bold text-amber-700">Investiguer</button>
                        <button onClick={() => updateError(row, { status: 'resolved' })} className="px-3 py-2 rounded-xl bg-emerald-50 text-xs font-bold text-emerald-700">Resoudre</button>
                      </div>
                    )}
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
                  <div className="text-lg font-black text-slate-900">{row.type}</div>
                  <div className="text-sm text-slate-500">{new Date(row.createdAt).toLocaleDateString()}</div>
                </div>
                <Badge variant={severityVariant(row.severity)}>{row.severity}</Badge>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">{row.message}</div>
              <div className="flex justify-between items-center">
                <Badge variant={statusVariant(row.status)}>{row.status}</Badge>
                <div className="text-xs text-slate-400">{row.companyId || 'Plateforme'}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <Bug className="w-10 h-10 p-2 rounded-2xl bg-rose-50 text-rose-600" />
            <div>
              <div className="text-sm font-black text-slate-900">Observabilite simple</div>
              <div className="text-sm text-slate-500">Le dirigeant voit les problemes critiques sans passer par les logs serveur.</div>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-10 h-10 p-2 rounded-2xl bg-amber-50 text-amber-600" />
            <div>
              <div className="text-sm font-black text-slate-900">Suivi clair</div>
              <div className="text-sm text-slate-500">Les erreurs peuvent etre marquees en investigation puis resolues avec une trace simple.</div>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-10 h-10 p-2 rounded-2xl bg-slate-100 text-slate-700" />
            <div>
              <div className="text-sm font-black text-slate-900">Sources multiples</div>
              <div className="text-sm text-slate-500">API, TTN, signature, paiement et email peuvent etre suivis depuis la meme page.</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminSystemErrors;
