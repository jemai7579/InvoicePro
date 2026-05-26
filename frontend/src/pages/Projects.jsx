import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  Briefcase,
  Calendar,
  CheckCircle2,
  FileText,
  Loader,
  Pencil,
  Plus,
  Search,
  Send,
  Share2,
  Wallet,
  X,
  XCircle,
} from 'lucide-react';
import api from '../services/api';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { useLanguage } from '../context/LanguageContext';

const statusStyles = {
  IDEA: 'secondary',
  DRAFT: 'secondary',
  SHARED: 'pending',
  SENT: 'pending',
  ACCEPTED: 'success',
  REFUSED: 'rejected',
  CONVERTED: 'success',
};

const copyByLang = {
  fr: {
    title: 'Mes idees',
    subtitle: 'Gardez vos idees de projets au meme endroit, puis partagez-les avec un contact accepte quand vous etes pret.',
    create: 'Nouvelle idee',
    modalCreate: 'Creer une idee de projet',
    modalEdit: "Modifier l'idee",
    search: 'Rechercher une idee...',
    empty: "Aucune idee enregistree pour le moment.",
    receivedTitle: 'Bons de commande recus',
    receivedEmpty: 'Aucun projet partage recu pour le moment.',
    acceptedContactsHint: 'Le partage est disponible uniquement avec vos contacts acceptes.',
    noContacts: "Invitez d'abord un contact depuis le Réseau professionnel pour partager une idee.",
    ideaCount: 'Idees',
    sharedCount: 'Partagees',
    sentCount: 'Envoyees',
    receivedCount: 'Recues',
    privateLabel: 'Projet prive',
    sharedWith: 'Partage avec',
    shareAction: 'Partager avec un contact',
    transformOffer: 'Transformer en offre',
    createDevis: 'Créer un devis',
    sendAction: 'Envoyer comme bon de commande',
    convertAction: 'Convertir en devis',
    editAction: 'Modifier',
    accept: 'Accepter',
    refuse: 'Refuser',
    noDescription: 'Aucune note pour le moment.',
    statuses: {
      IDEA: 'Idee',
      DRAFT: 'Brouillon',
      SHARED: 'Partage',
      SENT: 'Envoye',
      ACCEPTED: 'Accepte',
      REFUSED: 'Refuse',
      CONVERTED: 'Converti en devis',
    },
    fields: {
      title: 'Titre',
      category: 'Categorie ou type',
      description: 'Description / notes',
      estimatedNeeds: 'Besoins estimes',
      optionalBudget: 'Budget estimatif',
      deadline: 'Echeance',
      sharedWith: 'Partager avec un contact',
    },
    placeholders: {
      category: 'Ex. conseil, developpement, audit...',
      description: 'Decrivez librement votre idee ou votre besoin.',
      estimatedNeeds: 'Listez les points importants, livrables ou besoins.',
      sharedWith: 'Projet prive',
    },
    save: 'Enregistrer',
    cancel: 'Annuler',
    errorSave: "Erreur lors de l'enregistrement du projet.",
    errorSend: "Erreur lors de l'envoi du projet.",
    errorRespond: 'Erreur lors de la reponse au projet.',
    reference: 'Reference',
    budget: 'Budget',
    deadline: 'Echeance',
    category: 'Categorie',
    sender: 'Expediteur',
  },
  en: {
    title: 'My ideas',
    subtitle: 'Keep your project ideas in one place, then share them with an accepted contact when you are ready.',
    create: 'New idea',
    modalCreate: 'Create a project idea',
    modalEdit: 'Edit idea',
    search: 'Search an idea...',
    empty: 'No idea saved yet.',
    receivedTitle: 'Received orders',
    receivedEmpty: 'No shared project received yet.',
    acceptedContactsHint: 'Sharing is only available with accepted contacts.',
    noContacts: 'Invite a contact from the Professional Network before sharing an idea.',
    ideaCount: 'Ideas',
    sharedCount: 'Shared',
    sentCount: 'Sent',
    receivedCount: 'Received',
    privateLabel: 'Private project',
    sharedWith: 'Shared with',
    shareAction: 'Share with a contact',
    transformOffer: 'Create offer',
    createDevis: 'Create quote',
    sendAction: 'Send as order',
    convertAction: 'Convert to quote',
    editAction: 'Edit',
    accept: 'Accept',
    refuse: 'Refuse',
    noDescription: 'No notes yet.',
    statuses: {
      IDEA: 'Idea',
      DRAFT: 'Draft',
      SHARED: 'Shared',
      SENT: 'Sent',
      ACCEPTED: 'Accepted',
      REFUSED: 'Refused',
      CONVERTED: 'Converted to quote',
    },
    fields: {
      title: 'Title',
      category: 'Category or type',
      description: 'Description / notes',
      estimatedNeeds: 'Estimated needs',
      optionalBudget: 'Estimated budget',
      deadline: 'Deadline',
      sharedWith: 'Share with a contact',
    },
    placeholders: {
      category: 'Ex. consulting, development, audit...',
      description: 'Describe your idea or request freely.',
      estimatedNeeds: 'List important needs, deliverables or notes.',
      sharedWith: 'Private project',
    },
    save: 'Save',
    cancel: 'Cancel',
    errorSave: 'Error while saving the project.',
    errorSend: 'Error while sending the project.',
    errorRespond: 'Error while responding to the project.',
    reference: 'Reference',
    budget: 'Budget',
    deadline: 'Deadline',
    category: 'Category',
    sender: 'Sender',
  },
  ar: {
    title: 'أفكاري',
    subtitle: 'احتفظ بافكار المشاريع في مكان واحد ثم شاركها مع جهة اتصال مقبولة عندما تصبح جاهزة.',
    create: 'فكرة جديدة',
    modalCreate: 'انشاء فكرة مشروع',
    modalEdit: 'تعديل الفكرة',
    search: 'ابحث عن فكرة...',
    empty: 'لا توجد افكار محفوظة حاليا.',
    receivedTitle: 'طلبات واردة',
    receivedEmpty: 'لا يوجد مشروع مشترك وارد حاليا.',
    acceptedContactsHint: 'المشاركة متاحة فقط مع جهات الاتصال المقبولة.',
    noContacts: 'قم بدعوة جهة اتصال من صفحة العملاء قبل مشاركة فكرة.',
    ideaCount: 'افكار',
    sharedCount: 'مشاركة',
    sentCount: 'مرسلة',
    receivedCount: 'واردة',
    privateLabel: 'مشروع خاص',
    sharedWith: 'مشترك مع',
    shareAction: 'مشاركة مع جهة اتصال',
    transformOffer: 'تحويل الى عرض',
    createDevis: 'انشاء عرض سعر',
    sendAction: 'ارسال كطلب',
    convertAction: 'تحويل الى عرض سعر',
    editAction: 'تعديل',
    accept: 'قبول',
    refuse: 'رفض',
    noDescription: 'لا توجد ملاحظات حاليا.',
    statuses: {
      IDEA: 'فكرة',
      DRAFT: 'مسودة',
      SHARED: 'مشترك',
      SENT: 'مرسل',
      ACCEPTED: 'مقبول',
      REFUSED: 'مرفوض',
      CONVERTED: 'تم تحويله الى عرض سعر',
    },
    fields: {
      title: 'العنوان',
      category: 'الفئة او النوع',
      description: 'الوصف / الملاحظات',
      estimatedNeeds: 'الاحتياجات التقديرية',
      optionalBudget: 'الميزانية التقديرية',
      deadline: 'الاجل',
      sharedWith: 'مشاركة مع جهة اتصال',
    },
    placeholders: {
      category: 'مثال: استشارة، تطوير، تدقيق...',
      description: 'اكتب الفكرة او الطلب بحرية.',
      estimatedNeeds: 'اذكر الاحتياجات او المخرجات المهمة.',
      sharedWith: 'مشروع خاص',
    },
    save: 'حفظ',
    cancel: 'الغاء',
    errorSave: 'حدث خطأ عند حفظ المشروع.',
    errorSend: 'حدث خطأ عند ارسال المشروع.',
    errorRespond: 'حدث خطأ عند الرد على المشروع.',
    reference: 'المرجع',
    budget: 'الميزانية',
    deadline: 'الاجل',
    category: 'الفئة',
    sender: 'المرسل',
  },
};

const emptyProject = {
  title: '',
  category: '',
  description: '',
  estimatedNeeds: '',
  optionalBudget: '',
  deadline: '',
  note: '',
  sharedWithCompanyId: '',
};

const normalizeProject = (project) => ({
  title: project?.title || '',
  category: project?.category || '',
  description: project?.description || '',
  estimatedNeeds: project?.estimatedNeeds || '',
  optionalBudget: project?.optionalBudget || '',
  deadline: project?.deadline ? String(project.deadline).slice(0, 10) : '',
  note: project?.note || '',
  sharedWithCompanyId: project?.sharedWithCompanyId || '',
});

const ProjectModal = ({ open, onClose, onSubmit, contacts, initialProject, saving, text }) => {
  const [form, setForm] = useState(initialProject ? normalizeProject(initialProject) : emptyProject);

  if (!open) return null;

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-slate-900/50 p-3 sm:p-5 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-3xl flex flex-col overflow-hidden"
        style={{ maxHeight: 'min(calc(100dvh - 1.5rem), calc(100vh - 1.5rem))' }}
      >
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100">
          <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
            {initialProject ? text.modalEdit : text.modalCreate}
          </h2>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
          <form
            id="project-modal-form"
            onSubmit={(event) => {
              event.preventDefault();
              onSubmit(form);
            }}
            className="p-4 sm:p-6 space-y-5"
          >
            <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2">
              <Input
                label={text.fields.title}
                value={form.title}
                onChange={(event) => handleChange('title', event.target.value)}
                required
              />
              <Input
                label={text.fields.category}
                value={form.category}
                onChange={(event) => handleChange('category', event.target.value)}
                placeholder={text.placeholders.category}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest ps-1">
                {text.fields.description}
              </label>
              <textarea
                rows="3"
                value={form.description}
                onChange={(event) => handleChange('description', event.target.value)}
                placeholder={text.placeholders.description}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest ps-1">
                {text.fields.estimatedNeeds}
              </label>
              <textarea
                rows="2"
                value={form.estimatedNeeds}
                onChange={(event) => handleChange('estimatedNeeds', event.target.value)}
                placeholder={text.placeholders.estimatedNeeds}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all resize-none"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2">
              <Input
                label={text.fields.optionalBudget}
                type="number"
                value={form.optionalBudget}
                onChange={(event) => handleChange('optionalBudget', event.target.value)}
                icon={Wallet}
                placeholder="0.000"
              />
              <Input
                label={text.fields.deadline}
                type="date"
                value={form.deadline}
                onChange={(event) => handleChange('deadline', event.target.value)}
                icon={Calendar}
              />
            </div>

            <Select
              label={text.fields.sharedWith}
              value={form.sharedWithCompanyId}
              onChange={(event) => handleChange('sharedWithCompanyId', event.target.value)}
              options={[
                { value: '', label: text.placeholders.sharedWith },
                ...contacts.map((contact) => ({
                  value: contact.companyId,
                  label: contact.label,
                })),
              ]}
            />

            {contacts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                {text.noContacts}
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                {text.acceptedContactsHint}
              </div>
            )}
          </form>
        </div>

        {/* Footer – always visible */}
        <div className="flex-shrink-0 border-t border-slate-100 bg-slate-50/80 px-4 sm:px-6 py-3 sm:py-4 flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose}>
            {text.cancel}
          </Button>
          <Button type="submit" form="project-modal-form" loading={saving}>
            {text.save}
          </Button>
        </div>
      </div>
    </div>
  );
};

const buildAcceptedContacts = (network) => (network?.partners || []).map((partner) => ({
  companyId: partner.partnerCompanyId,
  label: partner.email ? `${partner.name} - ${partner.email}` : partner.name,
  name: partner.name,
  email: partner.email,
}));

const Projects = () => {
  const { lang } = useLanguage();
  const text = copyByLang[lang] || copyByLang.fr;
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [receivedProjects, setReceivedProjects] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [search, setSearch] = useState('');
  const [actionError, setActionError] = useState(null);

  const showError = (msg) => {
    setActionError(msg);
    setTimeout(() => setActionError(null), 4000);
  };

  const fetchData = async () => {
    try {
      const [projectsRes, receivedRes, networkRes] = await Promise.all([
        api.get('/projects'),
        api.get('/projects/received'),
        api.get('/network'),
      ]);

      setProjects(projectsRes.data);
      setReceivedProjects(receivedRes.data);
      setContacts(buildAcceptedContacts(networkRes.data));
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredProjects = useMemo(() => {
    return projects.filter((project) =>
      [
        project.title,
        project.description,
        project.category,
        project.sharedWithLabel,
        project.projectReference,
      ]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(search.toLowerCase()))
    );
  }, [projects, search]);

  const saveProject = async (payload) => {
    setSaving(true);
    try {
      if (editingProject) {
        await api.put(`/projects/${editingProject.id}`, payload);
      } else {
        await api.post('/projects', payload);
      }
      setShowModal(false);
      setEditingProject(null);
      await fetchData();
    } catch (error) {
      console.error('Error saving project:', error);
      showError(error.response?.data?.message || text.errorSave);
    } finally {
      setSaving(false);
    }
  };

  const sendProject = async (id) => {
    try {
      await api.post(`/projects/${id}/send`, { mode: 'platform' });
      await fetchData();
    } catch (error) {
      console.error('Error sending project:', error);
      showError(error.response?.data?.message || text.errorSend);
    }
  };

  const respondToProject = async (id, action) => {
    try {
      await api.post(`/projects/${id}/respond`, { action });
      await fetchData();
    } catch (error) {
      console.error('Error responding to project:', error);
      showError(error.response?.data?.message || text.errorRespond);
    }
  };

  const openCreateDevis = (project) => {
    navigate('/devis', { state: { project } });
  };

  const openCreateOffer = (project) => {
    navigate('/offers', { state: { project } });
  };

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500">
      {actionError && (
        <div className="fixed top-20 right-4 sm:right-6 z-[100] flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border max-w-sm bg-rose-50 border-rose-200 text-rose-800 animate-in slide-in-from-top-2 duration-300">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <p className="text-sm font-semibold flex-1">{actionError}</p>
          <button onClick={() => setActionError(null)} className="text-rose-400 hover:text-rose-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
        <div>
          <h1 className="font-display text-2xl font-black tracking-tight text-slate-900">{text.title}</h1>
          <p className="text-sm font-medium text-slate-500">{text.subtitle}</p>
        </div>
        <Button
          onClick={() => {
            setEditingProject(null);
            setShowModal(true);
          }}
          icon={Plus}
        >
          {text.create}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {[
          { label: text.ideaCount, count: projects.filter((project) => project.status === 'IDEA').length },
          { label: text.sharedCount, count: projects.filter((project) => project.sharedWithCompanyId).length },
          { label: text.sentCount, count: projects.filter((project) => project.status === 'SENT').length },
          { label: text.receivedCount, count: receivedProjects.length },
        ].map((item) => (
          <Card key={item.label} className="p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{item.label}</p>
            <p className="mt-2 text-2xl font-black text-slate-900">{item.count}</p>
          </Card>
        ))}
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={text.search}
          className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm font-medium outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
        />
      </div>

      <Card title={text.title}>
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="py-16 text-center text-slate-400">{text.empty}</div>
        ) : (
          <div className="space-y-4">
            {filteredProjects.map((project) => (
              <div key={project.id} className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                        <Briefcase className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-slate-900">{project.title}</h3>
                        <p className="text-xs font-medium text-slate-500">
                          {project.projectReference}
                          {project.category ? ` - ${project.category}` : ''}
                        </p>
                      </div>
                      <Badge variant={statusStyles[project.status] || 'secondary'}>
                        {text.statuses[project.status] || project.status}
                      </Badge>
                      {!project.sharedWithCompanyId ? <Badge variant="secondary">{text.privateLabel}</Badge> : null}
                    </div>

                    <p className="text-sm text-slate-600">{project.description || text.noDescription}</p>

                    <div className="grid grid-cols-1 gap-4 text-xs text-slate-500 md:grid-cols-4">
                      <div>
                        <span className="font-black text-slate-900">{text.category}:</span> {project.category || '—'}
                      </div>
                      <div>
                        <span className="font-black text-slate-900">{text.sharedWith}:</span> {project.sharedWithLabel || text.privateLabel}
                      </div>
                      <div>
                        <span className="font-black text-slate-900">{text.budget}:</span>{' '}
                        {project.optionalBudget ? `${Number(project.optionalBudget).toFixed(3)} TND` : '—'}
                      </div>
                      <div>
                        <span className="font-black text-slate-900">{text.deadline}:</span>{' '}
                        {project.deadline ? new Date(project.deadline).toLocaleDateString() : '—'}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setEditingProject(project);
                        setShowModal(true);
                      }}
                      icon={Pencil}
                    >
                      {text.editAction}
                    </Button>

                    {!project.sharedWithCompanyId ? (
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setEditingProject(project);
                          setShowModal(true);
                        }}
                        icon={Share2}
                      >
                        {text.shareAction}
                      </Button>
                    ) : null}

                    {project.sharedWithCompanyId && ['SHARED', 'IDEA', 'DRAFT'].includes(project.status) ? (
                      <Button variant="secondary" onClick={() => sendProject(project.id)} icon={Send}>
                        {text.sendAction}
                      </Button>
                    ) : null}

                    <Button variant="secondary" onClick={() => openCreateOffer(project)} icon={Briefcase}>
                      {text.transformOffer}
                    </Button>

                    <Button onClick={() => openCreateDevis(project)} icon={FileText}>
                      {project.status === 'ACCEPTED' ? text.convertAction : text.createDevis}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card title={text.receivedTitle}>
        {receivedProjects.length === 0 ? (
          <div className="py-12 text-center text-slate-400">{text.receivedEmpty}</div>
        ) : (
          <div className="space-y-4">
            {receivedProjects.map((project) => (
              <div key={project.id} className="rounded-[2rem] border border-slate-100 bg-slate-50/50 p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h3 className="text-base font-black text-slate-900">{project.title}</h3>
                    <p className="text-sm text-slate-500">
                      {text.sender}: {project.sourceCompany?.name || '—'} - {project.description || text.noDescription}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => respondToProject(project.id, 'REFUSE')} icon={XCircle}>
                      {text.refuse}
                    </Button>
                    <Button onClick={() => respondToProject(project.id, 'ACCEPT')} icon={CheckCircle2}>
                      {text.accept}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <ProjectModal
        key={editingProject?.id || 'new-project'}
        open={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingProject(null);
        }}
        onSubmit={saveProject}
        contacts={contacts}
        initialProject={editingProject}
        saving={saving}
        text={text}
      />
    </div>
  );
};

export default Projects;
