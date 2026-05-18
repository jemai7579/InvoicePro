import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Loader, Lock, Mail, ShieldCheck } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const testimonialByLang = {
  fr: {
    quote: 'Une plateforme claire pour preparer, envoyer et suivre nos factures electroniques en toute confiance.',
    author: 'Entreprise tunisienne',
    role: 'Utilisateur El Fatoura',
  },
  en: {
    quote: 'A clear platform to prepare, send and track our electronic invoices with confidence.',
    author: 'Tunisian company',
    role: 'El Fatoura user',
  },
  ar: {
    quote: 'منصة واضحة تساعدنا على اعداد الفواتير الالكترونية وارسالها ومتابعتها بثقة.',
    author: 'شركة تونسية',
    role: 'مستخدم El Fatoura',
  },
};

const Login = () => {
  const { t, lang } = useLanguage();
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const isRtl = lang === 'ar';
  const testimonial = testimonialByLang[lang] || testimonialByLang.fr;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      console.error('Failed to login', err);
      setError(err.response?.data?.message || t('error.invalidCredentials'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen overflow-hidden bg-white font-sans ${isRtl ? 'flex-row-reverse' : 'flex-row'} flex`} dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="relative hidden items-center justify-center overflow-hidden bg-slate-900 p-12 lg:flex lg:w-1/2">
        <div className="pointer-events-none absolute inset-0 opacity-20">
          <div className="absolute right-[-10%] top-[-10%] h-[500px] w-[500px] rounded-full bg-indigo-600 blur-[120px]" />
          <div className="absolute bottom-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-blue-600 blur-[120px]" />
        </div>

        <div className="relative z-10 max-w-md text-white">
          <Link to="/" className="group mb-12 inline-flex items-center gap-3">
            <div className="rounded-2xl bg-indigo-600 p-3 shadow-xl shadow-indigo-900/20 transition-transform group-hover:scale-110">
              <ShieldCheck className="h-8 w-8 text-white" />
            </div>
            <span className="text-3xl font-black tracking-tight">El Fatoura</span>
          </Link>

          <h2 className="mb-8 text-4xl font-black leading-tight">{t('landing.hero.title')}</h2>

          <div className="space-y-6">
            {[t('landing.features.2.title'), t('landing.features.4.title'), t('landing.features.6.title')].map((feature, index) => (
              <div key={index} className="group flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 transition-colors group-hover:bg-indigo-600">
                  <CheckCircle2 className="h-5 w-5 text-indigo-400 group-hover:text-white" />
                </div>
                <p className="font-semibold text-slate-300 transition-colors group-hover:text-white">{feature}</p>
              </div>
            ))}
          </div>

          <div className="mt-20 rounded-[2.5rem] border border-white/10 bg-indigo-600/10 p-8 backdrop-blur-md">
            <p className="mb-4 text-lg italic text-indigo-200">{testimonial.quote}</p>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full border border-indigo-500/30 bg-slate-800" />
              <div>
                <p className="text-sm font-bold">{testimonial.author}</p>
                <p className="text-xs font-medium uppercase tracking-wide text-indigo-400">{testimonial.role}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex w-full items-center justify-center bg-slate-50/50 p-6 sm:p-12 lg:w-1/2">
        <div className="w-full max-w-md space-y-8 animate-in slide-in-from-bottom-4 duration-700">
          <div className="mb-8 text-center lg:hidden">
            <Link to="/" className="mb-4 inline-flex items-center gap-3">
              <div className="rounded-xl bg-indigo-600 p-2.5 shadow-lg">
                <ShieldCheck className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-black tracking-tight text-slate-900">El Fatoura</span>
            </Link>
          </div>

          <div className="text-start">
            <h1 className="mb-2 text-3xl font-black text-slate-900">{t('auth.welcomeBack')}</h1>
            <p className="font-medium text-slate-500">{t('auth.loginSubtitle')}</p>
          </div>

          <div className="rounded-[2.5rem] border border-slate-200 bg-white p-8 shadow-2xl shadow-slate-200/50 sm:p-10">
            {error ? (
              <div className="mb-6 flex items-center gap-3 rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm font-semibold text-rose-600 animate-in fade-in zoom-in-95 duration-200">
                <div className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-rose-600" />
                {error}
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="mb-2 ms-1 block text-sm font-bold text-slate-700">{t('auth.email')}</label>
                <div className="group relative">
                  <Mail className={`absolute top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-indigo-600 ${isRtl ? 'right-4' : 'left-4'}`} />
                  <input
                    type="email"
                    name="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className={`w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 text-sm font-medium outline-none transition-all placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 ${isRtl ? 'pr-12 pl-4' : 'pl-12 pr-4'}`}
                    placeholder="name@company.tn"
                  />
                </div>
              </div>

              <div>
                <div className="mb-2 ms-1 flex items-center justify-between">
                  <label className="block text-sm font-bold text-slate-700">{t('auth.password')}</label>
                </div>
                <div className="group relative">
                  <Lock className={`absolute top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-indigo-600 ${isRtl ? 'right-4' : 'left-4'}`} />
                  <input
                    type="password"
                    name="password"
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className={`w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 text-sm font-medium outline-none transition-all placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 ${isRtl ? 'pr-12 pl-4' : 'pl-12 pr-4'}`}
                    placeholder="********"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between px-1">
                <label className="group flex cursor-pointer items-center gap-2">
                  <input type="checkbox" className="h-4 w-4 cursor-pointer rounded border-slate-300 text-indigo-600 transition-all focus:ring-indigo-500" />
                  <span className="text-xs font-semibold text-slate-500 transition-colors group-hover:text-slate-700">{t('auth.rememberMe')}</span>
                </label>
                <span className="text-xs font-bold text-slate-300 cursor-not-allowed select-none" title="Bientôt disponible">
                  {t('auth.forgotPassword')}
                </span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="group mt-4 flex w-full items-center justify-center rounded-2xl bg-indigo-600 px-6 py-4 font-black text-white shadow-xl shadow-indigo-100 transition-all hover:bg-slate-900 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <Loader className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <span>{t('auth.login')}</span>
                    <ArrowRight className={`h-5 w-5 transition-transform group-hover:translate-x-1 ${isRtl ? 'me-2 rotate-180' : 'ms-2'}`} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-10 border-t border-slate-100 pt-8 text-center">
              <span className="font-semibold text-slate-500">{t('auth.noAccount')} </span>
              <Link to="/register" className="font-black text-indigo-600 underline decoration-2 decoration-indigo-100 underline-offset-4 transition-colors hover:text-indigo-700 hover:decoration-indigo-500">
                {t('auth.register')}
              </Link>
            </div>
          </div>

          <p className="text-center text-xs font-medium text-slate-400">© 2024 El Fatoura. {t('landing.footer.madeIn')}</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
