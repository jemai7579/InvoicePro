import jwt from 'jsonwebtoken';
import { Request, Response } from 'express';
import prisma from '../prisma';
import { getJwtSecret } from '../utils/jwtSecret';
import {
  auditSeoPages,
  getAnalyticsEvents,
  getAnalyticsOverview,
  getAnalyticsPages,
  getAnalyticsReferrers,
  getFunnel,
  getSeoRecommendations,
  recordAnalyticsEvent,
} from '../services/analyticsService';

const optionalCompanyId = async (req: Request) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return null;
  try {
    const decoded: any = jwt.verify(auth.split(' ')[1], getJwtSecret());
    const company = await prisma.company.findUnique({ where: { id: decoded.id }, select: { id: true } });
    return company?.id || null;
  } catch {
    return null;
  }
};

export const postAnalyticsEvent = async (req: Request, res: Response) => {
  try {
    const companyId = await optionalCompanyId(req);
    await recordAnalyticsEvent(req.body, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      companyId,
      country: String(req.headers['cf-ipcountry'] || req.headers['x-vercel-ip-country'] || '') || undefined,
      city: String(req.headers['x-vercel-ip-city'] || '') || undefined,
    });
    res.status(204).send();
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'Analytics event rejected' });
  }
};

export const getAdminAnalyticsOverview = async (req: Request, res: Response) => {
  const [overview, funnel, recommendations] = await Promise.all([
    getAnalyticsOverview(String(req.query.range || '30d')),
    getFunnel(),
    getSeoRecommendations(),
  ]);
  res.json({ success: true, data: { ...overview, funnel, recommendations } });
};

export const getAdminAnalyticsPages = async (req: Request, res: Response) => res.json({ success: true, data: await getAnalyticsPages() });
export const getAdminAnalyticsReferrers = async (req: Request, res: Response) => res.json({ success: true, data: await getAnalyticsReferrers() });
export const getAdminAnalyticsEvents = async (req: Request, res: Response) => res.json({ success: true, data: await getAnalyticsEvents() });

export const getSearchConsole = async (req: Request, res: Response) => {
  const configured = Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_JSON_PATH && process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL);
  if (!configured) {
    return res.json({
      success: true,
      data: {
        configured: false,
        message: 'Google Search Console non connecte.',
        clicks: null,
        impressions: null,
        ctr: null,
        averagePosition: null,
        topQueries: [],
        topPages: [],
      },
    });
  }
  return res.json({
    success: true,
    data: {
      configured: true,
      message: 'Search Console API not configured in this backend build.',
      clicks: null,
      impressions: null,
      ctr: null,
      averagePosition: null,
      topQueries: [],
      topPages: [],
    },
  });
};

export const getSeoPagesAudit = async (req: Request, res: Response) => res.json({ success: true, data: await auditSeoPages() });
