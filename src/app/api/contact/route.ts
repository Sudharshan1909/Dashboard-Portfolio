import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Contact, { IContact } from '@/models/Contact';

export const runtime = 'nodejs';

export async function GET() {
  try {
    await connectDB();

    const contact = await Contact.findOne().lean<IContact>();

    if (!contact) {
      const created = await Contact.create({
        description: "Get in touch with me for collaboration opportunities, questions, or just to say hello. I'm always open to discussing new projects and ideas.",
        email: 'hello@example.com',
        linkedinUrl: '',
        githubUrl: '',
      });

      return NextResponse.json({
        _id: created._id.toString(),
        description: created.description,
        email: created.email,
        linkedinUrl: created.linkedinUrl,
        githubUrl: created.githubUrl,
      });
    }

    return NextResponse.json({
      _id: contact._id.toString(),
      description: contact.description ?? '',
      email: contact.email ?? '',
      linkedinUrl: contact.linkedinUrl ?? '',
      githubUrl: contact.githubUrl ?? '',
    });
  } catch (error) {
    console.error('[api/contact] GET failed:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Could not fetch contact content: ${message}` },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Expected a JSON body.' }, { status: 400 });
  }

  const { description, email, linkedinUrl, githubUrl } = (body ?? {}) as Record<string, unknown>;

  try {
    await connectDB();

    let contact = await Contact.findOne();

    if (contact) {
      if (typeof description === 'string') contact.description = description;
      if (typeof email === 'string') contact.email = email;
      if (typeof linkedinUrl === 'string') contact.linkedinUrl = linkedinUrl;
      if (typeof githubUrl === 'string') contact.githubUrl = githubUrl;
      await contact.save();
    } else {
      contact = await Contact.create({
        description: typeof description === 'string' ? description : '',
        email: typeof email === 'string' ? email : 'hello@example.com',
        linkedinUrl: typeof linkedinUrl === 'string' ? linkedinUrl : '',
        githubUrl: typeof githubUrl === 'string' ? githubUrl : '',
      });
    }

    return NextResponse.json({
      _id: contact._id.toString(),
      description: contact.description,
      email: contact.email,
      linkedinUrl: contact.linkedinUrl,
      githubUrl: contact.githubUrl,
    });
  } catch (error) {
    console.error('[api/contact] PUT failed:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Could not update contact content: ${message}` },
      { status: 500 }
    );
  }
}
