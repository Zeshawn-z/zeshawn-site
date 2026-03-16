"use client";

import { useState, useEffect, useCallback } from "react";
import {
  MessageSquare,
  Send,
  Loader2,
  User,
  MessageCircle,
} from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";

interface GuestbookEntry {
  id: number;
  nickname: string;
  message: string;
  createdAt: string;
}

export default function GuestbookPage() {
  const [entries, setEntries] = useState<GuestbookEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [nickname, setNickname] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const loadEntries = useCallback(async () => {
    try {
      const res = await fetch("/api/guestbook");
      const data = await res.json();
      setEntries(data.entries || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const trimmedNick = nickname.trim();
    const trimmedMsg = message.trim();

    if (!trimmedNick) {
      setError("请填写昵称");
      return;
    }
    if (!trimmedMsg) {
      setError("请填写留言内容");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/guestbook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname: trimmedNick, message: trimmedMsg }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "提交失败");
        return;
      }

      const entry = await res.json();
      setEntries([entry, ...entries]);
      setMessage("");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError("网络错误，请重试");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-6 lg:px-8">
      <section className="pb-12 pt-16">
        <div className="flex items-center gap-3">
          <MessageSquare size={24} className="text-accent" />
          <h1 className="text-3xl font-bold tracking-tight">留言板</h1>
        </div>
        <p className="mt-3 text-muted">
          欢迎留下你的想法、建议或者就是打个招呼。无需登录，留下昵称即可。
        </p>
      </section>

      {/* Submit Form */}
      <section className="mb-10">
        <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center gap-2">
            <MessageCircle size={16} className="text-accent" />
            <span className="text-sm font-medium">写下留言</span>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-red-200/50 bg-red-50/50 px-4 py-2.5 text-sm text-red-600 dark:border-red-500/20 dark:bg-red-950/30 dark:text-red-400">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 rounded-lg border border-green-200/50 bg-green-50/50 px-4 py-2.5 text-sm text-green-600 dark:border-green-500/20 dark:bg-green-950/30 dark:text-green-400">
              留言成功！感谢你的留言 🎉
            </div>
          )}

          <div className="mb-3">
            <div className="flex items-center gap-2.5 rounded-lg border border-border bg-background px-3 py-2.5 transition-colors focus-within:border-accent">
              <User size={14} className="shrink-0 text-muted" />
              <input
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="你的昵称"
                maxLength={50}
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted/50"
              />
            </div>
          </div>

          <div className="mb-4">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="写点什么吧..."
              maxLength={500}
              rows={3}
              className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:border-accent placeholder:text-muted/50"
            />
            <div className="mt-1 text-right text-xs text-muted">
              {message.length}/500
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-lg bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-all hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Send size={14} />
            )}
            {submitting ? "提交中..." : "发送留言"}
          </button>
        </form>
      </section>

      {/* Entries */}
      <section className="pb-16">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={24} className="animate-spin text-muted" />
          </div>
        ) : entries.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-12 text-center">
            <MessageSquare size={28} className="mx-auto mb-3 text-muted" />
            <p className="text-muted">还没有留言，来做第一个吧！</p>
          </div>
        ) : (
          <div className="space-y-4">
            {entries.map((entry, i) => (
              <ScrollReveal key={entry.id} delay={i * 60}>
                <div className="rounded-xl border border-border bg-card px-5 py-4">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/10 text-xs font-medium text-accent">
                      {entry.nickname.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium">{entry.nickname}</span>
                    <span className="text-xs text-muted">
                      {new Date(entry.createdAt).toLocaleDateString("zh-CN", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  <p className="mt-2.5 text-sm leading-relaxed text-muted">
                    {entry.message}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
