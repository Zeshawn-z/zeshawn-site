"use client";

import { Plus, Trash2 } from "lucide-react";
import type { SkillGroup } from "./types";
import { FieldInput } from "./FormFields";

export default function SkillsEditor({ skills, onChange }: { skills: SkillGroup[]; onChange: (s: SkillGroup[]) => void }) {
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
