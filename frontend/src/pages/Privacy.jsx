import React from 'react';
import { ShieldCheck, ArrowLeft, Lock, Eye, FileText, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

const Privacy = () => {
  const { t, lang } = useLanguage();
  const isRtl = lang === 'ar';

  return (
    <div className={`min-h-screen bg-white text-slate-900 font-sans ${isRtl ? 'rtl' : 'ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Header */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-4 group">
            <div className="bg-slate-100 p-2 rounded-xl group-hover:bg-blue-50 transition-colors">
              <ArrowLeft className={`w-5 h-5 text-slate-600 group-hover:text-blue-600 ${isRtl ? 'rotate-180' : ''}`} />
            </div>
            <span className="font-bold text-slate-600 group-hover:text-blue-600 transition-colors">{t('landing.hero.demo') === 'See demo' ? 'Back' : 'Retour'}</span>
          </Link>
          <div className="flex items-center gap-4">
            <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-100">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-black tracking-tight text-slate-800">InvoicePro</span>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="pt-40 pb-20 bg-slate-50 border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-700 text-xs font-bold mb-6 border border-blue-100">
            <Lock className="w-3.5 h-3.5" />
            {t('landing.footer.privacy')} 
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight mb-6">
            {t('privacy.title')}
          </h1>
          <p className="text-lg text-slate-500 font-medium">
            {t('privacy.subtitle')}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="py-20">
        <div className="max-w-4xl mx-auto px-4 prose prose-slate prose-lg">
          <div className="grid grid-cols-1 gap-12">
            <section className="space-y-4">
              <div className="flex items-center gap-3 text-blue-600 mb-4">
                <Eye className="w-6 h-6" />
                <h2 className="text-2xl font-black m-0">{t('privacy.section1.title')}</h2>
              </div>
              <p className="text-slate-600 leading-relaxed">
                {t('privacy.section1.content')}
              </p>
            </section>

            <section className="space-y-4">
              <div className="flex items-center gap-3 text-indigo-600 mb-4">
                <FileText className="w-6 h-6" />
                <h2 className="text-2xl font-black m-0">{t('privacy.section2.title')}</h2>
              </div>
              <p className="text-slate-600 leading-relaxed">
                {t('privacy.section2.content')}
              </p>
            </section>

            <section className="space-y-4">
               <div className="flex items-center gap-3 text-emerald-600 mb-4">
                <ShieldCheck className="w-6 h-6" />
                <h2 className="text-2xl font-black m-0">{t('privacy.section3.title')}</h2>
              </div>
              <p className="text-slate-600 leading-relaxed bg-emerald-50 p-6 rounded-2xl border border-emerald-100">
                {t('privacy.section3.content')}
              </p>
            </section>

            <section className="space-y-4">
               <div className="flex items-center gap-3 text-amber-600 mb-4">
                <Globe className="w-6 h-6" />
                <h2 className="text-2xl font-black m-0">{t('privacy.section4.title')}</h2>
              </div>
              <p className="text-slate-600 leading-relaxed">
                {t('privacy.section4.content')}
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-black m-0">Données traitées par la plateforme</h2>
              <p className="text-slate-600 leading-relaxed">
                InvoicePro peut traiter le matricule fiscal, les factures, clients, documents commerciaux, statuts de paiement,
                historiques d'action, informations de configuration signature/TTN et paramètres de compte. L'assistant IA reste
                une aide d'utilisation et ne remplace pas un expert-comptable, fiscaliste ou conseiller juridique.
              </p>
              <p className="text-slate-600 leading-relaxed">
                La plateforme présente des informations d’accompagnement concernant les types de signature électronique, l’adhésion TTN et les étapes de configuration. Ces informations sont fournies à titre d’aide et peuvent nécessiter une vérification auprès des organismes officiels ou prestataires concernés. L’utilisateur reste responsable du choix final de sa signature électronique et de la validation de sa conformité.
              </p>
              <p className="text-slate-600 leading-relaxed">
                Les informations relatives à E-Houwiya / Mobile ID, à l’adhésion TTN et aux types de signature électronique sont fournies à titre d’accompagnement. Leur validité, disponibilité et caractère obligatoire doivent être confirmés auprès des organismes officiels concernés.
              </p>
            </section>
          </div>
          
          <div className="mt-20 pt-10 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-400 font-bold">
              {t('privacy.lastUpdated')}: 20/03/2026
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-12 bg-white border-t border-slate-100 text-center">
        <p className="text-sm text-slate-400 font-medium">© 2026 InvoicePro. {t('landing.footer.madeIn')}</p>
      </footer>
    </div>
  );
};

export default Privacy;

