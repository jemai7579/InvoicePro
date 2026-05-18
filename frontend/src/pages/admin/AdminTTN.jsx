import React, { useEffect, useState } from 'react';
import { AlertTriangle, Clock3, Loader2, RefreshCcw, ShieldAlert, Wifi, XCircle } from 'lucide-react';
import api from '../../services/api';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';

const statusVariant = (status) => {
  if (['TTN_ACCEPTED', 'FINALIZED'].includes(status)) return 'success';
  if (status === 'TTN_REJECTED') return 'rejected';
  if (['SUBMITTED_TO_TTN', 'TTN_PROCESSING'].includes(status)) return 'warning';
  return 'secondary';
};

const AdminTTN = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ summary: {}, warnings: {}, rows: [] });

  const load = async () => {
    try {
      const res = await api.get('/admin/ttn');
      setData(res.data || { summary: {}, warnings: {}, rows: [] });
    } catch (error) {
      console.error('Unable to fetch TTN monitoring', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-premium-600" /></div>;
  }

  const warningItems = [
    { active: data.warnings?.ttnConnectionNotConfigured, label: 'Connexion TTN non configuree' },
    { active: data.warnings?.manyRejectedInvoices, label: 'Trop de rejets TTN recents' },
    { active: data.warnings?.signatureMissing, label: 'Signatures electroniques manquantes' },
    { active: data.warnings?.teifGenerationErrors, label: 'Erreurs de generation TEIF' },
    { active: data.warnings?.integrationModeInactive, label: 'Mode reel TTN inactif' },
  ].filter((item) => item.active);

  return (
    <div className="space-y-6">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Suivi TTN</h2>
          <p className="text-sm text-slate-500 font-medium">Supervisez les soumissions, les retours TTN, les rejets et les synchronisations.</p>
        </div>
        <Button variant="secondary" icon={RefreshCcw} onClick={load}>Actualiser</Button>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-6 gap-4">
        <Card><div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Soumises</div><div className="mt-2 text-2xl font-black text-slate-900">{data.summary?.totalSubmitted || 0}</div></Card>
        <Card><div className="text-[10px] font-black uppercase tracking-widest text-slate-400">En traitement</div><div className="mt-2 text-2xl font-black text-amber-600">{data.summary?.processing || 0}</div></Card>
        <Card><div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Acceptees</div><div className="mt-2 text-2xl font-black text-emerald-600">{data.summary?.accepted || 0}</div></Card>
        <Card><div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Rejetees</div><div className="mt-2 text-2xl font-black text-rose-600">{data.summary?.rejected || 0}</div></Card>
        <Card><div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Echecs</div><div className="mt-2 text-2xl font-black text-slate-900">{data.summary?.failedSubmissions || 0}</div></Card>
        <Card><div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Derniere synchro</div><div className="mt-2 text-sm font-black text-slate-900">{data.summary?.lastSync ? new Date(data.summary.lastSync).toLocaleString() : '-'}</div></Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[0.9fr_1.1fr] gap-6">
        <Card title="Alertes TTN" subtitle="Points a traiter en priorite">
          <div className="space-y-3">
            {warningItems.length > 0 ? warningItems.map((item) => (
              <div key={item.label} className="rounded-2xl bg-rose-50 border border-rose-100 px-4 py-4 flex items-center gap-3">
                <ShieldAlert className="w-5 h-5 text-rose-600" />
                <div className="text-sm font-bold text-rose-700">{item.label}</div>
              </div>
            )) : (
              <div className="rounded-2xl bg-emerald-50 border border-emerald-100 px-4 py-4 text-sm font-bold text-emerald-700">
                Aucune alerte critique TTN pour le moment.
              </div>
            )}
          </div>
        </Card>

        <Card title="Informations de pilotage" subtitle="Vision simple pour un dirigeant">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="rounded-2xl bg-slate-50 border border-slate-100 px-4 py-4">
              <div className="text-sm font-black text-slate-900">Temps moyen de traitement</div>
              <div className="mt-2 text-2xl font-black text-premium-600">{data.summary?.averageProcessingTimeHours || 0} h</div>
            </div>
            <div className="rounded-2xl bg-slate-50 border border-slate-100 px-4 py-4">
              <div className="text-sm font-black text-slate-900">Mode actif</div>
              <div className="mt-2 text-2xl font-black text-slate-900">{data.warnings?.integrationModeInactive ? 'Test / mock' : 'Operationnel'}</div>
            </div>
            <div className="rounded-2xl bg-slate-50 border border-slate-100 px-4 py-4">
              <div className="text-sm font-black text-slate-900">Rejets a corriger</div>
              <div className="mt-2 text-2xl font-black text-rose-600">{data.summary?.rejected || 0}</div>
            </div>
            <div className="rounded-2xl bg-slate-50 border border-slate-100 px-4 py-4">
              <div className="text-sm font-black text-slate-900">Soumissions en cours</div>
              <div className="mt-2 text-2xl font-black text-amber-600">{data.summary?.processing || 0}</div>
            </div>
          </div>
        </Card>
      </div>

      <Card noPadding className="overflow-hidden">
        <div className="hidden xl:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50/60 border-b border-slate-100">
              <tr>
                {['Entreprise', 'Facture', 'ID soumission', 'Reference TTN', 'Statut', 'Erreur', 'Derniere synchro', 'Action'].map((label) => (
                  <th key={label} className="px-5 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {(data.rows || []).map((row) => (
                <tr key={row.invoiceId} className="hover:bg-slate-50/40">
                  <td className="px-5 py-4 text-sm font-bold text-slate-800">{row.company || '-'}</td>
                  <td className="px-5 py-4 text-sm text-slate-600">#{row.invoiceId?.slice(0, 8)}</td>
                  <td className="px-5 py-4 text-sm text-slate-600">{row.submissionId || '-'}</td>
                  <td className="px-5 py-4 text-sm text-slate-600">{row.ttnReference || '-'}</td>
                  <td className="px-5 py-4"><Badge variant={statusVariant(row.status)}>{row.status}</Badge></td>
                  <td className="px-5 py-4 text-sm text-slate-600 max-w-[280px]"><div className="line-clamp-2">{row.errorMessage || '-'}</div></td>
                  <td className="px-5 py-4 text-sm text-slate-600">{row.lastSync ? new Date(row.lastSync).toLocaleString() : '-'}</td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-2">
                      <button className="px-3 py-2 rounded-xl bg-slate-50 text-xs font-bold text-slate-700">Verifier</button>
                      <button className="px-3 py-2 rounded-xl bg-amber-50 text-xs font-bold text-amber-700">Relancer</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="xl:hidden p-4 space-y-4">
          {(data.rows || []).map((row) => (
            <div key={row.invoiceId} className="rounded-[2rem] border border-slate-100 bg-white p-5 shadow-sm space-y-4">
              <div className="flex justify-between gap-4">
                <div>
                  <div className="text-lg font-black text-slate-900">{row.company || '-'}</div>
                  <div className="text-sm text-slate-500">#{row.invoiceId?.slice(0, 8)}</div>
                </div>
                <Badge variant={statusVariant(row.status)}>{row.status}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl bg-slate-50 px-4 py-3"><strong>Ref TTN:</strong> {row.ttnReference || '-'}</div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3"><strong>Sync:</strong> {row.lastSync ? new Date(row.lastSync).toLocaleDateString() : '-'}</div>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">{row.errorMessage || 'Aucune erreur detaillee.'}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default AdminTTN;
