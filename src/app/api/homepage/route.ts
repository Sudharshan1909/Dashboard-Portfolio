import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import HomepageContent, { IHomepageContent } from '@/models/HomepageContent';

export const runtime = 'nodejs';

export async function GET() {
  try {
    await connectDB();

    const content = await HomepageContent.findOne().lean<IHomepageContent>();

    if (!content) {
      const created = await HomepageContent.create({
        greeting: "Hello, I'm Your Name",
        description: "A passionate frontend developer with a keen eye for design and a love for creating beautiful, functional web experiences.",
      });

      return NextResponse.json({
        greeting: created.greeting,
        description: created.description,
      });
    }

    return NextResponse.json({
      greeting: content.greeting,
      description: content.description,
    });
  } catch (error) {
    console.error('[api/homepage] GET failed:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Could not fetch homepage content: ${message}` },
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

  const { greeting, description } = (body ?? {}) as Record<string, unknown>;

  const cleanGreeting = String(greeting ?? '').trim();
  const cleanDescription = String(description ?? '').trim();

  if (!cleanGreeting) {
    return NextResponse.json({ error: 'Greeting is required.' }, { status: 400 });
  }

  if (!cleanDescription) {
    return NextResponse.json({ error: 'Description is required.' }, { status: 400 });
  }

  if (cleanGreeting.length > 120) {
    return NextResponse.json({ error: 'Greeting must be 120 characters or fewer.' }, { status: 400 });
  }

  if (cleanDescription.length > 800) {
    return NextResponse.json({ error: 'Description must be 800 characters or fewer.' }, { status: 400 });
  }

  try {
    await connectDB();

    let content = await HomepageContent.findOne();

    if (content) {
      content.greeting = cleanGreeting;
      content.description = cleanDescription;
      await content.save();
    } else {
      content = await HomepageContent.create({
        greeting: cleanGreeting,
        description: cleanDescription,
      });
    }

    return NextResponse.json({
      greeting: content.greeting,
      description: content.description,
    });
  } catch (error) {
    console.error('[api/homepage] PUT failed:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `Could not update homepage content: ${message}` }, { status: 500 });
  }
}
