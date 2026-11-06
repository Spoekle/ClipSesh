import { NextRequest, NextResponse } from 'next/server';
import { handleCCCallback } from '@/lib/oauthHandlers';

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  const errorParam = req.nextUrl.searchParams.get('error');
  const stateRaw = req.nextUrl.searchParams.get('state') || '';

  const frontendUrl = (process.env.FRONTEND_URL || '').replace(/\/+$/, '');
  if (!frontendUrl) {
    return NextResponse.json(
      { error: 'FRONTEND_URL environment variable is not configured' },
      { status: 500 }
    );
  }

  const redirectUri = `${frontendUrl}/api/oauth/callback`;

  let siteUserId = '';
  let codeVerifier: string | undefined;

  if (stateRaw) {
    try {
      const decoded = decodeURIComponent(stateRaw);
      const parsed = JSON.parse(decoded) as Record<string, unknown>;
      if (parsed && typeof parsed === 'object') {
        if (typeof parsed.siteUserId === 'string') {
          siteUserId = parsed.siteUserId;
        }
        if (typeof parsed.cv === 'string') {
          codeVerifier = parsed.cv;
        }
      }
    } catch {
      siteUserId = decodeURIComponent(stateRaw);
    }
  }

  const errorDescription = req.nextUrl.searchParams.get('error_description');

  if (errorParam) {
    console.error(
      `CC OAuth returned error: ${errorParam}${
        errorDescription ? ` (${errorDescription})` : ''
      }`
    );
    const redirectUrl = new URL(frontendUrl);
    redirectUrl.searchParams.set('error', `cc_${errorParam}`);
    if (errorDescription) {
      redirectUrl.searchParams.set('error_description', errorDescription);
    }
    return NextResponse.redirect(redirectUrl.toString());
  }

  if (!code) {
    return NextResponse.json(
      { error: 'Missing authorization code' },
      { status: 400 }
    );
  }

  return handleCCCallback({
    code,
    codeVerifier,
    siteUserId,
    origin: frontendUrl,
    frontendUrl,
    redirectUri,
  });
}
