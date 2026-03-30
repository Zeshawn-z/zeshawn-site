# MEMORY.md - Long-term Project Memory

## Project: zeshawn-site
- Personal portfolio/blog site built with Next.js 16 + Turbopack + Drizzle ORM (SQLite)
- Dev server typically runs on port 3000 or 3457

## Architecture
- DB layer: `src/lib/db/` (schema.ts, data.ts, db.ts, types.ts)
- Content: `src/lib/content/markdown.ts` for MD→HTML rendering
- Static content lives in `content/` as .md/.mdx files, loaded into SQLite via seed scripts
- Site config: `src/lib/config/site-config-dynamic.ts` for nav items
- Sitemap: `src/app/sitemap.ts`

## Notes Module (completed 2026-03-30)
- Added "沉淀" (Notes) section: `/notes` list page + `/notes/[slug]` detail page
- DB: `notes` table in schema.ts with NoteFull (extends Note) and NoteGroup types
- Components: `NotesSidebar` (grouped sidebar menu), `NotesLayoutShell` (collapsible layout)
- Sample notes: js-event-loop.md (JS面试), css-box-model.md (CSS面试), binary-search.md (算法)
- Navigation entry added between 博客 and 留客
- Sitemap includes notes list page and individual note pages
- Key fix: `data.ts` needed explicit `import type { Note } from "./types"` for `NoteFull extends Note` to work
