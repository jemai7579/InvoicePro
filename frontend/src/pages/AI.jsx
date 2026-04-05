import React from 'react';
import { Bot, Sparkles, MessageSquare, Zap, ShieldCheck, BrainCircuit, ChevronRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import UpgradeOverlay from '../components/Subscription/UpgradeOverlay';

const AI = () => {
  const { t } = useLanguage();
  const { user } = useContext(AuthContext);

  if (user?.subscription?.plan === 'STARTER') {
    return <UpgradeOverlay featureType="ai" />;
  }

  const features = [
    {
      icon: ShieldCheck,
      title: "Conformité TEIF",
      desc: "Analyse en temps réel de vos fichiers XML UBL pour garantir une validation à 100% par la TTN.",
      color: "text-emerald-500",
      bg: "bg-emerald-50"
    },
    {
      icon: BrainCircuit,
      title: "Intelligence Contextuelle",
      desc: "L'assistant comprend votre historique de facturation pour vous proposer des optimisations fiscales.",
      color: "text-indigo-500",
      bg: "bg-indigo-50"
    },
    {
      icon: MessageSquare,
      title: "Support Instantané",
      desc: "Une question sur la plateforme ? Notre IA a lu toute la documentation pour vous répondre.",
      color: "text-amber-500",
      bg: "bg-amber-50"
    }
  ];

  return (
    <div className="max-w-6xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Hero Section */}
      <div className="relative bg-slate-900 rounded-[3rem] p-8 md:p-16 overflow-hidden mb-12 shadow-2xl shadow-indigo-100">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/4"></div>
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-emerald-500/5 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/4"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full mb-6">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-300">Nouveau : Intelligence Artificielle</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-white mb-6 font-display tracking-tight leading-[1.1]">
              Pilotez votre entreprise avec <span className="text-indigo-400 italic">Intelligence</span>
            </h1>
            <p className="text-lg text-slate-400 font-medium mb-10 max-w-xl">
              El Fatoora AI automatise les tâches complexes, vérifie la conformité de vos factures et répond à toutes vos questions en quelques secondes.
            </p>
            <div className="flex flex-wrap justify-center md:justify-start gap-4">
              <button 
                onClick={() => window.dispatchEvent(new CustomEvent('open-ai-assistant'))}
                className="px-8 py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-white hover:text-slate-900 transition-all shadow-xl shadow-indigo-500/20 flex items-center gap-3 active:scale-95"
              >
                Lancer l'Assistant
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="flex-shrink-0 w-64 h-64 md:w-80 md:h-80 relative group">
            <div className="absolute inset-0 bg-indigo-500 rounded-full opacity-20 group-hover:opacity-30 blur-2xl transition-opacity animate-pulse"></div>
            <div className="relative w-full h-full bg-slate-800 rounded-[2.5rem] border border-white/10 flex items-center justify-center shadow-2xl transform group-hover:rotate-6 transition-transform duration-500">
               <Bot className="w-32 h-32 text-indigo-400" />
               <div className="absolute -top-4 -right-4 bg-emerald-500 p-4 rounded-2xl shadow-lg animate-bounce">
                  <Zap className="w-6 h-6 text-white" />
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {features.map((f, i) => (
          <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:border-indigo-100/50 transition-all group">
            <div className={`w-14 h-14 rounded-2xl ${f.bg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
              <f.icon className={`w-7 h-7 ${f.color}`} />
            </div>
            <h3 className="text-lg font-black text-slate-900 mb-3 font-display">{f.title}</h3>
            <p className="text-sm text-slate-500 font-medium leading-relaxed">
              {f.desc}
            </p>
          </div>
        ))}
      </div>

      {/* Status Card */}
      <div className="mt-12 p-10 bg-gradient-to-br from-indigo-50 to-white rounded-[3rem] border border-indigo-100/50 flex flex-col md:flex-row items-center gap-8 justify-between">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center flex-shrink-0">
             <div className="w-4 h-4 bg-emerald-500 rounded-full animate-ping"></div>
          </div>
          <div>
            <h4 className="text-xl font-black text-slate-900 font-display uppercase tracking-tight">Déploiement Progressif</h4>
            <p className="text-sm text-slate-500 font-medium mt-1 italic">
              "L'assistant flottant est opérationnel. Le dashboard IA complet arrive bientôt."
            </p>
          </div>
        </div>
        <div className="flex -space-x-3">
          {[1,2,3,4].map(i => (
            <div key={i} className="w-12 h-12 rounded-full border-4 border-white bg-slate-200 overflow-hidden shadow-sm">
               <img src={`https://i.pravatar.cc/150?u=${i+10}`} alt="User" />
            </div>
          ))}
          <div className="w-12 h-12 rounded-full border-4 border-white bg-indigo-600 flex items-center justify-center text-[10px] font-black text-white shadow-sm">+250</div>
        </div>
      </div>

    </div>
  );
};

export default AI;
