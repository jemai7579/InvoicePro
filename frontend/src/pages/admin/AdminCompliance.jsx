import React, { useEffect, useState } from 'react';
import { FileCode2, Loader2, RefreshCcw, ShieldCheck, Wifi } from 'lucide-react';
import api from '../../services/api';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';

const statusVariant = (value) => {
  if (['available', true, 'configured'].includes(value)) return 'success';
  if (['missing', false].includes(value)) return 'rejected';
  return 'secondary';
};

const AdminCompliance = () => {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);

  const load = async () => {
    try {
      const res = await api.get('/admin/compliance');
      setRows(res.data || []);
    } catch (error) {
      console.error('Unable to fetch compliance overview', error);
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Conformite TEIF / Signature</h2>
          <p className="text-sm text-slate-500 font-medium">Controlez la preparation TEIF, la signature et le mode TTN entreprise par entreprise.</p>
        </div>
        <Button variant="secondary" icon={RefreshCcw} onClick={load}>Actualiser</Button>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <Card><div className="text-[10px] font-black uppercase tracking-widest text-slate-400">TEIF disponible</div><div className="mt-2 text-2xl font-black text-emerald-600">{rows.filter((row) => row.teifGenerationStatus === 'available').length}</div></Card>
        <Card><div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Signature configuree</div><div className="mt-2 text-2xl font-black text-premium-600">{rows.filter((row) => row.signatureConfigured).length}</div></Card>
        <Card><div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Mode mock</div><div className="mt-2 text-2xl font-black text-amber-600">{rows.filter((row) => row.ttnMode === 'mock').length}</div></Card>
        <Card><div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Dernieres erreurs</div><div className="mt-2 text-2xl font-black text-rose-600">{rows.filter((row) => !!row.lastError).length}</div></Card>
      </div>

      <Card noPadding className="overflow-hidden">
        <div className="hidden xl:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50/60 border-b border-slate-100">
              <tr>
                {['Entreprise', 'TEIF', 'Signature', 'Provider', 'Expiration', 'Mode TTN', 'Dernier succes', 'Derniere erreur', 'Actions'].map((label) => (
                  <th key={label} className="px-5 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {rows.map((row) => (
                <tr key={row.companyId} className="hover:bg-slate-50/40">
                  <td className="px-5 py-4 text-sm font-bold text-slate-800">{row.companyName}</td>
                  <td className="px-5 py-4"><Badge variant={statusVariant(row.teifGenerationStatus)}>{row.teifGenerationStatus}</Badge></td>
                  <td className="px-5 py-4"><Badge variant={statusVariant(row.signatureConfigured)}>{row.signatureConfigured ? 'Configuree' : 'Manquante'}</Badge></td>
                  <td className="px-5 py-4 text-sm text-slate-600">{row.signatureProvider || '-'}</td>
                  <td className="px-5 py-4 text-sm text-slate-600">{row.certificateExpirationDate ? new Date(row.certificateExpirationDate).toLocaleDateString() : '-'}</td>
                  <td className="px-5 py-4"><Badge variant={row.ttnMode === 'mock' ? 'warning' : 'success'}>{row.ttnMode}</Badge></td>
                  <td className="px-5 py-4 text-sm text-slate-600">{row.lastSuccessfulSubmission ? new Date(row.lastSuccessfulSubmission).toLocaleString() : '-'}</td>
                  <td className="px-5 py-4 text-sm text-slate-600 max-w-[280px]"><div className="line-clamp-2">{row.lastError || '-'}</div></td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-2">
                      <button className="px-3 py-2 rounded-xl bg-slate-50 text-xs font-bold text-slate-700">Voir config</button>
                      <button className="px-3 py-2 rounded-xl bg-premium-50 text-xs font-bold text-premium-700">Tester signature</button>
                      <button className="px-3 py-2 rounded-xl bg-amber-50 text-xs font-bold text-amber-700">Tester TTN</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="xl:hidden p-4 space-y-4">
          {rows.map((row) => (
            <div key={row.companyId} className="rounded-[2rem] border border-slate-100 bg-white p-5 shadow-sm space-y-4">
              <div className="flex justify-between gap-4">
                <div className="text-lg font-black text-slate-900">{row.companyName}</div>
                <Badge variant={row.ttnMode === 'mock' ? 'warning' : 'success'}>{row.ttnMode}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl bg-slate-50 px-4 py-3"><strong>TEIF:</strong> {row.teifGenerationStatus}</div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3"><strong>Signature:</strong> {row.signatureConfigured ? 'Configuree' : 'Manquante'}</div>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">{row.lastError || 'Aucune erreur recente.'}</div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <FileCode2 className="w-10 h-10 p-2 rounded-2xl bg-premium-50 text-premium-600" />
            <div>
              <div className="text-sm font-black text-slate-900">TEIF supervise</div>
              <div className="text-sm text-slate-500">L'admin identifie vite les entreprises qui n'ont pas encore une chaine TEIF complete.</div>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-10 h-10 p-2 rounded-2xl bg-emerald-50 text-emerald-600" />
            <div>
              <div className="text-sm font-black text-slate-900">Secrets proteges</div>
              <div className="text-sm text-slate-500">Les certificats, PINs et identifiants ne remontent jamais dans le frontend.</div>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <Wifi className="w-10 h-10 p-2 rounded-2xl bg-amber-50 text-amber-600" />
            <div>
              <div className="text-sm font-black text-slate-900">Mode TTN visible</div>
              <div className="text-sm text-slate-500">Le mode mock, test ou production reste lisible pour eviter toute confusion.</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminCompliance;
