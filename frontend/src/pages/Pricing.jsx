import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

const Pricing = () => {
  const plans = [
    { name: 'Starter', desc: 'Pour demarrer avec les clients, devis et factures essentielles.', features: ['Abonnement mensuel', 'Quota de factures inclus', 'Workflow TEIF/TTN en mode test'] },
    { name: 'Professional', desc: 'Pour les TPE/PME avec reporting, IA et volume facture plus important.', features: ['Facturation plus avancee', 'Assistant IA', 'Rapports et suivi commercial'] },
    { name: 'Enterprise', desc: 'Pour accompagnement, parametrage et besoins multi-equipes.', features: ['Accompagnement onboarding', 'Support prioritaire', 'Preparation integration TTN/signature'] },
  ];

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-12">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl font-black text-slate-900">Tarifs & accompagnement</h1>
          <p className="mt-4 text-slate-500 font-semibold">
            La tarification peut combiner abonnement mensuel, options pay-as-you-go pour factures/TTN/signature, et accompagnement d'adhesion ou de parametrage.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card key={plan.name} title={plan.name} subtitle={plan.desc}>
              <ul className="space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-sm font-semibold text-slate-600">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    {feature}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <Link to="/demo"><Button>Demander une démo</Button></Link>
          <Link to="/contact"><Button variant="secondary">Parler à un conseiller</Button></Link>
          <Link to="/register"><Button variant="secondary">Commencer</Button></Link>
        </div>
      </div>
    </div>
  );
};

export default Pricing;

