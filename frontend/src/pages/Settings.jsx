import React, { useState, useEffect, useContext } from 'react';
import { 
  Save, Loader, Info, ExternalLink, ShieldCheck, Lock, 
  Image as ImageIcon, Plus, Building2, Users2, ShieldAlert,
  ChevronRight, CheckCircle2, AlertCircle, Trash2, Camera,
  MapPin, Phone, Mail, Globe, Briefcase, BadgeCheck, Zap, Cpu,
  User, CreditCard, Hash, Home, FileText, History, HelpCircle
} from 'lucide-react';
import api from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { AuthContext } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import { useSearchParams, useNavigate } from 'react-router-dom';
import SettingsHistoryModal from '../components/SettingsHistoryModal';
import { getPlanLabel } from '../utils/planLabels';

const Settings = () => {
  const { t, lang } = useLanguage();
  const { user } = useContext(AuthContext);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'profile');
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) setActiveTab(tab);
  }, [searchParams]);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isChangingPwd, setIsChangingPwd] = useState(false);
  const [pwdMsg, setPwdMsg] = useState(null);
  const [errors, setErrors] = useState({});
  
  const [formData, setFormData] = useState({
    name: '',
    matriculeFiscal: '',
    registreCommerce: '',
    address: '',
    city: '',
    zipCode: '',
    country: 'Tunisie',
    phone: '',
    email: '',
    rib: '',
    logo: '',
    eHouwiyaStatus: 'NOT_STARTED',
    eHouwiyaIdentifier: ''
  });

  const [certFile, setCertFile] = useState(null);
  const [certPassword, setCertPassword] = useState('');
  const [isUploadingCert, setIsUploadingCert] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [hasCert, setHasCert] = useState(false);
  const [eInvoiceStatus, setEInvoiceStatus] = useState(null);

  const fetchSettings = async () => {
    try {
      const [response, eInvoiceResponse] = await Promise.all([
        api.get('/settings'),
        api.get('/settings/einvoice/status').catch(() => ({ data: null })),
      ]);
      const data = response.data;
      setEInvoiceStatus(eInvoiceResponse.data);
      setFormData({
        name: data.name || '',
        matriculeFiscal: data.matriculeFiscal || '',
        registreCommerce: data.registreCommerce || '',
        address: data.address || '',
        city: data.city || '',
        zipCode: data.zipCode || '',
        country: data.country || 'Tunisie',
        phone: data.phone || '',
        email: data.email || '',
        rib: data.rib || '',
        logo: data.logo || '',
        eHouwiyaStatus: data.eHouwiyaStatus || 'NOT_STARTED',
        eHouwiyaIdentifier: data.eHouwiyaIdentifier || ''
      });
      setHasCert(!!data.hasCertificate);
    } catch (error) {
      console.error('Error fetching settings', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const n = { ...prev };
        delete n[field];
        return n;
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = t('error.nameRequired') || 'Raison sociale requise';
    
    const mfRegex = /^\d{7}[A-Z]\/[A-Z]\/[A-Z]\/\d{3}$|^\d{7}[A-Z]{3}\d{3}$/;
    if (formData.matriculeFiscal && !mfRegex.test(formData.matriculeFiscal)) {
      // Tunisian MF validation is strict, but let's allow basic presence if regex too tight for old formats
    }
    
    if (!formData.matriculeFiscal.trim()) newErrors.matriculeFiscal = t('auth.matricule_required') || 'Matricule Fiscal requis';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSaving(true);
    setSaveMsg(null);
    try {
      await api.put('/settings', formData);
      setSaveMsg({ text: t('settings.success'), type: 'success' });
      setTimeout(() => setSaveMsg(null), 3000);
    } catch {
       setSaveMsg({ text: t('settings.error'), type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      return setPwdMsg({ text: t('settings.security.match_error'), type: 'error' });
    }
    if (newPassword.length < 8) {
       return setPwdMsg({ text: t('error.passwordTooShort') || '8 caractères minimum', type: 'error' });
    }
    setIsChangingPwd(true);
    setPwdMsg(null);
    try {
      await api.put('/settings', { currentPassword, newPassword });
      setPwdMsg({ text: t('settings.security.success'), type: 'success' });
      setCurrentPassword(''); setNewPassword(''); setConfirmNewPassword('');
    } catch (error) {
      setPwdMsg({ text: error.response?.data?.message || t('settings.error'), type: 'error' });
    } finally {
      setIsChangingPwd(false);
    }
  };

  const handleCertificateUpload = async (e) => {
    e.preventDefault();
    if (!certFile || !certPassword) return;
    if (!/\.(p12|pfx)$/i.test(certFile.name) || certFile.size > 2 * 1024 * 1024) {
      alert('Only .p12 or .pfx certificates up to 2 MB are allowed.');
      return;
    }
    setIsUploadingCert(true);
    const certFormData = new FormData();
    certFormData.append('certificate', certFile);
    certFormData.append('password', certPassword);
    try {
      await api.post('/settings/certificate', certFormData);
      alert(t('settings.compliance.success'));
      setCertFile(null); setCertPassword('');
      fetchSettings();
    } catch (error) {
      alert(error.response?.data?.message || t('settings.compliance.error'));
    } finally {
      setIsUploadingCert(false);
    }
  };

  const handleEHouwiyaSave = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setSaveMsg(null);
    try {
      await api.put('/settings', {
        eHouwiyaStatus: formData.eHouwiyaStatus,
        eHouwiyaIdentifier: formData.eHouwiyaStatus === 'HAS_IDENTIFIER' ? formData.eHouwiyaIdentifier : ''
      });
      setSaveMsg({ text: 'Statut E-Houwiya enregistré avec succès.', type: 'success' });
      setTimeout(() => setSaveMsg(null), 3000);
      fetchSettings();
    } catch (error) {
      setSaveMsg({ text: error.response?.data?.message || t('settings.error'), type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 2 * 1024 * 1024) {
      alert('Only PNG, JPG, or WEBP logo images up to 2 MB are allowed.');
      return;
    }
    setIsUploadingLogo(true);
    const logoFormData = new FormData();
    logoFormData.append('logo', file);
    try {
      const resp = await api.post('/settings/logo', logoFormData);
      setFormData(prev => ({ ...prev, logo: resp.data.logo }));
    } catch {
       alert(t('settings.error'));
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const TabButton = ({ id, icon: Icon, label }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`
        flex items-center gap-2.5 px-6 py-3.5 rounded-2xl text-[11px] font-black transition-all whitespace-nowrap
        ${activeTab === id 
          ? 'bg-slate-900 text-white shadow-xl shadow-slate-200 ring-4 ring-slate-900/5' 
          : 'bg-white text-slate-400 hover:text-slate-900 hover:bg-slate-50 border border-slate-100'
        }
      `}
    >
      {React.createElement(Icon, { className: `w-4 h-4 ${activeTab === id ? 'text-indigo-400' : ''}` })}
      {label}
    </button>
  );

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <Loader className="w-10 h-10 animate-spin text-indigo-600" />
      <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">{t('settings.loading')}</p>
    </div>
  );

  return (
    <div className="max-w-6xl space-y-10 pb-20 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight font-display uppercase">{t('settings.title')}</h1>
          <p className="text-sm text-slate-500 font-medium">{t('settings.subtitle')}</p>
        </div>
      </header>

      {/* Tabs Navigation */}
      <nav className="flex overflow-x-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0 gap-3 no-scrollbar scroll-smooth">
        <TabButton id="profile" icon={Building2} label={t('settings.tabs.profile')} />
        <TabButton id="security" icon={Lock} label={t('settings.tabs.security')} />
        <TabButton id="compliance" icon={ShieldCheck} label={t('settings.tabs.compliance')} />
        <TabButton id="subscription" icon={CreditCard} label={t('settings.tabs.subscription')} />
        <TabButton id="help" icon={HelpCircle} label={t('settings.tabs.help')} />
        <TabButton id="team" icon={Users2} label={t('settings.tabs.team')} />
      </nav>

      <Card className="border-slate-100 bg-white">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-indigo-50 p-3 text-indigo-600">
              <History className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-widest text-slate-900">
                {lang === 'ar' ? 'السجل والتتبع' : lang === 'en' ? 'History & Traceability' : 'Historique & Traçabilité'}
              </h2>
              <p className="mt-1 text-sm font-medium text-slate-500">
                {lang === 'ar'
                  ? 'راجع سجل الإجراءات الحساسة والتغييرات من داخل الإعدادات.'
                  : lang === 'en'
                    ? 'Review sensitive actions and traceability logs from Settings.'
                    : 'Consultez les actions sensibles et la traçabilité depuis les paramètres.'}
              </p>
            </div>
          </div>
          <Button type="button" variant="secondary" icon={ChevronRight} onClick={() => navigate('/historique')}>
            {lang === 'ar' ? 'فتح السجل' : lang === 'en' ? 'Open history' : 'Ouvrir l’historique'}
          </Button>
        </div>
      </Card>

      <div className="animate-in slide-in-from-bottom-6 duration-700 delay-100">
        {activeTab === 'profile' && (
          <form onSubmit={handleSubmit} className="space-y-8">
            <Card noPadding className="overflow-hidden border-slate-100 shadow-xl shadow-slate-200/50">
               <div className="px-10 py-12 border-b border-slate-50 bg-slate-50/30 flex flex-col md:flex-row items-center gap-10">
                  <div className="relative group">
                     <div className="w-32 h-32 rounded-[2.5rem] border-4 border-white bg-white flex items-center justify-center overflow-hidden shadow-2xl shadow-indigo-100/50 transition-all group-hover:scale-105 group-hover:rotate-1">
                        {formData.logo ? (
                          <img src={`${(import.meta.env.VITE_API_URL || 'http://localhost:5005/api').replace('/api', '')}${formData.logo}`} alt="Logo" className="w-full h-full object-contain p-4" />
                        ) : (
                          <Building2 className="w-12 h-12 text-slate-200" />
                        )}
                     </div>
                     <label className="absolute -bottom-2 -right-2 w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white cursor-pointer shadow-xl shadow-indigo-200 hover:bg-slate-900 transition-all hover:scale-110 active:scale-90">
                        {isUploadingLogo ? <Loader className="w-4 h-4 animate-spin" /> : <Camera className="w-5 h-5" />}
                        <input type="file" className="hidden" accept="image/png,image/jpeg,image/webp" onChange={handleLogoUpload} />
                     </label>
                  </div>
                  <div className="flex-1 space-y-2 text-center md:text-left">
                     <h3 className="text-2xl font-black text-slate-900 font-display tracking-tight">{formData.name || t('settings.profile.company_name')}</h3>
                     <div className="flex flex-wrap justify-center md:justify-start gap-4 items-center">
                        <p className="text-slate-400 font-bold text-xs flex items-center gap-2">
                           <Mail className="w-3.5 h-3.5 text-indigo-400" /> {user?.email}
                        </p>
                        <div className="w-1 h-1 rounded-full bg-slate-200 hidden md:block"></div>
                        <p className="text-slate-400 font-bold text-xs flex items-center gap-2">
                           <Globe className="w-3.5 h-3.5 text-indigo-400" /> {formData.country}
                        </p>
                     </div>
                     <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-4">
                        <Badge variant="secondary" className="!bg-indigo-50 !text-indigo-600 border-indigo-100/50 px-3 py-1 font-black">ID: {user?.id?.substring(0,8)}</Badge>
                        <Badge variant="success" className="px-3 py-1 font-black">{t('settings.profile.active_account')}</Badge>
                     </div>
                  </div>
               </div>

               <div className="p-10 md:p-12 grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-8">
                     <div className="flex items-center gap-4 mb-2">
                        <div className="bg-indigo-50 p-2.5 rounded-2xl border border-indigo-100/50 shadow-sm"><Briefcase className="w-5 h-5 text-indigo-600" /></div>
                        <h4 className="font-black text-slate-900 uppercase tracking-widest text-[11px]">{t('settings.profile.legal_identity')}</h4>
                     </div>
                     
                     <Input 
                        label={t('settings.profile.raison_sociale')}
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        error={errors.name}
                        icon={Building2}
                        placeholder="Ex: InvoicePro SARL"
                     />
                     <Input 
                        label={t('auth.matricule')}
                        value={formData.matriculeFiscal}
                        onChange={(e) => handleInputChange('matriculeFiscal', e.target.value)}
                        error={errors.matriculeFiscal}
                        icon={Hash}
                        placeholder="1234567A/M/C/000"
                        className="font-mono uppercase"
                     />
                     <Input 
                        label="RNE"
                        value={formData.registreCommerce}
                        onChange={(e) => handleInputChange('registreCommerce', e.target.value)}
                        icon={FileText}
                        placeholder="RNE 0000000"
                     />
                  </div>

                  <div className="space-y-8">
                     <div className="flex items-center gap-4 mb-2">
                        <div className="bg-indigo-50 p-2.5 rounded-2xl border border-indigo-100/50 shadow-sm"><MapPin className="w-5 h-5 text-indigo-600" /></div>
                        <h4 className="font-black text-slate-900 uppercase tracking-widest text-[11px]">{t('settings.profile.contact_siege')}</h4>
                     </div>

                     <Input 
                        label={t('settings.profile.address_label')}
                        value={formData.address}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        icon={Home}
                        placeholder="Avenue Habib Bourguiba"
                     />
                     <div className="grid grid-cols-2 gap-6">
                        <Input 
                           label={t('settings.profile.city')}
                           value={formData.city}
                           onChange={(e) => handleInputChange('city', e.target.value)}
                           icon={MapPin}
                        />
                        <Input 
                           label={t('settings.profile.zip')}
                           value={formData.zipCode}
                           onChange={(e) => handleInputChange('zipCode', e.target.value)}
                           icon={Hash}
                        />
                     </div>
                     <Input 
                        label={t('settings.profile.phone')}
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        icon={Phone}
                        placeholder="+216 71 000 000"
                     />
                  </div>
               </div>
               <div className="px-10 py-8 bg-slate-50/50 border-t border-slate-50 flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div className="flex flex-col gap-1">
                     {saveMsg && (
                        <div className={`flex items-center gap-3 text-[11px] font-black uppercase tracking-widest ${saveMsg.type === 'success' ? 'text-emerald-600' : 'text-rose-600'} animate-in slide-in-from-left-2`}>
                           {saveMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                           {saveMsg.text}
                        </div>
                     )}
                     <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{t('settings.profile.last_updated')} {new Date().toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-4 w-full sm:w-auto">
                    <Button
                      type="button"
                      onClick={() => setIsHistoryModalOpen(true)}
                      variant="secondary"
                      className="flex-1 sm:w-auto px-8 py-4 !bg-white !text-slate-900 border border-slate-200 hover:border-indigo-600 shadow-xl shadow-slate-100 transition-all active:scale-95"
                      icon={History}
                    >
                      {lang === 'ar' ? 'السجل' : lang === 'en' ? 'History' : 'Historique'}
                    </Button>
                    <Button 
                      type="submit" 
                      loading={isSaving} 
                      className="flex-1 sm:w-auto px-12 py-4 shadow-2xl shadow-indigo-200 active:scale-95 transition-all" 
                      icon={Save}
                    >
                      {t('common.save')}
                    </Button>
                  </div>
               </div>
            </Card>

            <Card className="border-rose-100 bg-rose-50/10">
               <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                     <div className="p-4 bg-rose-50 rounded-2xl text-rose-600 border border-rose-100 shadow-sm"><ShieldAlert className="w-6 h-6" /></div>
                     <div>
                        <h4 className="text-sm font-black text-rose-900 uppercase tracking-tighter">{t('settings.danger_zone')}</h4>
                        <p className="text-xs text-rose-500 font-medium">{t('settings.delete_account_desc')}</p>
                     </div>
                  </div>
                  <Button variant="ghost" className="text-rose-600 hover:bg-rose-50 border-rose-100 !rounded-2xl font-black text-[10px] uppercase tracking-widest">
                     {t('settings.delete_account')}
                  </Button>
               </div>
            </Card>
          </form>
        )}

        {activeTab === 'security' && (
          <div className="max-w-2xl bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
             <div className="p-10 md:p-12">
               <div className="flex items-center gap-5 mb-10">
                 <div className="bg-amber-50 p-5 rounded-[1.5rem] text-amber-500 shadow-sm border border-amber-100/50 shadow-amber-50"><Lock className="w-7 h-7" /></div>
                 <div>
                   <h3 className="text-xl font-black text-slate-900 font-display leading-tight uppercase tracking-tight">{t('settings.security.title')}</h3>
                   <p className="text-slate-500 text-sm font-medium mt-1">{t('settings.security.subtitle')}</p>
                 </div>
               </div>
               
               <form onSubmit={handlePasswordChange} className="space-y-8">
                  <Input 
                     type="password"
                     label={t('settings.security.current_pwd')}
                     value={currentPassword}
                     onChange={e => setCurrentPassword(e.target.value)}
                     icon={Lock}
                     required
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <Input 
                        type="password"
                        label={t('settings.security.new_pwd')}
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        icon={ShieldCheck}
                        required
                        placeholder="8+ caractères"
                     />
                     <Input 
                        type="password"
                        label={t('settings.security.confirm_pwd')}
                        value={confirmNewPassword}
                        onChange={e => setConfirmNewPassword(e.target.value)}
                        icon={BadgeCheck}
                        required
                     />
                  </div>
                  
                  {pwdMsg && (
                    <div className={`p-6 rounded-3xl text-xs font-black uppercase tracking-wider flex items-center gap-4 animate-in slide-in-from-top-4 ${pwdMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'}`}>
                       {pwdMsg.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
                       {pwdMsg.text}
                    </div>
                  )}

                  <Button type="submit" loading={isChangingPwd} className="w-full py-5 bg-amber-500 hover:bg-slate-900 shadow-2xl shadow-amber-200 border-none transition-all text-xs font-black uppercase tracking-widest active:scale-95">
                     {t('settings.security.button')}
                  </Button>
               </form>
             </div>
          </div>
        )}

        {activeTab === 'compliance' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
             <Card noPadding className="shadow-xl shadow-slate-200/50 border-slate-100 overflow-hidden flex flex-col">
                <div className="p-10 space-y-8 flex-1">
                  <div className="flex items-center gap-5">
                    <div className="bg-indigo-50 p-5 rounded-[1.5rem] text-indigo-600 shadow-sm border border-indigo-100/50 shadow-indigo-50"><ShieldCheck className="w-7 h-7" /></div>
                    <div>
                      <h3 className="text-xl font-black text-slate-900 font-display leading-tight uppercase tracking-tight">{t('settings.compliance.title')}</h3>
                      <p className="text-slate-500 text-sm font-medium mt-1">{t('settings.compliance.subtitle')}</p>
                    </div>
                  </div>

                  <form onSubmit={handleEHouwiyaSave} className="p-6 bg-white border border-indigo-100 rounded-[2rem] space-y-5 shadow-sm">
                    <div className="flex items-center gap-3">
                      <BadgeCheck className="w-5 h-5 text-indigo-600" />
                      <span className="text-[11px] font-black uppercase tracking-widest text-indigo-900">E-Houwiya / Mobile ID</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900 mb-2">Avez-vous un identifiant E-Houwiya / Mobile ID ?</h4>
                      <p className="text-xs font-bold text-slate-500 leading-5">
                        Pour les entrepreneurs, cet identifiant peut être nécessaire dans le parcours d’adhésion et d’identification numérique. À vérifier selon votre statut et la procédure officielle.
                      </p>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                      {[
                        { value: 'HAS_IDENTIFIER', label: 'Oui, je l’ai déjà' },
                        { value: 'NEED_HELP', label: 'Non, je veux être accompagné' },
                        { value: 'NOT_SURE', label: 'Je ne sais pas' },
                      ].map((option) => (
                        <label key={option.value} className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-bold cursor-pointer transition-all ${formData.eHouwiyaStatus === option.value ? 'border-indigo-200 bg-indigo-50 text-indigo-900' : 'border-slate-100 bg-slate-50 text-slate-600 hover:border-indigo-100'}`}>
                          <input
                            type="radio"
                            name="eHouwiyaStatus"
                            value={option.value}
                            checked={formData.eHouwiyaStatus === option.value}
                            onChange={(event) => handleInputChange('eHouwiyaStatus', event.target.value)}
                            className="accent-indigo-600"
                          />
                          {option.label}
                        </label>
                      ))}
                    </div>
                    {formData.eHouwiyaStatus === 'HAS_IDENTIFIER' ? (
                      <Input
                        label="Identifiant E-Houwiya / Mobile ID"
                        value={formData.eHouwiyaIdentifier}
                        onChange={(event) => handleInputChange('eHouwiyaIdentifier', event.target.value)}
                        icon={BadgeCheck}
                        placeholder="Optionnel"
                      />
                    ) : (
                      <Button type="button" variant="secondary" onClick={() => navigate('/signature-ttn')} className="w-full justify-center">
                        Demander un accompagnement
                      </Button>
                    )}
                    {saveMsg ? (
                      <div className={`rounded-2xl px-4 py-3 text-xs font-black ${saveMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'}`}>
                        {saveMsg.text}
                      </div>
                    ) : null}
                    <Button type="submit" loading={isSaving} className="w-full">
                      Enregistrer le statut E-Houwiya
                    </Button>
                  </form>

                  <div className="p-6 bg-slate-50 border border-slate-100 rounded-[2rem] space-y-4">
                    <div className="flex items-center gap-3">
                      <Zap className="w-5 h-5 text-indigo-500 fill-indigo-500" />
                      <span className="text-[11px] font-black uppercase tracking-widest text-indigo-900">{t('settings.compliance.prerequisite')}</span>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed font-bold">
                      {t('settings.compliance.explanation')}
                    </p>
                    <a href="https://www.tuntrust.tn" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-[11px] font-black text-indigo-600 hover:text-slate-900 transition-colors group">
                      {t('settings.compliance.order_cert')} <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </a>
                  </div>

                  <form onSubmit={handleCertificateUpload} className="space-y-8">
                     <div className="space-y-2">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ms-1">{t('settings.compliance.file_label')}</label>
                        <div className="relative group">
                           <FileText className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                           <input type="file" accept=".p12,.pfx" onChange={e => setCertFile(e.target.files[0])} className="w-full bg-slate-50/50 border border-slate-100 rounded-[1.5rem] pl-14 pr-4 py-4 text-xs font-bold text-slate-500 cursor-pointer file:hidden hover:bg-white hover:ring-4 hover:ring-indigo-500/5 transition-all outline-none" />
                           <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-indigo-600 uppercase tracking-widest pointer-events-none">{certFile ? certFile.name : t('settings.compliance.choose_file')}</span>
                        </div>
                     </div>
                     <Input 
                        type="password"
                        label={t('settings.compliance.pwd_label')}
                        value={certPassword}
                        onChange={e => setCertPassword(e.target.value)}
                        icon={Lock}
                        placeholder="••••••••"
                        required
                     />
                     <Button type="submit" loading={isUploadingCert} className="w-full py-5 shadow-2xl shadow-indigo-200 active:scale-95 uppercase text-xs tracking-widest font-black" icon={CheckCircle2}>
                        {t('settings.compliance.button')}
                     </Button>
                  </form>
                </div>
             </Card>

             <div className="space-y-8">
                <div className="bg-slate-900 rounded-[3rem] p-12 text-white shadow-3xl shadow-slate-900/40 relative overflow-hidden group border border-slate-800">
                   <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:bg-indigo-500/20 transition-all duration-1000"></div>
                   <div className="relative z-10 space-y-10">
                      <header className="space-y-3">
                         <h4 className="text-2xl font-black flex items-center gap-4 font-display italic">
                           <Cpu className="w-8 h-8 text-indigo-400 animate-pulse" /> 
                           {t('settings.compliance.system_status')}
                         </h4>
                         <p className="text-slate-400 text-sm font-bold tracking-tight">
                           {t('settings.compliance.status_desc')}
                         </p>
                      </header>

                      <div className="space-y-4">
                         <div className="p-6 bg-white/5 rounded-[2rem] border border-white/10 backdrop-blur-md space-y-4">
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-xs font-black text-slate-300 uppercase tracking-widest">Configuration facture électronique</span>
                              <Badge variant={eInvoiceStatus?.mode === 'production' ? 'success' : 'warning'} className="px-4 py-1.5 font-black border-none bg-indigo-500 text-white">
                                {eInvoiceStatus?.mode === 'mock' ? 'Simulation' : eInvoiceStatus?.mode === 'sandbox' ? 'Sandbox' : 'Production'}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-bold">
                              <div className="flex justify-between gap-3 rounded-2xl bg-slate-950/40 px-4 py-3">
                                <span className="text-slate-400">TEIF configuré</span>
                                <span>{eInvoiceStatus?.teifConfigured ? 'Oui' : 'Non'}</span>
                              </div>
                              <div className="flex justify-between gap-3 rounded-2xl bg-slate-950/40 px-4 py-3">
                                <span className="text-slate-400">Signature électronique</span>
                                <span>{eInvoiceStatus?.signatureConfigured ? 'Configurée' : 'Non configurée'}</span>
                              </div>
                              <div className="flex justify-between gap-3 rounded-2xl bg-slate-950/40 px-4 py-3">
                                <span className="text-slate-400">TTN API</span>
                                <span>{eInvoiceStatus?.ttnConfigured ? 'Connectée' : 'Non connectée'}</span>
                              </div>
                              <div className="flex justify-between gap-3 rounded-2xl bg-slate-950/40 px-4 py-3">
                                <span className="text-slate-400">Dossier entreprise</span>
                                <span>{eInvoiceStatus?.companyDossierComplete ? 'Complet' : 'Incomplet'}</span>
                              </div>
                              <div className="flex justify-between gap-3 rounded-2xl bg-slate-950/40 px-4 py-3">
                                <span className="text-slate-400">Factures légales</span>
                                <span>{eInvoiceStatus?.canIssueLegalInvoices ? 'Oui' : 'Non'}</span>
                              </div>
                            </div>
                            {eInvoiceStatus?.missingRequirements?.length ? (
                              <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3">
                                <div className="text-[10px] font-black uppercase tracking-widest text-amber-200 mb-2">Exigences manquantes</div>
                                <ul className="space-y-1 text-xs text-amber-50 font-semibold">
                                  {eInvoiceStatus.missingRequirements.map((item) => <li key={item}>{item}</li>)}
                                </ul>
                              </div>
                            ) : null}
                         </div>
                         <div className="flex items-center justify-between p-6 bg-white/5 rounded-[2rem] border border-white/10 backdrop-blur-md hover:bg-white/10 transition-colors">
                            <span className="text-xs font-black text-slate-300 uppercase tracking-widest">{t('settings.compliance.ubl_gen')}</span>
                            <Badge variant="success" className="px-4 py-1.5 font-black bg-emerald-500 text-white border-none">{t('settings.compliance.operational')}</Badge>
                         </div>
                         <div className="flex items-center justify-between p-6 bg-white/5 rounded-[2rem] border border-white/10 backdrop-blur-md hover:bg-white/10 transition-colors">
                            <span className="text-xs font-black text-slate-300 uppercase tracking-widest">{t('settings.compliance.xades_sign')}</span>
                            <Badge variant={hasCert ? "success" : "warning"} className={`px-4 py-1.5 font-black border-none ${hasCert ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'}`}>
                               {hasCert ? t('settings.compliance.active') : t('settings.compliance.not_config')}
                            </Badge>
                         </div>
                         <div className="flex items-center justify-between p-6 bg-white/5 rounded-[2rem] border border-white/10 backdrop-blur-md hover:bg-white/10 transition-colors">
                            <span className="text-xs font-black text-slate-300 uppercase tracking-widest">{t('settings.compliance.ttn_sub')}</span>
                            <Badge variant="secondary" className={`px-4 py-1.5 font-black border-none ${hasCert ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-400'}`}>
                               {hasCert ? t('settings.compliance.ready') : t('settings.compliance.req_cert')}
                            </Badge>
                         </div>
                      </div>
                      
                      <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                         <div className="flex -space-x-3">
                            <div className="w-10 h-10 rounded-full bg-slate-800 border-2 border-slate-900 flex items-center justify-center text-[10px] font-black">TN</div>
                            <div className="w-10 h-10 rounded-full bg-slate-800 border-2 border-slate-900 flex items-center justify-center text-[10px] font-black">TTN</div>
                            <div className="w-10 h-10 rounded-full bg-slate-800 border-2 border-slate-900 flex items-center justify-center text-[10px] font-black">+</div>
                         </div>
                         <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">{t('settings.compliance.version')}</span>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        )}

        {activeTab === 'subscription' && (
          <div className="space-y-10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* CURRENT PLAN STATUS */}
              <div className="lg:col-span-2 bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                <div className="p-10 md:p-12 space-y-10">
                  <header className="flex items-center gap-6">
                    <div className="bg-blue-50 p-5 rounded-[1.5rem] text-blue-600 shadow-sm border border-blue-100/50">
                       <Zap className="w-7 h-7" fill="currentColor" />
                    </div>
                    <div>
                       <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight font-display">Votre Forfait {getPlanLabel(user?.subscription?.plan)}</h3>
                       <p className="text-slate-500 text-sm font-medium">Gérez vos limites et options de facturation</p>
                    </div>
                  </header>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-6">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Statut de la Facturation</h4>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center bg-slate-50 p-5 rounded-2xl border border-slate-100">
                          <span className="text-xs font-bold text-slate-600">Factures ce mois</span>
                          <span className="text-sm font-black text-slate-900">
                             {user?.subscription?.usedInvoicesThisMonth} / {user?.subscription?.monthlyInvoiceLimit === 999999 ? '∞' : user?.subscription?.monthlyInvoiceLimit}
                          </span>
                        </div>
                        <div className="flex justify-between items-center bg-slate-50 p-5 rounded-2xl border border-slate-100">
                          <span className="text-xs font-bold text-slate-600">Prochain rechargement</span>
                          <span className="text-sm font-black text-slate-900">
                             Le 1er du mois prochain
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Fonctionnalités Incluses</h4>
                      <div className="space-y-3">
                         <div className="flex items-center gap-3 text-sm font-bold text-slate-700">
                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                            Facturation TEIF (XML)
                         </div>
                         <div className={`flex items-center gap-3 text-sm font-bold ${user?.subscription?.aiEnabled ? 'text-slate-700' : 'text-slate-300'}`}>
                            {user?.subscription?.aiEnabled ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <AlertCircle className="w-5 h-5" />}
                            Assistant IA Expert
                         </div>
                         <div className={`flex items-center gap-3 text-sm font-bold ${user?.subscription?.reportsEnabled ? 'text-slate-700' : 'text-slate-300'}`}>
                            {user?.subscription?.reportsEnabled ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <AlertCircle className="w-5 h-5" />}
                            Rapports de Performance
                         </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* UPGRADE TEASER */}
              <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl shadow-slate-900/30 flex flex-col justify-between relative overflow-hidden group">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all"></div>
                 <div>
                    <Badge variant="premium" className="mb-6 bg-indigo-500 text-white border-none px-4 py-1.5 font-black uppercase text-[10px] tracking-widest">{user?.subscription?.plan === 'STARTER' ? 'Recommandé' : 'Actuel'}</Badge>
                    <h4 className="text-2xl font-black mb-2 font-display italic">Pro</h4>
                    <p className="mb-6 text-sm font-bold text-slate-400">Pour débloquer l'automatisation, le suivi avancé et l'assistant IA.</p>
                    
                    <ul className="space-y-4 mb-10">
                       <li className="flex items-center gap-3 text-[11px] font-bold text-slate-400">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Facturation Illimitée
                       </li>
                       <li className="flex items-center gap-3 text-[11px] font-bold text-slate-400">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Assistant IA Complet
                       </li>
                       <li className="flex items-center gap-3 text-[11px] font-bold text-slate-400">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Rapports Avancés
                       </li>
                    </ul>
                 </div>
                 
                 {user?.subscription?.plan === 'STARTER' ? (
                   <button
                    type="button"
                    onClick={() => navigate('/pricing')}
                    className="w-full py-4 bg-white text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-white/5 hover:scale-[1.02] active:scale-95 transition-all"
                   >
                      S'abonner maintenant
                   </button>
                 ) : (
                   <div className="w-full py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-black text-xs uppercase tracking-widest text-center">
                      Plan Actuel
                   </div>
                 )}
              </div>
            </div>

            {/* ENTERPRISE CARD */}
            <div className="p-10 bg-gradient-to-r from-slate-50 to-indigo-50/50 border border-indigo-100 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-8 group">
               <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-indigo-50 flex items-center justify-center text-indigo-600 transition-transform group-hover:scale-110">
                     <Building2 size={32} />
                  </div>
                  <div>
                     <h4 className="text-xl font-black text-slate-900 font-display italic">Forfait Max</h4>
                     <p className="text-sm text-slate-500 font-medium">Solutions sur-mesure pour les grandes équipes et franchises.</p>
                  </div>
               </div>
               <div className="flex flex-col items-center md:items-end gap-2">
                  <div className="text-sm font-black text-slate-900 tracking-tight">Accompagnement avancé</div>
                  <button
                    type="button"
                    onClick={() => navigate('/signature-ttn')}
                    className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-indigo-100 hover:bg-slate-900 active:scale-95 transition-all"
                  >
                     Contacter un expert
                  </button>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'help' && (
          <div className="space-y-6">
            <Card className="border-slate-100 bg-white">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4">
                  <div className="rounded-2xl bg-indigo-50 p-3 text-indigo-600">
                    <HelpCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-black uppercase tracking-widest text-slate-900">
                      {lang === 'ar' ? 'مركز المساعدة' : lang === 'en' ? 'Help Center' : "Centre d’aide"}
                    </h2>
                    <p className="mt-1 text-sm font-medium text-slate-500">
                      {lang === 'ar'
                        ? 'افتح الدعم والاسئلة الشائعة من داخل الإعدادات.'
                        : lang === 'en'
                          ? 'Open support resources and guides from Settings.'
                          : 'Retrouvez le support, les guides et les questions fréquentes depuis les paramètres.'}
                    </p>
                  </div>
                </div>
                <Button type="button" variant="secondary" icon={ChevronRight} onClick={() => navigate('/help')}>
                  {lang === 'ar' ? 'فتح مركز المساعدة' : lang === 'en' ? 'Open help center' : "Ouvrir le centre d’aide"}
                </Button>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'team' && (
          <Card className="text-center py-24 shadow-2xl shadow-slate-200/50 border-slate-100 overflow-hidden relative group">
             <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-transparent via-indigo-600 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
             <div className="max-w-md mx-auto space-y-10 flex flex-col items-center">
                <div className="bg-slate-50/50 p-10 rounded-[3.5rem] border border-slate-100 text-slate-200 relative">
                   <Users2 className="w-20 h-20 group-hover:scale-110 group-hover:text-indigo-100 transition-all duration-700" />
                   <div className="absolute -top-4 -right-4 w-12 h-12 bg-indigo-600 rounded-[1.5rem] flex items-center justify-center text-white shadow-xl shadow-indigo-200 ring-4 ring-white animate-bounce">
                      <Zap className="w-6 h-6 fill-white" />
                   </div>
                </div>
                <div className="space-y-4">
                   <h3 className="text-3xl font-black text-slate-900 font-display tracking-tight uppercase italic">{t('settings.team.title')}</h3>
                   <p className="text-slate-500 text-sm font-medium leading-relaxed">
                      {t('settings.team.desc')}
                   </p>
                </div>
                <div className="inline-flex items-center gap-4 px-8 py-3 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-sm">
                  {t('settings.team.feature_premium')}
                </div>
                <Button className="!rounded-2xl px-12 py-5 shadow-2xl shadow-indigo-100 text-xs font-black uppercase tracking-widest active:scale-95 transition-all">
                   DÉCOUVRIR LES PLANS
                </Button>
             </div>
          </Card>
        )}
      </div>

      <SettingsHistoryModal 
        isOpen={isHistoryModalOpen} 
        onClose={() => setIsHistoryModalOpen(false)} 
      />
    </div>
  );
};

export default Settings;
