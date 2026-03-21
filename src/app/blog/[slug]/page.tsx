import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, Clock, FileText } from "lucide-react";
import { getPostBySlug, getAllPosts } from "@/lib/db/data";
import { renderMarkdown } from "@/lib/content/markdown";
import CopyCodeButton from "@/components/common/CopyCodeButton";
import BlogComments from "@/components/blog/BlogComments";

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
    openGraph: {
      type: "article",
      title: post.title,
      description: post.description,
      publishedTime: post.date || undefined,
      tags: post.tags,
    },
    twitter: {
      card: "summary",
      title: post.title,
      description: post.description,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post || !post.published) {
    notFound();
  }

  const isPdf = post.contentType === "pdf";
  const contentHtml = isPdf ? "" : await renderMarkdown(post.content);

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
          <div className="flex items-center gap-3">
            {isPdf && (
              <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/10 px-2.5 py-1 text-xs font-medium text-orange-600 dark:text-orange-400">
                <FileText size={12} />
                PDF
              </span>
            )}
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {post.title}
            </h1>
          </div>
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
            {!isPdf && post.readingTime && (
              <span className="inline-flex items-center gap-1.5">
                <Clock size={14} />
                {post.readingTime} 阅读
              </span>
            )}
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
        {isPdf && post.pdfId ? (
          /* PDF 内嵌阅读器 */
          <div className="relative w-full overflow-hidden rounded-lg border border-border bg-card">
            <iframe
              src={`/api/pdfs/${post.pdfId}`}
              className="h-[80vh] w-full"
              title={post.title}
            />
          </div>
        ) : isPdf ? (
          <div className="rounded-lg border border-dashed border-border py-16 text-center">
            <FileText size={48} className="mx-auto mb-4 text-muted" />
            <p className="text-muted">PDF 文件暂未上传</p>
          </div>
        ) : (
          <>
            <div
              className="markdown-body"
              dangerouslySetInnerHTML={{ __html: contentHtml }}
            />
            <CopyCodeButton />
          </>
        )}

        {/* Footer divider */}
        <hr className="mt-12 border-border" />

        {/* 评论区 */}
        <BlogComments slug={slug} />

        <div className="mt-8">
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
