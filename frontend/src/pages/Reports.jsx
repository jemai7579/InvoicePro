import React, { useState, useEffect } from 'react';
import { Loader } from 'lucide-react';
import api from '../services/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [reportsData, setReportsData] = useState(null);
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      
      const res = await api.get('/reports', { params });
      setReportsData(res.data);
    } catch (error) {
      console.error('Error fetching reports', error);
      alert('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleFilter = (e) => {
    e.preventDefault();
    fetchReports();
  };

  const formatCurrency = (value) => `${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

  return (
    <>
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Analytique & Rapports</h1>
          <p className="text-sm text-gray-500">Indicateurs clés et statistiques de votre entreprise</p>
        </div>
        
        <form onSubmit={handleFilter} className="flex flex-wrap items-end gap-3 bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Date de début</label>
            <input 
              type="date" 
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Date de fin</label>
            <input 
              type="date" 
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
            />
          </div>
          <button 
            type="submit"
            className="px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition"
          >
            Filtrer
          </button>
        </form>
      </div>

      {loading || !reportsData ? (
        <div className="flex justify-center items-center h-64">
          <Loader className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* Top KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <p className="text-sm font-medium text-gray-500 mb-1">Revenu Total HT</p>
              <h3 className="text-2xl font-bold text-gray-900">{formatCurrency(reportsData.totalKPIs.revenueHT)}</h3>
            </div>
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm border-l-4 border-l-green-500">
              <p className="text-sm font-medium text-gray-500 mb-1">Revenu Total TTC</p>
              <h3 className="text-2xl font-bold text-green-600">{formatCurrency(reportsData.totalKPIs.revenueTTC)}</h3>
            </div>
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <p className="text-sm font-medium text-gray-500 mb-1">TVA Collectée</p>
              <h3 className="text-2xl font-bold text-amber-500">{formatCurrency(reportsData.totalKPIs.tva)}</h3>
            </div>
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm border-l-4 border-l-indigo-500">
              <p className="text-sm font-medium text-gray-500 mb-1">Nombre de Factures</p>
              <h3 className="text-2xl font-bold text-indigo-600">{reportsData.totalKPIs.invoiceCount} Générées</h3>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Monthly Revenue Chart */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Revenu Mensuel (6 Derniers Mois)</h2>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={reportsData.monthlyRevenue}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={(val) => `${val/1000}k`} axisLine={false} tickLine={false} />
                    <Tooltip formatter={(value) => formatCurrency(value)} cursor={{fill: 'transparent'}}/>
                    <Legend />
                    <Bar dataKey="RevenueHT" name="Revenu HT" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="RevenueTTC" name="Revenu TTC" fill="#10B981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Invoices per Month */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Volume de Factures</h2>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={reportsData.invoicesPerMonth}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Line type="monotone" dataKey="Count" name="Factures Créées" stroke="#6366F1" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top 5 Clients Pie Chart */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Meilleurs Clients par Revenu</h2>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={reportsData.topClients}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="Revenue"
                      nameKey="name"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {reportsData.topClients.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* TVA Collected Area */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">TVA Collectée</h2>
              <div className="h-72">
                 <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={reportsData.tvaCollected}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={(val) => `${val/1000}k`} axisLine={false} tickLine={false} />
                    <Tooltip formatter={(value) => formatCurrency(value)} cursor={{fill: '#f3f4f6'}}/>
                    <Bar dataKey="TVA" name="Taxe Collectée (TVA)" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
};

export default Reports;
