"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  LogOut,
  Save,
  Loader2,
  CheckCircle,
  FolderKanban,
  Briefcase,
  Wrench,
  Shield,
  PenLine,
  Settings,
  MessageSquare,
  MessageCircle,
  Menu,
  X,
  ImageIcon,
  Search,
  BookOpen,
} from "lucide-react";
import type { Tab, PostAdmin, NoteAdmin, NoteGroupOrder, GuestbookEntry, CommentAdmin, Project, Experience, SkillGroup } from "@/components/admin/types";
import PostsEditor from "@/components/admin/PostsEditor";
import NotesEditor from "@/components/admin/NotesEditor";
import CommentsManager from "@/components/admin/CommentsManager";
import GuestbookManager from "@/components/admin/GuestbookManager";
import ConfigEditor from "@/components/admin/ConfigEditor";
import ProjectsEditor from "@/components/admin/ProjectsEditor";
import ExperiencesEditor from "@/components/admin/ExperiencesEditor";
import SkillsEditor from "@/components/admin/SkillsEditor";
import ImagesManager from "@/components/admin/ImagesManager";
import { HttpError, requireOk } from "@/lib/admin/client-api";
import { useDebouncedAutosave } from "@/lib/admin/use-debounced-autosave";

type BulkKey = "projects" | "experiences" | "skills" | "config";
type BulkVersions = Record<BulkKey, string>;

async function loadAdminResource(url: string, label: string, kind: "array" | "object", versioned = false) {
  const response = await requireOk(await fetch(url, { cache: "no-store" }), `${label}加载失败`);
  const data: unknown = await response.json();
  if (kind === "array" ? !Array.isArray(data) : !data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error(`${label}返回的数据格式错误`);
  }
  const revision = response.headers.get("X-Data-Revision");
  if (versioned && !revision) throw new Error(`${label}缺少数据版本`);
  return { data, revision: revision ?? "" };
}

function parseCommaSeparated(input: string): string[] {
  return input
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function AdminDashboard() {
  const router = useRouter();
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [tab, setTab] = useState<Tab>("posts");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [autoSaveBlocked, setAutoSaveBlocked] = useState(false);
  const [postPending, setPostPending] = useState(false);
  const [notePending, setNotePending] = useState(false);
  const [versions, setVersions] = useState<BulkVersions>({ projects: "", experiences: "", skills: "", config: "" });
  const [baseline, setBaseline] = useState<BulkVersions | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sidebarPlaceholderRef = useRef<HTMLDivElement>(null);
  const [sidebarLeft, setSidebarLeft] = useState<number | null>(null);
  const [isTall, setIsTall] = useState(true); // viewport height >= 700
  const [contentShowIndex, setContentShowIndex] = useState(false);
  const [initialPostEditId, setInitialPostEditId] = useState<string | null>(null);
  const [initialNoteEditId, setInitialNoteEditId] = useState<string | null>(null);
  const queryInitRef = useRef(false);

  // Track viewport height + sidebar horizontal position
  useEffect(() => {
    const sync = () => {
      setIsTall(window.innerHeight >= 700);
      const el = sidebarPlaceholderRef.current;
      setSidebarLeft(el ? el.getBoundingClientRect().left : null);
    };
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, [authed, loadState, isTall]);

  // Data states
  const [projects, setProjects] = useState<Project[]>([]);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [skills, setSkills] = useState<SkillGroup[]>([]);
  const [posts, setPosts] = useState<PostAdmin[]>([]);
  const [notes, setNotes] = useState<NoteAdmin[]>([]);
  const [noteGroupOrders, setNoteGroupOrders] = useState<NoteGroupOrder[]>([]);
  const [guestbookEntries, setGuestbookEntries] = useState<GuestbookEntry[]>([]);
  const [commentsData, setCommentsData] = useState<CommentAdmin[]>([]);
  const [commentFilterSlug, setCommentFilterSlug] = useState<string>("");
  const [siteConfigData, setSiteConfigData] = useState<Record<string, string>>({});

  useEffect(() => {
    if (queryInitRef.current) return;

    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get("tab");
    const editParam = params.get("edit");
    if (
      tabParam === "posts" ||
      tabParam === "notes" ||
      tabParam === "projects" ||
      tabParam === "experiences" ||
      tabParam === "skills" ||
      tabParam === "comments" ||
      tabParam === "guestbook" ||
      tabParam === "images" ||
      tabParam === "config"
    ) {
      setTab(tabParam);
    }

    if (editParam && tabParam === "posts") {
      setInitialPostEditId(editParam);
    }
    if (editParam && tabParam === "notes") {
      setInitialNoteEditId(editParam);
    }

    queryInitRef.current = true;
  }, []);

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
    setLoadState("loading");
    setLoadError("");
    setAutoSaveBlocked(false);
    try {
      const [p, e, s, posts, notes, noteGroups, gb, cm, cfg] = await Promise.all([
        loadAdminResource("/api/admin/projects", "项目", "array", true),
        loadAdminResource("/api/admin/experiences", "经历", "array", true),
        loadAdminResource("/api/admin/skills", "技能", "array", true),
        loadAdminResource("/api/admin/posts", "博客", "array"),
        loadAdminResource("/api/admin/notes", "笔记", "array"),
        loadAdminResource("/api/admin/notes/groups", "笔记分组", "array"),
        loadAdminResource("/api/guestbook", "留言", "object"),
        loadAdminResource("/api/admin/comments", "评论", "array"),
        loadAdminResource("/api/admin/config", "设置", "object", true),
      ]);
      const guestbook = gb.data as { entries?: unknown };
      if (!Array.isArray(guestbook.entries)) throw new Error("留言返回的数据格式错误");
      setProjects(p.data as Project[]);
      setExperiences(e.data as Experience[]);
      setSkills(s.data as SkillGroup[]);
      setPosts(posts.data as PostAdmin[]);
      setNotes(notes.data as NoteAdmin[]);
      setNoteGroupOrders(noteGroups.data as NoteGroupOrder[]);
      setGuestbookEntries(guestbook.entries as GuestbookEntry[]);
      setCommentsData(cm.data as CommentAdmin[]);
      setSiteConfigData(cfg.data as Record<string, string>);
      setVersions({ projects: p.revision, experiences: e.revision, skills: s.revision, config: cfg.revision });
      setBaseline({
        projects: JSON.stringify(p.data),
        experiences: JSON.stringify(e.data),
        skills: JSON.stringify(s.data),
        config: JSON.stringify(cfg.data),
      });
      setLoadState("ready");
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "后台数据加载失败");
      setLoadState("error");
    }
  }, []);

  useEffect(() => {
    if (authed) loadData();
  }, [authed, loadData]);

  const handleLogout = async () => {
    if (saving) {
      setSaveError("内容正在保存，请稍候再退出");
      return;
    }
    if ((changedKeys.length > 0 || postPending || notePending) &&
      !confirm("仍有未保存的修改，确定退出并放弃这些修改？")) return;
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
  };

  const normalizedProjects = projects.map((p) => ({ ...p, tags: parseCommaSeparated((p.tags || []).join(",")) }));
  const normalizedExperiences = experiences.map((e) => ({ ...e, tags: parseCommaSeparated((e.tags || []).join(",")) }));
  const normalizedSkills = skills.map((s) => ({ ...s, skills: parseCommaSeparated((s.skills || []).join(",")) }));
  const currentSnapshots: BulkVersions = {
    projects: JSON.stringify(normalizedProjects),
    experiences: JSON.stringify(normalizedExperiences),
    skills: JSON.stringify(normalizedSkills),
    config: JSON.stringify(siteConfigData),
  };
  const latestSnapshotsRef = useRef(currentSnapshots);
  latestSnapshotsRef.current = currentSnapshots;
  const changedKeys: BulkKey[] = baseline
    ? (["projects", "experiences", "skills", "config"] as BulkKey[]).filter((key) => currentSnapshots[key] !== baseline[key])
    : [];
  const pendingKey = changedKeys.length
    ? JSON.stringify(currentSnapshots)
    : null;

  const handleSave = async () => {
    if (loadState !== "ready" || saving || changedKeys.length === 0) return;
    markAutoSaveAttempt();
    setSaving(true);
    setSaved(false);
    setSaveError("");
    try {
      const payloads: Record<BulkKey, unknown> = {
        projects: normalizedProjects,
        experiences: normalizedExperiences,
        skills: normalizedSkills,
        config: siteConfigData,
      };
      const labels: Record<BulkKey, string> = { projects: "项目", experiences: "经历", skills: "技能", config: "设置" };
      const results = await Promise.allSettled(changedKeys.map(async (key) => {
        const response = await requireOk(await fetch(`/api/admin/${key}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", "If-Match": versions[key] },
          body: JSON.stringify(payloads[key]),
        }), `${labels[key]}保存失败`);
        const revision = response.headers.get("X-Data-Revision");
        if (!revision) throw new Error(`${labels[key]}保存后缺少数据版本`);
        return { key, revision, snapshot: currentSnapshots[key] };
      }));
      const successful = results.flatMap((result) => result.status === "fulfilled" ? [result.value] : []);
      setBaseline((previous) => {
        if (!previous) return previous;
        const next = { ...previous };
        successful.forEach(({ key, snapshot }) => { next[key] = snapshot; });
        return next;
      });
      setVersions((previous) => {
        const next = { ...previous };
        successful.forEach(({ key, revision }) => { next[key] = revision; });
        return next;
      });
      const failures = results.flatMap((result, index) =>
        result.status === "rejected"
          ? [`${labels[changedKeys[index]]}：${result.reason instanceof Error ? result.reason.message : "保存失败"}`]
          : []
      );
      if (failures.length > 0) {
        if (results.some((result) => result.status === "rejected" &&
          result.reason instanceof HttpError && [409, 428].includes(result.reason.status))) {
          setAutoSaveBlocked(true);
        }
        setSaveError(`部分内容未保存：${failures.join("；")}`);
      } else if (changedKeys.some((key) => latestSnapshotsRef.current[key] !== currentSnapshots[key])) {
        setSaveError("保存期间又有修改，请再次保存剩余改动");
      } else {
        setAutoSaveBlocked(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "自动保存失败，请点击立即保存重试");
    } finally {
      setSaving(false);
    }
  };

  const markAutoSaveAttempt = useDebouncedAutosave(
    pendingKey,
    loadState === "ready" && !saving && !autoSaveBlocked,
    handleSave
  );

  if (authed === null) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 size={24} className="animate-spin text-muted" />
      </div>
    );
  }

  if (loadState !== "ready") {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
        {loadState === "loading" ? <Loader2 size={24} className="animate-spin text-muted" /> : (
          <>
            <p className="text-sm text-red-500">{loadError}</p>
            <button onClick={loadData} className="rounded-lg bg-accent px-4 py-2 text-sm text-white">重新加载</button>
          </>
        )}
      </div>
    );
  }

  const navItems: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "posts", label: "博客", icon: <PenLine size={16} /> },
    { key: "notes", label: "笔记", icon: <BookOpen size={16} /> },
    { key: "projects", label: "项目", icon: <FolderKanban size={16} /> },
    { key: "experiences", label: "经历", icon: <Briefcase size={16} /> },
    { key: "skills", label: "技能", icon: <Wrench size={16} /> },
    { key: "comments", label: "评论", icon: <MessageCircle size={16} /> },
    { key: "guestbook", label: "留言", icon: <MessageSquare size={16} /> },
    { key: "images", label: "图片", icon: <ImageIcon size={16} /> },
    { key: "config", label: "设置", icon: <Settings size={16} /> },
  ];

  const switchTab = (key: Tab) => {
    setTab(key);
    setSidebarOpen(false);
    if (key !== "posts") setInitialPostEditId(null);
    if (key !== "notes") setInitialNoteEditId(null);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 lg:px-6">
      {saveError && (
        <div role="alert" className="mb-4 rounded-lg border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-600 dark:text-red-400">
          {saveError}
        </div>
      )}
      {/* ─── Mobile: overlay backdrop + drawer ─── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile top bar (always visible on small screens) */}
      <div className="mb-4 flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 lg:hidden">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded p-1.5 text-muted hover:text-foreground"
          >
            <Menu size={18} />
          </button>
          <h2 className="text-base font-semibold tracking-tight">
            {navItems.find((n) => n.key === tab)?.label}
          </h2>
        </div>

        {(tab === "posts" || tab === "notes") && (
          <button
            onClick={() => setContentShowIndex((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-xs text-muted transition-colors hover:text-foreground"
          >
            <Search size={12} />
            {contentShowIndex ? "收起索引" : "展开索引"}
          </button>
        )}
      </div>

      {/* Mobile sidebar drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-56 flex-col border-r border-border bg-card transition-transform duration-200 lg:hidden ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        <div className="flex items-center gap-2.5 border-b border-border px-4 py-4">
          <Shield size={18} className="shrink-0 text-accent" />
          <h1 className="text-sm font-bold tracking-tight">内容管理</h1>
          <button
            onClick={() => setSidebarOpen(false)}
            className="ml-auto rounded p-1 text-muted hover:text-foreground"
          >
            <X size={16} />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-2 py-3">
          <div className="space-y-0.5">
            {navItems.map((item) => (
              <button
                key={item.key}
                onClick={() => switchTab(item.key)}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${tab === item.key
                    ? "bg-accent/10 text-accent"
                    : "text-muted hover:bg-card hover:text-foreground"
                  }`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </div>
        </nav>
        <div className="border-t border-border p-3 space-y-2">
          <button
            onClick={handleSave}
            disabled={saving || changedKeys.length === 0}
            title="保存项目、经历、技能和设置的改动"
            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : saved && changedKeys.length === 0 ? <CheckCircle size={14} /> : <Save size={14} />}
            {saving ? "保存中" : changedKeys.length ? "立即保存" : saved ? "已保存" : "自动保存"}
          </button>
          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm text-muted transition-colors hover:text-foreground hover:bg-background"
          >
            <LogOut size={14} />
            退出
          </button>
        </div>
      </aside>

      {/* ─── Desktop: short viewport → top toolbar + tab bar (original layout) ─── */}
      {!isTall && (
        <div className="hidden lg:block">
          <div className="flex items-center justify-between border-b border-border py-6">
            <div className="flex items-center gap-2.5">
              <Shield size={18} className="text-accent" />
              <h1 className="text-xl font-bold tracking-tight">内容管理</h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSave}
                disabled={saving || changedKeys.length === 0}
                title="保存项目、经历、技能和设置的改动"
                className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3.5 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : saved && changedKeys.length === 0 ? <CheckCircle size={14} /> : <Save size={14} />}
                {saving ? "保存中" : changedKeys.length ? "立即保存" : saved ? "已保存" : "自动保存"}
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
          <div className="mt-6 mb-6 flex gap-1 rounded-lg border border-border bg-card p-1 overflow-x-auto">
            {navItems.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors ${tab === t.key ? "bg-accent text-white" : "text-muted hover:text-foreground"
                  }`}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ─── Main layout ─── */}
      <div className={isTall ? "flex gap-6" : ""}>
        {/* Desktop sidebar: only when viewport tall enough */}
        {isTall && (
          <>
            <div ref={sidebarPlaceholderRef} className="hidden lg:block lg:w-44 lg:shrink-0" />
            {sidebarLeft !== null && (
              <nav
                className="fixed top-[20vh] hidden w-44 lg:block"
                style={{ left: sidebarLeft }}
              >
                <div className="space-y-1">
                  <div className="mb-3 flex items-center gap-2 px-2">
                    <Shield size={16} className="text-accent" />
                    <span className="text-xl font-bold tracking-tight text-foreground">内容管理</span>
                  </div>
                  {navItems.map((item) => (
                    <button
                      key={item.key}
                      onClick={() => setTab(item.key)}
                      className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors ${tab === item.key
                          ? "bg-accent/10 text-accent"
                          : "text-muted hover:text-foreground"
                        }`}
                    >
                      {item.icon}
                      {item.label}
                    </button>
                  ))}
                  <div className="mt-4 space-y-2 border-t border-border pt-4">
                    <button
                      onClick={handleSave}
                      disabled={saving || changedKeys.length === 0}
                      title="保存项目、经历、技能和设置的改动"
                      className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                    >
                      {saving ? <Loader2 size={14} className="animate-spin" /> : saved && changedKeys.length === 0 ? <CheckCircle size={14} /> : <Save size={14} />}
                      {saving ? "保存中" : changedKeys.length ? "立即保存" : saved ? "已保存" : "自动保存"}
                    </button>
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-muted transition-colors hover:text-foreground hover:bg-background"
                    >
                      <LogOut size={14} />
                      退出
                    </button>
                  </div>
                </div>
              </nav>
            )}
          </>
        )}

        {/* Content area */}
        <div className="min-w-0 flex-1">
          {(tab === "projects" || tab === "experiences" || tab === "skills" || tab === "config") && (
            <p aria-live="polite" className="mb-3 text-xs text-muted">
              {saving ? "自动保存中…" : autoSaveBlocked ? "版本冲突，自动保存已暂停" : saveError ? "自动保存失败，可点击立即保存重试" : changedKeys.length ? "修改后约 1.2 秒自动保存" : "所有修改已保存"}
            </p>
          )}
          {isTall && (
            <div className="mb-5 hidden items-center justify-between lg:flex">
              <h2 className="text-lg font-semibold tracking-tight">
                {navItems.find((n) => n.key === tab)?.label}
              </h2>
              {(tab === "posts" || tab === "notes") && (
                <button
                  onClick={() => setContentShowIndex((v) => !v)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-sm text-muted transition-colors hover:text-foreground"
                >
                  <Search size={14} />
                  {contentShowIndex ? "收起搜索/索引" : "展开搜索/索引"}
                </button>
              )}
            </div>
          )}
          <div hidden={tab !== "posts"}>
            <PostsEditor
              posts={posts}
              setPosts={setPosts}
              showIndex={contentShowIndex}
              initialEditId={initialPostEditId}
              onPendingChange={setPostPending}
              onViewComments={(slug) => {
                setCommentFilterSlug(slug);
                setTab("comments");
              }}
            />
          </div>
          <div hidden={tab !== "notes"}>
            <NotesEditor
              notes={notes}
              setNotes={setNotes}
              groupOrders={noteGroupOrders}
              setGroupOrders={setNoteGroupOrders}
              showIndex={contentShowIndex}
              initialEditId={initialNoteEditId}
              onPendingChange={setNotePending}
            />
          </div>
          {tab === "projects" && <ProjectsEditor projects={projects} onChange={setProjects} posts={posts} />}
          {tab === "experiences" && <ExperiencesEditor experiences={experiences} onChange={setExperiences} posts={posts} />}
          {tab === "skills" && <SkillsEditor skills={skills} onChange={setSkills} />}
          {tab === "comments" && <CommentsManager comments={commentsData} setComments={setCommentsData} filterSlug={commentFilterSlug} setFilterSlug={setCommentFilterSlug} />}
          {tab === "guestbook" && <GuestbookManager entries={guestbookEntries} setEntries={setGuestbookEntries} />}
          {tab === "images" && <ImagesManager />}
          {tab === "config" && <ConfigEditor config={siteConfigData} onChange={setSiteConfigData} />}
        </div>
      </div>
    </div>
  );
}
