import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Download, Eye, FileText, FolderKanban, Loader, MessageSquare, Package, Paperclip, Search, Send, Upload, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { useLanguage } from '../context/LanguageContext';

const isExternalImage = (value = '') => /^https?:\/\//i.test(value) || value.startsWith('data:') || value.startsWith('blob:');

const ProductImage = ({ product, className = 'h-full w-full object-cover', placeholderClassName = 'h-5 w-5' }) => {
  const [localImage, setLocalImage] = useState({ productId: '', src: '' });
  const externalSrc = product?.imageUrl && isExternalImage(product.imageUrl) ? product.imageUrl : '';

  useEffect(() => {
    let active = true;
    let objectUrl = '';
    if (!product?.id || !product?.imageUrl || externalSrc) {
      return () => {};
    }
    api.get(`/products/${product.id}/image`, { responseType: 'blob' })
      .then((res) => {
        if (!active) return;
        objectUrl = URL.createObjectURL(res.data);
        setLocalImage({ productId: product.id, src: objectUrl });
      });

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [externalSrc, product?.id, product?.imageUrl]);

  const src = externalSrc || (localImage.productId === product?.id ? localImage.src : '');
  if (!src) return <Package className={placeholderClassName} />;
  return <img src={src} alt="" className={className} />;
};

const Messages = () => {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const isRtl = lang === 'ar';
  const [partners, setPartners] = useState([]);
  const [activePartner, setActivePartner] = useState(null);
  const [messages, setMessages] = useState([]);
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [showAttach, setShowAttach] = useState(false);
  const [products, setProducts] = useState([]);
  const [projects, setProjects] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [sharePicker, setSharePicker] = useState(null);
  const [shareSearch, setShareSearch] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  const showToast = useCallback((text) => {
    setToast(text);
    setTimeout(() => setToast(null), 3500);
  }, []);

  const fetchPartners = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/messages/conversations');
      setPartners(res.data || []);
      if (res.data?.length) {
        setActivePartner((current) => current || res.data[0]);
      }
    } catch (error) {
      showToast(error.response?.data?.message || 'Impossible de charger les conversations.');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const fetchMessages = useCallback(async (partner) => {
    if (!partner) return;
    try {
      const res = await api.get(`/messages/${partner.partnerCompanyId}`);
      setMessages(res.data || []);
    } catch (error) {
      showToast(error.response?.data?.message || 'Impossible de charger les messages.');
    }
  }, [showToast]);

  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]);

  useEffect(() => {
    Promise.all([
      api.get('/products').then((res) => setProducts(res.data || [])).catch(() => setProducts([])),
      api.get('/projects').then((res) => setProjects(res.data || [])).catch(() => setProjects([])),
    ]);
  }, []);

  useEffect(() => {
    fetchMessages(activePartner);
  }, [activePartner, fetchMessages]);

  const sendMessage = async (event) => {
    event.preventDefault();
    if (!activePartner || !body.trim()) return;
    try {
      await api.post('/messages', { partnerCompanyId: activePartner.partnerCompanyId, body });
      setBody('');
      fetchMessages(activePartner);
    } catch (error) {
      showToast(error.response?.data?.message || 'Message impossible.');
    }
  };

  const shareItem = async (attachmentType, objectId) => {
    if (!activePartner) return;
    try {
      await api.post('/messages', { partnerCompanyId: activePartner.partnerCompanyId, attachmentType, objectId, body });
      setBody('');
      setShowAttach(false);
      fetchMessages(activePartner);
    } catch (error) {
      showToast(error.response?.data?.message || 'Partage impossible.');
    }
  };

  const chooseFile = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      showToast('Fichier trop volumineux (10 Mo max).');
      return;
    }
    setSelectedFile(file);
  };

  const uploadFile = async () => {
    const file = selectedFile;
    if (!file || !activePartner) return;
    if (file.size > 10 * 1024 * 1024) {
      showToast('Fichier trop volumineux (10 Mo max).');
      return;
    }
    const formData = new FormData();
    formData.append('partnerCompanyId', activePartner.partnerCompanyId);
    formData.append('body', body || `Fichier partagé: ${file.name}`);
    formData.append('file', file);
    setUploading(true);
    try {
      await api.post('/messages/file', formData);
      setBody('');
      setShowAttach(false);
      setSelectedFile(null);
      fetchMessages(activePartner);
    } catch (error) {
      showToast(error.response?.data?.message || 'Upload impossible.');
    } finally {
      setUploading(false);
    }
  };

  const filteredProducts = useMemo(() => {
    const query = shareSearch.toLowerCase();
    return products.filter((product) =>
      [product.name, product.description, product.category].filter(Boolean).some((value) => value.toLowerCase().includes(query))
    );
  }, [products, shareSearch]);

  const filteredProjects = useMemo(() => {
    const query = shareSearch.toLowerCase();
    return projects.filter((project) =>
      [project.title, project.description, project.category, project.projectReference].filter(Boolean).some((value) => value.toLowerCase().includes(query))
    );
  }, [projects, shareSearch]);

  const fileSize = (size) => {
    if (!size) return '0 Ko';
    if (size > 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} Mo`;
    return `${Math.ceil(size / 1024)} Ko`;
  };

  const downloadAttachment = async (message) => {
    try {
      const response = await api.get(`/messages/attachments/${message.id}`, { responseType: 'blob' });
      const url = URL.createObjectURL(response.data);
      window.open(url, '_blank', 'noopener,noreferrer');
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    } catch {
      showToast('Ouverture du fichier impossible.');
    }
  };

  const renderAttachment = (message) => {
    const metadata = message.metadata || {};
    if (metadata.attachmentType === 'product') {
      const product = metadata.product || {};
      return (
        <div className="mt-2 rounded-2xl border border-white/20 bg-white/10 p-3 text-xs">
          <div className="flex items-center gap-3 font-black">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white/20">
              <ProductImage product={product} placeholderClassName="h-4 w-4" />
            </div>
            <span>{product.name}</span>
          </div>
          <div className="mt-1 opacity-80">{Number(product.priceHT || 0).toFixed(3)} TND HT · TVA {product.tvaRate ?? 19}% · {product.unit || 'unité'}</div>
          <div className="mt-1 opacity-80">{product.code || product.category || product.description || 'Produit partagé'}</div>
          <button type="button" onClick={() => navigate(`/products?highlight=${product.id}`)} className="mt-2 inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 font-black text-slate-800">
            <Eye className="h-3.5 w-3.5" /> Voir le produit
          </button>
        </div>
      );
    }
    if (metadata.attachmentType === 'project') {
      const project = metadata.project || {};
      return (
        <div className="mt-2 rounded-2xl border border-white/20 bg-white/10 p-3 text-xs">
          <div className="flex items-center gap-2 font-black"><FolderKanban className="h-4 w-4" />{project.title}</div>
          <div className="mt-1 opacity-80">{project.projectReference || project.category || 'Projet partagé'}</div>
          <div className="mt-1 line-clamp-2 opacity-80">{project.description || project.estimatedNeeds || 'Aucun détail'}</div>
          <button type="button" onClick={() => navigate(`/projects?highlight=${project.id}`)} className="mt-2 inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 font-black text-slate-800">
            <Eye className="h-3.5 w-3.5" /> Voir le projet
          </button>
        </div>
      );
    }
    if (metadata.attachmentType === 'file') {
      return (
        <div className="mt-2 rounded-2xl border border-white/20 bg-white/10 p-3 text-xs">
          <div className="flex items-center gap-2 font-black"><FileText className="h-4 w-4" />{metadata.fileName}</div>
          <div className="mt-1 opacity-80">{metadata.mimeType || 'Fichier'} · {fileSize(metadata.size)}</div>
          <button type="button" onClick={() => downloadAttachment(message)} className="mt-2 inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 font-black text-slate-800">
            <Download className="h-3.5 w-3.5" /> Ouvrir
          </button>
        </div>
      );
    }
    return null;
  };

  const pickerItems = sharePicker === 'product' ? filteredProducts : filteredProjects;

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="pb-20 animate-in fade-in duration-500 space-y-6">
      {toast && <div className="fixed top-20 right-6 z-[100] px-5 py-4 rounded-2xl shadow-2xl border bg-rose-50 border-rose-200 text-rose-800 text-sm font-semibold">{toast}</div>}

      <div>
        <h2 className="text-2xl font-black text-slate-900 font-display tracking-tight uppercase">Messages</h2>
        <p className="text-sm text-slate-500 font-medium">Chat entre partenaires connectés uniquement.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 min-h-[620px]">
        <Card title="Partenaires">
          {loading ? (
            <div className="py-10 text-center"><Loader className="w-8 h-8 animate-spin text-indigo-600 inline" /></div>
          ) : partners.length === 0 ? (
            <div className="text-sm text-slate-500">Aucun partenaire accepté. Invitez un partenaire depuis le Réseau professionnel.</div>
          ) : (
            <div className="space-y-2">
              {partners.map((partner) => (
                <button
                  key={partner.id}
                  type="button"
                  onClick={() => setActivePartner(partner)}
                  className={`w-full rounded-2xl p-4 text-left transition-colors ${activePartner?.id === partner.id ? 'bg-premium-600 text-white' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'}`}
                >
                  <div className="font-black">{partner.name}</div>
                  <div className={`text-xs ${activePartner?.id === partner.id ? 'text-white/80' : 'text-slate-500'}`}>{partner.email}</div>
                </button>
              ))}
            </div>
          )}
        </Card>

        <Card title={activePartner ? activePartner.name : 'Conversation'} subtitle="Les messages sont disponibles après acceptation de l’invitation interne.">
          {!activePartner ? (
            <div className="h-[480px] flex flex-col items-center justify-center text-slate-400">
              <MessageSquare className="w-10 h-10 mb-3" />
              <div className="text-sm">Sélectionnez un partenaire connecté.</div>
            </div>
          ) : (
            <div className="flex flex-col h-[520px]">
              <div className="flex-1 overflow-y-auto rounded-2xl bg-slate-50 p-4 space-y-3">
                {messages.length === 0 ? (
                  <div className="text-sm text-slate-500">Aucun message pour cette conversation.</div>
                ) : messages.map((message) => {
                  const own = message.senderCompanyId !== activePartner.partnerCompanyId;
                  return (
                    <div key={message.id} className={`flex ${own ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm ${own ? 'bg-premium-600 text-white' : 'bg-white text-slate-700 border border-slate-100'}`}>
                        {message.body}
                        {renderAttachment(message)}
                      </div>
                    </div>
                  );
                })}
              </div>
              <form onSubmit={sendMessage} className="mt-4 flex gap-3">
                <div className="relative">
                  <button type="button" onClick={() => setShowAttach((value) => !value)} className="h-full rounded-2xl border border-slate-200 bg-white px-4 text-slate-500 hover:text-premium-600">
                    <Paperclip className="h-5 w-5" />
                  </button>
                  {showAttach ? (
                    <div className={`absolute bottom-full z-30 mb-3 w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-slate-100 bg-white p-4 shadow-2xl ${isRtl ? 'right-0' : 'left-0'}`}>
                      <div className="mb-3 flex items-center justify-between">
                        <div className="text-xs font-black uppercase tracking-widest text-slate-500">Partager</div>
                        <button type="button" onClick={() => setShowAttach(false)}><X className="h-4 w-4 text-slate-400" /></button>
                      </div>
                      <label className="mb-3 flex cursor-pointer items-center gap-3 rounded-2xl bg-slate-50 p-3 text-sm font-bold text-slate-700 hover:bg-slate-100">
                        <FileText className="h-4 w-4 text-indigo-600" />
                        Fichier depuis votre appareil
                        <input type="file" className="hidden" onChange={chooseFile} accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.doc,.docx,.xlsx,.xls,.ppt,.pptx" />
                      </label>
                      {selectedFile ? (
                        <div className="mb-3 rounded-2xl border border-indigo-100 bg-indigo-50 p-3">
                          <div className="text-sm font-black text-slate-900">{selectedFile.name}</div>
                          <div className="text-xs font-semibold text-slate-500">{selectedFile.type || 'Fichier'} · {fileSize(selectedFile.size)}</div>
                          <div className="mt-3 flex gap-2">
                            <Button size="sm" type="button" onClick={uploadFile} loading={uploading} icon={Upload}>Envoyer</Button>
                            <Button size="sm" type="button" variant="ghost" onClick={() => setSelectedFile(null)}>Annuler</Button>
                          </div>
                        </div>
                      ) : null}
                      <button type="button" onClick={() => { setSharePicker('project'); setShareSearch(''); }} className="mb-3 flex w-full items-center gap-3 rounded-2xl bg-slate-50 p-3 text-start text-sm font-bold text-slate-700 hover:bg-slate-100">
                        <FolderKanban className="h-4 w-4 text-blue-600" />
                        Idée de projet / Projet
                      </button>
                      <button type="button" onClick={() => { setSharePicker('product'); setShareSearch(''); }} className="flex w-full items-center gap-3 rounded-2xl bg-slate-50 p-3 text-start text-sm font-bold text-slate-700 hover:bg-slate-100">
                        <Package className="h-4 w-4 text-emerald-600" />
                        Produit
                      </button>
                    </div>
                  ) : null}
                </div>
                <input
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                  placeholder="Écrire un message..."
                  className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-premium-500 focus:bg-white"
                />
                <Button type="submit" icon={Send}>Envoyer</Button>
              </form>
            </div>
          )}
        </Card>
      </div>

      {sharePicker ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm" onClick={(event) => { if (event.target === event.currentTarget) setSharePicker(null); }}>
          <Card
            className="w-full max-w-3xl"
            title={sharePicker === 'product' ? 'Partager un produit' : 'Partager un projet'}
            subtitle={sharePicker === 'product' ? 'Seuls vos produits peuvent être partagés avec un contact accepté.' : 'Seules vos idées de projet peuvent être partagées avec un contact accepté.'}
            action={<button type="button" onClick={() => setSharePicker(null)}><X className="h-5 w-5 text-slate-400" /></button>}
          >
            <div className="relative mb-4">
              <Search className="absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={shareSearch}
                onChange={(event) => setShareSearch(event.target.value)}
                placeholder="Rechercher..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pe-4 ps-11 text-sm font-medium outline-none focus:border-premium-500 focus:bg-white"
              />
            </div>
            <div className="max-h-[55vh] space-y-3 overflow-y-auto pr-1">
              {pickerItems.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-10 text-center text-sm font-medium text-slate-500">
                  Aucun élément disponible.
                </div>
              ) : null}
              {sharePicker === 'product' && pickerItems.map((product) => (
                <button key={product.id} type="button" onClick={() => { shareItem('product', product.id); setSharePicker(null); }} className="flex w-full items-start gap-4 rounded-2xl border border-slate-100 bg-white p-4 text-start hover:bg-slate-50">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-emerald-50 text-emerald-600">
                    <ProductImage product={product} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-black text-slate-900">{product.name}</div>
                    <div className="mt-1 text-xs font-semibold text-slate-500">{Number(product.priceHT || 0).toFixed(3)} TND HT · TVA {product.tvaRate ?? 19}%</div>
                    <div className="mt-1 line-clamp-2 text-xs text-slate-500">{product.description || product.category || 'Produit du catalogue'}</div>
                  </div>
                </button>
              ))}
              {sharePicker === 'project' && pickerItems.map((project) => (
                <button key={project.id} type="button" onClick={() => { shareItem('project', project.id); setSharePicker(null); }} className="flex w-full items-start gap-4 rounded-2xl border border-slate-100 bg-white p-4 text-start hover:bg-slate-50">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                    <FolderKanban className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-black text-slate-900">{project.title}</div>
                    <div className="mt-1 text-xs font-semibold text-slate-500">
                      {project.category || 'Projet'} · {project.optionalBudget ? `${Number(project.optionalBudget).toFixed(3)} TND` : 'Budget non précisé'} · {project.deadline ? new Date(project.deadline).toLocaleDateString() : 'Sans échéance'}
                    </div>
                    <div className="mt-1 line-clamp-2 text-xs text-slate-500">{project.description || project.estimatedNeeds || 'Aucun détail'}</div>
                  </div>
                </button>
              ))}
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
};

export default Messages;
