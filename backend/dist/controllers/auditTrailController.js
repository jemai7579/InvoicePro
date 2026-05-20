"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAuditTrailForObject = exports.getAuditTrail = void 0;
const auditTrailService_1 = require("../services/auditTrailService");
const routeParam = (value) => Array.isArray(value) ? value[0] : value;
const getAuditTrail = async (req, res) => {
    try {
        const companyId = req.company.id;
        const { objectType, actionType } = req.query;
        const activities = await (0, auditTrailService_1.getActivitiesByCompany)(companyId, {
            objectType: objectType ? String(objectType) : undefined,
            actionType: actionType ? String(actionType) : undefined,
        });
        res.status(200).json(activities);
    }
    catch (error) {
        console.error('Error loading audit trail:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getAuditTrail = getAuditTrail;
const getAuditTrailForObject = async (req, res) => {
    try {
        const companyId = req.company.id;
        const activities = await (0, auditTrailService_1.getActivitiesByObject)(companyId, routeParam(req.params.objectType), routeParam(req.params.objectId));
        res.status(200).json(activities);
    }
    catch (error) {
        console.error('Error loading object audit trail:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getAuditTrailForObject = getAuditTrailForObject;
