import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
  const siteUserId = req.nextUrl.searchParams.get('siteUserId') || '';
  const state = encodeURIComponent(
    JSON.stringify({ provider: 'discord', siteUserId: siteUserId || undefined })
  );

  const frontendUrl = (process.env.FRONTEND_URL || '').replace(/\/+$/, '');
  if (!frontendUrl) {
    return NextResponse.json(
      { error: 'FRONTEND_URL environment variable is not configured' },
      { status: 500 }
    );
  }

  const redirectUri = `${frontendUrl}/api/oauth/callback`;

  if (!CLIENT_ID) {
    return NextResponse.redirect(`${frontendUrl}?error=discord_not_configured`);
  }

  const discordAuthUrl = `https://discord.com/oauth2/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&scope=identify+guilds.members.read+email&state=${state}&prompt=none`;

  return NextResponse.redirect(discordAuthUrl);
}
