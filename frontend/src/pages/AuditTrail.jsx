import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Clock3, Filter, Loader } from 'lucide-react';
import api from '../services/api';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Select from '../components/ui/Select';

const OBJECT_TYPES = ['', 'PROJECT_IDEA', 'OFFER', 'DEVIS', 'INVOICE', 'PAYMENT', 'PROFILE', 'TTN_SUBMISSION', 'CLIENT', 'SETTINGS'];
const ACTION_TYPES = ['', 'CREATED', 'UPDATED', 'DELETED', 'SENT', 'ACCEPTED', 'REJECTED', 'REQUESTED_CHANGE', 'SIGNED', 'SUBMITTED_TTN', 'VALIDATED_TTN', 'REJECTED_TTN', 'PAID', 'PARTIALLY_PAID', 'PROFILE_UPDATED', 'STATUS_CHANGED', 'PDF_GENERATED', 'XML_GENERATED'];

const AuditTrail = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ objectType: '', actionType: '' });

  const fetchActivities = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.objectType) params.objectType = filters.objectType;
      if (filters.actionType) params.actionType = filters.actionType;
      const response = await api.get('/audit-trail', { params });
      setActivities(response.data || []);
    } finally {
      setLoading(false);
    }
  }, [filters.actionType, filters.objectType]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const grouped = useMemo(() => activities, [activities]);

  return (
    <div className="space-y-6 pb-20">
      <div>
        <h1 className="text-2xl font-black text-slate-900 font-display">Historique & Traçabilité</h1>
        <p className="text-sm text-slate-500 font-medium">Toutes les actions importantes, classees de la plus recente a la plus ancienne.</p>
      </div>

      <Card icon={Filter}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Type d'objet"
            value={filters.objectType}
            options={OBJECT_TYPES.map((type) => ({ value: type, label: type || 'Tous les objets' }))}
            onChange={(event) => setFilters((value) => ({ ...value, objectType: event.target.value }))}
          />
          <Select
            label="Type d'action"
            value={filters.actionType}
            options={ACTION_TYPES.map((type) => ({ value: type, label: type || 'Toutes les actions' }))}
            onChange={(event) => setFilters((value) => ({ ...value, actionType: event.target.value }))}
          />
        </div>
      </Card>

      <Card title="Journal chronologique" icon={Clock3} noPadding>
        {loading ? (
          <div className="py-16 flex justify-center"><Loader className="w-6 h-6 animate-spin text-indigo-600" /></div>
        ) : grouped.length === 0 ? (
          <div className="py-16 text-center text-sm text-slate-400 font-semibold">Aucune activite enregistree.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {grouped.map((item) => (
              <div key={item.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <Badge variant="primary">{item.actionType}</Badge>
                    <Badge variant="secondary">{item.objectType}</Badge>
                    <span className="text-xs text-slate-400 font-bold">{item.actorType}</span>
                  </div>
                  <p className="text-sm font-bold text-slate-800">{item.message}</p>
                  <p className="text-xs text-slate-400 mt-1">{item.objectId}</p>
                </div>
                <div className="text-xs font-bold text-slate-500">
                  {new Date(item.createdAt).toLocaleString('fr-TN')}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default AuditTrail;
