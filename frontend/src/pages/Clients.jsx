import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, X, Loader, User, Mail, Phone, MapPin, FileText, Package, Users, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import api from '../services/api';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';

const Clients = () => {
  const { t } = useLanguage();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    mf: ''
  });

  const fetchClients = async () => {
    try {
      setLoading(true);
      const res = await api.get('/clients');
      setClients(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchClients(); }, []);

  const handleEdit = (c) => {
    setEditingId(c.id);
    setFormData({
      name: c.name || '',
      email: c.email || '',
      phone: c.phone || '',
      address: c.address || '',
      mf: c.mf || ''
    });
    setErrors({});
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('common.confirmDelete') || 'Voulez-vous supprimer ce client ?')) return;
    try {
      await api.delete(`/clients/${id}`);
      fetchClients();
    } catch (err) { console.error(err); }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = t('error.nameRequired') || 'Le nom est requis';
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('error.invalidEmail') || 'Email invalide';
    }
    if (!formData.mf.trim()) newErrors.mf = t('error.mfRequired') || 'Matricule Fiscal requis';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

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
      setFormData({ name: '', email: '', phone: '', address: '', mf: '' });
      fetchClients();
    } catch (err) { 
      console.error(err);
      setSubmitError(err.response?.data?.message || t('settings.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors(prev => {
        const n = { ...prev };
        delete n[field];
        return n;
      });
    }
  };

  const filtered = clients.filter(c => 
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.mf?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="pb-20 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div>
          <h2 className="text-2xl font-black text-slate-900 font-display tracking-tight uppercase">{t('clients.title')}</h2>
          <p className="text-sm text-slate-500 font-medium">{t('clients.subtitle')}</p>
        </div>
        <Button 
          onClick={() => { setEditingId(null); setFormData({ name: '', email: '', phone: '', address: '', mf: '' }); setErrors({}); setShowModal(true); }}
          icon={Plus}
          className="!rounded-2xl shadow-lg shadow-indigo-100"
        >
          {t('clients.new')}
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          <input 
            type="text"
            placeholder={t('clients.search')}
            className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium text-sm text-slate-700 placeholder:text-slate-300 shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="px-6 py-3 bg-indigo-50/50 rounded-2xl border border-indigo-100/30 flex items-center justify-center">
          <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest leading-none">
            {filtered.length} {t('common.results')}
          </span>
        </div>
      </div>

      <Card noPadding className="overflow-hidden border-slate-100">
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('clients.table.name')}</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('clients.table.email')}</th>
                <th className="px-8 py-4 text-end text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('clients.table.mf')}</th>
                <th className="px-8 py-4 text-end text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                   <td colSpan="4" className="py-20 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <Loader className="w-8 h-8 animate-spin text-indigo-600" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Chargement des clients...</p>
                      </div>
                   </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="4" className="py-20 text-center text-slate-400 italic text-sm">
                    {t('clients.empty')}
                  </td>
                </tr>
              ) : (
                filtered.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50/30 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-xs border border-indigo-100 shadow-sm shadow-indigo-50">
                          {c.name?.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="font-bold text-slate-900 tracking-tight">{c.name}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-sm font-medium text-slate-500">{c.email || '--'}</td>
                    <td className="px-8 py-5 text-[11px] font-black text-slate-400 text-end font-mono uppercase tracking-tighter">{c.mf || '--'}</td>
                    <td className="px-8 py-5 text-end">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleEdit(c)}
                          className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(c.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 transition-colors"
                        >
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

        {/* Mobile View */}
        <div className="md:hidden p-4 space-y-4">
          {filtered.map(c => (
            <div key={c.id} className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 flex flex-col gap-4">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-xs border border-indigo-100">
                    {c.name?.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-base font-black text-slate-900 font-display">{c.name}</h4>
                    <p className="text-xs text-slate-500 font-medium">{c.email || '--'}</p>
                  </div>
               </div>
               <div className="pt-4 border-t border-slate-50 flex justify-between items-center">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('clients.table.mf')}</p>
                    <p className="text-[11px] font-black text-slate-900 font-mono tracking-tighter">{c.mf || '--'}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(c)} className="p-3 bg-slate-50 rounded-2xl text-slate-400">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(c.id)} className="p-3 bg-slate-50 rounded-2xl text-slate-400">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
               </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Modal Section */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card 
            className="w-full max-w-lg animate-in zoom-in duration-300 shadow-[0_30px_100px_-20px_rgba(0,0,0,0.15)]"
            noPadding
            title={editingId ? t('clients.form.title_edit') : t('clients.form.title_new')}
            action={
              <button 
                onClick={() => setShowModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            }
          >
             <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <Input 
                   label={t('clients.form.name_label')}
                   placeholder={t('clients.form.name_placeholder')}
                   value={formData.name}
                   onChange={(e) => handleInputChange('name', e.target.value)}
                   error={errors.name}
                   icon={User}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <Input 
                    type="email"
                    label={t('form.email')}
                    placeholder={t('clients.form.email_placeholder')}
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    error={errors.email}
                    icon={Mail}
                  />
                  <Input 
                    label={t('form.phone')}
                    placeholder={t('clients.form.phone_placeholder')}
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    error={errors.phone}
                    icon={Phone}
                  />
                </div>

                <Input 
                  label={t('clients.form.address_label')}
                  placeholder={t('clients.form.address_placeholder')}
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  error={errors.address}
                  icon={MapPin}
                />

                <Input 
                  label={t('clients.form.mf_label')}
                  placeholder={t('clients.form.mf_placeholder')}
                  value={formData.mf}
                  onChange={(e) => handleInputChange('mf', e.target.value)}
                  error={errors.mf}
                  icon={FileText}
                  className="font-mono uppercase"
                />

                {submitError && (
                  <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 text-[11px] font-black uppercase tracking-widest animate-in slide-in-from-top-2">
                    <AlertCircle className="w-5 h-5" />
                    {submitError}
                  </div>
                )}

                <div className="pt-6 flex gap-4">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={() => setShowModal(false)}
                    className="flex-1 !rounded-2xl"
                  >
                    {t('form.cancel')}
                  </Button>
                  <Button 
                    type="submit" 
                    variant="primary" 
                    loading={isSubmitting}
                    className="flex-1 !rounded-2xl shadow-xl shadow-indigo-100"
                    icon={CheckCircle2}
                  >
                    {t('common.save')}
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

