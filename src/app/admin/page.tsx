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
} from "lucide-react";
import type { Project, Experience, SkillGroup } from "@/lib/types";

type Tab = "projects" | "experiences" | "skills";

export default function AdminDashboard() {
  const router = useRouter();
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [tab, setTab] = useState<Tab>("projects");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Data states
  const [projects, setProjects] = useState<Project[]>([]);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [skills, setSkills] = useState<SkillGroup[]>([]);

  // Auth check
  useEffect(() => {
    fetch("/api/auth/check")
      .then((r) => r.json())
      .then((d) => {
        if (!d.authenticated) {
          router.push("/admin/login");
        } else {
          setAuthed(true);
        }
      })
      .catch(() => router.push("/admin/login"));
  }, [router]);

  // Load data
  const loadData = useCallback(async () => {
    const [p, e, s] = await Promise.all([
      fetch("/api/admin/projects").then((r) => r.json()),
      fetch("/api/admin/experiences").then((r) => r.json()),
      fetch("/api/admin/skills").then((r) => r.json()),
    ]);
    setProjects(p);
    setExperiences(e);
    setSkills(s);
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
    { key: "projects", label: "项目", icon: <FolderKanban size={15} /> },
    { key: "experiences", label: "经历", icon: <Briefcase size={15} /> },
    { key: "skills", label: "技能", icon: <Wrench size={15} /> },
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
            {saving ? (
              <Loader2 size={14} className="animate-spin" />
            ) : saved ? (
              <CheckCircle size={14} />
            ) : (
              <Save size={14} />
            )}
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
      <div className="mt-6 mb-6 flex gap-1 rounded-lg border border-border bg-card p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.key
                ? "bg-accent text-white"
                : "text-muted hover:text-foreground"
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="pb-12">
        {tab === "projects" && (
          <ProjectsEditor projects={projects} onChange={setProjects} />
        )}
        {tab === "experiences" && (
          <ExperiencesEditor
            experiences={experiences}
            onChange={setExperiences}
          />
        )}
        {tab === "skills" && (
          <SkillsEditor skills={skills} onChange={setSkills} />
        )}
      </div>
    </div>
  );
}

// ─── Project Editor ───────────────────────────────────────────
function ProjectsEditor({
  projects,
  onChange,
}: {
  projects: Project[];
  onChange: (p: Project[]) => void;
}) {
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
    const newProjects = [...projects];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newProjects.length) return;
    [newProjects[index], newProjects[targetIndex]] = [newProjects[targetIndex], newProjects[index]];
    newProjects.forEach((p, i) => (p.order = i));
    onChange(newProjects);
  };

  return (
    <div className="space-y-3">
      {projects.map((project, index) => (
        <div
          key={project.id}
          className="rounded-lg border border-border bg-card"
        >
          <div
            className="flex cursor-pointer items-center gap-3 px-4 py-3"
            onClick={() =>
              setExpanded(expanded === project.id ? null : project.id)
            }
          >
            <GripVertical size={14} className="text-muted" />
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => { e.stopPropagation(); moveProject(index, "up"); }}
                className="rounded p-0.5 text-muted hover:text-foreground"
                disabled={index === 0}
              >
                <ChevronUp size={14} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); moveProject(index, "down"); }}
                className="rounded p-0.5 text-muted hover:text-foreground"
                disabled={index === projects.length - 1}
              >
                <ChevronDown size={14} />
              </button>
            </div>
            <span className="flex-1 text-sm font-medium">{project.title}</span>
            {project.featured && (
              <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs text-accent">
                精选
              </span>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeProject(project.id);
              }}
              className="rounded p-1 text-muted transition-colors hover:text-red-500"
            >
              <Trash2 size={14} />
            </button>
          </div>
          {expanded === project.id && (
            <div className="space-y-3 border-t border-border px-4 py-4">
              <FieldInput
                label="标题"
                value={project.title}
                onChange={(v) => updateProject(project.id, { title: v })}
              />
              <FieldTextarea
                label="描述"
                value={project.description}
                onChange={(v) => updateProject(project.id, { description: v })}
              />
              <FieldInput
                label="标签（逗号分隔）"
                value={project.tags.join(", ")}
                onChange={(v) =>
                  updateProject(project.id, {
                    tags: v.split(",").map((t) => t.trim()).filter(Boolean),
                  })
                }
              />
              <div className="grid grid-cols-2 gap-3">
                <FieldInput
                  label="项目链接"
                  value={project.link || ""}
                  onChange={(v) =>
                    updateProject(project.id, { link: v || undefined })
                  }
                  placeholder="https://..."
                />
                <FieldInput
                  label="GitHub 链接"
                  value={project.github || ""}
                  onChange={(v) =>
                    updateProject(project.id, { github: v || undefined })
                  }
                  placeholder="https://github.com/..."
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={project.featured || false}
                  onChange={(e) =>
                    updateProject(project.id, { featured: e.target.checked })
                  }
                  className="rounded accent-accent"
                />
                设为精选项目
              </label>
            </div>
          )}
        </div>
      ))}
      <button
        onClick={addProject}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border py-3 text-sm text-muted transition-colors hover:border-accent hover:text-accent"
      >
        <Plus size={16} />
        添加项目
      </button>
    </div>
  );
}

// ─── Experience Editor ────────────────────────────────────────
function ExperiencesEditor({
  experiences,
  onChange,
}: {
  experiences: Experience[];
  onChange: (e: Experience[]) => void;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const addExperience = () => {
    const newExp: Experience = {
      id: Date.now().toString(),
      title: "新经历",
      company: "",
      period: "",
      description: "",
      tags: [],
      order: experiences.length,
    };
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
    const newExps = [...experiences];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newExps.length) return;
    [newExps[index], newExps[targetIndex]] = [newExps[targetIndex], newExps[index]];
    newExps.forEach((e, i) => (e.order = i));
    onChange(newExps);
  };

  return (
    <div className="space-y-3">
      {experiences.map((exp, index) => (
        <div key={exp.id} className="rounded-lg border border-border bg-card">
          <div
            className="flex cursor-pointer items-center gap-3 px-4 py-3"
            onClick={() =>
              setExpanded(expanded === exp.id ? null : exp.id)
            }
          >
            <GripVertical size={14} className="text-muted" />
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => { e.stopPropagation(); moveExperience(index, "up"); }}
                className="rounded p-0.5 text-muted hover:text-foreground"
                disabled={index === 0}
              >
                <ChevronUp size={14} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); moveExperience(index, "down"); }}
                className="rounded p-0.5 text-muted hover:text-foreground"
                disabled={index === experiences.length - 1}
              >
                <ChevronDown size={14} />
              </button>
            </div>
            <div className="flex-1">
              <span className="text-sm font-medium">{exp.title}</span>
              {exp.company && (
                <span className="ml-2 text-xs text-muted">@ {exp.company}</span>
              )}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeExperience(exp.id);
              }}
              className="rounded p-1 text-muted transition-colors hover:text-red-500"
            >
              <Trash2 size={14} />
            </button>
          </div>
          {expanded === exp.id && (
            <div className="space-y-3 border-t border-border px-4 py-4">
              <div className="grid grid-cols-2 gap-3">
                <FieldInput
                  label="职位/学位"
                  value={exp.title}
                  onChange={(v) => updateExperience(exp.id, { title: v })}
                />
                <FieldInput
                  label="公司/学校"
                  value={exp.company}
                  onChange={(v) => updateExperience(exp.id, { company: v })}
                />
              </div>
              <FieldInput
                label="时间段"
                value={exp.period}
                onChange={(v) => updateExperience(exp.id, { period: v })}
                placeholder="如：2022 - 2024"
              />
              <FieldTextarea
                label="描述"
                value={exp.description}
                onChange={(v) => updateExperience(exp.id, { description: v })}
              />
              <FieldInput
                label="标签（逗号分隔）"
                value={(exp.tags || []).join(", ")}
                onChange={(v) =>
                  updateExperience(exp.id, {
                    tags: v.split(",").map((t) => t.trim()).filter(Boolean),
                  })
                }
              />
            </div>
          )}
        </div>
      ))}
      <button
        onClick={addExperience}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border py-3 text-sm text-muted transition-colors hover:border-accent hover:text-accent"
      >
        <Plus size={16} />
        添加经历
      </button>
    </div>
  );
}

// ─── Skills Editor ────────────────────────────────────────────
function SkillsEditor({
  skills,
  onChange,
}: {
  skills: SkillGroup[];
  onChange: (s: SkillGroup[]) => void;
}) {
  const addGroup = () => {
    const newGroup: SkillGroup = {
      id: Date.now().toString(),
      name: "新分组",
      skills: [],
      order: skills.length,
    };
    onChange([...skills, newGroup]);
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
            <input
              value={group.name}
              onChange={(e) => updateGroup(group.id, { name: e.target.value })}
              className="flex-1 rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium outline-none focus:border-accent"
            />
            <button
              onClick={() => removeGroup(group.id)}
              className="rounded p-1 text-muted transition-colors hover:text-red-500"
            >
              <Trash2 size={14} />
            </button>
          </div>
          <FieldInput
            label="技能（逗号分隔）"
            value={group.skills.join(", ")}
            onChange={(v) =>
              updateGroup(group.id, {
                skills: v.split(",").map((t) => t.trim()).filter(Boolean),
              })
            }
            placeholder="React, TypeScript, Next.js"
          />
        </div>
      ))}
      <button
        onClick={addGroup}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border py-3 text-sm text-muted transition-colors hover:border-accent hover:text-accent"
      >
        <Plus size={16} />
        添加技能分组
      </button>
    </div>
  );
}

// ─── Shared Field Components ──────────────────────────────────
function FieldInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-muted">
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-accent"
      />
    </div>
  );
}

function FieldTextarea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-muted">
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-accent"
      />
    </div>
  );
}
