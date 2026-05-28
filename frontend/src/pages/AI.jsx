import React from 'react';
import { Bot, Sparkles, MessageSquare, Zap, ShieldCheck, BrainCircuit, ChevronRight } from 'lucide-react';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import UpgradeOverlay from '../components/Subscription/UpgradeOverlay';

const AI = () => {
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
    <div className="mx-auto max-w-6xl pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Hero Section */}
      <div className="relative mb-6 overflow-hidden rounded-2xl bg-slate-900 p-5 shadow-2xl shadow-indigo-100 sm:mb-12 sm:rounded-[3rem] sm:p-8 md:p-16">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/4"></div>
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-emerald-500/5 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/4"></div>
        
        <div className="relative z-10 flex flex-col items-center gap-7 md:flex-row md:gap-12">
          <div className="flex-1 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full mb-6">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-300">Nouveau : Intelligence Artificielle</span>
            </div>
            <h1 className="mb-4 text-3xl font-black leading-[1.1] tracking-tight text-white font-display sm:mb-6 sm:text-4xl md:text-6xl">
              Pilotez votre entreprise avec <span className="text-indigo-400 italic">Intelligence</span>
            </h1>
            <p className="mb-7 max-w-xl text-base font-medium text-slate-400 sm:mb-10 sm:text-lg">
              L'assistant IA aide à préparer vos offres, devis, emails, descriptions de services, à comprendre les étapes TTN et à expliquer les erreurs ou rejets.
            </p>
            <div className="flex flex-wrap justify-center md:justify-start gap-4">
              <button 
                onClick={() => window.dispatchEvent(new CustomEvent('open-ai-assistant'))}
                className="flex w-full items-center justify-center gap-3 rounded-2xl bg-indigo-600 px-6 py-4 font-black text-white shadow-xl shadow-indigo-500/20 transition-all hover:bg-white hover:text-slate-900 active:scale-95 sm:w-auto sm:px-8"
              >
                Lancer l'Assistant
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="group relative h-52 w-52 flex-shrink-0 sm:h-64 sm:w-64 md:h-80 md:w-80">
            <div className="absolute inset-0 bg-indigo-500 rounded-full opacity-20 group-hover:opacity-30 blur-2xl transition-opacity animate-pulse"></div>
            <div className="relative w-full h-full bg-slate-800 rounded-[2.5rem] border border-white/10 flex items-center justify-center shadow-2xl transform group-hover:rotate-6 transition-transform duration-500">
               <Bot className="h-24 w-24 text-indigo-400 sm:h-32 sm:w-32" />
               <div className="absolute -top-4 -right-4 bg-emerald-500 p-4 rounded-2xl shadow-lg animate-bounce">
                  <Zap className="w-6 h-6 text-white" />
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-8">
        {features.map((f, i) => (
          <div key={i} className="group rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:border-indigo-100/50 hover:shadow-xl sm:rounded-[2.5rem] sm:p-8">
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
      <div className="mt-6 flex flex-col items-start justify-between gap-5 rounded-2xl border border-indigo-100/50 bg-gradient-to-br from-indigo-50 to-white p-5 sm:mt-12 sm:rounded-[3rem] sm:p-10 md:flex-row md:items-center md:gap-8">
        <div className="flex items-start gap-4 sm:items-center sm:gap-6">
          <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center flex-shrink-0">
            <div className="w-4 h-4 bg-emerald-500 rounded-full animate-ping"></div>
          </div>
          <div>
            <h4 className="text-xl font-black text-slate-900 font-display uppercase tracking-tight">Assistant Opérationnel</h4>
            <p className="text-sm text-slate-500 font-medium mt-1">
              L'assistant IA est actif et prêt à répondre à vos questions sur la facturation et la conformité TEIF.
            </p>
          </div>
        </div>
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('open-ai-assistant'))}
          className="flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-2xl bg-indigo-600 px-6 py-3 font-bold text-white transition-colors hover:bg-indigo-700 md:w-auto"
        >
          <Bot className="w-4 h-4" />
          Ouvrir l'Assistant
        </button>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:mt-8 sm:rounded-[2rem] sm:p-8">
        <h2 className="text-lg font-black text-slate-900 mb-4">Cadre d'utilisation et limites</h2>
        <p className="text-sm text-slate-600 font-medium leading-7">
          L’assistant IA accompagne les utilisateurs dans la compréhension et l’utilisation de la plateforme. Il aide à préparer des offres, devis, emails, descriptions de services, à comprendre les étapes TTN et à expliquer les erreurs ou rejets. Il ne remplace pas un expert-comptable, fiscaliste ou conseiller juridique. Toute action sensible, comme l’envoi TTN, la signature électronique, la modification d’un montant ou la validation finale d’un document, nécessite une confirmation explicite de l’utilisateur.
        </p>
        <p className="text-sm text-slate-600 font-medium leading-7 mt-4">
          Il peut expliquer les options de signature électronique de manière générale, mais il ne valide pas légalement un type de signature, ne garantit pas sa compatibilité TTN, ne remplace pas TTN, ANCE, TunTrust, E-Houwiya, Digigo ou un fournisseur officiel, ne signe pas automatiquement les documents et ne choisit pas le fournisseur sans confirmation utilisateur.
        </p>
      </div>

    </div>
  );
};

export default AI;
