import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Project from '@/models/Project';

export const runtime = 'nodejs';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
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
    const project = await Project.findById(id);

    if (!project) {
      return NextResponse.json({ error: 'Project not found.' }, { status: 404 });
    }

    project.title = cleanTitle;
    project.description = cleanDescription;
    project.href = cleanHref || '#!';
    project.imageUrl = cleanImageUrl;
    await project.save();

    return NextResponse.json({
      _id: project._id.toString(),
      title: project.title,
      description: project.description,
      href: project.href,
      imageUrl: project.imageUrl,
    });
  } catch (error) {
    console.error('[api/projects] PUT failed:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `Could not update project: ${message}` }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await connectDB();
    const project = await Project.findByIdAndDelete(id);

    if (!project) {
      return NextResponse.json({ error: 'Project not found.' }, { status: 404 });
    }

    return NextResponse.json({ _id: project._id.toString() });
  } catch (error) {
    console.error('[api/projects] DELETE failed:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `Could not delete project: ${message}` }, { status: 500 });
  }
}
