import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileCode2,
  Loader,
  RefreshCw,
  Send,
  Settings,
  ShieldCheck,
  ShieldAlert,
  Wifi,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { getInvoiceNumber, sanitizeBusinessNumberForFileName } from '../utils/businessNumbers';

const COPY = {
  fr: {
    title: 'Centre de conformite',
    subtitle: 'Pilotez la signature electronique, les outils TEIF XML et le lien avec TTN depuis un seul ecran.',
    mode: 'Mode',
    testMode: 'Mode test',
    productionMode: 'Mode production',
    signatureStatus: 'Signature electronique',
    teifTools: 'Outils TEIF XML',
    ttnStatus: 'Connexion TTN',
    lastSubmissions: 'Dernieres soumissions',
    empty: 'Aucune soumission recente.',
    configured: 'Configuree',
    notConfigured: 'Non configuree',
    available: 'Disponible',
    openSettings: 'Configurer TTN',
    refresh: 'Actualiser',
    complianceHelp: 'Le mode test permet de simuler un envoi, une acceptation ou un rejet sans produire de valeur fiscale reelle.',
    reference: 'Reference TTN',
    rejectionReason: 'Motif de rejet',
    xml: 'XML TEIF',
    finalPdf: 'Facture finale',
    check: 'Verifier statut',
    submit: 'Envoyer a TTN',
    sign: 'Signer',
    generate: 'Generer XML',
    signatureProvider: 'Fournisseur',
    certificateType: 'Type de certificat',
    lastSignatureTest: 'Dernier test de signature',
    fiscalIdentifier: 'Identifiant fiscal',
    cardTitle: 'Etat de conformite',
  },
  en: {
    title: 'Compliance center',
    subtitle: 'Manage electronic signature, TEIF XML tools and the TTN link from one screen.',
    mode: 'Mode',
    testMode: 'Test mode',
    productionMode: 'Production mode',
    signatureStatus: 'Electronic signature',
    teifTools: 'TEIF XML tools',
    ttnStatus: 'TTN connection',
    lastSubmissions: 'Latest submissions',
    empty: 'No recent submission.',
    configured: 'Configured',
    notConfigured: 'Not configured',
    available: 'Available',
    openSettings: 'Configure TTN',
    refresh: 'Refresh',
    complianceHelp: 'Test mode lets you simulate submission, acceptance or rejection without creating real fiscal validity.',
    reference: 'TTN reference',
    rejectionReason: 'Rejection reason',
    xml: 'TEIF XML',
    finalPdf: 'Final invoice',
    check: 'Check status',
    submit: 'Submit to TTN',
    sign: 'Sign',
    generate: 'Generate XML',
    signatureProvider: 'Provider',
    certificateType: 'Certificate type',
    lastSignatureTest: 'Last signature test',
    fiscalIdentifier: 'Fiscal identifier',
    cardTitle: 'Compliance status',
  },
  ar: {
    title: 'مركز الامتثال',
    subtitle: 'ادِر التوقيع الالكتروني وادوات TEIF XML والربط مع TTN من شاشة واحدة.',
    mode: 'الوضع',
    testMode: 'وضع الاختبار',
    productionMode: 'وضع الانتاج',
    signatureStatus: 'التوقيع الالكتروني',
    teifTools: 'ادوات TEIF XML',
    ttnStatus: 'اتصال TTN',
    lastSubmissions: 'اخر الارسالات',
    empty: 'لا توجد ارساليات حديثة.',
    configured: 'مهيأ',
    notConfigured: 'غير مهيأ',
    available: 'متوفر',
    openSettings: 'تهيئة TTN',
    refresh: 'تحديث',
    complianceHelp: 'وضع الاختبار يسمح بمحاكاة الارسال والقبول والرفض دون انتاج قيمة جبائية فعلية.',
    reference: 'مرجع TTN',
    rejectionReason: 'سبب الرفض',
    xml: 'XML TEIF',
    finalPdf: 'الفاتورة النهائية',
    check: 'التحقق من الحالة',
    submit: 'ارسال الى TTN',
    sign: 'توقيع',
    generate: 'توليد XML',
    signatureProvider: 'المزود',
    certificateType: 'نوع الشهادة',
    lastSignatureTest: 'اخر اختبار توقيع',
    fiscalIdentifier: 'المعرف الجبائي',
    cardTitle: 'حالة الامتثال',
  },
};

const badgeVariant = (status) => {
  if (status === 'ACCEPTED_TTN') return 'success';
  if (status === 'REJECTED_TTN') return 'rejected';
  if (['SENT_TO_TTN', 'PENDING_TTN', 'SIGNED'].includes(status)) return 'primary';
  if (['TEIF_GENERATED', 'VALIDATED'].includes(status)) return 'warning';
  return 'secondary';
};

const Teif = () => {
  const { lang } = useLanguage();
  const text = COPY[lang] || COPY.fr;
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [busyInvoiceId, setBusyInvoiceId] = useState(null);

  const fetchData = async () => {
    try {
      const [settingsRes, invoicesRes] = await Promise.all([api.get('/settings'), api.get('/invoices')]);
      setSettings(settingsRes.data);
      setInvoices(invoicesRes.data || []);
    } catch (error) {
      console.error('Error loading compliance center', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const latestInvoices = useMemo(() => invoices.slice(0, 6), [invoices]);
  const compliance = settings?.compliance || {};
  const ttnMode = compliance.ttnMode || 'mock';
  const hasCertificate = compliance.signatureStatus === 'configured';

  const doAction = async (invoiceId, endpoint) => {
    try {
      setBusyInvoiceId(invoiceId);
      const res = await api.post(endpoint);
      alert(res.data.message);
      await fetchData();
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || 'Action impossible.');
    } finally {
      setBusyInvoiceId(null);
    }
  };

  const download = async (invoice, type) => {
    try {
      const endpoint = type === 'final' ? `/invoices/${invoice.id}/final-pdf` : `/invoices/${invoice.id}/xml`;
      const mime = type === 'final' ? 'application/pdf' : 'application/xml';
      const safeNumber = sanitizeBusinessNumberForFileName(getInvoiceNumber(invoice));
      const name = type === 'final' ? `Invoice_${safeNumber}_final.pdf` : `TEIF_${safeNumber}.xml`;
      const res = await api.get(endpoint, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: mime }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', name);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || 'Telechargement impossible.');
    }
  };

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 font-display tracking-tight">{text.title}</h1>
          <p className="text-sm text-slate-500 font-medium">{text.subtitle}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={fetchData} icon={RefreshCw}>{text.refresh}</Button>
          <Button onClick={() => navigate('/settings?tab=compliance')} icon={Settings}>{text.openSettings}</Button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center">
          <Loader className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-6">
            <Card className="border-slate-100">
              <div className="flex items-start gap-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${hasCertificate ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                  {hasCertificate ? <ShieldCheck className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
                </div>
                <div className="space-y-3 flex-1">
                  <h2 className="text-sm font-black uppercase tracking-widest text-slate-900">{text.cardTitle}</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="rounded-2xl border border-slate-100 bg-slate-50/40 px-4 py-3">
                      <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">{text.signatureStatus}</div>
                      <div className="mt-1 font-bold text-slate-800">{hasCertificate ? text.configured : text.notConfigured}</div>
                    </div>
                    <div className="rounded-2xl border border-slate-100 bg-slate-50/40 px-4 py-3">
                      <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">{text.mode}</div>
                      <div className="mt-1 font-bold text-slate-800">{ttnMode === 'mock' ? text.testMode : text.productionMode}</div>
                    </div>
                    <div className="rounded-2xl border border-slate-100 bg-slate-50/40 px-4 py-3">
                      <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">{text.signatureProvider}</div>
                      <div className="mt-1 font-bold text-slate-800">{compliance.certificateProvider || 'TunTrust / ANCE'}</div>
                    </div>
                    <div className="rounded-2xl border border-slate-100 bg-slate-50/40 px-4 py-3">
                      <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">{text.certificateType}</div>
                      <div className="mt-1 font-bold text-slate-800">{compliance.certificateType || '-'}</div>
                    </div>
                    <div className="rounded-2xl border border-slate-100 bg-slate-50/40 px-4 py-3">
                      <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">{text.fiscalIdentifier}</div>
                      <div className="mt-1 font-bold text-slate-800">{compliance.companyFiscalIdentifier || '-'}</div>
                    </div>
                    <div className="rounded-2xl border border-slate-100 bg-slate-50/40 px-4 py-3">
                      <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">{text.lastSignatureTest}</div>
                      <div className="mt-1 font-bold text-slate-800">{compliance.lastSignatureTestDate ? new Date(compliance.lastSignatureTestDate).toLocaleString() : '-'}</div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="border-indigo-100 bg-indigo-50/40">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <Wifi className="w-5 h-5" />
                </div>
                <div className="space-y-3">
                  <h2 className="text-sm font-black uppercase tracking-widest text-slate-900">{text.ttnStatus}</h2>
                  <p className="text-sm text-slate-600 font-medium">{text.complianceHelp}</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={hasCertificate ? 'success' : 'warning'}>{text.signatureStatus}: {hasCertificate ? text.configured : text.notConfigured}</Badge>
                    <Badge variant="primary">{text.teifTools}: {text.available}</Badge>
                    <Badge variant={ttnMode === 'mock' ? 'warning' : 'success'}>{ttnMode === 'mock' ? text.testMode : text.productionMode}</Badge>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <Card noPadding className="overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/60">
              <h2 className="text-sm font-black uppercase tracking-widest text-slate-900">{text.lastSubmissions}</h2>
            </div>
            {latestInvoices.length === 0 ? (
              <div className="py-16 text-center text-slate-400 font-medium">{text.empty}</div>
            ) : (
              <div className="divide-y divide-slate-50">
                {latestInvoices.map((invoice) => (
                  <div key={invoice.id} className="px-6 py-5 flex flex-col xl:flex-row xl:items-center justify-between gap-5">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="font-black text-slate-900">{getInvoiceNumber(invoice)}</div>
                        <Badge variant={badgeVariant(invoice.complianceStatus)}>{invoice.complianceLabelFr || invoice.complianceStatus}</Badge>
                        {invoice.ttnReference ? <Badge variant="success">{text.reference}: {invoice.ttnReference}</Badge> : null}
                      </div>
                      <div className="text-sm text-slate-500 font-medium">
                        {invoice.client?.name || '-'} · {Number(invoice.netToPay || 0).toLocaleString(undefined, { minimumFractionDigits: 3 })} TND
                      </div>
                      {invoice.ttnRejectionReason ? (
                        <div className="text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-2xl px-4 py-2 inline-flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 mt-0.5" />
                          <span><strong>{text.rejectionReason}:</strong> {invoice.ttnRejectionReason}</span>
                        </div>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {invoice.complianceStatus === 'VALIDATED' ? (
                        <Button size="sm" variant="secondary" onClick={() => doAction(invoice.id, `/invoices/${invoice.id}/generate-teif`)} loading={busyInvoiceId === invoice.id}>
                          {text.generate}
                        </Button>
                      ) : null}
                      {invoice.complianceStatus === 'TEIF_GENERATED' ? (
                        <Button size="sm" variant="secondary" onClick={() => doAction(invoice.id, `/invoices/${invoice.id}/sign-teif`)} loading={busyInvoiceId === invoice.id}>
                          {text.sign}
                        </Button>
                      ) : null}
                      {invoice.complianceStatus === 'SIGNED' ? (
                        <Button size="sm" onClick={() => doAction(invoice.id, `/invoices/${invoice.id}/submit-ttn`)} loading={busyInvoiceId === invoice.id}>
                          {text.submit}
                        </Button>
                      ) : null}
                      {['SENT_TO_TTN', 'PENDING_TTN'].includes(invoice.complianceStatus) ? (
                        <Button size="sm" variant="secondary" onClick={() => doAction(invoice.id, `/invoices/${invoice.id}/check-ttn-status`)} loading={busyInvoiceId === invoice.id}>
                          {text.check}
                        </Button>
                      ) : null}
                      <button onClick={() => download(invoice, 'xml')} className="p-2 rounded-xl bg-slate-50 text-slate-500 hover:text-indigo-600">
                        <FileCode2 className="w-4 h-4" />
                      </button>
                      {invoice.complianceStatus === 'ACCEPTED_TTN' ? (
                        <button onClick={() => download(invoice, 'final')} className="p-2 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100">
                          <Download className="w-4 h-4" />
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
};

export default Teif;
