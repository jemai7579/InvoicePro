import React from 'react';
import { Bot, Sparkles, MessageSquare } from 'lucide-react';

const AI = () => {
  return (
    <>
      <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
        <div className="p-8 md:p-12 text-center">
          <div className="inline-flex items-center justify-center p-4 bg-blue-600 rounded-3xl shadow-lg shadow-blue-200 mb-8">
            <Bot className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 mb-4">
            Assistant AI El Fatoura
          </h1>
          <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-12">
            Notre intelligence artificielle est là pour vous accompagner dans la gestion de votre facturation, 
            la conformité TEIF et bien plus encore.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 hover:border-blue-200 transition-colors">
              <Sparkles className="w-6 h-6 text-blue-600 mb-3" />
              <h3 className="font-bold text-slate-900 mb-2">Conformité TEIF</h3>
              <p className="text-sm text-slate-500">Posez des questions sur le format XML UBL et les normes de la TTN.</p>
            </div>
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 hover:border-blue-200 transition-colors">
              <MessageSquare className="w-6 h-6 text-blue-600 mb-3" />
              <h3 className="font-bold text-slate-900 mb-2">Support Intégral</h3>
              <p className="text-sm text-slate-500">Demandez de l'aide sur l'utilisation de la plateforme étape par étape.</p>
            </div>
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 hover:border-blue-200 transition-colors">
              <Bot className="w-6 h-6 text-blue-600 mb-3" />
              <h3 className="font-bold text-slate-900 mb-2">Assistance Directe</h3>
              <p className="text-sm text-slate-500">Utilisez le bouton flottant en bas à droite pour chatter en direct.</p>
            </div>
          </div>

          <div className="mt-12 p-8 bg-blue-50 rounded-3xl border border-blue-100">
            <p className="text-blue-700 font-medium">
              L'interface de chat complète pour cette page sera déployée prochainement. 
              En attendant, vous pouvez utiliser l'assistant flottant présent sur toutes les pages.
            </p>
          </div>
        </div>
      </div>
    </div>
  </>
);
};

export default AI;
