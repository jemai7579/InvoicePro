import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Building2,
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  FileCode2,
  FileText,
  HelpCircle,
  LockKeyhole,
  Send,
  ShieldCheck,
} from 'lucide-react';
import BrandLogo from '../components/BrandLogo';
import Badge from '../components/ui/Badge';

const sources = {
  idaratyAdhesion: {
    label: 'Idaraty',
    title: 'Idaraty — Adhésion au système de facturation électronique',
    url: 'https://idaraty.tn/fr/procedures/adhesion-au-systeme-de-facturation-electronique',
  },
  idaratyUse: {
    label: 'Idaraty — utilisation',
    title: 'Idaraty — Utilisation de la facture électronique',
    url: 'https://www.idaraty.tn/public/fr/procedures/utilisation-de-la-facture-electronique',
  },
  elfatooraHome: {
    label: 'El Fatoora',
    title: 'El Fatoora — Plateforme nationale opérée par TTN',
    url: 'https://adhesion.elfatoora.tn/home',
  },
  elfatooraAdhesion: {
    label: 'El Fatoora — adhésion',
    title: 'El Fatoora — Parcours d’adhésion',
    url: 'https://adhesion.elfatoora.tn/',
  },
  ttnGuide: {
    label: 'Guide TTN',
    title: 'TTN — Guide d’adhésion au service de facturation électronique',
    url: 'https://www.tradenet.com.tn/upload/ElFatoora/Elfatoora_User_Guide.pdf',
  },
  signaturePolicy: {
    label: 'Politique de signature',
    title: 'TTN — Politique de Signature de la facture électronique',
    url: 'https://www.tradenet.com.tn/wp-content/uploads/simple-file-list/Politique_de_Signature_de_la_facture.pdf',
  },
};

const SourceLinks = ({ items }) => (
  <div className="flex flex-wrap gap-2 pt-4">
    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 self-center">Sources :</span>
    {items.map((source) => (
      <a
        key={source.url}
        href={source.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-black text-slate-600 shadow-sm transition-colors hover:border-indigo-200 hover:text-indigo-600"
        title={source.title}
      >
        {source.label}
        <ExternalLink className="h-3 w-3" />
      </a>
    ))}
  </div>
);

const WarningCard = ({ children }) => (
  <div className="mt-5 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-bold text-amber-900">
    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
    <p>{children}</p>
  </div>
);

const InfoCard = ({ children }) => (
  <div className="mt-5 flex gap-3 rounded-2xl border border-indigo-100 bg-indigo-50 px-5 py-4 text-sm font-bold text-indigo-950">
    <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600" />
    <p>{children}</p>
  </div>
);

const Section = ({ number, title, icon: Icon = FileText, children, sourceItems }) => (
  <section className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-xl shadow-slate-200/40 md:p-8">
    <div className="flex items-start gap-4">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
        {React.createElement(Icon, { className: 'h-5 w-5' })}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Section {number}</div>
        <h2 className="mt-1 text-xl font-black tracking-tight text-slate-900 md:text-2xl">{title}</h2>
        <div className="mt-4 space-y-4 text-sm font-medium leading-7 text-slate-600 md:text-base">{children}</div>
        <SourceLinks items={sourceItems} />
      </div>
    </div>
  </section>
);

const Flow = () => (
  <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-5">
    {[
      'Notre plateforme',
      'TEIF',
      'Signature électronique',
      'TTN / El Fatoora',
      'Statut accepté ou rejeté',
    ].map((item, index) => (
      <div key={item} className="flex items-center gap-3 md:block">
        <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4 text-center text-xs font-black uppercase tracking-[0.12em] text-slate-700">
          {item}
        </div>
        {index < 4 ? <ArrowRight className="h-4 w-4 shrink-0 text-indigo-400 md:mx-auto md:my-2" /> : null}
      </div>
    ))}
  </div>
);

const FAQItem = ({ item, open, onClick }) => (
  <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
    >
      <span className="text-sm font-black text-slate-900">{item.question}</span>
      <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
    </button>
    {open ? (
      <div className="border-t border-slate-100 px-5 py-4">
        <p className="text-sm font-medium leading-7 text-slate-600">{item.answer}</p>
        <SourceLinks items={item.sources} />
      </div>
    ) : null}
  </div>
);

const faq = [
  {
    question: 'Est-ce que je peux créer une facture sans dossier complet ?',
    answer:
      'Oui, vous pouvez créer une facture en brouillon ou en simulation, mais vous ne pouvez pas l’envoyer légalement à TTN tant que votre dossier, votre signature électronique et votre configuration TTN ne sont pas prêts.',
    sources: [sources.idaratyAdhesion],
  },
  {
    question: 'Est-ce qu’un PDF est suffisant ?',
    answer:
      'Non. Un PDF seul n’est pas automatiquement une facture électronique légale. La facture électronique doit respecter le processus : informations obligatoires, format conforme, signature électronique, et validation/enregistrement dans le circuit TTN / El Fatoora.',
    sources: [sources.idaratyAdhesion],
  },
  {
    question: 'Pourquoi ma facture est signée mais pas encore acceptée ?',
    answer:
      'Parce que la signature électronique et l’acceptation TTN sont deux étapes différentes. La signature concerne l’émetteur et l’intégrité du document. L’acceptation TTN concerne le traitement et l’enregistrement dans le circuit El Fatoora.',
    sources: [sources.signaturePolicy, sources.elfatooraHome],
  },
  {
    question: 'Est-ce que TTN accepte automatiquement toutes les factures ?',
    answer:
      'Non. Une facture peut être rejetée si elle contient une erreur, si le format n’est pas conforme, si la signature est invalide ou si le compte entreprise n’est pas correctement configuré.',
    sources: [sources.elfatooraHome, sources.idaratyAdhesion],
  },
  {
    question: 'Est-ce que je dois garder une copie ?',
    answer:
      'Oui, selon les procédures administratives, une copie papier de la facture électronique peut être remise sur demande ou lors du transport de marchandises, avec la mention indiquant qu’il s’agit d’une copie de facture électronique enregistrée auprès de l’organisme agréé sous un numéro de référence unique.',
    sources: [sources.idaratyUse],
  },
];

const EInvoiceGuide = () => {
  const [openFaq, setOpenFaq] = useState(0);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <nav className="sticky top-0 z-50 border-b border-slate-200/60 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" className="shrink-0">
            <BrandLogo className="h-10 w-auto max-w-[220px]" />
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/" className="hidden text-sm font-bold text-slate-500 transition-colors hover:text-indigo-600 sm:block">
              Accueil
            </Link>
            <Link
              to="/register"
              className="rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-black text-white shadow-xl shadow-slate-200 transition-colors hover:bg-indigo-600"
            >
              Commencer
            </Link>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
        <header className="overflow-hidden rounded-[2rem] border border-indigo-100 bg-white p-8 shadow-xl shadow-slate-200/50 md:p-12">
          <div className="max-w-4xl">
            <Badge variant="primary" className="mb-5 px-4 py-2 font-black">
              Guide e-Facture
            </Badge>
            <h1 className="text-4xl font-black tracking-tight text-slate-950 md:text-6xl">
              Comprendre la facture électronique
            </h1>
            <p className="mt-5 text-lg font-medium leading-8 text-slate-600">
              Un guide simple pour comprendre TTN, El Fatoora, TEIF, la signature électronique, le dossier entreprise et les statuts d’une facture.
            </p>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {[
            { label: 'Simulation', desc: 'Démonstration uniquement, non légal.', tone: 'warning' },
            { label: 'Sandbox', desc: 'Tests techniques si TTN fournit un environnement.', tone: 'primary' },
            { label: 'Production', desc: 'Actions confirmées par les services réels.', tone: 'success' },
          ].map((mode) => (
            <div key={mode.label} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <Badge variant={mode.tone} className="mb-3 font-black">{mode.label}</Badge>
              <p className="text-sm font-semibold text-slate-600">{mode.desc}</p>
            </div>
          ))}
        </div>

        <Section
          number="1"
          title="Comprendre la facture électronique en Tunisie"
          icon={FileText}
          sourceItems={[sources.idaratyAdhesion, sources.elfatooraHome]}
        >
          <p>
            La facturation électronique ne consiste pas seulement à créer un PDF. Une facture devient réellement électronique lorsqu’elle respecte un processus complet : création de la facture, génération du format technique, signature électronique, transmission à TTN / El Fatoora, puis réception d’un statut officiel.
          </p>
        </Section>

        <Section number="2" title="C’est quoi une facture électronique ?" icon={BadgeCheck} sourceItems={[sources.idaratyAdhesion]}>
          <p>
            Une facture électronique contient les mêmes mentions obligatoires qu’une facture papier, mais elle ajoute aussi des éléments numériques importants : la signature électronique de l’émetteur, un identifiant unique, un QR Code signé ou cachet électronique visible, et la confirmation d’enregistrement par TTN.
          </p>
          <InfoCard>Une facture PDF seule n’est pas automatiquement une facture électronique légale.</InfoCard>
        </Section>

        <Section number="3" title="C’est quoi TTN / El Fatoora ?" icon={Send} sourceItems={[sources.elfatooraHome, sources.idaratyAdhesion]}>
          <p>
            TTN signifie Tunisie TradeNet. El Fatoora est la plateforme nationale utilisée pour la transmission, le contrôle et le traitement des factures électroniques. Notre plateforme prépare la facture, mais TTN / El Fatoora joue le rôle de validation, traitement et enregistrement officiel dans le circuit de facturation électronique.
          </p>
          <Flow />
        </Section>

        <Section number="4" title="Pourquoi TTN est nécessaire ?" icon={ShieldCheck} sourceItems={[sources.elfatooraHome, sources.idaratyAdhesion]}>
          <p>
            Notre application permet de créer et gérer les factures, mais elle ne remplace pas TTN. TTN / El Fatoora intervient pour recevoir, contrôler, traiter et confirmer les factures électroniques. Sans TTN, la facture peut rester un document interne ou un brouillon, mais elle ne passe pas par le circuit officiel El Fatoora.
          </p>
          <InfoCard>Notre plateforme est l’outil de préparation. TTN / El Fatoora est la porte officielle de validation.</InfoCard>
        </Section>

        <Section number="5" title="C’est quoi le TEIF ?" icon={FileCode2} sourceItems={[sources.idaratyAdhesion, sources.ttnGuide]}>
          <p>
            TEIF signifie Tunisian Electronic Invoice Format. C’est le format technique utilisé pour représenter la facture électronique en Tunisie. Une solution de facturation électronique doit produire une facture conforme au format TEIF avant l’envoi dans le circuit El Fatoora.
          </p>
          <p>
            Quand l’utilisateur crée une facture dans la plateforme, le système transforme les données en fichier TEIF : vendeur, client, lignes de facture, TVA, total HT, total TVA, timbre fiscal et total TTC.
          </p>
        </Section>

        <Section number="6" title="Pourquoi la signature électronique est importante ?" icon={LockKeyhole} sourceItems={[sources.ttnGuide, sources.signaturePolicy, sources.idaratyUse]}>
          <p>
            La signature électronique permet d’identifier l’émetteur de la facture et de protéger l’intégrité des données signées. Les prérequis d’adhésion indiquent que les émetteurs doivent disposer d’un certificat électronique qualifié pour permettre la signature électronique des factures.
          </p>
          <WarningCard>Si la signature électronique n’est pas configurée, la plateforme ne doit pas considérer la facture comme légalement signée.</WarningCard>
        </Section>

        <Section number="7" title="Pourquoi compléter le dossier entreprise ?" icon={Building2} sourceItems={[sources.idaratyAdhesion, sources.elfatooraAdhesion]}>
          <p>
            Avant d’émettre des factures électroniques réelles, l’entreprise doit être identifiable et conforme. Le dossier permet de vérifier les informations importantes comme la raison sociale, le matricule fiscal, l’adresse, le représentant légal, les documents justificatifs, l’adhésion El Fatoora et la méthode de signature électronique.
          </p>
          <div className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-2 lg:grid-cols-4">
            {['Raison sociale', 'Matricule fiscal', 'Adresse', 'Représentant légal', 'Documents justificatifs', 'Statut d’adhésion El Fatoora', 'Signature électronique / certificat', 'Paramètres TTN si disponibles'].map((item) => (
              <div key={item} className="flex items-center gap-2 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                {item}
              </div>
            ))}
          </div>
        </Section>

        <Section number="8" title="Les étapes à suivre par l’utilisateur" icon={CheckCircle2} sourceItems={[sources.idaratyAdhesion, sources.ttnGuide]}>
          <p>Pour utiliser la facturation électronique réelle, l’utilisateur suit généralement ce parcours :</p>
          <ol className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {[
              'Créer un compte sur la plateforme.',
              'Compléter le dossier entreprise.',
              'Ajouter les informations fiscales.',
              'Configurer ou valider la signature électronique.',
              'Vérifier l’adhésion TTN / El Fatoora.',
              'Créer une facture.',
              'Générer le fichier TEIF.',
              'Signer électroniquement la facture.',
              'Envoyer la facture à TTN / El Fatoora.',
              'Suivre le statut : en attente, acceptée ou rejetée.',
            ].map((step, index) => (
              <li key={step} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                <span className="font-black text-indigo-600">{index + 1}. </span>
                {step}
              </li>
            ))}
          </ol>
        </Section>

        <Section number="9" title="Que se passe-t-il après l’envoi à TTN ?" icon={Send} sourceItems={[sources.elfatooraHome, sources.idaratyUse]}>
          <p>
            Quand une facture signée est envoyée à TTN / El Fatoora, elle peut être traitée, contrôlée, acceptée ou rejetée. Une facture ne doit pas être affichée comme acceptée tant que la plateforme n’a pas reçu une confirmation réelle de TTN.
          </p>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {[
              ['En attente', 'La facture a été envoyée et attend le traitement.'],
              ['Acceptée', 'La facture est validée dans le circuit El Fatoora.'],
              ['Rejetée', 'La facture contient une erreur ou ne respecte pas une condition requise.'],
            ].map(([title, desc]) => (
              <div key={title} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="font-black text-slate-900">{title}</div>
                <p className="mt-2 text-sm text-slate-600">{desc}</p>
              </div>
            ))}
          </div>
          <WarningCard>En production, la plateforme ne doit jamais générer une fausse référence TTN ou afficher une fausse acceptation.</WarningCard>
        </Section>

        <Section number="10" title="Différence entre paiement et statut légal" icon={FileText} sourceItems={[sources.idaratyUse]}>
          <p>
            Le paiement et le statut légal électronique ne sont pas la même chose. Une facture peut être payée par le client, mais ne pas encore être acceptée dans le circuit électronique si elle n’a pas été signée ou validée par TTN.
          </p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-5">
              <h3 className="font-black text-slate-900">Statuts de paiement</h3>
              <p className="mt-2 text-sm">Non payée, partiellement payée, payée, en retard.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-5">
              <h3 className="font-black text-slate-900">Statuts légaux</h3>
              <p className="mt-2 text-sm">Brouillon, TEIF généré, prête pour signature, signée, envoyée à TTN, acceptée par TTN, rejetée par TTN.</p>
            </div>
          </div>
        </Section>

        <Section number="11" title="Pourquoi la plateforme bloque certaines actions ?" icon={AlertTriangle} sourceItems={[sources.idaratyAdhesion, sources.ttnGuide]}>
          <p>
            La plateforme peut bloquer certaines actions pour éviter les erreurs légales ou techniques. Par exemple, il ne faut pas envoyer une facture à TTN si le dossier entreprise est incomplet, si le TEIF n’est pas généré, si la signature électronique n’est pas configurée ou si les paramètres TTN sont absents.
          </p>
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {[
              'Impossible de générer TEIF : informations fiscales incomplètes.',
              'Impossible de signer : signature électronique non configurée.',
              'Impossible d’envoyer à TTN : facture non signée.',
              'Impossible de soumettre : dossier entreprise non validé.',
              'Impossible de valider : paramètres TTN manquants.',
            ].map((item) => <li key={item} className="rounded-2xl bg-slate-50 px-4 py-3">{item}</li>)}
          </ul>
        </Section>

        <Section number="12" title="Les statuts du dossier entreprise" icon={Building2} sourceItems={[sources.idaratyAdhesion, sources.ttnGuide]}>
          <p>Pour aider l’utilisateur à comprendre son avancement, la plateforme utilise des statuts de dossier.</p>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {['Incomplet', 'En cours de vérification', 'En attente TTN', 'Prêt pour test', 'Prêt pour production', 'Suspendu'].map((status) => (
              <div key={status} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 font-black text-slate-700">
                {status}
              </div>
            ))}
          </div>
          <p className="text-sm">
            Ces statuts internes sont des statuts de workflow de la plateforme. Ils sont basés sur les prérequis officiels : adhésion El Fatoora, certificat qualifié et solution conforme TEIF.
          </p>
        </Section>

        <Section number="13" title="Comprendre les modes de la plateforme" icon={ShieldCheck} sourceItems={[sources.elfatooraHome, sources.ttnGuide]}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5">
              <Badge variant="warning" className="mb-3 font-black">Mode simulation</Badge>
              <p>Les factures servent uniquement aux tests et démonstrations. Elles ne sont pas envoyées officiellement à TTN et ne doivent pas être considérées comme légales.</p>
            </div>
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-5">
              <Badge variant="primary" className="mb-3 font-black">Mode sandbox / test</Badge>
              <p>La plateforme utilise un environnement de test si TTN le fournit. Les factures servent aux essais techniques et ne doivent pas être considérées comme des factures légales.</p>
            </div>
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
              <Badge variant="success" className="mb-3 font-black">Mode production</Badge>
              <p>La plateforme utilise les vrais paramètres de signature et de connexion TTN. Dans ce mode, les factures ne doivent être affichées comme signées ou acceptées que si les services réels confirment l’action.</p>
            </div>
          </div>
          <WarningCard>Tout ce qui dépend des endpoints, identifiants, erreurs ou preuves officielles doit être confirmé avec TTN.</WarningCard>
        </Section>

        <section className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-xl shadow-slate-200/40 md:p-8">
          <div className="mb-6 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <HelpCircle className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Section 14</div>
              <h2 className="text-2xl font-black tracking-tight text-slate-900">Questions fréquentes</h2>
            </div>
          </div>
          <div className="space-y-3">
            {faq.map((item, index) => (
              <FAQItem key={item.question} item={item} open={openFaq === index} onClick={() => setOpenFaq(openFaq === index ? -1 : index)} />
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-100 bg-slate-900 p-6 text-white shadow-xl shadow-slate-300/60 md:p-8">
          <div className="mb-5 text-[10px] font-black uppercase tracking-[0.25em] text-indigo-300">Section 15</div>
          <h2 className="text-2xl font-black">Sources officielles</h2>
          <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
            {[sources.idaratyAdhesion, sources.idaratyUse, sources.elfatooraHome, sources.ttnGuide, sources.signaturePolicy].map((source, index) => (
              <a
                key={source.url}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm font-bold text-slate-100 transition-colors hover:bg-white/10"
              >
                <span>{index + 1}. {source.title}</span>
                <ExternalLink className="h-4 w-4 shrink-0 text-indigo-300" />
              </a>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default EInvoiceGuide;
