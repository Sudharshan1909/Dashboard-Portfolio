import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import About, { IAbout } from '@/models/About';

export const runtime = 'nodejs';

export async function GET() {
  try {
    await connectDB();

    const about = await About.findOne().lean<IAbout>();

    if (!about) {
      const created = await About.create({
        title: 'About Me',
        description:
          'This is where you can introduce yourself or your company. Share your story, mission, and values.',
        image: '/assets/images/about.jpg',
        thumbnailImage: '/assets/images/about/coder.jpg',
        skills: [],
        experience: { title: 'Experience', items: [] },
        career: { title: 'Career', items: [] },
      });

      return NextResponse.json({
        _id: created._id.toString(),
        title: created.title,
        description: created.description,
        image: created.image,
        thumbnailImage: created.thumbnailImage,
        skills: created.skills,
        experience: created.experience,
        career: created.career,
      });
    }

    return NextResponse.json({
      _id: about._id.toString(),
      title: about.title,
      description: about.description,
      image: about.image,
      thumbnailImage: about.thumbnailImage,
      skills: about.skills ?? [],
      experience: about.experience ?? { title: 'Experience', items: [] },
      career: about.career ?? { title: 'Career', items: [] },
    });
  } catch (error) {
    console.error('[api/about] GET failed:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Could not fetch about content: ${message}` },
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

  const { title, description, image, thumbnailImage, skills, experience, career } =
    (body ?? {}) as Record<string, unknown>;

  try {
    await connectDB();

    let about = await About.findOne();

    if (about) {
      if (typeof title === 'string' && title.trim()) about.title = title.trim();
      if (typeof description === 'string') about.description = description;
      if (typeof image === 'string') about.image = image;
      if (typeof thumbnailImage === 'string') about.thumbnailImage = thumbnailImage;
      if (Array.isArray(skills)) about.skills = skills.map(String);
      if (typeof experience === 'object' && experience !== null)
        about.experience = experience as IAbout['experience'];
      if (typeof career === 'object' && career !== null)
        about.career = career as IAbout['career'];
      await about.save();
    } else {
      about = await About.create({
        title: typeof title === 'string' && title.trim() ? title.trim() : 'About Me',
        description: typeof description === 'string' ? description : '',
        image: typeof image === 'string' ? image : '/assets/images/about.jpg',
        thumbnailImage:
          typeof thumbnailImage === 'string' ? thumbnailImage : '/assets/images/about/coder.jpg',
        skills: Array.isArray(skills) ? skills.map(String) : [],
        experience:
          typeof experience === 'object' && experience !== null
            ? (experience as IAbout['experience'])
            : { title: 'Experience', items: [] },
        career:
          typeof career === 'object' && career !== null
            ? (career as IAbout['career'])
            : { title: 'Career', items: [] },
      });
    }

    return NextResponse.json({
      _id: about._id.toString(),
      title: about.title,
      description: about.description,
      image: about.image,
      thumbnailImage: about.thumbnailImage,
      skills: about.skills,
      experience: about.experience,
      career: about.career,
    });
  } catch (error) {
    console.error('[api/about] PUT failed:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Could not update about content: ${message}` },
      { status: 500 }
    );
  }
}
