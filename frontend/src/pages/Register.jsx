import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, ArrowRight, Loader, User, Building2, MapPin, Phone, Mail, Lock } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import api from '../services/api';

const Register = () => {
  const { t } = useLanguage();
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
      return setError(t('error.nameRequired') || 'Prénom et Nom requis.');
    }
    if (!validatePhone(formData.phone)) {
      return setError(t('error.invalidPhone') || 'Format de téléphone invalide.');
    }
    if (!validateMF(formData.matriculeFiscal)) {
      return setError(t('error.invalidMF') || 'Format Matricule Fiscal invalide.');
    }
    if (formData.password !== formData.confirmPassword) {
      return setError(t('error.passwordMismatch') || 'Les mots de passe ne correspondent pas.');
    }
    if (formData.password.length < 6) {
      return setError(t('error.passwordShort') || 'Mot de passe trop court.');
    }
    if (!formData.termsAccepted) {
      return setError(t('error.termsRequired') || 'Veuillez accepter les conditions.');
    }

    setLoading(true);
    try {
      const { confirmPassword, termsAccepted, ...dataToSend } = formData;
      await register(dataToSend);
      setSuccess(t('auth.success') || 'Compte créé avec succès !');
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (err) {
      console.error('Registration failed', err);
      setError(err.response?.data?.message || 'Erreur serveur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full my-8">
        <div className="text-center mb-8">
          <Link to="/" className="flex justify-center mb-4 group">
            <div className="bg-blue-600 p-3 rounded-2xl shadow-xl shadow-blue-100 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-6 h-6 text-white md:w-8 md:h-8" />
            </div>
          </Link>
          <h2 className="text-3xl font-extrabold text-slate-900 mb-2">{t('auth.register')}</h2>
          <p className="text-slate-500 font-medium italic">{t('auth.registerSubtitle')}</p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl shadow-slate-200 border border-slate-100 overflow-hidden">
          <div className="p-8 md:p-12">
            {error && (
              <div className="bg-rose-50 border border-rose-100 text-rose-600 p-4 rounded-xl mb-8 text-sm flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
                {error}
              </div>
            )}
            {success && (
              <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 p-4 rounded-xl mb-8 text-sm flex items-center gap-3 font-semibold">
                <div className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce" />
                {success}
              </div>
            )}

            <form onSubmit={handleRegisterSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personnal Info */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">{t('auth.personalInfo')}</h3>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5 ml-1">{t('auth.firstName')} *</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        name="firstName"
                        required
                        value={formData.firstName}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
                        placeholder="Ahmed"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5 ml-1">{t('auth.lastName')} *</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        name="lastName"
                        required
                        value={formData.lastName}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
                        placeholder="Ben Salah"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5 ml-1">{t('auth.phone')} *</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        name="phone"
                        required
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
                        placeholder="+216 XX XXX XXX"
                      />
                    </div>
                  </div>
                </div>

                {/* Company Info */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">{t('auth.companyInfo')}</h3>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5 ml-1">{t('auth.name')} *</label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
                        placeholder="Ma Société"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5 ml-1">{t('auth.matricule')} *</label>
                    <input
                      type="text"
                      name="matriculeFiscal"
                      required
                      value={formData.matriculeFiscal}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
                      placeholder="1234567/X/A/M/000"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5 ml-1">{t('auth.rc')}</label>
                    <input
                      type="text"
                      name="registreCommerce"
                      value={formData.registreCommerce}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
                      placeholder="RC Tunis ..."
                    />
                  </div>
                </div>
              </div>

              <div className="w-full border-t border-slate-100 px-2" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Account Settings */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5 ml-1">{t('auth.address')} *</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        name="address"
                        required
                        value={formData.address}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
                        placeholder="Av. Habib Bourguiba, Tunis"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5 ml-1">{t('auth.email')} *</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
                        placeholder="contact@societe.com"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5 ml-1">{t('auth.password')} *</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="password"
                        name="password"
                        required
                        value={formData.password}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5 ml-1">{t('auth.confirmPassword')} *</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="password"
                        name="confirmPassword"
                        required
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm ${
                          formData.confirmPassword && formData.password !== formData.confirmPassword ? 'border-rose-400' : 'border-slate-200'
                        }`}
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Terms */}
              <div className="flex items-start gap-4 p-5 bg-slate-50 rounded-[1.5rem] border border-slate-100 hover:border-blue-100 transition-colors cursor-pointer group">
                <input
                  type="checkbox"
                  name="termsAccepted"
                  id="terms"
                  required
                  checked={formData.termsAccepted}
                  onChange={handleChange}
                  className="mt-1 w-5 h-5 text-blue-600 border-slate-300 rounded-lg focus:ring-blue-500 cursor-pointer transition-all"
                />
                <label htmlFor="terms" className="text-xs text-slate-600 leading-relaxed font-bold cursor-pointer group-hover:text-slate-900 transition-colors">
                  {t('auth.terms')}
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center py-4 px-6 rounded-2xl bg-blue-600 text-white font-bold hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all shadow-lg shadow-blue-200 disabled:bg-slate-300 mt-4 group"
              >
                {loading ? (
                  <Loader className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    {t('auth.submit')}
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 text-center text-sm font-medium">
              <span className="text-slate-500">{t('auth.haveAccount')} </span>
              <Link to="/login" className="text-blue-600 hover:text-blue-700 transition-colors underline decoration-blue-200 underline-offset-4 decoration-2">
                {t('auth.login')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
