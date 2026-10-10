import { NextRequest, NextResponse } from 'next/server';
import { handleCCCallback, handleDiscordCallback } from '@/lib/oauthHandlers';

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  const errorParam = req.nextUrl.searchParams.get('error');
  const stateRaw = req.nextUrl.searchParams.get('state') || '';
  const providerParam = req.nextUrl.searchParams.get('provider');

  const frontendUrl = (process.env.FRONTEND_URL || '').replace(/\/+$/, '');
  if (!frontendUrl) {
    return NextResponse.json(
      { error: 'FRONTEND_URL environment variable is not configured' },
      { status: 500 }
    );
  }

  const redirectUri = `${frontendUrl}/api/oauth/callback`;

  let provider: 'cc' | 'discord' = 'cc';
  let siteUserId = '';
  let codeVerifier: string | undefined;

  if (providerParam === 'discord' || providerParam === 'cc' || providerParam === 'cube') {
    provider = providerParam === 'discord' ? 'discord' : 'cc';
  }

  if (stateRaw) {
    try {
      const decoded = decodeURIComponent(stateRaw);
      const parsed = JSON.parse(decoded) as Record<string, unknown>;
      if (parsed && typeof parsed === 'object') {
        if (parsed.provider === 'discord') {
          provider = 'discord';
        } else if (parsed.provider === 'cc' || parsed.provider === 'cube') {
          provider = 'cc';
        }
        if (typeof parsed.siteUserId === 'string') {
          siteUserId = parsed.siteUserId;
        }
        if (typeof parsed.cv === 'string') {
          codeVerifier = parsed.cv;
        }
      }
    } catch {
      // Handle legacy or non-JSON string states
      if (stateRaw.toLowerCase().includes('discord')) {
        provider = 'discord';
      } else {
        siteUserId = decodeURIComponent(stateRaw);
      }
    }
  }

  const errorDescription = req.nextUrl.searchParams.get('error_description');

  if (errorParam) {
    console.error(
      `${provider} OAuth returned error: ${errorParam}${
        errorDescription ? ` (${errorDescription})` : ''
      }`
    );
    const redirectUrl = new URL(frontendUrl);
    redirectUrl.searchParams.set('error', `${provider}_${errorParam}`);
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

  if (provider === 'discord') {
    return handleDiscordCallback({
      code,
      siteUserId,
      origin: frontendUrl,
      frontendUrl,
      redirectUri,
    });
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
