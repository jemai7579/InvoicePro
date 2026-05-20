import React, { useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Zap,
  FileText,
  BarChart3,
  CheckCircle2,
  ArrowRight,
  Globe,
  Bot,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Lock,
  Layout,
  MessageSquare,
  CreditCard,
  History,
  Users,
  Menu,
  X,
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import BrandLogo from '../components/BrandLogo';

const LangSwitcher = () => {
  const { lang, setLang } = useLanguage();
  return (
    <div className="flex items-center gap-0.5 bg-white/50 backdrop-blur-sm p-0.5 rounded-xl border border-slate-200/50 shadow-sm shrink-0">
      {['fr', 'en', 'ar'].map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={`px-2 py-1 text-[10px] font-bold rounded-lg transition-all ${
            lang === l
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
};

const featureGroups = {
  fr: [
    { icon: FileText, title: 'Gestion commerciale', desc: 'Clients, import Excel, idées de projet, offres, bons de commande, devis et factures dans un parcours cohérent.', color: 'bg-blue-600', iconColor: 'text-blue-600' },
    { icon: ShieldCheck, title: 'Conformité TEIF & TTN', desc: 'Préparation XML TEIF, suivi TTN, mode test et étapes de conformité avant activation officielle.', color: 'bg-emerald-600', iconColor: 'text-emerald-600' },
    { icon: CreditCard, title: 'Règlements', desc: 'Suivi des paiements après facture : payé, partiel, en attente, annulé et reste à payer.', color: 'bg-amber-600', iconColor: 'text-amber-600' },
    { icon: Lock, title: 'E-Houwiya / Signature', desc: 'Checkpoint E-Houwiya / Mobile ID, choix de signature et configuration du certificat ou prestataire.', color: 'bg-indigo-600', iconColor: 'text-indigo-600' },
    { icon: Users, title: 'Réseau & messages', desc: 'Collaborez avec clients, partenaires et équipes via réseau professionnel, partage et messagerie.', color: 'bg-cyan-600', iconColor: 'text-cyan-600' },
    { icon: History, title: 'Historique & traçabilité', desc: 'Gardez une trace claire des actions, statuts, validations et changements sensibles.', color: 'bg-slate-700', iconColor: 'text-slate-700' },
    { icon: Bot, title: 'Assistant IA', desc: 'Aide à comprendre les étapes, préparer les contenus et guider les utilisateurs sans remplacer les organismes officiels.', color: 'bg-violet-600', iconColor: 'text-violet-600' },
    { icon: BarChart3, title: 'Rapports', desc: 'Suivez activité, facturation, règlements et performance avec des indicateurs lisibles.', color: 'bg-rose-600', iconColor: 'text-rose-600' },
  ],
  en: [
    { icon: FileText, title: 'Sales workflow', desc: 'Clients, Excel import, project ideas, offers, purchase orders, quotes and invoices in one flow.', color: 'bg-blue-600', iconColor: 'text-blue-600' },
    { icon: ShieldCheck, title: 'TEIF & TTN compliance', desc: 'TEIF XML preparation, TTN tracking, test mode and compliance checkpoints.', color: 'bg-emerald-600', iconColor: 'text-emerald-600' },
    { icon: CreditCard, title: 'Payments', desc: 'Track money received after invoices: paid, partial, pending, canceled and remaining amount.', color: 'bg-amber-600', iconColor: 'text-amber-600' },
    { icon: Lock, title: 'E-Houwiya / Signature', desc: 'Mobile ID checkpoint, signature choice and certificate or provider setup.', color: 'bg-indigo-600', iconColor: 'text-indigo-600' },
    { icon: Users, title: 'Network & messages', desc: 'Collaborate with clients, partners and teams through sharing and messaging.', color: 'bg-cyan-600', iconColor: 'text-cyan-600' },
    { icon: History, title: 'Audit trail', desc: 'Keep a clear trace of actions, statuses, approvals and sensitive changes.', color: 'bg-slate-700', iconColor: 'text-slate-700' },
    { icon: Bot, title: 'AI Assistant', desc: 'Helps users understand steps and prepare content without replacing official bodies.', color: 'bg-violet-600', iconColor: 'text-violet-600' },
    { icon: BarChart3, title: 'Reports', desc: 'Monitor activity, billing, payments and performance with readable indicators.', color: 'bg-rose-600', iconColor: 'text-rose-600' },
  ],
  ar: [
    { icon: FileText, title: 'المسار التجاري', desc: 'عملاء، استيراد Excel، أفكار مشاريع، عروض، أوامر شراء، عروض أسعار وفواتير.', color: 'bg-blue-600', iconColor: 'text-blue-600' },
    { icon: ShieldCheck, title: 'امتثال TEIF و TTN', desc: 'تحضير XML TEIF، متابعة TTN، وضع الاختبار ونقاط التحقق.', color: 'bg-emerald-600', iconColor: 'text-emerald-600' },
    { icon: CreditCard, title: 'الدفعات', desc: 'متابعة المبالغ المستلمة بعد الفاتورة: مدفوع، جزئي، قيد الانتظار أو ملغى.', color: 'bg-amber-600', iconColor: 'text-amber-600' },
    { icon: Lock, title: 'E-Houwiya / التوقيع', desc: 'نقطة تحقق Mobile ID واختيار التوقيع وإعداد الشهادة أو المزود.', color: 'bg-indigo-600', iconColor: 'text-indigo-600' },
    { icon: Users, title: 'الشبكة والرسائل', desc: 'تعاون مع العملاء والشركاء والفرق عبر المشاركة والمراسلة.', color: 'bg-cyan-600', iconColor: 'text-cyan-600' },
    { icon: History, title: 'السجل والتتبع', desc: 'احتفظ بتتبع واضح للإجراءات والحالات والتغييرات الحساسة.', color: 'bg-slate-700', iconColor: 'text-slate-700' },
    { icon: Bot, title: 'المساعد الذكي', desc: 'يساعد على فهم الخطوات وتجهيز المحتوى دون تعويض الجهات الرسمية.', color: 'bg-violet-600', iconColor: 'text-violet-600' },
    { icon: BarChart3, title: 'التقارير', desc: 'تابع النشاط والفوترة والدفعات والأداء بمؤشرات واضحة.', color: 'bg-rose-600', iconColor: 'text-rose-600' },
  ],
};

const Landing = () => {
  const { t, lang } = useLanguage();
  const { user } = useContext(AuthContext);
  const isRtl = lang === 'ar';
  const isAuthenticated = !!user;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const features = featureGroups[lang] || featureGroups.fr;

  return (
    <div
      className={`min-h-screen bg-white text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900 ${
        isRtl ? 'rtl' : 'ltr'
      }`}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* Background blurs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] sm:w-[1000px] h-[500px] sm:h-[1000px] bg-indigo-50/50 rounded-full blur-[140px] animate-pulse" />
        <div
          className="absolute bottom-[-10%] right-[-10%] w-[500px] sm:w-[1000px] h-[500px] sm:h-[1000px] bg-blue-50/50 rounded-full blur-[140px] animate-pulse"
          style={{ animationDelay: '2s' }}
        />
      </div>

      {/* ── Navigation ── */}
      <nav className="fixed top-0 w-full z-[100] transition-all duration-300">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 mt-3 sm:mt-4">
          {/* Main bar */}
          <div className="bg-white/80 backdrop-blur-xl border border-white/50 shadow-lg shadow-slate-200/50 rounded-2xl sm:rounded-[2rem] h-14 sm:h-20 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-2 sm:gap-4">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 sm:gap-3 group shrink-0">
              <BrandLogo className="h-9 w-auto max-w-[180px] sm:h-11 sm:max-w-[220px]" />
            </Link>

            {/* Desktop nav links */}
            <div className="hidden lg:flex items-center gap-6 xl:gap-8">
              <a
                href="#features"
                className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 hover:text-indigo-600 transition-colors whitespace-nowrap"
              >
                {t('landing.nav.features')}
              </a>
              <a
                href="#compliance"
                className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 hover:text-indigo-600 transition-colors whitespace-nowrap"
              >
                {t('landing.nav.compliance')}
              </a>
              <Link
                to="/e-invoice-guide"
                className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 hover:text-indigo-600 transition-colors whitespace-nowrap"
              >
                Guide e-Facture
              </Link>
              <div className="h-4 w-px bg-slate-200" />
              <LangSwitcher />
            </div>

            {/* Right side actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Language switcher visible on mobile/tablet */}
              <div className="lg:hidden">
                <LangSwitcher />
              </div>

              {isAuthenticated ? (
                <Link
                  to="/dashboard"
                  className="bg-indigo-600 text-white px-3 sm:px-5 py-2 sm:py-3 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-black hover:bg-slate-900 transition-all shadow-xl shadow-indigo-100 flex items-center gap-1.5 sm:gap-2 group whitespace-nowrap"
                >
                  {t('landing.nav.dashboard_return')}
                  <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="hidden sm:block text-sm font-bold text-slate-600 hover:text-indigo-600 transition-colors whitespace-nowrap"
                  >
                    {t('landing.nav.login')}
                  </Link>
                  <Link
                    to="/register"
                    className="bg-slate-900 text-white px-3 sm:px-5 py-2 sm:py-3 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200 active:scale-95 whitespace-nowrap"
                  >
                    {t('landing.nav.register')}
                  </Link>
                </>
              )}

              {/* Hamburger — visible below lg */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors shrink-0"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile dropdown */}
          {mobileMenuOpen && (
            <div className="lg:hidden mt-2 bg-white/95 backdrop-blur-xl border border-slate-200/50 shadow-xl rounded-2xl overflow-hidden animate-in slide-in-from-top-2 duration-200">
              <div className="p-3 space-y-1">
                {[
                  { href: '#features', label: t('landing.nav.features') },
                  { href: '#compliance', label: t('landing.nav.compliance') },
                  { href: '/e-invoice-guide', label: 'Guide e-Facture', route: true },
                ].map(({ href, label }) => (
                  href.startsWith('/') ? (
                    <Link
                      key={href}
                      to={href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-4 py-3 text-sm font-black uppercase tracking-[0.12em] text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition-colors"
                    >
                      {label}
                    </Link>
                  ) : (
                    <a
                      key={href}
                      href={href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-4 py-3 text-sm font-black uppercase tracking-[0.12em] text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition-colors"
                    >
                      {label}
                    </a>
                  )
                ))}
                {!isAuthenticated && (
                  <Link
                    to="/login"
                    className="block px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-indigo-600 rounded-xl transition-colors"
                  >
                    {t('landing.nav.login')}
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative pt-28 sm:pt-36 md:pt-44 lg:pt-52 pb-12 sm:pb-16 md:pb-24 px-4 sm:px-6 overflow-hidden z-10">
        <div className="max-w-7xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-2 sm:py-2.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] sm:text-[11px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] mb-6 sm:mb-10 border border-indigo-100/50 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
            <span>{t('landing.hero.badge')}</span>
          </div>

          {/* Headline */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-[5.5rem] xl:text-8xl font-black text-slate-900 tracking-tight leading-[1] sm:leading-[0.95] mb-6 sm:mb-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            {t('landing.hero.title')
              .split('Facturation Électronique')
              .map((part, i, arr) => (
                <React.Fragment key={i}>
                  {part}
                  {i < arr.length - 1 && (
                    <span className="relative inline-block mt-1 sm:mt-2">
                      <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-600">
                        {lang === 'ar' ? 'الفاتورة الإلكترونية' : 'Facturation Électronique'}
                      </span>
                      <span className="absolute bottom-1 sm:bottom-3 left-0 w-full h-2 sm:h-4 bg-indigo-100/50 -rotate-1 z-0" />
                    </span>
                  )}
                </React.Fragment>
              ))}
          </h1>

          {/* Subtitle */}
          <p className="max-w-3xl mx-auto text-base sm:text-lg md:text-xl lg:text-2xl text-slate-500 mb-8 sm:mb-12 md:mb-14 leading-relaxed font-semibold animate-in fade-in slide-in-from-bottom-6 duration-1000">
            {t('landing.hero.subtitle')}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 mb-12 sm:mb-16 md:mb-24 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="w-full sm:w-auto bg-indigo-600 text-white px-8 sm:px-12 py-4 sm:py-5 rounded-2xl sm:rounded-[2rem] font-black flex items-center justify-center gap-3 sm:gap-4 hover:bg-slate-900 hover:shadow-[0_20px_50px_rgba(79,70,229,0.3)] transition-all active:scale-95 group text-base sm:text-lg shadow-2xl shadow-indigo-100"
              >
                {t('landing.hero.dashboard_cta')}
                <ArrowRight
                  className={`w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-1 transition-transform ${isRtl ? 'rotate-180' : ''}`}
                />
              </Link>
            ) : (
              <Link
                to="/register"
                className="w-full sm:w-auto bg-indigo-600 text-white px-8 sm:px-12 py-4 sm:py-5 rounded-2xl sm:rounded-[2rem] font-black flex items-center justify-center gap-3 sm:gap-4 hover:bg-slate-900 hover:shadow-[0_20px_50px_rgba(79,70,229,0.3)] transition-all active:scale-95 group text-base sm:text-lg shadow-2xl shadow-indigo-100"
              >
                {t('landing.hero.cta')}
                <ArrowRight
                  className={`w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-1 transition-transform ${isRtl ? 'rotate-180' : ''}`}
                />
              </Link>
            )}
            <Link
              to="/demo"
              className="w-full sm:w-auto px-8 sm:px-12 py-4 sm:py-5 bg-white text-slate-900 font-black rounded-2xl sm:rounded-[2rem] shadow-xl shadow-slate-100 border border-slate-200 hover:border-indigo-600 transition-all active:scale-95 flex items-center justify-center gap-3 sm:gap-4 text-base sm:text-lg group"
            >
              <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500 fill-amber-500 group-hover:scale-125 transition-transform shrink-0" />
              {t('landing.hero.demo')}
            </Link>
          </div>

          {/* Trusted by */}
          <div className="mb-12 sm:mb-16 md:mb-24 animate-in fade-in duration-1000">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] sm:tracking-[0.4em] mb-5 sm:mb-8">
              {t('landing.hero.optimized') || 'CONFÉRÉ PAR LES LEADERS'}
            </p>
            <div className="flex flex-wrap justify-center gap-5 sm:gap-10 md:gap-16 xl:gap-20 opacity-30 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-700">
              <div className="flex items-center gap-2 font-black text-base sm:text-2xl tracking-tighter italic">TUNTRUST</div>
              <div className="flex items-center gap-2 font-black text-base sm:text-2xl tracking-tighter">TRADENET</div>
              <div className="flex items-center gap-2 font-black text-base sm:text-2xl tracking-tighter">FINTECH.TN</div>
              <div className="flex items-center gap-2 font-black text-base sm:text-2xl tracking-tighter italic">SaaS.tn</div>
            </div>
          </div>

          {/* Dashboard mockup */}
          <div className="relative max-w-6xl mx-auto group perspective-1000">
            <div className="absolute -inset-4 bg-gradient-to-tr from-indigo-500/30 to-blue-500/30 rounded-[4rem] blur-[60px] opacity-40 group-hover:opacity-60 transition duration-1000 animate-pulse" />

            <div className="relative bg-white rounded-[2rem] sm:rounded-[3.5rem] border border-white p-2 sm:p-4 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.1),0_30px_60px_-30px_rgba(0,0,0,0.15)] ring-1 ring-slate-200 overflow-hidden transform group-hover:-translate-y-2 transition-transform duration-700">
              <div className="bg-slate-50 rounded-xl sm:rounded-[2.5rem] border border-slate-100 overflow-hidden aspect-[16/10] flex shadow-inner">
                {/* Sidebar */}
                <div className="w-1/4 h-full border-e border-slate-200 p-4 sm:p-8 hidden sm:flex flex-col gap-6 sm:gap-10 bg-white/50">
                  <div className="flex items-center gap-3 opacity-40">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-indigo-600" />
                    <div className="h-3 sm:h-4 w-16 sm:w-24 bg-slate-200 rounded-full" />
                  </div>
                  <div className="space-y-3 sm:space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className={`h-7 sm:h-10 w-full rounded-xl ${
                          i === 1 ? 'bg-indigo-50 border border-indigo-100' : ''
                        }`}
                      />
                    ))}
                  </div>
                </div>
                {/* Content */}
                <div className="flex-1 h-full p-4 sm:p-10 flex flex-col gap-4 sm:gap-8">
                  <header className="flex justify-between items-center">
                    <div className="space-y-1 sm:space-y-2">
                      <div className="h-4 sm:h-6 w-24 sm:w-48 bg-slate-300 rounded-full" />
                      <div className="h-2 sm:h-3 w-32 sm:w-64 bg-slate-100 rounded-full" />
                    </div>
                    <div className="flex gap-2 sm:gap-3">
                      <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-full bg-slate-200" />
                      <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-full bg-slate-200" />
                    </div>
                  </header>
                  <div className="grid grid-cols-3 gap-2 sm:gap-6">
                    {[100, 70, 45].map((w, i) => (
                      <div
                        key={i}
                        className="h-14 sm:h-28 bg-white rounded-2xl sm:rounded-3xl border border-slate-100 p-3 sm:p-6 flex flex-col justify-between shadow-sm"
                      >
                        <div className="h-1.5 sm:h-2 w-8 sm:w-12 bg-slate-100 rounded-full" />
                        <div className="h-3 sm:h-6 rounded-lg bg-slate-300" style={{ width: `${w}%` }} />
                      </div>
                    ))}
                  </div>
                  <div className="flex-1 bg-white rounded-xl sm:rounded-[2.5rem] border border-slate-100 p-3 sm:p-8 relative shadow-sm">
                    <div className="absolute inset-x-3 sm:inset-x-8 bottom-3 sm:bottom-8 top-6 sm:top-12 flex items-end justify-between gap-1 sm:gap-4">
                      {[60, 80, 45, 90, 65, 80, 55, 95].map((h, i) => (
                        <div
                          key={i}
                          className="flex-1 bg-gradient-to-t from-indigo-500 to-indigo-400 rounded-t-xl sm:rounded-t-2xl shadow-lg transition-all duration-500"
                          style={{ height: `${h}%` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Float cards — only desktop */}
              <div
                className="absolute top-1/4 -right-12 hidden lg:block animate-bounce"
                style={{ animationDuration: '6s' }}
              >
                <div className="bg-white/90 backdrop-blur-xl p-6 rounded-3xl shadow-2xl border border-white ring-1 ring-slate-200 text-start max-w-xs transform rotate-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-black text-sm text-slate-900">Signé avec succès</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">TunTrust Certified</p>
                    </div>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full w-full bg-emerald-500" />
                  </div>
                </div>
              </div>

              <div
                className="absolute bottom-1/4 -left-12 hidden lg:block animate-bounce"
                style={{ animationDuration: '8s' }}
              >
                <div className="bg-white/90 backdrop-blur-xl p-6 rounded-3xl shadow-2xl border border-white ring-1 ring-slate-200 text-start max-w-xs transform -rotate-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-black text-sm text-slate-900">XML Exportation</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">TradeNet Ready</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="h-1.5 w-1/3 bg-blue-500 rounded-full" />
                    <div className="h-1.5 w-1/3 bg-blue-300 rounded-full" />
                    <div className="h-1.5 w-1/3 bg-blue-100 rounded-full" />
                  </div>
                </div>
              </div>

              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/5 to-transparent pointer-events-none" />
            </div>
          </div>
        </div>
      </section>

      {/* ── Compliance ── */}
      <section id="compliance" className="py-16 sm:py-24 md:py-32 bg-slate-950 text-white overflow-hidden relative">
        <div className="absolute inset-0 z-0 opacity-20">
          <div className="absolute top-1/4 left-0 w-[400px] sm:w-[800px] h-[400px] sm:h-[800px] bg-indigo-600/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 right-0 w-[400px] sm:w-[800px] h-[400px] sm:h-[800px] bg-blue-600/10 rounded-full blur-[120px]" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 xl:gap-24 items-center">
            {/* Left */}
            <div className="text-start space-y-6 sm:space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/10 text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] border border-blue-500/20">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                Dévoué à la Conformité
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black leading-[0.95] tracking-tighter">
                {t('landing.tuntrust.title')}
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-slate-400 font-medium leading-relaxed max-w-lg">
                {t('landing.tuntrust.explanation')}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 pt-2 sm:pt-8">
                <div className="space-y-3 sm:space-y-4 group">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center group-hover:bg-blue-600 group-hover:border-blue-500 transition-all">
                    <Lock className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400 group-hover:text-white" />
                  </div>
                  <h4 className="font-bold text-base sm:text-lg">Sécurité XAdES</h4>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed">
                    Standard de signature numérique le plus robuste requis par l'état Tunisien.
                  </p>
                </div>
                <div className="space-y-3 sm:space-y-4 group">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center group-hover:bg-indigo-600 group-hover:border-indigo-500 transition-all">
                    <Globe className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-400 group-hover:text-white" />
                  </div>
                  <h4 className="font-bold text-base sm:text-lg">Direct TradeNet</h4>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed">
                    Soumission automatique vers la plateforme TTN sans quitter l'interface.
                  </p>
                </div>
              </div>
            </div>

            {/* Right — process card */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[2rem] sm:rounded-[3rem] blur-2xl opacity-20 group-hover:opacity-40 transition duration-1000" />
              <div className="relative bg-slate-900 p-6 sm:p-8 lg:p-12 rounded-[2rem] sm:rounded-[2.5rem] lg:rounded-[3.5rem] border border-slate-800">
                <h3 className="text-xl sm:text-2xl font-black mb-8 sm:mb-10 lg:mb-12 flex items-center gap-3 sm:gap-4">
                  <span className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg shadow-blue-900/50 shrink-0">
                    <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </span>
                  Processus de Signature
                </h3>
                <div className="space-y-6 sm:space-y-8 lg:space-y-12 relative">
                  <div className="absolute left-5 sm:left-6 top-6 bottom-6 w-px bg-slate-800" />
                  {[1, 2, 3].map((step) => (
                    <div
                      key={step}
                      className="flex gap-4 sm:gap-8 relative hover:translate-x-1 sm:hover:translate-x-2 transition-transform duration-300 group/item"
                    >
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-slate-800 border-4 border-slate-950 flex items-center justify-center font-black text-xs relative z-10 shrink-0 group-hover/item:border-blue-600 transition-colors">
                        0{step}
                      </div>
                      <div className="min-w-0 pt-1">
                        <p className="text-slate-200 font-black text-base sm:text-lg mb-1 sm:mb-2">
                          {t(`landing.tuntrust.steps.step${step}`).split('.')[0]}
                        </p>
                        <p className="text-slate-500 text-sm font-medium leading-relaxed">
                          {t(`landing.tuntrust.steps.step${step}`).split('.')[1] ||
                            'Processus automatisé et hautement sécurisé pour votre entreprise.'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-8 sm:mt-10 lg:mt-12 p-5 sm:p-6 lg:p-8 rounded-2xl sm:rounded-3xl bg-blue-600 shadow-2xl shadow-blue-900/40 relative overflow-hidden group/btn">
                  <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover/btn:scale-150 transition-transform duration-1000" />
                  <a
                    href="https://www.tuntrust.tn"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between font-black text-base sm:text-xl hover:translate-x-1 transition-transform"
                  >
                    {t('landing.tuntrust.cta')}
                    <ExternalLink className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-16 sm:py-24 md:py-32 px-4 sm:px-6 lg:px-8 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-start mb-12 sm:mb-16 md:mb-24 max-w-2xl">
            <h2 className="text-xs font-black text-indigo-600 uppercase tracking-[0.4em] mb-4 sm:mb-6 flex items-center gap-4">
              <div className="h-px w-12 bg-indigo-200" />
              {t('landing.features.badge')}
            </h2>
            <h3 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black text-slate-900 tracking-tighter leading-[0.95]">
              {t('landing.features.title')}
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
              <div
                key={i}
                className="group p-6 sm:p-8 lg:p-10 xl:p-12 rounded-3xl sm:rounded-[2.5rem] lg:rounded-[3.5rem] bg-slate-50 border border-slate-100 hover:bg-white hover:border-white hover:shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)] transition-all duration-500 relative overflow-hidden"
              >
                <div
                  className={`absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 ${feature.color}/5 rounded-full -me-12 sm:-me-16 -mt-12 sm:-mt-16 group-hover:scale-150 transition-transform duration-1000`}
                />
                <div className="mb-6 sm:mb-8 lg:mb-10 w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-xl sm:rounded-2xl bg-white shadow-xl shadow-slate-200/50 flex items-center justify-center relative z-10 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                  <Icon className={`w-6 h-6 sm:w-8 sm:h-8 ${feature.iconColor}`} />
                </div>
                <h4 className="text-lg sm:text-xl lg:text-2xl font-black text-slate-900 mb-3 sm:mb-4 lg:mb-6 relative z-10">
                  {feature.title}
                </h4>
                <p className="text-sm sm:text-base text-slate-500 font-semibold leading-relaxed relative z-10 group-hover:text-slate-600">
                  {feature.desc}
                </p>
                <div className="mt-4 sm:mt-6 lg:mt-8 pt-4 sm:pt-6 lg:pt-8 border-t border-slate-100 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 group-hover:text-indigo-600 transition-colors">
                  {t('common.details')}
                  <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1" />
                </div>
              </div>
            )})}
          </div>
        </div>
      </section>

      {/* ── Commercial workflow ── */}
      <section id="workflow" className="py-16 sm:py-24 md:py-32 px-4 sm:px-6 lg:px-8 bg-slate-50 relative border-y border-slate-100">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.4em] mb-4 sm:mb-6">
            Workflow global
          </h2>
          <h3 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-black text-slate-900 tracking-tighter leading-[0.95] mb-6">
            De l'idée au règlement, sans perdre la conformité.
          </h3>
          <p className="max-w-3xl mx-auto text-slate-500 text-base sm:text-lg font-bold">
            InvoicePro accompagne les TPE/PME tunisiennes sur les idées de projet, offres, bons de commande, devis,
            factures, signature électronique, suivi TTN et historique de traçabilité.
          </p>
          <div className="mt-10 grid grid-cols-1 md:grid-cols-6 gap-3 text-sm font-black text-slate-700">
            {['Idée', 'Offre', 'Devis', 'Facture', 'TTN', 'Règlement'].map((step) => (
              <div key={step} className="rounded-2xl bg-white border border-slate-100 px-5 py-4 shadow-sm">{step}</div>
            ))}
          </div>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/demo" className="w-full sm:w-auto bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black hover:bg-slate-900 transition-all">
              Demander une démo
            </Link>
            <Link to="/contact" className="w-full sm:w-auto bg-white text-slate-900 px-8 py-4 rounded-2xl font-black border border-slate-200 hover:border-indigo-300 transition-all">
              Parler à un conseiller
            </Link>
            <Link to="/register" className="w-full sm:w-auto bg-slate-900 text-white px-8 py-4 rounded-2xl font-black hover:bg-indigo-600 transition-all">
              Commencer
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-12 sm:py-16 md:py-24 border-t border-slate-100 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 lg:gap-16 relative z-10">
          <div className="space-y-6 sm:space-y-8 sm:col-span-2 lg:col-span-1">
            <Link to="/" className="flex items-center gap-3 sm:gap-4 group">
              <BrandLogo className="h-11 w-auto max-w-[220px] sm:h-12" />
            </Link>
            <p className="text-slate-500 font-semibold leading-relaxed max-w-xs text-sm">
              {t('landing.footer.desc')}
            </p>
            <div className="flex gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-black text-slate-900 uppercase tracking-widest text-xs mb-6 sm:mb-8">
              {t('landing.nav.features')}
            </h4>
            <ul className="space-y-3 sm:space-y-4 text-slate-500 font-bold text-sm">
              <li><a href="#features" className="hover:text-indigo-600 transition-colors">{t('landing.nav.features')}</a></li>
              <li><a href="#compliance" className="hover:text-indigo-600 transition-colors">{t('landing.nav.compliance')}</a></li>
              <li><Link to="/pricing" className="hover:text-indigo-600 transition-colors">{t('landing.nav.pricing')}</Link></li>
              <li><a href="#" className="hover:text-indigo-600 transition-colors">Digital Signature</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-black text-slate-900 uppercase tracking-widest text-xs mb-6 sm:mb-8">Support</h4>
            <ul className="space-y-3 sm:space-y-4 text-slate-500 font-bold text-sm">
              <li><a href="#" className="hover:text-indigo-600 transition-colors">Documentation</a></li>
              <li><a href="#" className="hover:text-indigo-600 transition-colors">FAQ</a></li>
              <li><a href="#" className="hover:text-indigo-600 transition-colors">Contact</a></li>
              <li><a href="#" className="hover:text-indigo-600 transition-colors">État du service</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-black text-slate-900 uppercase tracking-widest text-xs mb-6 sm:mb-8">Légal</h4>
            <ul className="space-y-3 sm:space-y-4 text-slate-500 font-bold text-sm">
              <li><Link to="/privacy" className="hover:text-indigo-600 transition-colors">{t('landing.footer.privacy')}</Link></li>
              <li><Link to="/terms" className="hover:text-indigo-600 transition-colors">{t('landing.footer.terms')}</Link></li>
              <li><Link to="/legal" className="hover:text-indigo-600 transition-colors">{t('landing.footer.legal')}</Link></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 sm:mt-12 lg:mt-24 pt-6 sm:pt-8 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] text-center sm:text-start">
            © 2024 InvoicePro Tunis. Tous droits réservés.
          </p>
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Opérationnel en Tunisie</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
