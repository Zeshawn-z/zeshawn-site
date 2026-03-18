"use client";

import { Trash2, MessageSquare } from "lucide-react";
import type { GuestbookEntry } from "./types";

export default function GuestbookManager({ entries, setEntries }: { entries: GuestbookEntry[]; setEntries: (e: GuestbookEntry[]) => void }) {
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
