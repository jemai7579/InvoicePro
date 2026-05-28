import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, Edit2, FileText, Loader, Mail, MapPin, Plus, Search, Trash2, Upload, User, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import { getClientNumber } from '../utils/businessNumbers';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const columns = ['Nom', 'Email', 'Téléphone', 'Société', 'Matricule Fiscal', 'RNE', 'Adresse', 'Ville', 'Notes'];

const normalizeCell = (value) => {
  const text = String(value ?? '').trim();
  return text || 'vide';
};

const parseCsv = (content) => {
  const lines = content.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) return [];
  const separator = lines[0].includes(';') ? ';' : ',';
  const headers = lines[0].split(separator).map((header) => header.trim());

  return lines.slice(1).map((line) => {
    const values = line.split(separator);
    return headers.reduce((row, header, index) => {
      row[header] = normalizeCell(values[index]);
      return row;
    }, {});
  });
};

const rowsFromWorksheet = (worksheet, XLSX) => {
  const jsonRows = XLSX.utils.sheet_to_json(worksheet, { defval: 'vide' });
  return jsonRows.map((row) => {
    const normalized = {};
    columns.forEach((column) => {
      normalized[column] = normalizeCell(row[column]);
    });
    return normalized;
  });
};

const toApiRow = (row) => ({
  name: row.Nom,
  email: row.Email === 'vide' ? '' : row.Email,
  phone: row['Téléphone'],
  companyName: row['Société'],
  matriculeFiscal: row['Matricule Fiscal'],
  rne: row.RNE,
  address: row.Adresse,
  city: row.Ville,
  notes: row.Notes,
});

const Clients = () => {
  const fileInputRef = useRef(null);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState(null);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [previewRows, setPreviewRows] = useState([]);
  const [importWarnings, setImportWarnings] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    matriculeFiscal: '',
    rne: '',
    notes: '',
  });

  const showToast = useCallback((type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/clients');
      setClients(res.data || []);
    } catch (error) {
      showToast('error', error.response?.data?.message || 'Impossible de charger les clients.');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const filteredClients = useMemo(() => (
    clients.filter((client) =>
      [client.name, client.email, client.matriculeFiscal, client.rne]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  ), [clients, searchTerm]);

  const resetForm = () => {
    setEditingId(null);
    setErrors({});
    setFormData({ name: '', email: '', phone: '', address: '', city: '', matriculeFiscal: '', rne: '', notes: '' });
  };

  const validateClientForm = () => {
    const nextErrors = {};
    if (!formData.name.trim()) nextErrors.name = 'Le nom est requis.';
    if (formData.email && !emailRegex.test(formData.email)) nextErrors.email = 'Email invalide.';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const saveClient = async (event) => {
    event.preventDefault();
    if (!validateClientForm()) return;

    setIsSubmitting(true);
    try {
      if (editingId) {
        await api.put(`/clients/${editingId}`, formData);
      } else {
        await api.post('/clients', formData);
      }
      setShowModal(false);
      resetForm();
      await fetchClients();
      showToast('success', editingId ? 'Client modifié.' : 'Client créé manuellement.');
    } catch (error) {
      showToast('error', error.response?.data?.message || 'Erreur lors de l’enregistrement.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const editClient = (client) => {
    setEditingId(client.id);
    setFormData({
      name: client.name || '',
      email: client.email || '',
      phone: client.phone || '',
      address: client.address || '',
      city: client.city || '',
      matriculeFiscal: client.matriculeFiscal || '',
      rne: client.rne || '',
      notes: client.notes || '',
    });
    setShowModal(true);
  };

  const deleteClient = async () => {
    try {
      await api.delete(`/clients/${pendingDeleteId}`);
      setPendingDeleteId(null);
      fetchClients();
    } catch (error) {
      showToast('error', error.response?.data?.message || 'Suppression impossible.');
    }
  };

  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!/\.(csv|xlsx|xls)$/i.test(file.name)) {
      showToast('error', 'Format accepté: .xlsx, .xls ou .csv.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showToast('error', 'Fichier d’import trop volumineux (2 Mo max).');
      return;
    }

    let parsed = [];
    if (/\.csv$/i.test(file.name)) {
      const content = await file.text();
      parsed = parseCsv(content).map((row) => {
        const normalized = {};
        columns.forEach((column) => {
          normalized[column] = normalizeCell(row[column]);
        });
        return normalized;
      });
    } else {
      // TODO: replace xlsx with a maintained parser; keep this bounded and user-triggered meanwhile.
      const XLSX = await import('xlsx');
      const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      parsed = rowsFromWorksheet(firstSheet, XLSX);
    }
    if (parsed.length > 500) {
      showToast('error', 'Maximum 500 clients par import.');
      return;
    }

    const warnings = [];
    parsed.forEach((row, index) => {
      if (row.Nom === 'vide') warnings.push({ row: index + 1, message: 'Nom manquant.' });
      if (row.Email !== 'vide' && !emailRegex.test(row.Email)) warnings.push({ row: index + 1, message: 'Email invalide.' });
    });

    setPreviewRows(parsed);
    setImportWarnings(warnings);
  };

  const importClients = async () => {
    try {
      const validRows = previewRows
        .filter((row) => row.Nom !== 'vide')
        .filter((row) => row.Email === 'vide' || emailRegex.test(row.Email))
        .map(toApiRow);

      const res = await api.post('/clients/import', { rows: validRows });
      showToast('success', `${res.data.imported} clients importés. Aucune invitation n’a été envoyée.`);
      setShowImport(false);
      setPreviewRows([]);
      setImportWarnings([]);
      fetchClients();
    } catch (error) {
      showToast('error', error.response?.data?.message || 'Import impossible.');
    }
  };

  return (
    <div className="pb-20 animate-in fade-in duration-500 space-y-6">
      {toast && (
        <div className={`fixed left-3 right-3 top-16 z-[100] flex items-center gap-3 rounded-2xl border px-4 py-3 shadow-2xl sm:left-auto sm:right-6 sm:top-20 sm:max-w-sm sm:px-5 sm:py-4 ${
          toast.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <p className="text-sm font-semibold">{toast.message}</p>
        </div>
      )}

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h2 className="text-2xl font-black text-slate-900 font-display tracking-tight uppercase">Clients</h2>
          <p className="text-sm text-slate-500 font-medium max-w-3xl">
            Ajoutez vos clients manuellement ou importez une liste depuis Excel. Ces clients sont utilisés pour préparer vos devis, offres, factures et documents commerciaux.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <Button variant="secondary" onClick={() => setShowImport(true)} icon={Upload} className="w-full sm:w-auto">
            Importer depuis Excel
          </Button>
          <Button onClick={() => { resetForm(); setShowModal(true); }} icon={Plus} className="w-full sm:w-auto">
            Ajouter un client manuellement
          </Button>
        </div>
      </div>

      <Card>
        <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
          <p className="text-sm text-slate-600">
            Un client est une fiche que vous ajoutez manuellement ou via Excel pour préparer vos devis, offres et factures.
            Un partenaire réseau est une société ou un utilisateur inscrit sur la plateforme. Vous l’invitez par email via une invitation interne.
          </p>
          <Link to="/network" className="text-sm font-black text-premium-600 hover:text-premium-700">
            Vous voulez collaborer avec une société inscrite ? Aller au Réseau professionnel.
          </Link>
        </div>
      </Card>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher un client..."
            className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium text-sm"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>
        <div className="px-6 py-3 bg-indigo-50/50 rounded-2xl border border-indigo-100/30 flex items-center justify-center">
          <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{filteredClients.length} résultats</span>
        </div>
      </div>

      <Card noPadding className="overflow-hidden">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Nom</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Email</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">MF / RNE</th>
                <th className="px-8 py-4 text-end text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan="4" className="py-20 text-center"><Loader className="w-8 h-8 animate-spin text-indigo-600 inline" /></td></tr>
              ) : filteredClients.length === 0 ? (
                <tr><td colSpan="4" className="py-20 text-center text-slate-400 italic text-sm">Aucun client trouvé.</td></tr>
              ) : filteredClients.map((client) => (
                <tr key={client.id} className="hover:bg-slate-50/30 group">
                  <td className="px-8 py-5">
                    <div className="font-bold text-slate-900">{client.name}</div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{getClientNumber(client)}</div>
                  </td>
                  <td className="px-8 py-5 text-sm font-medium text-slate-500">{client.email || '--'}</td>
                  <td className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase">{client.matriculeFiscal || '--'} / {client.rne || '--'}</td>
                  <td className="px-8 py-5 text-end">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => editClient(client)} className="p-2 text-slate-400 hover:text-indigo-600"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => setPendingDeleteId(client.id)} className="p-2 text-slate-400 hover:text-rose-600"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="md:hidden p-4 space-y-4">
          {!loading && filteredClients.map((client) => (
            <div key={client.id} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm min-[375px]:p-5">
              <h4 className="text-base font-black text-slate-900">{client.name}</h4>
              <p className="text-xs text-slate-500">{client.email || '--'}</p>
              <div className="mt-4 flex gap-2">
                <button onClick={() => editClient(client)} className="p-3 bg-slate-50 rounded-2xl text-slate-400"><Edit2 className="w-4 h-4" /></button>
                <button onClick={() => setPendingDeleteId(client.id)} className="p-3 bg-slate-50 rounded-2xl text-slate-400"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {pendingDeleteId && (
        <div className="fixed inset-0 z-[90] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="max-w-sm w-full" title="Supprimer le client ?">
            <p className="text-sm text-slate-500 mb-6">Cette action supprime uniquement la fiche client locale.</p>
            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => setPendingDeleteId(null)} className="flex-1">Annuler</Button>
              <Button onClick={deleteClient} className="flex-1">Confirmer</Button>
            </div>
          </Card>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-2 backdrop-blur-sm sm:p-4">
          <Card className="flex max-h-[calc(100dvh-1rem)] w-full max-w-2xl flex-col overflow-hidden" noPadding title={editingId ? 'Modifier le client' : 'Nouveau client'} action={<button onClick={() => setShowModal(false)}><X className="w-5 h-5" /></button>}>
            <form onSubmit={saveClient} className="min-h-0 space-y-4 overflow-y-auto p-4 sm:space-y-5 sm:p-8">
              <Input label="Nom de l'entreprise/du client" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} error={errors.name} icon={User} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Input type="email" label="Email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} error={errors.email} icon={Mail} />
                <Input label="Téléphone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <Input label="Matricule Fiscal" value={formData.matriculeFiscal} onChange={(e) => setFormData({ ...formData, matriculeFiscal: e.target.value })} icon={FileText} />
                  <p className="mt-1.5 ps-1 text-[10px] font-bold text-slate-400">Requis pour le workflow TEIF/TTN.</p>
                </div>
                <Input label="RNE" value={formData.rne} onChange={(e) => setFormData({ ...formData, rne: e.target.value })} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Input label="Adresse" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} icon={MapPin} />
                <Input label="Ville" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} />
              </div>
              <textarea rows="3" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Notes" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-premium-500 focus:bg-white" />
              <div className="flex flex-col-reverse gap-3 pt-3 min-[375px]:flex-row sm:gap-4 sm:pt-4">
                <Button type="button" variant="ghost" onClick={() => setShowModal(false)} className="flex-1">Annuler</Button>
                <Button type="submit" loading={isSubmitting} className="flex-1">Enregistrer</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {showImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-2 backdrop-blur-sm sm:p-4">
          <Card className="w-full max-w-5xl max-h-[90vh] overflow-y-auto" title="Importer des clients depuis Excel" action={<button onClick={() => setShowImport(false)}><X className="w-5 h-5" /></button>}>
            <div className="space-y-5">
              <p className="text-sm text-slate-600">Colonnes attendues: {columns.join(', ')}. Les cellules texte vides seront remplacées par “vide”. L’import ne crée aucune invitation interne.</p>
              <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} className="hidden" />
              <Button variant="secondary" icon={Upload} onClick={() => fileInputRef.current?.click()}>Choisir un fichier</Button>
              {importWarnings.length > 0 && (
                <div className="rounded-2xl bg-amber-50 border border-amber-100 p-4 space-y-2">
                  {importWarnings.map((warning, index) => <div key={index} className="text-sm text-amber-800">Ligne {warning.row || '-'}: {warning.message}</div>)}
                </div>
              )}
              {previewRows.length > 0 && (
                <>
                  <div className="touch-scroll overflow-x-auto rounded-2xl border border-slate-100">
                    <table className="min-w-[42rem] text-left text-sm">
                      <thead className="bg-slate-50">
                        <tr>{columns.map((column) => <th key={column} className="px-4 py-3 text-[10px] uppercase tracking-widest text-slate-400">{column}</th>)}</tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {previewRows.slice(0, 20).map((row, index) => (
                          <tr key={index}>{columns.map((column) => <td key={column} className="px-4 py-3">{row[column]}</td>)}</tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                    <Badge variant="neutral">{previewRows.length} lignes en prévisualisation</Badge>
                    <Button onClick={importClients}>Importer les lignes valides</Button>
                  </div>
                </>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Clients;
