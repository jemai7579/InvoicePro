import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Save, Loader } from 'lucide-react';
import api from '../services/api';

const Settings = () => {
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState(null);

  // Password change state
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isChangingPwd, setIsChangingPwd] = useState(false);
  const [pwdMsg, setPwdMsg] = useState(null);
  
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
        alert('Failed to load company settings');
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveMsg(null);
    try {
      await api.put('/settings', formData);
      setSaveMsg({ type: 'success', text: 'Paramètres mis à jour avec succès.' });
    } catch (error) {
      console.error('Error saving settings', error);
      setSaveMsg({ type: 'error', text: 'Impossible de mettre à jour les paramètres.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwdMsg(null);
    if (newPassword.length < 6) {
      return setPwdMsg({ type: 'error', text: 'Le mot de passe doit contenir au moins 6 caractères.' });
    }
    if (newPassword !== confirmNewPassword) {
      return setPwdMsg({ type: 'error', text: 'Les mots de passe ne correspondent pas.' });
    }
    setIsChangingPwd(true);
    try {
      await api.put('/settings', { newPassword });
      setPwdMsg({ type: 'success', text: 'Mot de passe modifié avec succès.' });
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (error) {
      console.error('Error changing password', error);
      setPwdMsg({ type: 'error', text: error.response?.data?.message || 'Erreur lors du changement de mot de passe.' });
    } finally {
      setIsChangingPwd(false);
    }
  };

  const handleCertificateUpload = async (e) => {
    e.preventDefault();
    if (!certFile || !certPassword) {
      return alert('Please select a .p12 file and enter its password');
    }

    setIsUploadingCert(true);
    const certFormData = new FormData();
    certFormData.append('certificate', certFile);
    certFormData.append('password', certPassword);

    try {
      await api.post('/settings/certificate', certFormData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      alert('Certificate uploaded and securely saved!');
      setCertFile(null);
      setCertPassword('');
    } catch (error) {
      console.error('Error uploading certificate', error);
      alert(error.response?.data?.message || 'Failed to upload certificate');
    } finally {
      setIsUploadingCert(false);
    }
  };

  const [logoFile, setLogoFile] = useState(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  const handleLogoUpload = async (e) => {
    e.preventDefault();
    if (!logoFile) return alert('Please select an image file first.');

    setIsUploadingLogo(true);
    const formDataObj = new FormData();
    formDataObj.append('logo', logoFile);

    try {
      const resp = await api.post('/settings/logo', formDataObj, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      alert('Logo uploaded successfully!');
      setFormData(prev => ({ ...prev, logo: resp.data.logo }));
      setLogoFile(null);
    } catch (error) {
       console.error('Error uploading logo', error);
       alert(error.response?.data?.message || 'Failed to upload logo');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Paramètres de l'entreprise</h1>
        <p className="text-sm text-gray-500">Gérer les détails de votre entreprise pour les factures et la génération XML TEIF.</p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <>
          <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden max-w-4xl">
            <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-8">
              
              {/* General Info */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 border-b pb-2 mb-4">Informations Générales</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom de l'entreprise *</label>
                    <input
                      type="text"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Adresse Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      disabled
                      className="w-full px-4 py-2 border border-gray-200 bg-gray-50 rounded-lg text-sm text-gray-500 outline-none cursor-not-allowed"
                    />
                    <p className="mt-1 text-xs text-gray-400">L'email de connexion ne peut pas être modifié ici.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Matricule Fiscal *</label>
                    <input
                      type="text"
                      name="matriculeFiscal"
                      required
                      value={formData.matriculeFiscal}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Registre du Commerce</label>
                    <input
                      type="text"
                      name="registreCommerce"
                      value={formData.registreCommerce}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Numéro de Téléphone</label>
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">RIB Bancaire</label>
                    <input
                      type="text"
                      name="rib"
                      value={formData.rib}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Address */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 border-b pb-2 mb-4">Localisation et Adresse</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Adresse *</label>
                    <input
                      type="text"
                      name="address"
                      required
                      value={formData.address}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ville</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Code Postal</label>
                    <input
                      type="text"
                      name="zipCode"
                      value={formData.zipCode}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pays</label>
                    <input
                      type="text"
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>
              </div>

                {saveMsg && (
                  <div className={`mt-4 text-sm text-center px-4 py-2 rounded-lg ${
                    saveMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
                  }`}>{saveMsg.text}</div>
                )}
              <div className="pt-4 border-t border-gray-200 flex justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:bg-blue-400"
                >
                  {isSaving ? <Loader className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  Enregistrer les Paramètres
                </button>
              </div>
              
            </form>
          </div>

          {/* Password Change Section */}
          <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden max-w-4xl mt-8">
            <form onSubmit={handlePasswordChange} className="p-6 md:p-8 space-y-6">
              <h3 className="text-lg font-medium text-gray-900 border-b pb-2 mb-4">Changer le mot de passe</h3>
              {pwdMsg && (
                <div className={`text-sm px-4 py-2 rounded-lg ${
                  pwdMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
                }`}>{pwdMsg.text}</div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nouveau mot de passe *</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min. 6 caractères"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirmer le mot de passe *</label>
                  <input
                    type="password"
                    required
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`w-full px-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${
                      confirmNewPassword && newPassword !== confirmNewPassword ? 'border-red-400 bg-red-50' : 'border-gray-300'
                    }`}
                  />
                  {confirmNewPassword && newPassword !== confirmNewPassword && (
                    <p className="mt-1 text-xs text-red-500">Les mots de passe ne correspondent pas.</p>
                  )}
                </div>
              </div>
              <div className="pt-4 border-t border-gray-200 flex justify-end">
                <button
                  type="submit"
                  disabled={isChangingPwd}
                  className="inline-flex items-center px-6 py-2.5 bg-gray-800 text-white text-sm font-medium rounded-lg shadow-sm hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-700 transition-colors disabled:bg-gray-400"
                >
                  {isChangingPwd ? <Loader className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  Changer le mot de passe
                </button>
              </div>
            </form>
          </div>

          {/* Logo Upload Section */}
          <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden max-w-4xl mt-8">
            <form onSubmit={handleLogoUpload} className="p-6 md:p-8 space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 border-b pb-2 mb-4">Logo de l'entreprise</h3>
                <p className="text-sm text-gray-500 mb-6">
                  Téléchargez le logo de votre entreprise pour l'afficher sur vos factures et devis.
                </p>
                <div className="flex items-center space-x-6">
                  {formData.logo ? (
                    <div className="w-24 h-24 border rounded-lg overflow-hidden flex items-center justify-center bg-gray-50">
                      <img src={`http://localhost:5000${formData.logo}`} alt="Logo" className="object-contain max-h-full" />
                    </div>
                  ) : (
                    <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 text-gray-400 text-xs text-center p-2">
                      Aucun logo téléchargé
                    </div>
                  )}
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      required
                      onChange={(e) => setLogoFile(e.target.files[0])}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    {logoFile && <p className="mt-2 text-xs text-green-600">Selected: {logoFile.name}</p>}
                  </div>
                </div>
              </div>
              <div className="pt-4 border-t border-gray-200 flex justify-end">
                <button
                  type="submit"
                  disabled={isUploadingLogo || !logoFile}
                  className="inline-flex items-center px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:bg-blue-400"
                >
                  {isUploadingLogo ? <Loader className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  Télécharger le Logo
                </button>
              </div>
            </form>
          </div>

          {/* Certificate Upload Section */}
          <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden max-w-4xl mt-8">
            <form onSubmit={handleCertificateUpload} className="p-6 md:p-8 space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 border-b pb-2 mb-4">Signature Électronique (TEIF)</h3>
                
                <p className="text-sm text-gray-500 mb-6">
                  Un certificat électronique valide est requis pour signer et soumettre vos factures au système TTN.
                </p>

                {/* TunTrust Account Notice */}
                <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-0.5">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-amber-800 mb-1">Compte TunTrust requis</h4>
                      <p className="text-sm text-amber-700 mb-4">
                        Pour obtenir votre certificat électronique <strong>.p12</strong>, vous devez d'abord créer un compte sur le portail officiel <strong>TunTrust</strong>. Sans ce certificat, vous ne pouvez pas signer vos factures électroniques.
                      </p>
                      <div className="flex flex-wrap gap-3">
                        <a
                          href="https://www.tuntrust.tn"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg shadow-sm hover:bg-amber-700 transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          Accéder au portail TunTrust
                        </a>
                        <a
                          href="https://www.tuntrust.tn/index.php/fr/demande-de-certificat"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-4 py-2 bg-white border border-amber-400 text-amber-700 text-sm font-medium rounded-lg shadow-sm hover:bg-amber-50 transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          Demander un certificat
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Signature Type Selection */}
                <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border border-blue-200 bg-blue-50 rounded-lg p-4 cursor-pointer hover:bg-blue-100 transition">
                    <div className="flex items-center">
                      <input type="radio" name="signatureType" value="tuntrust" className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500" defaultChecked />
                      <label className="ml-3 block text-sm font-medium text-gray-700">TunTrust (Certificat P12)</label>
                    </div>
                  </div>
                  <div className="border border-gray-200 bg-gray-50 rounded-lg p-4 opacity-70">
                    <div className="flex items-center">
                      <input type="radio" name="signatureType" value="ehouwiya" className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500" disabled />
                      <label className="ml-3 block text-sm font-medium text-gray-700">E-Houwiya (Bientôt disponible)</label>
                    </div>
                  </div>
                </div>

                {/* Certificate Upload Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fichier Certificat (.p12) *</label>
                    <input
                      type="file"
                      accept=".p12,.pfx"
                      required
                      onChange={(e) => setCertFile(e.target.files[0])}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    {certFile && (
                      <p className="mt-2 text-xs text-green-600">Sélectionné : {certFile.name}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe du certificat *</label>
                    <input
                      type="password"
                      required
                      value={certPassword}
                      onChange={(e) => setCertPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200 flex justify-end">
                <button
                  type="submit"
                  disabled={isUploadingCert}
                  className="inline-flex items-center px-6 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors disabled:bg-green-400"
                >
                  {isUploadingCert ? <Loader className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  Télécharger le Certificat
                </button>
              </div>
              
            </form>
          </div>
        </>
      )}
    </Layout>
  );
};

export default Settings;
