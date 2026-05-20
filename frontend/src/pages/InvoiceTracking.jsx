import React, { useEffect, useState } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Clock3, Download, Loader, Send, ShieldCheck, X } from 'lucide-react';
import api from '../services/api';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { useLanguage } from '../context/LanguageContext';
import { getInvoiceNumber, sanitizeBusinessNumberForFileName } from '../utils/businessNumbers';

const COPY = {
  fr: {
    title: 'Suivi de factures',
    subtitle: 'Suivez clairement chaque etape entre la preparation de facture et la validation TTN.',
    empty: 'Aucune facture a suivre pour le moment.',
    labels: {
      DRAFT: 'Brouillon',
      READY_FOR_TEIF: 'Prete pour TEIF',
      TEIF_GENERATED: 'XML TEIF genere',
      VALIDATED: 'Prete pour TEIF',
      SIGNATURE_REQUIRED: 'Signature requise',
      SIGNED: 'Signee electroniquement',
      SENT_TO_TTN: 'Envoyee a TTN',
      PENDING_TTN: 'En traitement TTN',
      ACCEPTED_TTN: 'Acceptee par TTN',
      REJECTED_TTN: 'Rejetee par TTN',
      FINALIZED: 'Facture finale prete',
    },
    steps: ['Preparation', 'XML TEIF', 'Signature', 'Envoi TTN', 'Traitement TTN', 'Acceptation / Rejet', 'Facture finale'],
    client: 'Client',
    amount: 'Montant',
    lastUpdate: 'Derniere mise a jour',
    reference: 'Reference TTN',
    qrStatus: 'QR / cachet',
    qrReady: 'Disponible',
    qrPending: 'En attente',
    rejectionReason: 'Motif de rejet',
    nextAction: 'Prochaine action',
    complete: 'Completer la facture',
    generateTeif: 'Generer XML TEIF',
    signTeif: 'Signer electroniquement',
    submitTtn: 'Envoyer a TTN',
    checkTtn: 'Verifier statut TTN',
    correctInvoice: 'Corriger la facture',
    downloadFinal: 'Telecharger facture finale',
  },
  en: {
    title: 'Invoice tracking',
    subtitle: 'Track each step clearly between invoice preparation and TTN validation.',
    empty: 'No invoices to track.',
    labels: {
      DRAFT: 'Draft',
      READY_FOR_TEIF: 'Ready for TEIF',
      TEIF_GENERATED: 'TEIF XML generated',
      SIGNATURE_REQUIRED: 'Signature required',
      SIGNED: 'Signed electronically',
      SUBMITTED_TO_TTN: 'Submitted to TTN',
      TTN_PROCESSING: 'TTN processing',
      TTN_ACCEPTED: 'Accepted by TTN',
      TTN_REJECTED: 'Rejected by TTN',
      FINALIZED: 'Final invoice ready',
    },
    steps: ['Preparation', 'TEIF XML', 'Signature', 'TTN submission', 'TTN processing', 'Accepted / Rejected', 'Final invoice'],
    client: 'Client',
    amount: 'Amount',
    lastUpdate: 'Last update',
    reference: 'TTN reference',
    qrStatus: 'QR / seal',
    qrReady: 'Available',
    qrPending: 'Pending',
    rejectionReason: 'Rejection reason',
    nextAction: 'Next action',
    complete: 'Complete invoice',
    generateTeif: 'Generate TEIF XML',
    signTeif: 'Sign electronically',
    submitTtn: 'Submit to TTN',
    checkTtn: 'Check TTN status',
    correctInvoice: 'Correct invoice',
    downloadFinal: 'Download final invoice',
  },
  ar: {
    title: 'متابعة الفواتير',
    subtitle: 'تابع كل مرحلة بوضوح من اعداد الفاتورة الى اعتماد TTN.',
    empty: 'لا توجد فواتير للمتابعة حاليا.',
    labels: {
      DRAFT: 'مسودة',
      READY_FOR_TEIF: 'جاهزة لـ TEIF',
      TEIF_GENERATED: 'تم توليد XML TEIF',
      SIGNATURE_REQUIRED: 'التوقيع مطلوب',
      SIGNED: 'تم التوقيع',
      SUBMITTED_TO_TTN: 'ارسلت الى TTN',
      TTN_PROCESSING: 'قيد المعالجة',
      TTN_ACCEPTED: 'تم القبول',
      TTN_REJECTED: 'تم الرفض',
      FINALIZED: 'الفاتورة النهائية جاهزة',
    },
    steps: ['التحضير', 'XML TEIF', 'التوقيع', 'ارسال TTN', 'معالجة TTN', 'قبول / رفض', 'الفاتورة النهائية'],
    client: 'العميل',
    amount: 'المبلغ',
    lastUpdate: 'اخر تحديث',
    reference: 'مرجع TTN',
    qrStatus: 'QR / الختم',
    qrReady: 'متوفر',
    qrPending: 'قيد الانتظار',
    rejectionReason: 'سبب الرفض',
    nextAction: 'الاجراء التالي',
    complete: 'اكمال الفاتورة',
    generateTeif: 'توليد XML TEIF',
    signTeif: 'توقيع الكتروني',
    submitTtn: 'ارسال الى TTN',
    checkTtn: 'التحقق من TTN',
    correctInvoice: 'تصحيح الفاتورة',
    downloadFinal: 'تنزيل الفاتورة النهائية',
  },
};

const STEP_BUCKETS = {
  DRAFT: 0,
  READY_FOR_TEIF: 0,
  VALIDATED: 0,
  TEIF_GENERATED: 1,
  SIGNATURE_REQUIRED: 2,
  SIGNED: 2,
  SUBMITTED_TO_TTN: 3,
  SENT_TO_TTN: 3,
  TTN_PROCESSING: 4,
  PENDING_TTN: 4,
  TTN_ACCEPTED: 5,
  ACCEPTED_TTN: 5,
  TTN_REJECTED: 5,
  REJECTED_TTN: 5,
  FINALIZED: 6,
};

const ACTION_LABELS = {
  complete: 'complete',
  'generate-teif': 'generateTeif',
  'sign-teif': 'signTeif',
  'submit-ttn': 'submitTtn',
  'check-ttn': 'checkTtn',
  'correct-invoice': 'correctInvoice',
  'download-final': 'downloadFinal',
};

const variantForStatus = (status) => {
  if (['TTN_ACCEPTED', 'ACCEPTED_TTN', 'FINALIZED'].includes(status)) return 'success';
  if (['TTN_REJECTED', 'REJECTED_TTN'].includes(status)) return 'rejected';
  if (['SUBMITTED_TO_TTN', 'SENT_TO_TTN', 'TTN_PROCESSING', 'PENDING_TTN', 'SIGNED'].includes(status)) return 'primary';
  if (['TEIF_GENERATED', 'SIGNATURE_REQUIRED', 'READY_FOR_TEIF', 'VALIDATED'].includes(status)) return 'warning';
  return 'secondary';
};

const InvoiceTracking = () => {
  const { lang } = useLanguage();
  const text = COPY[lang] || COPY.fr;
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState([]);
  const [busyInvoiceId, setBusyInvoiceId] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const fetchInvoices = async () => {
    try {
      const response = await api.get('/invoices');
      setInvoices(response.data || []);
    } catch (error) {
      console.error('Error loading invoice tracking:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handlePrimaryAction = async (invoice) => {
    setBusyInvoiceId(invoice.id);
    try {
      switch (invoice.nextAction) {
        case 'generate-teif':
          await api.post(`/invoices/${invoice.id}/generate-teif`);
          break;
        case 'sign-teif':
          await api.post(`/invoices/${invoice.id}/sign-teif`);
          break;
        case 'submit-ttn':
          await api.post(`/invoices/${invoice.id}/submit-ttn`);
          break;
        case 'check-ttn':
          await api.post(`/invoices/${invoice.id}/check-ttn-status`);
          break;
        case 'download-final': {
          const response = await api.get(`/invoices/${invoice.id}/final-pdf`, { responseType: 'blob' });
          const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', `Invoice_${sanitizeBusinessNumberForFileName(getInvoiceNumber(invoice))}_final.pdf`);
          document.body.appendChild(link);
          link.click();
          link.parentNode?.removeChild(link);
          window.URL.revokeObjectURL(url);
          break;
        }
        default:
          break;
      }
      await fetchInvoices();
    } catch (error) {
      console.error(error);
      showToast(error.response?.data?.message || 'Action impossible.');
    } finally {
      setBusyInvoiceId(null);
    }
  };

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500">
      {toast && (
        <div className="fixed top-20 right-4 sm:right-6 z-[100] flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border max-w-sm bg-rose-50 border-rose-200 text-rose-800 animate-in slide-in-from-top-2 duration-300">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <p className="text-sm font-semibold flex-1">{toast}</p>
          <button onClick={() => setToast(null)} className="text-rose-400 hover:text-rose-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      <div>
        <h1 className="text-2xl font-black text-slate-900 font-display tracking-tight">{text.title}</h1>
        <p className="text-sm text-slate-500 font-medium">{text.subtitle}</p>
      </div>

      <Card>
        {loading ? (
          <div className="py-20 flex justify-center">
            <Loader className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : invoices.length === 0 ? (
          <div className="py-16 text-center text-slate-400 font-medium">{text.empty}</div>
        ) : (
          <div className="space-y-5">
            {invoices.map((invoice) => {
              const bucket = STEP_BUCKETS[invoice.complianceStatus] ?? 0;
              const isRejected = ['TTN_REJECTED', 'REJECTED_TTN'].includes(invoice.complianceStatus);
              const actionLabel = text[ACTION_LABELS[invoice.nextAction] || 'complete'];
              return (
                <div key={invoice.id} className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm space-y-6">
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="text-lg font-black text-slate-900">{getInvoiceNumber(invoice)}</h3>
                        <Badge variant={variantForStatus(invoice.complianceStatus)}>{text.labels[invoice.complianceStatus] || invoice.complianceStatus}</Badge>
                        <Badge variant={invoice.eInvoiceMode === 'production' ? 'success' : 'warning'}>{invoice.modeBadge}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-slate-500 font-medium">
                        <span>{text.client}: {invoice.client?.name || '-'}</span>
                        <span>{text.amount}: {Number(invoice.netToPay || 0).toLocaleString(undefined, { minimumFractionDigits: 3 })} TND</span>
                        <span>{text.lastUpdate}: {new Date(invoice.lastStatusAt || invoice.updatedAt).toLocaleString()}</span>
                      </div>
                    </div>

                    <Button size="sm" onClick={() => handlePrimaryAction(invoice)} loading={busyInvoiceId === invoice.id}>
                      {actionLabel}
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-[1.5fr_0.9fr] gap-6">
                    <div className="rounded-[1.75rem] border border-slate-100 bg-slate-50/40 p-5">
                      <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
                        {text.steps.map((step, index) => {
                          const completed = !isRejected && bucket > index;
                          const active = bucket === index;
                          return (
                            <div key={`${invoice.id}-${step}`} className="flex flex-col items-center text-center gap-2">
                              <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center ${
                                completed
                                  ? 'bg-emerald-500 border-emerald-500 text-white'
                                  : active
                                    ? 'bg-indigo-600 border-indigo-600 text-white'
                                    : isRejected && index === 5
                                      ? 'bg-rose-500 border-rose-500 text-white'
                                      : 'bg-white border-slate-200 text-slate-400'
                              }`}>
                                {completed ? <CheckCircle2 className="w-4 h-4" /> : active ? <Clock3 className="w-4 h-4" /> : index === 2 ? <ShieldCheck className="w-4 h-4" /> : index === 3 ? <Send className="w-4 h-4" /> : index === 5 && isRejected ? <AlertTriangle className="w-4 h-4" /> : <span className="text-xs font-black">{index + 1}</span>}
                              </div>
                              <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">{step}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="rounded-[1.75rem] border border-slate-100 bg-white p-5 space-y-4">
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">{text.reference}</div>
                        <div className="text-sm font-bold text-slate-800 mt-1">{invoice.ttnReference || '-'}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">{text.qrStatus}</div>
                        <div className="text-sm font-bold text-slate-800 mt-1">{invoice.ttnQrCode ? text.qrReady : text.qrPending}</div>
                      </div>
                      {invoice.ttnRejectionReason ? (
                        <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                          <div className="text-[10px] font-black uppercase tracking-widest mb-1">{text.rejectionReason}</div>
                          <div>{invoice.ttnRejectionReason}</div>
                        </div>
                      ) : null}
                      {invoice.missingRequirements?.length ? (
                        <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                          {invoice.missingRequirements.join(' · ')}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
};

export default InvoiceTracking;
