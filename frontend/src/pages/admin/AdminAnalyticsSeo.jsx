import React, { useEffect, useState } from 'react';
import { BarChart3, ExternalLink, Loader2, SearchCheck, TrendingUp } from 'lucide-react';
import api from '../../services/api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';

const Metric = ({ label, value }) => (
  <Card>
    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</div>
    <div className="mt-2 text-2xl font-black text-slate-900">{value ?? '-'}</div>
  </Card>
);

const AdminAnalyticsSeo = () => {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [searchConsole, setSearchConsole] = useState(null);
  const [audit, setAudit] = useState([]);

  useEffect(() => {
    Promise.all([
      api.get('/admin/analytics/overview'),
      api.get('/admin/seo/search-console'),
      api.get('/admin/seo/pages-audit'),
    ])
      .then(([overviewRes, searchRes, auditRes]) => {
        setOverview(overviewRes.data);
        setSearchConsole(searchRes.data);
        setAudit(auditRes.data || []);
      })
      .catch((error) => console.error('Unable to fetch analytics SEO data', error))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-premium-600" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-black tracking-tight text-slate-900">Analytics & SEO</h2>
        <p className="text-sm font-medium text-slate-500">Trafic interne reel, statut Google et audit SEO sans donnees inventees.</p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <Metric label="Visiteurs" value={overview?.totalVisitors} />
        <Metric label="Visiteurs uniques" value={overview?.uniqueVisitors} />
        <Metric label="Pages vues" value={overview?.pageViews} />
        <Metric label="Sessions" value={overview?.sessions} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card title="Pages principales" subtitle="Basee sur les evenements internes">
          <div className="space-y-3">
            {(overview?.topPages || []).map((page) => (
              <div key={page.name} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                <span className="text-sm font-bold text-slate-700">{page.name}</span>
                <Badge variant="primary">{page.count}</Badge>
              </div>
            ))}
            {(overview?.topPages || []).length === 0 ? <div className="text-sm font-bold text-slate-400">Aucun trafic interne enregistre.</div> : null}
          </div>
        </Card>

        <Card title="Sources & appareils" subtitle="Referrers et device type si disponibles">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(overview?.referrers || []).slice(0, 5).map((item) => (
              <div key={`ref-${item.name}`} className="rounded-2xl bg-slate-50 border border-slate-100 px-4 py-3 text-sm">
                <div className="font-black text-slate-800">{item.name}</div>
                <div className="text-slate-500">{item.count} visites</div>
              </div>
            ))}
            {(overview?.devices || []).map((item) => (
              <div key={`device-${item.name}`} className="rounded-2xl bg-slate-50 border border-slate-100 px-4 py-3 text-sm">
                <div className="font-black text-slate-800">{item.name}</div>
                <div className="text-slate-500">{item.count} evenements</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card title="Funnel conversion" subtitle="Visitor -> Guide -> Register -> Account -> First invoice">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {(overview?.funnel || []).map((step) => (
            <div key={step.label} className="rounded-2xl border border-slate-100 bg-white px-4 py-4">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">{step.label}</div>
              <div className="mt-2 text-xl font-black text-premium-600">{step.count}</div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card title="Google Search Console" subtitle="Donnees externes uniquement si connecte">
          {searchConsole?.configured ? (
            <div className="grid grid-cols-2 gap-3">
              <Metric label="Clics" value={searchConsole.clicks} />
              <Metric label="Impressions" value={searchConsole.impressions} />
              <Metric label="CTR" value={searchConsole.ctr} />
              <Metric label="Position moyenne" value={searchConsole.averagePosition} />
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
              <SearchCheck className="mx-auto mb-3 h-8 w-8 text-slate-300" />
              <div className="text-sm font-black text-slate-700">Google Search Console non connecte.</div>
              <div className="mt-1 text-sm text-slate-500">Renseignez le site URL et le service account pour afficher clics, impressions, CTR et requetes.</div>
            </div>
          )}
        </Card>

        <Card title="Recommendations" subtitle="Regles simples basees sur les donnees disponibles">
          <div className="space-y-3">
            {(overview?.recommendations || []).map((item) => (
              <div key={item} className="flex gap-3 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900">
                <TrendingUp className="h-4 w-4 shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card title="Audit SEO pages publiques" subtitle="Verifie les balises disponibles dans le build frontend">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                {['Page', 'Title', 'Description', 'H1', 'Canonical', 'OpenGraph', 'Sitemap', 'Robots'].map((label) => (
                  <th key={label} className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {audit.map((row) => (
                <tr key={row.path}>
                  <td className="px-4 py-3 text-sm font-black text-slate-900">{row.path}</td>
                  {['title', 'metaDescription', 'h1', 'canonical', 'openGraph', 'sitemap', 'robots'].map((key) => (
                    <td key={key} className="px-4 py-3"><Badge variant={row[key] === true ? 'success' : 'secondary'}>{String(row[key])}</Badge></td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default AdminAnalyticsSeo;
