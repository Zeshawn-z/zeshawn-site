"use client";

import { useState } from "react";
import { PanelLeftClose, PanelLeft } from "lucide-react";

interface NotesLayoutShellProps {
  sidebar: React.ReactNode;
  children: React.ReactNode;
}

export default function NotesLayoutShell({ sidebar, children }: NotesLayoutShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="relative">
      {/* 移动端侧边栏切换按钮 */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="mb-3 inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs text-muted transition-colors hover:text-foreground lg:hidden"
        aria-label={sidebarOpen ? "收起侧边栏" : "展开侧边栏"}
      >
        {sidebarOpen ? <PanelLeftClose size={14} /> : <PanelLeft size={14} />}
        {sidebarOpen ? "收起菜单" : "展开菜单"}
      </button>

      {/* 桌面端侧边栏切换按钮 */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="mb-3 hidden items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs text-muted transition-colors hover:text-foreground lg:inline-flex"
        aria-label={sidebarOpen ? "收起侧边栏" : "展开侧边栏"}
      >
        {sidebarOpen ? <PanelLeftClose size={14} /> : <PanelLeft size={14} />}
      </button>

      <div className="flex gap-6">
        {/* 侧边栏 */}
        <div
          className={`shrink-0 transition-all duration-200 ${
            sidebarOpen
              ? "block w-56 translate-x-0 opacity-100 lg:block"
              : "hidden w-0 -translate-x-4 opacity-0 lg:hidden"
          }`}
        >
          {sidebarOpen && sidebar}
        </div>

        {/* 主内容 */}
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
