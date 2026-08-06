import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import connectDB from '@/lib/mongodb';
import Contact from '@/models/Contact';
import Message from '@/models/Message';

export const runtime = 'nodejs';

interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Expected a JSON body.' }, { status: 400 });
  }

  const { name, email, subject, message } = (body ?? {}) as ContactFormData;

  if (!name || !email || !message) {
    return NextResponse.json({ error: 'Name, email, and message are required.' }, { status: 400 });
  }

  try {
    await connectDB();

    const contact = await Contact.findOne().lean();
    const recipient = contact?.email || process.env.CONTACT_RECIPIENT || '';

    if (!recipient) {
      return NextResponse.json({ error: 'No recipient email configured.' }, { status: 500 });
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const formattedSubject = subject
      ? `[Contact Form] ${subject}`
      : `[Contact Form] New message from ${name}`;

    await transporter.sendMail({
      from: `"${name}" <${email}>`,
      replyTo: email,
      to: recipient,
      subject: formattedSubject,
      html: `
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject || '(none)'}</p>
        <hr />
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
      `,
    });

    await Message.create({
      name,
      email,
      subject: subject || '',
      message,
      read: false,
    });

    return NextResponse.json({ success: true, message: 'Message sent successfully.' });
  } catch (error) {
    console.error('[api/contact/send] POST failed:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Could not send message: ${message}` },
      { status: 500 }
    );
  }
}
