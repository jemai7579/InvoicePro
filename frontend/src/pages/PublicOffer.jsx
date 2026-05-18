import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';

const PublicOffer = () => {
  const { token } = useParams();
  const [offer, setOffer] = useState(null);
  const [comment, setComment] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    api.get(`/public/offers/${token}`).then((res) => setOffer(res.data)).catch(() => setOffer(null));
  }, [token]);

  const respond = async (action) => {
    const response = await api.post(`/public/offers/${token}/respond`, { action, comment });
    setOffer(response.data);
    setDone(true);
  };

  if (!offer) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-sm font-bold text-slate-500">Offre introuvable ou expirée.</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-12">
      <Card className="max-w-3xl mx-auto" title={offer.title} subtitle={offer.number}>
        <div className="space-y-6">
          <Badge variant="primary">{offer.status}</Badge>
          <p className="text-slate-600 font-medium">{offer.description || 'Aucune description.'}</p>
          <div className="rounded-2xl bg-slate-50 border border-slate-100 p-5">
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">Montant estimé</p>
            <p className="text-2xl font-black text-slate-900">{Number(offer.estimatedAmount || 0).toFixed(3)} TND</p>
          </div>
          <textarea className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold" placeholder="Commentaire optionnel" value={comment} onChange={(event) => setComment(event.target.value)} />
          {done ? <p className="text-sm font-bold text-emerald-600">Votre réponse a été enregistrée.</p> : null}
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => respond('accept')}>Accepter</Button>
            <Button variant="secondary" onClick={() => respond('change')}>Demander modification</Button>
            <Button variant="danger" onClick={() => respond('reject')}>Refuser</Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default PublicOffer;

