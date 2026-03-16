import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Plus, MoreVertical, Loader } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalClients: 0,
    totalInvoices: 0,
    pendingInvoices: 0,
    paidInvoices: 0,
    totalRevenue: 0,
    recentInvoices: [],
    recentClients: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [clientsRes, invoicesRes] = await Promise.all([
          api.get('/clients'),
          api.get('/invoices')
        ]);

        const clients = clientsRes.data;
        const invoices = invoicesRes.data;

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
    <Layout>
      {loading ? (
        <div className="flex justify-center items-center h-full">
          <Loader className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <>
          {/* Quick Actions */}
          <div className="mb-8 flex flex-wrap gap-4">
            <Link to="/invoices" className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg shadow-sm hover:bg-blue-700 transition-colors">
              <Plus className="h-4 w-4 mr-2" /> Nouvelle Facture
            </Link>
            <Link to="/clients" className="inline-flex items-center px-4 py-2 bg-white text-gray-700 text-sm font-medium rounded-lg shadow-sm border border-gray-300 hover:bg-gray-50 transition-colors">
              <Plus className="h-4 w-4 mr-2" /> Nouveau Client
            </Link>
          </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="bg-white overflow-hidden shadow-sm rounded-xl border border-gray-100 p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">Revenu Total</dt>
            <dd className="mt-2 text-3xl font-bold text-gray-900">
              {stats.totalRevenue.toLocaleString()}
            </dd>
          </div>
          <div className="bg-white overflow-hidden shadow-sm rounded-xl border border-gray-100 p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">Factures ce mois</dt>
            <dd className="mt-2 text-3xl font-bold text-gray-900">{stats.totalInvoices}</dd>
          </div>
          <div className="bg-white overflow-hidden shadow-sm rounded-xl border border-gray-100 p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">Factures en attente</dt>
            <dd className="mt-2 text-3xl font-bold text-gray-900">{stats.pendingInvoices}</dd>
            <div className="mt-2 text-sm text-yellow-600 font-medium">Nécessite un suivi</div>
          </div>
          <div className="bg-white overflow-hidden shadow-sm rounded-xl border border-gray-100 p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">Factures payées/validées</dt>
            <dd className="mt-2 text-3xl font-bold text-gray-900">{stats.paidInvoices}</dd>
            <div className="mt-2 text-sm text-green-600 font-medium">En bonne voie</div>
          </div>
        </div>

        {/* Tables Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Recent Invoices Table */}
          <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900">Factures récentes</h3>
              <Link to="/invoices" className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors">
                Voir tout
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Facture</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Montant</th>
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
                    <tr><td colSpan="4" className="text-center py-8 text-gray-500 text-sm">Aucune facture récente</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Clients Table */}
          <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900">Clients récents</h3>
              <Link to="/clients" className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors">
                Voir tout
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">MF</th>
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
                    <tr><td colSpan="3" className="text-center py-8 text-gray-500 text-sm">Aucun client récent</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
        </div>
        </>
      )}
    </Layout>
  );
};

export default Dashboard;
