import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, CheckCircle2, HelpCircle, ShieldCheck } from 'lucide-react';
import api from '../services/api';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';

const emptyForm = {
  name: '',
  companyName: '',
  email: '',
  phone: '',
  needType: 'E_HOUWIYA_MOBILE_ID',
  message: '',
};

const journeySteps = [
  {
    title: 'Vérifier E-Houwiya / Mobile ID',
    text: 'Confirmez si un identifiant est nécessaire selon votre statut.',
    status: 'À vérifier',
  },
  {
    title: 'Préparer l’adhésion TTN',
    text: 'Rassemblez les informations demandées pour le parcours TTN.',
    status: 'À vérifier',
  },
  {
    title: 'Choisir le type de signature',
    text: 'Comparez E-Houwiya, TunTrust / ANCE, HERS ou un tiers de confiance.',
    status: 'En cours',
  },
  {
    title: 'Configurer InvoicePro',
    text: 'Renseignez la configuration et les éléments de signature disponibles.',
    status: 'En cours',
  },
  {
    title: 'Tester l’envoi d’une facture',
    text: 'Validez le parcours en mode test avant toute mise en production.',
    status: 'À vérifier',
  },
];

const situations = [
  { title: 'Je suis entrepreneur / freelance', text: 'Commencez par vérifier E-Houwiya / Mobile ID et le parcours TTN adapté.' },
  { title: 'Je suis TPE', text: 'Comparez une signature simple, un certificat et le niveau d’accompagnement nécessaire.' },
  { title: 'Je suis PME', text: 'Privilégiez un parcours structuré avec contrôle interne et procédure fournisseur claire.' },
  { title: 'J’ai déjà une signature', text: 'Vérifiez son format, sa validité et sa compatibilité TEIF / TTN.' },
  { title: 'Je ne sais pas quoi choisir', text: 'Décrivez votre statut et votre volume pour être orienté.' },
  { title: 'Je veux être accompagné', text: 'Envoyez une demande pour cadrer les étapes et les pièces requises.' },
];

const fallbackOptions = [
  {
    id: 'static-e-houwiya',
    name: 'E-Houwiya / Mobile ID',
    targetUsers: 'Entrepreneurs, freelances et petites structures.',
    status: 'À vérifier',
    setupInstructions: 'Étape d’identification numérique à confirmer avant la configuration TTN.',
  },
  {
    id: 'static-tuntrust',
    name: 'TunTrust / ANCE',
    targetUsers: 'Sociétés avec besoin de certificat formel.',
    status: 'Prévu',
    setupInstructions: 'Certificat et procédure fournisseur à vérifier avant production.',
  },
  {
    id: 'static-hers',
    name: 'HERS ou autre type',
    targetUsers: 'Cas spécifiques à confirmer.',
    status: 'À vérifier',
    setupInstructions: 'Documentation, prix et compatibilité TTN à confirmer.',
  },
  {
    id: 'static-trust-provider',
    name: 'Tiers de confiance / service provider',
    targetUsers: 'Entreprises voulant un accompagnement délégué.',
    status: 'À vérifier',
    setupInstructions: 'Peut nécessiter un contrat, un accès API ou une validation officielle.',
  },
];

const statusVariant = (status) => {
  if (status === 'Terminé' || status === 'AVAILABLE') return 'success';
  if (status === 'En cours' || status === 'PLANNED' || status === 'Prévu') return 'primary';
  return 'warning';
};

const normalizeStatus = (status) => {
  if (status === 'AVAILABLE') return 'Terminé';
  if (status === 'PLANNED') return 'Prévu';
  return 'À vérifier';
};

const SignatureTTN = () => {
  const [options, setOptions] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [_sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    api.get('/onboarding/signature-providers')
      .then((res) => setOptions(res.data || []))
      .catch(() => setOptions([]));
  }, []);

  const signatureOptions = useMemo(() => {
    const source = options.length > 0 ? options : fallbackOptions;
    return source.slice(0, 4).map((option) => ({
      ...option,
      displayStatus: normalizeStatus(option.status),
      note: option.setupInstructions || 'Conditions officielles à vérifier.',
    }));
  }, [options]);

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);
    try {
      await api.post('/onboarding/requests', form);
      setSent(true);
      setForm(emptyForm);
      setMessage({ type: 'success', text: 'Votre demande a été envoyée. Un conseiller pourra vous recontacter.' });
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Impossible d’envoyer la demande.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="max-w-3xl">
        <h1 className="text-2xl font-black text-slate-900 font-display">Accompagnement TTN & Signature</h1>
        <p className="mt-2 text-sm text-slate-500 font-medium leading-6">
          Suivez un parcours simple pour préparer votre facturation électronique : identification, adhésion TTN, choix de signature, configuration et test.
        </p>
      </div>

      <Card icon={ShieldCheck} title="Parcours en 5 étapes">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {journeySteps.map((step, index) => (
            <div key={step.title} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-xs font-black text-indigo-600">0{index + 1}</span>
                <Badge variant={statusVariant(step.status)}>{step.status}</Badge>
              </div>
              <h3 className="text-sm font-black text-slate-900 leading-5">{step.title}</h3>
              <p className="mt-2 text-xs font-semibold text-slate-500 leading-5">{step.text}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card icon={HelpCircle} title="Quelle est votre situation ?">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {situations.map((item) => (
            <div key={item.title} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-black text-slate-900 mb-2">{item.title}</h3>
              <p className="text-sm text-slate-500 font-medium leading-6">{item.text}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Types de signature">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {signatureOptions.map((option) => (
            <div key={option.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <h3 className="text-sm font-black text-slate-900">{option.name}</h3>
                <Badge variant={statusVariant(option.displayStatus)}>{option.displayStatus}</Badge>
              </div>
              <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">{option.targetUsers}</p>
              <p className="text-sm text-slate-500 font-medium leading-6">{option.note}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Demander un accompagnement" icon={Calendar}>
        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input required className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold" placeholder="Nom" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          <input required className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold" placeholder="Entreprise" value={form.companyName} onChange={(event) => setForm({ ...form, companyName: event.target.value })} />
          <input required type="email" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold" placeholder="Email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
          <input className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold" placeholder="Téléphone" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
          <select className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold" value={form.needType} onChange={(event) => setForm({ ...form, needType: event.target.value })}>
            <option value="E_HOUWIYA_MOBILE_ID">Aide identifiant E-Houwiya / Mobile ID</option>
            <option value="TTN_ADHESION">Adhésion TTN</option>
            <option value="SIGNATURE_SELECTION">Choix du type de signature</option>
            <option value="CERTIFICATE_SETUP">Configuration certificat / signature</option>
            <option value="SERVICE_PROVIDER_INFO">Tiers de confiance / prestataire</option>
            <option value="OTHER">Autre besoin</option>
          </select>
          <textarea className="md:col-span-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold" placeholder="Message" value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} />
          {message ? (
            <div className={`md:col-span-2 rounded-2xl px-4 py-3 text-sm font-bold ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'}`}>
              {message.text}
            </div>
          ) : null}
          <div className="md:col-span-2">
            <Button type="submit" loading={submitting} disabled={submitting} icon={CheckCircle2}>
              Demander un accompagnement
            </Button>
          </div>
        </form>
      </Card>

      <p className="rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 text-xs font-bold text-slate-500 leading-5">
        Les informations sont fournies à titre d’accompagnement. Les conditions officielles doivent être confirmées auprès des organismes concernés.
      </p>
    </div>
  );
};

export default SignatureTTN;
