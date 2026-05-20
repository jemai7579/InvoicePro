import { Request, Response, NextFunction } from 'express';
import { upsertSystemError } from '../services/adminOpsStore';

export const errorHandler = async (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('❌ Server Error:', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  const safeMessage = statusCode >= 500 ? 'Internal Server Error' : message;

  if (statusCode >= 500) {
    await upsertSystemError({
      type: 'API error',
      severity: 'high',
      status: 'new',
      message: safeMessage,
      route: `${req.method} ${req.originalUrl}`,
      companyId: (req as any).company?.id || null,
      stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    }).catch(() => {});
  }

  res.status(statusCode).json({
    success: false,
    message: safeMessage,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
};
