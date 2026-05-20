import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CreditCard, Loader2, Receipt, RefreshCcw, Search, Settings, Wallet } from 'lucide-react';
import api from '../../services/api';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { getPlanLabel } from '../../utils/planLabels';

const TABS = [
  { id: 'subscription', label: 'Paiements abonnement' },
  { id: 'manual', label: 'Paiements manuels' },
  { id: 'invoice', label: 'Paiements factures clients' },
  { id: 'attention', label: 'Echecs / attente' },
  { id: 'config', label: 'Configuration billing' },
];

const statusVariant = (status) => {
  if (['paid', 'manual', 'PAID'].includes(status)) return 'success';
  if (['failed', 'cancelled', 'FAILED'].includes(status)) return 'rejected';
  if (['pending', 'PARTIAL'].includes(status)) return 'warning';
  if (status === 'refunded') return 'secondary';
  return 'secondary';
};

const money = (amount, currency = 'TND') => `${Number(amount || 0).toFixed(2)} ${currency}`;

const PaymentTable = ({ rows, type, onUpdateStatus }) => (
  <Card noPadding className="overflow-hidden">
    <div className="hidden xl:block overflow-x-auto">
      <table className="w-full">
        <thead className="bg-slate-50/60 border-b border-slate-100">
          <tr>
            {(type === 'invoice'
              ? ['Entreprise', 'Facture client', 'Client', 'Montant', 'Statut', 'Methode', 'Reference', 'Date']
              : ['Entreprise', 'Plan', 'Montant', 'Statut', 'Methode', 'Periode', 'Reference provider', 'Note', 'Actions']
            ).map((label) => (
              <th key={label} className="px-5 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {rows.map((row) => (
            <tr key={row.id} className="hover:bg-slate-50/40">
              <td className="px-5 py-4 text-sm font-bold text-slate-800">{row.companyName || row.companyId}</td>
              {type === 'invoice' ? (
                <>
                  <td className="px-5 py-4 text-sm text-slate-600">{row.invoiceNumber || row.invoiceId?.slice(0, 8) || '-'}</td>
                  <td className="px-5 py-4 text-sm text-slate-600">{row.clientName || '-'}</td>
                  <td className="px-5 py-4 text-sm font-black text-slate-900">{money(row.amount, row.currency)}</td>
                  <td className="px-5 py-4"><Badge variant={statusVariant(row.status)}>{row.status || '-'}</Badge></td>
                  <td className="px-5 py-4 text-sm text-slate-600">{row.method || '-'}</td>
                  <td className="px-5 py-4 text-sm text-slate-600">{row.reference || '-'}</td>
                  <td className="px-5 py-4 text-sm text-slate-600">{row.paymentDate ? new Date(row.paymentDate).toLocaleDateString() : '-'}</td>
                </>
              ) : (
                <>
                  <td className="px-5 py-4"><Badge variant="secondary">{getPlanLabel(row.plan)}</Badge></td>
                  <td className="px-5 py-4 text-sm font-black text-slate-900">{money(row.amount, row.currency)}</td>
                  <td className="px-5 py-4"><Badge variant={statusVariant(row.status)}>{row.status}</Badge></td>
                  <td className="px-5 py-4 text-sm text-slate-600">{row.method || '-'}</td>
                  <td className="px-5 py-4 text-sm text-slate-600">
                    {row.periodStart ? new Date(row.periodStart).toLocaleDateString() : '-'} {'->'} {row.periodEnd ? new Date(row.periodEnd).toLocaleDateString() : row.nextBillingDate ? new Date(row.nextBillingDate).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-600">{row.providerReference || '-'}</td>
                  <td className="px-5 py-4 text-sm text-slate-600 max-w-[220px]"><div className="line-clamp-2">{row.note || '-'}</div></td>
                  <td className="px-5 py-4">
                    {row.source === 'manual_platform_payment' || String(row.id).startsWith('derived_') ? (
                      <div className="flex flex-wrap gap-2">
                        <button onClick={() => onUpdateStatus(row, 'paid')} className="px-3 py-2 rounded-xl bg-emerald-50 text-xs font-bold text-emerald-700">Marquer paye</button>
                        <button onClick={() => onUpdateStatus(row, 'pending')} className="px-3 py-2 rounded-xl bg-amber-50 text-xs font-bold text-amber-700">En attente</button>
                        <button onClick={() => onUpdateStatus(row, 'failed')} className="px-3 py-2 rounded-xl bg-rose-50 text-xs font-bold text-rose-700">Echec</button>
                      </div>
                    ) : <Badge variant="secondary">Lecture seule</Badge>}
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    <div className="xl:hidden p-4 space-y-4">
      {rows.map((row) => (
        <div key={row.id} className="rounded-[2rem] border border-slate-100 bg-white p-5 shadow-sm space-y-4">
          <div className="flex justify-between gap-4">
            <div>
              <div className="text-lg font-black text-slate-900">{row.companyName || row.companyId}</div>
              <div className="text-sm text-slate-500">{type === 'invoice' ? row.invoiceNumber || row.invoiceId : getPlanLabel(row.plan)}</div>
            </div>
            <Badge variant={statusVariant(row.status)}>{row.status}</Badge>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-2xl bg-slate-50 px-4 py-3"><strong>Montant:</strong> {money(row.amount, row.currency)}</div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3"><strong>Methode:</strong> {row.method || '-'}</div>
          </div>
        </div>
      ))}
    </div>

    {rows.length === 0 ? (
      <div className="p-16 text-center">
        <Wallet className="w-12 h-12 text-slate-200 mx-auto mb-4" />
        <p className="text-sm font-bold text-slate-500">Aucun paiement dans cette vue.</p>
      </div>
    ) : null}
  </Card>
);

const AdminPayments = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ summary: {}, rows: [] });
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState('subscription');

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

  const matchesQuery = useCallback((row) =>
    `${row.companyName || ''} ${row.companyEmail || ''} ${row.plan || ''} ${row.status || ''} ${row.method || ''} ${row.invoiceNumber || ''} ${row.clientName || ''}`.toLowerCase().includes(query.toLowerCase()), [query]);

  const tabRows = useMemo(() => {
    const source = {
      subscription: data.subscriptionPayments || [],
      manual: data.manualPlatformPayments || [],
      invoice: data.invoicePayments || [],
      attention: data.failedPendingPayments || [],
      config: [],
    }[activeTab] || [];
    return source.filter(matchesQuery);
  }, [activeTab, data, matchesQuery]);

  const updateStatus = async (row, status) => {
    await api[String(row.id).startsWith('derived_') ? 'post' : 'put'](
      String(row.id).startsWith('derived_') ? '/admin/payments' : `/admin/payments/${row.id}`,
      {
        companyId: row.companyId,
        plan: row.plan,
        amount: row.amount,
        currency: row.currency || 'TND',
        status,
        paymentDate: status === 'paid' ? new Date().toISOString() : row.paymentDate,
        periodStart: row.periodStart,
        periodEnd: row.periodEnd,
        nextBillingDate: row.nextBillingDate,
        method: row.method || 'Manual',
        providerReference: row.providerReference,
        note: row.note || 'Suivi manuel admin',
      }
    );
    await load();
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-premium-600" /></div>;
  }

  const billing = data.billingConfig || {};

  return (
    <div className="space-y-6">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Paiements & Billing</h2>
          <p className="text-sm text-slate-500 font-medium">Separez les abonnements plateforme des paiements de factures clients.</p>
        </div>
        <Button variant="secondary" icon={RefreshCcw} onClick={load}>Actualiser</Button>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-6 gap-4">
        <Card><div className="text-[10px] font-black uppercase tracking-widest text-slate-400">MRR</div><div className="mt-2 text-2xl font-black text-slate-900">{data.summary?.mrr || 0} TND</div></Card>
        <Card><div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Collecte manuelle</div><div className="mt-2 text-2xl font-black text-premium-600">{data.summary?.revenueThisMonth || 0} TND</div></Card>
        <Card><div className="text-[10px] font-black uppercase tracking-widest text-slate-400">En attente</div><div className="mt-2 text-2xl font-black text-amber-600">{data.summary?.pendingPayments || 0}</div></Card>
        <Card><div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Echecs</div><div className="mt-2 text-2xl font-black text-rose-600">{data.summary?.failedPayments || 0}</div></Card>
        <Card><div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Paiements factures</div><div className="mt-2 text-2xl font-black text-emerald-600">{data.summary?.businessInvoicePayments || 0}</div></Card>
        <Card><div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Provider</div><div className="mt-2 text-sm font-black text-slate-900">{billing.providerConfigured ? 'Configure' : 'Manuel'}</div></Card>
      </div>

      {billing.warning ? (
        <Card>
          <div className="rounded-2xl bg-amber-50 border border-amber-100 px-4 py-4 text-sm font-bold text-amber-800">
            {billing.warning}
          </div>
        </Card>
      ) : null}

      <Card>
        <div className="flex flex-col xl:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Entreprise, plan, facture, client, methode..."
              className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-11 py-3 text-sm outline-none focus:ring-4 focus:ring-premium-100"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 rounded-2xl text-xs font-black transition-all ${activeTab === tab.id ? 'bg-premium-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {activeTab === 'config' ? (
        <Card title="Configuration billing" subtitle="Statuts uniquement, aucun secret expose" icon={Settings}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
            <div className="rounded-2xl bg-slate-50 border border-slate-100 px-4 py-4"><strong>Provider:</strong> {billing.provider || 'manual'}</div>
            <div className="rounded-2xl bg-slate-50 border border-slate-100 px-4 py-4"><strong>Provider configure:</strong> {billing.providerConfigured ? 'Oui' : 'Non'}</div>
            <div className="rounded-2xl bg-slate-50 border border-slate-100 px-4 py-4"><strong>Webhook:</strong> {billing.webhookConfigured ? 'Configure' : 'Manquant'}</div>
            <div className="rounded-2xl bg-slate-50 border border-slate-100 px-4 py-4"><strong>Renouvellement auto:</strong> {billing.automaticRenewalEnabled ? 'Oui' : 'Non'}</div>
            <div className="rounded-2xl bg-slate-50 border border-slate-100 px-4 py-4"><strong>Factures abonnement:</strong> {billing.subscriptionInvoiceGeneration ? 'Oui' : 'Non'}</div>
            <div className="rounded-2xl bg-slate-50 border border-slate-100 px-4 py-4"><strong>Success URL:</strong> {billing.successUrlConfigured ? 'Configuree' : 'Manquante'}</div>
            <div className="rounded-2xl bg-slate-50 border border-slate-100 px-4 py-4"><strong>Cancel URL:</strong> {billing.cancelUrlConfigured ? 'Configuree' : 'Manquante'}</div>
          </div>
          <div className="mt-5 space-y-2">
            {(billing.missingRequirements || []).map((item) => (
              <div key={item} className="rounded-2xl bg-amber-50 border border-amber-100 px-4 py-3 text-sm font-bold text-amber-800">{item}</div>
            ))}
          </div>
        </Card>
      ) : (
        <PaymentTable rows={tabRows} type={activeTab === 'invoice' ? 'invoice' : 'platform'} onUpdateStatus={updateStatus} />
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <CreditCard className="w-10 h-10 p-2 rounded-2xl bg-premium-50 text-premium-600" />
            <div>
              <div className="text-sm font-black text-slate-900">Abonnements plateforme</div>
              <div className="text-sm text-slate-500">Paiements dus par les entreprises pour utiliser InvoicePro.</div>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <Receipt className="w-10 h-10 p-2 rounded-2xl bg-emerald-50 text-emerald-600" />
            <div>
              <div className="text-sm font-black text-slate-900">Paiements factures clients</div>
              <div className="text-sm text-slate-500">Reglements enregistres par les entreprises pour leurs propres clients.</div>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-10 h-10 p-2 rounded-2xl bg-rose-50 text-rose-600" />
            <div>
              <div className="text-sm font-black text-slate-900">Pas de fausse confirmation</div>
              <div className="text-sm text-slate-500">Les statuts provider restent manuels tant qu'aucun fournisseur reel n'est connecte.</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminPayments;
