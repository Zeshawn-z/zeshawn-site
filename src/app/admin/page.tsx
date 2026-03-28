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
} from "lucide-react";
import type { Tab, PostAdmin, GuestbookEntry, CommentAdmin, Project, Experience, SkillGroup } from "@/components/admin/types";
import PostsEditor from "@/components/admin/PostsEditor";
import CommentsManager from "@/components/admin/CommentsManager";
import GuestbookManager from "@/components/admin/GuestbookManager";
import ConfigEditor from "@/components/admin/ConfigEditor";
import ProjectsEditor from "@/components/admin/ProjectsEditor";
import ExperiencesEditor from "@/components/admin/ExperiencesEditor";
import SkillsEditor from "@/components/admin/SkillsEditor";
import ImagesManager from "@/components/admin/ImagesManager";

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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sidebarPlaceholderRef = useRef<HTMLDivElement>(null);
  const [sidebarLeft, setSidebarLeft] = useState<number | null>(null);
  const [isTall, setIsTall] = useState(true); // viewport height >= 700
  const [postsShowIndex, setPostsShowIndex] = useState(false);

  // Track viewport height + sidebar horizontal position
  useEffect(() => {
    const sync = () => {
      setIsTall(window.innerHeight >= 700);
      const el = sidebarPlaceholderRef.current;
      if (el) setSidebarLeft(el.getBoundingClientRect().left);
    };
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, [authed]);

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
      const normalizedProjects = projects.map((p) => ({
        ...p,
        tags: parseCommaSeparated((p.tags || []).join(",")),
      }));
      const normalizedExperiences = experiences.map((e) => ({
        ...e,
        tags: parseCommaSeparated((e.tags || []).join(",")),
      }));
      const normalizedSkills = skills.map((s) => ({
        ...s,
        skills: parseCommaSeparated((s.skills || []).join(",")),
      }));

      await Promise.all([
        fetch("/api/admin/projects", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(normalizedProjects),
        }),
        fetch("/api/admin/experiences", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(normalizedExperiences),
        }),
        fetch("/api/admin/skills", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(normalizedSkills),
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

  const navItems: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "posts", label: "博客", icon: <PenLine size={16} /> },
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
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 lg:px-6">
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

        {tab === "posts" && (
          <button
            onClick={() => setPostsShowIndex((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-xs text-muted transition-colors hover:text-foreground"
          >
            <Search size={12} />
            {postsShowIndex ? "收起索引" : "展开索引"}
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
            disabled={saving}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <CheckCircle size={14} /> : <Save size={14} />}
            {saving ? "保存中" : saved ? "已保存" : "保存全部"}
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
                      disabled={saving}
                      className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                    >
                      {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <CheckCircle size={14} /> : <Save size={14} />}
                      {saving ? "保存中" : saved ? "已保存" : "保存全部"}
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
          {isTall && (
            <div className="mb-5 hidden items-center justify-between lg:flex">
              <h2 className="text-lg font-semibold tracking-tight">
                {navItems.find((n) => n.key === tab)?.label}
              </h2>
              {tab === "posts" && (
                <button
                  onClick={() => setPostsShowIndex((v) => !v)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-sm text-muted transition-colors hover:text-foreground"
                >
                  <Search size={14} />
                  {postsShowIndex ? "收起搜索/索引" : "展开搜索/索引"}
                </button>
              )}
            </div>
          )}
          {tab === "posts" && (
            <PostsEditor
              posts={posts}
              setPosts={setPosts}
              showIndex={postsShowIndex}
              onViewComments={(slug) => {
                setCommentFilterSlug(slug);
                setTab("comments");
              }}
            />
          )}
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
