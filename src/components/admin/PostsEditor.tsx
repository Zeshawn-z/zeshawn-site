"use client";

import { useMemo, useRef, useState } from "react";
import { Plus, Trash2, Save, Loader2, Eye, EyeOff, Edit3, MessageCircle, ArrowLeft, FileText, Upload, FileCheck } from "lucide-react";
import type { PostAdmin } from "./types";
import { FieldCommaInput, FieldInput } from "./FormFields";
import MdEditor from "@/components/admin/MdEditor";

function parseCommaSeparated(input: string): string[] {
  return input
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function PostsEditor({ posts, setPosts, onViewComments }: { posts: PostAdmin[]; setPosts: (p: PostAdmin[]) => void; onViewComments: (slug: string) => void }) {
  const [editing, setEditing] = useState<PostAdmin | null>(null);
  const [savingPost, setSavingPost] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "markdown" | "pdf">("all");
  const [tagFilter, setTagFilter] = useState<string>("all");
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const allTags = useMemo(() => {
    return Array.from(new Set(posts.flatMap((post) => post.tags || []))).sort((a, b) => a.localeCompare(b, "zh-CN"));
  }, [posts]);

  const filteredPosts = useMemo(() => {
    const q = query.trim().toLowerCase();
    return posts.filter((post) => {
      const typeMatched = typeFilter === "all" || post.contentType === typeFilter;
      const tagMatched = tagFilter === "all" || post.tags.includes(tagFilter);
      const textMatched =
        q.length === 0 ||
        post.title.toLowerCase().includes(q) ||
        post.slug.toLowerCase().includes(q) ||
        post.description.toLowerCase().includes(q) ||
        post.tags.some((tag) => tag.toLowerCase().includes(q));
      return typeMatched && tagMatched && textMatched;
    });
  }, [posts, query, typeFilter, tagFilter]);

  const createPost = async (contentType: "markdown" | "pdf" = "markdown") => {
    const slug = "new-post-" + Date.now();
    const res = await fetch("/api/admin/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug,
        title: contentType === "pdf" ? "新 PDF 文章" : "新文章",
        description: "",
        content: contentType === "pdf" ? "" : "",
        contentType,
        date: new Date().toISOString().slice(0, 10),
        tags: [],
        published: false,
      }),
    });
    const post = await res.json();
    setPosts([post, ...posts]);
    setEditing(post);
  };

  const savePost = async () => {
    if (!editing) return;
    setSavingPost(true);
    try {
      await fetch(`/api/admin/posts/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: editing.slug,
          title: editing.title,
          description: editing.description,
          content: editing.content,
          contentType: editing.contentType,
          pdfId: editing.pdfId || null,
          date: editing.date,
          tags: parseCommaSeparated((editing.tags || []).join(",")),
          published: editing.published,
          commentsEnabled: editing.commentsEnabled,
        }),
      });
      const normalizedEditing = {
        ...editing,
        tags: parseCommaSeparated((editing.tags || []).join(",")),
      };
      setPosts(posts.map((p) => (p.id === editing.id ? normalizedEditing : p)));
      setEditing(normalizedEditing);
    } finally {
      setSavingPost(false);
    }
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editing) return;
    if (file.type !== "application/pdf") {
      alert("请选择 PDF 文件");
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      alert("PDF 文件不能超过 50MB");
      return;
    }

    setUploadingPdf(true);
    try {
      // 上传 PDF 到独立的 pdfs API
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/pdfs", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        alert("上传失败");
        return;
      }
      const data = await res.json();
      setEditing({
        ...editing,
        pdfId: data.id,
        content: `[PDF] ${file.name} (${(file.size / 1024 / 1024).toFixed(1)}MB)`,
      });
    } catch {
      alert("上传失败，请重试");
    } finally {
      setUploadingPdf(false);
      // 重置 input
      if (pdfInputRef.current) pdfInputRef.current.value = "";
    }
  };

  const deletePost = async (id: string) => {
    if (!confirm("确定删除这篇文章？")) return;
    await fetch(`/api/admin/posts/${id}`, { method: "DELETE" });
    setPosts(posts.filter((p) => p.id !== id));
    if (editing?.id === id) setEditing(null);
  };

  const togglePublish = async (post: PostAdmin) => {
    const updated = { ...post, published: !post.published };
    await fetch(`/api/admin/posts/${post.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published: updated.published }),
    });
    setPosts(posts.map((p) => (p.id === post.id ? updated : p)));
    if (editing?.id === post.id) setEditing(updated);
  };

  // Editor view
  if (editing) {
    const isPdf = editing.contentType === "pdf";

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <button onClick={() => setEditing(null)} className="inline-flex items-center gap-1.5 text-sm leading-none text-muted hover:text-foreground transition-colors">
            <ArrowLeft size={14} className="shrink-0" />
            返回列表
          </button>
          <div className="flex items-center gap-2">
            {isPdf && (
              <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/10 px-2.5 py-1 text-xs font-medium text-orange-600 dark:text-orange-400">
                <FileText size={12} />
                PDF 文章
              </span>
            )}
            <button
              onClick={() => setEditing({ ...editing, commentsEnabled: !editing.commentsEnabled })}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-colors ${editing.commentsEnabled !== false ? "border-accent/30 text-accent" : "border-border text-muted"
                }`}
              title={editing.commentsEnabled !== false ? "评论已开启" : "评论已关闭"}
            >
              <MessageCircle size={14} />
              {editing.commentsEnabled !== false ? "评论开" : "评论关"}
            </button>
            <button
              onClick={() => togglePublish(editing)}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-colors ${editing.published ? "border-green-500/30 text-green-600 dark:text-green-400" : "border-border text-muted"
                }`}
            >
              {editing.published ? <Eye size={14} /> : <EyeOff size={14} />}
              {editing.published ? "已发布" : "草稿"}
            </button>
            <button
              onClick={savePost}
              disabled={savingPost}
              className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3.5 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {savingPost ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              保存文章
            </button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FieldInput label="标题" value={editing.title} onChange={(v) => setEditing({ ...editing, title: v })} />
          <FieldInput label="URL Slug" value={editing.slug} onChange={(v) => setEditing({ ...editing, slug: v })} />
        </div>
        <FieldInput label="摘要" value={editing.description} onChange={(v) => setEditing({ ...editing, description: v })} />
        <div className="grid gap-4 sm:grid-cols-2">
          <FieldInput label="日期" value={editing.date} onChange={(v) => setEditing({ ...editing, date: v })} placeholder="YYYY-MM-DD" />
          <FieldCommaInput
            label="标签（逗号分隔）"
            values={editing.tags}
            onParsedChange={(tags) => setEditing({ ...editing, tags })}
          />
        </div>

        {isPdf ? (
          /* PDF Upload Area */
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted">PDF 文件</label>
            <input
              ref={pdfInputRef}
              type="file"
              accept="application/pdf"
              onChange={handlePdfUpload}
              className="hidden"
            />
            {editing.pdfId ? (
              <div className="rounded-lg border border-border bg-card p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-500/10">
                    <FileCheck size={24} className="text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">PDF 已上传</p>
                    <p className="text-xs text-muted mt-0.5">{editing.content || "PDF 文件"}</p>
                  </div>
                  <button
                    onClick={() => pdfInputRef.current?.click()}
                    disabled={uploadingPdf}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-muted transition-colors hover:text-foreground"
                  >
                    {uploadingPdf ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                    重新上传
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => pdfInputRef.current?.click()}
                disabled={uploadingPdf}
                className="flex w-full flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-border py-12 text-muted transition-colors hover:border-accent hover:text-accent"
              >
                {uploadingPdf ? (
                  <Loader2 size={28} className="animate-spin" />
                ) : (
                  <Upload size={28} />
                )}
                <div className="text-center">
                  <p className="text-sm font-medium">{uploadingPdf ? "正在上传..." : "点击上传 PDF 文件"}</p>
                  <p className="mt-1 text-xs">支持最大 50MB 的 PDF 文件</p>
                </div>
              </button>
            )}
          </div>
        ) : (
          /* Markdown Editor */
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted">内容（Markdown）</label>
            <MdEditor
              value={editing.content}
              onChange={(v) => setEditing({ ...editing, content: v })}
              height={600}
            />
          </div>
        )}
      </div>
    );
  }

  // List view
  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-border bg-card p-3">
        <div className="grid gap-2 sm:grid-cols-3">
          <FieldInput
            label="搜索"
            value={query}
            onChange={setQuery}
            placeholder="标题 / slug / 描述 / 标签"
          />
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

      {filteredPosts.map((post) => (
        <div key={post.id} className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {post.contentType === "pdf" && (
                <FileText size={14} className="shrink-0 text-orange-500" />
              )}
              <span className="truncate text-sm font-medium">{post.title}</span>
              {!post.published && (
                <span className="shrink-0 rounded-full bg-muted/20 px-2 py-0.5 text-xs text-muted">草稿</span>
              )}
            </div>
            <div className="mt-0.5 text-xs text-muted">{post.date} · /{post.slug}</div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button onClick={() => setEditing(post)} className="rounded p-1.5 text-muted transition-colors hover:text-accent">
              <Edit3 size={14} />
            </button>
            <button onClick={() => onViewComments(post.slug)} className="rounded p-1.5 text-muted transition-colors hover:text-accent" title="查看评论">
              <MessageCircle size={14} />
            </button>
            <button onClick={() => togglePublish(post)} className="rounded p-1.5 text-muted transition-colors hover:text-foreground">
              {post.published ? <Eye size={14} /> : <EyeOff size={14} />}
            </button>
            <button onClick={() => deletePost(post.id)} className="rounded p-1.5 text-muted transition-colors hover:text-red-500">
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      ))}
      {filteredPosts.length === 0 && (
        <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted">
          当前筛选条件下没有文章
        </div>
      )}
      <div className="flex gap-2">
        <button
          onClick={() => createPost("markdown")}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-dashed border-border py-3 text-sm text-muted transition-colors hover:border-accent hover:text-accent"
        >
          <Plus size={16} />
          写新文章
        </button>
        <button
          onClick={() => createPost("pdf")}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-dashed border-border py-3 text-sm text-muted transition-colors hover:border-orange-500 hover:text-orange-500"
        >
          <FileText size={16} />
          上传 PDF 文章
        </button>
      </div>
    </div>
  );
}
