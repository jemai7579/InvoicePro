import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminAuthContext } from '../../context/AdminAuthContext';
import { Lock, Mail, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import BrandLogo from '../../components/BrandLogo';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { adminLogin } = useContext(AdminAuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await adminLogin(email, password);
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || "Accès refusé. Vérifiez vos identifiants.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden font-sans">
      
      {/* Background Orbs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-premium-900/20 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/4" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-slate-800/10 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/4" />

      <div className="w-full max-w-lg relative z-10">
        
        {/* Brand */}
        <div className="flex flex-col items-center mb-10">
          <BrandLogo tone="dark" className="mb-6 h-16 w-auto max-w-[280px]" />
          <h1 className="text-3xl font-black text-white tracking-tight">
            InvoicePro <span className="text-premium-500 italic">Admin</span>
          </h1>
          <p className="text-slate-500 font-medium mt-2 uppercase tracking-widest text-[10px]">Espace de contrôle global InvoicePro</p>
        </div>

        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 p-10 rounded-[32px] shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-start gap-3 animate-shake">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                <p className="text-xs font-bold text-red-500">{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ms-1">Adresse Email</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500 group-focus-within:text-premium-500 transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-900 border border-white/5 rounded-2xl py-4 ps-12 pe-4 text-white text-sm font-medium focus:ring-4 focus:ring-premium-500/20 focus:border-premium-500 outline-none transition-all placeholder:text-slate-600"
                  placeholder="admin@invoicepro.tn"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Mot de passe</label>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500 group-focus-within:text-premium-500 transition-colors" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-900 border border-white/5 rounded-2xl py-4 ps-12 pe-4 text-white text-sm font-medium focus:ring-4 focus:ring-premium-500/20 focus:border-premium-500 outline-none transition-all"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-premium-600 hover:bg-premium-500 disabled:bg-slate-800 text-white font-black py-4 rounded-2xl shadow-xl shadow-premium-600/30 flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-95 group"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Connexion au panel
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center mt-8 text-slate-600 text-xs font-medium">
          Accès strictement réservé au personnel autorisé. <br />
          Toute activité est enregistrée et auditée.
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;
