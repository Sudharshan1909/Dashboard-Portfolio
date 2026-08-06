import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Message, { IMessage } from '@/models/Message';

export const runtime = 'nodejs';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const { read } = (body ?? {}) as { read?: boolean };

  try {
    await connectDB();

    const update: Partial<IMessage> = {};
    if (typeof read === 'boolean') update.read = read;

    const message = await Message.findByIdAndUpdate(id, update, { new: true }).lean<IMessage>();

    if (!message) {
      return NextResponse.json({ error: 'Message not found.' }, { status: 404 });
    }

    return NextResponse.json({
      _id: message._id.toString(),
      name: message.name,
      email: message.email,
      subject: message.subject,
      message: message.message,
      read: message.read ?? false,
      sentAt: message.sentAt?.toISOString() ?? message.createdAt?.toISOString(),
      createdAt: message.createdAt?.toISOString(),
      updatedAt: message.updatedAt?.toISOString(),
    });
  } catch (error) {
    console.error('[api/messages/:id] PATCH failed:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `Could not update message: ${message}` }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    await connectDB();

    const result = await Message.deleteOne({ _id: id });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Message not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[api/messages/:id] DELETE failed:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `Could not delete message: ${message}` }, { status: 500 });
  }
}
