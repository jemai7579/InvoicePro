import React, { useState, useEffect } from 'react';
import { Plus, MoreVertical, Loader, CheckCircle2, Lightbulb } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useLanguage } from '../context/LanguageContext';

const Dashboard = () => {
  const { t } = useLanguage();
  const [stats, setStats] = useState({
    totalClients: 0,
    totalInvoices: 0,
    pendingInvoices: 0,
    paidInvoices: 0,
    totalRevenue: 0,
    recentInvoices: [],
    recentClients: []
  });
  const [onboarding, setOnboarding] = useState({
    profileComplete: false,
    hasClients: false,
    hasCertificate: false,
    percent: 0
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
        const hasCertificate = !!settings.certificateId || !!settings.hasCertificate; // assuming backend returns this
        
        let count = 0;
        if (profileComplete) count++;
        if (hasClients) count++;
        if (hasCertificate) count++;
        
        setOnboarding({
          profileComplete,
          hasClients,
          hasCertificate,
          percent: Math.round((count / 3) * 100)
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

        setStats({
          totalClients: clients.length,
          totalInvoices: invoicesThisMonth.length,
          pendingInvoices: invoices.filter(inv => inv.status === 'PENDING_VALIDATION' || inv.status === 'DRAFT').length,
          paidInvoices: invoices.filter(inv => inv.status === 'VALIDATED' || inv.status === 'PAID').length,
          totalRevenue: revenue,
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
  

  const getStatusColor = (status) => {
    switch(status.toLowerCase()) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'sent to ttn': return 'bg-blue-100 text-blue-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <>
      {loading ? (
        <div className="flex justify-center items-center h-full">
          <Loader className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <>
          {/* Quick Actions */}
          <div className="mb-8 flex flex-wrap gap-4">
            <Link to="/invoices?new=true" className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg shadow-sm hover:bg-blue-700 transition-colors">
              <Plus className="h-4 w-4 mr-2" /> {t('dashboard.newInvoice')}
            </Link>
            <Link to="/clients" className="inline-flex items-center px-4 py-2 bg-white text-gray-700 text-sm font-medium rounded-lg shadow-sm border border-gray-300 hover:bg-gray-50 transition-colors">
              <Plus className="h-4 w-4 mr-2" /> {t('dashboard.newClient')}
            </Link>
          </div>

          {/* Onboarding Checklist */}
          {onboarding.percent < 100 ? (
            <div className="mb-8 bg-blue-600 rounded-2xl p-6 text-white shadow-xl shadow-blue-100 relative overflow-hidden">
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="max-w-md">
                  <h2 className="text-xl font-bold mb-2">{t('onboarding.welcome')}</h2>
                  <p className="text-blue-100 text-sm">{t('onboarding.subtitle')}</p>
                  <div className="mt-4 h-2 w-full bg-blue-400/30 rounded-full">
                    <div className="h-full bg-white rounded-full transition-all duration-1000" style={{ width: `${onboarding.percent}%` }}></div>
                  </div>
                  <p className="mt-2 text-xs font-bold">{onboarding.percent}% {t('onboarding.complete')}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
                  {[
                    { label: t('onboarding.step1'), done: onboarding.profileComplete, link: '/settings' },
                    { label: t('onboarding.step2'), done: onboarding.hasClients, link: '/clients' },
                    { label: t('onboarding.step3'), done: onboarding.hasCertificate, link: '/settings#certificate' },
                  ].map((step, i) => (
                    <Link 
                      key={i} 
                      to={step.link}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                        step.done 
                        ? 'bg-blue-500/20 border-blue-400/30 text-blue-100 opacity-60' 
                        : 'bg-white/10 border-white/20 hover:bg-white/20'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${step.done ? 'bg-green-400 text-white' : 'bg-white/20'}`}>
                        {step.done ? <CheckCircle2 className="w-3 h-3" /> : i + 1}
                      </div>
                      <span className="text-sm font-medium">{step.label}</span>
                    </Link>
                  ))}
                </div>
              </div>
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 blur-3xl -mr-20 -mt-20"></div>
            </div>
          ) : (
             <div className="mb-8 bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-center gap-4 text-emerald-800">
                <div className="bg-emerald-100 p-2 rounded-lg">
                   <Lightbulb className="w-5 h-5" />
                </div>
                <p className="text-sm font-medium">
                   {t('dashboard.onboarding.success')}
                </p>
             </div>
          )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="bg-white overflow-hidden shadow-sm rounded-xl border border-gray-100 p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">{t('dashboard.stats.revenue')}</dt>
            <dd className="mt-2 text-3xl font-bold text-gray-900">
              {stats.totalRevenue.toLocaleString()}
            </dd>
          </div>
          <div className="bg-white overflow-hidden shadow-sm rounded-xl border border-gray-100 p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">{t('dashboard.stats.monthly')}</dt>
            <dd className="mt-2 text-3xl font-bold text-gray-900">{stats.totalInvoices}</dd>
          </div>
          <div className="bg-white overflow-hidden shadow-sm rounded-xl border border-gray-100 p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">{t('dashboard.stats.pending')}</dt>
            <dd className="mt-2 text-3xl font-bold text-gray-900">{stats.pendingInvoices}</dd>
            <div className="mt-2 text-sm text-yellow-600 font-medium">{t('dashboard.needsFollowUp')}</div>
          </div>
          <div className="bg-white overflow-hidden shadow-sm rounded-xl border border-gray-100 p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">{t('dashboard.stats.paid')}</dt>
            <dd className="mt-2 text-3xl font-bold text-gray-900">{stats.paidInvoices}</dd>
            <div className="mt-2 text-sm text-green-600 font-medium">{t('dashboard.onTrack')}</div>
          </div>
        </div>

        {/* Tables Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Recent Invoices Table */}
          <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900">{t('dashboard.recent.invoices')}</h3>
              <Link to="/invoices" className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors">
                {t('dashboard.viewAll')}
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('form.client')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('dashboard.table.status')}</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t('dashboard.table.amount')}</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stats.recentInvoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{invoice.id.slice(0, 8).toUpperCase()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{invoice.client?.name || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(invoice.status)}`}>
                          {invoice.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                        {invoice.netToPay.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  {stats.recentInvoices.length === 0 && (
                    <tr><td colSpan="4" className="text-center py-8 text-gray-500 text-sm">{t('dashboard.noData')}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Clients Table */}
          <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900">{t('dashboard.recent.clients')}</h3>
              <Link to="/clients" className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors">
                {t('dashboard.viewAll')}
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('dashboard.table.name')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('auth.email')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('form.mf')}</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stats.recentClients.map((client) => (
                    <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{client.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{client.email || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{client.matriculeFiscal || '-'}</td>
                    </tr>
                  ))}
                  {stats.recentClients.length === 0 && (
                    <tr><td colSpan="3" className="text-center py-8 text-gray-500 text-sm">{t('dashboard.noData')}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
        </div>
        </>
      )}
    </>
  );
};

export default Dashboard;
