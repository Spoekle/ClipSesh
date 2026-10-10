import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/userModel';
import { signToken, hashPassword } from '@/lib/auth';

export interface OAuthCallbackParams {
  code: string;
  codeVerifier?: string;
  siteUserId: string;
  origin: string;
  frontendUrl: string;
  redirectUri: string;
}

interface CCLinkedAccount {
  provider: string;
  id: string;
  username?: string;
}

interface CCGameAccount {
  platform: string;
  id: string;
  name?: string;
}

interface CCUserInfo {
  sub: string;
  name?: string | null;
  preferred_username?: string | null;
  picture?: string | null;
  discord_id?: string | null;
  email?: string | null;
  email_verified?: boolean | null;
  given_name?: string | null;
  family_name?: string | null;
  linked_accounts?: CCLinkedAccount[] | null;
  game_account?: CCGameAccount | null;
  groups?: string[] | null;
}

interface CCTokenResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
  refresh_token?: string;
  id_token?: string;
}



const DISCORD_ROLE_PRIORITY = [
  { id: '564614999855595520', role: 'admin' },
  { id: '506190660412375040', role: 'admin' },
  { id: '528492877932658693', role: 'editor' },
  { id: '889451337182502942', role: 'clipteam' },
];

/**
 * Maps Discord guild role IDs to internal ClipSesh user roles.
 *
 * @example
 * ```ts
 * const roles = determineDiscordRoles(['564614999855595520']);
 * // ['user', 'admin']
 * ```
 */
export function determineDiscordRoles(userRoles: string[]): string[] {
  const roles = ['user'];
  DISCORD_ROLE_PRIORITY.forEach(({ id, role }) => {
    if (userRoles.includes(id)) {
      roles.push(role);
    }
  });
  return roles;
}

/**
 * Safely decodes claims from an OpenID Connect ID token JWT without requiring an external library.
 *
 * @example
 * ```ts
 * const claims = parseIdToken('header.payload.signature');
 * console.log(claims.sub);
 * ```
 */
export function parseIdToken(idToken: string): Record<string, unknown> {
  try {
    const parts = idToken.split('.');
    if (parts.length === 3) {
      const payload = Buffer.from(parts[1], 'base64url').toString('utf8');
      const parsed = JSON.parse(payload) as unknown;
      if (parsed && typeof parsed === 'object') {
        return parsed as Record<string, unknown>;
      }
    }
  } catch {
    // Ignore invalid id_token payload parsing
  }
  return {};
}

/**
 * Handles the OAuth authorization code exchange and user session creation for CC.
 *
 * @example
 * ```ts
 * const response = await handleCCCallback({
 *   code: 'cc_auth_code',
 *   codeVerifier: 'pkce_verifier_string',
 *   siteUserId: '',
 *   origin: 'http://localhost:3000',
 *   frontendUrl: 'http://localhost:3000',
 *   redirectUri: 'http://localhost:3000/api/oauth/callback',
 * });
 * ```
 */
export async function handleCCCallback({
  code,
  codeVerifier,
  siteUserId,
  frontendUrl,
  redirectUri,
}: OAuthCallbackParams): Promise<NextResponse> {
  const CLIENT_ID = process.env.CC_CLIENT_ID;
  const CLIENT_SECRET = process.env.CC_CLIENT_SECRET;
  const rawBase = (process.env.CC_BASE_URL || 'https://cube.community')
    .replace(/\/api\/auth\/?$/, '')
    .replace(/\/+$/, '');
  const CC_AUTH_BASE = `${rawBase}/api/auth`;

  if (!CLIENT_ID || !CLIENT_SECRET) {
    return NextResponse.json(
      { error: 'CC OAuth credentials not configured' },
      { status: 500 }
    );
  }

  try {
    await connectToDatabase();

    // 1. Exchange authorization code for access token (and ID token)
    // Client is registered for client_secret_basic: credentials must be sent via Authorization header
    const basicAuth = Buffer.from(
      `${encodeURIComponent(CLIENT_ID)}:${encodeURIComponent(CLIENT_SECRET)}`
    ).toString('base64');

    const tokenParams = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    });
    if (codeVerifier) {
      tokenParams.set('code_verifier', codeVerifier);
    }

    const tokenResponse = await fetch(`${CC_AUTH_BASE}/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${basicAuth}`,
      },
      body: tokenParams.toString(),
    });

    if (!tokenResponse.ok) {
      const errText = await tokenResponse.text();
      throw new Error(`CC token exchange failed (${tokenResponse.status}): ${errText}`);
    }

    const tokenData = (await tokenResponse.json()) as CCTokenResponse;
    if (!tokenData.access_token) {
      throw new Error('No access_token returned by CC');
    }

    // 2. Fetch authenticated user profile & parse id_token claims
    const idTokenClaims = tokenData.id_token ? parseIdToken(tokenData.id_token) : {};

    let userinfoData: Partial<CCUserInfo> = {};
    try {
      const userinfoResponse = await fetch(`${CC_AUTH_BASE}/oauth2/userinfo`, {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      if (userinfoResponse.ok) {
        userinfoData = (await userinfoResponse.json()) as Partial<CCUserInfo>;
      } else {
        console.warn(
          `CC userinfo returned ${userinfoResponse.status}, falling back to id_token claims`
        );
      }
    } catch (userinfoErr) {
      console.warn('Error fetching CC userinfo:', userinfoErr);
    }

    // Merge id_token claims and userinfo (both carry identical claims per CC OIDC spec)
    const rawUser = { ...idTokenClaims, ...userinfoData };
    const sub = typeof rawUser.sub === 'string' ? rawUser.sub : '';
    if (!sub) {
      throw new Error('CC user profile missing sub identifier');
    }

    const ccUser: CCUserInfo = {
      sub,
      name: typeof rawUser.name === 'string' ? rawUser.name : null,
      preferred_username:
        typeof rawUser.preferred_username === 'string' ? rawUser.preferred_username : null,
      picture: typeof rawUser.picture === 'string' ? rawUser.picture : null,
      discord_id: typeof rawUser.discord_id === 'string' ? rawUser.discord_id : null,
      email: typeof rawUser.email === 'string' ? rawUser.email : null,
      email_verified:
        typeof rawUser.email_verified === 'boolean' ? rawUser.email_verified : null,
      linked_accounts: Array.isArray(rawUser.linked_accounts)
        ? (rawUser.linked_accounts as CCLinkedAccount[])
        : null,
      game_account:
        rawUser.game_account && typeof rawUser.game_account === 'object'
          ? (rawUser.game_account as CCGameAccount)
          : null,
      groups: Array.isArray(rawUser.groups) ? (rawUser.groups as string[]) : null,
    };

    const ccUsername =
      ccUser.name || ccUser.preferred_username || `cc_${ccUser.sub.slice(0, 6)}`;
    const profilePic = ccUser.picture || '/profilePictures/profile_placeholder.png';

    // Extract Discord account info if linked on CC (from discord_id claim or linked_accounts)
    const linkedDiscord = Array.isArray(ccUser.linked_accounts)
      ? ccUser.linked_accounts.find((acc) => acc.provider?.toLowerCase() === 'discord')
      : undefined;
    const discordId = ccUser.discord_id || linkedDiscord?.id;
    const discordUsername =
      linkedDiscord?.username ||
      (discordId ? (ccUser.preferred_username || ccUsername) : undefined);

    // 3. Check if user with this ccId already exists
    const existingUser = await User.findOne({ ccId: ccUser.sub });
    if (existingUser) {
      existingUser.ccUsername = ccUsername;
      if (discordId && !existingUser.discordId) {
        existingUser.discordId = discordId;
        if (discordUsername && !existingUser.discordUsername) {
          existingUser.discordUsername = discordUsername;
        }
      }
      if (ccUser.picture && (!existingUser.profilePicture || existingUser.profilePicture.includes('placeholder'))) {
        existingUser.profilePicture = ccUser.picture;
      }
      await existingUser.save();

      if (existingUser.status !== 'active') {
        return NextResponse.redirect(`${frontendUrl}?error=inactive`);
      }

      const token = signToken({
        id: existingUser._id.toString(),
        username: existingUser.username,
        roles: existingUser.roles,
        ccId: existingUser.ccId,
        discordId: existingUser.discordId,
      });
      return NextResponse.redirect(`${frontendUrl}?token=${encodeURIComponent(token)}`);
    }

    // 4. Link CC account to an existing user if siteUserId was provided
    if (siteUserId && siteUserId !== 'undefined') {
      const user = await User.findById(siteUserId);
      if (user) {
        user.ccId = ccUser.sub;
        user.ccUsername = ccUsername;
        if (discordId && !user.discordId) {
          user.discordId = discordId;
          if (discordUsername && !user.discordUsername) {
            user.discordUsername = discordUsername;
          }
        }
        if (ccUser.email && !user.email) {
          user.email = ccUser.email.toLowerCase();
        }
        if (ccUser.picture && (!user.profilePicture || user.profilePicture.includes('placeholder'))) {
          user.profilePicture = ccUser.picture;
        }
        await user.save();

        if (user.status !== 'active') {
          return NextResponse.redirect(`${frontendUrl}?error=inactive`);
        }

        const token = signToken({
          id: user._id.toString(),
          username: user.username,
          roles: user.roles,
          ccId: user.ccId,
          discordId: user.discordId,
        });
        return NextResponse.redirect(`${frontendUrl}?token=${encodeURIComponent(token)}`);
      }
    }

    // 5. Match by discordId if user previously registered with Discord
    if (discordId) {
      const userByDiscord = await User.findOne({ discordId });
      if (userByDiscord) {
        userByDiscord.ccId = ccUser.sub;
        userByDiscord.ccUsername = ccUsername;
        if (discordUsername && !userByDiscord.discordUsername) {
          userByDiscord.discordUsername = discordUsername;
        }
        if (ccUser.picture && (!userByDiscord.profilePicture || userByDiscord.profilePicture.includes('placeholder'))) {
          userByDiscord.profilePicture = ccUser.picture;
        }
        await userByDiscord.save();

        if (userByDiscord.status !== 'active') {
          return NextResponse.redirect(`${frontendUrl}?error=inactive`);
        }

        const token = signToken({
          id: userByDiscord._id.toString(),
          username: userByDiscord.username,
          roles: userByDiscord.roles,
          ccId: userByDiscord.ccId,
          discordId: userByDiscord.discordId,
        });
        return NextResponse.redirect(`${frontendUrl}?token=${encodeURIComponent(token)}`);
      }
    }

    // 6. Match by verified email if available
    if (ccUser.email) {
      const userByEmail = await User.findOne({ email: ccUser.email.toLowerCase() });
      if (userByEmail) {
        userByEmail.ccId = ccUser.sub;
        userByEmail.ccUsername = ccUsername;
        if (discordId && !userByEmail.discordId) {
          userByEmail.discordId = discordId;
          if (discordUsername && !userByEmail.discordUsername) {
            userByEmail.discordUsername = discordUsername;
          }
        }
        if (ccUser.picture && (!userByEmail.profilePicture || userByEmail.profilePicture.includes('placeholder'))) {
          userByEmail.profilePicture = ccUser.picture;
        }
        await userByEmail.save();

        if (userByEmail.status !== 'active') {
          return NextResponse.redirect(`${frontendUrl}?error=inactive`);
        }

        const token = signToken({
          id: userByEmail._id.toString(),
          username: userByEmail.username,
          roles: userByEmail.roles,
          ccId: userByEmail.ccId,
          discordId: userByEmail.discordId,
        });
        return NextResponse.redirect(`${frontendUrl}?token=${encodeURIComponent(token)}`);
      }
    }

    // Check Discord guild roles if bot token is available
    let assignedRoles = ['user'];
    if (discordId && process.env.DISCORD_BOT_TOKEN) {
      try {
        const guildMemberResponse = await fetch(
          `https://discord.com/api/v10/guilds/506190415981051915/members/${discordId}`,
          { headers: { Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}` } }
        );
        if (guildMemberResponse.ok) {
          const memberData = (await guildMemberResponse.json()) as { roles?: string[] };
          if (Array.isArray(memberData.roles)) {
            assignedRoles = determineDiscordRoles(memberData.roles);
          }
        }
      } catch {
        // Guild check failed or member not in guild
      }
    }

    // 7. Create a new user for CC account
    let baseUsername = (ccUser.name || ccUser.preferred_username || 'cc_user')
      .trim()
      .replace(/[^a-zA-Z0-9_-]/g, '_');
    if (!baseUsername) baseUsername = 'cc_user';
    let username = baseUsername;
    let counter = 1;
    while (await User.exists({ username })) {
      username = `${baseUsername}_${counter}`;
      counter++;
    }

    const hashedPassword = await hashPassword(username + ccUser.sub);
    const newUser = new User({
      username,
      email: ccUser.email ? ccUser.email.toLowerCase() : undefined,
      password: hashedPassword,
      ccId: ccUser.sub,
      ccUsername,
      discordId: discordId || undefined,
      discordUsername: discordUsername || undefined,
      profilePicture: profilePic,
      status: 'active',
      roles: assignedRoles,
    });
    await newUser.save();

    const token = signToken({
      id: newUser._id.toString(),
      username: newUser.username,
      roles: newUser.roles,
      ccId: newUser.ccId,
      discordId: newUser.discordId,
    });
    return NextResponse.redirect(`${frontendUrl}?token=${encodeURIComponent(token)}`);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error in CC OAuth callback:', message);
    return NextResponse.redirect(`${frontendUrl}?error=cc_auth_failed`);
  }
}


