import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Demo from './pages/Demo';
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';
import Dashboard from './pages/Dashboard';
import Invoices from './pages/Invoices';
import Clients from './pages/Clients';
import Demandes from './pages/Demandes';
import Devis from './pages/Devis';
import Teif from './pages/Teif';
import Settings from './pages/Settings';
import AI from './pages/AI';
import Products from './pages/Products';
import Reports from './pages/Reports';
import Help from './pages/Help';
import Projects from './pages/Projects';
import InvoiceTracking from './pages/InvoiceTracking';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import Legal from './pages/Legal';
import Contact from './pages/Contact';
import Pricing from './pages/Pricing';
import EInvoiceGuide from './pages/EInvoiceGuide';
import Offers from './pages/Offers';
import Payments from './pages/Payments';
import AuditTrail from './pages/AuditTrail';
import SignatureTTN from './pages/SignatureTTN';
import PublicOffer from './pages/PublicOffer';
import Network from './pages/Network';
import Messages from './pages/Messages';

// Admin Pages
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminCompanies from './pages/admin/AdminCompanies';
import AdminUsers from './pages/admin/AdminUsers';
import AdminInvoices from './pages/admin/AdminInvoices';
import AdminTTN from './pages/admin/AdminTTN';
import AdminCompliance from './pages/admin/AdminCompliance';
import AdminPayments from './pages/admin/AdminPayments';
import AdminSupport from './pages/admin/AdminSupport';
import AdminSubscriptions from './pages/admin/AdminSubscriptions';
import AdminActivity from './pages/admin/AdminActivity';
import AdminSystemErrors from './pages/admin/AdminSystemErrors';
import AdminSettings from './pages/admin/AdminSettings';
import AdminAnalyticsSeo from './pages/admin/AdminAnalyticsSeo';
import AdminLayout from './components/AdminLayout';
import AdminPrivateRoute from './components/AdminPrivateRoute';

import { AdminAuthProvider } from './context/AdminAuthContext';
import { trackEvent, trackPageView } from './services/analytics';

const routerBaseName = (import.meta.env.VITE_BASE_PATH || '/').replace(/\/$/, '');

const AnalyticsTracker = () => {
  const location = useLocation();
  React.useEffect(() => {
    if (!location.pathname.startsWith('/admin')) trackPageView(location.pathname);
  }, [location.pathname]);
  React.useEffect(() => {
    const handler = (event) => {
      const target = event.target.closest?.('a,button');
      const text = `${target?.textContent || ''} ${target?.getAttribute?.('href') || ''}`.toLowerCase();
      if (text.includes('register') || text.includes('inscription')) trackEvent('register_button_clicked');
      if (text.includes('login') || text.includes('connexion')) trackEvent('login_button_clicked');
      if (text.includes('support') || text.includes('contact')) trackEvent('contact_support_clicked');
      if (text.includes('e-invoice-guide') || text.includes('guide')) trackEvent('e_invoice_guide_viewed');
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);
  return null;
};

function App() {
  return (
    <Router basename={routerBaseName === '' ? undefined : routerBaseName}>
      <AnalyticsTracker />
      <AdminAuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/demo" element={<Demo />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/legal" element={<Legal />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/tarifs" element={<Pricing />} />
          <Route path="/e-invoice-guide" element={<EInvoiceGuide />} />
          <Route path="/signature-ttn" element={<SignatureTTN />} />
          <Route path="/public/offers/:token" element={<PublicOffer />} />

          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route element={<AdminPrivateRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/companies" element={<AdminCompanies />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/subscriptions" element={<AdminSubscriptions />} />
              <Route path="/admin/invoices" element={<AdminInvoices />} />
              <Route path="/admin/ttn" element={<AdminTTN />} />
              <Route path="/admin/compliance" element={<AdminCompliance />} />
              <Route path="/admin/payments" element={<AdminPayments />} />
              <Route path="/admin/support" element={<AdminSupport />} />
              <Route path="/admin/activity" element={<AdminActivity />} />
              <Route path="/admin/activity-logs" element={<AdminActivity />} />
              <Route path="/admin/system-errors" element={<AdminSystemErrors />} />
              <Route path="/admin/settings" element={<AdminSettings />} />
              <Route path="/admin/analytics-seo" element={<AdminAnalyticsSeo />} />
            </Route>
          </Route>

          {/* User Protected Routes */}
          <Route element={<PrivateRoute />}>
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/invoices" element={<Invoices />} />
              <Route path="/payments" element={<Payments />} />
              <Route path="/reglements" element={<Payments />} />
              <Route path="/invoice-tracking" element={<InvoiceTracking />} />
              <Route path="/suivi-factures" element={<InvoiceTracking />} />
              <Route path="/clients" element={<Clients />} />
              <Route path="/network" element={<Network />} />
              <Route path="/reseau" element={<Network />} />
              <Route path="/reseau-professionnel" element={<Network />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/mes-projets" element={<Projects />} />
              <Route path="/offers" element={<Offers />} />
              <Route path="/mes-offres" element={<Offers />} />
              <Route path="/devis" element={<Devis />} />
              <Route path="/quotes" element={<Devis />} />
              <Route path="/mes-devis" element={<Devis />} />
              <Route path="/demandes" element={<Demandes />} />
              <Route path="/teif" element={<Teif />} />
              <Route path="/compliance-center" element={<Teif />} />
              <Route path="/products" element={<Products />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/historique" element={<AuditTrail />} />
              <Route path="/audit-trail" element={<AuditTrail />} />
              <Route path="/signature-ttn" element={<SignatureTTN />} />
              <Route path="/ai" element={<AI />} />
              <Route path="/help" element={<Help />} />
              <Route path="/support" element={<Help />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AdminAuthProvider>
    </Router>
  );
}

export default App;
