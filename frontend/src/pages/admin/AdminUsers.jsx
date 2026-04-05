import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { 
  Users, 
  Search, 
  Filter, 
  MoreVertical, 
  CheckCircle2, 
  XCircle, 
  Mail, 
  Building2, 
  Calendar,
  Loader2,
  AlertCircle
} from 'lucide-react';

const AdminUsers = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await api.get('/admin/companies', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCompanies(res.data);
    } catch (err) {
      setError('Erreur lors du chargement des entreprises.');
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    try {
      const newStatus = currentStatus === 'ACTIVE' ? 'CANCELLED' : 'ACTIVE';
      const token = localStorage.getItem('adminToken');
      await api.put(`/admin/companies/${id}/status`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchCompanies(); // Recharger la liste
    } catch (err) {
      alert('Erreur lors du changement de statut.');
    }
  };

  const filteredCompanies = companies.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    c.matriculeFiscal.includes(search)
  );

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <Loader2 className="w-8 h-8 text-premium-600 animate-spin" />
    </div>
  );

  if (error) return (
    <div className="bg-red-50 border border-red-100 p-6 rounded-3xl flex items-center gap-4 text-red-600">
      <AlertCircle className="w-6 h-6" />
      <p className="font-bold">{error}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      
      {/* Filters & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm">
        <div className="relative w-full sm:w-96 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 group-focus-within:text-premium-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Rechercher par nom, email, MF..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-2.5 ps-11 pe-4 text-sm focus:ring-4 focus:ring-premium-500/10 focus:border-premium-500 outline-none transition-all"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 text-slate-600 rounded-xl text-xs font-bold border border-slate-100 hover:bg-slate-100 transition-all">
          <Filter className="w-4 h-4" />
          Filtres Avancés
        </button>
      </div>

      {/* Grid Companies */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredCompanies.map((company) => (
          <div key={company.id} className="bg-white rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-all overflow-hidden group">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-premium-50 flex items-center justify-center text-premium-600 font-black shadow-inner">
                    {company.logo ? (
                      <img src={`${import.meta.env.VITE_API_URL}/uploads/${company.logo}`} alt="" className="w-full h-full object-cover rounded-2xl" />
                    ) : (
                      company.name.charAt(0)
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 line-clamp-1">{company.name}</h4>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      <Building2 className="w-3 h-3" />
                      MF: {company.matriculeFiscal}
                    </div>
                  </div>
                </div>
                <div className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                  company.subscription?.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                }`}>
                  {company.subscription?.status || 'Inactif'}
                </div>
              </div>

              <div className="space-y-3 py-4 border-y border-slate-50">
                <div className="flex items-center gap-3 text-xs text-slate-600 font-medium">
                  <Mail className="w-4 h-4 text-slate-400" />
                  {company.email}
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-600 font-medium">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  Inscrit le {new Date(company.createdAt).toLocaleDateString('fr-TN')}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 mb-4">
                <div className="bg-slate-50 p-3 rounded-2xl text-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase">Factures</p>
                  <p className="text-lg font-black text-slate-900">{company._count.invoices}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl text-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase">Clients</p>
                  <p className="text-lg font-black text-slate-900">{company._count.clients}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => toggleStatus(company.id, company.subscription?.status)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black transition-all ${
                    company.subscription?.status === 'ACTIVE' 
                      ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                      : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                  }`}
                >
                  {company.subscription?.status === 'ACTIVE' ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                  {company.subscription?.status === 'ACTIVE' ? 'Désactiver' : 'Activer'}
                </button>
                <button className="p-2.5 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-100 hover:text-slate-600 transition-all">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};

export default AdminUsers;
