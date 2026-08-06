'use client';

import { SessionProvider } from 'next-auth/react';

/**
 * Makes useSession() work anywhere in the tree.
 *
 * The session is deliberately fetched client-side rather than read with auth()
 * in the root layout: awaiting the session there would opt every page —
 * including the static portfolio pages — into dynamic rendering.
 */

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
