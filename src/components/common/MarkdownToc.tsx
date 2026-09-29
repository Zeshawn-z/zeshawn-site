"use client";

import { useState } from "react";
import { List, X } from "lucide-react";
import type { MarkdownHeading } from "@/lib/content/markdown";

export default function MarkdownToc({
  headings,
  mobileAboveNotesMenu = false,
}: {
  headings: MarkdownHeading[];
  mobileAboveNotesMenu?: boolean;
}) {
  const [open, setOpen] = useState(false);
  if (headings.length === 0) return null;

  const links = (closeAfterNavigate: boolean) => (
    <nav aria-label="文章目录" className="max-h-[min(60vh,32rem)] space-y-0.5 overflow-y-auto">
      {headings.map((heading) => (
        <a
          key={heading.id}
          href={`#${heading.id}`}
          onClick={closeAfterNavigate ? () => setOpen(false) : undefined}
          className="block break-words rounded-md py-1.5 pr-2 text-sm leading-snug text-muted transition-colors hover:bg-accent/5 hover:text-accent focus-visible:outline-2 focus-visible:outline-accent"
          style={{ paddingLeft: `${Math.min(heading.level - 1, 4) * 12 + 8}px` }}
          title={heading.text}
        >
          {heading.text}
        </a>
      ))}
    </nav>
  );

  return (
    <>
      <aside className="sticky top-24 hidden h-fit max-h-[calc(100vh-7rem)] min-w-0 overflow-hidden rounded-xl border border-border bg-card/80 p-3 shadow-sm xl:block" aria-label="文章目录">
        <div className="mb-2 flex items-center gap-2 px-2 text-xs font-semibold text-foreground">
          <List size={14} className="text-accent" />
          本文目录
        </div>
        {links(false)}
      </aside>

      <div className={`fixed right-5 z-30 xl:hidden ${mobileAboveNotesMenu ? "bottom-20 lg:bottom-5" : "bottom-5"}`}>
        {open && (
          <div className="mb-2 w-64 max-w-[calc(100vw-2.5rem)] rounded-xl border border-border bg-card p-3 shadow-xl">
            <div className="mb-2 px-2 text-xs font-semibold">本文目录</div>
            {links(true)}
          </div>
        )}
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-label={open ? "关闭文章目录" : "打开文章目录"}
          aria-expanded={open}
          className="ml-auto flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card/95 text-foreground shadow-lg backdrop-blur transition-colors hover:text-accent"
        >
          {open ? <X size={18} /> : <List size={18} />}
        </button>
      </div>
    </>
  );
}
