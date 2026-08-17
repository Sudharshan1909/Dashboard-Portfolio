import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { authConfig, AUTHORIZED_EMAIL, isAuthorizedEmail } from './auth.config';
import connectDB from './lib/mongodb';
import User from './models/User';

/**
 * Node-only half of the auth config. Adds the Credentials provider, which needs
 * the database and bcrypt — neither of which can run on the Edge runtime that
 * middleware uses. See auth.config.ts.
 */

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  // Sessions expire in 30s so the session/cookies are cleared each time the
  // user accesses /dashboard/home — a fresh login is required on each visit.
  // Short enough to be non-persistent, long enough for the login redirect flow.
  session: { strategy: 'jwt', maxAge: 30 },
  jwt: {
    maxAge: 30,
  },
  providers: [
    ...authConfig.providers,
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? '').toLowerCase().trim();
        const password = String(credentials?.password ?? '');

        if (!email || !password) return null;

        try {
          await connectDB();
        } catch (error) {
          console.error('[auth][authorize] MongoDB connection failed:', error);
          return null;
        }

        // passwordHash is select:false on the schema, so ask for it explicitly.
        const user = await User.findOne({ email }).select('+passwordHash');

        // A Google-only account has no passwordHash — reject rather than crash.
        if (!user?.passwordHash) return null;

        const passwordMatches = await bcrypt.compare(password, user.passwordHash);
        if (!passwordMatches) return null;

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,

    async redirect({ url, baseUrl }) {
      // Auth.js hands relative targets through as-is — signOut({callbackUrl:'/'})
      // arrives here as a bare "/". Testing startsWith(baseUrl) missed those and
      // dropped them on the dashboard fallback, which is how signing out landed
      // you back in the workspace instead of on the home page.
      if (url.startsWith('/')) return `${baseUrl}${url}`;

      // Same-origin absolute URLs are fine. Compare parsed origins rather than
      // string prefixes, or "http://localhost:3000.example.com" would pass.
      try {
        if (new URL(url).origin === baseUrl) return url;
      } catch {
        // Unparseable — fall through to the safe default.
      }

      return `${baseUrl}/dashboard/home`;
    },

    /**
     * Google sign-in is deliberately stateless: nothing is written to MongoDB.
     * The allowlist below is the whole check, and the resulting session carries
     * the name/image/email straight from Google's profile — which is all the
     * dashboard renders. Because this path never opens a database connection,
     * Google sign-in keeps working even when Atlas is unreachable.
     *
     * Credentials sign-in still needs the database, but that read lives in
     * authorize() above, not here.
     */
    async signIn({ user }) {
      const email = user.email?.toLowerCase();
      if (!email) return false;

      // Applies to both providers, so an unauthorized account never receives a
      // session at all. That leaves the middleware's matching check as
      // defence-in-depth against a stale JWT rather than the only gate.
      if (!AUTHORIZED_EMAIL) {
        console.error('[auth][signIn] AUTHORIZED_GOOGLE_EMAIL is not configured.');
        return false;
      }

      if (!isAuthorizedEmail(email)) {
        console.warn('[auth][signIn] unauthorized login attempt:', email);
        return false;
      }

      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },

    async session({ session, token }) {
      if (token.id && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
