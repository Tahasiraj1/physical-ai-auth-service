import { Request, Response, NextFunction } from 'express';
import { auth } from '../auth.js';

/**
 * Middleware to extract and validate user from Better Auth session
 * Adds user object to request if authenticated, otherwise returns 401
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Better Auth session validation
    const session = await auth.api.getSession({
      headers: req.headers as any,
    });

    // Better Auth returns { data: { user, session }, error: null }
    const user = session?.user

    if (!session || !user) {
      res.status(401).json({ error: 'Unauthorized', message: 'Authentication required' });
      return;
    }

    // Attach user to request for use in route handlers
    (req as any).user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ error: 'Unauthorized', message: 'Invalid session' });
  }
}

/**
 * Optional auth middleware - attaches user if authenticated, but doesn't require it
 * Useful for endpoints that work differently for authenticated vs unauthenticated users
 */
export async function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const session = await auth.api.getSession({
      headers: req.headers as any,
    });

    // Better Auth returns { data: { user, session }, error: null }
    const user = session?.user;

    if (session && user) {
      (req as any).user = user;
    }
    next();
  } catch (error) {
    // Continue without user if session is invalid
    next();
  }
}

