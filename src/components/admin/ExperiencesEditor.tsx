"use client";

import { useState } from "react";
import { Plus, Trash2, ChevronDown, ChevronUp, GripVertical } from "lucide-react";
import type { Experience } from "./types";
import { FieldInput, FieldTextarea } from "./FormFields";

export default function ExperiencesEditor({ experiences, onChange }: { experiences: Experience[]; onChange: (e: Experience[]) => void }) {
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
