import React, { useEffect, useMemo, useState } from 'react';
import { BellRing, CheckCircle2, KeyRound, Loader2, Plus, Save, Settings, ShieldCheck, Sparkles, Wrench } from 'lucide-react';
import api from '../../services/api';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';

const groupSetting = (key = '') => {
  const upper = key.toUpperCase();
  if (upper.includes('STAMP') || upper.includes('TVA')) return 'Parametres fiscaux';
  if (upper.includes('TTN') || upper.includes('TEIF') || upper.includes('SIGNATURE')) return 'TTN & conformite';
  if (upper.includes('EMAIL')) return 'Notifications globales';
  if (upper.includes('NOTIF')) return 'Notifications globales';
  if (upper.includes('MAINTENANCE')) return 'Maintenance';
  if (upper.includes('LEGAL') || upper.includes('CGU')) return 'Parametres legaux';
  if (upper.includes('FEATURE') || upper.includes('ENABLE')) return 'Feature flags';
  if (upper.includes('PLAN') || upper.includes('QUOTA')) return 'Plans et quotas';
  return 'General platform settings';
};

const friendlyLabels = {
  STAMP_DUTY: 'Timbre fiscal par defaut',
  TVA_DEFAULT: 'TVA par defaut',
  TTN_API_URL: 'URL API TTN',
};

const integrationLabels = {
  ttn: 'TTN / El Fatoora',
  signature: 'Signature',
  billing: 'Billing',
  email: 'Email SMTP',
  ai: 'AI',
  ga4: 'Google Analytics',
  gtm: 'Google Tag Manager',
  searchConsole: 'Search Console',
  metaPixel: 'Meta Pixel',
};

const integrationFields = {
  ttn: ['baseUrl', 'authEndpoint', 'submitInvoiceEndpoint', 'statusEndpoint', 'apiKey'],
  signature: ['provider', 'apiKey', 'hsmUrl'],
  billing: ['provider', 'apiKey', 'webhookSecret'],
  email: ['host', 'port', 'user', 'password'],
  ai: ['provider', 'apiKey'],
  ga4: ['measurementId'],
  gtm: ['containerId'],
  searchConsole: ['siteUrl', 'serviceAccountPath'],
  metaPixel: ['pixelId'],
};

const AdminSettings = () => {
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState('');
  const [settings, setSettings] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [notifTarget, setNotifTarget] = useState('all');
  const [sendingNotif, setSendingNotif] = useState(false);
  const [integrations, setIntegrations] = useState(null);
  const [integrationDrafts, setIntegrationDrafts] = useState({});
  const [savingIntegration, setSavingIntegration] = useState('');
  const [tvaRates, setTvaRates] = useState([]);
  const [tvaDraft, setTvaDraft] = useState({ rate: '', label: '', active: true, sortOrder: 0 });
  const [savingTva, setSavingTva] = useState('');

  const load = async () => {
    try {
      const res = await api.get('/admin/settings');
      const integrationsRes = await api.get('/admin/integrations/status').catch(() => ({ data: null }));
      const tvaRes = await api.get('/admin/tva-rates').catch(() => ({ data: [] }));
      setSettings(res.data || []);
      setIntegrations(integrationsRes.data);
      setTvaRates(tvaRes.data || []);
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
    const setting = settings.find((item) => item.id === id);
    if (setting?.key?.toUpperCase().includes('TTN') && !window.confirm('Confirmer la modification TTN ? Les endpoints officiels doivent venir de la documentation TTN.')) return;
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
      await api.post('/admin/notifications', { title: notifTitle, message: notifMessage, type: 'INFO', target: notifTarget });
      setNotifTitle('');
      setNotifMessage('');
    } catch (error) {
      console.error('Unable to send global notification', error);
    } finally {
      setSendingNotif(false);
    }
  };

  const saveIntegration = async (key) => {
    setSavingIntegration(key);
    try {
      const res = await api.put(`/admin/integrations/${key}`, integrationDrafts[key] || {});
      setIntegrations(res.data);
      setIntegrationDrafts((current) => ({ ...current, [key]: {} }));
    } catch (error) {
      console.error('Unable to save integration', error);
    } finally {
      setSavingIntegration('');
    }
  };

  const saveTvaRate = async (rate = null) => {
    const payload = rate || tvaDraft;
    setSavingTva(rate?.id || 'new');
    try {
      if (rate?.id) {
        await api.put(`/admin/tva-rates/${rate.id}`, payload);
      } else {
        await api.post('/admin/tva-rates', payload);
        setTvaDraft({ rate: '', label: '', active: true, sortOrder: 0 });
      }
      await load();
    } catch (error) {
      alert(error.response?.data?.message || 'Impossible d’enregistrer la TVA.');
    } finally {
      setSavingTva('');
    }
  };

  const statusFor = (key) => {
    if (['ga4', 'gtm', 'searchConsole', 'metaPixel'].includes(key)) return integrations?.analytics?.[key];
    return integrations?.[key];
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
                        <div className="text-sm font-black text-slate-900 break-all">{friendlyLabels[entry.key] || entry.label || entry.key}</div>
                        <div className="text-xs text-slate-400 mt-1">{entry.key}</div>
                        {entry.key === 'TTN_API_URL' && String(drafts[entry.id] || '').toLowerCase().includes('placeholder') ? (
                          <div className="mt-2 text-xs font-bold text-amber-700">URL TTN placeholder - en attente documentation officielle TTN.</div>
                        ) : null}
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

          <Card title="Integrations & API Keys" subtitle="Secrets chiffres cote backend, jamais renvoyes en clair">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {Object.keys(integrationLabels).map((key) => {
                const status = statusFor(key);
                return (
                  <div key={key} className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-black text-slate-900">{integrationLabels[key]}</div>
                        <div className="text-xs text-slate-500">{status?.configured ? 'Configure' : 'Manquant'} {status?.lastUpdatedAt ? `- ${new Date(status.lastUpdatedAt).toLocaleDateString()}` : ''}</div>
                      </div>
                      <div className={`rounded-full px-3 py-1 text-[10px] font-black uppercase ${status?.configured ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                        {status?.configured ? 'OK' : 'A configurer'}
                      </div>
                    </div>
                    <div className="space-y-2">
                      {(integrationFields[key] || []).map((field) => {
                        const fieldStatus = status?.fields?.find((item) => item.name === field);
                        return (
                          <div key={field}>
                            <label className="mb-1 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                              {field} {fieldStatus?.masked ? <span className="normal-case tracking-normal text-slate-500">({fieldStatus.masked})</span> : null}
                            </label>
                            <input
                              value={integrationDrafts[key]?.[field] || ''}
                              onChange={(event) => setIntegrationDrafts((current) => ({ ...current, [key]: { ...(current[key] || {}), [field]: event.target.value } }))}
                              placeholder={fieldStatus?.configured ? 'Laisser vide pour conserver la valeur' : 'Valeur a configurer'}
                              className="w-full rounded-xl border border-slate-100 bg-white px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-premium-100"
                              type={fieldStatus?.secret ? 'password' : 'text'}
                            />
                          </div>
                        );
                      })}
                    </div>
                    <Button className="mt-4" size="sm" icon={KeyRound} isLoading={savingIntegration === key} onClick={() => saveIntegration(key)}>
                      Enregistrer
                    </Button>
                  </div>
                );
              })}
            </div>
          </Card>
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

          <Card title="TVA globale" subtitle="Taux actifs utilises pour les nouveaux produits, devis et factures">
            <div className="space-y-3">
              {tvaRates.map((rate) => (
                <div key={rate.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-[90px_1fr_90px_auto] sm:items-center">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={rate.rate}
                      onChange={(event) => setTvaRates((items) => items.map((item) => item.id === rate.id ? { ...item, rate: event.target.value } : item))}
                      className="rounded-xl border border-slate-100 bg-white px-3 py-2 text-sm font-black outline-none focus:ring-4 focus:ring-premium-100"
                    />
                    <input
                      value={rate.label}
                      onChange={(event) => setTvaRates((items) => items.map((item) => item.id === rate.id ? { ...item, label: event.target.value } : item))}
                      className="rounded-xl border border-slate-100 bg-white px-3 py-2 text-sm font-semibold outline-none focus:ring-4 focus:ring-premium-100"
                    />
                    <input
                      type="number"
                      value={rate.sortOrder}
                      onChange={(event) => setTvaRates((items) => items.map((item) => item.id === rate.id ? { ...item, sortOrder: Number(event.target.value) } : item))}
                      className="rounded-xl border border-slate-100 bg-white px-3 py-2 text-sm font-semibold outline-none focus:ring-4 focus:ring-premium-100"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setTvaRates((items) => items.map((item) => item.id === rate.id ? { ...item, active: !item.active } : item))}
                        className={`rounded-xl px-3 py-2 text-xs font-black ${rate.active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}
                      >
                        {rate.active ? 'Actif' : 'Inactif'}
                      </button>
                      <Button size="sm" icon={Save} isLoading={savingTva === rate.id} onClick={() => saveTvaRate(rate)}>
                        OK
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-[90px_1fr_90px_auto] sm:items-center">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    placeholder="TVA"
                    value={tvaDraft.rate}
                    onChange={(event) => setTvaDraft((current) => ({ ...current, rate: event.target.value }))}
                    className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm font-black outline-none focus:ring-4 focus:ring-premium-100"
                  />
                  <input
                    placeholder="Libelle"
                    value={tvaDraft.label}
                    onChange={(event) => setTvaDraft((current) => ({ ...current, label: event.target.value }))}
                    className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm font-semibold outline-none focus:ring-4 focus:ring-premium-100"
                  />
                  <input
                    type="number"
                    placeholder="Ordre"
                    value={tvaDraft.sortOrder}
                    onChange={(event) => setTvaDraft((current) => ({ ...current, sortOrder: Number(event.target.value) }))}
                    className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm font-semibold outline-none focus:ring-4 focus:ring-premium-100"
                  />
                  <Button size="sm" icon={Plus} isLoading={savingTva === 'new'} onClick={() => saveTvaRate()}>
                    Ajouter
                  </Button>
                </div>
              </div>
              <div className="rounded-2xl bg-amber-50 px-4 py-3 text-xs font-bold text-amber-800">
                Les anciennes factures ne sont pas recalculées. Les changements s’appliquent aux nouveaux produits, devis et factures.
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
              <select
                value={notifTarget}
                onChange={(event) => setNotifTarget(event.target.value)}
                className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-premium-100"
              >
                <option value="all">Toutes les entreprises</option>
                <option value="active">Entreprises actives</option>
                <option value="trial">Entreprises en essai</option>
                <option value="suspended">Entreprises suspendues</option>
              </select>
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
