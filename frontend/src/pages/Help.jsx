import { HelpCircle, Mail, MessageSquare, FileText, Sparkles, Lock, Loader2, Send } from 'lucide-react';
import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import api from '../services/api';

const categories = [
  { value: 'general', label: 'General' },
  { value: 'billing', label: 'Billing' },
  { value: 'TTN', label: 'TTN' },
  { value: 'signature', label: 'Signature' },
  { value: 'technical', label: 'Technique' },
  { value: 'dossier', label: 'Dossier' },
];

const priorities = [
  { value: 'low', label: 'Basse' },
  { value: 'normal', label: 'Normale' },
  { value: 'high', label: 'Haute' },
  { value: 'urgent', label: 'Urgente' },
];

const Help = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { t, lang } = useLanguage();
  const isStarter = user?.subscription?.plan === 'STARTER';
  const [tickets, setTickets] = useState([]);
  const [ticketsLoading, setTicketsLoading] = useState(true);
  const [ticketsError, setTicketsError] = useState('');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    subject: '',
    message: '',
    category: 'general',
    priority: 'normal',
  });

  const loadTickets = async () => {
    try {
      setTicketsError('');
      const res = await api.get('/support/tickets');
      setTickets(res.data || []);
    } catch (error) {
      console.error('Unable to fetch support tickets', error);
      setTicketsError("Impossible de charger vos tickets support.");
    } finally {
      setTicketsLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const submitTicket = async (event) => {
    event.preventDefault();
    try {
      setSaving(true);
      setTicketsError('');
      await api.post('/support/tickets', form);
      setForm({ subject: '', message: '', category: 'general', priority: 'normal' });
      await loadTickets();
    } catch (error) {
      console.error('Unable to create support ticket', error);
      setTicketsError(error.response?.data?.message || "Impossible d'envoyer la demande support.");
    } finally {
      setSaving(false);
    }
  };

  const faqsByLang = {
    fr: [
      { question: "Comment créer une nouvelle facture ?", answer: "Allez dans l'onglet Factures et cliquez sur 'Nouvelle Facture'. Sélectionnez un client, ajoutez les lignes et enregistrez." },
      { question: "Qu'est-ce que XAdES-B ?", answer: "XAdES-B est le format de signature attendu par la TTN. Vous pouvez importer votre certificat .p12 dans les Paramètres." },
      { question: "Comment ajouter mon logo ?", answer: "Dans les Paramètres, section profil, importez votre logo pour qu'il apparaisse sur vos documents PDF." },
      { question: "Puis-je convertir un Devis en Facture ?", answer: "Oui. Depuis la liste des Devis, cliquez sur l'icône 'Convertir en Facture' pour créer un brouillon de facture." },
      { question: "L'assistant IA peut-il valider mes factures ?", answer: "Non. Il aide à comprendre, rédiger et expliquer, mais il ne remplace pas un expert-comptable, fiscaliste ou conseiller juridique. Les actions sensibles exigent votre confirmation." },
      { question: "Comment préparer TTN et la signature électronique ?", answer: "Consultez la page Accompagnement TTN & Signature pour préparer l'adhésion, le certificat et la configuration. Les exigences officielles doivent être vérifiées avant production." },
    ],
    en: [
      { question: "How do I create a new invoice?", answer: "Navigate to the Invoices tab and click the 'New Invoice' button. Select a client, add product lines, and save." },
      { question: "What is XAdES-B and how does it work?", answer: "XAdES-B is an electronic signature format expected by TTN. Upload your company's .p12 certificate in Settings." },
      { question: "How do I add my company logo?", answer: "Go to Settings, company profile, and upload your logo. It will appear on your generated PDF invoices and quotes." },
      { question: "Can I convert a Quote into an Invoice?", answer: "Yes. From the Quotes list, click the convert icon on any existing quote." },
    ],
    ar: [
      { question: "كيف أنشئ فاتورة جديدة؟", answer: "انتقل إلى قسم الفواتير وانقر على 'فاتورة جديدة'. اختر عميلاً، أضف البنود ثم احفظ." },
      { question: "ما هو توقيع XAdES-B؟", answer: "XAdES-B هو تنسيق التوقيع الإلكتروني المطلوب من قِبل TTN. يمكنك رفع شهادة .p12 الخاصة بشركتك من خلال الإعدادات." },
      { question: "كيف أضيف شعار شركتي؟", answer: "انتقل إلى الإعدادات، قسم الملف الشخصي، وارفع شعارك ليظهر على جميع فواتير وعروض الأسعار PDF." },
      { question: "هل يمكنني تحويل عرض السعر إلى فاتورة؟", answer: "نعم. من قائمة عروض الأسعار، انقر على أيقونة 'تحويل إلى فاتورة' لإنشاء مسودة فاتورة بنفس البيانات." },
    ],
  };
  const faqs = faqsByLang[lang] ?? faqsByLang.fr;

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Support & assistance</h1>
        <p className="text-gray-500">{t('helpPage.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <MessageSquare className="w-5 h-5 me-2 text-blue-600" />
              Nouvelle demande support
            </h2>
            <form onSubmit={submitTicket} className="space-y-4">
              <input
                value={form.subject}
                onChange={(event) => setForm((prev) => ({ ...prev, subject: event.target.value }))}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-blue-100"
                placeholder="Sujet"
                required
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <select
                  value={form.category}
                  onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-blue-100"
                >
                  {categories.map((category) => <option key={category.value} value={category.value}>{category.label}</option>)}
                </select>
                <select
                  value={form.priority}
                  onChange={(event) => setForm((prev) => ({ ...prev, priority: event.target.value }))}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-blue-100"
                >
                  {priorities.map((priority) => <option key={priority.value} value={priority.value}>{priority.label}</option>)}
                </select>
              </div>
              <textarea
                value={form.message}
                onChange={(event) => setForm((prev) => ({ ...prev, message: event.target.value }))}
                rows={6}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-blue-100"
                placeholder="Expliquez votre besoin, le blocage, ou la question..."
                required
              />
              {ticketsError ? <div className="text-sm font-semibold text-red-600">{ticketsError}</div> : null}
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Envoyer la demande
              </button>
            </form>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <HelpCircle className="w-5 h-5 me-2 text-blue-600" />
              Mes tickets
            </h2>
            {ticketsLoading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
            ) : tickets.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center">
                <div className="text-sm font-bold text-gray-900">Aucun ticket pour le moment</div>
                <div className="text-sm text-gray-500 mt-1">Vos demandes et les reponses admin apparaitront ici.</div>
              </div>
            ) : (
              <div className="space-y-4">
                {tickets.map((ticket) => (
                  <div key={ticket.id} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                      <div>
                        <div className="text-sm font-black text-gray-900">{ticket.subject}</div>
                        <div className="text-xs text-gray-500 mt-1">{ticket.category} - {ticket.priority} - {ticket.status}</div>
                      </div>
                      <div className="text-xs text-gray-400">{new Date(ticket.createdAt).toLocaleString()}</div>
                    </div>
                    <p className="mt-3 text-sm text-gray-600 whitespace-pre-wrap">{ticket.message}</p>
                    <div className="mt-4 space-y-3">
                      {(ticket.replies || []).length > 0 ? (
                        ticket.replies.map((reply) => (
                          <div key={reply.id} className="rounded-xl bg-white border border-gray-100 p-3">
                            <div className="text-xs font-bold text-blue-700">{reply.authorName}</div>
                            <div className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">{reply.message}</div>
                            <div className="mt-2 text-[11px] text-gray-400">{new Date(reply.createdAt).toLocaleString()}</div>
                          </div>
                        ))
                      ) : (
                        <div className="text-xs text-gray-400">Aucune reponse admin pour le moment.</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <HelpCircle className="w-5 h-5 me-2 text-blue-600" />
              {t('helpPage.faqTitle')}
            </h2>
            <div className="space-y-4">
              {faqs.map((faq, idx) => (
                <div key={idx} className="border border-gray-100 rounded-lg p-4 hover:shadow-md transition-shadow bg-gray-50">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">{faq.question}</h3>
                  <p className="text-sm text-gray-600">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className={`relative overflow-hidden rounded-[2rem] p-8 text-white shadow-xl transition-all duration-500 ${isStarter ? 'bg-slate-900 border border-slate-800' : 'bg-gradient-to-br from-indigo-600 to-blue-700 shadow-indigo-100'}`}>
            {!isStarter && <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl animate-pulse" />}
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-black text-xl tracking-tight">{t('helpPage.aiTitle')}</h3>
                {isStarter && (
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-500 text-[10px] font-black uppercase tracking-widest rounded-full text-slate-900 shadow-lg animate-bounce">
                    <Sparkles className="w-3 h-3" />
                    PRO
                  </span>
                )}
              </div>
              <p className={`text-sm mb-6 leading-relaxed font-medium ${isStarter ? 'text-slate-400' : 'text-indigo-50'}`}>
                {isStarter ? t('helpPage.aiSubStarter') : t('helpPage.aiSubPro')}
              </p>
              <button
                onClick={() => {
                  if (isStarter) navigate('/ai');
                  else window.dispatchEvent(new CustomEvent('open-ai-assistant'));
                }}
                className={`w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg ${
                  isStarter ? 'bg-white text-slate-900 hover:bg-amber-500 hover:text-slate-900 border border-white' : 'bg-white text-indigo-600 hover:bg-indigo-50'
                }`}
              >
                {isStarter ? <Lock className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
                {isStarter ? t('helpPage.aiUnlock') : t('helpPage.aiOpen')}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="font-bold text-gray-900 mb-4">{t('helpPage.contactTitle')}</h3>
            <div className="space-y-4">
              <a href="mailto:support@invoicepro.tn" className="flex items-center p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors group">
                <div className="bg-blue-100 p-2 rounded-full me-3 group-hover:bg-blue-200 transition-colors">
                  <Mail className="w-4 h-4 text-blue-700" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{t('helpPage.emailLabel')}</p>
                  <p className="text-xs text-gray-500">support@invoicepro.tn</p>
                </div>
              </a>
              <a href="/e-invoice-guide" className="flex items-center p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors group">
                <div className="bg-green-100 p-2 rounded-full me-3 group-hover:bg-green-200 transition-colors">
                  <FileText className="w-4 h-4 text-green-700" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{t('helpPage.docsLabel')}</p>
                  <p className="text-xs text-gray-500">{t('helpPage.docsDesc')}</p>
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Help;
