import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/db';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    username: string;
    isAdmin: boolean;
    weddingId: number | null;
  };
}

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized', message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: number };
    // Load the user fresh so role/wedding changes (e.g. an admin switching
    // wedding) take effect immediately, without needing a new token.
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, username: true, isAdmin: true, weddingId: true },
    });

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized', message: 'User no longer exists' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Forbidden', message: 'Invalid token' });
  }
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ error: 'Forbidden', message: 'Admin access required' });
  }
  next();
};
