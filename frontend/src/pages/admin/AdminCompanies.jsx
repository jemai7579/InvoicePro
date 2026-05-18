import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  Building2,
  CreditCard,
  Eye,
  FileText,
  Loader2,
  MessageSquare,
  RefreshCcw,
  RotateCcw,
  Search,
  ShieldCheck,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import api from '../../services/api';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';

const statusVariant = (value) => {
  if (['ACTIVE', 'healthy', 'configured'].includes(value)) return 'success';
  if (['attention', 'missing'].includes(value)) return 'warning';
  if (['CANCELLED', 'suspended'].includes(value)) return 'rejected';
  return 'secondary';
};

const DetailModal = ({ companyId, onClose, onRefresh }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [note, setNote] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await api.get(`/admin/companies/${companyId}`);
      setData(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    load();
  }, [load]);

  const saveNote = async () => {
    if (!note.trim()) return;
    await api.post(`/admin/companies/${companyId}/notes`, { content: note });
    setNote('');
    await load();
    onRefresh();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-[2.5rem] bg-white shadow-2xl">
        <div className="sticky top-0 bg-white border-b border-slate-100 px-8 py-5 flex items-center justify-between rounded-t-[2.5rem]">
          <div>
            <h3 className="text-lg font-black text-slate-900">Fiche entreprise</h3>
            <p className="text-sm text-slate-500 font-medium">Vue detaillee, usage, TTN, notes et activite recente.</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>
        {loading ? (
          <div className="py-24 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-premium-600" /></div>
        ) : data ? (
          <div className="p-8 space-y-8">
            <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-6">
              <Card>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-premium-50 text-premium-600 flex items-center justify-center font-black text-xl">
                      {data.name?.charAt(0)}
                    </div>
                    <div>
                      <div className="text-xl font-black text-slate-900">{data.name}</div>
                      <div className="text-sm text-slate-500 font-medium">{data.email}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="rounded-2xl bg-slate-50 border border-slate-100 px-4 py-3"><strong>RNE:</strong> {data.registreCommerce || '-'}</div>
                    <div className="rounded-2xl bg-slate-50 border border-slate-100 px-4 py-3"><strong>Matricule fiscal:</strong> {data.matriculeFiscal || '-'}</div>
                    <div className="rounded-2xl bg-slate-50 border border-slate-100 px-4 py-3"><strong>Plan:</strong> {data.subscription?.plan || 'STARTER'}</div>
                    <div className="rounded-2xl bg-slate-50 border border-slate-100 px-4 py-3"><strong>Statut abonnement:</strong> {data.subscription?.status || 'TRIAL'}</div>
                    <div className="rounded-2xl bg-slate-50 border border-slate-100 px-4 py-3"><strong>Signature:</strong> {data.signatureConfiguration?.configured ? 'Configuree' : 'Non configuree'}</div>
                    <div className="rounded-2xl bg-slate-50 border border-slate-100 px-4 py-3"><strong>Mode TTN:</strong> {data.ttnConfiguration?.mode || 'mock'}</div>
                  </div>
                </div>
              </Card>

              <Card>
                <div className="space-y-4">
                  <div className="text-sm font-black uppercase tracking-widest text-slate-900">Notes admin</div>
                  <div className="space-y-3 max-h-52 overflow-y-auto">
                    {(data.adminNotes || []).length > 0 ? (
                      data.adminNotes.map((entry) => (
                        <div key={entry.id} className="rounded-2xl bg-slate-50 border border-slate-100 px-4 py-3">
                          <div className="text-xs font-black text-slate-900">{entry.authorName}</div>
                          <div className="text-[11px] text-slate-400 font-medium">{new Date(entry.createdAt).toLocaleString()}</div>
                          <div className="mt-2 text-sm text-slate-700">{entry.content}</div>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-slate-400">Aucune note interne.</div>
                    )}
                  </div>
                  <textarea
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    className="w-full min-h-[110px] rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-premium-100"
                    placeholder="Ajouter une note interne visible uniquement par les admins..."
                  />
                  <Button onClick={saveNote} size="sm" icon={MessageSquare}>Ajouter la note</Button>
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <Card title="Utilisateurs lies">
                <div className="space-y-3">
                  {(data.linkedUsers || []).map((user) => (
                    <div key={user.id} className="rounded-2xl bg-slate-50 border border-slate-100 px-4 py-3 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-900">{user.name}</div>
                        <div className="text-sm text-slate-500">{user.email}</div>
                      </div>
                      <Badge variant={statusVariant(user.status === 'Active' ? 'ACTIVE' : 'CANCELLED')}>{user.role}</Badge>
                    </div>
                  ))}
                </div>
              </Card>

              <Card title="Tickets support">
                <div className="space-y-3">
                  {(data.supportTickets || []).length > 0 ? (
                    data.supportTickets.map((ticket) => (
                      <div key={ticket.id} className="rounded-2xl bg-slate-50 border border-slate-100 px-4 py-3">
                        <div className="font-bold text-slate-900">{ticket.subject}</div>
                        <div className="text-sm text-slate-500">{ticket.status} - {ticket.priority}</div>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-slate-400">Aucun ticket de support pour cette entreprise.</div>
                  )}
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <Card title="Factures recentes">
                <div className="space-y-3">
                  {(data.recentInvoices || []).map((invoice) => (
                    <div key={invoice.id} className="rounded-2xl bg-slate-50 border border-slate-100 px-4 py-3 flex items-center justify-between gap-3">
                      <div>
                        <div className="font-bold text-slate-900">#{invoice.id.slice(0, 8).toUpperCase()}</div>
                        <div className="text-sm text-slate-500">{invoice.client?.name || '-'}</div>
                      </div>
                      <div className="text-right">
                        <Badge variant={statusVariant(invoice.complianceStatus || invoice.status)}>{invoice.complianceLabelFr || invoice.status}</Badge>
                        <div className="text-sm font-black text-slate-900 mt-2">{Number(invoice.netToPay || 0).toLocaleString(undefined, { minimumFractionDigits: 3 })} TND</div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card title="Historique recent">
                <div className="space-y-3">
                  {(data.recentActivityLogs || []).length > 0 ? (
                    data.recentActivityLogs.map((entry) => (
                      <div key={entry.id} className="rounded-2xl bg-slate-50 border border-slate-100 px-4 py-3">
                        <div className="font-bold text-slate-900">{entry.field}</div>
                        <div className="text-sm text-slate-500">{entry.oldValue || '-'} {'->'} {entry.newValue || '-'}</div>
                        <div className="text-[11px] text-slate-400 mt-1">{new Date(entry.createdAt).toLocaleString()}</div>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-slate-400">Aucune modification recente.</div>
                  )}
                </div>
              </Card>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

const AdminCompanies = () => {
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState([]);
  const [query, setQuery] = useState('');
  const [selectedCompanyId, setSelectedCompanyId] = useState(null);

  const load = async () => {
    try {
      const res = await api.get('/admin/companies');
      setCompanies(res.data || []);
    } catch (error) {
      console.error('Unable to fetch companies', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = companies.filter((company) => {
    const haystack = `${company.name} ${company.email} ${company.rne || ''} ${company.matriculeFiscal || ''}`.toLowerCase();
    return haystack.includes(query.toLowerCase());
  });

  const mutate = async (endpoint, body = {}, method = 'put') => {
    await api[method](endpoint, body);
    await load();
  };

  return (
    <div className="space-y-6">
      {selectedCompanyId ? <DetailModal companyId={selectedCompanyId} onClose={() => setSelectedCompanyId(null)} onRefresh={load} /> : null}

      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Entreprises</h2>
          <p className="text-sm text-slate-500 font-medium">Pilotez les comptes entreprise, le plan, le quota, TTN et la signature depuis un seul tableau.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-full xl:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Nom, email, RNE, MF..."
              className="w-full rounded-2xl border border-slate-100 bg-white px-11 py-3 text-sm outline-none focus:ring-4 focus:ring-premium-100"
            />
          </div>
          <Button variant="secondary" onClick={load} icon={RefreshCcw}>Actualiser</Button>
        </div>
      </div>

      {loading ? (
        <div className="py-24 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-premium-600" /></div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card><div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total</div><div className="text-2xl font-black text-slate-900 mt-2">{companies.length}</div></Card>
            <Card><div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Actives</div><div className="text-2xl font-black text-emerald-600 mt-2">{companies.filter((c) => c.subscriptionStatus === 'ACTIVE').length}</div></Card>
            <Card><div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Signature OK</div><div className="text-2xl font-black text-premium-600 mt-2">{companies.filter((c) => c.signatureStatus === 'configured').length}</div></Card>
            <Card><div className="text-[10px] font-black uppercase tracking-widest text-slate-400">TTN attention</div><div className="text-2xl font-black text-amber-600 mt-2">{companies.filter((c) => c.ttnStatus === 'attention').length}</div></Card>
          </div>

          <Card noPadding className="overflow-hidden">
            <div className="hidden xl:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50/60 border-b border-slate-100">
                  <tr>
                    {['Entreprise', 'Email', 'Telephone', 'RNE', 'Matricule fiscal', 'Plan', 'Statut abonnement', 'Factures ce mois', 'TTN', 'Signature', 'Creation', 'Derniere activite', 'Actions'].map((label) => (
                      <th key={label} className="px-5 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map((company) => (
                    <tr key={company.id} className="hover:bg-slate-50/40 align-top">
                      <td className="px-5 py-4"><div className="font-black text-slate-900">{company.name}</div></td>
                      <td className="px-5 py-4 text-sm text-slate-600">{company.email}</td>
                      <td className="px-5 py-4 text-sm text-slate-600">{company.phone || '-'}</td>
                      <td className="px-5 py-4 text-sm text-slate-600">{company.rne || '-'}</td>
                      <td className="px-5 py-4 text-sm text-slate-600">{company.matriculeFiscal || '-'}</td>
                      <td className="px-5 py-4"><Badge variant="secondary">{company.subscription?.plan || 'STARTER'}</Badge></td>
                      <td className="px-5 py-4"><Badge variant={statusVariant(company.subscriptionStatus)}>{company.subscriptionStatus}</Badge></td>
                      <td className="px-5 py-4 text-sm font-bold text-slate-900">{company.invoicesUsedThisMonth}</td>
                      <td className="px-5 py-4"><Badge variant={statusVariant(company.ttnStatus)}>{company.ttnStatus}</Badge></td>
                      <td className="px-5 py-4"><Badge variant={statusVariant(company.signatureStatus)}>{company.signatureStatus}</Badge></td>
                      <td className="px-5 py-4 text-sm text-slate-600">{new Date(company.createdAt).toLocaleDateString()}</td>
                      <td className="px-5 py-4 text-sm text-slate-600">{new Date(company.lastActivity).toLocaleDateString()}</td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-2">
                          <button onClick={() => setSelectedCompanyId(company.id)} className="p-2 rounded-xl bg-slate-50 text-slate-500 hover:text-premium-600"><Eye className="w-4 h-4" /></button>
                          <button onClick={() => mutate(`/admin/companies/${company.id}/status`, { status: company.subscriptionStatus === 'ACTIVE' ? 'CANCELLED' : 'ACTIVE' })} className="p-2 rounded-xl bg-slate-50 text-slate-500 hover:text-amber-600"><AlertTriangle className="w-4 h-4" /></button>
                          <button onClick={() => mutate(`/admin/companies/${company.id}/plan`, { plan: company.subscription?.plan === 'PROFESSIONAL' ? 'ENTERPRISE' : 'PROFESSIONAL' })} className="p-2 rounded-xl bg-slate-50 text-slate-500 hover:text-premium-600"><CreditCard className="w-4 h-4" /></button>
                          <button onClick={() => mutate(`/admin/companies/${company.id}/reset-quota`, {}, 'post')} className="p-2 rounded-xl bg-slate-50 text-slate-500 hover:text-emerald-600"><RotateCcw className="w-4 h-4" /></button>
                          <button onClick={() => mutate(`/admin/companies/${company.id}`, {}, 'delete')} className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="xl:hidden p-4 space-y-4">
              {filtered.map((company) => (
                <div key={company.id} className="rounded-[2rem] border border-slate-100 bg-white p-5 shadow-sm space-y-4">
                  <div className="flex justify-between gap-4">
                    <div>
                      <div className="text-lg font-black text-slate-900">{company.name}</div>
                      <div className="text-sm text-slate-500">{company.email}</div>
                    </div>
                    <Badge variant={statusVariant(company.subscriptionStatus)}>{company.subscriptionStatus}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-2xl bg-slate-50 px-4 py-3"><strong>Plan:</strong> {company.subscription?.plan || 'STARTER'}</div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-3"><strong>Factures:</strong> {company.invoicesUsedThisMonth}</div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-3"><strong>TTN:</strong> {company.ttnStatus}</div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-3"><strong>Signature:</strong> {company.signatureStatus}</div>
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    <button onClick={() => setSelectedCompanyId(company.id)} className="p-3 rounded-2xl bg-slate-50 text-slate-600"><Eye className="w-4 h-4 mx-auto" /></button>
                    <button onClick={() => mutate(`/admin/companies/${company.id}/status`, { status: company.subscriptionStatus === 'ACTIVE' ? 'CANCELLED' : 'ACTIVE' })} className="p-3 rounded-2xl bg-slate-50 text-amber-600"><AlertTriangle className="w-4 h-4 mx-auto" /></button>
                    <button onClick={() => mutate(`/admin/companies/${company.id}/plan`, { plan: company.subscription?.plan === 'PROFESSIONAL' ? 'ENTERPRISE' : 'PROFESSIONAL' })} className="p-3 rounded-2xl bg-slate-50 text-premium-600"><CreditCard className="w-4 h-4 mx-auto" /></button>
                    <button onClick={() => mutate(`/admin/companies/${company.id}/reset-quota`, {}, 'post')} className="p-3 rounded-2xl bg-slate-50 text-emerald-600"><RotateCcw className="w-4 h-4 mx-auto" /></button>
                    <button onClick={() => mutate(`/admin/companies/${company.id}`, {}, 'delete')} className="p-3 rounded-2xl bg-rose-50 text-rose-600"><Trash2 className="w-4 h-4 mx-auto" /></button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
};

export default AdminCompanies;
