"use client";
import { useState, useEffect } from "react";
import { postsConfig } from "@/config/posts";
import PostsSearch from "./PostsSearch";
import PostCard from "@/components/PostCard";

export interface PublicPost {
  _id: string;
  title: string;
  description: string;
  date: string;
  image: string;
  slug: string;
  tags: string[];
  author: string;
  readTime: string;
  content: string;
  html: string;
}

const POSTS_PER_PAGE = 5;

export default function PostsContent() {
  const [posts, setPosts] = useState<PublicPost[]>([]);
  const [loading, setLoading] = useState(true);
  const totalPages = Math.ceil(posts.length / POSTS_PER_PAGE);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/posts');
        if (res.ok) {
          const data = (await res.json()) as PublicPost[];
          setPosts(data);
        } else {
          setPosts(postsConfig.posts.map((p) => ({
            _id: p.slug,
            title: p.title,
            description: p.description,
            date: p.date,
            image: p.image,
            slug: p.slug,
            tags: [...(p.tags ?? [])],
            author: p.author ?? '',
            readTime: p.readTime ?? '',
            content: p.content ?? '',
            html: p.html ?? '',
          })));
        }
      } catch {
        setPosts(postsConfig.posts.map((p) => ({
          _id: p.slug,
          title: p.title,
          description: p.description,
          date: p.date,
          image: p.image,
          slug: p.slug,
          tags: [...(p.tags ?? [])],
          author: p.author ?? '',
          readTime: p.readTime ?? '',
          content: p.content ?? '',
          html: p.html ?? '',
        })));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [posts]);

  const startIndex = (currentPage - 1) * POSTS_PER_PAGE;
  const currentPosts = posts.slice(startIndex, startIndex + POSTS_PER_PAGE);

  return (
    <section className="relative z-20 w-[896px] mx-auto mt-32 mb-12">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 sm:text-3xl lg:text-4xl">
          {postsConfig.title}
        </h2>
      </div>

      {loading && (
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">Loading posts...</p>
      )}

      <div className="flex flex-col items-stretch w-full gap-5">
        {!loading && currentPosts.map((post) => (
          <PostCard
            key={post.slug}
            title={post.title}
            description={post.description}
            date={post.date}
            href={post.slug.startsWith('posts/') ? `/${post.slug}` : `/posts/${post.slug}`}
            pattern="dots"
            imageUrl={post.image}
            readingTime={parseInt(post.readTime.replace(/[^\d]/g, '')) || 5}
          />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-8">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            className={`px-3 py-1 text-sm font-medium text-neutral-600 dark:text-neutral-400 ${
              currentPage === 1 ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {postsConfig.pagination.previous}
          </button>
          {[...Array(totalPages)].map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentPage(index + 1)}
              aria-current={index + 1 === currentPage ? "page" : undefined}
              className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium ${
                index + 1 === currentPage
                  ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                  : "text-neutral-600 dark:text-neutral-400"
              }`}
            >
              {index + 1}
            </button>
          ))}
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            className={`px-3 py-1 text-sm font-medium text-neutral-600 dark:text-neutral-400 ${
              currentPage === totalPages ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {postsConfig.pagination.next}
          </button>
        </div>
      )}

      <PostsSearch />
    </section>
  );
}
