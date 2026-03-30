"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Loader2, PenLine, Shield } from "lucide-react";

type CreatingType = "post" | "note";

export default function AdminQuickCreate({ mobile = false }: { mobile?: boolean }) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [creating, setCreating] = useState<CreatingType | null>(null);

  useEffect(() => {
    let alive = true;

    fetch("/api/auth/check")
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        setAuthed(Boolean(d.authenticated));
        setChecked(true);
      })
      .catch(() => {
        if (!alive) return;
        setChecked(true);
      });

    return () => {
      alive = false;
    };
  }, []);

  const createContent = async (kind: CreatingType) => {
    setCreating(kind);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const payload =
        kind === "post"
          ? {
              slug: `new-post-${Date.now()}`,
              title: "新文章",
              description: "",
              content: "",
              contentType: "markdown",
              date: today,
              tags: [],
              published: false,
            }
          : {
              slug: `new-note-${Date.now()}`,
              title: "新笔记",
              description: "",
              content: "# 新笔记\n\n在这里开始写内容。",
              group: "未分类",
              date: today,
              tags: [],
              order: 999,
            };

      const endpoint = kind === "post" ? "/api/admin/posts" : "/api/admin/notes";
      const tab = kind === "post" ? "posts" : "notes";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "创建失败");
      }

      const data = await res.json();
      router.push(`/admin?tab=${tab}&edit=${data.id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "创建失败";
      alert(message);
    } finally {
      setCreating(null);
    }
  };

  if (!checked || !authed) {
    return null;
  }

  if (mobile) {
    return (
      <div className="mb-3 flex gap-2 border-b border-border pb-3">
        <button
          type="button"
          onClick={() => createContent("post")}
          disabled={creating !== null}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs text-muted transition-colors hover:text-foreground disabled:opacity-60"
        >
          {creating === "post" ? <Loader2 size={13} className="animate-spin" /> : <PenLine size={13} />}
          新博客
        </button>
        <button
          type="button"
          onClick={() => createContent("note")}
          disabled={creating !== null}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs text-muted transition-colors hover:text-foreground disabled:opacity-60"
        >
          {creating === "note" ? <Loader2 size={13} className="animate-spin" /> : <BookOpen size={13} />}
          新笔记
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin")}
          disabled={creating !== null}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs text-muted transition-colors hover:text-foreground disabled:opacity-60"
        >
          <Shield size={13} />
          后台
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={() => createContent("post")}
        disabled={creating !== null}
        className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-muted transition-colors hover:text-foreground disabled:opacity-60"
        title="新建博客"
      >
        {creating === "post" ? <Loader2 size={12} className="animate-spin" /> : <PenLine size={12} />}
        博客
      </button>
      <button
        type="button"
        onClick={() => createContent("note")}
        disabled={creating !== null}
        className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-muted transition-colors hover:text-foreground disabled:opacity-60"
        title="新建笔记"
      >
        {creating === "note" ? <Loader2 size={12} className="animate-spin" /> : <BookOpen size={12} />}
        笔记
      </button>
      <button
        type="button"
        onClick={() => router.push("/admin")}
        disabled={creating !== null}
        className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-muted transition-colors hover:text-foreground disabled:opacity-60"
        title="进入后台"
      >
        <Shield size={12} />
        后台
      </button>
    </div>
  );
}
