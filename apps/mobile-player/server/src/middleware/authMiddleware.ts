import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '@bingo/game-core';
import { MobileUser } from '@bingo/domain';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: Omit<MobileUser, 'passwordHash'>;
    }
  }
}

/**
 * Middleware to verify JWT token and attach user to request
 * Usage: router.get('/me', authMiddleware, handler)
 */
export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'Token no proporcionado',
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token and get user
    const user = await verifyToken(token);

    if (!user) {
      return res.status(401).json({
        error: 'INVALID_TOKEN',
        message: 'Token inválido o expirado',
      });
    }

    // Attach user to request (without passwordHash)
    const { passwordHash, ...safeUser } = user;
    req.user = safeUser;

    next();
  } catch (err) {
    const error = err as Error;
    console.error('Auth middleware error:', error.message);
    return res.status(401).json({
      error: 'INVALID_TOKEN',
      message: 'Token inválido',
    });
  }
}
