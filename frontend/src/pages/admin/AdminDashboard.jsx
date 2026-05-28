import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Building2, CheckCircle2, Clock3, CreditCard, Headphones, Loader2, Settings, ShieldOff, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';
import { getPlanLabel } from '../../utils/planLabels';

const statusVariant = (status) => {
  if (['ACTIVE', 'GRACE_ACCESS', 'configured'].includes(status)) return 'success';
  if (['PENDING_APPROVAL', 'pending', 'missing'].includes(status)) return 'warning';
  if (['BLOCKED', 'EXPIRED', 'SOFT_DELETED'].includes(status)) return 'rejected';
  return 'secondary';
};

const Stat = ({ label, value, icon, tone }) => {
  const StatIcon = icon;
  return (
    <Card className="min-w-0">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</div>
          <div className="mt-2 text-2xl font-black text-slate-900">{value || 0}</div>
        </div>
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tone}`}>
          <StatIcon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
};

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [companies, setCompanies] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [overviewRes, companiesRes] = await Promise.all([
          api.get('/admin/overview'),
          api.get('/admin/companies'),
        ]);
        setOverview(overviewRes.data);
        setCompanies(companiesRes.data || []);
      } catch (error) {
        console.error('Unable to load admin dashboard', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const kpis = overview?.kpis || {};
  const system = overview?.systemStatus || {};
  const recentAccounts = useMemo(() => companies.slice(0, 8), [companies]);

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-premium-600" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900">Dashboard admin</h2>
          <p className="text-sm font-medium text-slate-500">Comptes, paiements, support et integrations dans une vue simple.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/admin/companies" className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white">Gerer les comptes</Link>
          <Link to="/admin/support" className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-700 ring-1 ring-slate-200">Support</Link>
          <Link to="/admin/settings" className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-700 ring-1 ring-slate-200">Integrations</Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Entreprises / users" value={kpis.totalCompanies || kpis.totalUsers} icon={Users} tone="bg-blue-50 text-blue-700" />
        <Stat label="En attente" value={kpis.pendingAccounts} icon={Clock3} tone="bg-amber-50 text-amber-700" />
        <Stat label="Actifs" value={kpis.activeAccounts} icon={CheckCircle2} tone="bg-emerald-50 text-emerald-700" />
        <Stat label="Bloques" value={kpis.blockedAccounts} icon={ShieldOff} tone="bg-rose-50 text-rose-700" />
        <Stat label="Expires" value={kpis.expiredAccounts} icon={AlertTriangle} tone="bg-orange-50 text-orange-700" />
        <Stat label="Paiement en attente" value={kpis.pendingPaymentAccounts || kpis.pendingPayments} icon={CreditCard} tone="bg-violet-50 text-violet-700" />
        <Stat label="Support ouvert" value={kpis.openSupportTickets} icon={Headphones} tone="bg-cyan-50 text-cyan-700" />
        <Stat label="TTN / AI config" value={`${system.ttn === 'configured' ? 'TTN OK' : 'TTN -'} / ${system.ai === 'configured' ? 'AI OK' : 'AI -'}`} icon={Settings} tone="bg-slate-100 text-slate-700" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px]">
        <Card noPadding className="overflow-hidden">
          <div className="border-b border-slate-100 px-5 py-4">
            <div className="text-sm font-black uppercase tracking-widest text-slate-900">Comptes recents</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead className="bg-slate-50 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">
                <tr>
                  {['Entreprise', 'Email', 'Plan', 'Compte', 'Paiement', 'Expiration'].map((label) => (
                    <th key={label} className="px-5 py-3">{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {recentAccounts.map((company) => (
                  <tr key={company.id} className="text-sm">
                    <td className="px-5 py-4 font-black text-slate-900">{company.name}</td>
                    <td className="px-5 py-4 text-slate-600">{company.email}</td>
                    <td className="px-5 py-4 text-slate-600">{getPlanLabel(company.subscription?.plan)}</td>
                    <td className="px-5 py-4"><Badge variant={statusVariant(company.accountStatus)}>{company.accountStatus}</Badge></td>
                    <td className="px-5 py-4"><Badge variant={statusVariant(company.paymentStatus)}>{company.paymentStatus}</Badge></td>
                    <td className="px-5 py-4 text-slate-600">{company.accessExpiresAt ? new Date(company.accessExpiresAt).toLocaleDateString() : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="Integrations" subtitle="Secrets masques cote API">
          <div className="space-y-3">
            {[
              ['TTN', system.ttn],
              ['AI', system.ai],
              ['Email SMTP', system.email],
              ['Database', system.database],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                <span className="text-sm font-bold text-slate-700">{label}</span>
                <Badge variant={statusVariant(value)}>{value || 'missing'}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
