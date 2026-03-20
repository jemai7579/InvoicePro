import React from 'react';
import { HelpCircle, Mail, MessageSquare, FileText, ChevronRight } from 'lucide-react';

const Help = () => {
  const faqs = [
    {
      question: "How do I create a new invoice?",
      answer: "Navigate to the Invoices tab and click the 'New Invoice' button in the top right corner. Select a client, add product lines, and save."
    },
    {
      question: "What is XAdES-B and how does it work?",
      answer: "XAdES-B is an electronic signature format expected by TTN. You can upload your company's .p12 certificate in Settings, and the system will automatically sign your XML invoices."
    },
    {
      question: "How do I add my company logo?",
      answer: "Go to Settings, and in the company profile section, upload your logo. It will appear on all your generated PDF invoices and quotes."
    },
    {
      question: "Can I convert a Quote (Devis) into an Invoice?",
      answer: "Yes. From the Quotes list, click the 'Convert to Invoice' icon on any existing quote. The system will create a draft invoice with the same data."
    }
  ];

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Help Center</h1>
        <p className="text-gray-500">Find answers, get support, and learn how to use El Fatoora.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main FAQ Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <HelpCircle className="w-5 h-5 mr-2 text-blue-600" />
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              {faqs.map((faq, idx) => (
                <div key={idx} className="border border-gray-100 rounded-lg p-4 hover:shadow-md transition-shadow bg-gray-50">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">{faq.question}</h3>
                  <p className="text-sm text-gray-600">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Support Sidebar */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl p-6 text-white shadow-md">
            <h3 className="font-bold text-lg mb-2">Need AI Assistance?</h3>
            <p className="text-blue-100 text-sm mb-4">
              Our AI Assistant is available 24/7 to help you navigate the platform, generate specific invoices, or answer technical questions about TTN integration.
            </p>
            <button 
              onClick={() => window.dispatchEvent(new CustomEvent('open-ai-assistant'))}
              className="w-full bg-white text-blue-700 py-2 rounded-lg font-medium text-sm flex items-center justify-center hover:bg-blue-50 transition-colors"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Open AI Assistant
            </button>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="font-bold text-gray-900 mb-4">Contact Support</h3>
            <div className="space-y-4">
              <a href="mailto:support@elfatoora.tn" className="flex items-center p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors group">
                <div className="bg-blue-100 p-2 rounded-full mr-3 group-hover:bg-blue-200 transition-colors">
                  <Mail className="w-4 h-4 text-blue-700" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Email Us</p>
                  <p className="text-xs text-gray-500">support@elfatoora.tn</p>
                </div>
              </a>
              <a href="#" className="flex items-center p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors group">
                <div className="bg-green-100 p-2 rounded-full mr-3 group-hover:bg-green-200 transition-colors">
                  <FileText className="w-4 h-4 text-green-700" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Read Documentation</p>
                  <p className="text-xs text-gray-500">API guides & manuals</p>
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Help;
