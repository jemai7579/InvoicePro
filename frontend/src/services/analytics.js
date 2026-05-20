import api from './api';

const storageKey = 'elfatoora_analytics_ids';

const getIds = () => {
  const existing = JSON.parse(localStorage.getItem(storageKey) || 'null');
  if (existing?.visitorId && existing?.sessionId) return existing;
  const ids = {
    visitorId: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
    sessionId: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
  };
  localStorage.setItem(storageKey, JSON.stringify(ids));
  return ids;
};

export const trackEvent = (eventType, metadata = {}) => {
  const ids = getIds();
  const payload = {
    eventType,
    path: window.location.pathname,
    referrer: document.referrer,
    metadata,
    ...ids,
  };
  api.post('/analytics/event', payload).catch(() => {});
};

export const trackPageView = (path) => {
  trackEvent('page_view', { path });
  if (path === '/') trackEvent('landing_page_viewed');
  if (path === '/e-invoice-guide') trackEvent('e_invoice_guide_viewed');
  if (path === '/pricing' || path === '/tarifs') trackEvent('pricing_viewed');
};
