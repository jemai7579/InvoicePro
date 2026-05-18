import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Zap,
  ArrowUpRight,
  Info,
  CheckCircle2,
} from 'lucide-react';

const SubscriptionQuotaCard = ({ user }) => {
  const navigate = useNavigate();

  if (!user || !user.subscription) return null;

  const { plan, usedInvoicesThisMonth, monthlyInvoiceLimit, remainingInvoices } = user.subscription;
  const isStarter = plan === 'STARTER';
  const isUnlimited = !isStarter;

  const percentage = isUnlimited || !monthlyInvoiceLimit
    ? 0
    : (usedInvoicesThisMonth / monthlyInvoiceLimit) * 100;
  const isLowQuota = isStarter && remainingInvoices <= 2 && remainingInvoices > 0;
  const isExhausted = isStarter && remainingInvoices === 0;

  const getStatusColor = () => {
    if (isExhausted) return 'bg-rose-500';
    if (isLowQuota) return 'bg-amber-500';
    return 'bg-blue-600';
  };

  const getStatusText = () => {
    if (isUnlimited) return 'Facturation disponible';
    return 'Votre utilisation ce mois-ci';
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col h-full hover:shadow-md transition-shadow duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
          isStarter ? 'bg-slate-100 text-slate-600 border border-slate-200' : 'bg-blue-50 text-blue-600 border border-blue-100'
        }`}>
          <Zap size={12} fill="currentColor" />
          Plan {plan}
        </div>

        <button
          onClick={() => navigate('/settings?tab=subscription')}
          className="text-slate-400 hover:text-blue-600 transition-colors"
          title="Gérer l'abonnement"
        >
          <Info size={18} />
        </button>
      </div>

      <div className="mb-2">
        <div className="flex items-end justify-between mb-1.5">
          <span className="text-sm font-semibold text-slate-500 uppercase tracking-tight">
            {getStatusText()}
          </span>
          <span className="text-xs font-bold text-slate-400">
            {isUnlimited ? 'Illimité' : `${usedInvoicesThisMonth} / ${monthlyInvoiceLimit}`}
          </span>
        </div>

        {!isUnlimited ? (
          <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-700 ease-out ${getStatusColor()}`}
              style={{ width: `${Math.min(100, percentage)}%` }}
            />
          </div>
        ) : (
          <div className="h-3 w-full bg-emerald-50 rounded-full flex items-center px-1 overflow-hidden border border-emerald-100">
            <div className="h-1.5 w-full bg-emerald-400 rounded-full opacity-60 animate-pulse" />
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-col gap-3 flex-grow">
        {isStarter ? (
          <div className={`p-4 rounded-xl border ${
            isExhausted ? 'bg-rose-50 border-rose-100 text-rose-700' :
            isLowQuota ? 'bg-amber-50 border-amber-100 text-amber-700' :
            'bg-slate-50 border-slate-100 text-slate-600'
          }`}>
            <p className="text-sm font-medium leading-snug">
              {isExhausted
                ? "Vous avez utilisé toutes vos factures incluses ce mois-ci. Passez à l'offre Professional pour continuer sans limite."
                : `Vous pouvez encore créer ${remainingInvoices} facture(s) ce mois-ci.`}
            </p>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 size={16} className="text-emerald-500" />
              <span className="text-sm font-bold">Premium actif</span>
            </div>
            <p className="text-xs font-medium opacity-80 leading-relaxed">
              Vous profitez d'une facturation illimitée, des rapports avancés et de l'assistant IA.
            </p>
          </div>
        )}

        {isStarter && (
          <button
            onClick={() => navigate('/settings?tab=subscription')}
            className={`mt-auto w-full py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-300 ${
              isExhausted ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/20' :
              'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20'
            }`}
          >
            Découvrir l'offre Professional
            <ArrowUpRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
};

export default SubscriptionQuotaCard;
