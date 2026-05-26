import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, ClipboardCheck, CreditCard, FileText, Lightbulb, Loader, Receipt, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Projects from './Projects';
import Offers from './Offers';
import Devis from './Devis';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import api from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import opportunityWorkflow from '../assets/workflows/opportunity-workflow.png';

const tabs = [
  { id: 'ideas', label: 'Idées de projet', icon: Lightbulb, component: Projects },
  { id: 'offers', label: 'Offres & bons de commande', icon: ClipboardCheck, component: Offers },
  { id: 'quotes', label: 'Devis', icon: FileText, component: Devis },
];

const emptySummary = {
  ideasCount: 0,
  sharedIdeasCount: 0,
  offersCount: 0,
  devisCount: 0,
  invoicesCount: 0,
  paidInvoicesCount: 0,
  progressScore: 0,
  recommendedAction: null,
  alerts: [],
};

const copyByLang = {
  fr: {
    title: 'Opportunités',
    subtitle: 'Pilotez vos idées, offres et devis depuis un pipeline unique.',
    workflow: 'Voir le workflow',
    assistant: 'Assistant Opportunité',
    createIdea: 'Créer une idée',
    seeIdeas: 'Voir les idées',
    assistantEmpty: 'Votre pipeline commercial est vide. Commencez par créer une idée de projet.',
    scoreTitle: 'Score de progression commerciale',
    scoreSubtitle: 'Idée → Offre → Devis → Facture → Paiement',
    progressLabel: 'Progression commerciale',
    progressGood: 'Votre pipeline avance bien. Continuez en transformant vos devis en factures.',
    progressMedium: 'Continuez en transformant vos idées en offres ou en devis.',
    progressEmpty: 'Commencez par créer une idée pour lancer votre pipeline commercial.',
    pipelineTitle: 'Mini pipeline visuel',
    pipelineSteps: {
      ideas: 'Idées',
      offers: 'Offres',
      quotes: 'Devis',
      invoices: 'Factures',
      payments: 'Paiements',
    },
    alertsTitle: 'Alertes & prochaines actions',
    noAlerts: 'Tout est à jour. Aucune action urgente pour le moment.',
    workflowTitle: 'Workflow des opportunités',
    workflowSubtitle: 'Idée de projet → Offre / Demande → Devis → Facture → Paiement',
    tabs,
  },
  en: {
    title: 'Opportunities',
    subtitle: 'Manage ideas, offers and quotes from one pipeline.',
    workflow: 'View workflow',
    assistant: 'Opportunity Assistant',
    createIdea: 'Create idea',
    seeIdeas: 'View ideas',
    assistantEmpty: 'Your business pipeline is empty. Start by creating a project idea.',
    scoreTitle: 'Business progress score',
    scoreSubtitle: 'Idea → Offer → Quote → Invoice → Payment',
    progressLabel: 'Business progress',
    progressGood: 'Your pipeline is moving well. Keep converting quotes into invoices.',
    progressMedium: 'Keep turning ideas into offers or quotes.',
    progressEmpty: 'Create an idea to start your business pipeline.',
    pipelineTitle: 'Mini visual pipeline',
    pipelineSteps: {
      ideas: 'Ideas',
      offers: 'Offers',
      quotes: 'Quotes',
      invoices: 'Invoices',
      payments: 'Payments',
    },
    alertsTitle: 'Alerts & next actions',
    noAlerts: 'Everything is up to date. No urgent action for now.',
    workflowTitle: 'Opportunities workflow',
    workflowSubtitle: 'Project idea → Offer / request → Quote → Invoice → Payment',
    tabs: [
      { ...tabs[0], label: 'Project ideas' },
      { ...tabs[1], label: 'Offers & purchase orders' },
      { ...tabs[2], label: 'Quotes' },
    ],
  },
  ar: {
    title: 'الفرص',
    subtitle: 'أدر الأفكار والعروض وعروض الأسعار من مسار واحد.',
    workflow: 'عرض المسار',
    assistant: 'مساعد الفرص',
    createIdea: 'إنشاء فكرة',
    seeIdeas: 'عرض الأفكار',
    assistantEmpty: 'مسارك التجاري فارغ. ابدأ بإنشاء فكرة مشروع.',
    scoreTitle: 'مؤشر التقدم التجاري',
    scoreSubtitle: 'فكرة → عرض → عرض سعر → فاتورة → دفع',
    progressLabel: 'التقدم التجاري',
    progressGood: 'المسار يتقدم جيداً. واصل تحويل عروض الأسعار إلى فواتير.',
    progressMedium: 'واصل تحويل الأفكار إلى عروض أو عروض أسعار.',
    progressEmpty: 'ابدأ بإنشاء فكرة لإطلاق المسار التجاري.',
    pipelineTitle: 'مسار مصغر',
    pipelineSteps: {
      ideas: 'الأفكار',
      offers: 'العروض',
      quotes: 'عروض الأسعار',
      invoices: 'الفواتير',
      payments: 'المدفوعات',
    },
    alertsTitle: 'تنبيهات وخطوات تالية',
    noAlerts: 'كل شيء محدث. لا توجد إجراءات عاجلة حالياً.',
    workflowTitle: 'مسار الفرص',
    workflowSubtitle: 'فكرة مشروع → عرض / طلب → عرض سعر → فاتورة → دفع',
    tabs: [
      { ...tabs[0], label: 'أفكار المشاريع' },
      { ...tabs[1], label: 'العروض وأوامر الشراء' },
      { ...tabs[2], label: 'عروض الأسعار' },
    ],
  },
};

const Opportunities = () => {
  const { lang } = useLanguage();
  const isRtl = lang === 'ar';
  const text = copyByLang[lang] || copyByLang.fr;
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('ideas');
  const [showWorkflow, setShowWorkflow] = useState(false);
  const [summary, setSummary] = useState(emptySummary);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const localizedTabs = text.tabs || tabs;
  const ActiveComponent = tabs.find((tab) => tab.id === activeTab)?.component || Projects;

  const loadSummary = useCallback(async () => {
    try {
      setLoadingSummary(true);
      const res = await api.get('/opportunities/summary');
      setSummary({ ...emptySummary, ...(res.data || {}) });
    } catch {
      setSummary(emptySummary);
    } finally {
      setLoadingSummary(false);
    }
  }, []);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const handleTarget = (target) => {
    if (target === 'payments') return navigate('/payments');
    if (target === 'invoices') return navigate('/invoices');
    if (['ideas', 'offers', 'quotes'].includes(target)) setActiveTab(target);
  };

  const pipelineSteps = [
    { id: 'ideas', label: text.pipelineSteps.ideas, icon: Lightbulb, count: summary.ideasCount, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { id: 'offers', label: text.pipelineSteps.offers, icon: ClipboardCheck, count: summary.offersCount, color: 'text-blue-600', bg: 'bg-blue-50' },
    { id: 'quotes', label: text.pipelineSteps.quotes, icon: FileText, count: summary.devisCount, color: 'text-violet-600', bg: 'bg-violet-50' },
    { id: 'invoices', label: text.pipelineSteps.invoices, icon: Receipt, count: summary.invoicesCount, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { id: 'payments', label: text.pipelineSteps.payments, icon: CreditCard, count: summary.paidInvoicesCount, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-black tracking-tight text-slate-900">{text.title}</h1>
          <p className="text-sm font-medium text-slate-500">{text.subtitle}</p>
        </div>
        <Button type="button" variant="secondary" icon={Lightbulb} onClick={() => setShowWorkflow(true)}>
          {text.workflow}
        </Button>
      </div>

      <Card className="border-indigo-100 bg-white">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              {loadingSummary ? <Loader className="h-5 w-5 animate-spin" /> : <Lightbulb className="h-6 w-6" />}
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-widest text-slate-900">{text.assistant}</h2>
              <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-500">
                {summary.recommendedAction?.description || text.assistantEmpty}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {summary.recommendedAction?.target ? (
              <Button type="button" size="sm" onClick={() => handleTarget(summary.recommendedAction.target)}>
                {summary.recommendedAction.actionLabel}
              </Button>
            ) : (
              <Button type="button" size="sm" onClick={() => setActiveTab('ideas')}>
                {text.createIdea}
              </Button>
            )}
            {summary.ideasCount > 0 && summary.devisCount === 0 ? (
              <Button type="button" size="sm" variant="secondary" onClick={() => setActiveTab('ideas')}>
                {text.seeIdeas}
              </Button>
            ) : null}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <Card title={text.scoreTitle} subtitle={text.scoreSubtitle}>
          <div className="space-y-4">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{text.progressLabel}</p>
                <p className="mt-1 text-3xl font-black text-slate-900">{summary.progressScore}%</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-premium-600" style={{ width: `${Math.min(summary.progressScore, 100)}%` }} />
            </div>
            <p className="text-sm font-semibold text-slate-500">
              {summary.progressScore >= 60
                ? text.progressGood
                : summary.progressScore >= 20
                  ? text.progressMedium
                  : text.progressEmpty}
            </p>
          </div>
        </Card>

        <Card title={text.pipelineTitle}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
            {pipelineSteps.map((step) => {
              const Icon = step.icon;
              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => handleTarget(step.id)}
                  className="rounded-2xl border border-slate-100 bg-white p-4 text-start shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${step.bg} ${step.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{step.label}</p>
                  <p className="mt-1 text-2xl font-black text-slate-900">{step.count}</p>
                </button>
              );
            })}
          </div>
        </Card>
      </div>

      <Card title={text.alertsTitle}>
        {summary.alerts?.length ? (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {summary.alerts.slice(0, 6).map((alert, index) => (
              <div key={`${alert.type}-${index}`} className="flex flex-col gap-3 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
                  <p className="text-sm font-bold text-amber-900">{alert.message}</p>
                </div>
                <Button type="button" size="sm" variant="secondary" onClick={() => handleTarget(alert.target)}>
                  {alert.actionLabel}
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-4 text-sm font-bold text-emerald-700">
            {text.noAlerts}
          </div>
        )}
      </Card>

      <div className="flex gap-3 overflow-x-auto pb-2">
        {localizedTabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex shrink-0 items-center gap-2 rounded-2xl px-5 py-3 text-xs font-black transition-all ${
                active
                  ? 'bg-premium-600 text-white shadow-lg shadow-premium-100'
                  : 'border border-slate-100 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <ActiveComponent />

      {showWorkflow ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-3 backdrop-blur-sm sm:p-4"
          onClick={(event) => {
            if (event.target === event.currentTarget) setShowWorkflow(false);
          }}
        >
          <Card
            className="max-h-[calc(100dvh-1.5rem)] w-full max-w-6xl overflow-y-auto"
            noPadding
            title={text.workflowTitle}
            subtitle={text.workflowSubtitle}
            action={
              <button
                type="button"
                onClick={() => setShowWorkflow(false)}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            }
          >
            <div className="p-4 sm:p-6">
              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-2 shadow-lg shadow-slate-200/60 sm:p-3">
                <img
                  src={opportunityWorkflow}
                  alt="Workflow opportunité: idée de projet, offre ou demande, devis, facture, paiement"
                  className="max-h-[calc(100dvh-12rem)] w-full rounded-2xl object-contain"
                />
              </div>
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
};

export default Opportunities;
