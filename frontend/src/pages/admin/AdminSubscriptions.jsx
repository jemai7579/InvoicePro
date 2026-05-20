import React, { useEffect, useMemo, useState } from 'react';
import { CalendarClock, CreditCard, Gift, Loader2, Percent, RefreshCcw, Search, Sparkles } from 'lucide-react';
import api from '../../services/api';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { getPlanLabel } from '../../utils/planLabels';

const PLAN_META = {
  STARTER: { label: 'Démarrage', quota: '7 factures', tone: 'secondary' },
  PROFESSIONAL: { label: 'Pro', quota: 'Illimite', tone: 'primary' },
  ENTERPRISE: { label: 'Max', quota: 'Illimite', tone: 'warning' },
};

const statusVariant = (status) => {
  if (status === 'ACTIVE') return 'success';
  if (status === 'CANCELLED') return 'rejected';
  if (status === 'EXPIRED') return 'warning';
  return 'secondary';
};

const AdminSubscriptions = () => {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState('');
  const [planFilter, setPlanFilter] = useState('all');

  const load = async () => {
    try {
      const res = await api.get('/admin/subscriptions');
      setRows(res.data || []);
    } catch (error) {
      console.error('Unable to fetch subscriptions', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = rows.filter((row) => {
    const haystack = `${row.company?.name || ''} ${row.company?.email || ''} ${row.plan || ''} ${row.status || ''}`.toLowerCase();
    return haystack.includes(query.toLowerCase()) && (planFilter === 'all' || row.plan === planFilter);
  });

  const counts = useMemo(
    () => ({
      trial: rows.filter((row) => row.plan === 'STARTER').length,
      pro: rows.filter((row) => row.plan === 'PROFESSIONAL').length,
      enterprise: rows.filter((row) => row.plan === 'ENTERPRISE').length,
      cancelled: rows.filter((row) => row.status === 'CANCELLED').length,
    }),
    [rows]
  );

  const mutatePlan = async (companyId, plan) => {
    await api.put(`/admin/companies/${companyId}/plan`, { plan });
    await load();
  };

  const mutateStatus = async (companyId, status) => {
    await api.put(`/admin/companies/${companyId}/status`, { status });
    await load();
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
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Abonnements</h2>
          <p className="text-sm text-slate-500 font-medium">
            Gere les plans, les essais, les upgrades et les situations de facturation recurrente.
          </p>
        </div>
        <Button variant="secondary" icon={RefreshCcw} onClick={load}>Actualiser</Button>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <Card><div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Démarrage</div><div className="mt-2 text-2xl font-black text-slate-900">{counts.trial}</div></Card>
        <Card><div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pro</div><div className="mt-2 text-2xl font-black text-premium-600">{counts.pro}</div></Card>
        <Card><div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Max</div><div className="mt-2 text-2xl font-black text-amber-600">{counts.enterprise}</div></Card>
        <Card><div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Annules</div><div className="mt-2 text-2xl font-black text-rose-600">{counts.cancelled}</div></Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-6">
        <Card>
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Entreprise, email, plan..."
                className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-11 py-3 text-sm outline-none focus:ring-4 focus:ring-premium-100"
              />
            </div>
            <select value={planFilter} onChange={(event) => setPlanFilter(event.target.value)} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm outline-none">
              {['all', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE'].map((plan) => <option key={plan} value={plan}>{plan === 'all' ? 'Tous les plans' : getPlanLabel(plan)}</option>)}
            </select>
          </div>
        </Card>

        <Card title="Reference plans" subtitle="Lecture rapide des droits inclus">
          <div className="space-y-3">
            {Object.entries(PLAN_META).map(([key, value]) => (
              <div key={key} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <Badge variant={value.tone}>{value.label}</Badge>
                  <span className="text-xs font-black uppercase tracking-widest text-slate-400">{key}</span>
                </div>
                <div className="mt-3 text-sm text-slate-600">Quota: {value.quota}</div>
                <div className="mt-1 text-sm text-slate-600">TTN: Oui | Rapports: {key === 'STARTER' ? 'Limites' : 'Oui'} | IA: {key === 'STARTER' ? 'Non' : 'Oui'}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card noPadding className="overflow-hidden">
        <div className="hidden xl:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50/60 border-b border-slate-100">
              <tr>
                {['Entreprise', 'Plan', 'Quota', 'IA', 'TTN', 'Rapports', 'Statut', 'Debut', 'Fin', 'Actions'].map((label) => (
                  <th key={label} className="px-5 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((row) => {
                const meta = PLAN_META[row.plan] || PLAN_META.STARTER;
                return (
                  <tr key={row.id} className="hover:bg-slate-50/40">
                    <td className="px-5 py-4">
                      <div className="font-black text-slate-900">{row.company?.name}</div>
                      <div className="text-sm text-slate-500">{row.company?.email}</div>
                    </td>
                    <td className="px-5 py-4"><Badge variant={meta.tone}>{meta.label}</Badge></td>
                    <td className="px-5 py-4 text-sm text-slate-600">{row.invoiceQuota}</td>
                    <td className="px-5 py-4"><Badge variant={row.aiAccess ? 'success' : 'secondary'}>{row.aiAccess ? 'Oui' : 'Non'}</Badge></td>
                    <td className="px-5 py-4"><Badge variant={row.ttnAccess ? 'success' : 'secondary'}>{row.ttnAccess ? 'Oui' : 'Non'}</Badge></td>
                    <td className="px-5 py-4"><Badge variant={row.reportsAccess ? 'success' : 'secondary'}>{row.reportsAccess ? 'Oui' : 'Non'}</Badge></td>
                    <td className="px-5 py-4"><Badge variant={statusVariant(row.status)}>{row.status}</Badge></td>
                    <td className="px-5 py-4 text-sm text-slate-600">{row.startDate ? new Date(row.startDate).toLocaleDateString() : '-'}</td>
                    <td className="px-5 py-4 text-sm text-slate-600">{row.endDate ? new Date(row.endDate).toLocaleDateString() : '-'}</td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button onClick={() => mutatePlan(row.companyId, 'STARTER')} className="px-3 py-2 rounded-xl bg-slate-50 text-xs font-bold text-slate-600 hover:text-slate-900">Démarrage</button>
                        <button onClick={() => mutatePlan(row.companyId, 'PROFESSIONAL')} className="px-3 py-2 rounded-xl bg-premium-50 text-xs font-bold text-premium-700">Pro</button>
                        <button onClick={() => mutatePlan(row.companyId, 'ENTERPRISE')} className="px-3 py-2 rounded-xl bg-amber-50 text-xs font-bold text-amber-700">Max</button>
                        <button onClick={() => mutateStatus(row.companyId, row.status === 'ACTIVE' ? 'CANCELLED' : 'ACTIVE')} className="px-3 py-2 rounded-xl bg-rose-50 text-xs font-bold text-rose-700">
                          {row.status === 'ACTIVE' ? 'Suspendre' : 'Reactiver'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="xl:hidden p-4 space-y-4">
          {filtered.map((row) => {
            const meta = PLAN_META[row.plan] || PLAN_META.STARTER;
            return (
              <div key={row.id} className="rounded-[2rem] border border-slate-100 bg-white p-5 shadow-sm space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-lg font-black text-slate-900">{row.company?.name}</div>
                    <div className="text-sm text-slate-500">{row.company?.email}</div>
                  </div>
                  <Badge variant={meta.tone}>{meta.label}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-2xl bg-slate-50 px-4 py-3"><strong>Quota:</strong> {row.invoiceQuota}</div>
                  <div className="rounded-2xl bg-slate-50 px-4 py-3"><strong>TTN:</strong> {row.ttnAccess ? 'Oui' : 'Non'}</div>
                  <div className="rounded-2xl bg-slate-50 px-4 py-3"><strong>Statut:</strong> {row.status}</div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => mutatePlan(row.companyId, 'PROFESSIONAL')} className="rounded-2xl bg-premium-50 px-4 py-3 text-sm font-bold text-premium-700">Passer Pro</button>
                  <button onClick={() => mutateStatus(row.companyId, row.status === 'ACTIVE' ? 'CANCELLED' : 'ACTIVE')} className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
                    {row.status === 'ACTIVE' ? 'Suspendre' : 'Reactiver'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <Gift className="w-10 h-10 p-2 rounded-2xl bg-amber-50 text-amber-600" />
            <div>
              <div className="text-sm font-black text-slate-900">Essais et extensions</div>
              <div className="text-sm text-slate-500">L'admin peut prolonger un essai ou accorder un geste commercial si besoin.</div>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <Percent className="w-10 h-10 p-2 rounded-2xl bg-emerald-50 text-emerald-600" />
            <div>
              <div className="text-sm font-black text-slate-900">Remises manuelles</div>
              <div className="text-sm text-slate-500">Le plan peut etre ajuste manuellement sans toucher a la logique publique de facturation.</div>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <CalendarClock className="w-10 h-10 p-2 rounded-2xl bg-slate-100 text-slate-700" />
            <div>
              <div className="text-sm font-black text-slate-900">Historique d'abonnement</div>
              <div className="text-sm text-slate-500">Le detail historique complet peut etre enrichi plus tard sans casser les plans actuels.</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminSubscriptions;
