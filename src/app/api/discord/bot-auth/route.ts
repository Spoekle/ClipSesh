import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  const backendUrl = process.env.BACKEND_URL || origin;
  const redirectUri = `${backendUrl}/api/discord/bot-callback`;

  const discordBotAuthUrl = `https://discord.com/oauth2/authorize?client_id=1265824671224561766&response_type=code&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&scope=identify+guilds.members.read+email&state=bot`;

  return NextResponse.redirect(discordBotAuthUrl);
}
