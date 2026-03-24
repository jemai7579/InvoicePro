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
  ExternalLink,
  ChevronRight,
  Sparkles,
  Lock,
  Layout,
  MessageSquare
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const LangSwitcher = () => {
  const { lang, setLang } = useLanguage();
  return (
    <div className="flex items-center gap-1 bg-white/50 backdrop-blur-sm p-1 rounded-xl border border-slate-200/50 shadow-sm">
      {['fr', 'en', 'ar'].map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all ${
            lang === l ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
};

const Landing = () => {
  console.log('Landing.jsx: Rendering Landing');
  const { t, lang } = useLanguage();
  const isRtl = lang === 'ar';

  return (
    <div className={`min-h-screen bg-white text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900 ${isRtl ? 'rtl' : 'ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      
      {/* Dynamic Background Blurs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[1000px] h-[1000px] bg-indigo-50/50 rounded-full blur-[140px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[1000px] h-[1000px] bg-blue-50/50 rounded-full blur-[140px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-[100] transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-white/80 backdrop-blur-xl border border-white/50 shadow-lg shadow-slate-200/50 rounded-[2rem] h-20 px-8 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-4 group">
              <div className="bg-indigo-600 p-2.5 rounded-[1.2rem] shadow-xl shadow-indigo-200 group-hover:rotate-6 transition-all duration-300">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-black tracking-tighter text-slate-900">El Fatoura</span>
            </Link>
            
            <div className="hidden lg:flex items-center gap-8">
              <a href="#features" className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 hover:text-indigo-600 transition-colors">{t('landing.nav.features')}</a>
              <a href="#compliance" className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 hover:text-indigo-600 transition-colors">{t('landing.nav.compliance')}</a>
              <a href="#pricing" className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 hover:text-indigo-600 transition-colors">{t('landing.nav.pricing')}</a>
              <div className="h-4 w-px bg-slate-200" />
              <LangSwitcher />
            </div>

            <div className="flex items-center gap-4">
              <Link to="/login" className="hidden sm:block text-sm font-bold text-slate-600 hover:text-indigo-600 transition-colors">{t('landing.nav.login')}</Link>
              <Link to="/register" className="bg-slate-900 text-white px-6 py-3 rounded-2xl text-sm font-bold hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200 active:scale-95">
                {t('landing.nav.register')}
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-48 pb-24 px-4 overflow-hidden z-10">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-indigo-50 text-indigo-700 text-[11px] font-black uppercase tracking-[0.2em] mb-10 border border-indigo-100/50 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Sparkles className="w-3.5 h-3.5" />
            {t('landing.hero.badge')}
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black text-slate-900 tracking-[calc(-0.04em)] leading-[0.95] mb-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            {t('landing.hero.title').split('Facturation Électronique').map((part, i, arr) => (
              <React.Fragment key={i}>
                {part}
                {i < arr.length - 1 && (
                  <span className="relative inline-block mt-2">
                    <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-600">
                      {lang === 'ar' ? 'الفوترة الإلكترونية' : 'Facturation Électronique'}
                    </span>
                    <span className="absolute bottom-4 left-0 w-full h-4 bg-indigo-100/50 -rotate-1 z-0" />
                  </span>
                )}
              </React.Fragment>
            ))}
          </h1>
          
          <p className="max-w-3xl mx-auto text-xl md:text-2xl text-slate-500 mb-14 leading-relaxed font-semibold animate-in fade-in slide-in-from-bottom-6 duration-1000">
            {t('landing.hero.subtitle')}
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-24 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <Link to="/register" className="w-full sm:w-auto bg-indigo-600 text-white px-12 py-5 rounded-[2rem] font-black flex items-center justify-center gap-4 hover:bg-slate-900 hover:shadow-[0_20px_50px_rgba(79,70,229,0.3)] transition-all active:scale-95 group text-lg shadow-2xl shadow-indigo-100">
              {t('landing.hero.cta')}
              <ArrowRight className={`w-6 h-6 group-hover:translate-x-1 transition-transform ${isRtl ? 'rotate-180' : ''}`} />
            </Link>
            <Link to="/demo" className="w-full sm:w-auto px-12 py-5 bg-white text-slate-900 font-black rounded-[2rem] shadow-xl shadow-slate-100 border border-slate-200 hover:border-indigo-600 transition-all active:scale-95 flex items-center justify-center gap-4 text-lg group">
              <Zap className="w-6 h-6 text-amber-500 fill-amber-500 group-hover:scale-125 transition-transform" />
              {t('landing.hero.demo')}
            </Link>
          </div>

          {/* New Trusted By Section */}
          <div className="mb-24 animate-in fade-in duration-1000">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-8">{t('landing.hero.optimized') || 'CONFÉRÉ PAR LES LEADERS'}</p>
            <div className="flex flex-wrap justify-center gap-10 md:gap-20 opacity-30 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-700">
              <div className="flex items-center gap-2 font-black text-2xl tracking-tighter italic">TUNTRUST</div>
              <div className="flex items-center gap-2 font-black text-2xl tracking-tighter">TRADENET</div>
              <div className="flex items-center gap-2 font-black text-2xl tracking-tighter">FINTECH.TN</div>
              <div className="flex items-center gap-2 font-black text-2xl tracking-tighter italic">SaaS.tn</div>
            </div>
          </div>

          {/* Premium Dashboard Mockup */}
          <div className="relative max-w-6xl mx-auto group perspective-1000">
            <div className="absolute -inset-4 bg-gradient-to-tr from-indigo-500/30 to-blue-500/30 rounded-[4rem] blur-[60px] opacity-40 group-hover:opacity-60 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
            
            <div className="relative bg-white rounded-[3.5rem] border border-white p-4 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.1),0_30px_60px_-30px_rgba(0,0,0,0.15)] ring-1 ring-slate-200 overflow-hidden transform group-hover:rotate-x-1 group-hover:-translate-y-2 transition-transform duration-700">
              <div className="bg-slate-50 rounded-[2.5rem] border border-slate-100 overflow-hidden aspect-[16/10] flex shadow-inner">
                {/* Mockup Sidebar */}
                <div className="w-1/4 h-full border-e border-slate-200 p-8 hidden md:flex flex-col gap-10 bg-white/50">
                  <div className="flex items-center gap-3 opacity-40">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600" />
                    <div className="h-4 w-24 bg-slate-200 rounded-full" />
                  </div>
                  <div className="space-y-4">
                    {[1,2,3,4,5].map(i => (
                      <div key={i} className={`h-10 w-full rounded-xl ${i === 1 ? 'bg-indigo-50 border border-indigo-100' : 'bg-transparent'}`} />
                    ))}
                  </div>
                </div>
                {/* Mockup Content */}
                <div className="flex-1 h-full p-10 flex flex-col gap-8">
                  <header className="flex justify-between items-center mb-4">
                    <div className="space-y-2">
                       <div className="h-6 w-48 bg-slate-300 rounded-full" />
                       <div className="h-3 w-64 bg-slate-100 rounded-full" />
                    </div>
                    <div className="flex gap-3">
                       <div className="w-10 h-10 rounded-full bg-slate-200" />
                       <div className="w-10 h-10 rounded-full bg-slate-200" />
                    </div>
                  </header>
                  <div className="grid grid-cols-3 gap-6">
                    {[100, 70, 45].map((w, i) => (
                      <div key={i} className="h-28 bg-white rounded-3xl border border-slate-100 p-6 flex flex-col justify-between shadow-sm">
                        <div className="h-2 w-12 bg-slate-100 rounded-full" />
                        <div className={`h-6 rounded-lg bg-slate-300`} style={{ width: `${w}%` }} />
                      </div>
                    ))}
                  </div>
                  <div className="flex-1 bg-white rounded-[2.5rem] border border-slate-100 p-8 relative shadow-sm">
                    <div className="absolute inset-x-8 bottom-8 top-12 flex items-end justify-between gap-4">
                      {[60, 80, 45, 90, 65, 80, 55, 95].map((h, i) => (
                        <div key={i} className="flex-1 bg-gradient-to-t from-indigo-500 to-indigo-400 rounded-t-2xl shadow-lg relative group/bar transition-all duration-500" style={{ height: `${h}%` }}>
                          <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover/bar:opacity-100 transition-opacity">7.4k</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Float Cards */}
              <div className="absolute top-1/4 -right-12 hidden lg:block animate-bounce" style={{ animationDuration: '6s' }}>
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

              <div className="absolute bottom-1/4 -left-12 hidden lg:block animate-bounce" style={{ animationDuration: '8s' }}>
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

              {/* Dark Gradient Overlay for premium look */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/5 to-transparent pointer-events-none" />
            </div>
          </div>
        </div>
      </section>

      {/* Modern Compliance Section */}
      <section id="compliance" className="py-32 bg-slate-950 text-white overflow-hidden relative">
        <div className="absolute inset-0 z-0 opactiy-20">
          <div className="absolute top-1/4 left-0 w-[800px] h-[800px] bg-indigo-600/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 right-0 w-[800px] h-[800px] bg-blue-600/10 rounded-full blur-[120px]" />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
            <div className="text-start space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/10 text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] border border-blue-500/20">
                <ShieldCheck className="w-4 h-4" />
                Dévoué à la Conformité
              </div>
              <h2 className="text-5xl md:text-7xl font-black leading-[0.95] tracking-tighter">
                {t('landing.tuntrust.title')}
              </h2>
              <p className="text-xl text-slate-400 font-medium leading-relaxed max-w-lg">
                {t('landing.tuntrust.explanation')}
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-8">
                <div className="space-y-4 group">
                  <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center group-hover:bg-blue-600 group-hover:border-blue-500 transition-all">
                    <Lock className="w-6 h-6 text-blue-400 group-hover:text-white" />
                  </div>
                  <h4 className="font-bold text-lg">Sécurité XAdES</h4>
                  <p className="text-sm text-slate-500 font-medium">Standard de signature numérique le plus robuste requis par l'état Tunisien.</p>
                </div>
                <div className="space-y-4 group">
                  <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center group-hover:bg-indigo-600 group-hover:border-indigo-500 transition-all">
                    <Globe className="w-6 h-6 text-indigo-400 group-hover:text-white" />
                  </div>
                  <h4 className="font-bold text-lg">Direct TradeNet</h4>
                  <p className="text-sm text-slate-500 font-medium">Soumission automatique vers la plateforme TTN sans quitter l'interface.</p>
                </div>
              </div>
            </div>
            
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[3rem] blur-2xl opacity-20 group-hover:opacity-40 transition duration-1000"></div>
              <div className="relative bg-slate-900 p-12 rounded-[3.5rem] border border-slate-800 shadow-3xl">
                <h3 className="text-2xl font-black mb-12 flex items-center gap-4">
                  <span className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-900/50">
                    <CheckCircle2 className="w-6 h-6 text-white" />
                  </span>
                  Processus de Signature
                </h3>
                <div className="space-y-12 relative">
                  <div className="absolute left-6 top-6 bottom-6 w-px bg-slate-800"></div>
                  {[1, 2, 3].map((step) => (
                    <div key={step} className="flex gap-8 relative hover:translate-x-2 transition-transform duration-300 group/item">
                      <div className="w-12 h-12 rounded-full bg-slate-800 border-4 border-slate-950 flex items-center justify-center font-black text-xs relative z-10 shrink-0 group-hover/item:border-blue-600 transition-colors">0{step}</div>
                      <div>
                        <p className="text-slate-200 font-black text-lg mb-2">{t(`landing.tuntrust.step${step}`).split(':')[0]}</p>
                        <p className="text-slate-500 text-sm font-medium">{t(`landing.tuntrust.step${step}`).split(':')[1] || 'Processus automatisé et hautement sécurisé pour votre entreprise.'}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-12 p-8 rounded-3xl bg-blue-600 shadow-2xl shadow-blue-900/40 relative overflow-hidden group/btn">
                  <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover/btn:scale-150 transition-transform duration-1000" />
                  <a href="https://www.tuntrust.tn" target="_blank" className="flex items-center justify-between font-black text-xl hover:translate-x-1 transition-transform">
                    {t('landing.tuntrust.cta')}
                    <ExternalLink className="w-6 h-6" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Elevated Features Section */}
      <section id="features" className="py-32 px-4 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-start mb-24 max-w-2xl">
            <h2 className="text-xs font-black text-indigo-600 uppercase tracking-[0.4em] mb-6 flex items-center gap-4">
               <div className="h-px w-12 bg-indigo-200" />
               {t('landing.features.badge')}
            </h2>
            <h3 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter leading-[0.95]">{t('landing.features.title')}</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <FileText className="w-8 h-8 text-blue-600" />,
                title: t('landing.features.1.title'),
                desc: t('landing.features.1.desc'),
                color: 'bg-blue-600'
              },
              {
                icon: <Globe className="w-8 h-8 text-indigo-600" />,
                title: t('landing.features.2.title'),
                desc: t('landing.features.2.desc'),
                color: 'bg-indigo-600'
              },
              {
                icon: <Bot className="w-8 h-8 text-violet-600" />,
                title: t('landing.features.3.title'),
                desc: t('landing.features.3.desc'),
                color: 'bg-violet-600'
              },
              {
                icon: <ShieldCheck className="w-8 h-8 text-emerald-600" />,
                title: t('landing.features.4.title'),
                desc: t('landing.features.4.desc'),
                color: 'bg-emerald-600'
              },
              {
                icon: <Layout className="w-8 h-8 text-amber-600" />,
                title: t('landing.features.5.title'),
                desc: t('landing.features.5.desc'),
                color: 'bg-amber-600'
              },
              {
                icon: <BarChart3 className="w-8 h-8 text-rose-600" />,
                title: t('landing.features.6.title'),
                desc: t('landing.features.6.desc'),
                color: 'bg-rose-600'
              }
            ].map((feature, i) => (
              <div key={i} className="group p-12 rounded-[3.5rem] bg-slate-50 border border-slate-100 hover:bg-white hover:border-white hover:shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)] transition-all duration-500 relative overflow-hidden">
                <div className={`absolute top-0 right-0 w-32 h-32 ${feature.color}/5 rounded-full -me-16 -mt-16 group-hover:scale-150 transition-transform duration-1000`} />
                <div className="mb-10 w-16 h-16 rounded-2xl bg-white shadow-xl shadow-slate-200/50 flex items-center justify-center relative z-10 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">{feature.icon}</div>
                <h4 className="text-2xl font-black text-slate-900 mb-6 relative z-10">{feature.title}</h4>
                <p className="text-slate-500 font-semibold leading-relaxed relative z-10 group-hover:text-slate-600">{feature.desc}</p>
                <div className="mt-8 pt-8 border-t border-slate-100 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 group-hover:text-indigo-600 transition-colors">
                  Détails <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing - Market Leader Standard */}
      <section id="pricing" className="py-32 px-4 bg-slate-50 relative border-y border-slate-100">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24 max-w-3xl mx-auto">
            <h2 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.4em] mb-6">{t('landing.pricing.badge')}</h2>
            <h3 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter leading-[0.95] mb-8">{t('landing.pricing.title')}</h3>
            <p className="text-slate-500 text-lg font-bold">Investissez dans la conformité et la croissance de votre entreprise avec des tarifs adaptés.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch pt-12">
            {[
              { 
                name: "Starter", 
                price: "49", 
                feat: [t('landing.pricing.starter.feat1'), t('landing.pricing.starter.feat2'), t('landing.pricing.starter.feat3')],
                desc: "Pour les micro-entreprises individuelles."
              },
              { 
                name: "Professional", 
                price: "99", 
                feat: [t('landing.pricing.pro.feat1'), t('landing.pricing.pro.feat2'), t('landing.pricing.pro.feat3'), t('landing.pricing.pro.feat4')], 
                popular: true,
                desc: "Parfait pour les PME en pleine croissance."
              },
              { 
                name: "Enterprise", 
                price: "199", 
                feat: [t('landing.pricing.enterprise.feat1'), t('landing.pricing.enterprise.feat2'), t('landing.pricing.enterprise.feat3'), t('landing.pricing.enterprise.feat4')],
                desc: "Solution robuste pour les grandes structures."
              },
            ].map((plan, i) => (
              <div key={i} className={`p-12 rounded-[4rem] flex flex-col transition-all duration-700 relative group ${plan.popular ? 'bg-indigo-600 text-white shadow-[0_40px_100px_-20px_rgba(79,70,229,0.4)] md:scale-105 z-10' : 'bg-white border border-slate-100 hover:shadow-2xl'}`}>
                {plan.popular && <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-8 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.3em] shadow-xl border-4 border-slate-50">{t('landing.pricing.popular')}</span>}
                
                <div className="mb-10">
                   <h4 className={`text-2xl font-black mb-2 ${plan.popular ? 'text-white' : 'text-slate-900'}`}>{plan.name}</h4>
                   <p className={`text-sm font-semibold opacity-60 ${plan.popular ? 'text-indigo-100' : 'text-slate-400'}`}>{plan.desc}</p>
                </div>

                <div className="flex items-baseline gap-2 mb-12">
                  <span className={`text-6xl font-black ${plan.popular ? 'text-white' : 'text-slate-900'}`}>{plan.price}</span>
                  <span className={`text-lg font-bold uppercase tracking-widest ${plan.popular ? 'text-indigo-200' : 'text-slate-400'}`}>{t('landing.pricing.currency')}</span>
                  <span className={`text-sm font-bold opacity-40 ${plan.popular ? 'text-indigo-100' : 'text-slate-400'}`}>/mois</span>
                </div>

                <ul className="space-y-6 mb-12 flex-1">
                  {plan.feat.map((f, j) => (
                    <li key={j} className="flex items-center gap-4">
                      <div className={`h-6 w-6 rounded-lg flex items-center justify-center shrink-0 ${plan.popular ? 'bg-white/20' : 'bg-indigo-50'}`}>
                        <CheckCircle2 className={`w-3.5 h-3.5 ${plan.popular ? 'text-white' : 'text-indigo-600'}`} />
                      </div>
                      <span className={`text-sm font-bold ${plan.popular ? 'text-indigo-50' : 'text-slate-600'}`}>{f}</span>
                    </li>
                  ))}
                </ul>

                <Link 
                  to="/register" 
                  className={`w-full py-5 rounded-[2rem] font-black flex items-center justify-center gap-3 transition-all duration-300 transform group-hover:scale-[1.02] active:scale-95 text-lg ${plan.popular ? 'bg-white text-indigo-600 shadow-xl' : 'bg-slate-900 text-white hover:bg-indigo-600 shadow-xl'}`}
                >
                  {t('landing.pricing.choose')}
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Modern Footer */}
      <footer className="py-24 border-t border-slate-100 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 relative z-10">
          <div className="space-y-8">
            <Link to="/" className="flex items-center gap-4 group">
              <div className="bg-slate-900 p-2.5 rounded-2xl group-hover:rotate-6 transition-all duration-300">
                <ShieldCheck className="w-8 h-8 text-white" />
              </div>
              <span className="text-3xl font-black tracking-tighter text-slate-900">El Fatoura</span>
            </Link>
            <p className="text-slate-500 font-semibold leading-relaxed max-w-xs">
               La plateforme SaaS leader pour la facturation électronique conforme en Tunisie.
            </p>
            <div className="flex gap-4">
              {[1,2,3,4].map(i => (
                <div key={i} className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all cursor-pointer">
                   <MessageSquare className="w-5 h-5" />
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="font-black text-slate-900 uppercase tracking-widest text-xs mb-8">Solution</h4>
            <ul className="space-y-4 text-slate-500 font-bold">
               <li><a href="#" className="hover:text-indigo-600 transition-colors">Fonctionnalités</a></li>
               <li><a href="#" className="hover:text-indigo-600 transition-colors">Conformité</a></li>
               <li><a href="#" className="hover:text-indigo-600 transition-colors">Tarifs</a></li>
               <li><a href="#" className="hover:text-indigo-600 transition-colors">Sécurité</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-black text-slate-900 uppercase tracking-widest text-xs mb-8">Support</h4>
            <ul className="space-y-4 text-slate-500 font-bold">
               <li><a href="#" className="hover:text-indigo-600 transition-colors">Documentation</a></li>
               <li><a href="#" className="hover:text-indigo-600 transition-colors">FAQ</a></li>
               <li><a href="#" className="hover:text-indigo-600 transition-colors">Contact</a></li>
               <li><a href="#" className="hover:text-indigo-600 transition-colors">État du service</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-black text-slate-900 uppercase tracking-widest text-xs mb-8">Légal</h4>
            <ul className="space-y-4 text-slate-500 font-bold">
               <li><Link to="/privacy" className="hover:text-indigo-600 transition-colors">{t('landing.footer.privacy')}</Link></li>
               <li><Link to="/terms" className="hover:text-indigo-600 transition-colors">{t('landing.footer.terms')}</Link></li>
               <li><Link to="/legal" className="hover:text-indigo-600 transition-colors">{t('landing.footer.legal')}</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 mt-24 pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-8">
           <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">© 2024 El Fatoura Tunis. Tous droits réservés.</p>
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

