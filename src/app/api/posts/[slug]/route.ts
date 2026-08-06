import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Post from '@/models/Post';

export const runtime = 'nodejs';

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    await connectDB();
    const post = (await Post.findOne({
      $or: [{ slug: slug }, { slug: `posts/${slug}` }],
    }).lean()) as (import('@/models/Post').IPost) | null;

    if (!post) {
      return NextResponse.json({ error: 'Post not found.' }, { status: 404 });
    }

    return NextResponse.json({
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
      sections: post.sections ?? [],
    });
  } catch (error) {
    console.error('[api/posts] GET failed:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `Could not fetch post: ${message}` }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
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
    const post = await Post.findOne({
      $or: [{ slug: slug }, { slug: `posts/${slug}` }],
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found.' }, { status: 404 });
    }

    post.title = cleanTitle;
    post.description = cleanDescription;
    post.date = cleanDate;
    post.image = cleanImage;
    post.author = cleanAuthor;
    post.readTime = cleanReadTime;
    post.content = cleanContent;
    post.sections = Array.isArray(sections) ? sections : post.sections;
    let html = cleanContent;
    try {
      const { marked } = await import('marked');
      html = await marked.parse(cleanContent) as string;
    } catch {
      // fallback
    }
    post.html = html;

    await post.save();

    return NextResponse.json({
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
      sections: post.sections ?? [],
    });
  } catch (error) {
    console.error('[api/posts] PUT failed:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `Could not update post: ${message}` }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    await connectDB();
    const post = await Post.findOneAndDelete({
      $or: [{ slug: slug }, { slug: `posts/${slug}` }],
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found.' }, { status: 404 });
    }

    return NextResponse.json({ _id: post._id.toString() });
  } catch (error) {
    console.error('[api/posts] DELETE failed:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `Could not delete post: ${message}` }, { status: 500 });
  }
}
