import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, ArrowRight, Loader } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import api from '../services/api';

const Login = () => {
  const { t } = useLanguage();
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
      setError(err.response?.data?.message || t('error.invalidCredentials') || 'Email ou mot de passe incorrect');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link to="/" className="flex justify-center mb-4 group">
            <div className="bg-blue-600 p-3 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
          </Link>
          <h2 className="text-3xl font-extrabold text-gray-900 mb-2">{t('auth.welcomeBack') || 'Bon retour !'}</h2>
          <p className="text-gray-600 font-medium">{t('auth.loginSubtitle') || 'Connectez-vous à El Fatoura'}</p>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          <div className="p-8">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-sm text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">{t('auth.email')}</label>
                <input
                  type="email"
                  name="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
                  placeholder="vous@entreprise.com"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">{t('auth.password')}</label>
                <input
                  type="password"
                  name="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center py-2.5 px-4 rounded-lg bg-gray-900 text-white font-medium hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-all shadow-md disabled:bg-gray-400 mt-6"
              >
                {loading ? (
                  <Loader className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    {t('auth.login')}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center text-sm">
              <span className="text-gray-500">{t('auth.noAccount') || 'Pas encore de compte ?'} </span>
              <Link to="/register" className="text-blue-600 font-semibold hover:text-blue-500 transition-colors">
                {t('auth.register')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
