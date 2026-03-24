import React, { useContext, useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import AIAssistant from './AIAssistant';
import api from '../services/api';
import Button from './ui/Button';
import Badge from './ui/Badge';
import {
  LayoutDashboard,
  Users,
  Receipt,
  Package,
  BarChart3,
  Settings,
  LogOut,
  Search,
  Bell,
  HelpCircle,
  FileCode2,
  ClipboardList,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  X,
  Menu
} from 'lucide-react';

const navItems = [
  { id: 'dashboard', path: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { id: 'clients',   path: '/clients',   label: 'Clients',          icon: Users },
  { id: 'invoices',  path: '/invoices',  label: 'Factures',         icon: Receipt },
  { id: 'demandes',  path: '/demandes',  label: 'Demandes',         icon: ClipboardList },
  { id: 'teif',      path: '/teif',      label: 'TEIF',             icon: FileCode2 },
  { id: 'products',  path: '/products',  label: 'Produits',         icon: Package },
  { id: 'reports',   path: '/reports',   label: 'Rapports',         icon: BarChart3 },
  { id: 'settings',  path: '/settings',  label: 'Paramètres',       icon: Settings },
  { id: 'help',      path: '/help',      label: "Centre d'aide",    icon: HelpCircle },
];

// ── Language switcher ─────────────────────────────────────────────────────────
const LANG_OPTIONS = [
  { code: 'fr', label: 'FR', flag: '🇫🇷' },
  { code: 'en', label: 'EN', flag: '🇬🇧' },
  { code: 'ar', label: 'AR', flag: '🇸🇦' },
];

const LangSwitcher = () => {
  const { lang, setLang } = useLanguage();
  return (
    <div className="flex items-center gap-0.5 bg-slate-100 rounded-xl p-0.5">
      {LANG_OPTIONS.map(l => (
        <button key={l.code} onClick={() => setLang(l.code)} title={l.label}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            lang === l.code ? 'bg-white text-premium-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
          }`}>
          <span className="text-sm">{l.flag}</span>
          <span className="hidden sm:inline uppercase tracking-wider">{l.label}</span>
        </button>
      ))}
    </div>
  );
};

// ── Notif type → icon + color ────────────────────────────────────────────────
const NOTIF_STYLE = {
  DEMANDE_SENT:     { icon: ClipboardList, color: 'text-blue-500',   bg: 'bg-blue-50'   },
  DEMANDE_ACCEPTED: { icon: CheckCircle2,  color: 'text-green-500',  bg: 'bg-green-50'  },
  DEMANDE_REJECTED: { icon: XCircle,       color: 'text-red-500',    bg: 'bg-red-50'    },
  TTN_ACCEPTED:     { icon: CheckCircle2,  color: 'text-emerald-500',bg: 'bg-emerald-50'},
  TTN_REJECTED:     { icon: XCircle,       color: 'text-red-500',    bg: 'bg-red-50'    },
  XML_IMPORTED:     { icon: FileCode2,     color: 'text-indigo-500', bg: 'bg-indigo-50' },
  INFO:             { icon: Bell,          color: 'text-gray-500',   bg: 'bg-gray-50'   },
};

const timeAgo = (dateStr) => {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60)   return 'À l\'instant';
  if (diff < 3600) return `${Math.floor(diff / 60)} min`;
  if (diff < 86400)return `${Math.floor(diff / 3600)} h`;
  return new Date(dateStr).toLocaleDateString('fr-TN');
};

// ── Notification dropdown ─────────────────────────────────────────────────────
const NotifDropdown = ({ onClose }) => {
  const [notifs, setNotifs]   = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifs = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifs(res.data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchNotifs(); }, []);

  const markAll = async () => {
    await api.patch('/notifications/read-all').catch(() => {});
    setNotifs(n => n.map(x => ({ ...x, read: true })));
  };

  const markOne = async (id) => {
    await api.patch(`/notifications/${id}/read`).catch(() => {});
    setNotifs(n => n.map(x => x.id === id ? { ...x, read: true } : x));
  };

  const unread = notifs.filter(n => !n.read).length;

  return (
    <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-premium-500" />
          <span className="text-sm font-bold text-slate-800 uppercase tracking-tight">Notifications</span>
          {unread > 0 && <span className="bg-premium-600 text-white text-[10px] rounded-full px-1.5 py-0.5 font-black">{unread}</span>}
        </div>
        <div className="flex items-center gap-2">
          {unread > 0 && (
            <button onClick={markAll} className="text-xs text-blue-600 hover:text-blue-800 font-medium">
              Tout lire
            </button>
          )}
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-0.5 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
        {loading ? (
          <div className="py-8 text-center text-sm text-gray-400">Chargement…</div>
        ) : notifs.length === 0 ? (
          <div className="py-10 text-center">
            <Bell className="w-8 h-8 text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-gray-400 font-medium">Aucune nouvelle notification</p>
          </div>
        ) : (
          notifs.map(n => {
            const style = NOTIF_STYLE[n.type] ?? NOTIF_STYLE.INFO;
            const Icon  = style.icon;
            return (
              <button
                key={n.id}
                onClick={() => markOne(n.id)}
                className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-start gap-3 ${!n.read ? 'bg-blue-50/40' : ''}`}
              >
                <div className={`mt-0.5 p-1.5 rounded-lg ${style.bg} flex-shrink-0`}>
                  <Icon className={`w-3.5 h-3.5 ${style.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-xs font-semibold truncate ${n.read ? 'text-gray-600' : 'text-gray-900'}`}>{n.title}</p>
                    <span className="text-xs text-gray-400 flex-shrink-0">{timeAgo(n.createdAt)}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                </div>
                {!n.read && <span className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

// ── Layout ────────────────────────────────────────────────────────────────────
const Layout = ({ children }) => {
  const { user, logout } = useContext(AuthContext);
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [showNotifs, setShowNotifs]       = useState(false);
  const [unreadCount, setUnreadCount]     = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const notifRef = useRef(null);
  const searchRef = useRef(null);

  const isRtl = lang === 'ar';

  const handleLogout = () => { logout(); navigate('/'); };
  const currentNavItem = navItems.find(item => location.pathname.startsWith(item.path)) || navItems[0];

  // Poll unread count
  const fetchUnread = async () => {
    try {
      const res = await api.get('/notifications/unread-count');
      setUnreadCount(res.data.count ?? 0);
    } catch { /* ignore */ }
  };
  useEffect(() => {
    fetchUnread();
    const id = setInterval(fetchUnread, 30000);
    return () => clearInterval(id);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { 
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifs(false); 
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowSearchSuggestions(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className={`flex h-screen bg-gray-50 overflow-hidden font-sans ${isRtl ? 'font-arabic' : ''}`} dir={isRtl ? 'rtl' : 'ltr'}>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 start-0 z-50 w-72 bg-white border-slate-100 flex flex-col 
        transition-transform duration-300 ease-in-out
        ${isRtl ? 'border-l' : 'border-r'} 
        ${isSidebarOpen 
          ? 'translate-x-0' 
          : isRtl ? 'translate-x-full' : '-translate-x-full'}
        md:translate-x-0 md:static md:flex
      `}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-50">
          <Link to="/" className="hover:opacity-80 transition-opacity">
            <div className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-premium-600 to-premium-400 font-display">
              El Fatoora
            </div>
          </Link>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden p-2 text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-6">
          <nav className="space-y-1.5 px-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.path);
              return (
                <Link 
                  key={item.id} 
                  to={item.path}
                  onClick={() => setIsSidebarOpen(false)}
                   className={`w-full flex items-center px-4 py-3 text-sm font-bold rounded-2xl transition-all duration-200 ${
                    isActive 
                      ? 'bg-premium-600 text-white shadow-lg shadow-premium-100' 
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 group'
                  }`}>
                  <Icon className={`${isActive ? 'text-white' : 'text-slate-400 group-hover:text-premium-600'} h-5 w-5 me-3`} />
                  {t(`nav.${item.id}`)}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl">
            <div className="h-10 w-10 rounded-xl bg-premium-100 flex items-center justify-center text-premium-700 font-bold shadow-sm flex-shrink-0">
              {user?.name?.charAt(0) || 'C'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate font-display">{user?.name}</p>
              <p className="text-[10px] text-slate-500 truncate font-medium">{user?.email}</p>
            </div>
            <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-500 transition-all">
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">

        {/* Top Header */}
        <header className="h-16 fixed inset-x-0 top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-4 sm:px-6 lg:px-8 transition-all duration-300 md:ms-72">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-all"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex-1 flex text-xl font-black text-slate-900 font-display tracking-tight">
              {t(`nav.${currentNavItem.id}`)}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {/* Smart Search / Command Bar */}
            <div className="relative group">
              <span className="absolute inset-y-0 start-0 ps-4 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400 group-focus-within:text-premium-600 transition-colors" />
              </span>
              <input 
                type="text" 
                placeholder={t('search.placeholder') || "Rechercher une action..."}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSearchSuggestions(true);
                }}
                onFocus={() => setShowSearchSuggestions(true)}
                className="ps-11 pe-4 py-2.5 border border-slate-100 bg-slate-50 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-premium-100 focus:border-premium-500 focus:bg-white w-48 md:w-64 transition-all" 
              />
              
              {showSearchSuggestions && searchQuery.length > 0 && (
                <div className="absolute top-full mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 z-[60] py-2 overflow-hidden">
                   <div className="px-3 py-1 mb-1">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('search.suggestions')}</span>
                   </div>
                   {navItems.filter(item => 
                     t(`nav.${item.id}`).toLowerCase().includes(searchQuery.toLowerCase()) || 
                     item.id.includes(searchQuery.toLowerCase())
                   ).map(item => (
                     <button
                       key={item.id}
                       onClick={() => {
                         navigate(item.path);
                         setSearchQuery('');
                         setShowSearchSuggestions(false);
                       }}
                       className="w-full flex items-center px-4 py-2.5 hover:bg-blue-50 text-sm text-gray-700 transition-colors gap-3"
                     >
                        <item.icon className="w-4 h-4 text-gray-400 me-3" />
                        <span>{t(`nav.${item.id}`)}</span>
                     </button>
                   ))}
                   {navItems.filter(item => 
                     t(`nav.${item.id}`).toLowerCase().includes(searchQuery.toLowerCase())
                   ).length === 0 && (
                     <div className="px-4 py-3 text-xs text-gray-400 text-center italic">
                        {t('search.noResults')} "{searchQuery}"
                     </div>
                   )}
                </div>
              )}
            </div>

            {/* Language switcher */}
            <LangSwitcher />

            {/* Notification Bell */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => { setShowNotifs(v => !v); if (!showNotifs) fetchUnread(); }}
                className="p-2 text-gray-400 hover:text-gray-600 relative rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              {showNotifs && (
                <NotifDropdown onClose={() => { setShowNotifs(false); fetchUnread(); }} />
              )}
            </div>
          </div>
        </header>

        {/* Main Area */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6 pt-20">
          <Outlet />
        </main>
      </div>

      {/* Floating AI */}
      <AIAssistant />
    </div>
  );
};

export default Layout;

