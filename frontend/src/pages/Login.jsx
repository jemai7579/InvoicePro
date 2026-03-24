import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, ArrowRight, Loader, Mail, Lock, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const Login = () => {
  const { t, lang } = useLanguage();
  const isRtl = lang === 'ar';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
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
    <div className={`min-h-screen bg-white flex ${isRtl ? 'flex-row-reverse' : 'flex-row'} overflow-hidden font-sans`} dir={isRtl ? 'rtl' : 'ltr'}>
      
      {/* Left Side: Illustration / Brand Content (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 relative overflow-hidden items-center justify-center p-12">
        <div className="absolute top-0 right-0 w-full h-full opacity-20 pointer-events-none">
          <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-600 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600 rounded-full blur-[120px]" />
        </div>
        
        <div className="relative z-10 max-w-md text-white">
          <Link to="/" className="inline-flex items-center gap-3 mb-12 group">
            <div className="bg-indigo-600 p-3 rounded-2xl shadow-xl shadow-indigo-900/20 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
            <span className="text-3xl font-black tracking-tight">El Fatoura</span>
          </Link>
          
          <h2 className="text-4xl font-black leading-tight mb-8">
            {t('landing.hero.title')}
          </h2>
          
          <div className="space-y-6">
            {[
              t('landing.features.2.title'),
              t('landing.features.4.title'),
              t('landing.features.6.title')
            ].map((feat, i) => (
              <div key={i} className="flex items-center gap-4 group">
                <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center group-hover:bg-indigo-600 transition-colors">
                  <CheckCircle2 className="w-5 h-5 text-indigo-400 group-hover:text-white" />
                </div>
                <p className="font-semibold text-slate-300 group-hover:text-white transition-colors">{feat}</p>
              </div>
            ))}
          </div>
          
          <div className="mt-20 p-8 rounded-[2.5rem] bg-indigo-600/10 border border-white/10 backdrop-blur-md">
            <p className="italic text-indigo-200 text-lg mb-4">
              {t('auth.testimonial.quote')}
            </p>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-slate-800 border border-indigo-500/30" />
              <div>
                <p className="font-bold text-sm">{t('auth.testimonial.author')}</p>
                <p className="text-xs text-indigo-400 font-medium tracking-wide uppercase">{t('auth.testimonial.role')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-slate-50/50">
        <div className="w-full max-w-md space-y-8 animate-in slide-in-from-bottom-4 duration-700">
          
          {/* Mobile Header (Hidden on Laptop) */}
          <div className="lg:hidden text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-3 mb-4">
              <div className="bg-indigo-600 p-2.5 rounded-xl shadow-lg">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-black text-slate-900 tracking-tight">El Fatoura</span>
            </Link>
          </div>

          <div className="text-start">
            <h1 className="text-3xl font-black text-slate-900 mb-2">
              {t('auth.welcomeBack')}
            </h1>
            <p className="text-slate-500 font-medium">
              {t('auth.loginSubtitle')}
            </p>
          </div>

          <div className="bg-white p-8 sm:p-10 rounded-[2.5rem] border border-slate-200 shadow-2xl shadow-slate-200/50">
            {error && (
              <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 text-sm font-semibold flex items-center gap-3 animate-in fade-in zoom-in-95 duration-200">
                <div className="h-2 w-2 rounded-full bg-rose-600 animate-pulse shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 ms-1">
                  {t('auth.email')}
                </label>
                <div className="relative group">
                  <Mail className={`absolute ${isRtl ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors`} />
                  <input
                    type="email"
                    name="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full ${isRtl ? 'pr-12 pl-4' : 'pl-12 pr-4'} py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400`}
                    placeholder="name@company.tn"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2 ms-1">
                  <label className="block text-sm font-bold text-slate-700">
                    {t('auth.password')}
                  </label>
                </div>
                <div className="relative group">
                  <Lock className={`absolute ${isRtl ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors`} />
                  <input
                    type="password"
                    name="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full ${isRtl ? 'pr-12 pl-4' : 'pl-12 pr-4'} py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400`}
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between px-1">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 transition-all cursor-pointer" />
                  <span className="text-xs font-semibold text-slate-500 group-hover:text-slate-700 transition-colors">{t('auth.rememberMe')}</span>
                </label>
                <Link to="/forgot-password" disabled className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors hover:underline underline-offset-4">
                  {t('auth.forgotPassword')}
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center py-4 px-6 rounded-2xl bg-indigo-600 text-white font-black hover:bg-slate-900 transition-all shadow-xl shadow-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] group mt-4"
              >
                {loading ? (
                  <Loader className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <span>{t('auth.login')}</span>
                    <ArrowRight className={`w-5 h-5 ${isRtl ? 'me-2 rotate-180' : 'ms-2'} group-hover:translate-x-1 transition-transform`} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-10 pt-8 border-t border-slate-100 text-center">
              <span className="text-slate-500 font-semibold">{t('auth.noAccount')} </span>
              <Link to="/register" className="text-indigo-600 font-black hover:text-indigo-700 transition-colors underline underline-offset-4 decoration-2 decoration-indigo-100 hover:decoration-indigo-500">
                {t('auth.register')}
              </Link>
            </div>
          </div>
          
          <p className="text-center text-xs text-slate-400 font-medium">
            © 2024 El Fatoura. {t('landing.footer.madeIn')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;

