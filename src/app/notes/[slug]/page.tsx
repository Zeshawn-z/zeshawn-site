import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Calendar, Pencil, Tag } from "lucide-react";
import { getNoteBySlug, getNotesByGroup } from "@/lib/db/data";
import { renderMarkdownWithHeadings } from "@/lib/content/markdown";
import { isAuthenticated } from "@/lib/auth/auth";
import CopyCodeButton from "@/components/common/CopyCodeButton";
import MermaidRenderer from "@/components/common/MermaidRenderer";
import MarkdownToc from "@/components/common/MarkdownToc";
import NotesIndexMenu from "@/components/notes/NotesIndexMenu";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const note = getNoteBySlug(slug);
  if (!note) return {};
  return {
    title: `${note.title} — 沉淀`,
    description: note.description,
    openGraph: {
      type: "article",
      title: note.title,
      description: note.description,
      publishedTime: note.date || undefined,
      tags: note.tags,
    },
  };
}

export default async function NoteDetailPage({ params }: Props) {
  const { slug } = await params;
  const note = getNoteBySlug(slug);

  if (!note) {
    notFound();
  }

  const groups = getNotesByGroup();
  const [rendered, canEdit] = await Promise.all([
    renderMarkdownWithHeadings(note.content),
    isAuthenticated(),
  ]);

  return (
    <section className="min-h-[calc(100vh-4.5rem)]">
      <div className="flex min-h-[calc(100vh-4.5rem)]">
        <NotesIndexMenu groups={groups} />

        <article className="min-w-0 flex-1 px-4 pb-10 pt-6 sm:px-6 lg:px-10 lg:pt-8">
          {/* 文章头部 */}
          <header className="mb-8">
            {note.group && (
              <span className="mb-2 inline-block rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent">
                {note.group}
              </span>
            )}
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {note.title}
            </h1>
            {note.description && (
              <p className="mt-2 text-base text-muted">
                {note.description}
              </p>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted">
              {note.date && (
                <span className="inline-flex items-center gap-1.5">
                  <Calendar size={14} />
                  {note.date}
                </span>
              )}
              {canEdit && (
                <Link
                  href={`/admin?tab=notes&edit=${encodeURIComponent(note.id)}`}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs font-medium text-accent transition-colors hover:border-accent hover:bg-accent/5"
                >
                  <Pencil size={13} />
                  编辑笔记
                </Link>
              )}
            </div>
            {note.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {note.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-full bg-accent/8 px-2 py-0.5 text-xs text-accent/80"
                  >
                    <Tag size={10} />
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </header>

          {/* Markdown 内容 */}
          <div
            className="markdown-body"
            dangerouslySetInnerHTML={{ __html: rendered.html }}
          />
          <MermaidRenderer />
          <CopyCodeButton />
        </article>
        {rendered.headings.length > 0 && (
          <div className="contents xl:block xl:w-60 xl:shrink-0 xl:px-4 xl:pt-8">
            <MarkdownToc headings={rendered.headings} mobileAboveNotesMenu />
          </div>
        )}
      </div>
    </section>
  );
}
