import React, { useContext, useState } from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { AdminAuthContext } from '../context/AdminAuthContext';
import {
  LayoutDashboard,
  Users,
  Receipt,
  CreditCard,
  Settings,
  LogOut,
  Bell,
  Menu,
  X,
  ShieldCheck,
  Activity,
  Globe
} from 'lucide-react';

const adminNavItems = [
  { id: 'dashboard',     path: '/admin/dashboard',     label: 'Vue globale',      icon: LayoutDashboard },
  { id: 'companies',     path: '/admin/users',         label: 'Entreprises',      icon: Users },
  { id: 'invoices',      path: '/admin/invoices',      label: 'Flux factures',    icon: Receipt },
  { id: 'subscriptions', path: '/admin/subscriptions', label: 'Abonnements',      icon: CreditCard },
  { id: 'activity',      path: '/admin/activity',      label: 'Logs activité',    icon: Activity },
  { id: 'settings',      path: '/admin/settings',      label: 'Système',          icon: Settings },
];

const AdminLayout = () => {
  const { admin, adminLogout } = useContext(AdminAuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = () => {
    adminLogout();
    navigate('/admin/login');
  };

  const currentNavItem = adminNavItems.find(item => location.pathname.startsWith(item.path)) || adminNavItems[0];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Admin Sidebar */}
      <aside className={`
        fixed inset-y-0 start-0 z-50 w-72 bg-slate-900 text-white flex flex-col 
        transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 md:static md:flex
      `}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="bg-premium-500 p-1.5 rounded-xl">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div className="text-lg font-black tracking-tight">
              Admin <span className="text-premium-400">Panel</span>
            </div>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-6">
          <nav className="space-y-1 px-4">
            {adminNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.path);
              return (
                <Link 
                  key={item.id} 
                  to={item.path}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`w-full flex items-center px-4 py-3 text-sm font-bold rounded-xl transition-all ${
                    isActive 
                      ? 'bg-premium-600 text-white shadow-lg shadow-premium-900/20' 
                      : 'text-slate-400 hover:bg-white/5 hover:text-white group'
                  }`}>
                  <Icon className={`${isActive ? 'text-white' : 'text-slate-500 group-hover:text-premium-400'} h-5 w-5 me-3`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 bg-white/5 p-3 rounded-2xl">
            <div className="h-10 w-10 rounded-xl bg-slate-800 flex items-center justify-center text-premium-400 font-bold border border-white/5">
              {admin?.name?.charAt(0) || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">{admin?.name}</p>
              <p className="text-[10px] text-slate-500 truncate uppercase tracking-widest font-black">Super Admin</p>
            </div>
            <button onClick={handleLogout} className="p-2 text-slate-500 hover:text-red-400">
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 z-30">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 text-slate-500">
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              {currentNavItem.label}
            </h1>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              Sytème Opérationnel
            </div>
            <button className="p-2 text-slate-400 hover:text-slate-600 relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-premium-500 rounded-full" />
            </button>
            <div className="h-8 w-px bg-slate-200" />
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-bold text-slate-600 uppercase">Globale</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </main>
      </div>

    </div>
  );
};

export default AdminLayout;
