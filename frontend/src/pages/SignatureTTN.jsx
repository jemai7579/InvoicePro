import React, { useEffect, useState } from 'react';
import { Calendar, ShieldCheck } from 'lucide-react';
import api from '../services/api';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';

const choiceGuides = [
  {
    title: 'Je suis entrepreneur / freelance',
    text: 'Regarder d abord les chemins E-Houwiya / Huwaya ID ou Digigo si le parcours officiel confirme la compatibilite TTN et le prix.',
  },
  {
    title: 'Je suis TPE',
    text: 'Comparer E-Houwiya / Digigo et certificat formel selon volume de factures, statut fiscal et procedure TTN.',
  },
  {
    title: 'Je suis PME',
    text: 'TunTrust / ANCE ou une procedure encadree peut etre plus adaptee si vous avez des besoins de certificat, controle interne ou volume plus eleve.',
  },
  {
    title: 'J’ai déjà une signature électronique',
    text: 'Verifier son format, sa validite, son fournisseur, son usage avec TTN et la possibilite technique de signer les XML TEIF.',
  },
  {
    title: 'Je ne sais pas encore quoi choisir',
    text: 'Lister votre statut, volume de factures, contraintes TTN et niveau d accompagnement souhaite avant de choisir.',
  },
  {
    title: 'Je veux être accompagné',
    text: 'Demander un rendez-vous pour cadrer adhesion TTN, choix signature, couts, pieces requises et configuration plateforme.',
  },
];

const SignatureTTN = () => {
  const [options, setOptions] = useState([]);
  const [form, setForm] = useState({ name: '', companyName: '', email: '', phone: '', needType: 'TTN_ADHESION', message: '' });
  const [sent, setSent] = useState(false);

  useEffect(() => {
    api.get('/onboarding/signature-providers').then((res) => setOptions(res.data || [])).catch(() => {});
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    await api.post('/onboarding/requests', form);
    setSent(true);
  };

  return (
    <div className="space-y-8 pb-20">
      <div>
        <h1 className="text-2xl font-black text-slate-900 font-display">Accompagnement TTN & Signature</h1>
        <p className="text-sm text-slate-500 font-medium">Informations preparatoires. Les integrations reelles doivent etre verifiees officiellement avant production.</p>
      </div>

      <Card title="Quelle signature choisir ?" subtitle="Le choix depend de votre profil, de votre procedure TTN, de votre volume et du fournisseur.">
        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5 mb-6">
          <p className="text-sm font-bold text-amber-900 leading-6">
            Le choix du type de signature dépend de votre statut, de votre procédure TTN, de votre volume de factures et des exigences techniques du fournisseur de signature. La plateforme peut vous accompagner, mais les conditions officielles doivent être vérifiées auprès des organismes ou prestataires concernés.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {choiceGuides.map((item) => (
            <div key={item.title} className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
              <h3 className="text-sm font-black text-slate-900 mb-2">{item.title}</h3>
              <p className="text-sm text-slate-500 font-medium leading-6">{item.text}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card icon={ShieldCheck} title="Avant la facturation electronique">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {['Adhesion TTN / El Fatoora', 'Signature electronique compatible', 'Certificat ou identite numerique', 'Configuration plateforme', 'Tiers de confiance si necessaire'].map((step, index) => (
            <div key={step} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <div className="text-xs font-black text-indigo-600 mb-2">0{index + 1}</div>
              <p className="text-sm font-bold text-slate-700">{step}</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {options.map((option) => (
          <Card key={option.id} title={option.name} subtitle={option.targetUsers}>
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge variant={option.status === 'AVAILABLE' ? 'success' : 'warning'}>{option.status}</Badge>
              <Badge variant="secondary">{option.difficulty}</Badge>
            </div>
            {option.costDescription ? (
              <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">{option.costDescription}</p>
            ) : null}
            <p className="text-sm text-slate-500 font-medium">{option.setupInstructions}</p>
          </Card>
        ))}
      </div>

      <Card title="Important">
        <p className="text-sm text-slate-600 font-medium leading-7">
          Digigo / E-Houwiya peuvent etre etudies comme chemins d accompagnement potentiellement plus simples pour certains profils. Aucune integration active n est annoncee tant que les API, contrats, tarifs et validations officielles ne sont pas confirmes.
        </p>
      </Card>

      <Card title="Demander un accompagnement" icon={Calendar}>
        {sent ? (
          <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-5 text-sm font-bold text-emerald-700">Votre demande a ete envoyee. Un conseiller pourra vous recontacter.</div>
        ) : (
          <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input required className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold" placeholder="Nom" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            <input required className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold" placeholder="Entreprise" value={form.companyName} onChange={(event) => setForm({ ...form, companyName: event.target.value })} />
            <input required type="email" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold" placeholder="Email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
            <input className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold" placeholder="Telephone" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
            <select className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold" value={form.needType} onChange={(event) => setForm({ ...form, needType: event.target.value })}>
              <option value="TTN_ADHESION">Être guidé pour l'adhésion TTN</option>
              <option value="SIGNATURE_SETUP">Configurer la signature</option>
              <option value="MEETING">Prendre rendez-vous</option>
            </select>
            <textarea className="md:col-span-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold" placeholder="Message" value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} />
            <div className="md:col-span-2 flex flex-wrap gap-3">
              <Button type="submit">Demander un accompagnement</Button>
              <Button type="submit" variant="secondary">Prendre rendez-vous</Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
};

export default SignatureTTN;
