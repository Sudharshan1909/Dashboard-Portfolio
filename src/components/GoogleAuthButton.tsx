'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { GoogleIcon } from '@/components/SimpleIcons';

export function AuthDivider({ label = 'or' }: { label?: string }) {
  return (
    <div className="my-4 flex items-center gap-3">
      <span className="h-px flex-1 bg-neutral-200 dark:bg-neutral-700" />
      <span className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">{label}</span>
      <span className="h-px flex-1 bg-neutral-200 dark:bg-neutral-700" />
    </div>
  );
}

interface GoogleAuthButtonProps {
  label?: string;
  redirectTo?: string;
}

export default function GoogleAuthButton({
  label = 'Continue with Google',
  redirectTo = '/dashboard/home',
}: GoogleAuthButtonProps) {
  const [loading, setLoading] = useState(false);

  // Full-page redirect to Google, so `loading` stays true until we leave.
  const handleClick = () => {
    setLoading(true);
    const callbackUrl = `${window.location.origin}${redirectTo}`;
    signIn('google', { callbackUrl }).catch(() => setLoading(false));
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="flex w-full items-center justify-center gap-3 rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm font-semibold text-neutral-800 transition hover:bg-neutral-50 disabled:opacity-60 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800"
    >
      <GoogleIcon />
      {loading ? 'Connecting...' : label}
    </button>
  );
}
