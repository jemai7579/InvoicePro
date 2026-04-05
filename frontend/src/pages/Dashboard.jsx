import React, { useState, useEffect } from 'react';
import { Plus, MoreVertical, Loader, CheckCircle2, Lightbulb, AlertTriangle, Clock, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Stepper from '../components/ui/Stepper';
import MiniChart from '../components/ui/MiniChart';
import { AuthContext } from '../context/AuthContext';
import SubscriptionQuotaCard from '../components/Subscription/SubscriptionQuotaCard';
import { useContext } from 'react';

const Dashboard = () => {
  const { t } = useLanguage();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalClients: 0,
    totalInvoices: 0,
    pendingInvoices: 0,
    paidInvoices: 0,
    totalRevenue: 0,
    overdueInvoices: [],
    recentInvoices: [],
    recentClients: []
  });
  const [onboarding, setOnboarding] = useState({
    profileComplete: false,
    hasClients: false,
    hasCertificate: false,
    percent: 0,
    currentStep: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [clientsRes, invoicesRes, settingsRes] = await Promise.all([
          api.get('/clients'),
          api.get('/invoices'),
          api.get('/settings')
        ]);

        const clients = clientsRes.data;
        const invoices = invoicesRes.data;
        const settings = settingsRes.data;

        // Onboarding logic
        const profileComplete = !!(settings.name && settings.matriculeFiscal && settings.address);
        const hasClients = clients.length > 0;
        const hasCertificate = !!settings.certificateId || !!settings.hasCertificate;
        
        let count = 0;
        let currentStep = 0;
        if (profileComplete) { count++; currentStep = 1; }
        if (hasClients) { count++; currentStep = 2; }
        if (hasCertificate) { count++; currentStep = 3; }
        
        setOnboarding({
          profileComplete,
          hasClients,
          hasCertificate,
          percent: Math.round((count / 3) * 100),
          currentStep
        });

        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        const invoicesThisMonth = invoices.filter(inv => {
          const date = new Date(inv.createdAt);
          return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
        });

        const revenue = invoices
          .filter(inv => inv.status === 'VALIDATED' || inv.status === 'PAID')
          .reduce((sum, inv) => sum + inv.netToPay, 0);

        const today = new Date();
        const overdue = invoices.filter(inv => 
          inv.status !== 'PAID' && 
          inv.status !== 'VALIDATED' && 
          inv.dueDate && new Date(inv.dueDate) < today
        );

        setStats({
          totalClients: clients.length,
          totalInvoices: invoicesThisMonth.length,
          pendingInvoices: invoices.filter(inv => inv.status === 'PENDING_VALIDATION' || inv.status === 'DRAFT').length,
          paidInvoices: invoices.filter(inv => inv.status === 'VALIDATED' || inv.status === 'PAID').length,
          totalRevenue: revenue,
          overdueInvoices: overdue,
          recentInvoices: invoices.slice(0, 5),
          recentClients: clients.slice(0, 5)
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);
  

  const getStatusVariant = (status) => {
    switch(status.toLowerCase()) {
      case 'paid': 
      case 'validated': return 'success';
      case 'pending': 
      case 'pending_validation': return 'pending';
      case 'rejected': return 'rejected';
      case 'sent to ttn': return 'info';
      default: return 'neutral';
    }
  };

  const onboardingSteps = [
    { label: t('onboarding.step1'), link: '/settings' },
    { label: t('onboarding.step2'), link: '/clients' },
    { label: t('onboarding.step3'), link: '/settings#certificate' },
  ];

  return (
    <>
      {loading ? (
        <div className="flex justify-center items-center h-full">
          <Loader className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <>
          {/* Quick Actions & Header */}
          <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-black text-slate-900 font-display tracking-tight">{t('dashboard.title')}</h1>
              <p className="text-slate-500 text-xs font-medium">{t('dashboard.welcome')}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button 
                onClick={() => navigate('/invoices?new=true')}
                icon={Plus}
                size="sm"
              >
                {t('dashboard.newInvoice')}
              </Button>
              <Button 
                variant="secondary"
                onClick={() => navigate('/clients')}
                icon={Plus}
                size="sm"
              >
                {t('dashboard.newClient')}
              </Button>
            </div>
          </div>

          {/* Subscription Quota Card */}
          <div className="mb-8">
            <SubscriptionQuotaCard user={user} />
          </div>

          {/* Stepper Onboarding */}
          {onboarding.percent < 100 && (
            <div className="mb-8 bg-white border border-slate-100 rounded-[2rem] p-8 shadow-sm relative overflow-hidden">
               <div className="max-w-2xl mx-auto">
                  <div className="text-center mb-8">
                    <h2 className="text-lg font-black mb-1 text-slate-900 font-display">{t('onboarding.welcome')}</h2>
                    <p className="text-slate-500 text-xs font-medium">{t('onboarding.subtitle')}</p>
                  </div>
                  <Stepper 
                    steps={onboardingSteps} 
                    currentStep={onboarding.currentStep} 
                    onStepClick={(i) => navigate(onboardingSteps[i].link)}
                  />
               </div>
               <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 blur-3xl -me-32 -mt-32"></div>
               <div className="absolute bottom-0 left-0 w-48 h-48 bg-slate-50/50 blur-3xl -ms-24 -mb-24"></div>
            </div>
          )}

          {/* Urgencies Section */}
          {stats.overdueInvoices.length > 0 && (
            <div className="mb-10 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-rose-50 border border-rose-100 rounded-3xl p-6 flex items-start gap-4">
                <div className="bg-rose-100 p-3 rounded-2xl text-rose-600">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-rose-900 uppercase tracking-widest mb-1">{t('dashboard.urgencies.overdue')}</h3>
                  <p className="text-rose-700/70 text-xs font-bold mb-3">{stats.overdueInvoices.length} {t('dashboard.urgencies.pendingAction')}</p>
                  <Button variant="secondary" size="sm" className="bg-white border-rose-200 text-rose-600 hover:bg-rose-100" onClick={() => navigate('/invoices?status=overdue')}>
                    {t('dashboard.viewAll')}
                  </Button>
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-100 rounded-3xl p-6 flex items-start gap-4">
                <div className="bg-amber-100 p-3 rounded-2xl text-amber-600">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-amber-900 uppercase tracking-widest mb-1">{t('dashboard.urgencies.drafts')}</h3>
                  <p className="text-amber-700/70 text-xs font-bold mb-3">{stats.pendingInvoices} {t('dashboard.urgencies.needValidation')}</p>
                  <Button variant="secondary" size="sm" className="bg-white border-amber-200 text-amber-600 hover:bg-amber-100" onClick={() => navigate('/invoices?status=draft')}>
                    {t('dashboard.viewAll')}
                  </Button>
                </div>
              </div>
            </div>
          )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <Card variant="premium" className="relative group overflow-hidden pt-6 pb-2">
            <div className="flex justify-between items-start mb-4">
              <div>
                <dt className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">{t('dashboard.stats.revenue')}</dt>
                <dd className="text-xl font-black text-slate-900 font-display">
                  {stats.totalRevenue.toLocaleString()} <span className="text-[10px] text-slate-400 font-bold ms-1">{t('common.tnd')}</span>
                </dd>
              </div>
              <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>
            <MiniChart color="#10b981" />
          </Card>
          
          <Card className="relative group overflow-hidden pt-6 pb-2">
            <div className="flex justify-between items-start mb-4">
              <div>
                <dt className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">{t('dashboard.stats.monthly')}</dt>
                <dd className="text-xl font-black text-slate-900 font-display">{stats.totalInvoices}</dd>
              </div>
              <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>
            <MiniChart color="#6366f1" />
          </Card>

          <Card className="relative group overflow-hidden pt-6 pb-2">
            <div className="flex justify-between items-start mb-4">
              <div>
                <dt className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">{t('dashboard.stats.pending')}</dt>
                <dd className="text-xl font-black text-slate-900 font-display">{stats.pendingInvoices}</dd>
              </div>
              <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 min-h-[48px] flex items-end">
               <Badge variant="pending" size="sm">{t('dashboard.needsFollowUp')}</Badge>
            </div>
          </Card>

          <Card className="relative group overflow-hidden pt-6 pb-2">
            <div className="flex justify-between items-start mb-4">
              <div>
                <dt className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">{t('dashboard.stats.paid')}</dt>
                <dd className="text-xl font-black text-slate-900 font-display">{stats.paidInvoices}</dd>
              </div>
              <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 min-h-[48px] flex items-end">
               <Badge variant="success" size="sm">{t('dashboard.onTrack')}</Badge>
            </div>
          </Card>
        </div>

        {/* Tables Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Recent Invoices Table */}
          <Card 
            title={t('dashboard.recent.invoices')} 
            noPadding 
            action={
              <Link to="/invoices" className="text-xs text-premium-600 hover:text-premium-800 font-bold uppercase tracking-wider transition-colors">
                {t('dashboard.viewAll')}
              </Link>
            }
          >
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50/50">
                  <tr>
                    <th className="px-5 py-3 text-start text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('invoices.table.id')}</th>
                    <th className="px-5 py-3 text-start text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('form.client')}</th>
                    <th className="px-5 py-3 text-start text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('dashboard.table.status')}</th>
                    <th className="px-5 py-3 text-end text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('dashboard.table.amount')}</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-50">
                  {stats.recentInvoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-premium-50/30 transition-colors group">
                      <td className="px-5 py-3 whitespace-nowrap text-xs font-bold text-slate-900">{invoice.id.slice(0, 8).toUpperCase()}</td>
                      <td className="px-5 py-3 whitespace-nowrap text-xs font-medium text-slate-600 group-hover:text-slate-900 transition-colors">{invoice.client?.name || '-'}</td>
                      <td className="px-5 py-3 whitespace-nowrap">
                        <Badge variant={getStatusVariant(invoice.status)}>
                          {t(`status.${invoice.status.toLowerCase()}`) || invoice.status}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap text-end text-sm font-black text-slate-900 group-hover:text-premium-600 transition-colors">
                        {invoice.netToPay.toLocaleString()} <span className="text-[10px] text-slate-400 font-bold">{t('common.tnd')}</span>
                      </td>
                    </tr>
                  ))}
                  {stats.recentInvoices.length === 0 && (
                    <tr><td colSpan="4" className="text-center py-12 text-slate-400 text-xs font-medium italic">{t('dashboard.noData')}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Recent Clients Table */}
          <Card 
            title={t('dashboard.recent.clients')} 
            noPadding 
            action={
              <Link to="/clients" className="text-xs text-premium-600 hover:text-premium-800 font-bold uppercase tracking-wider transition-colors">
                {t('dashboard.viewAll')}
              </Link>
            }
          >
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50/50">
                  <tr>
                    <th className="px-6 py-4 text-start text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('dashboard.table.name')}</th>
                    <th className="px-6 py-4 text-start text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('auth.email')}</th>
                    <th className="px-6 py-4 text-start text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('form.mf')}</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-50">
                  {stats.recentClients.map((client) => (
                    <tr key={client.id} className="hover:bg-premium-50/30 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-slate-900 group-hover:text-premium-600 transition-colors">{client.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs font-medium text-slate-500">{client.email || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs font-medium text-slate-500">{client.matriculeFiscal || '-'}</td>
                    </tr>
                  ))}
                  {stats.recentClients.length === 0 && (
                    <tr><td colSpan="3" className="text-center py-12 text-slate-400 text-xs font-medium italic">{t('dashboard.noData')}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
          
        </div>
        </>
      )}
    </>
  );
};

export default Dashboard;

