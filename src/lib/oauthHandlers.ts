import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users, type UserRow } from '@/db/schema';
import { parseRoles } from '@/db/queries';
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

    // Fields to fill in when a CC login is linked to an existing site user.
    const linkUpdate = (user: UserRow, linkEmail: boolean): Partial<typeof users.$inferInsert> => {
      const update: Partial<typeof users.$inferInsert> = { ccId: ccUser.sub, ccUsername };
      if (discordId && !user.discordId) update.discordId = discordId;
      if (discordUsername && !user.discordUsername && (user.discordId ?? discordId) === discordId) {
        update.discordUsername = discordUsername;
      }
      if (linkEmail && ccUser.email && !user.email) update.email = ccUser.email.toLowerCase();
      if (ccUser.picture && (!user.profilePicture || user.profilePicture.includes('placeholder'))) {
        update.profilePicture = ccUser.picture;
      }
      return update;
    };

    const signInLinkedUser = async (user: UserRow, linkEmail: boolean) => {
      const [saved] = await db
        .update(users)
        .set(linkUpdate(user, linkEmail))
        .where(eq(users._id, user._id))
        .returning();
      if (saved.status !== 'active') {
        return NextResponse.redirect(`${frontendUrl}?error=inactive`);
      }
      const token = signToken({
        id: saved._id,
        username: saved.username,
        roles: saved.roles,
        ccId: saved.ccId ?? undefined,
        discordId: saved.discordId ?? undefined,
      });
      return NextResponse.redirect(`${frontendUrl}?token=${encodeURIComponent(token)}`);
    };

    // 3. Check if user with this ccId already exists
    const [existingUser] = await db.select().from(users).where(eq(users.ccId, ccUser.sub));
    if (existingUser) {
      return signInLinkedUser(existingUser, false);
    }

    // 4. Link CC account to an existing user if siteUserId was provided
    if (siteUserId && siteUserId !== 'undefined') {
      const [user] = await db.select().from(users).where(eq(users._id, siteUserId));
      if (user) {
        return signInLinkedUser(user, true);
      }
    }

    // 5. Match by discordId if user previously registered with Discord
    if (discordId) {
      const [userByDiscord] = await db.select().from(users).where(eq(users.discordId, discordId));
      if (userByDiscord) {
        return signInLinkedUser(userByDiscord, false);
      }
    }

    // 6. Match by verified email if available
    if (ccUser.email) {
      const [userByEmail] = await db
        .select()
        .from(users)
        .where(eq(users.email, ccUser.email.toLowerCase()));
      if (userByEmail) {
        return signInLinkedUser(userByEmail, false);
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
    while ((await db.select({ _id: users._id }).from(users).where(eq(users.username, username))).length > 0) {
      username = `${baseUsername}_${counter}`;
      counter++;
    }

    const hashedPassword = await hashPassword(username + ccUser.sub);
    const [newUser] = await db
      .insert(users)
      .values({
        username,
        email: ccUser.email ? ccUser.email.toLowerCase() : null,
        password: hashedPassword,
        ccId: ccUser.sub,
        ccUsername,
        discordId: discordId || null,
        discordUsername: discordUsername || null,
        profilePicture: profilePic,
        status: 'active',
        roles: parseRoles(assignedRoles) ?? ['user'],
      })
      .returning();

    const token = signToken({
      id: newUser._id,
      username: newUser.username,
      roles: newUser.roles,
      ccId: newUser.ccId ?? undefined,
      discordId: newUser.discordId ?? undefined,
    });
    return NextResponse.redirect(`${frontendUrl}?token=${encodeURIComponent(token)}`);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error in CC OAuth callback:', message);
    return NextResponse.redirect(`${frontendUrl}?error=cc_auth_failed`);
  }
}


