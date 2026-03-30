import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Calendar, Tag } from "lucide-react";
import { getNoteBySlug, getNotesByGroup } from "@/lib/db/data";
import { renderMarkdown } from "@/lib/content/markdown";
import CopyCodeButton from "@/components/common/CopyCodeButton";
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
  const contentHtml = await renderMarkdown(note.content);

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
            dangerouslySetInnerHTML={{ __html: contentHtml }}
          />
          <CopyCodeButton />
        </article>
      </div>
    </section>
  );
}
