'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { LoginForm, RegisterForm } from '../auth/AuthClient';

interface DashboardAuthPanelProps {
  redirectTo?: string;
}

/**
 * Two families of code arrive here. `unauthorized_google` / `auth_configuration`
 * come from proxy.ts and the dashboard page guards; the rest are Auth.js's own,
 * sent here because authConfig points pages.error at /dashboard.
 */
const errorMessages: Record<string, string> = {
  unauthorized_google: 'Unauthorized access detected. Use the authorized Google account to log in.',
  AccessDenied: 'That Google account is not authorized to access the dashboard.',
  auth_configuration:
    'Authentication is not configured correctly. Please check the authorized Google account settings.',
  Configuration: 'Sign-in is misconfigured on the server.',
  OAuthAccountNotLinked: 'That email is already registered with a password. Sign in with it instead.',
  OAuthSignin: 'Could not start the Google sign-in. Try again.',
  OAuthCallback: 'Google did not complete the sign-in. Try again.',
};

export default function DashboardAuthPanel({ redirectTo }: DashboardAuthPanelProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');

  const params = useSearchParams();
  const errorCode = params.get('error');
  const dashboardErrorMessage = errorCode
    ? errorMessages[errorCode] ?? 'Sign-in failed. Try again.'
    : null;

  return (
    <div className="rounded-2xl bg-gradient-to-b from-white/60 to-white/30 dark:from-neutral-900/60 dark:to-neutral-800/40 p-6 flex flex-col justify-between">
      <div>
        {dashboardErrorMessage ? (
          <div className="mb-4 rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-800 dark:border-orange-800/60 dark:bg-orange-950/20 dark:text-orange-200">
            {dashboardErrorMessage}
          </div>
        ) : null}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white">{mode === 'login' ? 'Login' : 'Register'}</h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-300">
              {mode === 'login'
                ? 'Sign in to manage your dashboard.'
                : 'Create an account to access the dashboard.'}
            </p>
          </div>

          <div className="inline-flex rounded-full border border-neutral-200 bg-white/80 p-1 dark:border-neutral-700 dark:bg-neutral-900/60">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                mode === 'login'
                  ? 'bg-neutral-950 text-white dark:bg-white dark:text-neutral-900'
                  : 'text-neutral-500 dark:text-neutral-400'
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setMode('register')}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                mode === 'register'
                  ? 'bg-neutral-950 text-white dark:bg-white dark:text-neutral-900'
                  : 'text-neutral-500 dark:text-neutral-400'
              }`}
            >
              Register
            </button>
          </div>
        </div>

        <div className="mb-4">
          {mode === 'login' ? <LoginForm redirectTo={redirectTo} /> : <RegisterForm redirectTo={redirectTo} />}
        </div>
      </div>

      <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-4">
        {mode === 'register'
          ? 'By registering you agree to the terms of use.'
          : ''}
      </div>
    </div>
  );
}
