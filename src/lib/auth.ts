import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const SECRET_KEY = process.env.SECRET_KEY || 'default_secret_key_change_in_production';

export interface DecodedUser {
  id: string;
  username: string;
  roles: string[];
  discordId?: string;
}

export function extractToken(req: Request | NextRequest): string | null {
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  if (authHeader) {
    return authHeader.split(' ')[1] || authHeader;
  }
  return null;
}

export function verifyAuthToken(token: string): DecodedUser | null {
  try {
    const decoded = jwt.verify(token, SECRET_KEY) as any;
    return {
      id: decoded.id || decoded.botId || decoded._id,
      username: decoded.username || decoded.botUsername,
      roles: Array.isArray(decoded.roles) ? decoded.roles : (decoded.role ? [decoded.role] : []),
      discordId: decoded.discordId,
    };
  } catch {
    return null;
  }
}

export function getAuthUser(req: Request | NextRequest): DecodedUser | null {
  const token = extractToken(req);
  if (!token) return null;
  return verifyAuthToken(token);
}

export function requireAuth(
  req: Request | NextRequest,
  allowedRoles?: string[]
): { user: DecodedUser | null; errorResponse: NextResponse | null } {
  const user = getAuthUser(req);

  if (!user) {
    return {
      user: null,
      errorResponse: NextResponse.json(
        { error: 'Unauthorized: No valid token provided' },
        { status: 401 }
      ),
    };
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const hasPermission = user.roles.some((role) => allowedRoles.includes(role));
    if (!hasPermission) {
      return {
        user: null,
        errorResponse: NextResponse.json(
          { error: 'Forbidden: Insufficient permissions' },
          { status: 403 }
        ),
      };
    }
  }

  return { user, errorResponse: null };
}

export function signToken(
  payload: object,
  expiresIn: string = process.env.JWT_EXPIRES_IN || '7d'
): string {
  return jwt.sign(payload, SECRET_KEY, { expiresIn } as jwt.SignOptions);
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
