import React, { useContext, useEffect, useRef, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Activity,
  BarChart3,
  Bell,
  Bot,
  BriefcaseBusiness,
  CheckCircle2,
  ClipboardList,
  FileCode2,
  LayoutDashboard,
  Link2,
  LogOut,
  MessageSquare,
  Menu,
  CreditCard,
  Receipt,
  Search,
  Settings,
  Package,
  Users,
  X,
  XCircle,
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import AIAssistant from './AIAssistant';
import api from '../services/api';
import BrandLogo from './BrandLogo';

const NAV_ITEMS = [
  { id: 'dashboard', path: '/dashboard', icon: LayoutDashboard },
  { id: 'opportunities', path: '/opportunities', icon: BriefcaseBusiness },
  { id: 'invoices', path: '/invoices', icon: Receipt },
  { id: 'payments', path: '/payments', icon: CreditCard },
  { id: 'tracking', path: '/invoice-tracking', icon: Activity },
  { id: 'clients', path: '/clients', icon: Users },
  { id: 'products', path: '/products', icon: Package },
  { id: 'network', path: '/network', icon: Link2 },
  { id: 'messages', path: '/messages', icon: MessageSquare },
  { id: 'reports', path: '/reports', icon: BarChart3 },
  { id: 'ai', path: '/ai', icon: Bot },
  { id: 'settings', path: '/settings', icon: Settings },
];

const LANG_OPTIONS = [
  { code: 'fr', label: 'FR' },
  { code: 'en', label: 'EN' },
  { code: 'ar', label: 'AR' },
];

const SEARCH_COPY = {
  fr: {
    placeholder: 'Rechercher une page ou une action...',
    suggestions: 'Suggestions',
    noResults: 'Aucun resultat pour',
    notifications: 'Notifications',
    markAll: 'Tout lire',
    emptyNotifications: 'Aucune nouvelle notification',
    loading: 'Chargement...',
    now: "A l'instant",
  },
  en: {
    placeholder: 'Search a page or action...',
    suggestions: 'Suggestions',
    noResults: 'No result for',
    notifications: 'Notifications',
    markAll: 'Mark all as read',
    emptyNotifications: 'No new notification',
    loading: 'Loading...',
    now: 'Just now',
  },
  ar: {
    placeholder: 'ابحث عن صفحة او اجراء...',
    suggestions: 'اقتراحات',
    noResults: 'لا توجد نتائج لـ',
    notifications: 'الاشعارات',
    markAll: 'تحديد الكل كمقروء',
    emptyNotifications: 'لا توجد اشعارات جديدة',
    loading: 'جار التحميل...',
    now: 'الآن',
  },
};

const NOTIF_STYLE = {
  DEMANDE_SENT: { icon: ClipboardList, color: 'text-blue-500', bg: 'bg-blue-50' },
  DEMANDE_ACCEPTED: { icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-50' },
  DEMANDE_REJECTED: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-50' },
  TTN_ACCEPTED: { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  TTN_REJECTED: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-50' },
  XML_IMPORTED: { icon: FileCode2, color: 'text-indigo-500', bg: 'bg-indigo-50' },
  INFO: { icon: Bell, color: 'text-gray-500', bg: 'bg-gray-50' },
};

const LangSwitcher = () => {
  const { lang, setLang } = useLanguage();

  return (
    <div className="flex items-center rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
      {LANG_OPTIONS.map((option) => (
        <button
          key={option.code}
          type="button"
          title={option.label}
          aria-pressed={lang === option.code}
          onClick={() => setLang(option.code)}
          className={`min-w-[40px] rounded-xl px-3 py-1.5 text-xs font-black tracking-wide transition-all ${
            lang === option.code
              ? 'bg-premium-600 text-white shadow-sm'
              : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};

const timeAgo = (dateStr, copy) => {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return copy.now;
  if (diff < 3600) return `${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} h`;
  return new Date(dateStr).toLocaleDateString('fr-TN');
};

const NotifDropdown = ({ lang, onClose }) => {
  const copy = SEARCH_COPY[lang] || SEARCH_COPY.fr;
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifs = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifs(res.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, []);

  const markAll = async () => {
    await api.patch('/notifications/read-all').catch(() => {});
    setNotifs((items) => items.map((item) => ({ ...item, read: true })));
  };

  const markOne = async (id) => {
    await api.patch(`/notifications/${id}/read`).catch(() => {});
    setNotifs((items) => items.map((item) => (item.id === id ? { ...item, read: true } : item)));
  };

  const unread = notifs.filter((item) => !item.read).length;

  const isRtl = lang === 'ar';

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className={`
        fixed left-3 right-3 top-16 z-[80] max-h-[calc(100dvh-5rem)] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl
        sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-[22rem] sm:max-w-[calc(100vw-2rem)]
        ${isRtl ? 'sm:left-0 sm:right-auto' : ''}
      `}
    >
      <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-premium-500" />
          <span className="text-sm font-bold uppercase tracking-tight text-slate-800">{copy.notifications}</span>
          {unread > 0 ? (
            <span className="rounded-full bg-premium-600 px-1.5 py-0.5 text-[10px] font-black text-white">
              {unread}
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          {unread > 0 ? (
            <button type="button" onClick={markAll} className="text-xs font-medium text-blue-600 hover:text-blue-800">
              {copy.markAll}
            </button>
          ) : null}
          <button type="button" onClick={onClose} className="rounded p-0.5 text-gray-400 hover:text-gray-600">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="max-h-[min(24rem,calc(100dvh-9rem))] divide-y divide-gray-50 overflow-y-auto overscroll-contain">
        {loading ? (
          <div className="py-8 text-center text-sm text-gray-400">{copy.loading}</div>
        ) : notifs.length === 0 ? (
          <div className="py-10 text-center">
            <Bell className="mx-auto mb-2 h-8 w-8 text-gray-200" />
            <p className="text-sm font-medium text-gray-400">{copy.emptyNotifications}</p>
          </div>
        ) : (
          notifs.map((notif) => {
            const style = NOTIF_STYLE[notif.type] ?? NOTIF_STYLE.INFO;
            const Icon = style.icon;

            return (
              <button
                key={notif.id}
                type="button"
                onClick={() => markOne(notif.id)}
                className={`flex w-full items-start gap-3 px-4 py-3 text-start transition-colors hover:bg-gray-50 ${
                  !notif.read ? 'bg-blue-50/40' : ''
                }`}
              >
                <div className={`mt-0.5 flex-shrink-0 rounded-lg p-1.5 ${style.bg}`}>
                  <Icon className={`h-3.5 w-3.5 ${style.color}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`min-w-0 break-words text-xs font-semibold ${notif.read ? 'text-gray-600' : 'text-gray-900'}`}>
                      {notif.title}
                    </p>
                    <span className="flex-shrink-0 text-xs text-gray-400">{timeAgo(notif.createdAt, copy)}</span>
                  </div>
                  <p className="mt-0.5 line-clamp-2 break-words text-xs leading-5 text-gray-500">{notif.message}</p>
                </div>
                {!notif.read ? <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-blue-500" /> : null}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

const Layout = () => {
  const { user, logout } = useContext(AuthContext);
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [showNotifs, setShowNotifs] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const notifRef = useRef(null);
  const searchRef = useRef(null);

  const isRtl = lang === 'ar';
  const searchCopy = SEARCH_COPY[lang] || SEARCH_COPY.fr;
  const navItems = NAV_ITEMS;
  const currentNavItem = navItems.find((item) => location.pathname.startsWith(item.path)) || navItems[0];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const fetchUnread = async () => {
    try {
      const res = await api.get('/notifications/unread-count');
      setUnreadCount(res.data.count ?? 0);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    let active = true;

    api
      .get('/notifications/unread-count')
      .then((res) => {
        if (active) {
          setUnreadCount(res.data.count ?? 0);
        }
      })
      .catch(() => {});

    const id = setInterval(() => {
      fetchUnread();
    }, 30000);

    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  useEffect(() => {
    const handler = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifs(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filteredNavItems = navItems.filter(
    (item) =>
      searchQuery.length > 0 &&
      (t(`nav.${item.id}`).toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.id.includes(searchQuery.toLowerCase()))
  );

  return (
    <div className={`flex h-screen overflow-hidden bg-gray-50 font-sans ${isRtl ? 'font-arabic' : ''}`} dir={isRtl ? 'rtl' : 'ltr'}>
      {isSidebarOpen ? (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      ) : null}

      <aside
        className={`
          fixed inset-y-0 start-0 z-50 flex w-72 flex-col border-slate-100 bg-white transition-transform duration-300 ease-in-out
          ${isRtl ? 'border-l' : 'border-r'}
          ${isSidebarOpen ? 'translate-x-0' : isRtl ? 'translate-x-full' : '-translate-x-full'}
          md:static md:flex md:translate-x-0
        `}
      >
        <div className="flex h-14 items-center justify-between border-b border-slate-50 px-5">
          <Link to="/" className="group flex items-center transition-transform hover:scale-[1.02]">
            <BrandLogo className="h-9 w-auto max-w-[170px]" />
          </Link>
          <button type="button" onClick={() => setIsSidebarOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 md:hidden">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          <nav className="space-y-1 px-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.path);

              return (
                <Link
                  key={item.id}
                  to={item.path}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`flex w-full items-center rounded-2xl px-4 py-2.5 text-xs font-bold transition-all duration-200 ${
                    isActive
                      ? 'bg-premium-600 text-white shadow-lg shadow-premium-100'
                      : 'group text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon
                    className={`${isActive ? 'text-white' : 'text-slate-400 group-hover:text-premium-600'} me-3 h-4.5 w-4.5 flex-shrink-0`}
                  />
                  <div className="min-w-0">
                    <div className="truncate">{t(`nav.${item.id}`)}</div>
                    {item.id === 'dashboard' && user?.name ? (
                      <div
                        className={`mt-0.5 max-w-[170px] truncate text-[10px] font-semibold ${
                          isActive ? 'text-white/85' : 'text-slate-400 group-hover:text-slate-500'
                        }`}
                      >
                        {user.name}
                      </div>
                    ) : null}
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="border-t border-slate-100 p-4">
          <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-premium-100 font-bold text-premium-700 shadow-sm">
              {user?.name?.charAt(0) || 'C'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-sm font-bold text-slate-900">{user?.name}</p>
              <p className="truncate text-[10px] font-medium text-slate-500">{user?.email}</p>
            </div>
            <button type="button" onClick={handleLogout} className="p-2 text-slate-400 transition-all hover:text-red-500">
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex h-screen flex-1 flex-col overflow-hidden">
        <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b border-slate-100 bg-white/80 px-3 backdrop-blur-md transition-all duration-300 sm:px-5 lg:px-8 md:ms-72">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="shrink-0 rounded-xl p-1.5 text-slate-500 transition-all hover:bg-slate-100 md:hidden"
            >
              <Menu className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
            <div className="truncate text-base sm:text-lg font-black tracking-tight text-slate-900">{t(`nav.${currentNavItem.id}`)}</div>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <div className="group relative hidden sm:block" ref={searchRef}>
              <span className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-4">
                <Search className="h-4 w-4 text-slate-400 transition-colors group-focus-within:text-premium-600" />
              </span>
              <input
                type="text"
                placeholder={searchCopy.placeholder}
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                  setShowSearchSuggestions(true);
                }}
                onFocus={() => setShowSearchSuggestions(true)}
                className="w-36 rounded-2xl border border-slate-100 bg-slate-50 py-2 pe-4 ps-11 text-xs font-medium transition-all focus:border-premium-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-premium-100 md:w-52 lg:w-64"
              />

              {showSearchSuggestions && searchQuery.length > 0 ? (
                <div className="absolute top-full mt-2 w-64 md:w-72 overflow-hidden rounded-2xl border border-gray-100 bg-white py-2 shadow-2xl z-[60]">
                  <div className="mb-1 px-3 py-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{searchCopy.suggestions}</span>
                  </div>

                  {filteredNavItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        navigate(item.path);
                        setSearchQuery('');
                        setShowSearchSuggestions(false);
                      }}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-blue-50"
                    >
                      <item.icon className="me-3 h-4 w-4 text-gray-400" />
                      <span>{t(`nav.${item.id}`)}</span>
                    </button>
                  ))}

                  {filteredNavItems.length === 0 ? (
                    <div className="px-4 py-3 text-center text-xs italic text-gray-400">
                      {searchCopy.noResults} "{searchQuery}"
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>

            <LangSwitcher />

            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => {
                  setShowNotifs((value) => !value);
                  if (!showNotifs) {
                    fetchUnread();
                  }
                }}
                className="relative rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 ? (
                  <span className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-0.5 text-[10px] font-bold text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                ) : null}
              </button>
              {showNotifs ? <NotifDropdown lang={lang} onClose={() => { setShowNotifs(false); fetchUnread(); }} /> : null}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-gray-50 px-3 sm:px-5 lg:px-8 pb-6 pt-16">
          <Outlet />
        </main>
      </div>

      <AIAssistant />
    </div>
  );
};

export default Layout;
