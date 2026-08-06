import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { isAuthorizedEmail } from '@/auth.config';

/**
 * Creates a credentials account. The client follows a 201 with a
 * signIn('credentials', ...) call, so this route never issues a session itself.
 */

export const runtime = 'nodejs';

const MIN_PASSWORD_LENGTH = 8;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Expected a JSON body.' }, { status: 400 });
  }

  const { name, email, password } = (body ?? {}) as Record<string, unknown>;

  const cleanName = String(name ?? '').trim();
  const cleanEmail = String(email ?? '').toLowerCase().trim();
  const cleanPassword = String(password ?? '');

  if (!cleanName) {
    return NextResponse.json({ error: 'Name is required.' }, { status: 400 });
  }

  if (cleanName.length > 80) {
    return NextResponse.json({ error: 'Name must be 80 characters or fewer.' }, { status: 400 });
  }

  if (!EMAIL_PATTERN.test(cleanEmail)) {
    return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
  }

  if (cleanPassword.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json(
      { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` },
      { status: 400 }
    );
  }

  // The dashboard admits one account, so any other address would produce a row
  // that can never sign in. Refuse before touching the database rather than
  // letting the failure surface later at sign-in.
  if (!isAuthorizedEmail(cleanEmail)) {
    return NextResponse.json(
      { error: 'Registration is restricted to the authorized dashboard account.' },
      { status: 403 }
    );
  }

  try {
    await connectDB();
  } catch (error) {
    console.error('[register] MongoDB connection failed:', error);
    return NextResponse.json(
      {
        error:
          'Could not connect to the database. Verify MONGODB_URI, your MongoDB Atlas network access/IP whitelist, and that the cluster is running.',
      },
      { status: 500 }
    );
  }

  try {
    const existing = await User.findOne({ email: cleanEmail }).select('_id provider');

    if (existing) {
      // Say the same thing either way — whether the existing account is a Google
      // one is not this endpoint's business to leak.
      return NextResponse.json({ error: 'An account with that email already exists.' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(cleanPassword, 12);

    const user = await User.create({
      name: cleanName,
      email: cleanEmail,
      passwordHash,
      provider: 'credentials',
    });

    return NextResponse.json(
      { id: user._id.toString(), name: user.name, email: user.email },
      { status: 201 }
    );
  } catch (error) {
    // The unique index on email is the real guard; the findOne above only saves
    // a round trip. Two simultaneous signups land here.
    if (typeof error === 'object' && error !== null && (error as { code?: number }).code === 11000) {
      return NextResponse.json({ error: 'An account with that email already exists.' }, { status: 409 });
    }

    console.error('[register]', error);
    return NextResponse.json({ error: 'Could not create the account. Try again.' }, { status: 500 });
  }
}
