import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
  const siteUserId = req.nextUrl.searchParams.get('siteUserId') || '';
  const state = encodeURIComponent(siteUserId);

  const origin = req.nextUrl.origin;
  const backendUrl = process.env.BACKEND_URL || origin;
  const redirectUri = `${backendUrl}/api/discord/callback`;

  const discordAuthUrl = `https://discord.com/oauth2/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&scope=identify+guilds.members.read+email&state=${state}&prompt=none`;

  return NextResponse.redirect(discordAuthUrl);
}
