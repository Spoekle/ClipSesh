import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import bcrypt from 'bcrypt';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/userModel';
import { signToken } from '@/lib/auth';

const ROLE_PRIORITY = [
  { id: '564614999855595520', role: 'admin' },
  { id: '506190660412375040', role: 'admin' },
  { id: '528492877932658693', role: 'editor' },
  { id: '889451337182502942', role: 'clipteam' },
];

function determineUserRoles(userRoles: string[]): string[] {
  const roles = ['user'];
  ROLE_PRIORITY.forEach(({ id, role }) => {
    if (userRoles.includes(id)) {
      roles.push(role);
    }
  });
  return roles;
}

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  const stateRaw = req.nextUrl.searchParams.get('state') || '';
  const state = decodeURIComponent(stateRaw);

  const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
  const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
  const origin = req.nextUrl.origin;
  const backendUrl = process.env.BACKEND_URL || origin;
  const frontendUrl = process.env.FRONTEND_URL || origin;

  if (!code) {
    return NextResponse.json({ error: 'Invalid request parameters' }, { status: 400 });
  }

  try {
    await connectToDatabase();

    const tokenResponse = await axios.post(
      'https://discord.com/api/oauth2/token',
      new URLSearchParams({
        client_id: CLIENT_ID!,
        client_secret: CLIENT_SECRET!,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: `${backendUrl}/api/discord/callback`,
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

    let userGuildRoles: string[] = [];
    try {
      const guildsResponse = await axios.get(
        `https://discord.com/api/v10/users/@me/guilds/506190415981051915/member`,
        { headers: { Authorization: `Bearer ${access_token}` } }
      );
      userGuildRoles = guildsResponse.data.roles || [];
    } catch {
      // User may not be in guild
    }

    const assignedRoles = determineUserRoles(userGuildRoles);
    const profilePic = `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}`;

    // Check if Discord account already linked
    let existingUser = await User.findOne({ discordId: discordUser.id });
    if (existingUser) {
      existingUser.profilePicture = profilePic;
      await existingUser.save();

      if (existingUser.status !== 'active') {
        return NextResponse.redirect(`${frontendUrl}?error=inactive`);
      }

      const token = signToken({
        id: existingUser._id,
        username: existingUser.username,
        roles: existingUser.roles,
      });
      return NextResponse.redirect(`${frontendUrl}?token=${encodeURIComponent(token)}`);
    }

    // Link Discord to an existing user if state provided
    if (state && state !== 'undefined') {
      const user = await User.findById(state);
      if (user) {
        user.discordId = discordUser.id;
        user.discordUsername = discordUser.global_name || discordUser.username;
        if (discordUser.email) user.email = discordUser.email;
        user.profilePicture = profilePic;
        user.roles = assignedRoles;
        await user.save();

        if (user.status !== 'active') {
          return NextResponse.redirect(`${frontendUrl}?error=inactive`);
        }

        const token = signToken({
          id: user._id,
          username: user.username,
          roles: user.roles,
        });
        return NextResponse.redirect(`${frontendUrl}?token=${encodeURIComponent(token)}`);
      }
    }

    // Create a new user based on Discord account
    const username = discordUser.global_name || discordUser.username;
    const hashedPassword = await bcrypt.hash(username + discordUser.id, 10);
    const newUser = new User({
      username,
      email: discordUser.email,
      password: hashedPassword,
      discordId: discordUser.id,
      discordUsername: username,
      profilePicture: profilePic,
      status: 'active',
      roles: assignedRoles,
    });
    await newUser.save();

    const token = signToken({
      id: newUser._id,
      username: newUser.username,
      roles: newUser.roles,
    });
    return NextResponse.redirect(`${frontendUrl}?token=${encodeURIComponent(token)}`);
  } catch (error: any) {
    console.error('Error in Discord callback:', error?.response?.data || error?.message);
    return NextResponse.redirect(`${frontendUrl}?error=discord_auth_failed`);
  }
}
