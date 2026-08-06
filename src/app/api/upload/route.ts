import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'bin';
    if (!['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) {
      return NextResponse.json({ error: 'Unsupported file type.' }, { status: 400 });
    }

    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const uploadDir = join(process.cwd(), 'public', 'assets', 'images', 'projects');

    try {
      await mkdir(uploadDir, { recursive: true });
    } catch {
      // directory likely exists
    }

    const filePath = join(uploadDir, fileName);
    await writeFile(filePath, buffer);

    return NextResponse.json({
      url: `/assets/images/projects/${fileName}`,
    });
  } catch (error) {
    console.error('[api/upload] POST failed:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `Upload failed: ${message}` }, { status: 500 });
  }
}
