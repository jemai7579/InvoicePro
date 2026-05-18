import React, { useEffect, useState } from 'react';
import { AlertTriangle, CreditCard, Loader2, Receipt, RefreshCcw, Search, Wallet } from 'lucide-react';
import api from '../../services/api';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';

const statusVariant = (status) => {
  if (status === 'paid') return 'success';
  if (status === 'failed') return 'rejected';
  if (status === 'pending') return 'warning';
  return 'secondary';
};

const AdminPayments = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ summary: {}, rows: [] });
  const [query, setQuery] = useState('');

  const load = async () => {
    try {
      const res = await api.get('/admin/payments');
      setData(res.data || { summary: {}, rows: [] });
    } catch (error) {
      console.error('Unable to fetch payments', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = (data.rows || []).filter((row) =>
    `${row.companyName || ''} ${row.plan || ''} ${row.status || ''} ${row.method || ''}`.toLowerCase().includes(query.toLowerCase())
  );

  const updateStatus = async (row, status) => {
    if (String(row.id).startsWith('derived_')) {
      await api.post('/admin/payments', {
        companyId: row.companyId,
        plan: row.plan,
        amount: row.amount,
        status,
        paymentDate: status === 'paid' ? new Date().toISOString() : row.paymentDate,
        nextBillingDate: row.nextBillingDate,
        method: row.method,
        note: row.note,
      });
    } else {
      await api.put(`/admin/payments/${row.id}`, { ...row, status });
    }
    await load();
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-premium-600" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Paiements</h2>
          <p className="text-sm text-slate-500 font-medium">Suivez la sante financiere de la plateforme, les paiements en attente et les echecs.</p>
        </div>
        <Button variant="secondary" icon={RefreshCcw} onClick={load}>Actualiser</Button>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-6 gap-4">
        <Card><div className="text-[10px] font-black uppercase tracking-widest text-slate-400">MRR</div><div className="mt-2 text-2xl font-black text-slate-900">{data.summary?.mrr || 0} TND</div></Card>
        <Card><div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ce mois</div><div className="mt-2 text-2xl font-black text-premium-600">{data.summary?.revenueThisMonth || 0} TND</div></Card>
        <Card><div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Paiements en attente</div><div className="mt-2 text-2xl font-black text-amber-600">{data.summary?.pendingPayments || 0}</div></Card>
        <Card><div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Echecs</div><div className="mt-2 text-2xl font-black text-rose-600">{data.summary?.failedPayments || 0}</div></Card>
        <Card><div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Payes</div><div className="mt-2 text-2xl font-black text-emerald-600">{data.summary?.paidInvoices || 0}</div></Card>
        <Card><div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Remboursements</div><div className="mt-2 text-2xl font-black text-slate-900">{data.summary?.refunds || 0}</div></Card>
      </div>

      <Card>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Entreprise, plan, methode..."
            className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-11 py-3 text-sm outline-none focus:ring-4 focus:ring-premium-100"
          />
        </div>
      </Card>

      <Card noPadding className="overflow-hidden">
        <div className="hidden xl:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50/60 border-b border-slate-100">
              <tr>
                {['Entreprise', 'Plan', 'Montant', 'Statut', 'Date paiement', 'Prochaine echeance', 'Methode', 'Actions'].map((label) => (
                  <th key={label} className="px-5 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/40">
                  <td className="px-5 py-4 text-sm font-bold text-slate-800">{row.companyName || row.companyId}</td>
                  <td className="px-5 py-4"><Badge variant="secondary">{row.plan}</Badge></td>
                  <td className="px-5 py-4 text-sm font-black text-slate-900">{Number(row.amount || 0).toFixed(2)} TND</td>
                  <td className="px-5 py-4"><Badge variant={statusVariant(row.status)}>{row.status}</Badge></td>
                  <td className="px-5 py-4 text-sm text-slate-600">{row.paymentDate ? new Date(row.paymentDate).toLocaleDateString() : '-'}</td>
                  <td className="px-5 py-4 text-sm text-slate-600">{row.nextBillingDate ? new Date(row.nextBillingDate).toLocaleDateString() : '-'}</td>
                  <td className="px-5 py-4 text-sm text-slate-600">{row.method || '-'}</td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => updateStatus(row, 'paid')} className="px-3 py-2 rounded-xl bg-emerald-50 text-xs font-bold text-emerald-700">Marquer paye</button>
                      <button onClick={() => updateStatus(row, 'pending')} className="px-3 py-2 rounded-xl bg-amber-50 text-xs font-bold text-amber-700">En attente</button>
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
                  <div className="text-sm text-slate-500">{row.plan}</div>
                </div>
                <Badge variant={statusVariant(row.status)}>{row.status}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl bg-slate-50 px-4 py-3"><strong>Montant:</strong> {Number(row.amount || 0).toFixed(2)} TND</div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3"><strong>Methode:</strong> {row.method || '-'}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <Wallet className="w-10 h-10 p-2 rounded-2xl bg-premium-50 text-premium-600" />
            <div>
              <div className="text-sm font-black text-slate-900">Vision cash</div>
              <div className="text-sm text-slate-500">L'admin visualise en un coup d'oeil la tresorerie recurrente et les blocages.</div>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-10 h-10 p-2 rounded-2xl bg-rose-50 text-rose-600" />
            <div>
              <div className="text-sm font-black text-slate-900">Paiements en echec</div>
              <div className="text-sm text-slate-500">Les echecs peuvent etre traites rapidement avant qu'ils ne degradent l'experience client.</div>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <Receipt className="w-10 h-10 p-2 rounded-2xl bg-emerald-50 text-emerald-600" />
            <div>
              <div className="text-sm font-black text-slate-900">Regie manuelle</div>
              <div className="text-sm text-slate-500">Les paiements offline peuvent etre suivis sans perturber la logique d'abonnement existante.</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminPayments;
