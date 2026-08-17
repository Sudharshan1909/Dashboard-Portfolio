import Google from 'next-auth/providers/google';
import type { NextAuthConfig } from 'next-auth';

export const AUTHORIZED_EMAIL = process.env.AUTHORIZED_GOOGLE_EMAIL?.toLowerCase().trim();

/**
 * Edge-safe half of the auth config.
 *
 * middleware.ts runs on the Edge runtime, where Mongoose cannot load — so this
 * file must never import the database. The Credentials provider (which does hit
 * the DB) is added in auth.ts, which only runs in Node.
 */

/**
 * The dashboard is a single-account admin surface. This is the one place that
 * decides who gets in; auth.ts, the middleware and the dashboard pages all defer to
 * it, because when they each spelled the rule out themselves they drifted apart
 * and produced a redirect loop.
 *
 * Despite the env var's name it gates credentials sign-in too, not just Google.
 * An unset var denies everyone rather than admitting everyone.
 */
export function isAuthorizedEmail(email?: string | null): boolean {
  if (!AUTHORIZED_EMAIL) return false;
  return email?.toLowerCase().trim() === AUTHORIZED_EMAIL;
}

// Routes that are the sign-in surface itself. Visiting one while already signed
// in bounces you to the dashboard.
const authRoutes = ['/auth'];

// Everything under here requires a session.
const protectedPrefix = '/dashboard/';

export const authConfig = {
  trustHost: true,
  pages: {
    signIn: '/dashboard',
    // Failed sign-ins — an unauthorized Google account above all — land on
    // /dashboard, which is itself the sign-in surface and renders the reason
    // via DashboardAuthPanel. Previously this pointed at /login, which then
    // bounced to /dashboard client-side after the page had already painted.
    error: '/dashboard',
  },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID ?? process.env.GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET ?? process.env.GOOGLE_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = Boolean(auth?.user);
      const { pathname } = nextUrl;

      if (pathname.startsWith(protectedPrefix)) {
        if (!isLoggedIn) {
          const loginUrl = new URL('/dashboard', nextUrl);
          loginUrl.searchParams.set('callbackUrl', pathname);
          return Response.redirect(loginUrl);
        }

        if (!isAuthorizedEmail(auth?.user?.email)) {
          // Deliberately /dashboard and not /login: a signed-in visitor sent to
          // /login gets bounced back here, and round it goes. /dashboard is
          // public and renders the reason, so the redirect terminates.
          const deniedUrl = new URL('/dashboard', nextUrl);
          deniedUrl.searchParams.set(
            'error',
            AUTHORIZED_EMAIL ? 'unauthorized_google' : 'auth_configuration',
          );
          return Response.redirect(deniedUrl);
        }

        return true;
      }

      // Signed-in visitors have no use for the sign-in pages — but only forward
      // the ones who can actually get in, or this hands them straight back to
      // the branch above.
      if (isLoggedIn && authRoutes.includes(pathname) && isAuthorizedEmail(auth?.user?.email)) {
        return Response.redirect(new URL('/dashboard/home', nextUrl));
      }

      return true;
    },
  },
} satisfies NextAuthConfig;
