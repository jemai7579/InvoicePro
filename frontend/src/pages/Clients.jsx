import React, { useEffect, useMemo, useState } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Loader,
  User,
  Mail,
  Phone,
  MapPin,
  FileText,
  AlertCircle,
  CheckCircle2,
  Send,
  Link2,
  Building2,
  Clock3,
  Check,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import api from '../services/api';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import { getClientNumber } from '../utils/businessNumbers';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const copyByLang = {
  fr: {
    inviteTitle: 'Invitations de collaboration',
    inviteSubtitle: 'Invitez un client ou une autre société à collaborer sur la plateforme.',
    inviteButton: 'Inviter une société',
    sentInvites: 'Invitations envoyées',
    receivedInvites: 'Invitations reçues',
    noSentInvites: 'Aucune invitation envoyée.',
    noReceivedInvites: 'Aucune invitation reçue.',
    inviteFormTitle: 'Inviter une société',
    companyName: 'Nom de la société',
    inviteMessage: 'Message',
    inviteMessagePlaceholder: 'Présentez brièvement votre demande de collaboration.',
    accept: 'Accepter',
    refuse: 'Refuser',
    pending: 'En attente',
    accepted: 'Acceptée',
    refused: 'Refusée',
    sendInvite: 'Envoyer l’invitation',
    targetEmail: 'Email du contact',
    statsClients: 'Clients',
    statsSent: 'Invitations envoyées',
    statsReceived: 'Invitations reçues',
    statsPending: 'En attente',
    connected: 'Connectés',
    connectionAccepted: 'Collaboration active',
    searchPlaceholder: 'Rechercher un client ou une société...',
    inviteHint: 'L’invitation peut être reçue dans la plateforme ou par email si le contact n’a pas encore de compte.',
    inviteSuccess: 'Invitation envoyée avec succès.',
    inviteError: 'Veuillez saisir une adresse email valide.',
  },
  en: {
    inviteTitle: 'Collaboration invitations',
    inviteSubtitle: 'Invite a client or another company to collaborate on the platform.',
    inviteButton: 'Invite a company',
    sentInvites: 'Sent invitations',
    receivedInvites: 'Received invitations',
    noSentInvites: 'No invitation sent yet.',
    noReceivedInvites: 'No invitation received yet.',
    inviteFormTitle: 'Invite a company',
    companyName: 'Company name',
    inviteMessage: 'Message',
    inviteMessagePlaceholder: 'Briefly explain why you want to collaborate.',
    accept: 'Accept',
    refuse: 'Refuse',
    pending: 'Pending',
    accepted: 'Accepted',
    refused: 'Refused',
    sendInvite: 'Send invitation',
    targetEmail: 'Contact email',
    statsClients: 'Clients',
    statsSent: 'Sent invitations',
    statsReceived: 'Received invitations',
    statsPending: 'Pending',
    connected: 'Connected',
    connectionAccepted: 'Collaboration active',
    searchPlaceholder: 'Search a client or company...',
    inviteHint: 'The invitation can be received inside the platform or by email if the contact has no account yet.',
    inviteSuccess: 'Invitation sent successfully.',
    inviteError: 'Please enter a valid email address.',
  },
  ar: {
    inviteTitle: 'دعوات التعاون',
    inviteSubtitle: 'ادعُ عميلاً أو شركة أخرى للتعاون عبر المنصة.',
    inviteButton: 'دعوة شركة',
    sentInvites: 'الدعوات المرسلة',
    receivedInvites: 'الدعوات الواردة',
    noSentInvites: 'لا توجد دعوات مرسلة.',
    noReceivedInvites: 'لا توجد دعوات واردة.',
    inviteFormTitle: 'دعوة شركة',
    companyName: 'اسم الشركة',
    inviteMessage: 'رسالة',
    inviteMessagePlaceholder: 'قدّم سبب التعاون بشكل مختصر وواضح.',
    accept: 'قبول',
    refuse: 'رفض',
    pending: 'قيد الانتظار',
    accepted: 'مقبولة',
    refused: 'مرفوضة',
    sendInvite: 'إرسال الدعوة',
    targetEmail: 'البريد الإلكتروني',
    statsClients: 'العملاء',
    statsSent: 'دعوات مرسلة',
    statsReceived: 'دعوات واردة',
    statsPending: 'قيد الانتظار',
    connected: 'اتصالات نشطة',
    connectionAccepted: 'تعاون نشط',
    searchPlaceholder: 'ابحث عن عميل أو شركة...',
    inviteHint: 'يمكن استلام الدعوة داخل المنصة أو عبر البريد الإلكتروني إذا لم يكن للطرف الآخر حساب بعد.',
    inviteSuccess: 'تم إرسال الدعوة بنجاح.',
    inviteError: 'يرجى إدخال بريد إلكتروني صالح.',
  },
};

const getInviteBadge = (status, labels) => {
  if (status === 'ACCEPTED') return { variant: 'success', label: labels.accepted };
  if (status === 'REFUSED' || status === 'REJECTED') return { variant: 'rejected', label: labels.refused };
  return { variant: 'pending', label: labels.pending };
};

const Clients = () => {
  const { t, lang } = useLanguage();
  const labels = copyByLang[lang] || copyByLang.fr;

  const [clients, setClients] = useState([]);
  const [invitations, setInvitations] = useState({ sent: [], received: [] });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [toast, setToast] = useState(null);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    matriculeFiscal: '',
  });

  const [inviteData, setInviteData] = useState({
    companyName: '',
    email: '',
    message: '',
  });

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [clientsRes, invitationsRes] = await Promise.all([
        api.get('/clients'),
        api.get('/clients/invitations'),
      ]);
      setClients(clientsRes.data);
      setInvitations(invitationsRes.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEdit = (client) => {
    setEditingId(client.id);
    setFormData({
      name: client.name || '',
      email: client.email || '',
      phone: client.phone || '',
      address: client.address || '',
      matriculeFiscal: client.matriculeFiscal || '',
    });
    setErrors({});
    setShowModal(true);
  };

  const validateClientForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = t('error.nameRequired') || 'Le nom est requis';
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = t('error.invalidEmail') || labels.inviteError;
    }
    if (!formData.matriculeFiscal.trim()) {
      newErrors.matriculeFiscal = t('error.matriculeFiscalRequired') || 'Matricule Fiscal requis';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateClientForm()) return;

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      if (editingId) {
        await api.put(`/clients/${editingId}`, formData);
      } else {
        await api.post('/clients', formData);
      }
      setShowModal(false);
      setEditingId(null);
      setFormData({ name: '', email: '', phone: '', address: '', matriculeFiscal: '' });
      fetchData();
    } catch (error) {
      console.error(error);
      setSubmitError(error.response?.data?.message || t('settings.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteData.email.trim() || !emailRegex.test(inviteData.email.trim())) {
      showToast('error', labels.inviteError);
      return;
    }

    setIsInviting(true);
    try {
      await api.post('/clients/invitations', {
        email: inviteData.email.trim(),
        companyName: inviteData.companyName.trim(),
        message: inviteData.message.trim(),
      });
      setInviteData({ companyName: '', email: '', message: '' });
      setShowInviteModal(false);
      showToast('success', labels.inviteSuccess);
      fetchData();
    } catch (error) {
      console.error(error);
      showToast('error', error.response?.data?.message || t('common.error_generic'));
    } finally {
      setIsInviting(false);
    }
  };

  const respondToInvitation = async (id, action) => {
    try {
      await api.post(`/clients/invitations/${id}/respond`, { action });
      fetchData();
    } catch (error) {
      console.error(error);
      showToast('error', error.response?.data?.message || t('common.error_generic'));
    }
  };

  const doDelete = async () => {
    const id = pendingDeleteId;
    setPendingDeleteId(null);
    try {
      await api.delete(`/clients/${id}`);
      fetchData();
    } catch (error) {
      console.error(error);
      showToast('error', error.response?.data?.message || t('common.error_delete'));
    }
  };

  const filteredClients = useMemo(() => (
    clients.filter((client) =>
      [client.name, client.email, client.matriculeFiscal]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  ), [clients, searchTerm]);

  const pendingInvitations = [...invitations.sent, ...invitations.received].filter((invite) => invite.status === 'PENDING').length;
  const connectedInvitations = [...invitations.sent, ...invitations.received].filter((invite) => invite.status === 'ACCEPTED').length;

  return (
    <div className="pb-20 animate-in fade-in duration-500 space-y-8">
      {toast && (
        <div className={`fixed top-20 right-6 z-[100] flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border animate-in slide-in-from-top-2 duration-300 max-w-sm ${
          toast.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          {toast.type === 'success'
            ? <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            : <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />}
          <p className="text-sm font-semibold">{toast.message}</p>
          <button onClick={() => setToast(null)} className="ms-2 text-current opacity-50 hover:opacity-100">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {pendingDeleteId && (
        <div className="fixed inset-0 z-[90] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl animate-in zoom-in duration-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6 text-rose-500" />
            </div>
            <h3 className="text-lg font-black text-slate-900 mb-2">{t('common.confirmDelete')}</h3>
            <p className="text-sm text-slate-500 mb-6">{t('common.confirm_delete_desc')}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setPendingDeleteId(null)}
                className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-2xl font-bold text-sm hover:bg-slate-200 transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={doDelete}
                className="flex-1 py-3 bg-rose-600 text-white rounded-2xl font-bold text-sm hover:bg-rose-700 transition-colors"
              >
                {t('common.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h2 className="text-2xl font-black text-slate-900 font-display tracking-tight uppercase">{t('clients.title')}</h2>
          <p className="text-sm text-slate-500 font-medium">{t('clients.subtitle')}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <Button
            variant="secondary"
            onClick={() => setShowInviteModal(true)}
            icon={Link2}
            className="w-full sm:w-auto"
          >
            {labels.inviteButton}
          </Button>
          <Button
            onClick={() => {
              setEditingId(null);
              setFormData({ name: '', email: '', phone: '', address: '', matriculeFiscal: '' });
              setErrors({});
              setShowModal(true);
            }}
            icon={Plus}
            className="w-full sm:w-auto"
          >
            {t('clients.new')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: labels.statsClients, value: clients.length },
          { label: labels.statsSent, value: invitations.sent.length },
          { label: labels.statsReceived, value: invitations.received.length },
          { label: labels.connected, value: connectedInvitations },
        ].map((item) => (
          <Card key={item.label} className="p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{item.label}</p>
            <p className="text-2xl font-black text-slate-900 mt-2">{item.value}</p>
          </Card>
        ))}
      </div>

      <Card
        title={labels.inviteTitle}
        subtitle={labels.inviteSubtitle}
        action={
          pendingInvitations > 0 ? <Badge variant="pending">{pendingInvitations} {labels.statsPending}</Badge> : null
        }
      >
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">{labels.sentInvites}</h3>
                <p className="text-sm text-slate-500">{labels.inviteHint}</p>
              </div>
            </div>

            {invitations.sent.length === 0 ? (
              <div className="p-5 rounded-3xl bg-slate-50 text-sm text-slate-500">{labels.noSentInvites}</div>
            ) : (
              <div className="space-y-3">
                {invitations.sent.slice(0, 4).map((invite) => {
                  const badge = getInviteBadge(invite.status, labels);
                  return (
                    <div key={invite.id} className="p-4 rounded-3xl border border-slate-100 bg-white shadow-sm flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">{invite.client?.name || invite.company?.name || invite.recipientEmail}</p>
                        <p className="text-xs text-slate-500 truncate">{invite.recipientEmail || '—'}</p>
                        {invite.message ? <p className="text-xs text-slate-400 mt-2">{invite.message}</p> : null}
                      </div>
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">{labels.receivedInvites}</h3>
                <p className="text-sm text-slate-500">{labels.connectionAccepted}</p>
              </div>
            </div>

            {invitations.received.length === 0 ? (
              <div className="p-5 rounded-3xl bg-slate-50 text-sm text-slate-500">{labels.noReceivedInvites}</div>
            ) : (
              <div className="space-y-3">
                {invitations.received.slice(0, 4).map((invite) => {
                  const badge = getInviteBadge(invite.status, labels);
                  return (
                    <div key={invite.id} className="p-4 rounded-3xl border border-slate-100 bg-white shadow-sm">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-900 truncate">{invite.company?.name || invite.client?.name || invite.recipientEmail}</p>
                          <p className="text-xs text-slate-500 truncate">{invite.recipientEmail || invite.company?.email || '—'}</p>
                          {invite.message ? <p className="text-xs text-slate-400 mt-2">{invite.message}</p> : null}
                        </div>
                        <Badge variant={badge.variant}>{badge.label}</Badge>
                      </div>
                      {invite.status === 'PENDING' && (
                        <div className="flex flex-wrap gap-2 mt-4">
                          <Button variant="secondary" size="sm" onClick={() => respondToInvitation(invite.id, 'REFUSE')} icon={X}>
                            {labels.refuse}
                          </Button>
                          <Button size="sm" onClick={() => respondToInvitation(invite.id, 'ACCEPT')} icon={Check}>
                            {labels.accept}
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </Card>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          <input
            type="text"
            placeholder={labels.searchPlaceholder}
            className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium text-sm text-slate-700 placeholder:text-slate-300 shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="px-6 py-3 bg-indigo-50/50 rounded-2xl border border-indigo-100/30 flex items-center justify-center">
          <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest leading-none">
            {filteredClients.length} {t('common.results')}
          </span>
        </div>
      </div>

      <Card noPadding className="overflow-hidden border-slate-100">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('clients.table.name')}</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('clients.table.email')}</th>
                <th className="px-8 py-4 text-end text-[10px] font-black text-slate-400 uppercase tracking-widest">MF</th>
                <th className="px-8 py-4 text-end text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan="4" className="py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <Loader className="w-8 h-8 animate-spin text-indigo-600" />
                    </div>
                  </td>
                </tr>
              ) : filteredClients.length === 0 ? (
                <tr>
                  <td colSpan="4" className="py-20 text-center text-slate-400 italic text-sm">
                    {t('clients.empty')}
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => (
                  <tr key={client.id} className="hover:bg-slate-50/30 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-xs border border-indigo-100 shadow-sm shadow-indigo-50">
                          {client.name?.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 tracking-tight">{client.name}</span>
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{getClientNumber(client)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-sm font-medium text-slate-500">{client.email || '--'}</td>
                    <td className="px-8 py-5 text-[11px] font-black text-slate-400 text-end font-mono uppercase tracking-tighter">{client.matriculeFiscal || '--'}</td>
                    <td className="px-8 py-5 text-end">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEdit(client)} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => setPendingDeleteId(client.id)} className="p-2 text-slate-400 hover:text-rose-600 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="md:hidden p-4 space-y-4">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="py-16 text-center text-slate-400 italic text-sm">{t('clients.empty')}</div>
          ) : null}
          {!loading && filteredClients.map((client) => (
            <div key={client.id} className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-xs border border-indigo-100">
                  {client.name?.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-base font-black text-slate-900 font-display">{client.name}</h4>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{getClientNumber(client)}</p>
                  <p className="text-xs text-slate-500 font-medium">{client.email || '--'}</p>
                </div>
              </div>
              <div className="pt-4 border-t border-slate-50 flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">MF</p>
                  <p className="text-[11px] font-black text-slate-900 font-mono tracking-tighter">{client.matriculeFiscal || '--'}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(client)} className="p-3 bg-slate-50 rounded-2xl text-slate-400">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => setPendingDeleteId(client.id)} className="p-3 bg-slate-50 rounded-2xl text-slate-400">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card
            className="w-full max-w-lg animate-in zoom-in duration-300 shadow-[0_30px_100px_-20px_rgba(0,0,0,0.15)]"
            noPadding
            title={editingId ? t('clients.form.title_edit') : t('clients.form.title_new')}
            action={
              <button onClick={() => setShowModal(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all">
                <X className="w-5 h-5" />
              </button>
            }
          >
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <Input
                label={t('clients.form.name_label')}
                placeholder={t('clients.form.name_placeholder')}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                error={errors.name}
                icon={User}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Input
                  type="email"
                  label={t('form.email')}
                  placeholder={t('clients.form.email_placeholder')}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  error={errors.email}
                  icon={Mail}
                />
                <Input
                  label={t('form.phone')}
                  placeholder={t('clients.form.phone_placeholder')}
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  icon={Phone}
                />
              </div>

              <Input
                label={t('clients.form.address_label')}
                placeholder={t('clients.form.address_placeholder')}
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                icon={MapPin}
              />

              <Input
                label={t('clients.form.mf_label') || 'Matricule Fiscal'}
                placeholder={t('clients.form.mf_placeholder') || '1234567A/A/M/000'}
                value={formData.matriculeFiscal}
                onChange={(e) => setFormData({ ...formData, matriculeFiscal: e.target.value })}
                error={errors.matriculeFiscal}
                icon={FileText}
                className="font-mono uppercase"
              />

              {submitError && (
                <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 text-[11px] font-black uppercase tracking-widest">
                  <AlertCircle className="w-5 h-5" />
                  {submitError}
                </div>
              )}

              <div className="pt-6 flex gap-4">
                <Button type="button" variant="ghost" onClick={() => setShowModal(false)} className="flex-1">
                  {t('form.cancel')}
                </Button>
                <Button type="submit" loading={isSubmitting} className="flex-1" icon={CheckCircle2}>
                  {t('common.save')}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {showInviteModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card
            className="w-full max-w-lg animate-in zoom-in duration-300"
            noPadding
            title={labels.inviteFormTitle}
            action={
              <button onClick={() => setShowInviteModal(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all">
                <X className="w-5 h-5" />
              </button>
            }
          >
            <form onSubmit={handleInvite} className="p-8 space-y-6">
              <Input
                label={labels.companyName}
                value={inviteData.companyName}
                onChange={(e) => setInviteData({ ...inviteData, companyName: e.target.value })}
                icon={Building2}
              />
              <Input
                type="email"
                label={labels.targetEmail}
                value={inviteData.email}
                onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                icon={Mail}
                required
              />
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest ps-1">{labels.inviteMessage}</label>
                <textarea
                  rows="4"
                  value={inviteData.message}
                  onChange={(e) => setInviteData({ ...inviteData, message: e.target.value })}
                  placeholder={labels.inviteMessagePlaceholder}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm transition-all outline-none focus:bg-white focus:border-premium-500 focus:ring-4 focus:ring-premium-500/10 placeholder:text-slate-400 font-medium"
                />
              </div>
              <div className="pt-2 flex gap-4">
                <Button type="button" variant="ghost" onClick={() => setShowInviteModal(false)} className="flex-1">
                  {t('common.cancel')}
                </Button>
                <Button type="submit" loading={isInviting} icon={Send} className="flex-1">
                  {labels.sendInvite}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Clients;
