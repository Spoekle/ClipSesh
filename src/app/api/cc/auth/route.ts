import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function GET(req: NextRequest) {
  const CLIENT_ID = process.env.CC_CLIENT_ID;
  const rawBase = (process.env.CC_BASE_URL || 'https://cube.community')
    .replace(/\/api\/auth\/?$/, '')
    .replace(/\/+$/, '');
  const CC_BASE = `${rawBase}/api/auth`;

  const frontendUrl = (process.env.FRONTEND_URL || '').replace(/\/+$/, '');
  if (!frontendUrl) {
    return NextResponse.json(
      { error: 'FRONTEND_URL environment variable is not configured' },
      { status: 500 }
    );
  }

  const redirectUri = `${frontendUrl}/api/oauth/callback`;

  if (!CLIENT_ID) {
    return NextResponse.redirect(`${frontendUrl}?error=cc_not_configured`);
  }

  const siteUserId = req.nextUrl.searchParams.get('siteUserId') || '';

  // PKCE: generate code_verifier and code_challenge (RFC 7636 / OIDC)
  const codeVerifier = crypto.randomBytes(32).toString('base64url');
  const codeChallenge = crypto
    .createHash('sha256')
    .update(codeVerifier)
    .digest('base64url');

  const state = encodeURIComponent(
    JSON.stringify({
      provider: 'cc',
      siteUserId: siteUserId || undefined,
      cv: codeVerifier,
    })
  );

  // Scopes registered for this client on https://cube.community/developers
  // "openid profile discord" (accounts, email, and groups are invalid unless enabled in the app's settings)
  const defaultScopes = 'openid profile discord';
  const scopes = process.env.CC_SCOPES || defaultScopes;

  const ccAuthUrl = `${CC_BASE}/oauth2/authorize?client_id=${encodeURIComponent(
    CLIENT_ID
  )}&response_type=code&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&scope=${encodeURIComponent(
    scopes
  )}&state=${state}&code_challenge=${codeChallenge}&code_challenge_method=S256`;

  return NextResponse.redirect(ccAuthUrl);
}
