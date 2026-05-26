import React, { useEffect, useMemo, useState } from 'react';
import {
  Plus,
  Trash2,
  X,
  Loader,
  PlusCircle,
  FileText,
  Send,
  Download,
  Search,
  CheckCircle2,
  Briefcase,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { getClientNumber, getDevisNumber, sanitizeBusinessNumberForFileName } from '../utils/businessNumbers';
import { buildProductLineDescription, createLineItem } from '../utils/lineItems';

const statusMeta = {
  PENDING: { variant: 'pending', fr: 'Envoyé', en: 'Sent', ar: 'مرسل' },
  ACCEPTED: { variant: 'success', fr: 'Accepté', en: 'Accepted', ar: 'مقبول' },
  REJECTED: { variant: 'rejected', fr: 'Refusé', en: 'Refused', ar: 'مرفوض' },
};

const copyByLang = {
  fr: {
    title: 'Mes devis',
    subtitle: 'Transformez un projet accepté en proposition financière claire.',
    create: 'Nouveau devis',
    search: 'Rechercher un devis...',
    empty: 'Aucun devis pour le moment.',
    quoteId: 'Référence devis',
    client: 'Client',
    date: 'Date',
    status: 'Statut',
    total: 'Total TTC',
    actions: 'Actions',
    sendEmail: 'Envoyer',
    download: 'PDF',
    convert: 'Créer une facture',
    converted: 'Facture créée',
    delete: 'Supprimer',
    modalTitle: 'Créer un devis',
    devisNumber: 'Numéro de devis',
    selectClient: 'Sélectionner un client',
    selectProduct: 'Sélectionner un produit',
    customProduct: 'Produit personnalisé',
    projectRef: 'Référence projet / bon de commande',
    lines: 'Prestations',
    addLine: 'Ajouter une ligne',
    description: 'Service / article',
    quantity: 'Quantité',
    unitPrice: 'Prix unitaire HT',
    tva: 'TVA',
    subtotal: 'Total HT',
    totalTva: 'Total TVA',
    grandTotal: 'Total TTC estimé',
    save: 'Enregistrer le devis',
    cancel: 'Annuler',
    prefillTitle: 'Projet prêt à être transformé',
    prefillSubtitle: 'Le devis peut être préparé à partir du projet accepté.',
    statuses: {
      DRAFT: 'Brouillon',
      PENDING: 'Envoyé',
      ACCEPTED: 'Accepté',
      REJECTED: 'Refusé',
    },
  },
  en: {
    title: 'My quotes',
    subtitle: 'Turn an accepted project into a clear financial offer.',
    create: 'New quote',
    search: 'Search a quote...',
    empty: 'No quote yet.',
    quoteId: 'Quote reference',
    client: 'Client',
    date: 'Date',
    status: 'Status',
    total: 'Total incl. VAT',
    actions: 'Actions',
    sendEmail: 'Send',
    download: 'PDF',
    convert: 'Create invoice',
    converted: 'Invoice created',
    delete: 'Delete',
    modalTitle: 'Create a quote',
    devisNumber: 'Quote number',
    selectClient: 'Select a client',
    selectProduct: 'Select a product',
    customProduct: 'Custom product',
    projectRef: 'Project / order reference',
    lines: 'Items',
    addLine: 'Add line',
    description: 'Service / item',
    quantity: 'Quantity',
    unitPrice: 'Unit price excl. VAT',
    tva: 'VAT',
    subtotal: 'Total excl. VAT',
    totalTva: 'VAT total',
    grandTotal: 'Estimated total incl. VAT',
    save: 'Save quote',
    cancel: 'Cancel',
    prefillTitle: 'Project ready to convert',
    prefillSubtitle: 'This quote can be prepared from the accepted project.',
    statuses: {
      DRAFT: 'Draft',
      PENDING: 'Sent',
      ACCEPTED: 'Accepted',
      REJECTED: 'Refused',
    },
  },
  ar: {
    title: 'عروضي',
    subtitle: 'حوّل المشروع المقبول إلى عرض مالي واضح.',
    create: 'عرض جديد',
    search: 'ابحث عن عرض...',
    empty: 'لا توجد عروض حالياً.',
    quoteId: 'مرجع العرض',
    client: 'العميل',
    date: 'التاريخ',
    status: 'الحالة',
    total: 'الإجمالي مع الأداء',
    actions: 'الإجراءات',
    sendEmail: 'إرسال',
    download: 'PDF',
    convert: 'إنشاء فاتورة',
    converted: 'تم إنشاء الفاتورة',
    delete: 'حذف',
    modalTitle: 'إنشاء عرض سعر',
    devisNumber: 'رقم عرض السعر',
    selectClient: 'اختر عميلاً',
    selectProduct: 'اختر منتجا',
    customProduct: 'منتج مخصص',
    projectRef: 'مرجع المشروع / الطلب',
    lines: 'الخدمات',
    addLine: 'إضافة سطر',
    description: 'الخدمة / البند',
    quantity: 'الكمية',
    unitPrice: 'سعر الوحدة دون أداء',
    tva: 'الأداء',
    subtotal: 'الإجمالي دون أداء',
    totalTva: 'إجمالي الأداء',
    grandTotal: 'الإجمالي التقديري',
    save: 'حفظ العرض',
    cancel: 'إلغاء',
    prefillTitle: 'المشروع جاهز للتحويل',
    prefillSubtitle: 'يمكن إعداد العرض اعتمادًا على المشروع المقبول.',
    statuses: {
      DRAFT: 'مسودة',
      PENDING: 'مرسل',
      ACCEPTED: 'مقبول',
      REJECTED: 'مرفوض',
    },
  },
};

const Devis = () => {
  const { lang } = useLanguage();
  const text = copyByLang[lang] || copyByLang.fr;
  const navigate = useNavigate();
  const location = useLocation();
  const prefilledProject = location.state?.project;

  const [devisList, setDevisList] = useState([]);
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [tvaRates, setTvaRates] = useState([
    { rate: 19, label: 'Standard' },
    { rate: 13, label: 'Spécial' },
    { rate: 7, label: 'Réduit' },
    { rate: 0, label: 'Exonéré' },
  ]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clientId, setClientId] = useState('');
  const [status, setStatus] = useState('PENDING');
  const [lines, setLines] = useState([createLineItem()]);
  const [searchTerm, setSearchTerm] = useState('');
  const [projectReference, setProjectReference] = useState('');

  const fetchData = async () => {
    try {
      const [devisRes, clientsRes, productsRes, tvaRatesRes] = await Promise.all([
        api.get('/devis'),
        api.get('/clients'),
        api.get('/products'),
        api.get('/tva-rates').catch(() => ({ data: [] })),
      ]);
      setDevisList(devisRes.data);
      setClients(clientsRes.data);
      setProducts(productsRes.data || []);
      if (Array.isArray(tvaRatesRes.data) && tvaRatesRes.data.length) setTvaRates(tvaRatesRes.data);
    } catch (error) {
      console.error('Error fetching data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (prefilledProject) {
      setClientId(prefilledProject.clientId || '');
      setStatus('PENDING');
      setProjectReference(prefilledProject.projectReference || prefilledProject.title || '');
      setLines([
        createLineItem({
          description: prefilledProject.title || '',
          quantity: 1,
          unitPrice: Number(prefilledProject.optionalBudget || 0),
          tvaRate: tvaRates[0]?.rate ?? 19,
        }),
      ]);
      setIsModalOpen(true);
    }
  }, [prefilledProject, tvaRates]);

  const openModal = () => {
    setClientId('');
    setStatus('PENDING');
    setProjectReference('');
    setLines([createLineItem({ tvaRate: tvaRates[0]?.rate ?? 19 })]);
    setIsModalOpen(true);
  };

  const handleAddLine = () => setLines((prev) => [...prev, createLineItem({ tvaRate: tvaRates[0]?.rate ?? 19 })]);
  const handleRemoveLine = (lineId) => setLines((prev) => prev.filter((line) => line.id !== lineId));
  const handleLineChange = (lineId, field, value) => {
    setLines((prev) => prev.map((line) => (line.id === lineId ? { ...line, [field]: value } : line)));
  };
  const handleProductSelect = (lineId, productId) => {
    if (!productId) {
      handleLineChange(lineId, 'productId', '');
      return;
    }
    const product = products.find((item) => item.id === productId);
    if (!product) return;
    setLines((prev) =>
      prev.map((line) =>
        line.id === lineId
          ? {
              ...line,
              productId,
              description: buildProductLineDescription(product),
              unitPrice: Number(product.priceHT || 0),
              tvaRate: Number(product.tvaRate || 0),
            }
          : line
      )
    );
  };

  const subtotalHT = lines.reduce((acc, line) => acc + (Number(line.quantity) * Number(line.unitPrice)), 0);
  const totalTVA = lines.reduce((acc, line) => acc + (Number(line.quantity) * Number(line.unitPrice) * (Number(line.tvaRate) / 100)), 0);
  const totalTTC = subtotalHT + totalTVA + 1;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!clientId) {
      alert(text.selectClient);
      return;
    }
    if (lines.length === 0 || lines.some((line) => !line.description.trim())) {
      alert(text.lines);
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/devis', {
        clientId,
        status,
        note: projectReference ? `Projet: ${projectReference}` : null,
        lines: lines.map((line) => Object.fromEntries(Object.entries(line).filter(([key]) => key !== 'id'))),
      });
      await fetchData();
      setIsModalOpen(false);
      navigate('/devis', { replace: true, state: {} });
    } catch (error) {
      console.error('Error saving quote', error);
      alert(error.response?.data?.message || 'Failed to save quote');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(`${text.delete} ?`)) return;
    try {
      await api.delete(`/devis/${id}`);
      fetchData();
    } catch (error) {
      console.error('Error deleting quote', error);
      alert('Failed to delete quote');
    }
  };

  const handleSendEmail = async (id) => {
    try {
      await api.post(`/devis/${id}/send-email`);
      fetchData();
    } catch (error) {
      console.error('Error sending quote email', error);
      alert(error.response?.data?.message || 'Failed to send email');
    }
  };

  const handleDownloadPdf = async (devis) => {
    try {
      const response = await api.get(`/devis/${devis.id}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `devis-${sanitizeBusinessNumberForFileName(getDevisNumber(devis))}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error downloading quote PDF', error);
      alert('Failed to download PDF');
    }
  };

  const handleConvertToInvoice = async (id) => {
    if (!window.confirm(text.convert)) return;
    try {
      await api.post(`/devis/${id}/convert`);
      navigate('/invoices');
    } catch (error) {
      console.error('Error converting quote', error);
      alert(error.response?.data?.message || 'Failed to convert to invoice');
    }
  };

  const filteredDevis = useMemo(() => (
    devisList.filter((devis) =>
      [devis.number, devis.id, devis.client?.name, devis.note]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  ), [devisList, searchTerm]);

  return (
    <div className="pb-12 animate-in fade-in duration-500 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-2xl font-black text-slate-900 font-display tracking-tight">{text.title}</h2>
          <p className="text-sm text-slate-500 font-medium">{text.subtitle}</p>
        </div>
        <Button onClick={openModal} icon={Plus}>{text.create}</Button>
      </div>

      {prefilledProject && (
        <Card className="border-indigo-100 bg-indigo-50/40">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white text-indigo-600 flex items-center justify-center shadow-sm">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">{text.prefillTitle}</h3>
                <p className="text-sm text-slate-600">{text.prefillSubtitle}</p>
                <p className="text-xs text-slate-500 mt-2">{prefilledProject.title} · {prefilledProject.projectReference}</p>
              </div>
            </div>
            <Button variant="secondary" onClick={() => setIsModalOpen(true)}>{text.create}</Button>
          </div>
        </Card>
      )}

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          <input
            type="text"
            placeholder={text.search}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm placeholder:text-slate-300"
          />
        </div>
        <div className="px-5 py-3 bg-indigo-50/50 rounded-2xl border border-indigo-100/30 flex items-center justify-center">
          <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest leading-none">
            {filteredDevis.length}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 bg-white rounded-[2rem] border border-slate-100 shadow-sm">
          <div className="w-10 h-10 border-4 border-indigo-500/10 border-t-indigo-500 rounded-full animate-spin mb-4" />
        </div>
      ) : (
        <Card noPadding className="border-none shadow-sm bg-transparent md:bg-white overflow-hidden">
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-left">
              <thead className="bg-slate-50/50 text-slate-400 text-[10px] font-black tracking-widest uppercase">
                <tr>
                  <th className="px-8 py-5">{text.quoteId}</th>
                  <th className="px-8 py-5">{text.client}</th>
                  <th className="px-8 py-5">{text.projectRef}</th>
                  <th className="px-8 py-5">{text.date}</th>
                  <th className="px-8 py-5">{text.status}</th>
                  <th className="px-8 py-5 text-end">{text.total}</th>
                  <th className="px-8 py-5 text-right">{text.actions}</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-50">
                {filteredDevis.length > 0 ? filteredDevis.map((devis) => {
                  const meta = statusMeta[devis.status] || statusMeta.PENDING;
                  const label = meta[lang] || meta.fr;
                  const alreadyConverted = Boolean(devis.invoice);

                  return (
                    <tr key={devis.id} className="hover:bg-slate-50/50 transition-all group">
                      <td className="px-8 py-6 text-sm font-bold text-slate-900">{getDevisNumber(devis)}</td>
                      <td className="px-8 py-6 text-sm font-bold text-slate-700">{devis.client?.name || '-'}</td>
                      <td className="px-8 py-6 text-xs text-slate-500">{devis.note?.replace('Projet: ', '') || '—'}</td>
                      <td className="px-8 py-6 text-xs font-medium text-slate-400">{new Date(devis.createdAt).toLocaleDateString()}</td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2">
                          <Badge variant={meta.variant}>{label}</Badge>
                          {alreadyConverted && <Badge variant="success">{text.converted}</Badge>}
                        </div>
                      </td>
                      <td className="px-8 py-6 text-end text-sm font-black text-slate-900">
                        {Number(devis.netToPay || 0).toLocaleString(undefined, { minimumFractionDigits: 3 })} <span className="text-[10px] text-slate-400 font-bold">TND</span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleSendEmail(devis.id)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-xl shadow-sm transition-all border border-transparent hover:border-slate-100" title={text.sendEmail}>
                            <Send className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDownloadPdf(devis)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-white rounded-xl shadow-sm transition-all border border-transparent hover:border-slate-100" title={text.download}>
                            <Download className="w-4 h-4" />
                          </button>
                          {!alreadyConverted && devis.status === 'ACCEPTED' && (
                            <button onClick={() => handleConvertToInvoice(devis.id)} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-white rounded-xl shadow-sm transition-all border border-transparent hover:border-slate-100" title={text.convert}>
                              <FileText className="w-4 h-4" />
                            </button>
                          )}
                          <button onClick={() => handleDelete(devis.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-white rounded-xl shadow-sm transition-all border border-transparent hover:border-slate-100" title={text.delete}>
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan="7" className="px-8 py-20 text-center text-slate-400">{text.empty}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="md:hidden space-y-4 px-4 pb-4">
            {filteredDevis.length > 0 ? filteredDevis.map((devis) => {
              const meta = statusMeta[devis.status] || statusMeta.PENDING;
              const label = meta[lang] || meta.fr;
              const alreadyConverted = Boolean(devis.invoice);

              return (
                <div key={devis.id} className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 flex flex-col gap-4">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{text.quoteId}</p>
                      <h4 className="text-sm font-bold text-slate-900">{getDevisNumber(devis)}</h4>
                      <p className="text-xs text-slate-500 mt-1">{devis.client?.name || '-'}</p>
                    </div>
                    <Badge variant={meta.variant}>{label}</Badge>
                  </div>

                  <div className="text-xs text-slate-500 space-y-1">
                    <p><span className="font-bold text-slate-900">{text.projectRef}:</span> {devis.note?.replace('Projet: ', '') || '—'}</p>
                    <p><span className="font-bold text-slate-900">{text.total}:</span> {Number(devis.netToPay || 0).toFixed(3)} TND</p>
                    {alreadyConverted ? <p className="text-emerald-600 font-bold">{text.converted}</p> : null}
                  </div>

                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm" onClick={() => handleDownloadPdf(devis)} icon={Download}>{text.download}</Button>
                    {!alreadyConverted && devis.status === 'ACCEPTED' && (
                      <Button size="sm" onClick={() => handleConvertToInvoice(devis.id)} icon={CheckCircle2}>{text.convert}</Button>
                    )}
                  </div>
                </div>
              );
            }) : (
              <div className="py-12 text-center text-slate-400 text-sm font-medium italic bg-white rounded-3xl border border-dashed border-slate-200">
                {text.empty}
              </div>
            )}
          </div>
        </Card>
      )}

      {isModalOpen && (
        /*
         * Backdrop: overflow-hidden (NOT overflow-y-auto) so the modal
         * handles its own internal scroll — no viewport blowout.
         * items-center + p-3 centers and gives minimal breathing room
         * on every screen size, including 320 px.
         */
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-slate-900/50 backdrop-blur-sm p-3 sm:p-5"
          onClick={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false); }}
        >
          {/*
           * Modal shell — constrained height via max-h using dvh units
           * (accounts for mobile browser chrome) with a vh fallback.
           * flex-col so header + scrollable body + footer stack cleanly.
           */}
          <div
            className="bg-white rounded-2xl sm:rounded-[2rem] shadow-2xl w-full max-w-4xl flex flex-col overflow-hidden"
            style={{ maxHeight: 'min(calc(100dvh - 1.5rem), calc(100vh - 1.5rem))' }}
          >

            {/* ── Header — flex-shrink-0 keeps it always visible ── */}
            <div className="flex-shrink-0 flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100">
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                {text.modalTitle}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/*
             * Body — flex-1 + min-h-0 is the critical fix.
             * Without min-h-0, a flex child's min-height defaults to
             * "auto" (its content size) which defeats overflow-y-auto.
             * overscroll-contain prevents the page from scrolling when
             * the user reaches the top/bottom of the modal.
             */}
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
              <form id="devis-form" className="p-4 sm:p-6 space-y-5" onSubmit={handleSubmit}>

                {/* Client + Status */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 p-3 sm:p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
                      {text.selectClient} *
                    </label>
                    <select
                      required
                      value={clientId}
                      onChange={(e) => setClientId(e.target.value)}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                    >
                      <option value="" disabled>-- {text.selectClient} --</option>
                      {clients.map((client) => (
                        <option key={client.id} value={client.id}>
                          {`${getClientNumber(client)} - ${client.name}`}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
                      {text.status}
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                    >
                      <option value="PENDING">{text.statuses.PENDING}</option>
                      <option value="ACCEPTED">{text.statuses.ACCEPTED}</option>
                      <option value="REJECTED">{text.statuses.REJECTED}</option>
                    </select>
                  </div>
                </div>

                {/* Project reference */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
                    {text.projectRef}
                  </label>
                  <input
                    type="text"
                    value={projectReference}
                    onChange={(e) => setProjectReference(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>

                {/* ── Line items ── */}
                <div>
                  <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">
                    {text.lines}
                  </p>

                  <div className="space-y-3">
                    {lines.map((line, index) => (
                      <div
                        key={line.id}
                        className="border border-slate-200 rounded-2xl bg-white overflow-hidden"
                      >
                        {/* Line card header */}
                        <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-b border-slate-100">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            {text.lines} {index + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveLine(line.id)}
                            disabled={lines.length === 1}
                            className="p-1.5 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="p-3 sm:p-4 space-y-3">
                          {/* Product selector — full width */}
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wide">
                              {text.customProduct}
                            </label>
                            <select
                              value={line.productId || ''}
                              onChange={(e) => handleProductSelect(line.id, e.target.value)}
                              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                            >
                              <option value="">{text.customProduct}</option>
                              {products.map((product) => (
                                <option key={product.id} value={product.id}>
                                  {`${product.name}${product.code ? ` (${product.code})` : ''}`}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Description — full width */}
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wide">
                              {text.description} *
                            </label>
                            <input
                              type="text"
                              required
                              placeholder={text.description}
                              value={line.description}
                              onChange={(e) => handleLineChange(line.id, 'description', e.target.value)}
                              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                            />
                          </div>

                          {/*
                           * Qty / Price / TVA / Total:
                           * 2-col on mobile (≤ 639 px), 4-col on sm+.
                           * This keeps every field readable at 320 px.
                           */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wide">
                                {text.quantity}
                              </label>
                              <input
                                type="number"
                                min="1"
                                step="0.01"
                                required
                                value={line.quantity}
                                onChange={(e) =>
                                  handleLineChange(line.id, 'quantity', parseFloat(e.target.value) || 0)
                                }
                                className="w-full px-2 sm:px-3 py-2 border border-slate-200 rounded-xl text-sm text-center font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wide">
                                {text.unitPrice}
                              </label>
                              <input
                                type="number"
                                min="0"
                                step="0.001"
                                required
                                value={line.unitPrice}
                                onChange={(e) =>
                                  handleLineChange(line.id, 'unitPrice', parseFloat(e.target.value) || 0)
                                }
                                className="w-full px-2 sm:px-3 py-2 border border-slate-200 rounded-xl text-sm text-right font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wide">
                                {text.tva}
                              </label>
                              <select
                                value={line.tvaRate}
                                onChange={(e) =>
                                  handleLineChange(line.id, 'tvaRate', parseFloat(e.target.value))
                                }
                                className="w-full px-2 sm:px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                              >
                                {tvaRates.map((item) => (
                                  <option key={item.id || item.rate} value={item.rate}>{item.rate} %</option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wide">
                                {text.subtotal}
                              </label>
                              <div className="px-2 sm:px-3 py-2 bg-indigo-50 border border-indigo-100 rounded-xl text-sm font-black text-indigo-700 text-right">
                                {(Number(line.quantity) * Number(line.unitPrice)).toLocaleString(
                                  undefined,
                                  { minimumFractionDigits: 3 }
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add line */}
                  <button
                    type="button"
                    onClick={handleAddLine}
                    className="mt-3 w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-indigo-300 text-sm font-bold text-indigo-600 bg-indigo-50/50 hover:bg-indigo-50 hover:border-indigo-400 transition-all"
                  >
                    <PlusCircle className="h-4 w-4 shrink-0" />
                    {text.addLine}
                  </button>
                </div>
              </form>
            </div>

            {/*
             * Footer — flex-shrink-0 keeps it permanently visible
             * (never scrolled off-screen).
             * Totals: 3-column grid on mobile → inline on sm+.
             * Buttons: stacked on mobile → row on sm+.
             */}
            <div className="flex-shrink-0 border-t border-slate-100 bg-slate-50/80 px-4 sm:px-6 py-3 sm:py-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

                {/* Totals */}
                <div className="grid grid-cols-3 gap-2 sm:flex sm:items-center sm:gap-6">
                  <div className="text-center sm:text-left">
                    <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                      {text.subtotal}
                    </p>
                    <p className="text-xs sm:text-sm font-black text-slate-900">
                      {subtotalHT.toLocaleString(undefined, { minimumFractionDigits: 3 })}
                    </p>
                  </div>
                  <div className="text-center sm:text-left">
                    <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                      {text.totalTva}
                    </p>
                    <p className="text-xs sm:text-sm font-black text-slate-900">
                      {totalTVA.toLocaleString(undefined, { minimumFractionDigits: 3 })}
                    </p>
                  </div>
                  <div className="text-center sm:text-left">
                    <p className="text-[9px] sm:text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-0.5">
                      {text.grandTotal}
                    </p>
                    <p className="text-sm sm:text-base font-black text-indigo-600">
                      {totalTTC.toLocaleString(undefined, { minimumFractionDigits: 3 })}
                    </p>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 sm:flex-none flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2.5 bg-white text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    {text.cancel}
                  </button>
                  <Button
                    type="submit"
                    form="devis-form"
                    loading={isSubmitting}
                    className="flex-1 sm:flex-none"
                  >
                    {text.save}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Devis;
