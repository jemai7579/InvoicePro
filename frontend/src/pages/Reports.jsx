import React, { useState, useEffect, useRef } from 'react';
import { Loader, Calendar, FileText, TrendingUp, DollarSign, PieChart as PieIcon, BarChart3, Filter, Download } from 'lucide-react';
import api from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import UpgradeOverlay from '../components/Subscription/UpgradeOverlay';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const Reports = () => {
  const { t, lang } = useLanguage();
  const { user } = useContext(AuthContext);
  const isRtl = lang === 'ar';

  if (user?.subscription?.plan === 'STARTER') {
    return <UpgradeOverlay featureType="reports" />;
  }
  const [loading, setLoading] = useState(true);
  const [reportsData, setReportsData] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const reportRef = useRef(null);
  
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
      alert(t('error.failedLoadReports') || 'Failed to load reports');
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

  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    setIsExporting(true);
    
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#f8fafc',
        windowWidth: reportRef.current.scrollWidth,
        windowHeight: reportRef.current.scrollHeight
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgScaledWidth = imgWidth * ratio;
      const imgScaledHeight = imgHeight * ratio;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgScaledWidth, imgScaledHeight);
      pdf.save(`rapport-statistiques-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('PDF Export Error:', error);
      alert('Erreur lors de la génération du PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const formatCurrency = (value) => `${value.toLocaleString(undefined, { maximumFractionDigits: 0 })} TND`;

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-2xl text-white animate-in fade-in zoom-in-95 duration-200">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-3 mt-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || entry.fill }}></div>
              <p className="text-sm font-bold">
                <span className="text-slate-400 font-medium">{entry.name}: </span>
                {typeof entry.value === 'number' ? formatCurrency(entry.value) : entry.value}
              </p>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading || !reportsData) return (
    <div className="flex flex-col items-center justify-center py-32 gap-4">
      <div className="w-12 h-12 border-4 border-indigo-500/10 border-t-indigo-500 rounded-full animate-spin"></div>
      <p className="text-slate-400 font-black uppercase tracking-widest text-[10px] animate-pulse">Analyse des données en cours...</p>
    </div>
  );

  return (
    <div className="max-w-7xl space-y-8 pb-20 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight font-display">{t('reports.title')}</h1>
          <p className="text-sm text-slate-500 font-medium">{t('reports.subtitle')}</p>
        </div>
        
        <form onSubmit={handleFilter} className="flex flex-wrap items-end gap-3 w-full lg:w-auto">
          <div className="flex-1 lg:flex-initial space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ms-1">{t('reports.startDate')}</label>
            <div className="relative group">
               <Calendar className="absolute inset-y-0 left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
               <input 
                type="date" 
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all shadow-sm" 
              />
            </div>
          </div>
          <div className="flex-1 lg:flex-initial space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ms-1">{t('reports.endDate')}</label>
            <div className="relative group">
               <Calendar className="absolute inset-y-0 left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
               <input 
                type="date" 
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all shadow-sm" 
              />
            </div>
          </div>
          <button 
            type="submit"
            className="h-[42px] px-6 bg-slate-900 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-indigo-600 transition-all flex items-center gap-2 shadow-lg shadow-slate-100 active:scale-95"
          >
            <Filter className="w-3.5 h-3.5" />
            {t('common.filter')}
          </button>
        </form>
      </div>

      <div ref={reportRef} className="space-y-8 p-4 rounded-[2rem]">
        
        {/* Top KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: t('reports.kpi.revenueHT'), val: reportsData.totalKPIs.revenueHT, icon: TrendingUp, color: 'text-indigo-600' },
            { label: t('reports.kpi.revenueTTC'), val: reportsData.totalKPIs.revenueTTC, icon: DollarSign, color: 'text-emerald-600', accent: 'border-b-4 border-b-emerald-500' },
            { label: t('reports.kpi.tva'), val: reportsData.totalKPIs.tva, icon: BarChart3, color: 'text-amber-600' },
            { label: t('reports.kpi.invoiceCount'), val: `${reportsData.totalKPIs.invoiceCount}`, icon: FileText, color: 'text-slate-600', accent: 'border-b-4 border-b-indigo-500' }
          ].map((kpi, i) => (
            <div key={i} className={`bg-white p-6 rounded-[1.8rem] border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow ${kpi.accent || ''}`}>
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2.5 rounded-xl bg-slate-50 group-hover:scale-110 transition-transform ${kpi.color}`}>
                  <kpi.icon className="w-5 h-5" />
                </div>
                <div className="h-1 w-8 bg-slate-100 rounded-full" />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{kpi.label}</p>
              <h3 className={`text-2xl font-black text-slate-900 leading-none font-display`}>
                {typeof kpi.val === 'number' ? formatCurrency(kpi.val) : kpi.val}
              </h3>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Monthly Revenue Chart */}
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 group">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-lg font-black text-slate-900 font-display leading-none">{t('reports.charts.revenue.title')}</h2>
                <p className="text-xs text-slate-400 font-medium mt-1.5">{t('reports.charts.revenue.subtitle')}</p>
              </div>
              <div className="p-2 bg-slate-50 rounded-xl group-hover:rotate-12 transition-transform"><BarChart3 className="w-5 h-5 text-indigo-600" /></div>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={reportsData.monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}}
                    dy={10}
                  />
                  <YAxis 
                    tickFormatter={(val) => `${val/1000}k`} 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}}
                    dx={-10}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{fill: '#f8fafc'}}/>
                  <Legend iconType="circle" wrapperStyle={{paddingTop: 20, fontSize: 12, fontWeight: 700}} />
                  <Bar dataKey="RevenueHT" name={t('reports.kpi.revenueHT')} fill="#6366f1" radius={[6, 6, 0, 0]} barSize={20} />
                  <Bar dataKey="RevenueTTC" name={t('reports.kpi.revenueTTC')} fill="#10b981" radius={[6, 6, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Volume of Invoices - Area Chart */}
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 group">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-lg font-black text-slate-900 font-display leading-none">{t('reports.charts.volume.title')}</h2>
                <p className="text-xs text-slate-400 font-medium mt-1.5">{t('reports.charts.volume.subtitle')}</p>
              </div>
              <div className="p-2 bg-slate-50 rounded-xl group-hover:rotate-12 transition-transform"><FileText className="w-5 h-5 text-indigo-600" /></div>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={reportsData.invoicesPerMonth}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}}
                    dx={-10}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="Count" 
                    name={t('nav.invoices')} 
                    stroke="#6366f1" 
                    strokeWidth={4} 
                    fillOpacity={1} 
                    fill="url(#colorCount)" 
                    activeDot={{r: 8, stroke: '#fff', strokeWidth: 4, shadow: '0 4px 6px rgba(0,0,0,0.1)'}} 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top 5 Clients */}
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 group">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-lg font-black text-slate-900 font-display leading-none">{t('reports.charts.clients.title')}</h2>
                <p className="text-xs text-slate-400 font-medium mt-1.5">{t('reports.charts.clients.subtitle')}</p>
              </div>
              <div className="p-2 bg-slate-50 rounded-xl group-hover:rotate-12 transition-transform"><PieIcon className="w-5 h-5 text-indigo-600" /></div>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={reportsData.topClients}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="Revenue"
                    nameKey="name"
                  >
                    {reportsData.topClients.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(255,255,255,0.2)" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" layout="vertical" align="right" verticalAlign="middle" wrapperStyle={{fontSize: 12, fontWeight: 700}} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* TVA Collected Area */}
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 group">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-lg font-black text-slate-900 font-display leading-none">{t('reports.charts.tva.title')}</h2>
                <p className="text-xs text-slate-400 font-medium mt-1.5">{t('reports.charts.tva.subtitle')}</p>
              </div>
              <div className="p-2 bg-slate-50 rounded-xl group-hover:rotate-12 transition-transform"><BarChart3 className="w-5 h-5 text-amber-500" /></div>
            </div>
            <div className="h-72">
               <ResponsiveContainer width="100%" height="100%">
                <BarChart data={reportsData.tvaCollected}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}}
                    dy={10}
                  />
                  <YAxis 
                    tickFormatter={(val) => `${val/1000}k`} 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}}
                    dx={-10}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{fill: '#fefce8'}}/>
                  <Bar dataKey="TVA" name={t('reports.kpi.tva')} fill="#f59e0b" radius={[6, 6, 0, 0]} barSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      </div>
      
      {/* Export Action */}
      <div className="flex justify-center pt-4">
         <button 
          onClick={handleExportPDF}
          disabled={isExporting}
          className="flex items-center gap-3 px-10 py-5 bg-white border border-slate-100 rounded-[2rem] shadow-sm hover:shadow-xl hover:border-indigo-100 hover:-translate-y-1 transition-all group disabled:opacity-50"
         >
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
              {isExporting ? <Loader className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
            </div>
            <div className="text-left">
               <p className="text-xs font-black uppercase tracking-widest text-slate-900">{t('reports.export.title')}</p>
               <p className="text-[10px] font-medium text-slate-400">{t('reports.export.subtitle')}</p>
            </div>
         </button>
      </div>
    </div>
  );
};

export default Reports;
