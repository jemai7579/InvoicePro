import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, X, Loader, Package, Tag, Info, DollarSign, CheckCircle, AlertCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import api from '../services/api';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Badge from '../components/ui/Badge';

const Products = () => {
  const { t } = useLanguage();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);

  const [formData, setFormData] = useState({
    code: '',
    category: '',
    name: '',
    description: '',
    priceHT: '',
    tvaRate: 19
  });

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/products');
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const openModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        code: product.code || '',
        category: product.category || '',
        name: product.name,
        description: product.description || '',
        priceHT: product.priceHT.toString(),
        tvaRate: product.tvaRate
      });
    } else {
      setEditingProduct(null);
      setFormData({ code: '', category: '', name: '', description: '', priceHT: '', tvaRate: 19 });
    }
    setErrors({});
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

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
    if (!formData.name.trim()) newErrors.name = t('error.nameRequired') || 'Le nom est requis';
    if (!formData.priceHT || parseFloat(formData.priceHT) < 0) {
      newErrors.priceHT = t('error.invalidPrice') || 'Prix invalide (>= 0)';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setSubmitError(null);
    const payload = {
      ...formData,
      priceHT: parseFloat(formData.priceHT),
      tvaRate: parseFloat(formData.tvaRate)
    };

    try {
      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, payload);
      } else {
        await api.post('/products', payload);
      }
      fetchProducts();
      closeModal();
    } catch (error) {
      console.error('Error saving product', error);
      setSubmitError(error.response?.data?.message || t('settings.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm(t('common.confirmDelete') || 'Voulez-vous supprimer ce produit ?')) {
      try {
        await api.delete(`/products/${id}`);
        fetchProducts();
      } catch (error) {
        console.error('Error deleting product', error);
      }
    }
  };

  const filteredProducts = products.filter(p => 
    (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.code || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="pb-20 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div>
          <h2 className="text-2xl font-black text-slate-900 font-display tracking-tight uppercase">{t('products.title')}</h2>
          <p className="text-sm text-slate-500 font-medium">{t('products.subtitle')}</p>
        </div>
        <Button onClick={() => openModal()} icon={Plus} className="!rounded-2xl shadow-lg shadow-indigo-100">
          {t('products.new')}
        </Button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          <input 
            type="text" 
            placeholder={t('products.search')} 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm placeholder:text-slate-300"
          />
        </div>
        <div className="px-6 py-3 bg-indigo-50/50 rounded-2xl border border-indigo-100/30 flex items-center justify-center">
          <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest leading-none">
            {filteredProducts.length} {t('common.results') || 'Items'}
          </span>
        </div>
      </div>

      <Card noPadding className="overflow-hidden border-slate-100">
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('products.table.code')}</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('products.table.name')}</th>
                <th className="px-8 py-4 text-end text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('products.table.price')}</th>
                <th className="px-8 py-4 text-end text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('products.table.tva')}</th>
                <th className="px-8 py-4 text-end text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                   <td colSpan="5" className="py-20 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <Loader className="w-8 h-8 animate-spin text-indigo-600" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Catalogue en cours...</p>
                      </div>
                   </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-20 text-center text-slate-400 italic text-sm">
                    {t('products.empty')}
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50/30 transition-colors group">
                    <td className="px-8 py-6">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-black bg-slate-100 text-slate-500 border border-slate-200 uppercase tracking-tighter">
                        {product.code || 'N/A'}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 me-4 border border-indigo-100 shadow-sm shadow-indigo-50">
                          <Package className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-900">{product.name}</div>
                          <div className="text-[11px] text-slate-400 font-medium truncate max-w-[200px]">{product.description || '-'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-end">
                      <div className="text-sm font-black text-slate-900 font-display">
                        {product.priceHT.toLocaleString(undefined, { minimumFractionDigits: 3 })}
                        <span className="text-[10px] text-slate-400 ms-1 uppercase font-bold">{t('common.tnd')}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-end">
                      <Badge variant="secondary" className="!bg-slate-50 border-slate-100">
                        {product.tvaRate}%
                      </Badge>
                    </td>
                    <td className="px-8 py-6 text-end">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openModal(product)} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(product.id)} className="p-2 text-slate-400 hover:text-rose-600 transition-colors">
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
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-16 text-center text-slate-400 italic text-sm">{t('products.empty')}</div>
          ) : null}
          {!loading && filteredProducts.map((product) => (
            <div key={product.id} className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 flex flex-col gap-4">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100">
                    <Package className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h4 className="text-base font-black text-slate-900 font-display">{product.name}</h4>
                      <span className="text-[9px] font-black px-2 py-0.5 bg-slate-100 text-slate-500 rounded-lg uppercase border border-slate-200">
                         {product.code || 'N/A'}
                      </span>
                    </div>
                  </div>
               </div>
               <div className="pt-4 border-t border-slate-50 flex justify-between items-center">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('products.table.price')}</p>
                    <p className="text-lg font-black text-slate-900 font-display">
                      {product.priceHT.toLocaleString(undefined, { minimumFractionDigits: 3 })} <span className="text-xs">{t('common.tnd')}</span>
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openModal(product)} className="p-3 bg-slate-50 rounded-2xl text-slate-400">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(product.id)} className="p-3 bg-slate-50 rounded-2xl text-slate-400">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
               </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Modal Section */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card 
            className="w-full max-w-lg animate-in zoom-in duration-300 shadow-[0_30px_100px_-20px_rgba(0,0,0,0.15)]"
            noPadding
            title={editingProduct ? t('products.form.title_edit') : t('products.form.title_new')}
            action={
              <button onClick={closeModal} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all">
                <X className="w-5 h-5" />
              </button>
            }
          >
             <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <Input
                    label={t('products.table.code')}
                    placeholder="ex: PRD-001"
                    value={formData.code}
                    onChange={(e) => handleInputChange('code', e.target.value)}
                    error={errors.code}
                    icon={Tag}
                    className="uppercase"
                  />
                  <Input
                    label={t('products.table.name')}
                    placeholder="Nom du produit"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    error={errors.name}
                    icon={Package}
                    required
                  />
                </div>

                <Input
                  label="Catégorie"
                  placeholder="ex: Services, Matériel..."
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  icon={Tag}
                />

                <Input 
                   label={t('form.desc')}
                   placeholder="Détails du produit ou service..."
                   value={formData.description}
                   onChange={(e) => handleInputChange('description', e.target.value)}
                   error={errors.description}
                   icon={Info}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <Input 
                    type="number"
                    label={t('products.table.price')}
                    placeholder="0.000"
                    step="0.001"
                    value={formData.priceHT}
                    onChange={(e) => handleInputChange('priceHT', e.target.value)}
                    error={errors.priceHT}
                    icon={DollarSign}
                    required
                  />
                  <Select 
                    label={t('products.table.tva')}
                    value={formData.tvaRate}
                    onChange={(e) => handleInputChange('tvaRate', e.target.value)}
                    options={[
                      { value: 19, label: '19% (Standard)' },
                      { value: 13, label: '13% (Spécial)' },
                      { value: 7, label: '7% (Réduit)' },
                      { value: 0, label: '0% (Exonéré)' }
                    ]}
                  />
                </div>

                {submitError && (
                  <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 text-[11px] font-black uppercase tracking-widest animate-in slide-in-from-top-2">
                    <AlertCircle className="w-5 h-5" />
                    {submitError}
                  </div>
                )}

                <div className="pt-6 flex gap-4">
                  <Button type="button" variant="ghost" onClick={closeModal} className="flex-1 !rounded-2xl">
                    {t('form.cancel')}
                  </Button>
                  <Button 
                    type="submit" 
                    variant="primary" 
                    loading={isSubmitting}
                    className="flex-1 !rounded-2xl shadow-xl shadow-indigo-100"
                    icon={CheckCircle}
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

export default Products;
