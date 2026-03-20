import React from 'react';
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
  Activity,
  Plus,
  ExternalLink
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const LangSwitcher = () => {
  const { lang, setLang } = useLanguage();
  return (
    <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-lg border border-gray-100">
      {['fr', 'en', 'ar'].map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all ${
            lang === l ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
};

const Landing = () => {
  const { t, lang } = useLanguage();
  const isRtl = lang === 'ar';

  return (
    <div className={`min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900 ${isRtl ? 'rtl' : 'ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-6 group">
            <div className="bg-blue-600 p-2.5 rounded-xl shadow-lg shadow-blue-100 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-black tracking-tight text-slate-800">El Fatoura</span>
          </Link>
          <div className="hidden md:flex items-center gap-10">
            <a href="#features" className="text-sm font-bold leading-6 text-slate-600 hover:text-blue-600 transition-colors uppercase tracking-wide">{t('landing.nav.features')}</a>
            <a href="#compliance" className="text-sm font-bold leading-6 text-slate-600 hover:text-blue-600 transition-colors uppercase tracking-wide">{t('landing.nav.compliance')}</a>
            <a href="#pricing" className="text-sm font-bold leading-6 text-slate-600 hover:text-blue-600 transition-colors uppercase tracking-wide">{t('landing.nav.pricing')}</a>
            <div className="h-6 w-px bg-gray-200 mx-2"></div>
            <LangSwitcher />
          </div>
          <div className="hidden lg:flex lg:flex-1 lg:justify-end gap-6 items-center">
            <Link to="/login" className="text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors">{t('landing.nav.login')}</Link>
            <Link to="/register" className="text-sm font-bold bg-blue-600 text-white px-6 py-2.5 rounded-xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 active:scale-95">
              {t('landing.nav.register')}
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-4 overflow-hidden">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-700 text-xs font-bold mb-8 animate-fade-in border border-blue-100">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
            </span>
            {t('landing.hero.badge')}
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tight leading-[1.1] mb-8">
            {t('landing.hero.title').split('Facturation Électronique').map((part, i, arr) => (
              <React.Fragment key={i}>
                {part}
                {i < arr.length - 1 && (
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                    {lang === 'ar' ? 'الفوترة الإلكترونية' : 'Facturation Électronique'}
                  </span>
                )}
              </React.Fragment>
            ))}
          </h1>
          <p className="max-w-3xl mx-auto text-lg md:text-xl text-slate-500 mb-12 leading-relaxed font-medium">
            {t('landing.hero.subtitle')}
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-20">
            <Link to="/register" className="w-full sm:w-auto bg-slate-900 text-white px-10 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-slate-800 transition-all shadow-2xl shadow-slate-200 active:scale-95 group text-lg">
              {t('landing.hero.cta')}
              <ArrowRight className={`w-5 h-5 group-hover:translate-x-1 transition-transform ${isRtl ? 'rotate-180' : ''}`} />
            </Link>
            <Link to="/demo" className="w-full sm:w-auto px-10 py-4 bg-white text-blue-600 font-bold rounded-2xl shadow-xl shadow-blue-50 hover:shadow-2xl hover:shadow-blue-100 transition-all active:scale-95 flex items-center justify-center gap-3 border border-blue-50">
              <Zap className="w-5 h-5 text-amber-500" />
              {t('landing.hero.demo')}
            </Link>
          </div>

          {/* Dashboard Preview Mockup */}
          <div className="relative max-w-5xl mx-auto group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[2.5rem] blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative max-w-5xl mx-auto rounded-[3rem] border border-slate-200 shadow-2xl overflow-hidden bg-white aspect-[16/10]">
              <div className="flex h-full">
                {/* Mock Sidebar */}
                <div className="w-64 bg-slate-50 border-r border-slate-100 p-8 hidden lg:block">
                  <div className="flex items-center gap-3 mb-10">
                    <div className="bg-blue-600 p-2 rounded-lg shadow-sm">
                      <ShieldCheck className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-black text-slate-800 tracking-tight">El Fatoura</span>
                  </div>
                  <div className="space-y-6">
                    <div className="h-2 w-16 bg-slate-200 rounded-full mb-8"></div>
                    <div className="h-10 w-full bg-white rounded-xl border border-blue-100 shadow-sm"></div>
                    <div className="h-10 w-full bg-transparent rounded-xl"></div>
                    <div className="h-10 w-full bg-transparent rounded-xl"></div>
                  </div>
                </div>

                {/* Mock Content */}
                <div className="flex-1 flex flex-col">
                  <div className="h-20 border-b border-slate-100 flex items-center justify-between px-10">
                    <div className="h-5 w-40 bg-slate-100 rounded-full text-xs flex items-center px-4 text-slate-400 font-bold uppercase tracking-widest">{t('nav.dashboard')}</div>
                    <div className="flex gap-4">
                      <div className="h-10 w-10 bg-slate-100 rounded-full"></div>
                    </div>
                  </div>
                  <div className="p-10 space-y-10">
                    <div className="flex justify-between items-end">
                      <div className="space-y-3">
                        <div className="h-8 w-56 bg-slate-200 rounded-xl"></div>
                        <div className="h-4 w-80 bg-slate-100 rounded-full"></div>
                      </div>
                      <div className="h-12 w-40 bg-blue-600 rounded-2xl shadow-lg shadow-blue-100"></div>
                    </div>
                    <div className="grid grid-cols-3 gap-8">
                      {[1,2,3].map(i => (
                        <div key={i} className="h-32 bg-slate-50 border border-slate-100 rounded-[2rem] p-6 shadow-sm">
                           <div className="h-2.5 w-16 bg-slate-200 rounded-full mb-4"></div>
                           <div className="h-8 w-24 bg-slate-300 rounded-xl"></div>
                        </div>
                      ))}
                    </div>
                    <div className="h-72 bg-slate-50 border border-slate-100 rounded-[2.5rem] p-8 relative">
                       <div className="absolute inset-x-10 bottom-10 flex items-end justify-between gap-3 h-48">
                          {[40, 70, 45, 90, 65, 80, 55, 95].map((h, i) => (
                            <div key={i} className="flex-1 bg-blue-200 rounded-t-xl hover:bg-blue-400 transition-colors cursor-pointer" style={{ height: `${h}%` }}></div>
                          ))}
                       </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Overlay */}
              <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                 <div className="bg-slate-900/90 text-white px-10 py-5 rounded-[2rem] font-black flex items-center gap-4 shadow-2xl border border-slate-700 backdrop-blur-md">
                    {t('landing.hero.optimized')} <Activity className="w-6 h-6 text-blue-400" />
                 </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TunTrust Info Section */}
      <section id="compliance" className="py-24 bg-slate-900 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/20 blur-[120px] rounded-full -mr-48 -mt-24"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-600/20 blur-[120px] rounded-full -ml-48 -mb-24"></div>
        
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold mb-6 border border-blue-500/20">
                <ShieldCheck className="w-4 h-4" />
                {t('landing.nav.compliance')}
              </div>
              <h2 className="text-4xl md:text-5xl font-black mb-8 leading-tight">
                {t('landing.tuntrust.title')}
              </h2>
              <div className="space-y-6 text-slate-400 text-lg font-medium leading-relaxed">
                <p className="text-white font-bold text-xl">{t('landing.tuntrust.subtitle')}</p>
                <p>{t('landing.tuntrust.explanation')}</p>
                <div className="p-6 bg-slate-800 rounded-3xl border border-slate-700 shadow-xl">
                  <p className="text-blue-400 font-bold mb-2">⚠️ {t('landing.tuntrust.legal').split(':')[0]}:</p>
                  <p className="text-sm">{t('landing.tuntrust.legal').split(':')[1]}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-slate-800 p-10 rounded-[3rem] border border-slate-700 shadow-2xl">
              <h3 className="text-2xl font-bold mb-10 flex items-center gap-3">
                <CheckCircle2 className="w-8 h-8 text-blue-500" />
                {t('landing.tuntrust.steps.title')}
              </h3>
              <div className="space-y-8 relative">
                <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-slate-700"></div>
                {[1, 2, 3].map((step) => (
                  <div key={step} className="flex gap-6 relative">
                    <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center font-black text-sm relative z-10 shrink-0 shadow-lg shadow-blue-900">{step}</div>
                    <p className="text-slate-300 font-bold pt-1">{t(`landing.tuntrust.step${step}`)}</p>
                  </div>
                ))}
              </div>
              <a 
                href="https://www.tuntrust.tn" 
                target="_blank" 
                className="mt-12 w-full bg-white text-slate-900 py-4 rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-slate-100 transition-all group"
              >
                {t('landing.tuntrust.cta')}
                <ExternalLink className="w-5 h-5 group-hover:translate-y-[-2px] transition-transform" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-xs font-black text-blue-600 uppercase tracking-[0.3em] mb-4">{t('landing.features.badge')}</h2>
            <h3 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight">{t('landing.features.title')}</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              {
                icon: <FileText className="w-10 h-10 text-blue-600" />,
                title: t('landing.features.1.title'),
                desc: t('landing.features.1.desc'),
                color: 'bg-blue-50'
              },
              {
                icon: <Globe className="w-10 h-10 text-indigo-600" />,
                title: t('landing.features.2.title'),
                desc: t('landing.features.2.desc'),
                color: 'bg-indigo-50'
              },
              {
                icon: <Bot className="w-10 h-10 text-violet-600" />,
                title: t('landing.features.3.title'),
                desc: t('landing.features.3.desc'),
                color: 'bg-violet-50'
              },
              {
                icon: <ShieldCheck className="w-10 h-10 text-emerald-600" />,
                title: t('landing.features.4.title'),
                desc: t('landing.features.4.desc'),
                color: 'bg-emerald-50'
              },
              {
                icon: <Zap className="w-10 h-10 text-amber-600" />,
                title: t('landing.features.5.title'),
                desc: t('landing.features.5.desc'),
                color: 'bg-amber-50'
              },
              {
                icon: <BarChart3 className="w-10 h-10 text-rose-600" />,
                title: t('landing.features.6.title'),
                desc: t('landing.features.6.desc'),
                color: 'bg-rose-50'
              }
            ].map((feature, i) => (
              <div key={i} className="p-10 rounded-[2.5rem] bg-slate-50 border border-slate-100 hover:border-blue-200 transition-all hover:shadow-2xl hover:shadow-blue-50 group hover:-translate-y-2 duration-300">
                <div className={`mb-8 w-20 h-20 ${feature.color} rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform`}>{feature.icon}</div>
                <h4 className="text-2xl font-black text-slate-900 mb-4">{feature.title}</h4>
                <p className="text-slate-500 font-medium leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 bg-slate-50 overflow-hidden relative border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-600/5 text-blue-600 text-xs font-bold mb-4 border border-blue-600/10">
              <Zap className="w-4 h-4" />
              Processus
            </div>
            <h3 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight mb-8">{t('landing.howItWorks.title')}</h3>
            <p className="max-w-3xl mx-auto text-lg text-slate-500 font-medium leading-relaxed">
              {t('landing.howItWorks.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((step) => (
              <div key={step} className="p-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden text-center">
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-blue-50 rounded-full opacity-20 group-hover:scale-150 transition-transform duration-500"></div>
                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-xl mb-6 shadow-lg shadow-blue-100 relative z-10 transition-transform group-hover:-rotate-6">
                  {step}
                </div>
                <h4 className="text-xl font-black text-slate-900 mb-4 relative z-10">{t(`landing.howItWorks.step${step}.title`)}</h4>
                <p className="text-slate-500 font-medium leading-relaxed text-sm relative z-10">{t(`landing.howItWorks.step${step}.desc`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 px-4 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-xs font-black text-blue-600 uppercase tracking-[0.3em] mb-4">{t('landing.pricing.badge')}</h2>
            <h3 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight">{t('landing.pricing.title')}</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 items-center">
            {[
              { name: "Starter", price: "49", feat: [t('landing.pricing.starter.feat1'), t('landing.pricing.starter.feat2'), t('landing.pricing.starter.feat3')] },
              { name: "Professional", price: "99", feat: [t('landing.pricing.pro.feat1'), t('landing.pricing.pro.feat2'), t('landing.pricing.pro.feat3'), t('landing.pricing.pro.feat4')], popular: true },
              { name: "Enterprise", price: "199", feat: [t('landing.pricing.enterprise.feat1'), t('landing.pricing.enterprise.feat2'), t('landing.pricing.enterprise.feat3'), t('landing.pricing.enterprise.feat4')] },
            ].map((plan, i) => (
              <div key={i} className={`p-10 rounded-[3rem] bg-white border ${plan.popular ? 'border-blue-500 shadow-2xl scale-105 relative z-10' : 'border-slate-100 shadow-sm opacity-90'}`}>
                {plan.popular && <span className="absolute -top-5 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest shadow-lg">{t('landing.pricing.popular')}</span>}
                <h4 className="text-2xl font-black text-slate-900 mb-3">{plan.name}</h4>
                <div className="flex items-baseline gap-2 mb-10">
                  <span className="text-5xl font-black text-slate-900">{plan.price}</span>
                  <span className="text-slate-400 font-bold text-base">{t('landing.pricing.currency')}</span>
                </div>
                <ul className="space-y-5 mb-10">
                  {plan.feat.map((f, j) => (
                    <li key={j} className="flex items-center gap-4 text-slate-600 text-sm font-bold">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <Link to="/register" className={`w-full py-5 rounded-2xl font-black text-sm flex items-center justify-center transition-all ${plan.popular ? 'bg-blue-600 text-white shadow-xl shadow-blue-200 hover:bg-blue-700' : 'bg-slate-100 text-slate-900 hover:bg-slate-200'}`}>
                  {t('landing.pricing.choose')}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-slate-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-12 text-sm text-slate-500 font-bold">
          <Link to="/" className="flex items-center gap-4 group">
            <div className="bg-slate-900 p-2 rounded-lg group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-black text-slate-900 tracking-tight">El Fatoura</span>
          </Link>
          <div className="flex gap-10 uppercase tracking-widest text-[10px]">
            <Link to="/privacy" className="hover:text-blue-600 transition-colors">{t('landing.footer.privacy')}</Link>
            <Link to="/terms" className="hover:text-blue-600 transition-colors">{t('landing.footer.terms')}</Link>
            <Link to="/legal" className="hover:text-blue-600 transition-colors">{t('landing.footer.legal')}</Link>
          </div>
          <div className="text-slate-400 font-medium">© 2024 El Fatoura. {t('landing.footer.madeIn')}</div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
