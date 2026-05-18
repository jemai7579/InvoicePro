import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Download,
  FileCode2,
  Filter,
  Loader2,
  QrCode,
  Receipt,
  RefreshCcw,
  Search,
  ShieldCheck,
} from 'lucide-react';
import api from '../../services/api';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';

const statusVariant = (value) => {
  if (['FINALIZED', 'TTN_ACCEPTED', 'PAID', 'VALIDATED'].includes(value)) return 'success';
  if (['TTN_REJECTED', 'REJECTED'].includes(value)) return 'rejected';
  if (['SUBMITTED_TO_TTN', 'TTN_PROCESSING', 'SIGNATURE_REQUIRED', 'READY_FOR_TEIF'].includes(value)) return 'warning';
  if (['SIGNED', 'TEIF_GENERATED'].includes(value)) return 'primary';
  return 'secondary';
};

const currency = (value) =>
  Number(value || 0).toLocaleString('fr-TN', { minimumFractionDigits: 3, maximumFractionDigits: 3 });

const rangeMatch = (amount, selectedRange) => {
  if (selectedRange === 'all') return true;
  if (selectedRange === 'lt1000') return amount < 1000;
  if (selectedRange === '1000-5000') return amount >= 1000 && amount <= 5000;
  return amount > 5000;
};

const AdminInvoices = () => {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState('');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [ttnFilter, setTtnFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');
  const [amountFilter, setAmountFilter] = useState('all');

  const load = async () => {
    try {
      const res = await api.get('/admin/invoices');
      setRows(res.data || []);
    } catch (error) {
      console.error('Unable to fetch admin invoices', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const companies = useMemo(
    () => ['all', ...Array.from(new Set(rows.map((row) => row.company?.name).filter(Boolean)))],
    [rows]
  );

  const filtered = rows.filter((row) => {
    const haystack = `${row.invoiceNumber || ''} ${row.company?.name || ''} ${row.client?.name || ''} ${row.status || ''} ${row.complianceStatus || ''}`.toLowerCase();
    const companyPlan = row.company?.subscription?.plan || row.plan || 'STARTER';
    return (
      haystack.includes(query.toLowerCase()) &&
      (companyFilter === 'all' || row.company?.name === companyFilter) &&
      (statusFilter === 'all' || row.status === statusFilter) &&
      (ttnFilter === 'all' || row.complianceStatus === ttnFilter) &&
      (planFilter === 'all' || companyPlan === planFilter) &&
      rangeMatch(Number(row.netToPay || row.totalTTC || 0), amountFilter)
    );
  });

  const stats = {
    total: rows.length,
    accepted: rows.filter((row) => ['TTN_ACCEPTED', 'FINALIZED'].includes(row.complianceStatus)).length,
    rejected: rows.filter((row) => row.complianceStatus === 'TTN_REJECTED').length,
    processing: rows.filter((row) => ['SUBMITTED_TO_TTN', 'TTN_PROCESSING'].includes(row.complianceStatus)).length,
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
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Factures</h2>
          <p className="text-sm text-slate-500 font-medium">
            Surveillez toutes les factures de la plateforme, leur statut fiscal et leur cycle TTN.
          </p>
        </div>
        <Button variant="secondary" icon={RefreshCcw} onClick={load}>Actualiser</Button>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <Card><div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total factures</div><div className="mt-2 text-2xl font-black text-slate-900">{stats.total}</div></Card>
        <Card><div className="text-[10px] font-black uppercase tracking-widest text-slate-400">TTN acceptees</div><div className="mt-2 text-2xl font-black text-emerald-600">{stats.accepted}</div></Card>
        <Card><div className="text-[10px] font-black uppercase tracking-widest text-slate-400">TTN en attente</div><div className="mt-2 text-2xl font-black text-amber-600">{stats.processing}</div></Card>
        <Card><div className="text-[10px] font-black uppercase tracking-widest text-slate-400">TTN rejetees</div><div className="mt-2 text-2xl font-black text-rose-600">{stats.rejected}</div></Card>
      </div>

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-3">
          <div className="relative xl:col-span-2">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Numero, entreprise, client..."
              className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-11 py-3 text-sm outline-none focus:ring-4 focus:ring-premium-100"
            />
          </div>
          <select value={companyFilter} onChange={(event) => setCompanyFilter(event.target.value)} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm outline-none">
            {companies.map((company) => <option key={company} value={company}>{company === 'all' ? 'Toutes les entreprises' : company}</option>)}
          </select>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm outline-none">
            {['all', 'DRAFT', 'VALIDATED', 'PAID', 'REJECTED'].map((option) => <option key={option} value={option}>{option === 'all' ? 'Statut facture' : option}</option>)}
          </select>
          <select value={ttnFilter} onChange={(event) => setTtnFilter(event.target.value)} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm outline-none">
            {['all', 'DRAFT', 'READY_FOR_TEIF', 'TEIF_GENERATED', 'SIGNATURE_REQUIRED', 'SIGNED', 'SUBMITTED_TO_TTN', 'TTN_PROCESSING', 'TTN_ACCEPTED', 'TTN_REJECTED', 'FINALIZED'].map((option) => (
              <option key={option} value={option}>{option === 'all' ? 'Statut TTN' : option}</option>
            ))}
          </select>
          <div className="grid grid-cols-2 gap-3">
            <select value={planFilter} onChange={(event) => setPlanFilter(event.target.value)} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm outline-none">
              {['all', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE'].map((option) => <option key={option} value={option}>{option === 'all' ? 'Plan' : option}</option>)}
            </select>
            <select value={amountFilter} onChange={(event) => setAmountFilter(event.target.value)} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm outline-none">
              <option value="all">Montant</option>
              <option value="lt1000">Moins de 1 000</option>
              <option value="1000-5000">1 000 a 5 000</option>
              <option value="gt5000">Plus de 5 000</option>
            </select>
          </div>
        </div>
      </Card>

      <Card noPadding className="overflow-hidden">
        <div className="hidden xl:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50/60 border-b border-slate-100">
              <tr>
                {['Facture', 'Entreprise', 'Client', 'Montant', 'Statut', 'TTN', 'TEIF', 'Signature', 'Creation', 'Derniere maj', 'Actions'].map((label) => (
                  <th key={label} className="px-5 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/40">
                  <td className="px-5 py-4">
                    <div className="font-black text-slate-900">{row.invoiceNumber || row.id.slice(0, 8).toUpperCase()}</div>
                    <div className="text-xs text-slate-400">#{row.id.slice(0, 8)}</div>
                  </td>
                  <td className="px-5 py-4 text-sm font-bold text-slate-800">{row.company?.name || '-'}</td>
                  <td className="px-5 py-4 text-sm text-slate-600">{row.client?.name || '-'}</td>
                  <td className="px-5 py-4 text-sm font-black text-slate-900">{currency(row.netToPay || row.totalTTC)} TND</td>
                  <td className="px-5 py-4"><Badge variant={statusVariant(row.status)}>{row.status}</Badge></td>
                  <td className="px-5 py-4"><Badge variant={statusVariant(row.complianceStatus)}>{row.complianceLabelFr || row.complianceStatus}</Badge></td>
                  <td className="px-5 py-4"><Badge variant={row.teifStatus === 'generated' ? 'success' : 'secondary'}>{row.teifStatus === 'generated' ? 'Genere' : 'Manquant'}</Badge></td>
                  <td className="px-5 py-4"><Badge variant={row.signatureStatus === 'signed' ? 'success' : 'warning'}>{row.signatureStatus === 'signed' ? 'Signee' : 'Requise'}</Badge></td>
                  <td className="px-5 py-4 text-sm text-slate-600">{new Date(row.createdAt).toLocaleDateString()}</td>
                  <td className="px-5 py-4 text-sm text-slate-600">{new Date(row.updatedAt).toLocaleDateString()}</td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-2">
                      <button className="p-2 rounded-xl bg-slate-50 text-slate-500 hover:text-premium-600" title="Voir la facture"><Receipt className="w-4 h-4" /></button>
                      <button className="p-2 rounded-xl bg-slate-50 text-slate-500 hover:text-indigo-600" title="Metadonnees TEIF"><FileCode2 className="w-4 h-4" /></button>
                      <button className="p-2 rounded-xl bg-slate-50 text-slate-500 hover:text-emerald-600" title="TTN / QR"><QrCode className="w-4 h-4" /></button>
                      <button className="p-2 rounded-xl bg-slate-50 text-slate-500 hover:text-amber-600" title="Telecharger"><Download className="w-4 h-4" /></button>
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
                  <div className="text-lg font-black text-slate-900">{row.invoiceNumber || row.id.slice(0, 8).toUpperCase()}</div>
                  <div className="text-sm text-slate-500">{row.company?.name || '-'}</div>
                </div>
                <Badge variant={statusVariant(row.complianceStatus)}>{row.complianceLabelFr || row.complianceStatus}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl bg-slate-50 px-4 py-3"><strong>Client:</strong> {row.client?.name || '-'}</div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3"><strong>Montant:</strong> {currency(row.netToPay || row.totalTTC)} TND</div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3"><strong>TEIF:</strong> {row.teifStatus}</div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3"><strong>Signature:</strong> {row.signatureStatus}</div>
              </div>
              <div className="grid grid-cols-4 gap-2">
                <button className="p-3 rounded-2xl bg-slate-50 text-slate-600"><Receipt className="w-4 h-4 mx-auto" /></button>
                <button className="p-3 rounded-2xl bg-slate-50 text-indigo-600"><FileCode2 className="w-4 h-4 mx-auto" /></button>
                <button className="p-3 rounded-2xl bg-slate-50 text-emerald-600"><QrCode className="w-4 h-4 mx-auto" /></button>
                <button className="p-3 rounded-2xl bg-slate-50 text-amber-600"><Download className="w-4 h-4 mx-auto" /></button>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="p-16 text-center">
            <Receipt className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-sm font-bold text-slate-500">Aucune facture ne correspond aux filtres selectionnes.</p>
          </div>
        ) : null}
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center"><Clock3 className="w-5 h-5" /></div>
            <div>
              <div className="text-sm font-black text-slate-900">Verification manuelle</div>
              <div className="text-sm text-slate-500">Utilisez les filtres TTN pour identifier les factures a verifier en priorite.</div>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><CheckCircle2 className="w-5 h-5" /></div>
            <div>
              <div className="text-sm font-black text-slate-900">Final PDF</div>
              <div className="text-sm text-slate-500">Le PDF final ne doit etre telecharge qu'apres acceptation TTN ou finalisation.</div>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center"><AlertTriangle className="w-5 h-5" /></div>
            <div>
              <div className="text-sm font-black text-slate-900">Audit fiscal</div>
              <div className="text-sm text-slate-500">L'admin surveille le flux fiscal sans modifier silencieusement les donnees de facture.</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminInvoices;
