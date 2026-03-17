"use client";

import { useState, useEffect, useCallback } from "react";
import {
  MessageCircle,
  Send,
  Loader2,
  User,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Reply,
  CornerDownRight,
} from "lucide-react";

interface Comment {
  id: number;
  postSlug: string;
  parentId: number | null;
  floor: number | null;
  nickname: string;
  content: string;
  createdAt: string;
  replies?: Comment[];
}

export default function BlogComments({ slug }: { slug: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [order, setOrder] = useState<"asc" | "desc">("asc");
  const [loading, setLoading] = useState(true);

  // 发表评论表单
  const [nickname, setNickname] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // 楼中楼回复
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [replySubmitting, setReplySubmitting] = useState(false);
  const [replyError, setReplyError] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("comment_nickname");
    if (saved) setNickname(saved);
  }, []);

  const loadComments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/comments?slug=${encodeURIComponent(slug)}&page=${page}&order=${order}`
      );
      const data = await res.json();
      setComments(data.comments || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [slug, page, order]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const trimNickname = nickname.trim();
    const trimContent = content.trim();
    if (!trimNickname) { setError("请输入昵称"); return; }
    if (!trimContent) { setError("请输入评论内容"); return; }

    setSubmitting(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, nickname: trimNickname, content: trimContent }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "提交失败");
        return;
      }
      localStorage.setItem("comment_nickname", trimNickname);
      setContent("");
      // 发表后跳到最后一页查看（正序）或第一页（倒序）
      if (order === "asc") {
        const newTotal = total + 1;
        const newPages = Math.ceil(newTotal / 10);
        setPage(newPages);
      } else {
        setPage(1);
      }
      await loadComments();
    } catch {
      setError("网络错误，请重试");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReplySubmit = async (parentId: number) => {
    setReplyError("");
    const trimNickname = nickname.trim();
    const trimContent = replyContent.trim();
    if (!trimNickname) { setReplyError("请先在上方填写昵称"); return; }
    if (!trimContent) { setReplyError("请输入回复内容"); return; }

    setReplySubmitting(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          nickname: trimNickname,
          content: trimContent,
          parentId: parentId.toString(),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setReplyError(data.error || "提交失败");
        return;
      }
      localStorage.setItem("comment_nickname", trimNickname);
      setReplyContent("");
      setReplyTo(null);
      await loadComments();
    } catch {
      setReplyError("网络错误，请重试");
    } finally {
      setReplySubmitting(false);
    }
  };

  const toggleOrder = () => {
    setOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    setPage(1);
  };

  const formatTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr + "Z");
      return d.toLocaleString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <section className="mt-12">
      {/* 标题 + 排序 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <MessageCircle size={20} className="text-accent" />
          <h2 className="text-lg font-semibold">
            评论{total > 0 && <span className="ml-1.5 text-sm font-normal text-muted">({total})</span>}
          </h2>
        </div>
        {total > 0 && (
          <button
            onClick={toggleOrder}
            className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs text-muted transition-colors hover:text-foreground hover:bg-card"
          >
            <ArrowUpDown size={12} />
            {order === "asc" ? "最早优先" : "最新优先"}
          </button>
        )}
      </div>

      {/* 发表评论表单 */}
      <form onSubmit={handleSubmit} className="mb-8 rounded-lg border border-border bg-card p-4">
        <div className="mb-3">
          <div className="relative">
            <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="你的昵称"
              maxLength={30}
              className="w-full rounded-md border border-border bg-background py-2 pl-9 pr-3 text-sm outline-none transition-colors focus:border-accent"
            />
          </div>
        </div>
        <div className="mb-3">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="写下你的评论..."
            rows={3}
            maxLength={1000}
            className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-accent"
          />
        </div>
        {error && <p className="mb-3 text-xs text-red-500">{error}</p>}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted">{content.length}/1000</span>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            发表评论
          </button>
        </div>
      </form>

      {/* 评论列表 */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 size={20} className="animate-spin text-muted" />
        </div>
      ) : comments.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-10 text-center">
          <MessageCircle size={24} className="mx-auto mb-2 text-muted" />
          <p className="text-sm text-muted">暂无评论，来发表第一条吧</p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="rounded-lg border border-border bg-card">
              {/* 主评论 */}
              <div className="px-4 py-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
                    <span className="text-xs font-medium">
                      {comment.nickname.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm font-medium">{comment.nickname}</span>
                  {comment.floor && (
                    <span className="rounded bg-muted/15 px-1.5 py-0.5 text-xs text-muted">
                      #{comment.floor}
                    </span>
                  )}
                  <span className="text-xs text-muted">{formatTime(comment.createdAt)}</span>
                  <button
                    onClick={() => {
                      setReplyTo(replyTo?.id === comment.id ? null : comment);
                      setReplyContent("");
                      setReplyError("");
                    }}
                    className="ml-auto inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-muted transition-colors hover:text-accent"
                  >
                    <Reply size={12} />
                    回复
                  </button>
                </div>
                <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
                  {comment.content}
                </p>
              </div>

              {/* 回复列表 */}
              {comment.replies && comment.replies.length > 0 && (
                <div className="border-t border-border bg-card/50 px-4 py-2 space-y-2">
                  {comment.replies.map((reply) => (
                    <div key={reply.id} className="flex gap-2">
                      <CornerDownRight size={14} className="mt-0.5 shrink-0 text-muted/50" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium">{reply.nickname}</span>
                          <span className="text-xs text-muted">{formatTime(reply.createdAt)}</span>
                        </div>
                        <p className="text-xs leading-relaxed text-foreground/80 whitespace-pre-wrap">
                          {reply.content}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 回复输入框 */}
              {replyTo?.id === comment.id && (
                <div className="border-t border-border px-4 py-3">
                  <div className="flex gap-2">
                    <textarea
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder={`回复 ${comment.nickname}...`}
                      rows={2}
                      maxLength={1000}
                      className="flex-1 resize-none rounded-md border border-border bg-background px-3 py-2 text-xs outline-none transition-colors focus:border-accent"
                      autoFocus
                    />
                    <button
                      onClick={() => handleReplySubmit(comment.id)}
                      disabled={replySubmitting}
                      className="self-end inline-flex items-center gap-1 rounded-lg bg-accent px-3 py-2 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                    >
                      {replySubmitting ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <Send size={12} />
                      )}
                      回复
                    </button>
                  </div>
                  {replyError && <p className="mt-1.5 text-xs text-red-500">{replyError}</p>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 分页 */}
      {pages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-sm text-muted transition-colors hover:text-foreground disabled:opacity-40"
          >
            <ChevronLeft size={14} />
            上一页
          </button>
          <span className="px-3 text-sm text-muted">
            {page} / {pages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
            disabled={page === pages}
            className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-sm text-muted transition-colors hover:text-foreground disabled:opacity-40"
          >
            下一页
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </section>
  );
}
