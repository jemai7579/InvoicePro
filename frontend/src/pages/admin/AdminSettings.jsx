import React, { useEffect, useMemo, useState } from 'react';
import { BellRing, Loader2, Save, Settings, ShieldCheck, Sparkles, Wrench } from 'lucide-react';
import api from '../../services/api';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';

const groupSetting = (key = '') => {
  const upper = key.toUpperCase();
  if (upper.includes('TTN')) return 'TTN mode';
  if (upper.includes('EMAIL')) return 'Modeles email';
  if (upper.includes('NOTIF')) return 'Notifications';
  if (upper.includes('MAINTENANCE')) return 'Maintenance';
  if (upper.includes('LEGAL') || upper.includes('CGU')) return 'Parametres legaux';
  if (upper.includes('FEATURE') || upper.includes('ENABLE')) return 'Feature flags';
  if (upper.includes('PLAN') || upper.includes('QUOTA')) return 'Plans et quotas';
  return 'General platform settings';
};

const AdminSettings = () => {
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState('');
  const [settings, setSettings] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [sendingNotif, setSendingNotif] = useState(false);

  const load = async () => {
    try {
      const res = await api.get('/admin/settings');
      setSettings(res.data || []);
      setDrafts(
        (res.data || []).reduce((acc, item) => {
          acc[item.id] = item.value || '';
          return acc;
        }, {})
      );
    } catch (error) {
      console.error('Unable to fetch system settings', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const grouped = useMemo(() => {
    const output = {};
    settings.forEach((setting) => {
      const key = groupSetting(setting.key);
      output[key] = [...(output[key] || []), setting];
    });
    return output;
  }, [settings]);

  const saveSetting = async (id) => {
    setSavingKey(id);
    try {
      await api.put(`/admin/settings/${id}`, { value: drafts[id] });
      await load();
    } catch (error) {
      console.error('Unable to save setting', error);
    } finally {
      setSavingKey('');
    }
  };

  const sendNotification = async () => {
    if (!notifTitle.trim() || !notifMessage.trim()) return;
    setSendingNotif(true);
    try {
      await api.post('/admin/notifications', { title: notifTitle, message: notifMessage, type: 'INFO' });
      setNotifTitle('');
      setNotifMessage('');
    } catch (error) {
      console.error('Unable to send global notification', error);
    } finally {
      setSendingNotif(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-premium-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Parametres plateforme</h2>
        <p className="text-sm text-slate-500 font-medium">
          Reglez les parametres generaux, le mode TTN, les notifications et les options de la plateforme.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.15fr_0.85fr] gap-6">
        <div className="space-y-6">
          {Object.entries(grouped).map(([group, entries]) => (
            <Card key={group} title={group} subtitle="Parametres modifies uniquement par les admins plateforme">
              <div className="space-y-4">
                {entries.map((entry) => (
                  <div key={entry.id} className="rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-4">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-black text-slate-900 break-all">{entry.label || entry.key}</div>
                        <div className="text-xs text-slate-400 mt-1">{entry.key}</div>
                      </div>
                      <div className="flex-1">
                        <input
                          value={drafts[entry.id] || ''}
                          onChange={(event) => setDrafts((current) => ({ ...current, [entry.id]: event.target.value }))}
                          className="w-full rounded-2xl border border-slate-100 bg-white px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-premium-100"
                        />
                      </div>
                      <Button
                        size="sm"
                        icon={Save}
                        isLoading={savingKey === entry.id}
                        onClick={() => saveSetting(entry.id)}
                      >
                        Enregistrer
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>

        <div className="space-y-6">
          <Card title="Configuration rapide" subtitle="Lecture simple pour le dirigeant">
            <div className="space-y-3">
              <div className="rounded-2xl bg-slate-50 border border-slate-100 px-4 py-4 flex items-center gap-3">
                <Settings className="w-10 h-10 p-2 rounded-2xl bg-premium-50 text-premium-600" />
                <div>
                  <div className="text-sm font-black text-slate-900">Plateforme</div>
                  <div className="text-sm text-slate-500">Parametres generaux et quotas centralises.</div>
                </div>
              </div>
              <div className="rounded-2xl bg-slate-50 border border-slate-100 px-4 py-4 flex items-center gap-3">
                <ShieldCheck className="w-10 h-10 p-2 rounded-2xl bg-emerald-50 text-emerald-600" />
                <div>
                  <div className="text-sm font-black text-slate-900">TTN & conformite</div>
                  <div className="text-sm text-slate-500">Le mode TTN et la signature restent pilotables sans exposer les secrets.</div>
                </div>
              </div>
              <div className="rounded-2xl bg-slate-50 border border-slate-100 px-4 py-4 flex items-center gap-3">
                <Sparkles className="w-10 h-10 p-2 rounded-2xl bg-amber-50 text-amber-600" />
                <div>
                  <div className="text-sm font-black text-slate-900">Feature flags</div>
                  <div className="text-sm text-slate-500">Activez ou desactivez les fonctions de maniere progressive.</div>
                </div>
              </div>
            </div>
          </Card>

          <Card title="Notification globale" subtitle="Informer toutes les entreprises en un seul envoi">
            <div className="space-y-3">
              <input
                value={notifTitle}
                onChange={(event) => setNotifTitle(event.target.value)}
                placeholder="Titre de la notification"
                className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-premium-100"
              />
              <textarea
                value={notifMessage}
                onChange={(event) => setNotifMessage(event.target.value)}
                placeholder="Message envoye a toutes les entreprises"
                className="w-full min-h-[140px] rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-premium-100"
              />
              <Button icon={BellRing} isLoading={sendingNotif} onClick={sendNotification}>
                Envoyer la notification
              </Button>
            </div>
          </Card>

          <Card title="Rappel securite" subtitle="Les valeurs sensibles restent cote backend">
            <div className="space-y-3 text-sm text-slate-600">
              <div className="rounded-2xl bg-slate-50 border border-slate-100 px-4 py-4">Les cles privees, secrets TTN, PINs et credentials ne sont jamais exposes au frontend.</div>
              <div className="rounded-2xl bg-slate-50 border border-slate-100 px-4 py-4">Les modifications dangereuses doivent rester visibles dans les logs d'activite admin.</div>
              <div className="rounded-2xl bg-slate-50 border border-slate-100 px-4 py-4">Le mode maintenance et les flags peuvent etre pilotes sans toucher a l'authentification publique.</div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
