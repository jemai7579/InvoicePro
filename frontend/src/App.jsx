import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';

import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';
import AdminLayout from './components/AdminLayout';
import AdminPrivateRoute from './components/AdminPrivateRoute';

import { AdminAuthProvider } from './context/AdminAuthContext';
import { trackEvent, trackPageView } from './services/analytics';

const Landing = React.lazy(() => import('./pages/Landing'));
const Login = React.lazy(() => import('./pages/Login'));
const Register = React.lazy(() => import('./pages/Register'));
const Demo = React.lazy(() => import('./pages/Demo'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Invoices = React.lazy(() => import('./pages/Invoices'));
const Clients = React.lazy(() => import('./pages/Clients'));
const Demandes = React.lazy(() => import('./pages/Demandes'));
const Devis = React.lazy(() => import('./pages/Devis'));
const Teif = React.lazy(() => import('./pages/Teif'));
const Settings = React.lazy(() => import('./pages/Settings'));
const AI = React.lazy(() => import('./pages/AI'));
const Products = React.lazy(() => import('./pages/Products'));
const Reports = React.lazy(() => import('./pages/Reports'));
const Help = React.lazy(() => import('./pages/Help'));
const Projects = React.lazy(() => import('./pages/Projects'));
const InvoiceTracking = React.lazy(() => import('./pages/InvoiceTracking'));
const Privacy = React.lazy(() => import('./pages/Privacy'));
const Terms = React.lazy(() => import('./pages/Terms'));
const Legal = React.lazy(() => import('./pages/Legal'));
const Contact = React.lazy(() => import('./pages/Contact'));
const Pricing = React.lazy(() => import('./pages/Pricing'));
const EInvoiceGuide = React.lazy(() => import('./pages/EInvoiceGuide'));
const Offers = React.lazy(() => import('./pages/Offers'));
const Payments = React.lazy(() => import('./pages/Payments'));
const AuditTrail = React.lazy(() => import('./pages/AuditTrail'));
const SignatureTTN = React.lazy(() => import('./pages/SignatureTTN'));
const PublicOffer = React.lazy(() => import('./pages/PublicOffer'));
const Network = React.lazy(() => import('./pages/Network'));
const Messages = React.lazy(() => import('./pages/Messages'));
const Opportunities = React.lazy(() => import('./pages/Opportunities'));
const AdminLogin = React.lazy(() => import('./pages/admin/AdminLogin'));
const AdminDashboard = React.lazy(() => import('./pages/admin/AdminDashboard'));
const AdminCompanies = React.lazy(() => import('./pages/admin/AdminCompanies'));
const AdminUsers = React.lazy(() => import('./pages/admin/AdminUsers'));
const AdminInvoices = React.lazy(() => import('./pages/admin/AdminInvoices'));
const AdminTTN = React.lazy(() => import('./pages/admin/AdminTTN'));
const AdminCompliance = React.lazy(() => import('./pages/admin/AdminCompliance'));
const AdminPayments = React.lazy(() => import('./pages/admin/AdminPayments'));
const AdminSupport = React.lazy(() => import('./pages/admin/AdminSupport'));
const AdminSubscriptions = React.lazy(() => import('./pages/admin/AdminSubscriptions'));
const AdminActivity = React.lazy(() => import('./pages/admin/AdminActivity'));
const AdminSystemErrors = React.lazy(() => import('./pages/admin/AdminSystemErrors'));
const AdminSettings = React.lazy(() => import('./pages/admin/AdminSettings'));
const AdminAnalyticsSeo = React.lazy(() => import('./pages/admin/AdminAnalyticsSeo'));

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
        <React.Suspense fallback={null}>
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
              <Route path="/admin/integrations" element={<AdminSettings />} />
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
              <Route path="/opportunities" element={<Opportunities />} />
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
        </React.Suspense>
      </AdminAuthProvider>
    </Router>
  );
}

export default App;
