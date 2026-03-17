"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  LogOut,
  Plus,
  Trash2,
  Save,
  Loader2,
  CheckCircle,
  FolderKanban,
  Briefcase,
  Wrench,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Shield,
  PenLine,
  Settings,
  MessageSquare,
  Eye,
  EyeOff,
  Edit3,
  MessageCircle,
} from "lucide-react";
import type { Project, Experience, SkillGroup } from "@/lib/types";
import MdEditor from "@/components/MdEditor";

type Tab = "posts" | "projects" | "experiences" | "skills" | "comments" | "guestbook" | "config";

interface PostAdmin {
  id: string;
  slug: string;
  title: string;
  description: string;
  content: string;
  date: string;
  tags: string[];
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

interface GuestbookEntry {
  id: number;
  nickname: string;
  message: string;
  createdAt: string;
}

interface CommentAdmin {
  id: number;
  postSlug: string;
  parentId: number | null;
  floor: number | null;
  nickname: string;
  content: string;
  createdAt: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [tab, setTab] = useState<Tab>("posts");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Data states
  const [projects, setProjects] = useState<Project[]>([]);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [skills, setSkills] = useState<SkillGroup[]>([]);
  const [posts, setPosts] = useState<PostAdmin[]>([]);
  const [guestbookEntries, setGuestbookEntries] = useState<GuestbookEntry[]>([]);
  const [commentsData, setCommentsData] = useState<CommentAdmin[]>([]);
  const [commentFilterSlug, setCommentFilterSlug] = useState<string>("");
  const [siteConfigData, setSiteConfigData] = useState<Record<string, string>>({});

  // Auth check
  useEffect(() => {
    fetch("/api/auth/check")
      .then((r) => r.json())
      .then((d) => {
        if (!d.authenticated) router.push("/admin/login");
        else setAuthed(true);
      })
      .catch(() => router.push("/admin/login"));
  }, [router]);

  // Load data
  const loadData = useCallback(async () => {
    const [p, e, s, posts, gb, cm, cfg] = await Promise.all([
      fetch("/api/admin/projects").then((r) => r.json()),
      fetch("/api/admin/experiences").then((r) => r.json()),
      fetch("/api/admin/skills").then((r) => r.json()),
      fetch("/api/admin/posts").then((r) => r.json()),
      fetch("/api/guestbook").then((r) => r.json()),
      fetch("/api/admin/comments").then((r) => r.json()),
      fetch("/api/admin/config").then((r) => r.json()),
    ]);
    setProjects(p);
    setExperiences(e);
    setSkills(s);
    setPosts(posts);
    setGuestbookEntries(gb.entries || []);
    setCommentsData(cm || []);
    setSiteConfigData(cfg);
  }, []);

  useEffect(() => {
    if (authed) loadData();
  }, [authed, loadData]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await Promise.all([
        fetch("/api/admin/projects", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(projects),
        }),
        fetch("/api/admin/experiences", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(experiences),
        }),
        fetch("/api/admin/skills", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(skills),
        }),
        fetch("/api/admin/config", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(siteConfigData),
        }),
      ]);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error("Save failed:", err);
    } finally {
      setSaving(false);
    }
  };

  if (authed === null) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 size={24} className="animate-spin text-muted" />
      </div>
    );
  }

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "posts", label: "博客", icon: <PenLine size={15} /> },
    { key: "projects", label: "项目", icon: <FolderKanban size={15} /> },
    { key: "experiences", label: "经历", icon: <Briefcase size={15} /> },
    { key: "skills", label: "技能", icon: <Wrench size={15} /> },
    { key: "comments", label: "评论", icon: <MessageCircle size={15} /> },
    { key: "guestbook", label: "留言", icon: <MessageSquare size={15} /> },
    { key: "config", label: "设置", icon: <Settings size={15} /> },
  ];

  return (
    <div className="mx-auto max-w-5xl px-6 lg:px-8">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-border py-6">
        <div className="flex items-center gap-2.5">
          <Shield size={18} className="text-accent" />
          <h1 className="text-xl font-bold tracking-tight">内容管理</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3.5 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <CheckCircle size={14} /> : <Save size={14} />}
            {saving ? "保存中" : saved ? "已保存" : "保存"}
          </button>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3.5 py-2 text-sm text-muted transition-colors hover:text-foreground hover:bg-card"
          >
            <LogOut size={14} />
            退出
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-6 mb-6 flex gap-1 rounded-lg border border-border bg-card p-1 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              tab === t.key ? "bg-accent text-white" : "text-muted hover:text-foreground"
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="pb-12">
        {tab === "posts" && <PostsEditor posts={posts} setPosts={setPosts} onViewComments={(slug) => { setCommentFilterSlug(slug); setTab("comments"); }} />}
        {tab === "projects" && <ProjectsEditor projects={projects} onChange={setProjects} />}
        {tab === "experiences" && <ExperiencesEditor experiences={experiences} onChange={setExperiences} />}
        {tab === "skills" && <SkillsEditor skills={skills} onChange={setSkills} />}
        {tab === "comments" && <CommentsManager comments={commentsData} setComments={setCommentsData} filterSlug={commentFilterSlug} setFilterSlug={setCommentFilterSlug} />}
        {tab === "guestbook" && <GuestbookManager entries={guestbookEntries} setEntries={setGuestbookEntries} />}
        {tab === "config" && <ConfigEditor config={siteConfigData} onChange={setSiteConfigData} />}
      </div>
    </div>
  );
}

// ─── Posts Editor ─────────────────────────────────────────────
function PostsEditor({ posts, setPosts, onViewComments }: { posts: PostAdmin[]; setPosts: (p: PostAdmin[]) => void; onViewComments: (slug: string) => void }) {
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
          <button onClick={() => setEditing(null)} className="text-sm text-muted hover:text-foreground transition-colors">
            ← 返回列表
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => togglePublish(editing)}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                editing.published ? "border-green-500/30 text-green-600 dark:text-green-400" : "border-border text-muted"
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

// ─── Comments Manager ────────────────────────────────────────
function CommentsManager({
  comments,
  setComments,
  filterSlug,
  setFilterSlug,
}: {
  comments: CommentAdmin[];
  setComments: (c: CommentAdmin[]) => void;
  filterSlug: string;
  setFilterSlug: (s: string) => void;
}) {
  const [loading, setLoading] = useState(false);

  // 按 slug 筛选加载评论
  const loadComments = useCallback(async (slug?: string) => {
    setLoading(true);
    try {
      const url = slug ? `/api/admin/comments?slug=${encodeURIComponent(slug)}` : "/api/admin/comments";
      const res = await fetch(url);
      const data = await res.json();
      setComments(data || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [setComments]);

  // 当 filterSlug 变化时重新加载
  useEffect(() => {
    loadComments(filterSlug || undefined);
  }, [filterSlug, loadComments]);

  const deleteEntry = async (id: number) => {
    if (!confirm("确定删除这条评论？（回复也会一起删除）")) return;
    await fetch(`/api/admin/comments/${id}`, { method: "DELETE" });
    setComments(comments.filter((c) => c.id !== id && c.parentId !== id));
  };

  const clearFilter = () => {
    setFilterSlug("");
  };

  return (
    <div className="space-y-4">
      {/* 筛选栏 */}
      {filterSlug && (
        <div className="flex items-center gap-2 rounded-lg border border-accent/30 bg-accent/5 px-4 py-2.5">
          <span className="text-sm text-muted">筛选文章：</span>
          <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent">/{filterSlug}</span>
          <button onClick={clearFilter} className="ml-auto text-xs text-muted hover:text-foreground transition-colors">
            清除筛选
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 size={20} className="animate-spin text-muted" />
        </div>
      ) : comments.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-12 text-center">
          <MessageCircle size={28} className="mx-auto mb-3 text-muted" />
          <p className="text-muted">{filterSlug ? "该文章暂无评论" : "暂无评论"}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <div key={comment.id} className={`rounded-lg border border-border bg-card px-4 py-3 ${comment.parentId ? "ml-6 border-l-2 border-l-accent/20" : ""}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium">{comment.nickname}</span>
                    {comment.floor && (
                      <span className="rounded bg-muted/15 px-1.5 py-0.5 text-xs text-muted">#{comment.floor}</span>
                    )}
                    {comment.parentId && (
                      <span className="rounded bg-orange-500/10 px-1.5 py-0.5 text-xs text-orange-600 dark:text-orange-400">回复</span>
                    )}
                    {!filterSlug && (
                      <button
                        onClick={() => setFilterSlug(comment.postSlug)}
                        className="rounded-full bg-accent/10 px-2 py-0.5 text-xs text-accent hover:bg-accent/20 transition-colors"
                      >
                        /{comment.postSlug}
                      </button>
                    )}
                    <span className="text-xs text-muted">{new Date(comment.createdAt + "Z").toLocaleString("zh-CN")}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted whitespace-pre-wrap">{comment.content}</p>
                </div>
                <button onClick={() => deleteEntry(comment.id)} className="shrink-0 rounded p-1 text-muted transition-colors hover:text-red-500">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Guestbook Manager ───────────────────────────────────────
function GuestbookManager({ entries, setEntries }: { entries: GuestbookEntry[]; setEntries: (e: GuestbookEntry[]) => void }) {
  const deleteEntry = async (id: number) => {
    if (!confirm("确定删除这条留言？")) return;
    await fetch(`/api/admin/guestbook/${id}`, { method: "DELETE" });
    setEntries(entries.filter((e) => e.id !== id));
  };

  if (entries.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-12 text-center">
        <MessageSquare size={28} className="mx-auto mb-3 text-muted" />
        <p className="text-muted">暂无留言</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {entries.map((entry) => (
        <div key={entry.id} className="rounded-lg border border-border bg-card px-4 py-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{entry.nickname}</span>
                <span className="text-xs text-muted">{new Date(entry.createdAt).toLocaleString("zh-CN")}</span>
              </div>
              <p className="mt-1 text-sm text-muted">{entry.message}</p>
            </div>
            <button onClick={() => deleteEntry(entry.id)} className="shrink-0 rounded p-1 text-muted transition-colors hover:text-red-500">
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Config Editor ────────────────────────────────────────────
function ConfigEditor({ config, onChange }: { config: Record<string, string>; onChange: (c: Record<string, string>) => void }) {
  const update = (key: string, value: string) => {
    onChange({ ...config, [key]: value });
  };

  const sections = [
    {
      title: "站点信息",
      fields: [
        { key: "site.name", label: "站点名称" },
        { key: "site.description", label: "站点描述" },
        { key: "site.url", label: "站点 URL" },
      ],
    },
    {
      title: "个人信息",
      fields: [
        { key: "author.name", label: "姓名" },
        { key: "author.bio", label: "个人简介", multiline: true },
        { key: "author.location", label: "所在地" },
        { key: "author.email", label: "邮箱" },
      ],
    },
    {
      title: "Hero 区域",
      fields: [
        { key: "hero.greeting", label: "问候语" },
        { key: "hero.name", label: "显示名称" },
        { key: "hero.tagline", label: "标语（用 / 分隔多个角色）" },
        { key: "hero.description", label: "描述", multiline: true },
      ],
    },
    {
      title: "社交链接",
      fields: [
        { key: "social.github", label: "GitHub" },
        { key: "social.twitter", label: "Twitter" },
        { key: "social.email", label: "Email (mailto:...)" },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {sections.map((section) => (
        <div key={section.title} className="rounded-lg border border-border bg-card p-5">
          <h3 className="mb-4 text-sm font-semibold">{section.title}</h3>
          <div className="space-y-3">
            {section.fields.map((field) =>
              field.multiline ? (
                <FieldTextarea
                  key={field.key}
                  label={field.label}
                  value={config[field.key] || ""}
                  onChange={(v) => update(field.key, v)}
                />
              ) : (
                <FieldInput
                  key={field.key}
                  label={field.label}
                  value={config[field.key] || ""}
                  onChange={(v) => update(field.key, v)}
                />
              )
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Project Editor ───────────────────────────────────────────
function ProjectsEditor({ projects, onChange }: { projects: Project[]; onChange: (p: Project[]) => void }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const addProject = () => {
    const newProject: Project = {
      id: Date.now().toString(),
      title: "新项目",
      description: "",
      tags: [],
      featured: false,
      order: projects.length,
    };
    onChange([...projects, newProject]);
    setExpanded(newProject.id);
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    onChange(projects.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  };

  const removeProject = (id: string) => {
    onChange(projects.filter((p) => p.id !== id));
  };

  const moveProject = (index: number, direction: "up" | "down") => {
    const arr = [...projects];
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= arr.length) return;
    [arr[index], arr[target]] = [arr[target], arr[index]];
    arr.forEach((p, i) => (p.order = i));
    onChange(arr);
  };

  return (
    <div className="space-y-3">
      {projects.map((project, index) => (
        <div key={project.id} className="rounded-lg border border-border bg-card">
          <div className="flex cursor-pointer items-center gap-3 px-4 py-3" onClick={() => setExpanded(expanded === project.id ? null : project.id)}>
            <GripVertical size={14} className="text-muted" />
            <div className="flex items-center gap-2">
              <button onClick={(e) => { e.stopPropagation(); moveProject(index, "up"); }} className="rounded p-0.5 text-muted hover:text-foreground" disabled={index === 0}><ChevronUp size={14} /></button>
              <button onClick={(e) => { e.stopPropagation(); moveProject(index, "down"); }} className="rounded p-0.5 text-muted hover:text-foreground" disabled={index === projects.length - 1}><ChevronDown size={14} /></button>
            </div>
            <span className="flex-1 text-sm font-medium">{project.title}</span>
            {project.featured && <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs text-accent">精选</span>}
            <button onClick={(e) => { e.stopPropagation(); removeProject(project.id); }} className="rounded p-1 text-muted transition-colors hover:text-red-500"><Trash2 size={14} /></button>
          </div>
          {expanded === project.id && (
            <div className="space-y-3 border-t border-border px-4 py-4">
              <FieldInput label="标题" value={project.title} onChange={(v) => updateProject(project.id, { title: v })} />
              <FieldTextarea label="描述" value={project.description} onChange={(v) => updateProject(project.id, { description: v })} />
              <FieldInput label="标签（逗号分隔）" value={project.tags.join(", ")} onChange={(v) => updateProject(project.id, { tags: v.split(",").map((t) => t.trim()).filter(Boolean) })} />
              <div className="grid grid-cols-2 gap-3">
                <FieldInput label="项目链接" value={project.link || ""} onChange={(v) => updateProject(project.id, { link: v || undefined })} placeholder="https://..." />
                <FieldInput label="GitHub 链接" value={project.github || ""} onChange={(v) => updateProject(project.id, { github: v || undefined })} placeholder="https://github.com/..." />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={project.featured || false} onChange={(e) => updateProject(project.id, { featured: e.target.checked })} className="rounded accent-accent" />
                设为精选项目
              </label>
            </div>
          )}
        </div>
      ))}
      <button onClick={addProject} className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border py-3 text-sm text-muted transition-colors hover:border-accent hover:text-accent">
        <Plus size={16} />添加项目
      </button>
    </div>
  );
}

// ─── Experience Editor ────────────────────────────────────────
function ExperiencesEditor({ experiences, onChange }: { experiences: Experience[]; onChange: (e: Experience[]) => void }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const addExperience = () => {
    const newExp: Experience = { id: Date.now().toString(), title: "新经历", company: "", period: "", description: "", tags: [], order: experiences.length };
    onChange([...experiences, newExp]);
    setExpanded(newExp.id);
  };

  const updateExperience = (id: string, updates: Partial<Experience>) => {
    onChange(experiences.map((e) => (e.id === id ? { ...e, ...updates } : e)));
  };

  const removeExperience = (id: string) => {
    onChange(experiences.filter((e) => e.id !== id));
  };

  const moveExperience = (index: number, direction: "up" | "down") => {
    const arr = [...experiences];
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= arr.length) return;
    [arr[index], arr[target]] = [arr[target], arr[index]];
    arr.forEach((e, i) => (e.order = i));
    onChange(arr);
  };

  return (
    <div className="space-y-3">
      {experiences.map((exp, index) => (
        <div key={exp.id} className="rounded-lg border border-border bg-card">
          <div className="flex cursor-pointer items-center gap-3 px-4 py-3" onClick={() => setExpanded(expanded === exp.id ? null : exp.id)}>
            <GripVertical size={14} className="text-muted" />
            <div className="flex items-center gap-2">
              <button onClick={(e) => { e.stopPropagation(); moveExperience(index, "up"); }} className="rounded p-0.5 text-muted hover:text-foreground" disabled={index === 0}><ChevronUp size={14} /></button>
              <button onClick={(e) => { e.stopPropagation(); moveExperience(index, "down"); }} className="rounded p-0.5 text-muted hover:text-foreground" disabled={index === experiences.length - 1}><ChevronDown size={14} /></button>
            </div>
            <div className="flex-1">
              <span className="text-sm font-medium">{exp.title}</span>
              {exp.company && <span className="ml-2 text-xs text-muted">@ {exp.company}</span>}
            </div>
            <button onClick={(e) => { e.stopPropagation(); removeExperience(exp.id); }} className="rounded p-1 text-muted transition-colors hover:text-red-500"><Trash2 size={14} /></button>
          </div>
          {expanded === exp.id && (
            <div className="space-y-3 border-t border-border px-4 py-4">
              <div className="grid grid-cols-2 gap-3">
                <FieldInput label="职位/学位" value={exp.title} onChange={(v) => updateExperience(exp.id, { title: v })} />
                <FieldInput label="公司/学校" value={exp.company} onChange={(v) => updateExperience(exp.id, { company: v })} />
              </div>
              <FieldInput label="时间段" value={exp.period} onChange={(v) => updateExperience(exp.id, { period: v })} placeholder="如：2022 - 2024" />
              <FieldTextarea label="描述" value={exp.description} onChange={(v) => updateExperience(exp.id, { description: v })} />
              <FieldInput label="标签（逗号分隔）" value={(exp.tags || []).join(", ")} onChange={(v) => updateExperience(exp.id, { tags: v.split(",").map((t) => t.trim()).filter(Boolean) })} />
            </div>
          )}
        </div>
      ))}
      <button onClick={addExperience} className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border py-3 text-sm text-muted transition-colors hover:border-accent hover:text-accent">
        <Plus size={16} />添加经历
      </button>
    </div>
  );
}

// ─── Skills Editor ────────────────────────────────────────────
function SkillsEditor({ skills, onChange }: { skills: SkillGroup[]; onChange: (s: SkillGroup[]) => void }) {
  const addGroup = () => {
    const g: SkillGroup = { id: Date.now().toString(), name: "新分组", skills: [], order: skills.length };
    onChange([...skills, g]);
  };

  const updateGroup = (id: string, updates: Partial<SkillGroup>) => {
    onChange(skills.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  };

  const removeGroup = (id: string) => {
    onChange(skills.filter((s) => s.id !== id));
  };

  return (
    <div className="space-y-4">
      {skills.map((group) => (
        <div key={group.id} className="rounded-lg border border-border bg-card p-4">
          <div className="mb-3 flex items-center gap-3">
            <input value={group.name} onChange={(e) => updateGroup(group.id, { name: e.target.value })} className="flex-1 rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium outline-none focus:border-accent" />
            <button onClick={() => removeGroup(group.id)} className="rounded p-1 text-muted transition-colors hover:text-red-500"><Trash2 size={14} /></button>
          </div>
          <FieldInput label="技能（逗号分隔）" value={group.skills.join(", ")} onChange={(v) => updateGroup(group.id, { skills: v.split(",").map((t) => t.trim()).filter(Boolean) })} placeholder="React, TypeScript, Next.js" />
        </div>
      ))}
      <button onClick={addGroup} className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border py-3 text-sm text-muted transition-colors hover:border-accent hover:text-accent">
        <Plus size={16} />添加技能分组
      </button>
    </div>
  );
}

// ─── Shared Field Components ──────────────────────────────────
function FieldInput({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-muted">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-accent" />
    </div>
  );
}

function FieldTextarea({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-muted">{label}</label>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-accent" />
    </div>
  );
}
