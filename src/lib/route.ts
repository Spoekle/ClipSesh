import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { requireAuth, type DecodedUser } from '@/lib/auth';

type RouteParams = Record<string, string | string[] | undefined>;

interface RouteContext<P extends RouteParams> {
  params: Promise<P>;
}

type RouteHandler<P extends RouteParams> = (
  req: NextRequest,
  ctx: RouteContext<P>
) => Promise<Response>;

interface RouteOptions {
  /** Return the thrown error's message instead of a generic 500 message (admin tooling). */
  exposeErrors?: boolean;
}

/** Every role a signed-in user can have; use when any authenticated user may call a route. */
export const ANY_ROLE = ['user', 'clipteam', 'editor', 'uploader', 'admin'] as const;

function toErrorResponse(req: NextRequest, error: unknown, options?: RouteOptions): NextResponse {
  console.error(`[${req.method} ${req.nextUrl.pathname}]`, error);
  const message =
    options?.exposeErrors && error instanceof Error ? error.message : 'Internal Server Error';
  return NextResponse.json({ error: message }, { status: 500 });
}

/**
 * Wraps a public API route handler: connects to MongoDB first and turns uncaught
 * errors into a logged 500 JSON response.
 *
 * @example
 * export const GET = apiRoute(async (req) => {
 *   const config = await PublicConfig.findOne().lean();
 *   return NextResponse.json(config);
 * });
 */
export function apiRoute<P extends RouteParams = RouteParams>(
  handler: RouteHandler<P>,
  options?: RouteOptions
): RouteHandler<P> {
  return async (req, ctx) => {
    try {
      await connectToDatabase();
      return await handler(req, ctx);
    } catch (error) {
      return toErrorResponse(req, error, options);
    }
  };
}

/**
 * Like {@link apiRoute}, but rejects requests without a valid token (401) or without
 * one of `roles` (403; an empty list allows any signed-in user) before touching the
 * database, and passes the signed-in user on.
 *
 * @example
 * export const PUT = authRoute(['admin'], async (req, { params, user }) => {
 *   const { id } = await params;
 *   return NextResponse.json({ id, by: user.username });
 * });
 */
export function authRoute<P extends RouteParams = RouteParams>(
  roles: readonly string[],
  handler: (req: NextRequest, ctx: RouteContext<P> & { user: DecodedUser }) => Promise<Response>,
  options?: RouteOptions
): RouteHandler<P> {
  return async (req, ctx) => {
    const auth = requireAuth(req, roles);
    if (auth.errorResponse) return auth.errorResponse;
    try {
      await connectToDatabase();
      return await handler(req, { ...ctx, user: auth.user });
    } catch (error) {
      return toErrorResponse(req, error, options);
    }
  };
}
