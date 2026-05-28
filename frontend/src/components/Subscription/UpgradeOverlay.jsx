import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Zap, 
  CheckCircle2, 
  Lock,
  ArrowRight,
  Sparkles,
  BarChart3
} from 'lucide-react';

const UpgradeOverlay = ({ title, description, featureType = 'ai' }) => {
  const navigate = useNavigate();

  const isAI = featureType === 'ai';
  
  const benefits = isAI ? [
    "Assistant intelligent disponible 24/7",
    "Aide à la conformité fiscale tunisienne",
    "Réponses précises sur le format XML/TEIF",
    "Support prioritaire"
  ] : [
    "Rapports détaillés sur vos revenus",
    "Analyse comparative mensuelle",
    "Exportation avancée des données",
    "Visualisation graphique interactive"
  ];

  return (
    <div className="relative flex min-h-[420px] w-full items-center justify-center overflow-hidden rounded-2xl border border-slate-200/60 bg-slate-50/50 p-3 shadow-sm sm:min-h-[500px] sm:rounded-3xl sm:p-8">
      {/* Background patterns */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-40">
        <div className="absolute -top-[10%] -right-[5%] w-[40%] h-[40%] bg-blue-100/50 blur-[120px] rounded-full" />
        <div className="absolute -bottom-[10%] -left-[5%] w-[40%] h-[40%] bg-indigo-100/50 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 flex w-full max-w-2xl flex-col items-center rounded-2xl border border-white bg-white/80 p-5 text-center shadow-xl backdrop-blur-md sm:p-10">
        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-inner border border-blue-100/50">
          {isAI ? <Sparkles size={32} /> : <BarChart3 size={32} />}
        </div>
        
        <h2 className="mb-4 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
          {title || (isAI ? "Assistant IA Premium" : "Rapports Avancés")}
        </h2>
        
        <p className="mb-7 max-w-lg text-sm leading-relaxed text-slate-600 sm:mb-8 sm:text-lg">
          {description || (isAI 
            ? "L'assistant intelligent est exclusivement disponible pour nos utilisateurs Pro et Max." 
            : "Accédez à des statistiques poussées et des analyses de performance avec l'offre Pro.")}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full mb-10 text-left">
          {benefits.map((benefit, idx) => (
            <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/50 border border-slate-100/50">
              <CheckCircle2 size={18} className="text-emerald-500 mt-0.5 shrink-0" />
              <span className="text-sm font-medium text-slate-700">{benefit}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full">
          <button
            onClick={() => navigate('/settings?tab=subscription')}
            className="flex-1 flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 shadow-lg shadow-slate-900/20 active:scale-95"
          >
            Passer à Pro
            <ArrowRight size={20} />
          </button>
          
          <button
            onClick={() => navigate('/dashboard')}
            className="flex-1 bg-white hover:bg-slate-50 text-slate-700 font-semibold py-4 px-8 rounded-xl border border-slate-200 transition-all duration-300"
          >
            Retour au Tableau de Bord
          </button>
        </div>
        
        <div className="mt-8 flex flex-wrap items-center justify-center gap-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider sm:text-xs sm:tracking-widest">
          <Lock size={12} />
          Accès Restreint • Forfait Démarrage
        </div>
      </div>
    </div>
  );
};

export default UpgradeOverlay;
