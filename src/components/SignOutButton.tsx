'use client';

import { signOut } from 'next-auth/react';
import { useState } from 'react';

export default function SignOutButton({ className = '' }: { className?: string }) {
  const [loading, setLoading] = useState(false);

  // Sending them home rather than to /dashboard avoids landing on a page the
  // middleware is about to redirect away from.
  const handleClick = () => {
    setLoading(true);
    signOut({ callbackUrl: '/' }).catch(() => setLoading(false));
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={`rounded-xl border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-100 disabled:opacity-60 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800 ${className}`}
    >
      {loading ? 'Signing out...' : 'Sign out'}
    </button>
  );
}
