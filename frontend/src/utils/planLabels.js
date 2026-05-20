export const PLAN_LABELS = {
  STARTER: 'Démarrage',
  PROFESSIONAL: 'Pro',
  ENTERPRISE: 'Max',
};

export const PLAN_OPTIONS = [
  {
    label: 'Démarrage',
    value: 'STARTER',
    description: 'Pour commencer avec les devis, factures et exports essentiels.',
    features: [
      'Factures et devis essentiels',
      'Export XML TEIF',
      'Tableau de bord simple',
      'Support standard',
    ],
  },
  {
    label: 'Pro',
    value: 'PROFESSIONAL',
    description: 'Pour les TPE/PME qui veulent plus de suivi, d’automatisation et d’IA.',
    features: [
      'Facturation avancée',
      'Assistant IA',
      'Rapports et suivi commercial',
      'Historique & traçabilité avancés',
    ],
  },
  {
    label: 'Max',
    value: 'ENTERPRISE',
    description: 'Pour les besoins avancés, accompagnement, équipe et configuration TTN/signature.',
    features: [
      'Accompagnement onboarding',
      'Support prioritaire',
      'Préparation intégration TTN/signature',
      'Besoins multi-utilisateurs / équipe',
    ],
  },
];

export const getPlanLabel = (plan) => PLAN_LABELS[plan] || PLAN_LABELS.STARTER;

export const normalizePlanValue = (plan) => {
  const value = String(plan || '').trim().toUpperCase();
  if (['PRO', 'PROFESSIONAL'].includes(value)) return 'PROFESSIONAL';
  if (['MAX', 'ENTERPRISE'].includes(value)) return 'ENTERPRISE';
  return 'STARTER';
};
