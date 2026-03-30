import type { Metadata } from "next";
import { getNotesByGroup } from "@/lib/db/data";
import NotesIndexMenu from "@/components/notes/NotesIndexMenu";
import { BookOpen } from "lucide-react";

export const metadata: Metadata = {
  title: "沉淀",
  description: "面试题、算法题与知识体系化沉淀",
};

export default function NotesPage() {
  const groups = getNotesByGroup();

  return (
    <section className="min-h-[calc(100vh-4.5rem)]">
      <div className="flex min-h-[calc(100vh-4.5rem)]">
        <NotesIndexMenu groups={groups} />

        <div className="min-w-0 flex-1 px-4 pb-10 sm:px-6 lg:px-10 lg:pt-8">
          <div className="mb-8 mt-6 lg:mt-2">
            <div className="flex items-center gap-2 text-sm text-muted">
              <BookOpen size={16} />
              <span>知识沉淀</span>
            </div>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              沉淀
            </h1>
          </div>

          {groups.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border py-20 text-center">
              <BookOpen size={40} className="mx-auto mb-3 text-muted/40" />
              <p className="text-muted">暂无笔记</p>
            </div>
          ) : (
            <div className="grid min-h-[58vh] place-items-center rounded-lg border border-dashed border-border/80 bg-card/20">
              <div className="px-6 text-center">
                <p className="text-base text-foreground">默认内容区</p>
                <p className="mt-2 text-sm text-muted">从左侧导航选择一篇笔记开始阅读。</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
