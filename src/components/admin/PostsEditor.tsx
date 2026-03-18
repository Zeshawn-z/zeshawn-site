"use client";

import { useState } from "react";
import { Plus, Trash2, Save, Loader2, Eye, EyeOff, Edit3, MessageCircle, ArrowLeft } from "lucide-react";
import type { PostAdmin } from "./types";
import { FieldInput } from "./FormFields";
import MdEditor from "@/components/admin/MdEditor";

export default function PostsEditor({ posts, setPosts, onViewComments }: { posts: PostAdmin[]; setPosts: (p: PostAdmin[]) => void; onViewComments: (slug: string) => void }) {
  const [editing, setEditing] = useState<PostAdmin | null>(null);
  const [savingPost, setSavingPost] = useState(false);

  const createPost = async () => {
    const slug = "new-post-" + Date.now();
    const res = await fetch("/api/admin/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug,
        title: "新文章",
        description: "",
        content: "",
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
          date: editing.date,
          tags: editing.tags,
          published: editing.published,
        }),
      });
      setPosts(posts.map((p) => (p.id === editing.id ? editing : p)));
    } finally {
      setSavingPost(false);
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
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <button onClick={() => setEditing(null)} className="inline-flex items-center gap-1.5 text-sm leading-none text-muted hover:text-foreground transition-colors">
            <ArrowLeft size={14} className="shrink-0" />
            返回列表
          </button>
          <div className="flex items-center gap-2">
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
          <FieldInput
            label="标签（逗号分隔）"
            value={editing.tags.join(", ")}
            onChange={(v) => setEditing({ ...editing, tags: v.split(",").map((t) => t.trim()).filter(Boolean) })}
          />
        </div>

        {/* Markdown Editor */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted">内容（Markdown）</label>
          <MdEditor
            value={editing.content}
            onChange={(v) => setEditing({ ...editing, content: v })}
            height={600}
          />
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="space-y-3">
      {posts.map((post) => (
        <div key={post.id} className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
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
      <button
        onClick={createPost}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border py-3 text-sm text-muted transition-colors hover:border-accent hover:text-accent"
      >
        <Plus size={16} />
        写新文章
      </button>
    </div>
  );
}
