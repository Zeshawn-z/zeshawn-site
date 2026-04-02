"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { Plus, Trash2, Save, Loader2, Edit3, ArrowLeft, ArrowUp, ArrowDown } from "lucide-react";
import type { NoteAdmin, NoteGroupOrder } from "./types";
import { FieldCommaInput, FieldInput } from "./FormFields";
import MdEditor from "@/components/admin/MdEditor";

function parseCommaSeparated(input: string): string[] {
  return input
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function NotesEditor({
  notes,
  setNotes,
  groupOrders,
  setGroupOrders,
  showIndex,
  initialEditId,
}: {
  notes: NoteAdmin[];
  setNotes: (n: NoteAdmin[]) => void;
  groupOrders: NoteGroupOrder[];
  setGroupOrders: (groups: NoteGroupOrder[]) => void;
  showIndex: boolean;
  initialEditId?: string | null;
}) {
  const [editing, setEditing] = useState<NoteAdmin | null>(null);
  const [savingNote, setSavingNote] = useState(false);
  const [query, setQuery] = useState("");
  const [groupFilter, setGroupFilter] = useState<string>("all");
  const [tagFilter, setTagFilter] = useState<string>("all");
  const [savingGroupOrder, setSavingGroupOrder] = useState(false);
  const initialAppliedRef = useRef(false);

  useEffect(() => {
    if (initialAppliedRef.current || !initialEditId) return;
    const target = notes.find((n) => n.id === initialEditId);
    if (target) {
      setEditing(target);
      initialAppliedRef.current = true;
    }
  }, [initialEditId, notes]);

  const allGroups = useMemo(() => {
    const groupedNames = Array.from(new Set(notes.map((note) => note.group || "未分类")));
    const orderMap = new Map(groupOrders.map((group) => [group.name, group.order]));

    return groupedNames
      .map((name, index) => ({
        name,
        order: orderMap.get(name) ?? (9999 + index),
      }))
      .sort((a, b) => {
        if (a.order !== b.order) return a.order - b.order;
        return a.name.localeCompare(b.name, "zh-CN");
      })
      .map((item) => item.name);
  }, [notes, groupOrders]);

  const allTags = useMemo(() => {
    return Array.from(new Set(notes.flatMap((note) => note.tags || []))).sort((a, b) => a.localeCompare(b, "zh-CN"));
  }, [notes]);

  const filteredNotes = useMemo(() => {
    const q = query.trim().toLowerCase();
    return notes.filter((note) => {
      const g = note.group || "未分类";
      const groupMatched = groupFilter === "all" || g === groupFilter;
      const tagMatched = tagFilter === "all" || note.tags.includes(tagFilter);
      const textMatched =
        q.length === 0 ||
        note.title.toLowerCase().includes(q) ||
        note.slug.toLowerCase().includes(q) ||
        note.description.toLowerCase().includes(q) ||
        g.toLowerCase().includes(q) ||
        note.tags.some((tag) => tag.toLowerCase().includes(q));
      return groupMatched && tagMatched && textMatched;
    });
  }, [notes, query, groupFilter, tagFilter]);

  const persistGroupOrder = async (orderedNames: string[]) => {
    const payload = orderedNames.map((name, index) => ({ name, order: index }));
    setSavingGroupOrder(true);
    try {
      const res = await fetch("/api/admin/notes/groups", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        throw new Error("分组顺序保存失败");
      }
      setGroupOrders(payload);
    } finally {
      setSavingGroupOrder(false);
    }
  };

  const moveGroup = async (name: string, direction: -1 | 1) => {
    const currentIndex = allGroups.findIndex((groupName) => groupName === name);
    const targetIndex = currentIndex + direction;
    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= allGroups.length) return;

    const nextOrder = [...allGroups];
    [nextOrder[currentIndex], nextOrder[targetIndex]] = [nextOrder[targetIndex], nextOrder[currentIndex]];
    try {
      await persistGroupOrder(nextOrder);
    } catch {
      alert("分组顺序保存失败，请稍后重试");
    }
  };

  const createNote = async () => {
    const slug = "new-note-" + Date.now();
    const res = await fetch("/api/admin/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug,
        title: "新笔记",
        description: "",
        content: "# 新笔记\n\n在这里开始写内容。",
        group: "未分类",
        date: new Date().toISOString().slice(0, 10),
        tags: [],
        order: notes.length,
      }),
    });
    const note = await res.json();
    setNotes([note, ...notes]);
    setEditing(note);
  };

  const saveNote = async () => {
    if (!editing) return;
    setSavingNote(true);
    try {
      const normalizedEditing = {
        ...editing,
        tags: parseCommaSeparated((editing.tags || []).join(",")),
        group: editing.group || "未分类",
        order: Number.isFinite(editing.order) ? editing.order : 999,
      };

      await fetch(`/api/admin/notes/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: normalizedEditing.slug,
          title: normalizedEditing.title,
          description: normalizedEditing.description,
          content: normalizedEditing.content,
          group: normalizedEditing.group,
          date: normalizedEditing.date,
          tags: normalizedEditing.tags,
          order: normalizedEditing.order,
        }),
      });

      setNotes(notes.map((n) => (n.id === editing.id ? normalizedEditing : n)));
      setEditing(normalizedEditing);
    } finally {
      setSavingNote(false);
    }
  };

  const deleteNote = async (id: string) => {
    if (!confirm("确定删除这条笔记？")) return;
    await fetch(`/api/admin/notes/${id}`, { method: "DELETE" });
    setNotes(notes.filter((n) => n.id !== id));
    if (editing?.id === id) setEditing(null);
  };

  if (editing) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setEditing(null)}
            className="inline-flex items-center gap-1.5 text-sm leading-none text-muted transition-colors hover:text-foreground"
          >
            <ArrowLeft size={14} className="shrink-0" />
            返回列表
          </button>
          <button
            onClick={saveNote}
            disabled={savingNote}
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3.5 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {savingNote ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            保存笔记
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FieldInput label="标题" value={editing.title} onChange={(v) => setEditing({ ...editing, title: v })} />
          <FieldInput label="URL Slug" value={editing.slug} onChange={(v) => setEditing({ ...editing, slug: v })} />
        </div>

        <FieldInput label="摘要" value={editing.description} onChange={(v) => setEditing({ ...editing, description: v })} />

        <div className="grid gap-4 sm:grid-cols-3">
          <FieldInput label="分组" value={editing.group} onChange={(v) => setEditing({ ...editing, group: v })} placeholder="例如：JavaScript" />
          <FieldInput label="日期" value={editing.date} onChange={(v) => setEditing({ ...editing, date: v })} placeholder="YYYY-MM-DD" />
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">排序（越小越靠前）</label>
            <input
              type="number"
              value={editing.order}
              onChange={(e) => setEditing({ ...editing, order: Number(e.target.value) })}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-accent"
            />
          </div>
        </div>

        <FieldCommaInput
          label="标签（逗号分隔）"
          values={editing.tags}
          onParsedChange={(tags) => setEditing({ ...editing, tags })}
        />

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

  return (
    <div className="space-y-3">
      {showIndex && (
        <div className="rounded-lg border border-border bg-card p-3">
          <div className="grid gap-2 sm:grid-cols-3">
            <FieldInput
              label="搜索"
              value={query}
              onChange={setQuery}
              placeholder="标题 / slug / 分组 / 标签"
            />
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">分组筛选</label>
              <select
                value={groupFilter}
                onChange={(e) => setGroupFilter(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-accent"
              >
                <option value="all">全部分组</option>
                {allGroups.map((group) => (
                  <option key={group} value={group}>{group}</option>
                ))}
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

        </div>
      )}

      {allGroups.length > 1 && (
        <div className="rounded-lg border border-border bg-card p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-medium text-muted">分组顺序（前台侧边栏）</p>
            {savingGroupOrder && <Loader2 size={13} className="animate-spin text-muted" />}
          </div>
          <div className="space-y-1.5">
            {allGroups.map((groupName, index) => (
              <div key={groupName} className="flex items-center justify-between rounded-md border border-border bg-background px-2 py-1.5">
                <span className="truncate pr-2 text-xs">{groupName}</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={index === 0 || savingGroupOrder}
                    onClick={() => moveGroup(groupName, -1)}
                    className="rounded p-1 text-muted transition-colors hover:text-foreground disabled:opacity-30"
                    title="上移"
                  >
                    <ArrowUp size={12} />
                  </button>
                  <button
                    type="button"
                    disabled={index === allGroups.length - 1 || savingGroupOrder}
                    onClick={() => moveGroup(groupName, 1)}
                    className="rounded p-1 text-muted transition-colors hover:text-foreground disabled:opacity-30"
                    title="下移"
                  >
                    <ArrowDown size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {filteredNotes.map((note) => (
        <div key={note.id} className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="truncate text-sm font-medium">{note.title}</span>
              <span className="shrink-0 rounded-full bg-accent/10 px-2 py-0.5 text-xs text-accent">{note.group || "未分类"}</span>
            </div>
            <div className="mt-0.5 text-xs text-muted">{note.date} · /{note.slug}</div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              onClick={() => setEditing(note)}
              className="rounded p-1.5 text-muted transition-colors hover:text-accent"
              title="编辑"
            >
              <Edit3 size={14} />
            </button>
            <button
              onClick={() => deleteNote(note.id)}
              className="rounded p-1.5 text-muted transition-colors hover:text-red-500"
              title="删除"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      ))}

      {filteredNotes.length === 0 && (
        <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted">
          当前筛选条件下没有笔记
        </div>
      )}

      <button
        onClick={createNote}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border py-3 text-sm text-muted transition-colors hover:border-accent hover:text-accent"
      >
        <Plus size={16} />
        新建笔记
      </button>
    </div>
  );
}
