import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, Clock } from "lucide-react";
import { getPostBySlug, getAllPosts } from "@/lib/data";
import { remark } from "remark";
import html from "remark-html";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.description,
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post || !post.published) {
    notFound();
  }

  const processedContent = await remark().use(html).process(post.content);
  const contentHtml = processedContent.toString();

  return (
    <div className="mx-auto max-w-5xl px-6 lg:px-8">
      <article className="pb-16 pt-12">
        {/* Back link */}
        <Link
          href="/blog"
          className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground"
        >
          <ArrowLeft size={14} />
          返回博客
        </Link>

        {/* Header */}
        <header className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {post.title}
          </h1>
          {post.description && (
            <p className="mt-3 text-lg text-muted">
              {post.description}
            </p>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted">
            <span className="inline-flex items-center gap-1.5">
              <Calendar size={14} />
              {post.date}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock size={14} />
              {post.readingTime} 阅读
            </span>
          </div>
          {post.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-accent/10 px-2.5 py-0.5 text-xs text-accent"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </header>

        {/* Content */}
        <div
          className="prose"
          dangerouslySetInnerHTML={{ __html: contentHtml }}
        />

        {/* Footer divider */}
        <hr className="mt-12 border-border" />
        <div className="mt-6">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground"
          >
            <ArrowLeft size={14} />
            返回博客列表
          </Link>
        </div>
      </article>
    </div>
  );
}
