"use client";

import { useState } from "react";
import { Plus, Trash2, ChevronDown, ChevronUp, GripVertical, BookOpen, X } from "lucide-react";
import type { Experience, PostAdmin } from "./types";
import { FieldInput, FieldTextarea } from "./FormFields";

interface ExperiencesEditorProps {
  experiences: Experience[];
  onChange: (e: Experience[]) => void;
  posts?: PostAdmin[];
}

export default function ExperiencesEditor({ experiences, onChange, posts = [] }: ExperiencesEditorProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  // 获取已被其他经历关联的 slug（排除当前经历）
  const getUsedSlugs = (currentExpId: string) => {
    return new Set(
      experiences
        .filter((e) => e.id !== currentExpId && e.blogSlug)
        .map((e) => e.blogSlug!)
    );
  };

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
            {exp.blogSlug && (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-600 dark:text-blue-400">
                <BookOpen size={10} />
                博客
              </span>
            )}
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

              {/* 关联博客 - 下拉选择 */}
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">关联博客</label>
                {exp.blogSlug ? (
                  <div className="flex items-center gap-2 rounded-lg border border-blue-500/30 bg-blue-500/5 px-3 py-2">
                    <BookOpen size={14} className="shrink-0 text-blue-500" />
                    <span className="flex-1 truncate text-sm">
                      {posts.find((p) => p.slug === exp.blogSlug)?.title || exp.blogSlug}
                    </span>
                    <span className="shrink-0 text-xs text-muted">{exp.blogSlug}</span>
                    <button
                      onClick={() => updateExperience(exp.id, { blogSlug: undefined })}
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
                        updateExperience(exp.id, { blogSlug: e.target.value });
                      }
                    }}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground transition-colors focus:border-accent focus:outline-none"
                  >
                    <option value="">选择博客文章（可选）</option>
                    {posts.map((post) => {
                      const usedSlugs = getUsedSlugs(exp.id);
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
