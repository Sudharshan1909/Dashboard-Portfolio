import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { postsConfig } from "@/config/posts";
import { notFound } from 'next/navigation';
import connectDB from '@/lib/mongodb';
import PostModel, { IPost } from '@/models/Post';

export const dynamicParams = true;

async function getPost(slug: string) {
  const staticPost = postsConfig.posts.find((p) => p.slug === `posts/${slug}`);
  if (staticPost) {
    return { ...staticPost };
  }

  try {
    await connectDB();
    const post = (await PostModel.findOne({
      $or: [{ slug: slug }, { slug: `posts/${slug}` }],
    }).lean()) as (import('@/models/Post').IPost) | null;

    if (!post) return null;

    return {
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
    };
  } catch {
    return null;
  }
}

export default async function Post({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const post = await getPost(slug);

  if (!post) {
    notFound();
  }

  let sections: { title: string; type: string; content: string; description?: string }[] = [];
  if (Array.isArray(post.sections) && post.sections.length > 0) {
    sections = post.sections as { title: string; type: string; content: string; description?: string }[];
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:28px_48px] -z-10"></div>
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[1200px] w-[1200px] rounded-full bg-neutral-400 opacity-10 blur-[100px]"></div>
      </div>

      <div className="relative z-10 flex flex-col flex-1">
        <Navbar />

         <section className="flex flex-1">
           <article className="relative z-20 w-[896px] mx-auto mt-32 mb-12">
             <div className="prose dark:prose-invert max-w-none">
               <h1 className="text-4xl font-bold mb-4">{post.title}</h1>
               <div className="flex items-center gap-4 text-sm text-neutral-600 dark:text-neutral-400 mb-8">
                 <time>{post.date}</time>
                 <span>•</span>
                 <span>{post.readTime.includes('min') ? post.readTime : `${post.readTime} min read`}</span>
                 <span>•</span>
                 <span>{post.author}</span>
               </div>

              {sections.length > 0 ? (
                <div className="space-y-8">
                  {sections.map((section, sIndex) => (
                    <div key={sIndex} className="mb-8">
                      {section.title && (
                        <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
                          {section.title}
                        </h2>
                      )}
                      {section.type === 'text' ? (
                        <div className="rounded-lg bg-black p-4 text-sm text-green-400 font-mono whitespace-pre-wrap">
                          {section.content}
                        </div>
                      ) : section.type === 'description' ? (
                        <p className="text-sm text-neutral-900 dark:text-neutral-200">
                          {section.content}
                        </p>
                      ) : section.type === 'ordered' ? (
                        <ol className="list-decimal pl-5 space-y-1 text-neutral-900 dark:text-neutral-200">
                          {section.content
                            .split('\n')
                            .map((line) => line.trim())
                            .filter(Boolean)
                            .map((item, idx) => (
                              <li key={idx}>{item}</li>
                            ))}
                        </ol>
                      ) : (
                        <ul className="list-disc pl-5 space-y-1 text-neutral-900 dark:text-neutral-200">
                          {section.content
                            .split('\n')
                            .map((line) => line.trim())
                            .filter(Boolean)
                            .map((item, idx) => (
                              <li key={idx}>{item}</li>
                            ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div dangerouslySetInnerHTML={{ __html: post.html }} />
              )}
             </div>
           </article>
         </section>
      </div>

      <Footer />
    </div>
  );
}
