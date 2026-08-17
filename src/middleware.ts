import NextAuth from 'next-auth';
import type { NextAuthRequest } from 'next-auth';
import type { NextFetchEvent, NextRequest } from 'next/server';
import { authConfig } from './auth.config';

/**
 * Runs on the Edge runtime, so it uses the database-free half of the config.
 * The routing rules themselves live in authConfig.callbacks.authorized, which
 * either returns a redirect or lets the request through.
 */

const { auth } = NextAuth(authConfig);

// Wrapped in a plain function declaration because Next.js checks statically
// that this file exports one; `export const { auth: middleware }` does not
// register as such.
// The parameters are annotated so this picks the middleware overload of auth()
// rather than the route-handler one; the body is empty because authorized()
// has already made the decision by the time it runs.
const authProxy = auth((_request: NextAuthRequest, _event: NextFetchEvent) => undefined);

export function middleware(request: NextRequest, event: NextFetchEvent) {
  return authProxy(request, event);
}

export const config = {
  // Only the routes whose access depends on a session. Everything else skips
  // the middleware entirely, including /api/auth/* — which must never be
  // intercepted, or the sign-in callbacks break.
  matcher: ['/dashboard/:path*', '/auth'],
};
