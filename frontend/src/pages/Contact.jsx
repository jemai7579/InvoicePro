import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Mail, MapPin, Phone, Send, ChevronLeft, CheckCircle2 } from 'lucide-react';

const Contact = () => {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-white font-sans">
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-xl">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-800">El Fatoura</span>
          </Link>
          <Link to="/" className="text-sm font-bold text-slate-500 hover:text-blue-600 flex items-center gap-1 transition-colors">
             <ChevronLeft className="w-4 h-4" /> Retour
          </Link>
        </div>
      </nav>

      <div className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">Contactez-nous</h1>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto font-medium">
              Une question sur la conformité TEIF ou sur nos tarifs ? Notre équipe est là pour vous accompagner.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Contact Info */}
            <div className="space-y-12">
              <div className="bg-blue-50 rounded-[2.5rem] p-10 border border-blue-100">
                <h2 className="text-2xl font-black text-slate-900 mb-8">Informations de contact</h2>
                <div className="space-y-8">
                  <div className="flex items-start gap-4">
                    <div className="bg-white p-3 rounded-2xl shadow-sm text-blue-600">
                      <Mail className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">Email</p>
                      <p className="text-slate-500 font-medium">contact@elfatoura.tn</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="bg-white p-3 rounded-2xl shadow-sm text-blue-600">
                      <Phone className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">Téléphone</p>
                      <p className="text-slate-500 font-medium">+216 71 000 000</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="bg-white p-3 rounded-2xl shadow-sm text-blue-600">
                      <MapPin className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">Adresse</p>
                      <p className="text-slate-500 font-medium">Avenue Habib Bourguiba, Tunis, Tunisie</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8">
                <h3 className="font-bold text-slate-900 mb-4 text-xl">Pourquoi nous choisir ?</h3>
                <ul className="space-y-4">
                  {[
                    "Support technique expert en Tunisie",
                    "Expertise en conformité TEIF & TTN",
                    "Déploiement rapide et accompagnement",
                    "Sécurité maximale de vos données"
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-slate-500 font-medium">
                      <CheckCircle2 className="w-5 h-5 text-blue-500" /> {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Form */}
            <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 p-8 md:p-12">
              {submitted ? (
                <div className="text-center py-20 animate-fade-in">
                  <div className="bg-emerald-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8">
                    <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                  </div>
                  <h2 className="text-3xl font-black text-slate-900 mb-4">Message envoyé !</h2>
                  <p className="text-slate-500 font-medium mb-8">Merci de nous avoir contactés. Notre équipe vous répondra dans les plus brefs délais.</p>
                  <button onClick={() => setSubmitted(false)} className="text-blue-600 font-bold hover:underline">
                    Envoyer un autre message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 ml-1 italic">Votre nom</label>
                      <input 
                        required 
                        type="text" 
                        placeholder="Jean Dupont"
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all font-medium" 
                      />
                    </div>
                    <div className="space-y-2">
                       <label className="text-sm font-bold text-slate-700 ml-1 italic">Votre email</label>
                      <input 
                        required 
                        type="email" 
                        placeholder="jean@exemple.tn"
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all font-medium" 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1 italic">Sujet</label>
                    <select className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all font-medium appearance-none">
                      <option>Demande d'information</option>
                      <option>Support technique</option>
                      <option>Offre pour entreprise</option>
                      <option>Autre</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1 italic">Votre message</label>
                    <textarea 
                      required 
                      rows="5" 
                      placeholder="Comment pouvons-nous vous aider ?"
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all font-medium resize-none"
                    ></textarea>
                  </div>
                  <button 
                    type="submit"
                    className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-lg hover:bg-slate-800 transition-all shadow-xl active:scale-[0.98] flex items-center justify-center gap-3"
                  >
                    <Send className="w-5 h-5" />
                    Envoyer le message
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
