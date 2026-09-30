import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

export const VOTER_COOKIE_NAME = 'voter_token';

// 2 years expiration for persistent visitor voting identity
export const VOTER_COOKIE_MAX_AGE = 60 * 60 * 24 * 365 * 2;

export const VOTER_COOKIE_OPTIONS = {
  name: VOTER_COOKIE_NAME,
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  maxAge: VOTER_COOKIE_MAX_AGE,
  path: '/',
};

/**
 * Extracts voter token from request cookies or header, or generates a new one.
 */
export function getOrCreateVoterToken(req: NextRequest): { voterToken: string; isNew: boolean } {
  const cookieToken = req.cookies.get(VOTER_COOKIE_NAME)?.value?.trim();
  if (cookieToken) {
    return { voterToken: cookieToken, isNew: false };
  }

  // Fallback to custom header if client passed one
  const headerToken = req.headers.get('x-voter-token')?.trim();
  if (headerToken) {
    return { voterToken: headerToken, isNew: false };
  }

  const newToken = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : uuidv4();
  return { voterToken: newToken, isNew: true };
}

/**
 * Attaches the voter token cookie to a NextResponse.
 */
export function attachVoterCookie(response: NextResponse, voterToken: string): NextResponse {
  response.cookies.set(VOTER_COOKIE_NAME, voterToken, VOTER_COOKIE_OPTIONS);
  return response;
}
