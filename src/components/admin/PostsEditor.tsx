"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Trash2, Save, Loader2, Eye, EyeOff, Edit3, MessageCircle, ArrowLeft, FileText, Upload, FileCheck } from "lucide-react";
import type { PostAdmin } from "./types";
import { FieldCommaInput, FieldInput } from "./FormFields";
import MdEditor from "@/components/admin/MdEditor";
import { HttpError, requireOk } from "@/lib/admin/client-api";
import { useDebouncedAutosave } from "@/lib/admin/use-debounced-autosave";

function parseCommaSeparated(input: string): string[] {
  return input
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function postDraft(post: PostAdmin): string {
  return JSON.stringify({
    slug: post.slug,
    title: post.title,
    description: post.description,
    content: post.content,
    contentType: post.contentType,
    pdfId: post.pdfId ?? null,
    date: post.date,
    tags: post.tags,
    published: post.published,
    commentsEnabled: post.commentsEnabled,
  });
}

export default function PostsEditor({
  posts,
  setPosts,
  onViewComments,
  showIndex,
  initialEditId,
  onPendingChange,
}: {
  posts: PostAdmin[];
  setPosts: React.Dispatch<React.SetStateAction<PostAdmin[]>>;
  onViewComments: (slug: string) => void;
  showIndex: boolean;
  initialEditId?: string | null;
  onPendingChange: (pending: boolean) => void;
}) {
  const [editing, setEditing] = useState<PostAdmin | null>(null);
  const [savingPost, setSavingPost] = useState(false);
  const savingPostRef = useRef(false);
  const [saveError, setSaveError] = useState("");
  const [autoSaveBlocked, setAutoSaveBlocked] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "markdown" | "pdf">("all");
  const [tagFilter, setTagFilter] = useState<string>("all");
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const initialAppliedRef = useRef(false);

  const persistedPost = editing ? posts.find((post) => post.id === editing.id) : null;
  const draftKey = editing && persistedPost && postDraft(editing) !== postDraft(persistedPost)
    ? `${editing.id}:${postDraft(editing)}`
    : null;
  const latestEditingRef = useRef(editing);
  latestEditingRef.current = editing;

  useEffect(() => {
    onPendingChange(Boolean(draftKey) || savingPost);
  }, [draftKey, savingPost, onPendingChange]);

  useEffect(() => {
    if (initialAppliedRef.current || !initialEditId) return;
    const target = posts.find((p) => p.id === initialEditId);
    if (target) {
      setEditing(target);
      initialAppliedRef.current = true;
    }
  }, [initialEditId, posts]);

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
    try {
      const slug = "new-post-" + Date.now();
      const res = await requireOk(await fetch("/api/admin/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          title: contentType === "pdf" ? "新 PDF 文章" : "新文章",
          description: "",
          content: "",
          contentType,
          date: new Date().toISOString().slice(0, 10),
          tags: [],
          published: false,
        }),
      }), "创建文章失败");
      const post = await res.json();
      setPosts([post, ...posts]);
      setEditing(post);
      setSaveError("");
      setAutoSaveBlocked(false);
    } catch (error) {
      alert(error instanceof Error ? error.message : "创建文章失败");
    }
  };

  const savePost = async (): Promise<boolean> => {
    if (!editing || !draftKey || savingPostRef.current) return false;
    markAutoSaveAttempt();
    savingPostRef.current = true;
    setSavingPost(true);
    setSaveError("");
    const snapshot = editing;
    try {
      const response = await requireOk(await fetch(`/api/admin/posts/${snapshot.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: snapshot.slug,
          title: snapshot.title,
          description: snapshot.description,
          content: snapshot.content,
          contentType: snapshot.contentType,
          pdfId: snapshot.pdfId || null,
          date: snapshot.date,
          tags: parseCommaSeparated((snapshot.tags || []).join(",")),
          published: snapshot.published,
          commentsEnabled: snapshot.commentsEnabled,
          expectedUpdatedAt: snapshot.updatedAt,
        }),
      }), "保存文章失败");
      const savedPost = await response.json() as PostAdmin;
      setPosts((current) => current.map((p) => (p.id === snapshot.id ? savedPost : p)));
      setEditing((current) => {
        if (!current || current.id !== snapshot.id) return current;
        return postDraft(current) === postDraft(snapshot)
          ? savedPost
          : { ...current, updatedAt: savedPost.updatedAt };
      });
      setAutoSaveBlocked(false);
      return latestEditingRef.current?.id === snapshot.id && postDraft(latestEditingRef.current) === postDraft(snapshot);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "保存文章失败");
      if (error instanceof HttpError && [409, 428].includes(error.status)) setAutoSaveBlocked(true);
      return false;
    } finally {
      savingPostRef.current = false;
      setSavingPost(false);
    }
  };

  const markAutoSaveAttempt = useDebouncedAutosave(
    draftKey,
    Boolean(editing) && !savingPost && !uploadingPdf && !autoSaveBlocked,
    savePost
  );

  const leaveEditor = async () => {
    if (savingPostRef.current) return;
    if (draftKey && !(await savePost())) return;
    setEditing(null);
    setSaveError("");
    setAutoSaveBlocked(false);
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
      setEditing((current) => current?.id === editing.id ? {
        ...current,
        pdfId: data.id,
        content: `[PDF] ${file.name} (${(file.size / 1024 / 1024).toFixed(1)}MB)`,
      } : current);
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
    try {
      await requireOk(await fetch(`/api/admin/posts/${id}`, { method: "DELETE" }), "删除文章失败");
      setPosts(posts.filter((p) => p.id !== id));
      if (editing?.id === id) setEditing(null);
    } catch (error) {
      alert(error instanceof Error ? error.message : "删除文章失败");
    }
  };

  const togglePublish = async (post: PostAdmin) => {
    try {
      const response = await requireOk(await fetch(`/api/admin/posts/${post.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: !post.published, expectedUpdatedAt: post.updatedAt }),
      }), "更新发布状态失败");
      const updated = await response.json() as PostAdmin;
      setPosts(posts.map((p) => (p.id === post.id ? updated : p)));
      if (editing?.id === post.id) setEditing(updated);
    } catch (error) {
      alert(error instanceof Error ? error.message : "更新发布状态失败");
    }
  };

  // Editor view
  if (editing) {
    const isPdf = editing.contentType === "pdf";

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <button onClick={leaveEditor} disabled={savingPost} className="inline-flex items-center gap-1.5 text-sm leading-none text-muted hover:text-foreground transition-colors disabled:opacity-50">
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
              onClick={() => { void savePost(); }}
              disabled={savingPost || !draftKey}
              className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3.5 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {savingPost ? <Loader2 size={14} className="animate-spin" /> : draftKey ? <Save size={14} /> : <FileCheck size={14} />}
              {savingPost ? "保存中" : draftKey ? "立即保存" : "已保存"}
            </button>
          </div>
        </div>
        {saveError && <p role="alert" className="text-sm text-red-500">{saveError}</p>}
        {draftKey && !savingPost && !saveError && <p aria-live="polite" className="text-xs text-muted">停止输入约 1.2 秒后自动保存</p>}

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
      {showIndex && (
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
      )}

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
            <button onClick={() => { setEditing(post); setSaveError(""); setAutoSaveBlocked(false); }} className="rounded p-1.5 text-muted transition-colors hover:text-accent">
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
