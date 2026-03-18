"use client";

import { useState } from "react";
import { Plus, Trash2, ChevronDown, ChevronUp, GripVertical } from "lucide-react";
import type { Project } from "./types";
import { FieldInput, FieldTextarea } from "./FormFields";

export default function ProjectsEditor({ projects, onChange }: { projects: Project[]; onChange: (p: Project[]) => void }) {
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
