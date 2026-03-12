import Link from "next/link";
import { ArrowLeft, SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col items-center justify-center px-6 py-32 text-center lg:px-8">
      <SearchX size={48} className="mb-4 text-accent" />
      <h1 className="text-6xl font-bold text-accent">404</h1>
      <p className="mt-4 text-xl font-medium">页面未找到</p>
      <p className="mt-2 text-muted">
        你访问的页面不存在或已被移除。
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-80"
      >
        <ArrowLeft size={16} />
        返回首页
      </Link>
    </div>
  );
}
