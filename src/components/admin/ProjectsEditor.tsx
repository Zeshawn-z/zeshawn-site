"use client";

import { useState } from "react";
import { Plus, Trash2, ChevronDown, ChevronUp, GripVertical, BookOpen, X } from "lucide-react";
import type { Project, PostAdmin } from "./types";
import { FieldInput, FieldTextarea, FieldCommaInput } from "./FormFields";

interface ProjectsEditorProps {
  projects: Project[];
  onChange: (p: Project[]) => void;
  posts?: PostAdmin[];
}

export default function ProjectsEditor({ projects, onChange, posts = [] }: ProjectsEditorProps) {
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

  // 获取已被其他项目关联的 slug（排除当前项目）
  const getUsedSlugs = (currentProjectId: string) => {
    return new Set(
      projects
        .filter((p) => p.id !== currentProjectId && p.blogSlug)
        .map((p) => p.blogSlug!)
    );
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
            {project.blogSlug && (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-600 dark:text-blue-400">
                <BookOpen size={10} />
                博客
              </span>
            )}
            {project.featured && <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs text-accent">精选</span>}
            <button onClick={(e) => { e.stopPropagation(); removeProject(project.id); }} className="rounded p-1 text-muted transition-colors hover:text-red-500"><Trash2 size={14} /></button>
          </div>
          {expanded === project.id && (
            <div className="space-y-3 border-t border-border px-4 py-4">
              <FieldInput label="标题" value={project.title} onChange={(v) => updateProject(project.id, { title: v })} />
              <FieldTextarea label="描述" value={project.description} onChange={(v) => updateProject(project.id, { description: v })} />
              <FieldCommaInput
                label="标签（逗号分隔）"
                values={project.tags}
                onParsedChange={(tags) => updateProject(project.id, { tags })}
              />
              <div className="grid grid-cols-2 gap-3">
                <FieldInput label="项目链接" value={project.link || ""} onChange={(v) => updateProject(project.id, { link: v || undefined })} placeholder="https://..." />
                <FieldInput label="GitHub 链接" value={project.github || ""} onChange={(v) => updateProject(project.id, { github: v || undefined })} placeholder="https://github.com/..." />
              </div>

              {/* 关联博客 - 下拉选择 */}
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">关联博客</label>
                {project.blogSlug ? (
                  <div className="flex items-center gap-2 rounded-lg border border-blue-500/30 bg-blue-500/5 px-3 py-2">
                    <BookOpen size={14} className="shrink-0 text-blue-500" />
                    <span className="flex-1 truncate text-sm">
                      {posts.find((p) => p.slug === project.blogSlug)?.title || project.blogSlug}
                    </span>
                    <span className="shrink-0 text-xs text-muted">{project.blogSlug}</span>
                    <button
                      onClick={() => updateProject(project.id, { blogSlug: undefined })}
                      className="shrink-0 rounded p-0.5 text-muted transition-colors hover:text-red-500"
                      title="取消关联"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <select
                    value=""
                    onChange={(e) => {
                      if (e.target.value) {
                        updateProject(project.id, { blogSlug: e.target.value });
                      }
                    }}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground transition-colors focus:border-accent focus:outline-none"
                  >
                    <option value="">选择博客文章（可选）</option>
                    {posts.map((post) => {
                      const usedSlugs = getUsedSlugs(project.id);
                      const isUsed = usedSlugs.has(post.slug);
                      return (
                        <option key={post.slug} value={post.slug} disabled={isUsed}>
                          {post.title}{isUsed ? "（已关联）" : ""}{!post.published ? "（草稿）" : ""}
                        </option>
                      );
                    })}
                  </select>
                )}
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
