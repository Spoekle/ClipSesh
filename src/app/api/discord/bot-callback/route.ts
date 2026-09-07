import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { connectToDatabase } from '@/lib/db';
import { AdminConfig } from '@/models/configModel';
import { signToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  const state = req.nextUrl.searchParams.get('state');

  if (!code || state !== 'bot') {
    return NextResponse.json({ error: 'Invalid request parameters' }, { status: 400 });
  }

  const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
  const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
  const origin = req.nextUrl.origin;
  const backendUrl = process.env.BACKEND_URL || origin;

  try {
    await connectToDatabase();

    const tokenResponse = await axios.post(
      'https://discord.com/api/oauth2/token',
      new URLSearchParams({
        client_id: CLIENT_ID!,
        client_secret: CLIENT_SECRET!,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: `${backendUrl}/api/discord/bot-callback`,
      }),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }
    );

    const { access_token } = tokenResponse.data;

    const userResponse = await axios.get('https://discord.com/api/v10/users/@me', {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    const discordUser = userResponse.data;

    const guildsResponse = await axios.get(
      `https://discord.com/api/v10/users/@me/guilds/506190415981051915/member`,
      { headers: { Authorization: `Bearer ${access_token}` } }
    );
    const userGuildInfo = guildsResponse.data;

    const adminRoleIds = ['564614999855595520', '506190660412375040'];
    const isAdmin = adminRoleIds.some((roleId) => userGuildInfo.roles.includes(roleId));

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'You do not have admin privileges to authenticate as bot' },
        { status: 403 }
      );
    }

    const botToken = signToken(
      {
        botId: discordUser.id,
        botUsername: discordUser.username,
        roles: ['bot', 'admin'],
      },
      process.env.BOT_TOKEN_EXPIRES_IN || '30d'
    );

    return NextResponse.json({
      success: true,
      message: 'Bot authenticated successfully',
      botToken,
      botUsername: discordUser.username,
    });
  } catch (error: any) {
    console.error('Bot callback error:', error?.response?.data || error?.message);
    return NextResponse.json({ error: 'Failed to authenticate bot' }, { status: 500 });
  }
}
