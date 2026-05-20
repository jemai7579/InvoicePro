import React, { useEffect, useState } from 'react';
import { Loader2, Mail, MessageSquare, Search, ShieldCheck, UserCog, X } from 'lucide-react';
import api from '../../services/api';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';

const roleVariant = (role) => {
  if (role === 'Platform admin') return 'success';
  if (role === 'Company owner') return 'primary';
  return 'secondary';
};

const statusVariant = (status) => (status === 'Active' ? 'success' : 'rejected');

const NotesModal = ({ user, onClose, onSaved }) => {
  const [notes, setNotes] = useState(user.notes || []);
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!content.trim()) return;
    setSaving(true);
    try {
      await api.post(`/admin/users/${user.id}/notes`, { content });
      const res = await api.get('/admin/users');
      const refreshed = (res.data || []).find((entry) => entry.id === user.id && entry.userType === user.userType);
      setNotes(refreshed?.notes || []);
      setContent('');
      onSaved();
    } catch (error) {
      console.error('Unable to save note', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl rounded-[2.5rem] bg-white shadow-2xl">
        <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black text-slate-900">Notes admin</h3>
            <p className="text-sm text-slate-500 font-medium">{user.name}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-8 space-y-5">
          <div className="space-y-3 max-h-72 overflow-y-auto">
            {notes.length > 0 ? notes.map((note) => (
              <div key={note.id} className="rounded-2xl bg-slate-50 border border-slate-100 px-4 py-3">
                <div className="font-bold text-slate-900">{note.authorName}</div>
                <div className="text-[11px] text-slate-400">{new Date(note.createdAt).toLocaleString()}</div>
                <div className="text-sm text-slate-700 mt-2">{note.content}</div>
              </div>
            )) : <div className="text-sm text-slate-400">Aucune note interne.</div>}
          </div>
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            className="w-full min-h-[120px] rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-premium-100"
            placeholder="Ajouter une note interne..."
          />
          <Button onClick={save} icon={MessageSquare} isLoading={saving}>Enregistrer</Button>
        </div>
      </div>
    </div>
  );
};

const AdminUsers = () => {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);

  const load = async () => {
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data || []);
    } catch (error) {
      console.error('Unable to fetch users', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = users.filter((user) =>
    `${user.name} ${user.email} ${user.company} ${user.role}`.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {selectedUser ? <NotesModal user={selectedUser} onClose={() => setSelectedUser(null)} onSaved={load} /> : null}

      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Utilisateurs</h2>
          <p className="text-sm text-slate-500 font-medium">
            Gere les admins plateforme et les comptes proprietaires rattaches aux entreprises.
          </p>
        </div>
        <div className="relative w-full xl:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Nom, email, role..."
            className="w-full rounded-2xl border border-slate-100 bg-white px-11 py-3 text-sm outline-none focus:ring-4 focus:ring-premium-100"
          />
        </div>
      </div>

      {loading ? (
        <div className="py-24 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-premium-600" /></div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card><div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total</div><div className="mt-2 text-2xl font-black text-slate-900">{users.length}</div></Card>
            <Card><div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Admins plateforme</div><div className="mt-2 text-2xl font-black text-emerald-600">{users.filter((user) => user.role === 'Platform admin').length}</div></Card>
            <Card><div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Owners entreprise</div><div className="mt-2 text-2xl font-black text-premium-600">{users.filter((user) => user.role === 'Company owner').length}</div></Card>
            <Card><div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Bloques</div><div className="mt-2 text-2xl font-black text-rose-600">{users.filter((user) => user.status !== 'Active').length}</div></Card>
          </div>

          <Card title="Modele de comptes actuel" subtitle="Gestion multi-utilisateurs avancee a finaliser">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
              <div className="rounded-2xl bg-slate-50 border border-slate-100 px-4 py-4">
                <strong>Modele courant:</strong> compte entreprise / proprietaire.
              </div>
              <div className="rounded-2xl bg-slate-50 border border-slate-100 px-4 py-4">
                <strong>Roles avances:</strong> planifies / partiels.
              </div>
              <div className="rounded-2xl bg-slate-50 border border-slate-100 px-4 py-4">
                <strong>Guards existants:</strong> signature, TTN, parametres sensibles.
              </div>
              <div className="rounded-2xl bg-slate-50 border border-slate-100 px-4 py-4">
                <strong>Futurs roles:</strong> owner, admin, accountant, viewer, signer.
              </div>
            </div>
          </Card>

          <Card noPadding className="overflow-hidden">
            <div className="hidden xl:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50/60 border-b border-slate-100">
                  <tr>
                    {['Nom', 'Email', 'Role', 'Entreprise', 'Statut', 'Derniere connexion', 'Creation', 'Actions'].map((label) => (
                      <th key={label} className="px-5 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map((user) => (
                    <tr key={`${user.userType}-${user.id}`} className="hover:bg-slate-50/40">
                      <td className="px-5 py-4"><div className="font-black text-slate-900">{user.name}</div></td>
                      <td className="px-5 py-4 text-sm text-slate-600">{user.email}</td>
                      <td className="px-5 py-4"><Badge variant={roleVariant(user.role)}>{user.role}</Badge></td>
                      <td className="px-5 py-4 text-sm text-slate-600">{user.company}</td>
                      <td className="px-5 py-4"><Badge variant={statusVariant(user.status)}>{user.status}</Badge></td>
                      <td className="px-5 py-4 text-sm text-slate-600">{new Date(user.lastLogin).toLocaleString()}</td>
                      <td className="px-5 py-4 text-sm text-slate-600">{new Date(user.createdAt).toLocaleDateString()}</td>
                      <td className="px-5 py-4">
                        <div className="flex gap-2">
                          <button onClick={() => setSelectedUser(user)} className="p-2 rounded-xl bg-slate-50 text-slate-500 hover:text-premium-600" title="Notes internes">
                            <MessageSquare className="w-4 h-4" />
                          </button>
                          <button className="p-2 rounded-xl bg-slate-50 text-slate-500 hover:text-emerald-600" title="Envoyer un email">
                            <Mail className="w-4 h-4" />
                          </button>
                          <button className="p-2 rounded-xl bg-slate-50 text-slate-500 hover:text-amber-600" title="Gerer le role">
                            <UserCog className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="xl:hidden p-4 space-y-4">
              {filtered.map((user) => (
                <div key={`${user.userType}-${user.id}`} className="rounded-[2rem] border border-slate-100 bg-white p-5 shadow-sm space-y-4">
                  <div className="flex justify-between gap-3">
                    <div>
                      <div className="text-lg font-black text-slate-900">{user.name}</div>
                      <div className="text-sm text-slate-500">{user.email}</div>
                    </div>
                    <Badge variant={roleVariant(user.role)}>{user.role}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-2xl bg-slate-50 px-4 py-3"><strong>Entreprise:</strong> {user.company}</div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-3"><strong>Statut:</strong> {user.status}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <button onClick={() => setSelectedUser(user)} className="p-3 rounded-2xl bg-slate-50 text-premium-600"><MessageSquare className="w-4 h-4 mx-auto" /></button>
                    <button className="p-3 rounded-2xl bg-slate-50 text-emerald-600"><Mail className="w-4 h-4 mx-auto" /></button>
                    <button className="p-3 rounded-2xl bg-slate-50 text-amber-600"><UserCog className="w-4 h-4 mx-auto" /></button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
};

export default AdminUsers;
