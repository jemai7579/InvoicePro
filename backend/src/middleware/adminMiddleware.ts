import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../prisma';
import { getJwtSecret } from '../utils/jwtSecret';

export const adminProtect = async (req: Request, res: Response, next: NextFunction) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];

      const decoded: any = jwt.verify(token, getJwtSecret());

      // Recherche dans la table Admin au lieu de Company
      const admin = await prisma.admin.findUnique({
        where: { id: decoded.id },
      });

      if (!admin) {
        return res.status(401).json({ message: 'Not authorized as admin' });
      }

      (req as any).admin = admin;
      next();
    } catch (error) {
      console.error('Admin Auth Error:', error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};
