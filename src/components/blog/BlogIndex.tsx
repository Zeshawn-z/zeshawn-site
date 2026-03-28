"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BookOpen, Calendar, Clock, FileText, PenLine, Search } from "lucide-react";
import type { BlogPost } from "@/lib/db/types";
import ScrollReveal from "@/components/common/ScrollReveal";
import GlowCard from "@/components/common/GlowCard";
import { FieldInput } from "@/components/admin/FormFields";

interface BlogIndexProps {
  posts: BlogPost[];
  showHeading?: boolean;
  headingTitle?: string;
  headingDescription?: string;
}

export default function BlogIndex({
  posts,
  showHeading = false,
  headingTitle = "博客",
  headingDescription = "",
}: BlogIndexProps) {
  const [showIndex, setShowIndex] = useState(false);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "markdown" | "pdf">("all");
  const [tagFilter, setTagFilter] = useState<string>("all");

  const allTags = useMemo(() => {
    return Array.from(new Set(posts.flatMap((post) => post.tags || []))).sort((a, b) => a.localeCompare(b, "zh-CN"));
  }, [posts]);

  const filteredPosts = useMemo(() => {
    const q = query.trim().toLowerCase();
    return posts.filter((post) => {
      const type = post.contentType || "markdown";
      const typeMatched = typeFilter === "all" || type === typeFilter;
      const tagMatched = tagFilter === "all" || post.tags.includes(tagFilter);
      const textMatched =
        q.length === 0 ||
        post.title.toLowerCase().includes(q) ||
        post.description.toLowerCase().includes(q) ||
        post.slug.toLowerCase().includes(q) ||
        post.tags.some((tag) => tag.toLowerCase().includes(q));
      return typeMatched && tagMatched && textMatched;
    });
  }, [posts, query, typeFilter, tagFilter]);

  if (posts.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-12 text-center">
        <BookOpen size={28} className="mx-auto mb-3 text-muted" />
        <p className="text-muted">暂无博客文章</p>
        <p className="mt-2 text-sm text-muted">在管理后台发布你的第一篇文章吧。</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {showHeading ? (
        <section className="pb-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <PenLine size={24} className="text-accent" />
              <h1 className="text-3xl font-bold tracking-tight">{headingTitle}</h1>
            </div>
            <button
              onClick={() => setShowIndex((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-sm text-muted transition-colors hover:text-foreground"
            >
              <Search size={14} />
              {showIndex ? "收起搜索/索引" : "展开搜索/索引"}
            </button>
          </div>
          {headingDescription && (
            <p className="mt-3 text-muted">{headingDescription}</p>
          )}
        </section>
      ) : (
        <div className="flex items-center justify-end">
          <button
            onClick={() => setShowIndex((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-sm text-muted transition-colors hover:text-foreground"
          >
            <Search size={14} />
            {showIndex ? "收起搜索/索引" : "展开搜索/索引"}
          </button>
        </div>
      )}

      {showIndex && (
        <div className="rounded-lg border border-border bg-card p-3">
          <div className="grid gap-2 sm:grid-cols-3">
            <FieldInput label="搜索" value={query} onChange={setQuery} placeholder="标题 / 摘要 / slug / 标签" />
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">类型筛选</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as "all" | "markdown" | "pdf")}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-accent"
              >
                <option value="all">全部</option>
                <option value="markdown">Markdown</option>
                <option value="pdf">PDF</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">标签索引</label>
              <select
                value={tagFilter}
                onChange={(e) => setTagFilter(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-accent"
              >
                <option value="all">全部标签</option>
                {allTags.map((tag) => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>
            </div>
          </div>

          {allTags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              <button
                onClick={() => setTagFilter("all")}
                className={`rounded-full px-2.5 py-0.5 text-xs transition-colors ${tagFilter === "all" ? "bg-accent text-white" : "bg-accent/10 text-accent"}`}
              >
                全部
              </button>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setTagFilter(tag)}
                  className={`rounded-full px-2.5 py-0.5 text-xs transition-colors ${tagFilter === tag ? "bg-accent text-white" : "bg-accent/10 text-accent"}`}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {filteredPosts.length > 0 ? (
        <div className="grid gap-4">
          {filteredPosts.map((post, i) => (
            <ScrollReveal key={post.slug} delay={i * 80}>
              <GlowCard>
                <Link href={`/blog/${post.slug}`} className="block p-5">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                    <h2 className="text-base font-medium">{post.title}</h2>
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">{post.description}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <span className="inline-flex items-center gap-1 text-xs text-muted">
                      <Calendar size={12} />
                      {post.date}
                    </span>
                    {post.readingTime ? (
                      <span className="inline-flex items-center gap-1 text-xs text-muted">
                        <Clock size={12} />
                        {post.readingTime} 阅读
                      </span>
                    ) : post.contentType === "pdf" ? (
                      <span className="inline-flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400">
                        <FileText size={12} />
                        PDF
                      </span>
                    ) : null}
                    {post.tags.map((tag) => (
                      <span key={tag} className="rounded-full bg-accent/10 px-2.5 py-0.5 text-xs text-accent">
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
        <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted">
          当前筛选条件下没有文章
        </div>
      )}
    </div>
  );
}
