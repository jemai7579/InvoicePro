import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Users, Receipt, Package, BarChart3, Settings, 
  Search, Bell, ShieldCheck, Zap, Activity, CheckCircle2, 
  Plus, MoreVertical, Layout, CreditCard, ArrowRight, Menu, X
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { Link } from 'react-router-dom';

const Demo = () => {
  const { t, lang } = useLanguage();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const isRtl = lang === 'ar';
  
  const mockStats = [
    { label: 'Revenu Total', value: '45,280 TND', change: '+12.5%', icon: CreditCard, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Factures Payées', value: '128', change: '+8%', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Nouveaux Clients', value: '12', change: '+15%', icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Soumissions TTN', value: '98%', change: 'Stable', icon: Activity, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* Demo Banner */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white px-4 py-2 text-center text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-3">
        <Zap className="w-3.5 h-3.5 text-amber-400" />
        Environnement de Démo Interactif — Aucune donnée réelle n'est envoyée à TTN
        <Link to="/register" className="ms-4 bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full text-[10px] transition-colors">
          Créer un compte réel
        </Link>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Mock Sidebar */}
        <aside className={`
          fixed inset-y-0 start-0 z-50 w-72 bg-white border-slate-200 flex flex-col 
          transition-transform duration-300 ease-in-out
          ${isRtl ? 'border-l' : 'border-r'} 
          ${isSidebarOpen 
            ? 'translate-x-0' 
            : isRtl ? 'translate-x-full' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:flex
        `}>
          <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100">
            <div className="flex items-center">
              <ShieldCheck className="w-6 h-6 text-premium-600 me-2" />
              <span className="font-black text-xl bg-clip-text text-transparent bg-gradient-to-r from-premium-600 to-premium-400 font-display tracking-tight">El Fatoora</span>
            </div>
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden p-2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <nav className="flex-1 p-4 space-y-1">
            {[
              { id: 'dashboard', icon: LayoutDashboard },
              { id: 'clients', icon: Users },
              { id: 'invoices', icon: Receipt },
              { id: 'products', icon: Package },
              { id: 'reports', icon: BarChart3 },
              { id: 'settings', icon: Settings },
            ].map(item => (
              <button 
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center px-4 py-3 text-sm font-bold rounded-2xl transition-all ${
                  activeTab === item.id ? 'bg-premium-600 text-white shadow-lg shadow-premium-100' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <item.icon className={`w-5 h-5 me-3 ${activeTab === item.id ? 'text-white' : 'text-slate-400 opacity-80'}`} />
                {t(`nav.${item.id}`)}
              </button>
            ))}
          </nav>
          <div className="p-4 border-t border-slate-100">
             <div className="bg-slate-50 rounded-3xl p-5 mt-auto mb-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('demo.subscription') || 'Abonnement'}</p>
                <p className="text-sm font-black text-slate-800 mb-4">{t('demo.premium') || 'Démo Premium'}</p>
                <Link to="/register" className="block text-center w-full py-2.5 bg-premium-600 text-white text-xs font-black rounded-xl hover:bg-premium-700 shadow-lg shadow-premium-100 transition-all active:scale-95">
                   {t('demo.goReal') || 'Passer au Réel'}
                </Link>
             </div>
          </div>
        </aside>

        {/* Mock Main Content */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Header */}
          <header className="h-16 fixed inset-x-0 top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-4 lg:px-8 transition-all duration-300 lg:ms-72">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-all"
              >
                <Menu className="w-6 h-6" />
              </button>
              <h1 className="text-lg font-black text-slate-900 capitalize font-display tracking-tight">{t(`nav.${activeTab}`)}</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative group hidden lg:block">
                <Search className="absolute inset-y-0 start-0 ps-3 flex items-center pointer-events-none w-4 h-4 text-slate-400 group-focus-within:text-premium-600 transition-colors" />
                <input 
                  type="text" 
                  placeholder="Rechercher..." 
                  className="ps-10 pe-4 py-2 bg-slate-50 border-slate-100 focus:bg-white focus:border-premium-200 focus:ring-4 focus:ring-premium-100 rounded-xl text-sm w-48 xl:w-64 outline-none transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button className="relative p-2 text-slate-400 hover:bg-slate-100 rounded-xl transition-all">
                <Bell className="w-5 h-5" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 border-2 border-white rounded-full"></span>
              </button>
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-premium-600 to-premium-400 flex items-center justify-center text-white font-black text-[10px] uppercase shadow-lg shadow-premium-100">
                JD
              </div>
            </div>
          </header>

          {/* Page Content */}
          <div className="flex-1 overflow-y-auto p-8 pt-24 min-w-0">
            {activeTab === 'dashboard' ? (
              <>
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Bienvenue, Jean !</h2>
                    <p className="text-slate-500 text-sm">Voici un aperçu de vos activités de démonstration aujourd'hui.</p>
                  </div>
                  <button className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95">
                    <Plus className="w-4 h-4" />
                    Action Démo
                  </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                   {mockStats.map((s, i) => (
                     <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                           <div className={`p-2 rounded-xl ${s.bg}`}>
                              <s.icon className={`w-5 h-5 ${s.color}`} />
                           </div>
                           <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{s.change}</span>
                        </div>
                        <p className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-1">{s.label}</p>
                        <p className="text-2xl font-bold text-slate-900">{s.value}</p>
                     </div>
                   ))}
                </div>

                {/* Charts/Activity Mockup */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                   <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                      <div className="px-6 py-5 border-b border-slate-50 flex items-center justify-between">
                         <h3 className="font-bold text-slate-800">Recettes sur 7 jours</h3>
                         <span className="text-xs font-bold text-blue-600">Export PDF</span>
                      </div>
                      <div className="p-8 flex-1 flex items-end gap-3 h-64">
                        {[30, 45, 60, 40, 85, 55, 70].map((h, i) => (
                          <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                            <div className="relative w-full h-full flex items-end">
                              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-2 py-1 rounded text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                                {h * 105} TND
                              </div>
                              <div 
                                className="w-full bg-gradient-to-t from-blue-600/10 to-blue-600 rounded-xl transition-all duration-700 group-hover:from-blue-600 group-hover:to-indigo-500" 
                                style={{ height: `${h}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 capitalize">{['lun','mar','mer','jeu','ven','sam','dim'][i]}</span>
                          </div>
                        ))}
                      </div>
                   </div>

                   <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                      <div className="px-6 py-5 border-b border-slate-50">
                         <h3 className="font-bold text-slate-800">Activités Récentes</h3>
                      </div>
                      <div className="p-4 space-y-2">
                         {[1,2,3,4,5].map(i => (
                           <div key={i} className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-2xl transition-colors border border-transparent hover:border-slate-100">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${i % 2 === 0 ? 'bg-amber-50' : 'bg-emerald-50'}`}>
                                 {i % 2 === 0 ? <Zap className="w-5 h-5 text-amber-500" /> : <Receipt className="w-5 h-5 text-emerald-500" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                 <p className="text-xs font-bold text-slate-800 truncate">Facture #{2400 + i} générée</p>
                                 <p className="text-[10px] text-slate-400">Il y a {i * 2} heures</p>
                              </div>
                              <Link to="/register" className="text-slate-400 hover:text-blue-600">
                                 <ArrowRight className="w-4 h-4" />
                              </Link>
                           </div>
                         ))}
                      </div>
                   </div>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-12 text-center">
                 <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Zap className="w-8 h-8" />
                 </div>
                 <h3 className="text-xl font-bold text-slate-900 mb-2">Module "{activeTab}" en Démo</h3>
                 <p className="text-slate-500 max-w-sm mx-auto mb-8">
                    Dans la version complète d'El Fatoura, ce module vous permet de gérer vos {activeTab} avec des outils avancés et une conformité TEIF totale.
                 </p>
                 <Link to="/register" className="inline-flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all">
                    Débloquer l'accès complet
                    <ArrowRight className="w-4 h-4" />
                 </Link>
              </div>
            )}
          </div>
        </main>
      </div>

      <footer className="bg-white border-t border-slate-100 px-8 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
         <p className="text-xs text-slate-400 font-medium">© 2026 El Fatoura Demo. Optimisé pour la conformité tunisienne.</p>
         <div className="flex items-center gap-6">
            <Link to="/" className="text-xs font-bold text-slate-500 hover:text-blue-600 uppercase tracking-widest">Quitter la démo</Link>
            <Link to="/register" className="px-5 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-black transition-colors">Démarrer Gratuitement</Link>
         </div>
      </footer>
    </div>
  );
};

export default Demo;

