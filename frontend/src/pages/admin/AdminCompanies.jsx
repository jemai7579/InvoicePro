import React, { useEffect, useMemo, useState } from 'react';
import { CalendarPlus, Eye, Loader2, Search, ShieldCheck, ShieldOff, Trash2, Unlock } from 'lucide-react';
import api from '../../services/api';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { getPlanLabel } from '../../utils/planLabels';

const FILTERS = [
  ['all', 'Tous'],
  ['PENDING_APPROVAL', 'Pending approval'],
  ['ACTIVE', 'Active'],
  ['BLOCKED', 'Blocked'],
  ['EXPIRED', 'Expired'],
  ['pending_payment', 'Pending payment'],
  ['GRACE_ACCESS', 'Trial/grace access'],
];

const statusVariant = (status) => {
  if (['ACTIVE', 'GRACE_ACCESS', 'paid', 'manual', 'not_required'].includes(status)) return 'success';
  if (['PENDING_APPROVAL', 'pending', 'PENDING_PAYMENT'].includes(status)) return 'warning';
  if (['BLOCKED', 'EXPIRED', 'SOFT_DELETED', 'failed', 'cancelled'].includes(status)) return 'rejected';
  return 'secondary';
};

const formatDate = (value) => (value ? new Date(value).toLocaleDateString('fr-FR') : '-');

const AddAccessDaysModal = ({ company, onClose, onSaved }) => {
  const [days, setDays] = useState(7);
  const [reason, setReason] = useState('Acces temporaire avant paiement');
  const [adminComment, setAdminComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post(`/admin/companies/${company.id}/add-access-days`, { days: Number(days), reason, adminComment });
      await onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Impossible d'ajouter l'acces temporaire.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <form onSubmit={submit} className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-5">
          <h3 className="text-lg font-black text-slate-900">Ajouter des jours d'acces</h3>
          <p className="text-sm text-slate-500">{company.name}</p>
        </div>
        {error ? <div className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{error}</div> : null}
        <div className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-xs font-black uppercase tracking-widest text-slate-400">Nombre de jours</span>
            <input type="number" min="1" max="365" value={days} onChange={(event) => setDays(event.target.value)} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-premium-100" required />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-black uppercase tracking-widest text-slate-400">Raison</span>
            <input value={reason} onChange={(event) => setReason(event.target.value)} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-premium-100" required />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-black uppercase tracking-widest text-slate-400">Commentaire interne</span>
            <textarea value={adminComment} onChange={(event) => setAdminComment(event.target.value)} rows={3} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-premium-100" />
          </label>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>Annuler</Button>
          <Button type="submit" icon={CalendarPlus} isLoading={saving}>Ajouter</Button>
        </div>
      </form>
    </div>
  );
};

const DetailsPanel = ({ company, details, onClose }) => (
  <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
    <div className="max-h-[88vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
      <div className="sticky top-0 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-4">
        <div>
          <h3 className="text-lg font-black text-slate-900">{company.name}</h3>
          <p className="text-sm text-slate-500">{company.email}</p>
        </div>
        <button onClick={onClose} className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-bold text-slate-700">Fermer</button>
      </div>
      <div className="grid gap-4 p-6 md:grid-cols-2">
        {[
          ['Telephone', details?.phone || company.phone || '-'],
          ['Plan', getPlanLabel(details?.subscriptionCard?.plan || company.subscription?.plan)],
          ['Statut compte', details?.accountStatus || company.accountStatus],
          ['Paiement', details?.paymentStatus || company.paymentStatus],
          ['Expiration', formatDate(details?.accessExpiresAt || company.accessExpiresAt)],
          ['Jours restants', details?.remainingAccessDays ?? company.remainingAccessDays ?? '-'],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl bg-slate-50 px-4 py-3">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</div>
            <div className="mt-1 text-sm font-bold text-slate-800">{value}</div>
          </div>
        ))}
      </div>
      <div className="grid gap-4 px-6 pb-6 md:grid-cols-2">
        <Card title="Paiements / abonnement">
          <div className="space-y-2 text-sm text-slate-600">
            {(details?.billingSummary?.platformPayments || []).slice(0, 5).map((payment) => (
              <div key={payment.id} className="flex justify-between rounded-xl bg-slate-50 px-3 py-2">
                <span>{payment.amount} {payment.currency || 'TND'}</span>
                <Badge variant={statusVariant(payment.status)}>{payment.status}</Badge>
              </div>
            ))}
            {(details?.billingSummary?.platformPayments || []).length === 0 ? <div>Aucun paiement plateforme.</div> : null}
          </div>
        </Card>
        <Card title="Activite / audit">
          <div className="space-y-2 text-sm text-slate-600">
            {(details?.statusHistory || []).slice(0, 6).map((item) => (
              <div key={item.id} className="rounded-xl bg-slate-50 px-3 py-2">
                <div className="font-bold text-slate-800">{item.actionType || 'status_change'}: {item.newValue}</div>
                <div className="text-xs text-slate-400">{formatDate(item.createdAt)} {item.note ? `- ${item.note}` : ''}</div>
              </div>
            ))}
            {(details?.statusHistory || []).length === 0 ? <div>Aucune action sensible enregistree.</div> : null}
          </div>
        </Card>
      </div>
    </div>
  </div>
);

const AdminCompanies = () => {
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState([]);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [accessTarget, setAccessTarget] = useState(null);
  const [detailsTarget, setDetailsTarget] = useState(null);
  const [details, setDetails] = useState(null);
  const [busyId, setBusyId] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/companies');
      setCompanies(res.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => companies.filter((company) => {
    const text = `${company.name || ''} ${company.email || ''} ${company.phone || ''}`.toLowerCase();
    const matchesSearch = text.includes(query.toLowerCase());
    const matchesFilter = filter === 'all'
      || company.accountStatus === filter
      || (filter === 'pending_payment' && company.paymentStatus === 'pending');
    return matchesSearch && matchesFilter;
  }), [companies, filter, query]);

  const runAction = async (company, action) => {
    setBusyId(`${company.id}-${action}`);
    try {
      if (action === 'approve') await api.patch(`/admin/companies/${company.id}/approve`, {});
      if (action === 'block') await api.patch(`/admin/companies/${company.id}/block`, { reason: 'Blocage manuel admin' });
      if (action === 'unblock') await api.patch(`/admin/companies/${company.id}/unblock`, {});
      if (action === 'delete') await api.delete(`/admin/companies/${company.id}`, { data: { confirmPermanentDelete: false } });
      await load();
    } finally {
      setBusyId('');
    }
  };

  const openDetails = async (company) => {
    setDetailsTarget(company);
    setDetails(null);
    const res = await api.get(`/admin/companies/${company.id}`);
    setDetails(res.data);
  };

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-premium-600" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black tracking-tight text-slate-900">Comptes entreprises</h2>
        <p className="text-sm font-medium text-slate-500">Validation, acces temporaire, blocage et audit des comptes clients.</p>
      </div>

      <Card>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher par entreprise, email ou telephone" className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm outline-none focus:ring-4 focus:ring-premium-100" />
          </div>
          <div className="flex flex-wrap gap-2">
            {FILTERS.map(([value, label]) => (
              <button key={value} onClick={() => setFilter(value)} className={`rounded-xl px-3 py-2 text-xs font-black ${filter === value ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Card noPadding className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1180px]">
            <thead className="bg-slate-50 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">
              <tr>
                {['Entreprise', 'Email', 'Telephone', 'Plan', 'Abonnement', 'Paiement', 'Compte', 'Creation', 'Expiration', 'Restant', 'Derniere connexion', 'Actions'].map((label) => (
                  <th key={label} className="px-4 py-3">{label}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((company) => (
                <tr key={company.id} className="text-sm">
                  <td className="px-4 py-4 font-black text-slate-900">{company.name}</td>
                  <td className="px-4 py-4 text-slate-600">{company.email}</td>
                  <td className="px-4 py-4 text-slate-600">{company.phone || '-'}</td>
                  <td className="px-4 py-4 text-slate-600">{getPlanLabel(company.subscription?.plan)}</td>
                  <td className="px-4 py-4"><Badge variant={statusVariant(company.subscriptionStatus)}>{company.subscriptionStatus}</Badge></td>
                  <td className="px-4 py-4"><Badge variant={statusVariant(company.paymentStatus)}>{company.paymentStatus}</Badge></td>
                  <td className="px-4 py-4"><Badge variant={statusVariant(company.accountStatus)}>{company.accountStatus}</Badge></td>
                  <td className="px-4 py-4 text-slate-600">{formatDate(company.createdAt)}</td>
                  <td className="px-4 py-4 text-slate-600">{formatDate(company.accessExpiresAt)}</td>
                  <td className="px-4 py-4 text-slate-600">{company.remainingAccessDays ?? '-'}</td>
                  <td className="px-4 py-4 text-slate-600">{formatDate(company.lastLogin)}</td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      <button title="Details" onClick={() => openDetails(company)} className="rounded-lg bg-slate-100 p-2 text-slate-700"><Eye className="h-4 w-4" /></button>
                      <button title="Approve" disabled={busyId} onClick={() => runAction(company, 'approve')} className="rounded-lg bg-emerald-50 p-2 text-emerald-700"><ShieldCheck className="h-4 w-4" /></button>
                      <button title="Add access days" onClick={() => setAccessTarget(company)} className="rounded-lg bg-blue-50 p-2 text-blue-700"><CalendarPlus className="h-4 w-4" /></button>
                      {company.accountStatus === 'BLOCKED' ? (
                        <button title="Unblock" disabled={busyId} onClick={() => runAction(company, 'unblock')} className="rounded-lg bg-emerald-50 p-2 text-emerald-700"><Unlock className="h-4 w-4" /></button>
                      ) : (
                        <button title="Block" disabled={busyId} onClick={() => runAction(company, 'block')} className="rounded-lg bg-rose-50 p-2 text-rose-700"><ShieldOff className="h-4 w-4" /></button>
                      )}
                      <button title="Soft delete" disabled={busyId} onClick={() => runAction(company, 'delete')} className="rounded-lg bg-slate-100 p-2 text-slate-700"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {filtered.length === 0 ? <Card><div className="py-8 text-center text-sm font-bold text-slate-500">Aucun compte ne correspond a ces criteres.</div></Card> : null}
      {accessTarget ? <AddAccessDaysModal company={accessTarget} onClose={() => setAccessTarget(null)} onSaved={load} /> : null}
      {detailsTarget ? <DetailsPanel company={detailsTarget} details={details} onClose={() => setDetailsTarget(null)} /> : null}
    </div>
  );
};

export default AdminCompanies;
