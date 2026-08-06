'use client';

import { signIn } from 'next-auth/react';
import { useSearchParams, useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import GoogleAuthButton, { AuthDivider } from '@/components/GoogleAuthButton';

/**
 * The credentials forms, shared by /login, /register, /auth and the dashboard
 * panel. Google sign-in lives in GoogleAuthButton.
 */

// The workspace itself, not /dashboard — /dashboard is the signed-out sign-in
// surface and would only bounce an authorized user straight here anyway.
const DEFAULT_REDIRECT = '/dashboard/home';
const inputClass =
  'w-full rounded-xl border border-neutral-300 bg-transparent px-4 py-3 text-sm outline-none focus:ring-0 dark:border-neutral-700 dark:text-white';
const labelClass = 'mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-200';
const submitClass =
  'w-full rounded-xl bg-neutral-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-neutral-700 disabled:opacity-60 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200';

/**
 * Auth.js reports a rejected password and a provider that blew up (an
 * unreachable database, say) through the same `error` field. Only the first is
 * the user's fault, so don't tell them their password is wrong when it isn't.
 */
function signInErrorMessage(code: string | undefined) {
  if (code === 'CredentialsSignin') return 'Wrong email or password.';
  // The password was right but the account is not the allowlisted one. Saying
  // "could not reach the database" here would send you chasing the wrong fault.
  if (code === 'AccessDenied') return 'This account is not authorized to access the dashboard.';
  return 'Sign-in is unavailable right now — the server could not reach the database.';
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null;

  return (
    <p
      role="alert"
      className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
    >
      {message}
    </p>
  );
}

export function LoginForm({ redirectTo }: { redirectTo?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // redirect:false so a failed sign-in stays here with the typed email
      // intact, instead of bouncing to Auth.js's own error page.
      const result = await signIn('credentials', { email, password, redirect: false });

      if (!result || result.error) {
        setError(signInErrorMessage(result?.error ?? undefined));
        return;
      }

      router.push(redirectTo || DEFAULT_REDIRECT);
      // Server components still hold the signed-out session; drop their cache.
      router.refresh();
    } catch {
      setError('Could not sign in right now. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormError message={error} />

      <div>
        <label htmlFor="login-email" className={labelClass}>Email</label>
        <input
          id="login-email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
          placeholder="Email Address"
          required
        />
      </div>

      <div>
        <label htmlFor="login-password" className={labelClass}>Password</label>
        <input
          id="login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
          placeholder="Password"
          required
        />
      </div>

      <button type="submit" disabled={loading} className={submitClass}>
        {loading ? 'Signing in...' : 'Sign in'}
      </button>

      <AuthDivider />

      <GoogleAuthButton label="Continue with Google" redirectTo={redirectTo} />
    </form>
  );
}

export function RegisterForm({ redirectTo }: { redirectTo?: string }) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data.error || 'Could not create the account.');
        return;
      }

      // The account exists but has no session yet; sign in with what was typed.
      const result = await signIn('credentials', { email, password, redirect: false });

      if (!result || result.error) {
        setError(
          result?.error
            ? signInErrorMessage(result.error)
            : 'Account created, but automatic sign-in failed. Please log in.',
        );
        return;
      }

      router.push(redirectTo || DEFAULT_REDIRECT);
      router.refresh();
    } catch {
      setError('Could not create the account right now. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormError message={error} />

      <div>
        <label htmlFor="register-name" className={labelClass}>Name</label>
        <input
          id="register-name"
          name="name"
          autoComplete="name"
          maxLength={80}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputClass}
          placeholder="Your name"
          required
        />
      </div>

      <div>
        <label htmlFor="register-email" className={labelClass}>Email</label>
        <input
          id="register-email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
          placeholder="Email Address"
          required
        />
      </div>

      <div>
        <label htmlFor="register-password" className={labelClass}>Password</label>
        <input
          id="register-password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
          placeholder="At least 8 characters"
          required
        />
      </div>

      <button type="submit" disabled={loading} className={submitClass}>
        {loading ? 'Creating account...' : 'Create account'}
      </button>

      <AuthDivider />

      <GoogleAuthButton label="Sign up with Google" redirectTo={redirectTo} />
    </form>
  );
}

/**
 * Where to land after signing in. Auth.js's own redirects use `callbackUrl`;
 * `redirect` is kept for links written before this was wired up.
 */
export function useRedirectTo() {
  const params = useSearchParams();
  return params?.get('callbackUrl') || params?.get('redirect') || DEFAULT_REDIRECT;
}

export default function AuthClient() {
  const params = useSearchParams();
  const redirectTo = useRedirectTo();
  const mode = params?.get('mode') || 'login';
  const [active, setActive] = useState<'login' | 'register'>(mode === 'register' ? 'register' : 'login');

  useEffect(() => {
    setActive(mode === 'register' ? 'register' : 'login');
  }, [mode]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white">Account</h1>
        <div className="flex rounded-md bg-neutral-100 p-1 dark:bg-neutral-800">
          <button onClick={() => setActive('login')} className={`px-4 py-2 rounded-md text-sm ${active === 'login' ? 'bg-white dark:bg-neutral-900 font-semibold' : 'text-neutral-700 dark:text-neutral-300'}`}>
            Sign in
          </button>
          <button onClick={() => setActive('register')} className={`px-4 py-2 rounded-md text-sm ${active === 'register' ? 'bg-white dark:bg-neutral-900 font-semibold' : 'text-neutral-700 dark:text-neutral-300'}`}>
            Register
          </button>
        </div>
      </div>

      <div className="mt-6">
        {active === 'login' ? <LoginForm redirectTo={redirectTo} /> : <RegisterForm redirectTo={redirectTo} />}
      </div>
    </div>
  );
}
