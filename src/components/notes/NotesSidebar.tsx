"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { NoteGroup } from "@/lib/db/data";

const COLLAPSE_STATE_STORAGE_KEY = "notes-sidebar-collapsed-groups-v1";

interface NotesSidebarProps {
  groups: NoteGroup[];
  className?: string;
  onNavigate?: () => void;
}

export default function NotesSidebar({
  groups,
  className = "",
  onNavigate,
}: NotesSidebarProps) {
  const pathname = usePathname();
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>(() => {
    if (typeof window === "undefined") return {};
    try {
      const saved = window.localStorage.getItem(COLLAPSE_STATE_STORAGE_KEY);
      if (!saved) return {};
      const parsed = JSON.parse(saved) as unknown;
      if (!parsed || typeof parsed !== "object") return {};

      return Object.fromEntries(
        Object.entries(parsed).filter(
          (entry): entry is [string, boolean] => typeof entry[0] === "string" && typeof entry[1] === "boolean"
        )
      );
    } catch {
      return {};
    }
  });

  useEffect(() => {
    window.localStorage.setItem(COLLAPSE_STATE_STORAGE_KEY, JSON.stringify(collapsedGroups));
  }, [collapsedGroups]);

  const toggleGroup = (groupName: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupName]: !prev[groupName],
    }));
  };

  return (
    <aside
      className={`scrollbar-thin w-56 shrink-0 space-y-5 overflow-y-auto self-start rounded-lg border border-border bg-card/50 p-4 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] ${className}`}
    >
      {/* 页面标题 */}
      <div className="">
        <div className="mb-1 text-xs text-muted">
          {groups.reduce((sum, g) => sum + g.notes.length, 0)} 篇 · {groups.length} 个分组
        </div>
      </div>

      {/* 分组列表 */}
      <nav className="space-y-4">
        {groups.map((group) => {
          const isCollapsed = collapsedGroups[group.name] ?? false;

          return (
            <div key={group.name}>
              <button
                type="button"
                onClick={() => toggleGroup(group.name)}
                className="mb-1.5 -ml-2.5 flex w-full items-center gap-1.5 rounded px-1 py-0.5 text-left text-xs font-semibold uppercase tracking-wider text-muted transition-colors hover:text-foreground"
                aria-expanded={!isCollapsed}
              >
                {isCollapsed ? <ChevronRight size={13} /> : <ChevronDown size={13} className="transition-transform duration-200" />}
                <span>{group.name}</span>
              </button>

              <div
                className={`grid overflow-hidden transition-[grid-template-rows,opacity] duration-200 ease-out ${
                  isCollapsed ? "pointer-events-none grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100"
                }`}
                aria-hidden={isCollapsed}
              >
                <ul className="min-h-0 space-y-0.5 overflow-hidden">
                  {group.notes.map((note) => {
                    const href = `/notes/${note.slug}`;
                    const isActive = pathname === href;
                    return (
                      <li key={note.slug}>
                        <Link
                          href={href}
                          onClick={onNavigate}
                          className={`block rounded-md px-2.5 py-1.5 text-sm transition-colors ${
                            isActive
                              ? "bg-accent/10 font-medium text-accent"
                              : "text-foreground/70 hover:bg-accent/5 hover:text-foreground"
                          }`}
                        >
                          <span className="line-clamp-1">{note.title}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
