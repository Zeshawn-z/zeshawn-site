import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, PenLine, Calendar, Clock } from "lucide-react";
import { getAllPosts } from "@/lib/blog";
import ScrollReveal from "@/components/ScrollReveal";
import GlowCard from "@/components/GlowCard";
import SpotlightSection from "@/components/SpotlightSection";

export const metadata: Metadata = {
  title: "博客",
  description: "技术博客与文章",
};

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <div className="mx-auto max-w-5xl px-6 lg:px-8">
      <section className="pb-12 pt-16">
        <div className="flex items-center gap-3">
          <PenLine size={24} className="text-accent" />
          <h1 className="text-3xl font-bold tracking-tight">博客</h1>
        </div>
        <p className="mt-3 text-muted">
          记录技术探索、项目实践和个人思考。支持 Markdown 和 MDX 格式。
        </p>
      </section>

      <SpotlightSection>
        <section className="pb-16">
          {posts.length > 0 ? (
            <div className="grid gap-4">
              {posts.map((post, i) => (
                <ScrollReveal key={post.slug} delay={i * 80}>
                  <GlowCard>
                    <Link
                      href={`/blog/${post.slug}`}
                      className="block p-5"
                    >
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                        <h2 className="text-base font-medium">
                          {post.title}
                        </h2>
                      </div>
                      <p className="mt-1.5 text-sm leading-relaxed text-muted">
                        {post.description}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-3">
                        <span className="inline-flex items-center gap-1 text-xs text-muted">
                          <Calendar size={12} />
                          {post.date}
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs text-muted">
                          <Clock size={12} />
                          {post.readingTime} 阅读
                        </span>
                        {post.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-accent/10 px-2.5 py-0.5 text-xs text-accent"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </Link>
                  </GlowCard>
                </ScrollReveal>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border p-12 text-center">
              <BookOpen size={28} className="mx-auto mb-3 text-muted" />
              <p className="text-muted">暂无博客文章</p>
              <p className="mt-2 text-sm text-muted">
                在{" "}
                <code className="rounded bg-card px-1.5 py-0.5 font-mono text-xs">
                  content/blog/
                </code>{" "}
                目录下创建{" "}
                <code className="rounded bg-card px-1.5 py-0.5 font-mono text-xs">
                  .md
                </code>{" "}
                或{" "}
                <code className="rounded bg-card px-1.5 py-0.5 font-mono text-xs">
                  .mdx
                </code>{" "}
                文件即可发布文章。
              </p>
            </div>
          )}
        </section>
      </SpotlightSection>
    </div>
  );
}
