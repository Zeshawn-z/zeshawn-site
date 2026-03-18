"use client";

import { useState, useEffect, useCallback } from "react";
import { Trash2, Loader2, MessageCircle } from "lucide-react";
import type { CommentAdmin } from "./types";

export default function CommentsManager({
  comments,
  setComments,
  filterSlug,
  setFilterSlug,
}: {
  comments: CommentAdmin[];
  setComments: (c: CommentAdmin[]) => void;
  filterSlug: string;
  setFilterSlug: (s: string) => void;
}) {
  const [loading, setLoading] = useState(false);

  const loadComments = useCallback(async (slug?: string) => {
    setLoading(true);
    try {
      const url = slug ? `/api/admin/comments?slug=${encodeURIComponent(slug)}` : "/api/admin/comments";
      const res = await fetch(url);
      const data = await res.json();
      setComments(data || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [setComments]);

  useEffect(() => {
    loadComments(filterSlug || undefined);
  }, [filterSlug, loadComments]);

  const deleteEntry = async (id: number) => {
    if (!confirm("确定删除这条评论？（回复也会一起删除）")) return;
    await fetch(`/api/admin/comments/${id}`, { method: "DELETE" });
    setComments(comments.filter((c) => c.id !== id && c.parentId !== id));
  };

  const clearFilter = () => {
    setFilterSlug("");
  };

  return (
    <div className="space-y-4">
      {filterSlug && (
        <div className="flex items-center gap-2 rounded-lg border border-accent/30 bg-accent/5 px-4 py-2.5">
          <span className="text-sm text-muted">筛选文章：</span>
          <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent">/{filterSlug}</span>
          <button onClick={clearFilter} className="ml-auto text-xs text-muted hover:text-foreground transition-colors">
            清除筛选
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 size={20} className="animate-spin text-muted" />
        </div>
      ) : comments.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-12 text-center">
          <MessageCircle size={28} className="mx-auto mb-3 text-muted" />
          <p className="text-muted">{filterSlug ? "该文章暂无评论" : "暂无评论"}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <div key={comment.id} className={`rounded-lg border border-border bg-card px-4 py-3 ${comment.parentId ? "ml-6 border-l-2 border-l-accent/20" : ""}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium">{comment.nickname}</span>
                    {comment.floor && (
                      <span className="rounded bg-muted/15 px-1.5 py-0.5 text-xs text-muted">#{comment.floor}</span>
                    )}
                    {comment.parentId && (
                      <span className="rounded bg-orange-500/10 px-1.5 py-0.5 text-xs text-orange-600 dark:text-orange-400">回复</span>
                    )}
                    {!filterSlug && (
                      <button
                        onClick={() => setFilterSlug(comment.postSlug)}
                        className="rounded-full bg-accent/10 px-2 py-0.5 text-xs text-accent hover:bg-accent/20 transition-colors"
                      >
                        /{comment.postSlug}
                      </button>
                    )}
                    <span className="text-xs text-muted">{new Date(comment.createdAt + "Z").toLocaleString("zh-CN")}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted whitespace-pre-wrap">{comment.content}</p>
                </div>
                <button onClick={() => deleteEntry(comment.id)} className="shrink-0 rounded p-1 text-muted transition-colors hover:text-red-500">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
