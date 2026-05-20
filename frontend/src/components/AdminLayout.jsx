import React, { useContext, useMemo, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  Building2,
  CreditCard,
  FileCode2,
  HeartHandshake,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Menu,
  Receipt,
  Settings,
  Users,
  Wallet,
  Wifi,
  X,
} from 'lucide-react';
import { AdminAuthContext } from '../context/AdminAuthContext';
import BrandLogo from './BrandLogo';

const NAV_ITEMS = [
  { id: 'overview', path: '/admin', label: 'Vue globale', icon: LayoutDashboard, aliases: ['/admin/dashboard'] },
  { id: 'companies', path: '/admin/companies', label: 'Entreprises', icon: Building2 },
  { id: 'users', path: '/admin/users', label: 'Utilisateurs', icon: Users },
  { id: 'subscriptions', path: '/admin/subscriptions', label: 'Abonnements', icon: CreditCard },
  { id: 'invoices', path: '/admin/invoices', label: 'Factures', icon: Receipt },
  { id: 'ttn', path: '/admin/ttn', label: 'Suivi TTN', icon: Wifi },
  { id: 'compliance', path: '/admin/compliance', label: 'Conformite TEIF / Signature', icon: FileCode2 },
  { id: 'payments', path: '/admin/payments', label: 'Paiements', icon: Wallet },
  { id: 'support', path: '/admin/support', label: 'Support & tickets', icon: HelpCircle },
  { id: 'activity', path: '/admin/activity-logs', label: "Logs d'activite", icon: Activity, aliases: ['/admin/activity'] },
  { id: 'errors', path: '/admin/system-errors', label: 'Erreurs systeme', icon: AlertTriangle },
  { id: 'settings', path: '/admin/settings', label: 'Parametres plateforme', icon: Settings },
  { id: 'analyticsSeo', path: '/admin/analytics-seo', label: 'Analytics & SEO', icon: BarChart3 },
];

const SUBTITLES = {
  overview: 'Vue executif des entreprises, factures, conformite et alertes.',
  companies: 'Pilotez les entreprises, statuts, dossiers et notes internes.',
  users: 'Consultez les admins plateforme et comptes entreprises.',
  subscriptions: 'Suivez plans, quotas, renouvellements et risques abonnement.',
  invoices: 'Surveillez les factures et leur cycle de conformite.',
  ttn: 'Controlez le suivi TTN sans supposer de reponse officielle.',
  compliance: 'Visualisez TEIF, signature et readiness de production.',
  payments: 'Suivez paiements plateforme et factures client.',
  support: 'Gerez les tickets entre clients et admin.',
  activity: 'Recherchez les actions sensibles et exportez la piste audit.',
  errors: 'Suivez les erreurs operationnelles et leur resolution.',
  settings: 'Configurez parametres, integrations et notifications globales.',
  analyticsSeo: 'Analysez trafic, conversions, SEO et opportunites de contenu.',
};

const AdminLayout = () => {
  const { admin, adminLogout } = useContext(AdminAuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const currentItem = useMemo(
    () =>
      NAV_ITEMS.find(
        (item) =>
          location.pathname === item.path ||
          location.pathname.startsWith(`${item.path}/`) ||
          item.aliases?.some((alias) => location.pathname === alias || location.pathname.startsWith(`${alias}/`))
      ) || NAV_ITEMS[0],
    [location.pathname]
  );

  const handleLogout = () => {
    adminLogout();
    navigate('/admin/login');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans">
      {isSidebarOpen ? (
        <div className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm md:hidden" onClick={() => setIsSidebarOpen(false)} />
      ) : null}

      <aside
        className={`fixed inset-y-0 start-0 z-50 flex w-72 flex-col bg-slate-900 text-white transition-transform duration-300 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:static md:translate-x-0`}
      >
        <div className="h-16 flex items-center justify-between px-6 border-b border-white/10">
          <Link to="/admin" className="flex items-center gap-3">
            <BrandLogo variant="icon" className="h-9 w-9 rounded-xl" />
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.25em] text-premium-300">Admin Control</div>
            </div>
          </Link>
          <button type="button" onClick={() => setIsSidebarOpen(false)} className="md:hidden p-2 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              location.pathname === item.path ||
              location.pathname.startsWith(`${item.path}/`) ||
              item.aliases?.some((alias) => location.pathname === alias || location.pathname.startsWith(`${alias}/`));

            return (
              <Link
                key={item.id}
                to={item.path}
                onClick={() => setIsSidebarOpen(false)}
                className={`group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition-all ${
                  isActive ? 'bg-premium-600 text-white shadow-lg shadow-premium-900/30' : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-premium-300'}`} />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>

        <div className="p-4 border-t border-white/10">
          <div className="rounded-3xl bg-white/5 p-4 border border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-slate-800 border border-white/5 flex items-center justify-center text-premium-300 font-black">
                {admin?.name?.charAt(0) || 'A'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-black text-white">{admin?.name || 'Platform admin'}</div>
                <div className="truncate text-[10px] font-black uppercase tracking-widest text-slate-400">{admin?.email}</div>
              </div>
              <button type="button" onClick={handleLogout} className="p-2 text-slate-500 hover:text-red-400">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100">
              <Menu className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-lg font-black text-slate-900 tracking-tight">{currentItem.label}</h1>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">{SUBTITLES[currentItem.id]}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Plateforme active
            </div>
            <button type="button" className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100">
              <Bell className="w-5 h-5" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-3 sm:p-5 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
