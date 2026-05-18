import React, { useEffect, useState } from 'react';
import { Headset, Loader2, MessageSquareReply, RefreshCcw, Search, Ticket } from 'lucide-react';
import api from '../../services/api';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';

const statusVariant = (status) => {
  if (status === 'resolved' || status === 'closed') return 'success';
  if (status === 'waiting_user') return 'warning';
  if (status === 'in_progress') return 'primary';
  return 'secondary';
};

const priorityVariant = (priority) => {
  if (priority === 'urgent' || priority === 'high') return 'rejected';
  if (priority === 'medium') return 'warning';
  return 'secondary';
};

const AdminSupport = () => {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState('');

  const load = async () => {
    try {
      const res = await api.get('/admin/support');
      setRows(res.data || []);
    } catch (error) {
      console.error('Unable to fetch support tickets', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = rows.filter((row) =>
    `${row.companyName || ''} ${row.userLabel || ''} ${row.subject || ''} ${row.status || ''}`.toLowerCase().includes(query.toLowerCase())
  );

  const updateTicket = async (row, updates) => {
    await api.put(`/admin/support/${row.id}`, { ...row, ...updates });
    await load();
  };

  const replyTicket = async (row) => {
    await api.post(`/admin/support/${row.id}/reply`, { message: 'Reponse admin enregistree depuis le centre support.' });
    await load();
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-premium-600" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Support & tickets</h2>
          <p className="text-sm text-slate-500 font-medium">Centralisez les demandes clients, les priorites et les reponses admin.</p>
        </div>
        <Button variant="secondary" icon={RefreshCcw} onClick={load}>Actualiser</Button>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <Card><div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total tickets</div><div className="mt-2 text-2xl font-black text-slate-900">{rows.length}</div></Card>
        <Card><div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ouverts</div><div className="mt-2 text-2xl font-black text-amber-600">{rows.filter((row) => row.status === 'open').length}</div></Card>
        <Card><div className="text-[10px] font-black uppercase tracking-widest text-slate-400">En cours</div><div className="mt-2 text-2xl font-black text-premium-600">{rows.filter((row) => row.status === 'in_progress').length}</div></Card>
        <Card><div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Resolus</div><div className="mt-2 text-2xl font-black text-emerald-600">{rows.filter((row) => ['resolved', 'closed'].includes(row.status)).length}</div></Card>
      </div>

      <Card>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Entreprise, utilisateur, sujet..."
            className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-11 py-3 text-sm outline-none focus:ring-4 focus:ring-premium-100"
          />
        </div>
      </Card>

      <Card noPadding className="overflow-hidden">
        <div className="hidden xl:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50/60 border-b border-slate-100">
              <tr>
                {['Entreprise', 'Utilisateur', 'Sujet', 'Priorite', 'Statut', 'Creation', 'Derniere reponse', 'Actions'].map((label) => (
                  <th key={label} className="px-5 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/40">
                  <td className="px-5 py-4 text-sm font-bold text-slate-800">{row.companyName || row.companyId}</td>
                  <td className="px-5 py-4 text-sm text-slate-600">{row.userLabel || '-'}</td>
                  <td className="px-5 py-4 text-sm text-slate-600">{row.subject}</td>
                  <td className="px-5 py-4"><Badge variant={priorityVariant(row.priority)}>{row.priority}</Badge></td>
                  <td className="px-5 py-4"><Badge variant={statusVariant(row.status)}>{row.status}</Badge></td>
                  <td className="px-5 py-4 text-sm text-slate-600">{new Date(row.createdAt).toLocaleDateString()}</td>
                  <td className="px-5 py-4 text-sm text-slate-600">{row.updatedAt ? new Date(row.updatedAt).toLocaleString() : '-'}</td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => updateTicket(row, { status: 'in_progress' })} className="px-3 py-2 rounded-xl bg-premium-50 text-xs font-bold text-premium-700">Prendre</button>
                      <button onClick={() => replyTicket(row)} className="px-3 py-2 rounded-xl bg-slate-50 text-xs font-bold text-slate-700">Repondre</button>
                      <button onClick={() => updateTicket(row, { status: 'resolved' })} className="px-3 py-2 rounded-xl bg-emerald-50 text-xs font-bold text-emerald-700">Resoudre</button>
                    </div>
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
                  <div className="text-lg font-black text-slate-900">{row.companyName || row.companyId}</div>
                  <div className="text-sm text-slate-500">{row.subject}</div>
                </div>
                <Badge variant={statusVariant(row.status)}>{row.status}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl bg-slate-50 px-4 py-3"><strong>Priorite:</strong> {row.priority}</div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3"><strong>Utilisateur:</strong> {row.userLabel || '-'}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <Headset className="w-10 h-10 p-2 rounded-2xl bg-premium-50 text-premium-600" />
            <div>
              <div className="text-sm font-black text-slate-900">File support</div>
              <div className="text-sm text-slate-500">L'admin sait instantanement quels tickets demandent une action.</div>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <Ticket className="w-10 h-10 p-2 rounded-2xl bg-amber-50 text-amber-600" />
            <div>
              <div className="text-sm font-black text-slate-900">Priorisation</div>
              <div className="text-sm text-slate-500">Les priorites aident a gerer vite les sujets bloquants, paiements ou TTN.</div>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <MessageSquareReply className="w-10 h-10 p-2 rounded-2xl bg-emerald-50 text-emerald-600" />
            <div>
              <div className="text-sm font-black text-slate-900">Traite en equipe</div>
              <div className="text-sm text-slate-500">La page est concue pour rester lisible sur desktop comme sur mobile.</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminSupport;
