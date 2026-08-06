import type { DefaultSession } from 'next-auth';

/**
 * auth.ts copies the Mongo _id onto the token and then onto the session, so
 * `session.user.id` is always the database id — not whatever the provider used.
 */

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
  }
}
