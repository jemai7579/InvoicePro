import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CreditCard,
  Loader2,
  Receipt,
  TrendingUp,
  Users,
  Wifi,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const ChartBars = ({ items, color = 'bg-premium-600' }) => (
  <div className="flex items-end gap-3 h-40">
    {items.map((item) => {
      const max = Math.max(...items.map((entry) => entry.value || 0), 1);
      const height = `${Math.max(((item.value || 0) / max) * 100, 8)}%`;
      return (
        <div key={item.period || item.status || item.plan} className="flex-1 flex flex-col items-center gap-2">
          <div className="w-full rounded-t-2xl bg-slate-100 overflow-hidden h-full flex items-end">
            <div className={`w-full rounded-t-2xl ${color}`} style={{ height }} />
          </div>
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">
            {item.period || item.status || item.plan}
          </div>
        </div>
      );
    })}
  </div>
);

const StatCard = ({ label, value, icon, tone = 'bg-slate-50 text-slate-700' }) => {
  const IconComponent = icon;

  return (
    <div className="rounded-[2rem] border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</div>
          <div className="mt-2 text-2xl font-black text-slate-900 tracking-tight">{value}</div>
        </div>
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${tone}`}>
          <IconComponent className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/admin/overview');
        setData(res.data);
      } catch (error) {
        console.error('Unable to load admin overview', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const kpis = data?.kpis || {};
  const charts = data?.charts || {};
  const alerts = useMemo(() => data?.alerts || {}, [data]);

  const priorityItems = useMemo(
    () => [
      ...(alerts.failedTtn || []).map((invoice) => ({
        key: `ttn-${invoice.id}`,
        label: `Echec TTN pour ${invoice.company?.name || 'une entreprise'}`,
        path: '/admin/ttn',
      })),
      ...(alerts.nearQuota || []).map((company) => ({
        key: `quota-${company.companyId}`,
        label: `${company.companyName} proche du quota`,
        path: '/admin/companies',
      })),
      ...(alerts.missingSignatures || []).map((company) => ({
        key: `signature-${company.companyId}`,
        label: `Signature manquante pour ${company.companyName}`,
        path: '/admin/compliance',
      })),
      ...(alerts.failedPayments || []).map((payment) => ({
        key: `payment-${payment.id}`,
        label: `Paiement en echec pour ${payment.companyName || payment.companyId}`,
        path: '/admin/payments',
      })),
      ...(alerts.unresolvedTickets || []).map((ticket) => ({
        key: `ticket-${ticket.id}`,
        label: `Ticket ouvert: ${ticket.subject}`,
        path: '/admin/support',
      })),
    ].slice(0, 10),
    [alerts]
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Loader2 className="w-8 h-8 text-premium-600 animate-spin" />
        <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Chargement du centre de controle...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Vue globale</h2>
          <p className="text-slate-500 font-medium text-sm">Comprenez l'etat de la plateforme en moins de 30 secondes.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        <StatCard label="Entreprises" value={kpis.totalCompanies || 0} icon={Building2} tone="bg-blue-50 text-blue-600" />
        <StatCard label="Actives" value={kpis.activeCompanies || 0} icon={Building2} tone="bg-emerald-50 text-emerald-600" />
        <StatCard label="Essai" value={kpis.trialCompanies || 0} icon={Users} tone="bg-amber-50 text-amber-600" />
        <StatCard label="Payantes" value={kpis.paidCompanies || 0} icon={CreditCard} tone="bg-premium-50 text-premium-600" />
        <StatCard label="Utilisateurs" value={kpis.totalUsers || 0} icon={Users} tone="bg-slate-100 text-slate-700" />
        <StatCard label="Factures TTN OK" value={kpis.ttnAcceptedInvoices || 0} icon={Receipt} tone="bg-emerald-50 text-emerald-600" />
        <StatCard label="Erreurs du jour" value={kpis.systemErrorsToday || 0} icon={AlertTriangle} tone="bg-rose-50 text-rose-600" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.3fr_0.7fr] gap-6">
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Revenus dans le temps</h3>
                <TrendingUp className="w-4 h-4 text-premium-600" />
              </div>
              <ChartBars items={charts.revenueOverTime || []} color="bg-premium-600" />
            </div>

            <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Nouvelles entreprises</h3>
                <Building2 className="w-4 h-4 text-blue-600" />
              </div>
              <ChartBars items={charts.newCompaniesOverTime || []} color="bg-blue-500" />
            </div>

            <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Factures creees</h3>
                <Receipt className="w-4 h-4 text-emerald-600" />
              </div>
              <ChartBars items={charts.invoicesCreatedOverTime || []} color="bg-emerald-500" />
            </div>

            <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Repartition des plans</h3>
                <CreditCard className="w-4 h-4 text-amber-600" />
              </div>
              <ChartBars items={charts.subscriptionDistribution || []} color="bg-amber-500" />
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Acceptation TTN vs rejet</h3>
              <Wifi className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {(charts.ttnAcceptanceVsRejection || []).map((item) => (
                <div key={item.status} className="rounded-2xl bg-slate-50/70 border border-slate-100 p-5">
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">{item.status}</div>
                  <div className="mt-2 text-2xl font-black text-slate-900">{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[2rem] border border-rose-100 bg-rose-50/60 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-white border border-rose-100 text-rose-600 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Actions importantes</h3>
                <p className="text-sm text-slate-500 font-medium">Ce que l'administrateur doit traiter en priorite.</p>
              </div>
            </div>
            <div className="space-y-3">
              {priorityItems.length > 0 ? (
                priorityItems.map((item) => (
                  <button
                    key={item.key}
                    onClick={() => navigate(item.path)}
                    className="w-full rounded-2xl bg-white border border-rose-100 px-4 py-3 flex items-center justify-between text-left hover:border-rose-200 transition-all"
                  >
                    <span className="text-sm font-bold text-slate-700">{item.label}</span>
                    <ArrowRight className="w-4 h-4 text-rose-500" />
                  </button>
                ))
              ) : (
                <div className="rounded-2xl bg-white border border-emerald-100 px-4 py-4 text-sm font-bold text-emerald-700">
                  Aucun sujet critique en attente.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 mb-4">Alertes plateforme</h3>
            <div className="space-y-3 text-sm">
              <div className="rounded-2xl bg-slate-50 border border-slate-100 px-4 py-3 flex justify-between gap-4">
                <span className="text-slate-600 font-medium">Entreprises proches du quota</span>
                <span className="font-black text-slate-900">{alerts.nearQuota?.length || 0}</span>
              </div>
              <div className="rounded-2xl bg-slate-50 border border-slate-100 px-4 py-3 flex justify-between gap-4">
                <span className="text-slate-600 font-medium">Echecs de soumission TTN</span>
                <span className="font-black text-slate-900">{alerts.failedTtn?.length || 0}</span>
              </div>
              <div className="rounded-2xl bg-slate-50 border border-slate-100 px-4 py-3 flex justify-between gap-4">
                <span className="text-slate-600 font-medium">Signatures manquantes</span>
                <span className="font-black text-slate-900">{alerts.missingSignatures?.length || 0}</span>
              </div>
              <div className="rounded-2xl bg-slate-50 border border-slate-100 px-4 py-3 flex justify-between gap-4">
                <span className="text-slate-600 font-medium">Paiements en echec</span>
                <span className="font-black text-slate-900">{alerts.failedPayments?.length || 0}</span>
              </div>
              <div className="rounded-2xl bg-slate-50 border border-slate-100 px-4 py-3 flex justify-between gap-4">
                <span className="text-slate-600 font-medium">Tickets non resolus</span>
                <span className="font-black text-slate-900">{alerts.unresolvedTickets?.length || 0}</span>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 mb-4">Resume financier</h3>
            <div className="space-y-3">
              <div className="rounded-2xl bg-premium-50 border border-premium-100 px-4 py-3">
                <div className="text-[10px] font-black uppercase tracking-widest text-premium-500">Revenu mensuel</div>
                <div className="mt-2 text-2xl font-black text-premium-700">{kpis.monthlyRevenue || 0} TND</div>
              </div>
              <div className="rounded-2xl bg-amber-50 border border-amber-100 px-4 py-3">
                <div className="text-[10px] font-black uppercase tracking-widest text-amber-500">Paiements en attente</div>
                <div className="mt-2 text-2xl font-black text-amber-700">{kpis.pendingPayments || 0}</div>
              </div>
              <div className="rounded-2xl bg-emerald-50 border border-emerald-100 px-4 py-3">
                <div className="text-[10px] font-black uppercase tracking-widest text-emerald-500">TTN acceptees</div>
                <div className="mt-2 text-2xl font-black text-emerald-700">{kpis.ttnAcceptedInvoices || 0}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
