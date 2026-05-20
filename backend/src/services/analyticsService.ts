import fs from 'fs-extra';
import path from 'path';
import prisma from '../prisma';
import { hashValue } from '../utils/secretCrypto';

export const ANALYTICS_EVENTS = [
  'page_view',
  'landing_page_viewed',
  'e_invoice_guide_viewed',
  'register_button_clicked',
  'login_button_clicked',
  'contact_support_clicked',
  'registration_completed',
  'first_client_created',
  'first_invoice_created',
  'teif_generated',
  'support_ticket_created',
  'pricing_viewed',
];

export const detectDevice = (userAgent = '') => {
  const ua = userAgent.toLowerCase();
  if (/mobile|iphone|android/.test(ua)) return 'mobile';
  if (/ipad|tablet/.test(ua)) return 'tablet';
  return 'desktop';
};

const startDateForRange = (range?: string) => {
  const now = new Date();
  const days = range === '7d' ? 7 : range === '90d' ? 90 : 30;
  return new Date(now.getTime() - days * 86400000);
};

export const recordAnalyticsEvent = async (payload: any, requestMeta: { ip?: string; userAgent?: string; companyId?: string | null; country?: string; city?: string }) => {
  const eventType = String(payload.eventType || '').trim();
  const pathValue = String(payload.path || '').trim();
  if (!ANALYTICS_EVENTS.includes(eventType)) throw new Error('Invalid analytics event');
  if (!pathValue || pathValue.length > 300) throw new Error('Invalid path');

  const metadata = payload.metadata && JSON.stringify(payload.metadata).length <= 2000 ? payload.metadata : {};
  return (prisma as any).analyticsEvent.create({
    data: {
      eventType,
      path: pathValue,
      referrer: String(payload.referrer || '').slice(0, 500) || null,
      userAgent: String(requestMeta.userAgent || '').slice(0, 500) || null,
      deviceType: detectDevice(requestMeta.userAgent),
      country: requestMeta.country || null,
      city: requestMeta.city || null,
      companyId: requestMeta.companyId || null,
      sessionId: String(payload.sessionId || '').slice(0, 120) || 'anonymous',
      visitorId: String(payload.visitorId || '').slice(0, 120) || 'anonymous',
      ipHash: hashValue(requestMeta.ip),
      metadata,
    },
  });
};

export const getAnalyticsOverview = async (range?: string) => {
  const since = startDateForRange(range);
  const events = await (prisma as any).analyticsEvent.findMany({ where: { createdAt: { gte: since } }, orderBy: { createdAt: 'desc' } });
  const visitors = new Set(events.map((event: any) => event.visitorId)).size;
  const sessions = new Set(events.map((event: any) => event.sessionId)).size;
  const pageViews = events.filter((event: any) => event.eventType === 'page_view' || event.eventType.endsWith('_viewed')).length;
  const top = (key: string) =>
    Object.entries(
      events.reduce((acc: Record<string, number>, event: any) => {
        const value = event[key] || 'Non renseigne';
        acc[value] = (acc[value] || 0) + 1;
        return acc;
      }, {})
    )
      .map(([name, count]) => ({ name, count: Number(count) }))
      .sort((a: any, b: any) => b.count - a.count)
      .slice(0, 10);

  return {
    totalVisitors: visitors,
    uniqueVisitors: visitors,
    pageViews,
    sessions,
    averageEngagementTime: null,
    topPages: top('path'),
    referrers: top('referrer'),
    devices: top('deviceType'),
    countries: top('country'),
    eventsByType: top('eventType'),
    recentEvents: events.slice(0, 50),
    ga4: process.env.GA4_MEASUREMENT_ID ? 'configured' : 'not_connected',
  };
};

export const getAnalyticsPages = async () => (await getAnalyticsOverview()).topPages;
export const getAnalyticsReferrers = async () => (await getAnalyticsOverview()).referrers;
export const getAnalyticsEvents = async () => (await getAnalyticsOverview()).eventsByType;

export const getFunnel = async () => {
  const events = await (prisma as any).analyticsEvent.findMany({ where: { createdAt: { gte: startDateForRange('90d') } } });
  const count = (types: string[]) => events.filter((event: any) => types.includes(event.eventType)).length;
  return [
    { label: 'Visitor', count: new Set(events.map((event: any) => event.visitorId)).size },
    { label: 'Guide e-Facture view', count: count(['e_invoice_guide_viewed']) },
    { label: 'Register click', count: count(['register_button_clicked']) },
    { label: 'Account created', count: count(['registration_completed']) },
    { label: 'First invoice created', count: count(['first_invoice_created']) },
  ];
};

const publicRoutes = ['/', '/e-invoice-guide', '/login', '/register', '/contact', '/pricing', '/tarifs'];

export const auditSeoPages = async () => {
  const frontendDir = path.resolve(process.cwd(), '../frontend/dist');
  const indexPath = path.join(frontendDir, 'index.html');
  const hasBuild = await fs.pathExists(indexPath);
  const html = hasBuild ? await fs.readFile(indexPath, 'utf8') : '';
  const robots = await fs.pathExists(path.join(frontendDir, 'robots.txt'));
  const sitemap = await fs.pathExists(path.join(frontendDir, 'sitemap.xml'));

  return publicRoutes.map((route) => ({
    path: route,
    title: /<title>.+<\/title>/i.test(html),
    metaDescription: /<meta\s+name=["']description["']/i.test(html),
    h1: hasBuild ? 'client_rendered_check_required' : 'frontend_build_required',
    canonical: /rel=["']canonical["']/i.test(html),
    robotsMeta: /<meta\s+name=["']robots["']/i.test(html),
    openGraph: /property=["']og:/i.test(html),
    sitemap,
    robots,
  }));
};

export const getSeoRecommendations = async () => {
  const overview = await getAnalyticsOverview('30d');
  const funnel = await getFunnel();
  const recommendations = [];
  const guide = funnel.find((item) => item.label === 'Guide e-Facture view')?.count || 0;
  const register = funnel.find((item) => item.label === 'Register click')?.count || 0;
  if (guide > 0 && register / guide < 0.15) recommendations.push('Guide e-Facture consulte mais peu de clics inscription: renforcer le CTA.');
  if (overview.topPages[0]?.count > 20 && register < 3) recommendations.push('Page a fort trafic et faible conversion: revoir hero, prix et preuves de confiance.');
  recommendations.push('Connecter Google Search Console pour identifier les pages avec impressions elevees et CTR faible.');
  return recommendations;
};
