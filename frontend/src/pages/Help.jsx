import { HelpCircle, Mail, MessageSquare, FileText, Sparkles, Lock } from 'lucide-react';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

const Help = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { t, lang } = useLanguage();
  const isStarter = user?.subscription?.plan === 'STARTER';
  const isRtl = lang === 'ar';

  const faqs = [
    {
      question: lang === 'fr' ? "Comment créer une nouvelle facture ?" : "How do I create a new invoice?",
      answer: lang === 'fr' ? "Allez dans l'onglet Factures et cliquez sur 'Nouvelle Facture'. Sélectionnez un client, ajoutez les lignes et enregistrez." : "Navigate to the Invoices tab and click the 'New Invoice' button in the top right corner. Select a client, add product lines, and save."
    },
    {
      question: lang === 'fr' ? "Qu'est-ce que XAdES-B ?" : "What is XAdES-B and how does it work?",
      answer: lang === 'fr' ? "XAdES-B est le format de signature attendu par la TTN. Vous pouvez importer votre certificat .p12 dans les Paramètres." : "XAdES-B is an electronic signature format expected by TTN. You can upload your company's .p12 certificate in Settings, and the system will automatically sign your XML invoices."
    },
    {
      question: lang === 'fr' ? "Comment ajouter mon logo ?" : "How do I add my company logo?",
      answer: lang === 'fr' ? "Dans les Paramètres, section profil, importez votre logo pour qu'il apparaisse sur vos documents PDF." : "Go to Settings, and in the company profile section, upload your logo. It will appear on all your generated PDF invoices and quotes."
    },
    {
      question: lang === 'fr' ? "Puis-je convertir un Devis en Facture ?" : "Can I convert a Quote (Devis) into an Invoice?",
      answer: lang === 'fr' ? "Oui. Depuis la liste des Devis, cliquez sur l'icône 'Convertir en Facture' pour créer un brouillon de facture." : "Yes. From the Quotes list, click the 'Convert to Invoice' icon on any existing quote. The system will create a draft invoice with the same data."
    }
  ];

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Help Center</h1>
        <p className="text-gray-500">Find answers, get support, and learn how to use El Fatoora.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main FAQ Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <HelpCircle className="w-5 h-5 me-2 text-blue-600" />
              Frequently Asked Questions
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

        {/* Support Sidebar */}
        <div className="space-y-6">
          <div className={`relative overflow-hidden rounded-[2rem] p-8 text-white shadow-xl transition-all duration-500 ${isStarter ? 'bg-slate-900 border border-slate-800' : 'bg-gradient-to-br from-indigo-600 to-blue-700 shadow-indigo-100'}`}>
            {/* Animated Glow for Pro */}
            {!isStarter && <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl animate-pulse" />}
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-black text-xl tracking-tight">
                  {lang === 'fr' ? 'Besoin d\'IA ?' : 'Need AI Assistance?'}
                </h3>
                {isStarter && (
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-500 text-[10px] font-black uppercase tracking-widest rounded-full text-slate-900 shadow-lg animate-bounce">
                    <Sparkles className="w-3 h-3" />
                    PRO
                  </span>
                )}
              </div>
              
              <p className={`text-sm mb-6 leading-relaxed font-medium ${isStarter ? 'text-slate-400' : 'text-indigo-50'}`}>
                {isStarter 
                  ? (lang === 'fr' 
                      ? 'L’assistant IA est disponible uniquement avec l’offre Professional ou Enterprise pour automatiser votre gestion.'
                      : 'The AI Assistant is available only with Professional or Enterprise plans to automate your workflows.')
                  : (lang === 'fr'
                      ? 'Notre IA est disponible 24/7 pour vous aider à naviguer, générer des factures ou répondre à vos questions techniques.'
                      : 'Our AI Assistant is available 24/7 to help you navigate, generate invoices, or answer technical questions.')
                }
              </p>
              
              <button 
                onClick={() => {
                  if (isStarter) {
                    navigate('/ai'); // Will show the upgrade overlay
                  } else {
                    window.dispatchEvent(new CustomEvent('open-ai-assistant'));
                  }
                }}
                className={`w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg ${
                  isStarter 
                  ? 'bg-white text-slate-900 hover:bg-amber-500 hover:text-slate-900 border border-white' 
                  : 'bg-white text-indigo-600 hover:bg-indigo-50'
                }`}
              >
                {isStarter ? <Lock className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
                {isStarter 
                  ? (lang === 'fr' ? 'Débloquer l\'IA' : 'Unlock AI') 
                  : (lang === 'fr' ? 'Ouvrir l\'Assistant' : 'Open AI Assistant')
                }
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="font-bold text-gray-900 mb-4">Contact Support</h3>
            <div className="space-y-4">
              <a href="mailto:support@elfatoora.tn" className="flex items-center p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors group">
                <div className="bg-blue-100 p-2 rounded-full me-3 group-hover:bg-blue-200 transition-colors">
                  <Mail className="w-4 h-4 text-blue-700" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Email Us</p>
                  <p className="text-xs text-gray-500">support@elfatoora.tn</p>
                </div>
              </a>
              <a href="#" className="flex items-center p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors group">
                <div className="bg-green-100 p-2 rounded-full me-3 group-hover:bg-green-200 transition-colors">
                  <FileText className="w-4 h-4 text-green-700" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Read Documentation</p>
                  <p className="text-xs text-gray-500">API guides & manuals</p>
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

