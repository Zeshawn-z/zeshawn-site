"use client";

import { useState } from "react";
import { BookOpen, Menu, X } from "lucide-react";
import type { NoteGroup } from "@/lib/db/data";
import NotesSidebar from "@/components/notes/NotesSidebar";

interface NotesIndexMenuProps {
  groups: NoteGroup[];
}

export default function NotesIndexMenu({ groups }: NotesIndexMenuProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setDrawerOpen(true)}
        className={`fixed bottom-5 right-5 z-30 inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card/95 text-foreground shadow-lg backdrop-blur transition-all hover:text-accent lg:hidden ${
          drawerOpen ? "pointer-events-none opacity-0" : "opacity-100"
        }`}
        aria-label="打开笔记目录"
      >
        <Menu size={18} />
      </button>

      {drawerOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/45 lg:hidden"
          aria-label="关闭目录抽屉"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[86vw] border-r border-border bg-card px-3 pb-3 pt-4 transition-transform duration-200 lg:hidden ${
          drawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-1 flex items-center gap-2 border-b border-border pb-3">
          <BookOpen size={16} className="text-accent" />
          <h2 className="text-sm font-semibold tracking-tight">笔记目录</h2>
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            className="ml-auto rounded-md p-1 text-muted transition-colors hover:text-foreground"
            aria-label="关闭目录"
          >
            <X size={16} />
          </button>
        </div>

        <NotesSidebar
          groups={groups}
          onNavigate={() => setDrawerOpen(false)}
          className="h-[calc(100vh-5rem)] w-full max-h-none rounded-none border-0 bg-transparent p-0 lg:static"
        />
      </aside>

      <aside className="hidden border-r border-border lg:block lg:w-72 lg:shrink-0">
        <NotesSidebar
          groups={groups}
          className="h-[calc(100vh-4.5rem)] w-full max-h-none rounded-none border-0 bg-transparent px-5 py-4 lg:top-[4.5rem]"
        />
      </aside>
    </>
  );
}
