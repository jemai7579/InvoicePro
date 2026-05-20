import { Request, Response, NextFunction } from 'express';

type CompanyWithPermissions = {
  role?: string | null;
  userRole?: string | null;
  canSignInvoices?: boolean | null;
  canSubmitTtn?: boolean | null;
};

const getCompanyRole = (company: CompanyWithPermissions | undefined) => (
  String(company?.role || company?.userRole || 'owner').trim().toLowerCase()
);

export const requireCompanyRole = (allowedRoles: string[], actionLabel: string) => (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const company = (req as any).company as CompanyWithPermissions | undefined;
  const role = getCompanyRole(company);
  const allowed = new Set(['owner', ...allowedRoles.map((item) => item.toLowerCase())]);

  if (allowed.has(role)) return next();

  return res.status(403).json({
    message: `Permission refusée: ${actionLabel}`,
    requiredRoles: Array.from(allowed),
  });
};

export const requireEInvoicePermission = (permission: 'sign' | 'submit-ttn') => (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const company = (req as any).company as CompanyWithPermissions | undefined;
  const role = getCompanyRole(company);
  const isOwnerOrAdmin = role === 'owner' || role === 'admin';
  const hasExplicitPermission = permission === 'sign' ? company?.canSignInvoices : company?.canSubmitTtn;

  if (isOwnerOrAdmin || hasExplicitPermission === true) return next();

  return res.status(403).json({
    message: permission === 'sign'
      ? 'Permission refusée: signature électronique non autorisée pour cet utilisateur.'
      : 'Permission refusée: soumission TTN non autorisée pour cet utilisateur.',
  });
};
