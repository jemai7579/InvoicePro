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
    <div className="relative min-h-[500px] w-full flex items-center justify-center p-8 bg-slate-50/50 rounded-3xl overflow-hidden border border-slate-200/60 shadow-sm">
      {/* Background patterns */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-40">
        <div className="absolute -top-[10%] -right-[5%] w-[40%] h-[40%] bg-blue-100/50 blur-[120px] rounded-full" />
        <div className="absolute -bottom-[10%] -left-[5%] w-[40%] h-[40%] bg-indigo-100/50 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-2xl w-full bg-white/80 backdrop-blur-md border border-white p-10 rounded-2xl shadow-xl flex flex-col items-center text-center">
        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-inner border border-blue-100/50">
          {isAI ? <Sparkles size={32} /> : <BarChart3 size={32} />}
        </div>
        
        <h2 className="text-3xl font-extrabold text-slate-900 mb-4 tracking-tight">
          {title || (isAI ? "Assistant IA Premium" : "Rapports Avancés")}
        </h2>
        
        <p className="text-lg text-slate-600 mb-8 max-w-lg leading-relaxed">
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
        
        <div className="mt-8 flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-widest">
          <Lock size={12} />
          Accès Restreint • Forfait Démarrage
        </div>
      </div>
    </div>
  );
};

export default UpgradeOverlay;
