import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Message, { IMessage } from '@/models/Message';

export const runtime = 'nodejs';

export async function GET() {
  try {
    await connectDB();

    const messages = await Message.find().sort({ createdAt: -1 }).lean<IMessage[]>();

    return NextResponse.json(
      messages.map((m) => ({
        _id: m._id.toString(),
        name: m.name,
        email: m.email,
        subject: m.subject,
        message: m.message,
        read: m.read ?? false,
        sentAt: m.sentAt?.toISOString() ?? m.createdAt?.toISOString(),
        createdAt: m.createdAt?.toISOString(),
        updatedAt: m.updatedAt?.toISOString(),
      }))
    );
  } catch (error) {
    console.error('[api/messages] GET failed:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Could not fetch messages: ${message}` },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Expected a JSON body.' }, { status: 400 });
  }

  const { name, email, subject, message } = (body ?? {}) as {
    name?: string;
    email?: string;
    subject?: string;
    message?: string;
  };

  if (!name || !email || !message) {
    return NextResponse.json({ error: 'Name, email, and message are required.' }, { status: 400 });
  }

  try {
    await connectDB();

    const created = await Message.create({
      name,
      email,
      subject: subject || '',
      message,
    });

    return NextResponse.json({
      _id: created._id.toString(),
      name: created.name,
      email: created.email,
      subject: created.subject,
      message: created.message,
      read: created.read,
      sentAt: created.sentAt?.toISOString(),
      createdAt: created.createdAt?.toISOString(),
      updatedAt: created.updatedAt?.toISOString(),
    });
  } catch (error) {
    console.error('[api/messages] POST failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Could not save message: ${errorMessage}` },
      { status: 500 }
    );
  }
}
