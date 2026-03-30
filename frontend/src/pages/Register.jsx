import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, ArrowRight, Loader, User, Building2, MapPin, Phone, Mail, Lock, CheckCircle2, ChevronRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const Register = () => {
  const { t, lang } = useLanguage();
  const isRtl = lang === 'ar';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    matriculeFiscal: '',
    registreCommerce: '',
    address: '',
    phone: '',
    termsAccepted: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ 
      ...formData, 
      [name]: type === 'checkbox' ? checked : value 
    });
  };

  const validateMF = (mf) => /^\d{7,8}\/[A-Z]\/[A-Z]\/[A-Z]\/\d{3}$/.test(mf);
  const validatePhone = (p) => /^(\+216)?\s?\d{8}$/.test(p);

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!formData.firstName || !formData.lastName) {
      return setError(t('error.nameRequired'));
    }
    if (!validatePhone(formData.phone)) {
      return setError(t('error.invalidPhone'));
    }
    if (!validateMF(formData.matriculeFiscal)) {
      return setError(t('error.invalidMF'));
    }
    if (formData.password !== formData.confirmPassword) {
      return setError(t('error.passwordMismatch'));
    }
    if (formData.password.length < 6) {
      return setError(t('error.passwordShort'));
    }
    if (!formData.termsAccepted) {
      return setError(t('error.termsRequired'));
    }

    setLoading(true);
    try {
      const { confirmPassword, termsAccepted, ...dataToSend } = formData;
      await register(dataToSend);
      setSuccess(t('auth.success'));
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (err) {
      console.error('Registration failed', err);
      setError(err.response?.data?.message || 'Erreur lors de la création du compte');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen bg-white flex flex-col lg:flex-row ${isRtl ? 'lg:flex-row-reverse' : ''} font-sans`} dir={isRtl ? 'rtl' : 'ltr'}>
      
      {/* Left Side: Illustration / Brand Content (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-5/12 bg-slate-900 relative overflow-hidden items-center justify-center p-12">
        <div className="absolute top-0 right-0 w-full h-full opacity-20 pointer-events-none">
          <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-600 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600 rounded-full blur-[120px]" />
        </div>
        
        <div className="relative z-10 max-w-md text-white">
          <Link to="/" className="inline-flex items-center gap-3 mb-10 group">
            <div className="bg-indigo-600 p-3 rounded-2xl shadow-xl shadow-indigo-900/20 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
            <span className="text-3xl font-black tracking-tight">El Fatoura</span>
          </Link>
          
          <h2 className="text-4xl font-black leading-tight mb-8">
            {t('auth.registerPromo.title')}
          </h2>
          
          <div className="space-y-6 mb-12">
            {[
              t('auth.registerPromo.feat1'),
              t('auth.registerPromo.feat2'),
              t('auth.registerPromo.feat3'),
              t('auth.registerPromo.feat4')
            ].map((feat, i) => (
              <div key={i} className="flex items-center gap-4 group">
                <div className="h-8 w-8 rounded-lg bg-indigo-600/20 flex items-center justify-center group-hover:bg-indigo-600 transition-colors">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400 group-hover:text-white" />
                </div>
                <p className="font-semibold text-slate-400 group-hover:text-white transition-colors">{feat}</p>
              </div>
            ))}
          </div>

          <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md">
            <div className={`flex ${isRtl ? '-space-x-reverse space-x-3' : '-space-x-3'} mb-4`}>
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-10 w-10 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center text-[10px] font-bold">
                  {i === 4 ? '+500' : 'U'}
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-[0.2em]">
              {t('auth.registerPromo.trust')}
            </p>
          </div>
        </div>
      </div>

      {/* Right Side: Register Form */}
      <div className="w-full lg:w-7/12 bg-slate-50/50 flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-start p-5 sm:p-8 py-8">
        <div className="w-full max-w-lg space-y-5 animate-in slide-in-from-bottom-4 duration-700">

          
          <div className="lg:hidden text-center mb-6">
            <Link to="/" className="inline-flex items-center gap-3 mb-4">
              <div className="bg-indigo-600 p-2.5 rounded-xl">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-black text-slate-900 tracking-tight">El Fatoura</span>
            </Link>
          </div>

          <div className="text-start">
            <h1 className="text-3xl font-black text-slate-900 mb-2">
              {t('auth.register')}
            </h1>
            <p className="text-slate-500 font-medium">
              {t('auth.registerSubtitle')}
            </p>
          </div>

          <div className="bg-white p-6 sm:p-10 rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/40">
            {error && (
              <div className="mb-8 p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 text-sm font-semibold flex items-center gap-3 animate-in fade-in zoom-in-95 duration-200">
                <div className="h-2 w-2 rounded-full bg-rose-600 animate-pulse shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleRegisterSubmit} className="space-y-6">
              {/* Step 1: Personal Info */}
              <div className="space-y-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-6 w-6 rounded-lg bg-indigo-50 flex items-center justify-center text-[10px] font-black text-indigo-600 border border-indigo-100">01</div>
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">{t('auth.personalInfo')}</h3>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700 mx-1">{t('auth.firstName')} *</label>
                    <div className="relative group">
                      <User className={`absolute ${isRtl ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors`} />
                      <input
                        type="text"
                        name="firstName"
                        required
                        value={formData.firstName}
                        onChange={handleChange}
                        className={`w-full ${isRtl ? 'pr-11 pl-4' : 'pl-11 pr-4'} py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all`}
                        placeholder={t('auth.placeholder.firstName')}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700 mx-1">{t('auth.lastName')} *</label>
                    <div className="relative group">
                      <User className={`absolute ${isRtl ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors`} />
                      <input
                        type="text"
                        name="lastName"
                        required
                        value={formData.lastName}
                        onChange={handleChange}
                        className={`w-full ${isRtl ? 'pr-11 pl-4' : 'pl-11 pr-4'} py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all`}
                        placeholder={t('auth.placeholder.lastName')}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700 mx-1">{t('auth.phone')} *</label>
                    <div className="relative group">
                      <Phone className={`absolute ${isRtl ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors`} />
                      <input
                        type="text"
                        name="phone"
                        required
                        value={formData.phone}
                        onChange={handleChange}
                        className={`w-full ${isRtl ? 'pr-11 pl-4' : 'pl-11 pr-4'} py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all`}
                        placeholder={t('auth.placeholder.phone')}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700 mx-1">{t('auth.email')} *</label>
                    <div className="relative group">
                      <Mail className={`absolute ${isRtl ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors`} />
                      <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className={`w-full ${isRtl ? 'pr-11 pl-4' : 'pl-11 pr-4'} py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all`}
                        placeholder={t('auth.placeholder.email')}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 2: Company Info */}
              <div className="space-y-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-6 w-6 rounded-lg bg-indigo-50 flex items-center justify-center text-[10px] font-black text-indigo-600 border border-indigo-100">02</div>
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">{t('auth.companyInfo')}</h3>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 mx-1">{t('auth.name')} *</label>
                  <div className="relative group">
                    <Building2 className={`absolute ${isRtl ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors`} />
                    <input
                      type="text"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      className={`w-full ${isRtl ? 'pr-11 pl-4' : 'pl-11 pr-4'} py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all`}
                      placeholder={t('auth.placeholder.companyName')}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700 mx-1">{t('auth.matricule')} *</label>
                    <input
                      type="text"
                      name="matriculeFiscal"
                      required
                      value={formData.matriculeFiscal}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                      placeholder={t('auth.placeholder.matriculeFiscal')}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700 mx-1">{t('auth.rc')}</label>
                    <input
                      type="text"
                      name="registreCommerce"
                      value={formData.registreCommerce}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                      placeholder={t('auth.placeholder.registreCommerce')}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 mx-1">{t('auth.address')} *</label>
                  <div className="relative group">
                    <MapPin className={`absolute ${isRtl ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors`} />
                    <input
                      type="text"
                      name="address"
                      required
                      value={formData.address}
                      onChange={handleChange}
                      className={`w-full ${isRtl ? 'pr-11 pl-4' : 'pl-11 pr-4'} py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all`}
                      placeholder={t('auth.placeholder.address')}
                    />
                  </div>
                </div>
              </div>

              {/* Step 3: Security */}
              <div className="space-y-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-6 w-6 rounded-lg bg-indigo-50 flex items-center justify-center text-[10px] font-black text-indigo-600 border border-indigo-100">03</div>
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">{t('settings.tabs.security')}</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700 mx-1">{t('auth.password')} *</label>
                    <div className="relative group">
                      <Lock className={`absolute ${isRtl ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors`} />
                      <input
                        type="password"
                        name="password"
                        required
                        value={formData.password}
                        onChange={handleChange}
                        className={`w-full ${isRtl ? 'pr-11 pl-4' : 'pl-11 pr-4'} py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all`}
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700 mx-1">{t('auth.confirmPassword')} *</label>
                    <div className="relative group">
                      <Lock className={`absolute ${isRtl ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors`} />
                      <input
                        type="password"
                        name="confirmPassword"
                        required
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className={`w-full ${isRtl ? 'pr-11 pl-4' : 'pl-11 pr-4'} py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all`}
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-start gap-4 cursor-pointer group">
                  <input
                    type="checkbox"
                    name="termsAccepted"
                    checked={formData.termsAccepted}
                    onChange={handleChange}
                    className="mt-1 w-5 h-5 rounded-lg border-slate-300 text-indigo-600 focus:ring-indigo-500 transition-all cursor-pointer"
                  />
                  <span className="text-sm font-medium text-slate-500 group-hover:text-slate-700 transition-colors leading-relaxed">
                    {t('auth.terms')}
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center py-4 px-6 rounded-2xl bg-indigo-600 text-white font-black hover:bg-slate-900 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] group"
              >
                {loading ? (
                  <Loader className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <span>{t('auth.submit')}</span>
                    <ArrowRight className={`w-5 h-5 ${isRtl ? 'me-3 rotate-180' : 'ms-3'} group-hover:translate-x-1 transition-transform`} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-10 pt-8 border-t border-slate-100 text-center">
              <span className="text-slate-500 font-semibold">{t('auth.haveAccount')} </span>
              <Link to="/login" className="text-indigo-600 font-black hover:text-indigo-700 transition-colors underline underline-offset-4 decoration-2 decoration-indigo-100 hover:decoration-indigo-500">
                {t('auth.login')}
              </Link>
            </div>
          </div>
          
          <p className="text-center text-xs text-slate-400 font-medium">
            © 2024 El Fatoura. {t('landing.footer.madeIn')}
          </p>
        </div>
        </div>
      </div>
    </div>
  );
};

export default Register;

