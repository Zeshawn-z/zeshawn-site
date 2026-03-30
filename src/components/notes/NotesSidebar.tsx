"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { NoteGroup } from "@/lib/db/data";

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
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const activeGroupNames = useMemo(() => {
    const active = new Set<string>();
    for (const group of groups) {
      if (group.notes.some((note) => pathname === `/notes/${note.slug}`)) {
        active.add(group.name);
      }
    }
    return active;
  }, [groups, pathname]);

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
          const isCollapsed = activeGroupNames.has(group.name)
            ? false
            : (collapsedGroups[group.name] ?? false);

          return (
            <div key={group.name}>
              <button
                type="button"
                onClick={() => toggleGroup(group.name)}
                className="mb-1.5 -ml-2.5 flex w-full items-center gap-1.5 rounded px-1 py-0.5 text-left text-xs font-semibold uppercase tracking-wider text-muted transition-colors hover:text-foreground"
                aria-expanded={!isCollapsed}
              >
                {isCollapsed ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
                <span>{group.name}</span>
              </button>

              {!isCollapsed && (
                <ul className="space-y-0.5">
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
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
