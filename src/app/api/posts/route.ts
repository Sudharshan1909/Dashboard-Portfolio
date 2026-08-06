import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Post, { IPost } from '@/models/Post';

export const runtime = 'nodejs';

export async function GET() {
  try {
    await connectDB();
    const posts = (await Post.find().sort({ createdAt: -1 }).lean()) as IPost[];
    return NextResponse.json(
      posts.map((p) => ({
        _id: p._id.toString(),
        title: p.title,
        description: p.description,
        date: p.date,
        image: p.image,
        slug: p.slug,
        tags: p.tags,
        author: p.author,
        readTime: p.readTime,
        content: p.content,
        html: p.html,
        sections: p.sections ?? [],
      }))
    );
  } catch (error) {
    console.error('[api/posts] GET failed:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `Could not fetch posts: ${message}` }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Expected a JSON body.' }, { status: 400 });
  }

  const {
    title,
    description,
    date,
    image,
    slug,
    tags,
    author,
    readTime,
    content,
    sections,
  } = (body ?? {}) as Record<string, unknown>;

  const cleanTitle = String(title ?? '').trim();
  const cleanDescription = String(description ?? '').trim();
  const cleanDate = String(date ?? '').trim();
  const cleanImage = String(image ?? '').trim();
  const cleanSlug = String(slug ?? '').trim();
  const cleanAuthor = String(author ?? '').trim();
  const cleanReadTime = String(readTime ?? '').trim();
  const cleanContent = String(content ?? '').trim();

  if (!cleanTitle) {
    return NextResponse.json({ error: 'Title is required.' }, { status: 400 });
  }

  if (!cleanDescription) {
    return NextResponse.json({ error: 'Description is required.' }, { status: 400 });
  }

  if (!cleanDate) {
    return NextResponse.json({ error: 'Date is required.' }, { status: 400 });
  }

  if (!cleanImage) {
    return NextResponse.json({ error: 'Image is required.' }, { status: 400 });
  }

  if (!cleanSlug) {
    return NextResponse.json({ error: 'Slug is required.' }, { status: 400 });
  }

  if (!cleanAuthor) {
    return NextResponse.json({ error: 'Author is required.' }, { status: 400 });
  }

  if (!cleanReadTime) {
    return NextResponse.json({ error: 'Read time is required.' }, { status: 400 });
  }

  if (!cleanContent) {
    return NextResponse.json({ error: 'Content is required.' }, { status: 400 });
  }

  try {
    await connectDB();

    const existing = await Post.findOne({ slug: cleanSlug }).select('_id');
    if (existing) {
      return NextResponse.json({ error: 'A post with this slug already exists.' }, { status: 409 });
    }

    let html = cleanContent;
    try {
      const { marked } = await import('marked');
      html = await marked.parse(cleanContent) as string;
    } catch {
      // fallback: use raw content as html
    }

    const post = await Post.create({
      title: cleanTitle,
      description: cleanDescription,
      date: cleanDate,
      image: cleanImage,
      slug: cleanSlug,
      tags: Array.isArray(tags) ? tags.map((t) => String(t).trim()).filter(Boolean) : [],
      author: cleanAuthor,
      readTime: cleanReadTime,
      content: cleanContent,
      html,
      sections: Array.isArray(sections) ? sections : [],
    });

    return NextResponse.json(
      {
        _id: post._id.toString(),
        title: post.title,
        description: post.description,
        date: post.date,
        image: post.image,
        slug: post.slug,
        tags: post.tags,
        author: post.author,
        readTime: post.readTime,
        content: post.content,
        html: post.html,
        sections: post.sections,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[api/posts] POST failed:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `Could not create post: ${message}` }, { status: 500 });
  }
}
