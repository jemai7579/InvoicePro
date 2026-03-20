import React, { useState, useEffect, useContext } from 'react';
import { Save, Loader, Info, ExternalLink, ShieldCheck, Lock, Image as ImageIcon, Plus } from 'lucide-react';
import api from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { AuthContext } from '../context/AuthContext';

const Settings = () => {
  const { t } = useLanguage();
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState(null);

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
    logo: ''
  });

  const [certFile, setCertFile] = useState(null);
  const [certPassword, setCertPassword] = useState('');
  const [isUploadingCert, setIsUploadingCert] = useState(false);

  useEffect(() => {
    // Scroll to cert if requested
    if (window.location.hash === '#certificate') {
      const el = document.getElementById('certificate');
      if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 500);
    }
    
    const fetchSettings = async () => {
      try {
        const response = await api.get('/settings');
        const data = response.data;
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
          logo: data.logo || ''
        });
      } catch (error) {
        console.error('Error fetching settings', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const newErrors = {};
    const mfRegex = /^\d{7}[A-Z]\/[A-Z]\/[A-Z]\/\d{3}$|^\d{7}[A-Z]{3}\d{3}$/;
    if (!mfRegex.test(formData.matriculeFiscal)) {
      newErrors.matriculeFiscal = 'Format invalide. Exemple: 1234567A/A/M/000';
    }
    const ribRegex = /^\d{20}$/;
    if (formData.rib && !ribRegex.test(formData.rib)) {
      newErrors.rib = 'Le RIB doit contenir exactement 20 chiffres.';
    }
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
      setSaveMsg({ text: 'Settings saved successfully!', type: 'success' });
    } catch (error) {
       setSaveMsg({ text: 'Failed to save settings.', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      return setPwdMsg({ text: 'Passwords do not match.', type: 'error' });
    }
    setIsChangingPwd(true);
    setPwdMsg(null);
    try {
      await api.put('/settings/password', { currentPassword, newPassword });
      setPwdMsg({ text: 'Password changed successfully!', type: 'success' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (error) {
      setPwdMsg({ text: error.response?.data?.message || 'Error changing password', type: 'error' });
    } finally {
      setIsChangingPwd(false);
    }
  };

  const handleCertificateUpload = async (e) => {
    e.preventDefault();
    if (!certFile || !certPassword) return;
    setIsUploadingCert(true);
    const certFormData = new FormData();
    certFormData.append('certificate', certFile);
    certFormData.append('password', certPassword);
    try {
      await api.post('/settings/certificate', certFormData);
      alert('Certificate uploaded successfully!');
      setCertFile(null);
      setCertPassword('');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to upload certificate');
    } finally {
      setIsUploadingCert(false);
    }
  };

  const [logoFile, setLogoFile] = useState(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Client-side validation
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      alert(t('settings.logo.err.size'));
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.mimetype || file.type)) {
      alert(t('settings.logo.err.type'));
      return;
    }

    setIsUploadingLogo(true);
    const logoFormData = new FormData();
    logoFormData.append('logo', file);
    try {
      const resp = await api.post('/settings/logo', logoFormData);
      setFormData(prev => ({ ...prev, logo: resp.data.logo }));
      setLogoFile(null);
      setSaveMsg({ text: 'Logo uploaded successfully!', type: 'success' });
    } catch (error) {
       alert(error.response?.data?.message || 'Upload failed');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  return (loading ? <div className="p-8 flex justify-center"><Loader className="animate-spin" /></div> : (
    <div className="max-w-4xl space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">{t('settings.title')}</h1>
        <p className="text-sm text-gray-500">{t('settings.subtitle')}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white shadow-sm rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50 flex items-center gap-2">
            <Info className="w-5 h-5 text-blue-600" />
            <span className="font-bold text-gray-800">{t('settings.general')}</span>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2 flex items-center gap-6 mb-4">
              <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center bg-gray-50 overflow-hidden relative group">
                {formData.logo ? <img src={`http://localhost:5000${formData.logo}`} className="w-full h-full object-contain" /> : <ImageIcon className="w-8 h-8 text-gray-300" />}
                <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                   {isUploadingLogo ? <Loader className="text-white w-6 h-6 animate-spin" /> : <Plus className="text-white w-6 h-6" />}
                   <input type="file" className="hidden" accept="image/png, image/jpeg" onChange={handleLogoUpload} />
                </label>
              </div>
              <div>
                <p className="font-bold text-gray-800 text-sm">{t('settings.logo')}</p>
                <p className="text-[10px] text-blue-600 font-bold mb-1">{t('settings.logo.req')}</p>
                <p className="text-[10px] text-gray-400 leading-tight">{t('settings.logo.desc')}</p>
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{t('form.name')} *</label>
              <input type="text" name="name" required value={formData.name} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{t('form.email')}</label>
              <input type="email" value={user?.email} disabled className="w-full px-4 py-2.5 bg-gray-100 border-none rounded-xl text-gray-400 cursor-not-allowed" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{t('form.mf')} *</label>
              <input type="text" name="matriculeFiscal" required value={formData.matriculeFiscal} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
              {errors.matriculeFiscal && <p className="text-red-500 text-[10px] mt-1">{errors.matriculeFiscal}</p>}
            </div>
            <div>
               <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{t('form.rc')}</label>
               <input type="text" name="registreCommerce" value={formData.registreCommerce} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          </div>
        </div>

        <div className="bg-white shadow-sm rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <span className="font-bold text-gray-800">{t('settings.address')}</span>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
               <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{t('form.address')} *</label>
               <input type="text" name="address" required value={formData.address} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
               <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{t('form.city')}</label>
               <input type="text" name="city" value={formData.city} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
               <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{t('form.zip')}</label>
               <input type="text" name="zipCode" value={formData.zipCode} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          </div>
          <div className="px-6 py-4 bg-white border-t border-gray-50 flex justify-end">
             <button type="submit" disabled={isSaving} className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all flex items-center gap-2">
                {isSaving ? <Loader className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />}
                {t('settings.save')}
             </button>
          </div>
        </div>
      </form>

      {/* Password and Certificate Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white shadow-sm rounded-2xl border border-gray-100 p-6 flex flex-col">
           <div className="flex items-center gap-3 mb-6">
              <Lock className="w-5 h-5 text-amber-500" />
              <h3 className="font-bold text-gray-800">{t('settings.password')}</h3>
           </div>
           <form onSubmit={handlePasswordChange} className="space-y-4 flex-1">
              <input type="password" required placeholder={t('settings.pwd.current')} value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-amber-500 outline-none text-sm" />
              <input type="password" required placeholder={t('settings.pwd.new')} value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-amber-500 outline-none text-sm" />
              <input type="password" required placeholder={t('settings.pwd.confirm')} value={confirmNewPassword} onChange={e => setConfirmNewPassword(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-amber-500 outline-none text-sm" />
              <button type="submit" className="w-full py-2.5 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 transition-all text-sm mt-auto">
                 {isChangingPwd ? <Loader className="animate-spin w-4 h-4 mx-auto" /> : t('settings.password')}
              </button>
           </form>
           {pwdMsg && <p className={`mt-3 text-[10px] text-center ${pwdMsg.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>{pwdMsg.text}</p>}
        </div>

        <div id="certificate" className="bg-white shadow-sm rounded-2xl border border-gray-100 p-6 flex flex-col">
           <div className="flex items-center gap-3 mb-4">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-gray-800">{t('settings.cert')}</h3>
           </div>
           <p className="text-[11px] text-gray-400 mb-6 leading-relaxed">{t('settings.cert.desc')}</p>
           
           <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl mb-6">
              <p className="text-xs font-bold text-blue-800 mb-1">{t('settings.cert.tuntrust.required')}</p>
              <p className="text-[10px] text-blue-600 mb-3">{t('settings.cert.tuntrust.desc')}</p>
              <a href="https://www.tuntrust.tn" target="_blank" className="text-[10px] font-bold text-blue-700 underline flex items-center gap-1">
                 {t('settings.cert.tuntrust.portal')} <ExternalLink className="w-3 h-3" />
              </a>
           </div>

           <form onSubmit={handleCertificateUpload} className="space-y-4">
              <div className="flex flex-col gap-1">
                 <label className="text-[10px] font-bold text-gray-400 uppercase px-1">{t('settings.cert.file')}</label>
                 <input type="file" accept=".p12" onChange={e => setCertFile(e.target.files[0])} className="text-xs file:bg-blue-50 file:border-none file:rounded-lg file:text-blue-700 file:font-bold file:px-3 file:py-1 cursor-pointer" />
              </div>
              <input type="password" placeholder={t('settings.cert.password')} value={certPassword} onChange={e => setCertPassword(e.target.value)} className="w-full px-4 py-2 text-sm bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
              <button type="submit" className="w-full py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all text-sm">
                 {isUploadingCert ? <Loader className="animate-spin w-4 h-4 mx-auto" /> : t('settings.cert.upload')}
              </button>
           </form>
        </div>
      </div>
    </div>
  ));
};

export default Settings;
