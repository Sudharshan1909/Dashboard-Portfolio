import { handlers } from '@/auth';

/**
 * The one endpoint every Auth.js flow goes through: /api/auth/signin,
 * /api/auth/session, /api/auth/callback/google, and so on.
 */

export const { GET, POST } = handlers;

// Mongoose and bcrypt are Node-only; keep this route off the Edge runtime.
export const runtime = 'nodejs';
