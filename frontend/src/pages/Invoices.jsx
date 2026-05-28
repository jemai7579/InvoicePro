import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileCode2,
  Loader,
  Plus,
  Pencil,
  Receipt,
  Send,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react';
import api from '../services/api';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { useLanguage } from '../context/LanguageContext';
import { AuthContext } from '../context/AuthContext';
import { getClientNumber, getInvoiceNumber, sanitizeBusinessNumberForFileName } from '../utils/businessNumbers';
import { buildProductLineDescription, createLineItem } from '../utils/lineItems';

const COPY = {
  fr: {
    title: 'Factures',
    subtitle: 'Preparez, signez et envoyez vos factures a TTN sans perdre le fil.',
    newInvoice: 'Nouvelle facture',
    helperTitle: 'Comprendre le workflow TTN',
    helperLines: [
      'Votre facture est encore en preparation.',
      'Apres validation, InvoicePro genere le fichier XML TEIF.',
      'Ensuite, la facture doit etre signee electroniquement.',
      'Apres signature, elle sera envoyee a TTN pour validation.',
      'Une facture est fiscalement valide uniquement apres acceptation TTN.',
    ],
    noData: 'Aucune facture pour le moment.',
    client: 'Client',
    amount: 'Montant',
    status: 'Statut',
    nextAction: 'Prochaine action',
    lastUpdate: 'Derniere mise a jour',
    ttnReference: 'Reference TTN',
    rejectionReason: 'Motif de rejet',
    actions: 'Actions',
    draftPdf: 'PDF brouillon',
    finalPdf: 'Facture finale',
    xml: 'XML TEIF',
    sendEmail: 'Envoyer',
    delete: 'Supprimer',
    createTitle: 'Creer une facture',
    createSubtitle: 'Commencez par un brouillon, puis avancez etape par etape jusqu a la validation TTN.',
    invoiceNumber: 'Numero de facture',
    selectClient: 'Client',
    selectProduct: 'Selectionner un produit',
    customProduct: 'Produit personnalise',
    statusLabel: 'Statut initial',
    addLine: 'Ajouter une ligne',
    lineDescription: 'Description',
    quantity: 'Quantite',
    unitPrice: 'Prix unitaire',
    tva: 'TVA',
    total: 'Total',
    subtotal: 'Total HT',
    totalTva: 'Total TVA',
    stampDuty: 'Timbre fiscal',
    totalTtc: 'Net a payer',
    cancel: 'Annuler',
    create: 'Creer la facture',
    validateInvoice: 'Valider la facture',
    generateTeif: 'Generer XML TEIF',
    signTeif: 'Signer electroniquement',
    submitTtn: 'Envoyer a TTN',
    configureSignature: 'Configurer la signature',
    configureTtn: 'Configurer TTN',
    checkTtn: 'Verifier statut TTN',
    correctInvoice: 'Voir les erreurs et corriger',
    downloadFinal: 'Telecharger facture finale',
    paymentMethod: 'Mode de paiement',
    cash: 'Espece',
    testAccept: 'Simuler acceptance',
    testReject: 'Simuler rejet',
    validateError: 'Veuillez corriger les champs obligatoires.',
  },
  en: {
    title: 'Invoices',
    subtitle: 'Prepare, sign and send invoices to TTN with a guided workflow.',
    newInvoice: 'New invoice',
    helperTitle: 'Understand the TTN workflow',
    helperLines: [
      'Your invoice is still being prepared.',
      'After validation, InvoicePro generates the TEIF XML file.',
      'Then the invoice must be electronically signed.',
      'After signature, it will be sent to TTN for validation.',
      'An invoice is fiscally valid only after TTN acceptance.',
    ],
    noData: 'No invoices yet.',
    client: 'Client',
    amount: 'Amount',
    status: 'Status',
    nextAction: 'Next action',
    lastUpdate: 'Last update',
    ttnReference: 'TTN reference',
    rejectionReason: 'Rejection reason',
    actions: 'Actions',
    draftPdf: 'Draft PDF',
    finalPdf: 'Final invoice',
    xml: 'TEIF XML',
    sendEmail: 'Send email',
    delete: 'Delete',
    createTitle: 'Create invoice',
    createSubtitle: 'Start with a draft, then move step by step until TTN validation.',
    invoiceNumber: 'Invoice number',
    selectClient: 'Client',
    selectProduct: 'Select a product',
    customProduct: 'Custom product',
    statusLabel: 'Initial status',
    addLine: 'Add line',
    lineDescription: 'Description',
    quantity: 'Quantity',
    unitPrice: 'Unit price',
    tva: 'VAT',
    total: 'Total',
    subtotal: 'Subtotal',
    totalTva: 'VAT total',
    stampDuty: 'Stamp duty',
    totalTtc: 'Net to pay',
    cancel: 'Cancel',
    create: 'Create invoice',
    validateInvoice: 'Validate invoice',
    generateTeif: 'Generate TEIF XML',
    signTeif: 'Sign electronically',
    submitTtn: 'Submit to TTN',
    configureSignature: 'Configure signature',
    configureTtn: 'Configure TTN',
    checkTtn: 'Check TTN status',
    correctInvoice: 'Review errors and correct',
    downloadFinal: 'Download final invoice',
    paymentMethod: 'Payment method',
    cash: 'Cash',
    testAccept: 'Simulate acceptance',
    testReject: 'Simulate rejection',
    validateError: 'Please fix the required fields.',
  },
  ar: {
    title: 'الفواتير',
    subtitle: 'جهز ووقع وارسل الفواتير الى TTN بخطوات واضحة.',
    newInvoice: 'فاتورة جديدة',
    helperTitle: 'فهم مسار TTN',
    helperLines: [
      'فاتورتك ما زالت قيد الاعداد.',
      'بعد التحقق يقوم InvoicePro بتوليد ملف XML TEIF.',
      'بعد ذلك يجب توقيع الفاتورة الكترونيا.',
      'بعد التوقيع سيتم ارسالها الى TTN للتحقق.',
      'تصبح الفاتورة صالحة جبائيا فقط بعد قبول TTN.',
    ],
    noData: 'لا توجد فواتير حاليا.',
    client: 'العميل',
    amount: 'المبلغ',
    status: 'الحالة',
    nextAction: 'الاجراء التالي',
    lastUpdate: 'اخر تحديث',
    ttnReference: 'مرجع TTN',
    rejectionReason: 'سبب الرفض',
    actions: 'الاجراءات',
    draftPdf: 'PDF اولي',
    finalPdf: 'الفاتورة النهائية',
    xml: 'XML TEIF',
    sendEmail: 'ارسال',
    delete: 'حذف',
    createTitle: 'انشاء فاتورة',
    createSubtitle: 'ابدأ بمسودة ثم تقدم خطوة بخطوة حتى اعتماد TTN.',
    invoiceNumber: 'رقم الفاتورة',
    selectClient: 'العميل',
    selectProduct: 'اختر منتجا',
    customProduct: 'منتج مخصص',
    statusLabel: 'الحالة الاولية',
    addLine: 'اضافة سطر',
    lineDescription: 'الوصف',
    quantity: 'الكمية',
    unitPrice: 'السعر',
    tva: 'الاداء',
    total: 'المجموع',
    subtotal: 'المجموع HT',
    totalTva: 'مجموع الاداء',
    stampDuty: 'الطابع الجبائي',
    totalTtc: 'الصافي للدفع',
    cancel: 'الغاء',
    create: 'انشاء الفاتورة',
    validateInvoice: 'تأكيد الفاتورة',
    generateTeif: 'توليد XML TEIF',
    signTeif: 'توقيع الكتروني',
    submitTtn: 'ارسال الى TTN',
    configureSignature: 'تهيئة التوقيع',
    configureTtn: 'تهيئة TTN',
    checkTtn: 'التحقق من TTN',
    correctInvoice: 'تصحيح الفاتورة',
    downloadFinal: 'تنزيل الفاتورة النهائية',
    paymentMethod: 'طريقة الدفع',
    cash: 'نقدا',
    testAccept: 'محاكاة قبول',
    testReject: 'محاكاة رفض',
    validateError: 'يرجى تصحيح الحقول المطلوبة.',
  },
};

const ACTION_LABELS = {
  'validate-invoice': 'validateInvoice',
  'generate-teif': 'generateTeif',
  'sign-teif': 'signTeif',
  'submit-ttn': 'submitTtn',
  'check-ttn': 'checkTtn',
  'correct-invoice': 'correctInvoice',
  'download-final': 'downloadFinal',
};

const badgeVariant = (status) => {
  if (['ACCEPTED_TTN', 'VALIDATED'].includes(status)) return 'success';
  if (['REJECTED_TTN', 'CANCELLED'].includes(status)) return 'rejected';
  if (['SIGNED', 'SENT_TO_TTN', 'PENDING_TTN'].includes(status)) return 'primary';
  if (['TEIF_GENERATED'].includes(status)) return 'warning';
  return 'secondary';
};

const Invoices = () => {
  const { lang, t } = useLanguage();
  const text = COPY[lang] || COPY.fr;
  const { user, refreshUser } = useContext(AuthContext);

  const [loading, setLoading] = useState(true);
  const [busyInvoiceId, setBusyInvoiceId] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [tvaRates, setTvaRates] = useState([
    { rate: 19, label: 'Standard' },
    { rate: 13, label: 'Spécial' },
    { rate: 7, label: 'Réduit' },
    { rate: 0, label: 'Exonéré' },
  ]);
  const [eInvoiceStatus, setEInvoiceStatus] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingInvoiceId, setEditingInvoiceId] = useState(null);
  const [errors, setErrors] = useState({});
  const [clientId, setClientId] = useState('');
  const [lines, setLines] = useState([createLineItem()]);

  const replaceInvoice = (updatedInvoice) => {
    if (!updatedInvoice?.id) return;
    setInvoices((current) =>
      current.some((invoice) => invoice.id === updatedInvoice.id)
        ? current.map((invoice) => (invoice.id === updatedInvoice.id ? updatedInvoice : invoice))
        : [updatedInvoice, ...current]
    );
  };

  const fetchData = useCallback(async () => {
    try {
      const [invoicesRes, clientsRes, productsRes, eInvoiceRes, tvaRatesRes] = await Promise.all([
        api.get('/invoices'),
        api.get('/clients'),
        api.get('/products'),
        api.get('/settings/einvoice/status').catch(() => ({ data: null })),
        api.get('/tva-rates').catch(() => ({ data: [] })),
      ]);
      setInvoices(invoicesRes.data || []);
      setClients(clientsRes.data || []);
      setProducts(productsRes.data || []);
      if (Array.isArray(tvaRatesRes.data) && tvaRatesRes.data.length) setTvaRates(tvaRatesRes.data);
      setEInvoiceStatus(eInvoiceRes.data);
    } catch (error) {
      console.error('Error fetching invoices', error);
      alert(t('common.error_load'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openModal = () => {
    if (user?.subscription?.plan === 'STARTER' && user?.subscription?.remainingInvoices === 0) {
      alert('Votre quota mensuel est atteint.');
      return;
    }
    setEditingInvoiceId(null);
    setClientId('');
    setLines([createLineItem({ tvaRate: tvaRates[0]?.rate ?? 19 })]);
    setErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (invoice) => {
    setEditingInvoiceId(invoice.id);
    setClientId(invoice.clientId || '');
    setLines(
      (invoice.lines || []).map((line) =>
        createLineItem({
          productId: line.productId || '',
          description: line.description || '',
          quantity: Number(line.quantity || 1),
          unitPrice: Number(line.unitPrice || 0),
          tvaRate: Number(line.tvaRate || 19),
        })
      )
    );
    setErrors({});
    setIsModalOpen(true);
  };

  const handleLineChange = (lineId, field, value) => {
    setLines((current) => current.map((line) => (line.id === lineId ? { ...line, [field]: value } : line)));
  };

  const handleProductSelect = (lineId, productId) => {
    if (!productId) {
      handleLineChange(lineId, 'productId', '');
      return;
    }

    const product = products.find((item) => item.id === productId);
    if (!product) return;

    setLines((current) =>
      current.map((line) =>
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

  const validateForm = () => {
    const nextErrors = {};
    if (!clientId) nextErrors.clientId = text.validateError;
    lines.forEach((line) => {
      if (!line.description) nextErrors[`description-${line.id}`] = text.validateError;
      if (Number(line.quantity) <= 0) nextErrors[`quantity-${line.id}`] = text.validateError;
      if (Number(line.unitPrice) < 0) nextErrors[`price-${line.id}`] = text.validateError;
    });
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const subtotalHT = useMemo(
    () => lines.reduce((sum, line) => sum + Number(line.quantity || 0) * Number(line.unitPrice || 0), 0),
    [lines]
  );
  const totalTVA = useMemo(
    () =>
      lines.reduce(
        (sum, line) => sum + Number(line.quantity || 0) * Number(line.unitPrice || 0) * (Number(line.tvaRate || 0) / 100),
        0
      ),
    [lines]
  );
  const totalTTC = subtotalHT + totalTVA + 1;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        clientId,
        lines: lines.map((line) => Object.fromEntries(Object.entries(line).filter(([key]) => key !== 'id'))),
      };
      const response = editingInvoiceId
        ? await api.put(`/invoices/${editingInvoiceId}`, payload)
        : await api.post('/invoices', payload);
      replaceInvoice(response.data);
      await refreshUser();
      setIsModalOpen(false);
      setEditingInvoiceId(null);
    } catch (error) {
      console.error('Error creating invoice', error);
      alert(error.response?.data?.message || t('settings.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const withBusy = async (invoiceId, action) => {
    try {
      setBusyInvoiceId(invoiceId);
      const updatedInvoice = await action();
      if (updatedInvoice) {
        replaceInvoice(updatedInvoice);
      } else {
        await fetchData();
      }
    } finally {
      setBusyInvoiceId(null);
    }
  };

  const downloadBlob = (data, fileName, type) => {
    const url = window.URL.createObjectURL(new Blob([data], { type }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleGenerateTeif = (invoiceId) =>
    withBusy(invoiceId, async () => {
      const res = await api.post(`/invoices/${invoiceId}/generate-teif`);
      alert(res.data.message);
      return res.data.invoice;
    });

  const handleSignTeif = (invoiceId) =>
    withBusy(invoiceId, async () => {
      const res = await api.post(`/invoices/${invoiceId}/sign-teif`);
      alert(res.data.message);
      return res.data.invoice;
    });

  const handleSubmitTTN = (invoiceId) =>
    withBusy(invoiceId, async () => {
      const res = await api.post(`/invoices/${invoiceId}/submit-ttn`);
      alert(res.data.message);
      return res.data.invoice;
    });

  const handleCheckTTN = (invoiceId, simulateDecision = null) =>
    withBusy(invoiceId, async () => {
      const res = await api.post(`/invoices/${invoiceId}/check-ttn-status`, simulateDecision ? { simulateDecision } : {});
      alert(res.data.message);
      return res.data.invoice;
    });

  const handleValidateInvoice = (invoiceId) =>
    withBusy(invoiceId, async () => {
      const res = await api.patch(`/invoices/${invoiceId}/status`, { status: 'VALIDATED' });
      return res.data;
    });

  const handleDownloadXml = async (invoice) => {
    try {
      const res = await api.get(`/invoices/${invoice.id}/xml`, { responseType: 'blob' });
      downloadBlob(res.data, `TEIF_${sanitizeBusinessNumberForFileName(getInvoiceNumber(invoice))}.xml`, 'application/xml');
    } catch (error) {
      console.error(error);
      alert(t('common.error_download'));
    }
  };

  const handleDownloadDraftPdf = async (invoice) => {
    try {
      const res = await api.get(`/invoices/${invoice.id}/pdf`, { responseType: 'blob' });
      downloadBlob(res.data, `Invoice_${sanitizeBusinessNumberForFileName(getInvoiceNumber(invoice))}.pdf`, 'application/pdf');
    } catch (error) {
      console.error(error);
      alert(t('common.error_download'));
    }
  };

  const handleDownloadFinalPdf = async (invoice) => {
    try {
      const res = await api.get(`/invoices/${invoice.id}/final-pdf`, { responseType: 'blob' });
      downloadBlob(res.data, `Invoice_${sanitizeBusinessNumberForFileName(getInvoiceNumber(invoice))}_final.pdf`, 'application/pdf');
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || t('common.error_download'));
    }
  };

  const handleSendEmail = async (invoice) => {
    try {
      const res = await api.post(`/invoices/${invoice.id}/send-email`);
      alert(res.data.previewUrl ? `${res.data.message}\n${res.data.previewUrl}` : res.data.message);
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || t('common.error_send'));
    }
  };

  const handleDelete = async (invoice) => {
    if (!window.confirm(text.delete)) return;
    try {
      await api.delete(`/invoices/${invoice.id}`);
      setInvoices((current) => current.filter((currentInvoice) => currentInvoice.id !== invoice.id));
    } catch (error) {
      console.error(error);
      alert(t('common.error_delete'));
    }
  };

  const handlePrimaryAction = async (invoice) => {
    if (invoice.nextAction === 'sign-teif' && !eInvoiceStatus?.signatureConfigured) {
      window.location.href = '/settings?tab=compliance';
      return;
    }
    if (invoice.nextAction === 'submit-ttn' && !eInvoiceStatus?.ttnConfigured && eInvoiceStatus?.mode !== 'mock') {
      window.location.href = '/settings?tab=compliance';
      return;
    }
    switch (invoice.nextAction) {
      case 'validate-invoice':
        return handleValidateInvoice(invoice.id);
      case 'generate-teif':
        return handleGenerateTeif(invoice.id);
      case 'sign-teif':
        return handleSignTeif(invoice.id);
      case 'submit-ttn':
        return handleSubmitTTN(invoice.id);
      case 'check-ttn':
        return handleCheckTTN(invoice.id);
      case 'download-final':
        return handleDownloadFinalPdf(invoice);
      case 'correct-invoice':
        return openEditModal(invoice);
      default:
        return openEditModal(invoice);
    }
  };

  const getActionLabel = (invoice) => {
    if (invoice.nextAction === 'sign-teif' && !eInvoiceStatus?.signatureConfigured) return text.configureSignature;
    if (invoice.nextAction === 'submit-ttn' && !eInvoiceStatus?.ttnConfigured && eInvoiceStatus?.mode !== 'mock') return text.configureTtn;
    return text[ACTION_LABELS[invoice.nextAction] || 'validateInvoice'];
  };

  const getModeBadge = (invoice) => invoice.modeBadge || (
    eInvoiceStatus?.mode === 'mock'
      ? 'Mode simulation — non légal'
      : eInvoiceStatus?.mode === 'sandbox'
        ? 'Mode test TTN — non légal'
        : 'Mode production'
  );

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 font-display tracking-tight">{text.title}</h1>
          <p className="text-sm text-slate-500 font-medium">{text.subtitle}</p>
        </div>
        <Button onClick={openModal} icon={Plus}>
          {text.newInvoice}
        </Button>
      </div>

      <Card className="border-indigo-100 bg-indigo-50/40">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
            <Receipt className="w-5 h-5" />
          </div>
          <div className="space-y-3">
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-900">{text.helperTitle}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {text.helperLines.map((line, index) => (
                <div key={line} className="rounded-2xl bg-white/80 border border-indigo-100/60 px-4 py-3 text-sm text-slate-700 font-medium">
                  <span className="text-indigo-600 font-black me-2">{index + 1}.</span>
                  {line}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <Card noPadding className="overflow-hidden">
        {loading ? (
          <div className="py-20 flex justify-center">
            <Loader className="w-8 h-8 animate-spin text-premium-600" />
          </div>
        ) : invoices.length === 0 ? (
          <div className="py-16 text-center text-slate-400 font-medium">{text.noData}</div>
        ) : (
          <>
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50/70 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">{text.invoiceNumber || 'Invoice number'}</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">{text.client}</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">{text.status}</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">{text.nextAction}</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">{text.lastUpdate}</th>
                    <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">{text.amount}</th>
                    <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Règlement</th>
                    <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">{text.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {invoices.map((invoice) => {
                    const isBusy = busyInvoiceId === invoice.id;
                    return (
                      <tr key={invoice.id} className="align-top hover:bg-slate-50/40">
                        <td className="px-6 py-5">
                          <div className="font-black text-slate-900">{getInvoiceNumber(invoice)}</div>
                          {invoice.ttnReference ? <div className="text-[11px] text-slate-500 mt-1">{text.ttnReference}: {invoice.ttnReference}</div> : null}
                          <div className="mt-2">
                            <Badge variant={invoice.eInvoiceMode === 'production' ? 'success' : 'warning'}>{getModeBadge(invoice)}</Badge>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="font-bold text-slate-800">{invoice.client?.name || '-'}</div>
                          {invoice.ttnRejectionReason ? (
                            <div className="mt-2 rounded-xl bg-rose-50 border border-rose-100 px-3 py-2 text-[11px] text-rose-700">
                              <span className="font-black">{text.rejectionReason}: </span>
                              {invoice.ttnRejectionReason}
                            </div>
                          ) : null}
                        </td>
                        <td className="px-6 py-5">
                          <Badge variant={badgeVariant(invoice.complianceStatus)}>{invoice.complianceLabelFr || invoice.complianceStatus}</Badge>
                          <div className="mt-2 space-y-1 text-[11px] font-bold text-slate-500">
                            <div>TEIF: {invoice.teifStatus || '-'}</div>
                            <div>Signature: {invoice.signatureStatus || '-'}</div>
                            <div>TTN: {invoice.ttnStatus || '-'}</div>
                          </div>
                          {invoice.missingRequirements?.length ? (
                            <div className="mt-2 text-[11px] font-bold text-amber-700">
                              {invoice.missingRequirements.join(' · ')}
                            </div>
                          ) : null}
                        </td>
                        <td className="px-6 py-5">
                          <Button size="sm" onClick={() => handlePrimaryAction(invoice)} loading={isBusy}>
                            {getActionLabel(invoice)}
                          </Button>
                        </td>
                        <td className="px-6 py-5 text-sm text-slate-500 font-medium">
                          {invoice.lastStatusAt ? new Date(invoice.lastStatusAt).toLocaleString() : new Date(invoice.updatedAt).toLocaleString()}
                        </td>
                        <td className="px-6 py-5 text-right font-black text-slate-900">
                          {Number(invoice.netToPay || 0).toLocaleString(undefined, { minimumFractionDigits: 3 })} TND
                        </td>
                        <td className="px-6 py-5 text-right">
                          <Badge variant={invoice.paymentStatus === 'paid' ? 'success' : invoice.paymentStatus === 'partially_paid' ? 'warning' : 'neutral'}>
                            {invoice.paymentStatus || 'unpaid'}
                          </Badge>
                          <div className="mt-1 text-[11px] font-bold text-slate-400">
                            Reste {Number(invoice.remainingAmount ?? invoice.netToPay ?? 0).toFixed(3)} TND
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex justify-end flex-wrap gap-2">
                            {['DRAFT', 'REJECTED_TTN'].includes(invoice.complianceStatus) ? (
                              <button onClick={() => openEditModal(invoice)} className="p-2 rounded-xl bg-slate-50 text-slate-500 hover:text-indigo-600">
                                <Pencil className="w-4 h-4" />
                              </button>
                            ) : null}
                            <button onClick={() => handleDownloadXml(invoice)} className="p-2 rounded-xl bg-slate-50 text-slate-500 hover:text-indigo-600">
                              <FileCode2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDownloadDraftPdf(invoice)} className="p-2 rounded-xl bg-slate-50 text-slate-500 hover:text-indigo-600">
                              <Download className="w-4 h-4" />
                            </button>
                            {invoice.hasFinalPdf || invoice.complianceStatus === 'ACCEPTED_TTN' ? (
                              <button onClick={() => handleDownloadFinalPdf(invoice)} className="p-2 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100">
                                <CheckCircle2 className="w-4 h-4" />
                              </button>
                            ) : null}
                            <button onClick={() => handleSendEmail(invoice)} className="p-2 rounded-xl bg-slate-50 text-slate-500 hover:text-indigo-600">
                              <Send className="w-4 h-4" />
                            </button>
                            {invoice.complianceMode === 'mock' && ['SENT_TO_TTN', 'PENDING_TTN'].includes(invoice.complianceStatus) ? (
                              <>
                                <Button size="sm" variant="secondary" onClick={() => handleCheckTTN(invoice.id, 'accept')}>{text.testAccept}</Button>
                                <Button size="sm" variant="secondary" onClick={() => handleCheckTTN(invoice.id, 'reject')}>{text.testReject}</Button>
                              </>
                            ) : null}
                            <button onClick={() => handleDelete(invoice)} className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="space-y-3 p-3 lg:hidden sm:space-y-4 sm:p-4">
              {invoices.map((invoice) => {
                const isBusy = busyInvoiceId === invoice.id;
                return (
                  <div key={invoice.id} className="space-y-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:rounded-[2rem] sm:p-5">
                    <div className="flex justify-between gap-4">
                      <div>
                        <div className="font-black text-slate-900">{getInvoiceNumber(invoice)}</div>
                        <div className="text-sm font-medium text-slate-500">{invoice.client?.name || '-'}</div>
                      </div>
                      <Badge variant={badgeVariant(invoice.complianceStatus)}>{invoice.complianceLabelFr || invoice.complianceStatus}</Badge>
                    </div>
                    <Badge variant={invoice.eInvoiceMode === 'production' ? 'success' : 'warning'}>{getModeBadge(invoice)}</Badge>
                    <div className="text-sm text-slate-600">
                      <div className="font-black text-slate-900">{Number(invoice.netToPay || 0).toLocaleString(undefined, { minimumFractionDigits: 3 })} TND</div>
                      <div>Règlement: {invoice.paymentStatus || 'unpaid'} · Reste {Number(invoice.remainingAmount ?? invoice.netToPay ?? 0).toFixed(3)} TND</div>
                      <div>TEIF: {invoice.teifStatus || '-'} · Signature: {invoice.signatureStatus || '-'} · TTN: {invoice.ttnStatus || '-'}</div>
                      {invoice.missingRequirements?.length ? <div className="text-amber-700 mt-2">{invoice.missingRequirements.join(' · ')}</div> : null}
                      {invoice.ttnReference ? <div>{text.ttnReference}: {invoice.ttnReference}</div> : null}
                      {invoice.ttnRejectionReason ? <div className="text-rose-600 mt-2">{invoice.ttnRejectionReason}</div> : null}
                    </div>
                    <Button className="w-full" onClick={() => handlePrimaryAction(invoice)} loading={isBusy}>
                      {getActionLabel(invoice)}
                    </Button>
                    <div className="grid grid-cols-1 gap-2 min-[375px]:grid-cols-2">
                      {['DRAFT', 'REJECTED_TTN'].includes(invoice.complianceStatus) ? (
                        <Button variant="secondary" size="sm" onClick={() => openEditModal(invoice)}>{text.correctInvoice}</Button>
                      ) : null}
                      <Button variant="secondary" size="sm" onClick={() => handleDownloadXml(invoice)}>{text.xml}</Button>
                      <Button variant="secondary" size="sm" onClick={() => handleDownloadDraftPdf(invoice)}>{text.draftPdf}</Button>
                      <Button variant="secondary" size="sm" onClick={() => handleSendEmail(invoice)}>{text.sendEmail}</Button>
                      <Button variant="secondary" size="sm" onClick={() => handleDelete(invoice)}>{text.delete}</Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </Card>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-2 backdrop-blur-sm sm:p-4">
          <Card
            className="max-h-[calc(100dvh-1rem)] w-full max-w-5xl overflow-hidden sm:max-h-[90vh]"
            noPadding
            title={text.createTitle}
            subtitle={text.createSubtitle}
            action={
              <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            }
          >
            <div className="max-h-[calc(100dvh-5.5rem)] overflow-y-auto p-4 sm:p-8">
              <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-8">
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.3fr_0.7fr] lg:gap-8">
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Select
                        label={text.selectClient}
                        value={clientId}
                        onChange={(event) => setClientId(event.target.value)}
                        error={errors.clientId}
                        options={[
                          { value: '', label: text.selectClient, disabled: true },
                          ...clients.map((client) => ({
                            value: client.id,
                            label: `${getClientNumber(client)} - ${client.name}`,
                          })),
                        ]}
                      />
                      <Input label={text.paymentMethod} value={text.cash} readOnly />
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">{text.createTitle}</h3>
                        <Button size="sm" variant="secondary" type="button" onClick={() => setLines((current) => [...current, createLineItem({ tvaRate: tvaRates[0]?.rate ?? 19 })])}>
                          {text.addLine}
                        </Button>
                      </div>

                      <div className="hidden">
                        <span>{text.selectProduct || 'Select a product'}</span>
                        <span>{text.lineDescription}</span>
                        <span>{text.quantity}</span>
                        <span>{text.unitPrice}</span>
                        <span>{text.tva}</span>
                        <span className="text-right">&nbsp;</span>
                      </div>

                      {lines.map((line, index) => (
                        <div key={line.id} className="space-y-4 rounded-2xl border border-slate-200/70 bg-gradient-to-br from-white via-slate-50/80 to-indigo-50/40 p-3 shadow-sm shadow-slate-200/40 sm:rounded-[2rem] sm:p-5">
                          <div className="flex items-center justify-between gap-4">
                            <div className="inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-slate-500 shadow-sm ring-1 ring-slate-200/70">
                              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 text-indigo-700">{index + 1}</span>
                              {text.addLine.replace(/Ajouter une ligne|Add line|Ø§Ø¶Ø§ÙØ© Ø³Ø·Ø±/g, '').trim() || 'Ligne'}
                            </div>
                          </div>
                          <div className="grid grid-cols-1 lg:grid-cols-[minmax(220px,1.1fr)_minmax(0,1.6fr)] gap-4 items-start">
                            <div>
                              <Select
                                label={text.selectProduct || 'Select a product'}
                                value={line.productId || ''}
                                onChange={(event) => handleProductSelect(line.id, event.target.value)}
                                className="min-h-[50px]"
                                options={[
                                  { value: '', label: text.customProduct || 'Custom product' },
                                  ...products.map((product) => ({
                                    value: product.id,
                                    label: `${product.name}${product.code ? ` (${product.code})` : ''}`,
                                  })),
                                ]}
                              />
                            </div>
                            <div>
                              <Input
                                label={text.lineDescription}
                                value={line.description}
                                onChange={(event) => handleLineChange(line.id, 'description', event.target.value)}
                                error={errors[`description-${line.id}`]}
                                className="min-h-[50px]"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[minmax(120px,0.75fr)_minmax(150px,1fr)_minmax(120px,0.7fr)_56px] gap-4 items-end">
                            <div>
                              <Input
                                type="number"
                                min="0"
                                step="1"
                                label={text.quantity}
                                value={line.quantity}
                                onChange={(event) => handleLineChange(line.id, 'quantity', Number(event.target.value))}
                                error={errors[`quantity-${line.id}`]}
                                inputMode="numeric"
                                className="min-h-[50px] text-center font-black"
                              />
                            </div>
                            <div>
                              <Input
                                type="number"
                                min="0"
                                step="0.001"
                                label={text.unitPrice}
                                value={line.unitPrice}
                                onChange={(event) => handleLineChange(line.id, 'unitPrice', Number(event.target.value))}
                                error={errors[`price-${line.id}`]}
                                inputMode="decimal"
                                className="min-h-[50px] text-right font-black"
                              />
                            </div>
                            <div>
                              <Select
                                label={text.tva}
                                value={line.tvaRate}
                                onChange={(event) => handleLineChange(line.id, 'tvaRate', Number(event.target.value))}
                                className="min-h-[50px] font-black"
                                options={tvaRates.map((item) => ({ value: item.rate, label: `${item.rate}% ${item.label ? `- ${item.label}` : ''}` }))}
                              />
                            </div>
                            <div className="flex items-end sm:justify-end">
                              <button
                                type="button"
                                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-transparent bg-white/90 text-rose-500 shadow-sm shadow-slate-200/60 transition-all hover:border-rose-100 hover:bg-rose-50 disabled:opacity-30"
                                disabled={lines.length === 1}
                                onClick={() => setLines((current) => current.filter((currentLine) => currentLine.id !== line.id))}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Card className="border-slate-100 bg-slate-50/40">
                      <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 mb-4">TTN</h3>
                      <div className="space-y-3 text-sm text-slate-600">
                        <div className="flex items-start gap-3"><AlertCircle className="w-4 h-4 mt-0.5 text-amber-500" /><span>{text.helperLines[0]}</span></div>
                        <div className="flex items-start gap-3"><FileCode2 className="w-4 h-4 mt-0.5 text-indigo-500" /><span>{text.helperLines[1]}</span></div>
                        <div className="flex items-start gap-3"><ShieldCheck className="w-4 h-4 mt-0.5 text-emerald-500" /><span>{text.helperLines[2]}</span></div>
                      </div>
                    </Card>

                    <Card className="border-slate-100">
                      <div className="space-y-3">
                        <div className="flex justify-between text-[11px] font-black uppercase tracking-widest text-slate-400">
                          <span>{text.subtotal}</span>
                          <span className="text-slate-900">{subtotalHT.toLocaleString(undefined, { minimumFractionDigits: 3 })}</span>
                        </div>
                        <div className="flex justify-between text-[11px] font-black uppercase tracking-widest text-slate-400">
                          <span>{text.totalTva}</span>
                          <span className="text-slate-900">{totalTVA.toLocaleString(undefined, { minimumFractionDigits: 3 })}</span>
                        </div>
                        <div className="flex justify-between text-[11px] font-black uppercase tracking-widest text-slate-400">
                          <span>{text.stampDuty}</span>
                          <span className="text-slate-900">1.000</span>
                        </div>
                        <div className="pt-4 border-t border-slate-100 flex justify-between items-end">
                          <span className="text-sm font-black text-slate-900 uppercase tracking-tight">{text.totalTtc}</span>
                          <span className="text-2xl font-black text-indigo-600 font-display">{totalTTC.toLocaleString(undefined, { minimumFractionDigits: 3 })} TND</span>
                        </div>
                      </div>
                    </Card>
                  </div>
                </div>

                <div className="flex flex-col-reverse gap-3 min-[375px]:flex-row min-[375px]:justify-end">
                  <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
                    {text.cancel}
                  </Button>
                  <Button type="submit" loading={isSubmitting}>
                    {editingInvoiceId ? text.correctInvoice : text.create}
                  </Button>
                </div>
              </form>
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
};

export default Invoices;
