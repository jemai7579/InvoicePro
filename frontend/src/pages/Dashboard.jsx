import React, { useContext, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  CheckCircle2,
  ClipboardList,
  FileText,
  FolderKanban,
  Lightbulb,
  Loader,
  Plus,
  Receipt,
  ShieldCheck,
  Users,
  Wifi,
  X,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import MiniChart from '../components/ui/MiniChart';
import Stepper from '../components/ui/Stepper';
import SubscriptionQuotaCard from '../components/Subscription/SubscriptionQuotaCard';
import { getClientNumber, getInvoiceNumber } from '../utils/businessNumbers';

const COPY = {
  fr: {
    hello: 'Bonjour',
    title: 'Tableau de bord',
    subtitle: 'Retrouvez vos clients, projets, devis, factures et conformite TTN au meme endroit.',
    workflowButton: 'Voir le workflow',
    workflowTitle: 'Workflow TTN',
    workflowSubtitle: 'Suivez simplement les etapes de conformite avant de considerer une facture comme fiscalement valide.',
    workflowSteps: [
      'Creer la facture',
      'Verifier les informations',
      'Generer XML TEIF',
      'Signer electroniquement',
      'Envoyer a TTN',
      'Attendre la validation',
      'Recevoir reference + QR',
      'Telecharger la facture finale',
    ],
    projects: 'Projets',
    quotes: 'Devis',
    invoices: 'Factures',
    paidInvoices: 'Factures validees',
    progress: 'Avancement global',
    recentInvoices: 'Factures recentes',
    recentClients: 'Clients recents',
    amount: 'Montant',
    status: 'Statut',
    noData: 'Aucune donnee recente',
    usageTitle: 'Votre utilisation ce mois-ci',
    newInvoice: 'Nouvelle facture',
    newProject: 'Nouveau projet',
    setupTitle: 'Mise en route',
    setupSubtitle: 'Completez ces etapes pour finaliser votre espace de facturation.',
    complianceTitle: 'Conformite TTN',
    complianceConfigured: 'Signature configuree',
    complianceMissing: 'Signature non configuree',
    pendingTtn: 'Factures en attente TTN',
    configureTtn: 'Configurer TTN',
    openCompliance: 'Centre de conformite',
    ttnModeTest: 'Mode test',
    ttnModeLive: 'Connecte',
  },
  en: {
    hello: 'Hello',
    title: 'Dashboard',
    subtitle: 'See your clients, projects, quotes, invoices and TTN compliance in one place.',
    workflowButton: 'View workflow',
    workflowTitle: 'TTN workflow',
    workflowSubtitle: 'Follow the compliance steps before considering an invoice fiscally valid.',
    workflowSteps: [
      'Create the invoice',
      'Review the information',
      'Generate TEIF XML',
      'Sign electronically',
      'Submit to TTN',
      'Wait for validation',
      'Receive reference + QR',
      'Download the final invoice',
    ],
    projects: 'Projects',
    quotes: 'Quotes',
    invoices: 'Invoices',
    paidInvoices: 'Validated invoices',
    progress: 'Overall progress',
    recentInvoices: 'Recent invoices',
    recentClients: 'Recent clients',
    amount: 'Amount',
    status: 'Status',
    noData: 'No recent data',
    usageTitle: 'Your usage this month',
    newInvoice: 'New invoice',
    newProject: 'New project',
    setupTitle: 'Getting started',
    setupSubtitle: 'Complete these steps to finalize your billing workspace.',
    complianceTitle: 'TTN compliance',
    complianceConfigured: 'Signature configured',
    complianceMissing: 'Signature not configured',
    pendingTtn: 'Invoices pending TTN',
    configureTtn: 'Configure TTN',
    openCompliance: 'Compliance center',
    ttnModeTest: 'Test mode',
    ttnModeLive: 'Connected',
  },
  ar: {
    hello: 'مرحبا',
    title: 'لوحة التحكم',
    subtitle: 'تابع العملاء والمشاريع والعروض والفواتير وامتثال TTN من مكان واحد.',
    workflowButton: 'عرض المسار',
    workflowTitle: 'مسار TTN',
    workflowSubtitle: 'اتبع خطوات الامتثال قبل اعتبار الفاتورة صالحة جبائيا.',
    workflowSteps: [
      'انشاء الفاتورة',
      'مراجعة المعلومات',
      'توليد XML TEIF',
      'توقيع الكتروني',
      'ارسال الى TTN',
      'انتظار التحقق',
      'استلام المرجع وQR',
      'تنزيل الفاتورة النهائية',
    ],
    projects: 'المشاريع',
    quotes: 'العروض',
    invoices: 'الفواتير',
    paidInvoices: 'الفواتير المعتمدة',
    progress: 'التقدم العام',
    recentInvoices: 'احدث الفواتير',
    recentClients: 'احدث العملاء',
    amount: 'المبلغ',
    status: 'الحالة',
    noData: 'لا توجد بيانات حديثة',
    usageTitle: 'استخدامك هذا الشهر',
    newInvoice: 'فاتورة جديدة',
    newProject: 'مشروع جديد',
    setupTitle: 'التهيئة',
    setupSubtitle: 'اكمل هذه الخطوات لتجهيز فضاء الفوترة.',
    complianceTitle: 'امتثال TTN',
    complianceConfigured: 'التوقيع مهيأ',
    complianceMissing: 'التوقيع غير مهيأ',
    pendingTtn: 'فواتير بانتظار TTN',
    configureTtn: 'تهيئة TTN',
    openCompliance: 'مركز الامتثال',
    ttnModeTest: 'وضع الاختبار',
    ttnModeLive: 'متصل',
  },
};

const statusVariant = (status) => {
  if (['ACCEPTED_TTN', 'VALIDATED'].includes(status)) return 'success';
  if (['REJECTED_TTN', 'CANCELLED'].includes(status)) return 'rejected';
  if (['SENT_TO_TTN', 'PENDING_TTN', 'SIGNED'].includes(status)) return 'primary';
  return 'warning';
};

const WorkflowModal = ({ open, onClose, text }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <Card
        className="w-full max-w-3xl"
        noPadding
        title={text.workflowTitle}
        subtitle={text.workflowSubtitle}
        action={
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        }
      >
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          {text.workflowSteps.map((step, index) => (
            <div key={step} className="rounded-3xl border border-slate-100 bg-slate-50/60 p-5 flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center text-sm font-black text-indigo-600">
                {index + 1}
              </div>
              <p className="text-sm font-semibold text-slate-700 leading-6">{step}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

const Dashboard = () => {
  const { lang, t } = useLanguage();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const text = COPY[user?.preferredLanguage || lang] || COPY.fr;

  const [loading, setLoading] = useState(true);
  const [showWorkflow, setShowWorkflow] = useState(false);
  const [stats, setStats] = useState({
    totalClients: 0,
    totalProjects: 0,
    totalQuotes: 0,
    totalInvoices: 0,
    paidInvoices: 0,
    totalRevenue: 0,
    recentInvoices: [],
    recentClients: [],
    globalProgress: 0,
    compliance: {
      signatureConfigured: false,
      ttnMode: 'mock',
      pendingTtn: 0,
      lastSubmission: null,
    },
  });
  const [onboarding, setOnboarding] = useState({ percent: 0, currentStep: 0 });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [clientsRes, invoicesRes, settingsRes, projectsRes, quotesRes] = await Promise.all([
          api.get('/clients'),
          api.get('/invoices'),
          api.get('/settings'),
          api.get('/projects').catch(() => ({ data: [] })),
          api.get('/devis').catch(() => ({ data: [] })),
        ]);

        const clients = clientsRes.data || [];
        const invoices = invoicesRes.data || [];
        const settings = settingsRes.data || {};
        const projects = projectsRes.data || [];
        const quotes = quotesRes.data || [];

        const paidInvoices = invoices.filter((invoice) => ['ACCEPTED_TTN', 'VALIDATED'].includes(invoice.complianceStatus || invoice.status));
        const pendingTtn = invoices.filter((invoice) => ['SENT_TO_TTN', 'PENDING_TTN'].includes(invoice.complianceStatus || invoice.ttnStatus || invoice.status));
        const totalRevenue = paidInvoices.reduce((sum, invoice) => sum + Number(invoice.netToPay || 0), 0);
        const acceptedProjects = projects.filter((project) => project.status === 'ACCEPTED').length;
        const acceptedQuotes = quotes.filter((quote) => quote.status === 'ACCEPTED' || quote.status === 'CONVERTED_TO_INVOICE').length;

        const profileComplete = !!(settings.name && settings.matriculeFiscal && settings.address);
        const hasClients = clients.length > 0;
        const hasCertificate = settings?.compliance?.signatureStatus === 'configured';
        let currentStep = 0;
        let completed = 0;
        if (profileComplete) {
          completed += 1;
          currentStep = 1;
        }
        if (hasClients) {
          completed += 1;
          currentStep = 2;
        }
        if (hasCertificate) {
          completed += 1;
          currentStep = 3;
        }

        const progressValues = [
          clients.length > 0 ? 100 : 0,
          projects.length > 0 ? (acceptedProjects / Math.max(projects.length, 1)) * 100 : 0,
          quotes.length > 0 ? (acceptedQuotes / Math.max(quotes.length, 1)) * 100 : 0,
          invoices.length > 0 ? (paidInvoices.length / Math.max(invoices.length, 1)) * 100 : 0,
        ];

        setOnboarding({
          percent: Math.round((completed / 3) * 100),
          currentStep,
        });

        setStats({
          totalClients: clients.length,
          totalProjects: projects.length,
          totalQuotes: quotes.length,
          totalInvoices: invoices.length,
          paidInvoices: paidInvoices.length,
          totalRevenue,
          recentInvoices: invoices.slice(0, 5),
          recentClients: clients.slice(0, 5),
          globalProgress: Math.round(progressValues.reduce((sum, value) => sum + value, 0) / progressValues.length),
          compliance: {
            signatureConfigured: hasCertificate,
            ttnMode: settings?.compliance?.ttnMode || 'mock',
            pendingTtn: pendingTtn.length,
            lastSubmission: settings?.compliance?.lastSubmission || null,
          },
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const onboardingSteps = useMemo(
    () => [
      { label: t('onboarding.step1'), link: '/settings' },
      { label: t('onboarding.step2'), link: '/clients' },
      { label: t('onboarding.step3'), link: '/settings?tab=compliance' },
    ],
    [t]
  );

  const companyName = user?.name || user?.company?.name || 'El Fatoora';

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <>
      <WorkflowModal open={showWorkflow} onClose={() => setShowWorkflow(false)} text={text} />

      <div className="space-y-8 pb-20">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-500">{text.hello} {companyName}</p>
            <h1 className="text-2xl font-black text-slate-900 font-display tracking-tight">{text.title}</h1>
            <p className="text-sm text-slate-500 font-medium">{text.subtitle}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={() => setShowWorkflow(true)} icon={Lightbulb} size="sm">
              {text.workflowButton}
            </Button>
            <Button onClick={() => navigate('/invoices')} icon={Plus} size="sm">
              {text.newInvoice}
            </Button>
            <Button variant="secondary" onClick={() => navigate('/projects')} icon={FolderKanban} size="sm">
              {text.newProject}
            </Button>
          </div>
        </div>

        {onboarding.percent < 100 ? (
          <div className="bg-white border border-slate-100 rounded-[2rem] p-8 shadow-sm relative overflow-hidden">
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-lg font-black mb-1 text-slate-900 font-display">{text.setupTitle}</h2>
                <p className="text-slate-500 text-xs font-medium">{text.setupSubtitle}</p>
              </div>
              <Stepper steps={onboardingSteps} currentStep={onboarding.currentStep} onStepClick={(index) => navigate(onboardingSteps[index].link)} />
            </div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 blur-3xl -me-32 -mt-32" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-slate-50/50 blur-3xl -ms-24 -mb-24" />
          </div>
        ) : null}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6">
          <Card variant="premium" className="pt-6 pb-2">
            <div className="flex justify-between items-start mb-4">
              <div>
                <dt className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{text.projects}</dt>
                <dd className="text-xl font-black text-slate-900 font-display">{stats.totalProjects}</dd>
              </div>
              <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600"><FolderKanban className="w-4 h-4" /></div>
            </div>
            <MiniChart color="#6366f1" />
          </Card>

          <Card className="pt-6 pb-2">
            <div className="flex justify-between items-start mb-4">
              <div>
                <dt className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{text.quotes}</dt>
                <dd className="text-xl font-black text-slate-900 font-display">{stats.totalQuotes}</dd>
              </div>
              <div className="p-2 bg-blue-50 rounded-xl text-blue-600"><FileText className="w-4 h-4" /></div>
            </div>
            <MiniChart color="#2563eb" />
          </Card>

          <Card className="pt-6 pb-2">
            <div className="flex justify-between items-start mb-4">
              <div>
                <dt className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{text.invoices}</dt>
                <dd className="text-xl font-black text-slate-900 font-display">{stats.totalInvoices}</dd>
              </div>
              <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600"><Receipt className="w-4 h-4" /></div>
            </div>
            <MiniChart color="#10b981" />
          </Card>

          <Card className="pt-6 pb-2">
            <div className="flex justify-between items-start mb-4">
              <div>
                <dt className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{text.paidInvoices}</dt>
                <dd className="text-xl font-black text-slate-900 font-display">{stats.paidInvoices}</dd>
              </div>
              <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600"><CheckCircle2 className="w-4 h-4" /></div>
            </div>
            <Badge variant="success" size="sm">TND {stats.totalRevenue.toLocaleString()}</Badge>
          </Card>

          <Card className="pt-6 pb-2">
            <div className="flex justify-between items-start mb-4">
              <div>
                <dt className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{text.progress}</dt>
                <dd className="text-xl font-black text-slate-900 font-display">{stats.globalProgress}%</dd>
              </div>
              <div className="p-2 bg-amber-50 rounded-xl text-amber-600"><Activity className="w-4 h-4" /></div>
            </div>
            <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${Math.min(stats.globalProgress, 100)}%` }} />
            </div>
          </Card>
        </div>

        <Card className="border-indigo-100 bg-indigo-50/40">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-white border border-indigo-100 text-indigo-600">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">{text.complianceTitle}</h3>
                  <p className="text-sm text-slate-500 font-medium">
                    {stats.compliance.signatureConfigured ? text.complianceConfigured : text.complianceMissing}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-2xl bg-white border border-slate-100 px-4 py-3">
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">TTN</div>
                  <div className="mt-1 text-sm font-bold text-slate-800">{stats.compliance.ttnMode === 'mock' ? text.ttnModeTest : text.ttnModeLive}</div>
                </div>
                <div className="rounded-2xl bg-white border border-slate-100 px-4 py-3">
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">{text.pendingTtn}</div>
                  <div className="mt-1 text-sm font-bold text-slate-800">{stats.compliance.pendingTtn}</div>
                </div>
                <div className="rounded-2xl bg-white border border-slate-100 px-4 py-3">
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Dernier envoi</div>
                  <div className="mt-1 text-sm font-bold text-slate-800">
                    {stats.compliance.lastSubmission?.updatedAt ? new Date(stats.compliance.lastSubmission.updatedAt).toLocaleDateString() : '-'}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button size="sm" onClick={() => navigate('/settings?tab=compliance')} icon={Wifi}>
                {text.configureTtn}
              </Button>
              <Button size="sm" variant="secondary" onClick={() => navigate('/teif')} icon={Lightbulb}>
                {text.openCompliance}
              </Button>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card
            title={text.recentInvoices}
            noPadding
            action={<Link to="/invoices" className="text-xs text-premium-600 hover:text-premium-800 font-bold uppercase tracking-wider transition-colors">Voir tout</Link>}
          >
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50/50">
                  <tr>
                    <th className="px-5 py-3 text-start text-[10px] font-black text-slate-400 uppercase tracking-widest">ID</th>
                    <th className="px-5 py-3 text-start text-[10px] font-black text-slate-400 uppercase tracking-widest">Client</th>
                    <th className="px-5 py-3 text-start text-[10px] font-black text-slate-400 uppercase tracking-widest">{text.status}</th>
                    <th className="px-5 py-3 text-end text-[10px] font-black text-slate-400 uppercase tracking-widest">{text.amount}</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-50">
                  {stats.recentInvoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-premium-50/30 transition-colors">
                      <td className="px-5 py-3 whitespace-nowrap text-xs font-bold text-slate-900">{getInvoiceNumber(invoice)}</td>
                      <td className="px-5 py-3 whitespace-nowrap text-xs font-medium text-slate-600">{invoice.client?.name || '-'}</td>
                      <td className="px-5 py-3 whitespace-nowrap">
                        <Badge variant={statusVariant(invoice.complianceStatus || invoice.status)}>{invoice.complianceLabelFr || invoice.complianceStatus || invoice.status}</Badge>
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap text-end text-sm font-black text-slate-900">
                        {Number(invoice.netToPay || 0).toLocaleString()} <span className="text-[10px] text-slate-400 font-bold">TND</span>
                      </td>
                    </tr>
                  ))}
                  {stats.recentInvoices.length === 0 ? <tr><td colSpan="4" className="text-center py-12 text-slate-400 text-xs font-medium italic">{text.noData}</td></tr> : null}
                </tbody>
              </table>
            </div>
          </Card>

          <Card
            title={text.recentClients}
            noPadding
            action={<Link to="/clients" className="text-xs text-premium-600 hover:text-premium-800 font-bold uppercase tracking-wider transition-colors">Voir tout</Link>}
          >
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50/50">
                  <tr>
                    <th className="px-6 py-4 text-start text-[10px] font-black text-slate-400 uppercase tracking-widest">Nom</th>
                    <th className="px-6 py-4 text-start text-[10px] font-black text-slate-400 uppercase tracking-widest">Email</th>
                    <th className="px-6 py-4 text-start text-[10px] font-black text-slate-400 uppercase tracking-widest">MF</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-50">
                  {stats.recentClients.map((client) => (
                    <tr key={client.id} className="hover:bg-premium-50/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-slate-900">{client.name}<div className="text-[10px] text-slate-400 font-black mt-1">{getClientNumber(client)}</div></td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs font-medium text-slate-500">{client.email || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs font-medium text-slate-500">{client.matriculeFiscal || '-'}</td>
                    </tr>
                  ))}
                  {stats.recentClients.length === 0 ? <tr><td colSpan="3" className="text-center py-12 text-slate-400 text-xs font-medium italic">{text.noData}</td></tr> : null}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <div className="pt-2">
          <div className="mb-3">
            <p className="text-sm font-semibold text-slate-500">{text.usageTitle}</p>
          </div>
          <SubscriptionQuotaCard user={user} />
        </div>
      </div>
    </>
  );
};

export default Dashboard;
