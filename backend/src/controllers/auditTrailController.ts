import { Request, Response } from 'express';
import { getActivitiesByCompany, getActivitiesByObject } from '../services/auditTrailService';

const routeParam = (value: string | string[]) => Array.isArray(value) ? value[0] : value;

export const getAuditTrail = async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).company.id;
    const { objectType, actionType } = req.query;
    const activities = await getActivitiesByCompany(companyId, {
      objectType: objectType ? String(objectType) : undefined,
      actionType: actionType ? String(actionType) : undefined,
    });
    res.status(200).json(activities);
  } catch (error) {
    console.error('Error loading audit trail:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getAuditTrailForObject = async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).company.id;
    const activities = await getActivitiesByObject(companyId, routeParam(req.params.objectType), routeParam(req.params.objectId));
    res.status(200).json(activities);
  } catch (error) {
    console.error('Error loading object audit trail:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
