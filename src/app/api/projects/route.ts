import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Project, { IProject } from '@/models/Project';

export const runtime = 'nodejs';

export async function GET() {
  try {
    await connectDB();
    const projects = (await Project.find().sort({ createdAt: -1 }).lean()) as IProject[];
    return NextResponse.json(
      projects.map((p) => ({
        _id: p._id.toString(),
        title: p.title,
        description: p.description,
        href: p.href,
        imageUrl: p.imageUrl,
      }))
    );
  } catch (error) {
    console.error('[api/projects] GET failed:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `Could not fetch projects: ${message}` }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Expected a JSON body.' }, { status: 400 });
  }

  const { title, description, href, imageUrl } = (body ?? {}) as Record<string, unknown>;

  const cleanTitle = String(title ?? '').trim();
  const cleanDescription = String(description ?? '').trim();
  const cleanHref = String(href ?? '').trim();
  const cleanImageUrl = String(imageUrl ?? '').trim();

  if (!cleanTitle) {
    return NextResponse.json({ error: 'Title is required.' }, { status: 400 });
  }

  if (!cleanDescription) {
    return NextResponse.json({ error: 'Description is required.' }, { status: 400 });
  }

  if (!cleanImageUrl) {
    return NextResponse.json({ error: 'Image URL is required.' }, { status: 400 });
  }

  if (cleanTitle.length > 120) {
    return NextResponse.json({ error: 'Title must be 120 characters or fewer.' }, { status: 400 });
  }

  if (cleanDescription.length > 800) {
    return NextResponse.json({ error: 'Description must be 800 characters or fewer.' }, { status: 400 });
  }

  try {
    await connectDB();
    const project = await Project.create({
      title: cleanTitle,
      description: cleanDescription,
      href: cleanHref || '#!',
      imageUrl: cleanImageUrl,
    });

    return NextResponse.json(
      {
        _id: project._id.toString(),
        title: project.title,
        description: project.description,
        href: project.href,
        imageUrl: project.imageUrl,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[api/projects] POST failed:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `Could not create project: ${message}` }, { status: 500 });
  }
}
