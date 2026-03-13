"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  KeyRound,
  User,
  Lock,
  AlertCircle,
  Loader2,
  ArrowRight,
} from "lucide-react";

export default function AdminLogin() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState<"user" | "pass" | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok) {
        router.push("/admin");
        router.refresh();
      } else {
        setError(data.error || "登录失败");
      }
    } catch {
      setError("网络错误，请重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-6 lg:px-8">
      <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <div className="w-full max-w-sm">
          {/* Icon + Title */}
          <div className="mb-10 text-center">
            <div className="relative mx-auto mb-5 flex h-14 w-14 items-center justify-center">
              <div className="absolute inset-0 rounded-2xl bg-accent/10" />
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-accent/20 to-transparent" />
              <KeyRound size={24} className="relative text-accent" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">管理后台</h1>
            <p className="mt-2 text-sm text-muted">
              登录以管理网站内容
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error */}
            {error && (
              <div className="flex items-center gap-2.5 rounded-xl border border-red-200/50 bg-red-50/50 px-4 py-3 text-sm text-red-600 dark:border-red-500/20 dark:bg-red-950/30 dark:text-red-400">
                <AlertCircle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Username */}
            <div className="group">
              <label
                htmlFor="username"
                className={`mb-1.5 block text-xs font-medium transition-colors ${
                  focused === "user" ? "text-accent" : "text-muted"
                }`}
              >
                用户名
              </label>
              <div
                className={`flex items-center gap-3 rounded-xl border bg-card px-4 py-3 transition-all ${
                  focused === "user"
                    ? "border-accent/50 ring-2 ring-accent/10"
                    : "border-border hover:border-border/80"
                }`}
              >
                <User
                  size={16}
                  className={`shrink-0 transition-colors ${
                    focused === "user" ? "text-accent" : "text-muted"
                  }`}
                />
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onFocus={() => setFocused("user")}
                  onBlur={() => setFocused(null)}
                  className="w-full bg-transparent text-sm outline-none placeholder:text-muted/50"
                  placeholder="请输入用户名"
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="group">
              <label
                htmlFor="password"
                className={`mb-1.5 block text-xs font-medium transition-colors ${
                  focused === "pass" ? "text-accent" : "text-muted"
                }`}
              >
                密码
              </label>
              <div
                className={`flex items-center gap-3 rounded-xl border bg-card px-4 py-3 transition-all ${
                  focused === "pass"
                    ? "border-accent/50 ring-2 ring-accent/10"
                    : "border-border hover:border-border/80"
                }`}
              >
                <Lock
                  size={16}
                  className={`shrink-0 transition-colors ${
                    focused === "pass" ? "text-accent" : "text-muted"
                  }`}
                />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocused("pass")}
                  onBlur={() => setFocused(null)}
                  className="w-full bg-transparent text-sm outline-none placeholder:text-muted/50"
                  placeholder="请输入密码"
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="group/btn relative flex w-full items-center justify-center gap-2 rounded-xl bg-foreground py-3 text-sm font-medium text-background transition-all hover:opacity-90 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  登录中...
                </>
              ) : (
                <>
                  登录
                  <ArrowRight
                    size={15}
                    className="transition-transform group-hover/btn:translate-x-0.5"
                  />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
