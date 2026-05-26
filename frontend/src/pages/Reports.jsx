import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  Loader,
  Calendar,
  TrendingUp,
  DollarSign,
  PieChart as PieIcon,
  BarChart3,
  Filter,
  Download,
  Receipt,
  Clock3,
  CheckCircle2,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import api from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { AuthContext } from '../context/AuthContext';
import UpgradeOverlay from '../components/Subscription/UpgradeOverlay';
import Card from '../components/ui/Card';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#0ea5e9', '#8b5cf6'];
const emptyReports = {
  monthlyRevenue: [],
  statusBreakdown: [],
  revenueByClient: [],
  recentActivity: [],
  totalKPIs: {
    revenueTTC: 0,
    invoiceCount: 0,
    paidCount: 0,
    pendingCount: 0,
    averageInvoiceValue: 0,
    monthlyComparison: 0,
  },
};

const copyByLang = {
  fr: {
    title: 'Rapports',
    subtitle: 'Analysez vos revenus et le suivi de vos factures avec une vue claire.',
    startDate: 'Date de début',
    endDate: 'Date de fin',
    filter: 'Filtrer',
    export: 'Exporter en PDF',
    totalRevenue: 'Chiffre d’affaires',
    invoiceCount: 'Nombre de factures',
    paidInvoices: 'Factures payées',
    pendingInvoices: 'Factures en attente',
    averageInvoice: 'Panier moyen',
    monthlyComparison: 'Comparaison mensuelle',
    revenueTrend: 'Évolution du chiffre d’affaires',
    revenueTrendSub: 'Montants HT et TTC par période',
    statusBreakdown: 'Répartition des statuts',
    statusBreakdownSub: 'Vision rapide des factures par statut',
    revenueByClient: 'Chiffre d’affaires par client',
    revenueByClientSub: 'Top clients sur la période sélectionnée',
    recentActivity: 'Activité financière récente',
    noData: 'Aucune donnée disponible pour cette période.',
    amount: 'Montant',
    status: 'Statut',
    client: 'Client',
    date: 'Date',
    monthUp: 'de croissance',
    monthDown: 'vs mois précédent',
  },
  en: {
    title: 'Reports',
    subtitle: 'Analyze your revenue and invoice progress with a clear overview.',
    startDate: 'Start date',
    endDate: 'End date',
    filter: 'Filter',
    export: 'Export PDF',
    totalRevenue: 'Revenue',
    invoiceCount: 'Invoices',
    paidInvoices: 'Paid invoices',
    pendingInvoices: 'Pending invoices',
    averageInvoice: 'Average invoice',
    monthlyComparison: 'Monthly comparison',
    revenueTrend: 'Revenue over time',
    revenueTrendSub: 'Net and gross amounts by period',
    statusBreakdown: 'Status breakdown',
    statusBreakdownSub: 'Quick view of invoice statuses',
    revenueByClient: 'Revenue by client',
    revenueByClientSub: 'Top clients for the selected period',
    recentActivity: 'Recent financial activity',
    noData: 'No data available for this period.',
    amount: 'Amount',
    status: 'Status',
    client: 'Client',
    date: 'Date',
    monthUp: 'growth',
    monthDown: 'vs previous month',
  },
  ar: {
    title: 'التقارير',
    subtitle: 'حلّل الإيرادات ومتابعة الفواتير ضمن لوحة واضحة.',
    startDate: 'تاريخ البداية',
    endDate: 'تاريخ النهاية',
    filter: 'تصفية',
    export: 'تصدير PDF',
    totalRevenue: 'إجمالي الإيرادات',
    invoiceCount: 'عدد الفواتير',
    paidInvoices: 'فواتير مدفوعة',
    pendingInvoices: 'فواتير قيد المتابعة',
    averageInvoice: 'متوسط الفاتورة',
    monthlyComparison: 'مقارنة شهرية',
    revenueTrend: 'تطور الإيرادات',
    revenueTrendSub: 'المبالغ دون أداء ومع الأداء حسب الفترة',
    statusBreakdown: 'توزيع الحالات',
    statusBreakdownSub: 'نظرة سريعة على وضعية الفواتير',
    revenueByClient: 'الإيرادات حسب العميل',
    revenueByClientSub: 'أفضل العملاء خلال الفترة المحددة',
    recentActivity: 'النشاط المالي الأخير',
    noData: 'لا توجد بيانات لهذه الفترة.',
    amount: 'المبلغ',
    status: 'الحالة',
    client: 'العميل',
    date: 'التاريخ',
    monthUp: 'نمو',
    monthDown: 'مقارنة بالشهر السابق',
  },
};

const Reports = () => {
  const { lang } = useLanguage();
  const { user } = useContext(AuthContext);
  const text = copyByLang[lang] || copyByLang.fr;
  const isStarter = user?.subscription?.plan === 'STARTER';
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [reportsData, setReportsData] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const reportRef = useRef(null);

  const fetchReports = useCallback(async (start = startDate, end = endDate) => {
    if (!user || isStarter) return;
    setLoading(true);
    setFetchError(null);
    try {
      const params = {};
      if (start) params.startDate = start;
      if (end) params.endDate = end;
      const response = await api.get('/reports', { params });
      setReportsData(response.data);
    } catch (error) {
      console.error('Error fetching reports', error);
      setReportsData(emptyReports);
      setFetchError(error.response?.data?.message || text.noData);
    } finally {
      setLoading(false);
    }
  }, [endDate, isStarter, startDate, text.noData, user]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleFilter = (e) => {
    e.preventDefault();
    fetchReports(startDate, endDate);
  };

  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    setIsExporting(true);
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#f8fafc',
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const ratio = Math.min(pdfWidth / canvas.width, pdfHeight / canvas.height);
      const imgWidth = canvas.width * ratio;
      const imgHeight = canvas.height * ratio;
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`rapport-${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (error) {
      console.error('PDF export error', error);
    } finally {
      setIsExporting(false);
    }
  };

  const formatCurrency = (value) => `${Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })} TND`;

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-2xl text-white">
        {label ? <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{label}</p> : null}
        {payload.map((entry) => (
          <div key={`${entry.name}-${entry.value}`} className="flex items-center gap-3 mt-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
            <p className="text-sm font-bold">
              <span className="text-slate-400 font-medium">{entry.name}: </span>
              {typeof entry.value === 'number' ? formatCurrency(entry.value) : entry.value}
            </p>
          </div>
        ))}
      </div>
    );
  };

  if (isStarter) return <UpgradeOverlay featureType="reports" />;

  if (loading || !reportsData) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        {fetchError ? (
          <div className="p-6 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-sm font-semibold text-center max-w-sm">
            {fetchError}
          </div>
        ) : (
          <div className="w-12 h-12 border-4 border-indigo-500/10 border-t-indigo-500 rounded-full animate-spin" />
        )}
      </div>
    );
  }

  const kpis = [
    { label: text.totalRevenue, value: reportsData.totalKPIs.revenueTTC, icon: DollarSign, color: 'text-emerald-600' },
    { label: text.invoiceCount, value: reportsData.totalKPIs.invoiceCount, icon: Receipt, color: 'text-indigo-600', raw: true },
    { label: text.paidInvoices, value: reportsData.totalKPIs.paidCount, icon: CheckCircle2, color: 'text-emerald-600', raw: true },
    { label: text.pendingInvoices, value: reportsData.totalKPIs.pendingCount, icon: Clock3, color: 'text-amber-600', raw: true },
    { label: text.averageInvoice, value: reportsData.totalKPIs.averageInvoiceValue, icon: TrendingUp, color: 'text-blue-600' },
    { label: text.monthlyComparison, value: reportsData.totalKPIs.monthlyComparison, icon: BarChart3, color: 'text-slate-700', percent: true },
  ];

  return (
    <div className="max-w-7xl space-y-8 pb-20 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight font-display">{text.title}</h1>
          <p className="text-sm text-slate-500 font-medium">{text.subtitle}</p>
        </div>

        <form onSubmit={handleFilter} className="flex flex-wrap items-end gap-3 w-full lg:w-auto">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ms-1">{text.startDate}</label>
            <div className="relative group">
              <Calendar className="absolute inset-y-0 left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all shadow-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ms-1">{text.endDate}</label>
            <div className="relative group">
              <Calendar className="absolute inset-y-0 left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all shadow-sm"
              />
            </div>
          </div>

          <button type="submit" className="h-[42px] px-6 bg-slate-900 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-indigo-600 transition-all flex items-center gap-2 shadow-lg shadow-slate-100 active:scale-95">
            <Filter className="w-3.5 h-3.5" />
            {text.filter}
          </button>
        </form>
      </div>

      <div ref={reportRef} className="space-y-8">
        {fetchError ? (
          <div className="rounded-2xl border border-rose-100 bg-rose-50 px-5 py-4 text-sm font-semibold text-rose-700">
            {fetchError}
          </div>
        ) : null}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {kpis.map((kpi) => (
            <Card key={kpi.label} className="min-w-0 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2.5 rounded-xl bg-slate-50 ${kpi.color}`}>
                  <kpi.icon className="w-5 h-5" />
                </div>
              </div>
              <p className="mb-1 break-words text-[10px] font-black uppercase tracking-widest text-slate-400">{kpi.label}</p>
              <h3 className="break-words text-xl font-black text-slate-900 font-display sm:text-2xl">
                {kpi.raw ? kpi.value : kpi.percent ? `${Number(kpi.value || 0).toFixed(1)}%` : formatCurrency(kpi.value)}
              </h3>
              {kpi.percent ? (
                <p className="mt-2 text-xs font-semibold text-slate-500">
                  {Number(kpi.value || 0) >= 0 ? text.monthUp : text.monthDown}
                </p>
              ) : null}
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <Card title={text.revenueTrend} subtitle={text.revenueTrendSub} className="p-2">
            {reportsData.monthlyRevenue?.length ? (
              <div className="h-80 min-w-0 overflow-hidden">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={reportsData.monthlyRevenue} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="revenueArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="RevenueTTC" name="TTC" stroke="#6366f1" fill="url(#revenueArea)" strokeWidth={3} />
                    <Area type="monotone" dataKey="RevenueHT" name="HT" stroke="#10b981" fillOpacity={0} strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : <div className="py-16 text-center text-slate-400">{text.noData}</div>}
          </Card>

          <Card title={text.statusBreakdown} subtitle={text.statusBreakdownSub} className="p-2">
            {reportsData.statusBreakdown?.length ? (
              <div className="h-80 min-w-0 overflow-hidden">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={reportsData.statusBreakdown}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={110}
                      paddingAngle={4}
                    >
                      {reportsData.statusBreakdown.map((entry, index) => (
                        <Cell key={`${entry.name}-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : <div className="py-16 text-center text-slate-400">{text.noData}</div>}
          </Card>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <Card title={text.revenueByClient} subtitle={text.revenueByClientSub} className="p-2">
            {reportsData.revenueByClient?.length ? (
              <div className="h-80 min-w-0 overflow-hidden">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={reportsData.revenueByClient} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="revenue" name={text.amount} fill="#0ea5e9" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : <div className="py-16 text-center text-slate-400">{text.noData}</div>}
          </Card>

          <Card title={text.recentActivity} className="p-2">
            {reportsData.recentActivity?.length ? (
              <div className="divide-y divide-slate-100">
                {reportsData.recentActivity.map((item) => (
                  <div key={item.id} className="py-4 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">{item.client}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-slate-500">{new Date(item.createdAt).toLocaleDateString()}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-300" />
                        <span className="text-xs text-slate-500">{item.id.slice(0, 8).toUpperCase()}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-slate-900">{Number(item.amount || 0).toFixed(3)} TND</p>
                      <span className="text-xs text-slate-500">{item.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : <div className="py-16 text-center text-slate-400">{text.noData}</div>}
          </Card>
        </div>
      </div>

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
            <p className="text-xs font-black uppercase tracking-widest text-slate-900">{text.export}</p>
            <p className="text-[10px] font-medium text-slate-400">PDF</p>
          </div>
        </button>
      </div>
    </div>
  );
};

export default Reports;
