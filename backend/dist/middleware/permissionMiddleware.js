"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireEInvoicePermission = exports.requireCompanyRole = void 0;
const getCompanyRole = (company) => (String(company?.role || company?.userRole || 'owner').trim().toLowerCase());
const requireCompanyRole = (allowedRoles, actionLabel) => (req, res, next) => {
    const company = req.company;
    const role = getCompanyRole(company);
    const allowed = new Set(['owner', ...allowedRoles.map((item) => item.toLowerCase())]);
    if (allowed.has(role))
        return next();
    return res.status(403).json({
        message: `Permission refusée: ${actionLabel}`,
        requiredRoles: Array.from(allowed),
    });
};
exports.requireCompanyRole = requireCompanyRole;
const requireEInvoicePermission = (permission) => (req, res, next) => {
    const company = req.company;
    const role = getCompanyRole(company);
    const isOwnerOrAdmin = role === 'owner' || role === 'admin';
    const hasExplicitPermission = permission === 'sign' ? company?.canSignInvoices : company?.canSubmitTtn;
    if (isOwnerOrAdmin || hasExplicitPermission === true)
        return next();
    return res.status(403).json({
        message: permission === 'sign'
            ? 'Permission refusée: signature électronique non autorisée pour cet utilisateur.'
            : 'Permission refusée: soumission TTN non autorisée pour cet utilisateur.',
    });
};
exports.requireEInvoicePermission = requireEInvoicePermission;
