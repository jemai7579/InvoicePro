import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, ChevronLeft } from 'lucide-react';

const LegalLayout = ({ title, children }) => (
  <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
    <div className="max-w-3xl mx-auto">
      <Link to="/" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-blue-600 mb-8 transition-colors">
        <ChevronLeft className="w-4 h-4 me-1" />
        Retour à l'accueil
      </Link>
      <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden p-8 md:p-12 font-sans">
        <div className="flex items-center gap-2 mb-8">
          <div className="bg-blue-600 p-2 rounded-xl">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-800">El Fatoura</span>
        </div>
        <h1 className="text-3xl font-black text-slate-900 mb-8 tracking-tight">{title}</h1>
        <div className="prose prose-slate prose-blue max-w-none text-slate-600 font-medium leading-relaxed">
          {children}
        </div>
      </div>
      <div className="mt-12 text-center">
        <p className="text-sm text-slate-400">© 2024 El Fatoura. Tous droits réservés.</p>
      </div>
    </div>
  </div>
);

export const Terms = () => (
  <LegalLayout title="Conditions d'Utilisation">
    <h2>1. Acceptation des conditions</h2>
    <p>En accédant au service El Fatoura, vous acceptez d'être lié par les présentes conditions d'utilisation.</p>
    <h2>2. Description du service</h2>
    <p>El Fatoura est une plateforme SaaS de facturation électronique conforme aux normes tunisiennes (TEIF).</p>
    <h2>3. Responsabilité</h2>
    <p>L'utilisateur est responsable de la véracité des données saisies et de la validité de son certificat de signature.</p>
  </LegalLayout>
);

export const Privacy = () => (
  <LegalLayout title="Politique de Confidentialité">
    <h2>1. Collecte des données</h2>
    <p>Nous collectons les données nécessaires à la gestion de votre facturation et à la conformité légale.</p>
    <h2>2. Sécurité</h2>
    <p>Vos données et vos factures sont chiffrées et stockées sur des serveurs sécurisés.</p>
    <h2>3. Vos droits</h2>
    <p>Conformément à la loi tunisienne, vous disposez d'un droit d'accès et de rectification de vos données personnelles.</p>
  </LegalLayout>
);

export const CGV = () => (
  <LegalLayout title="Conditions Générales de Vente">
    <h2>1. Tarification</h2>
    <p>Les tarifs sont calculés sur une base mensuelle ou annuelle selon le forfait choisi.</p>
    <h2>2. Paiement</h2>
    <p>Le paiement s'effectue par virement, chèque ou paiement en ligne via nos partenaires agréés.</p>
    <h2>3. Résiliation</h2>
    <p>L'abonnement peut être résilié à tout moment depuis les paramètres de votre compte.</p>
  </LegalLayout>
);

export const Legal = () => (
  <LegalLayout title="Mentions Légales">
    <p>El Fatoura est édité par : [Nom de votre société]</p>
    <p>Siège social : [Adresse en Tunisie]</p>
    <p>MF : [Matricule Fiscal]</p>
    <p>Directeur de la publication : [Nom]</p>
    <p>Hébergement : [Serveur sécurisé en Tunisie]</p>
  </LegalLayout>
);

