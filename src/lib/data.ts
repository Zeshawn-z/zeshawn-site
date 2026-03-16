import { getDb } from "./db";
import { eq, desc, asc, sql, and, count } from "drizzle-orm";
import * as schema from "./schema";
import type { Project, Experience, SkillGroup, BlogPost } from "./types";

// ─── Projects ─────────────────────────────────────────────────

export function getProjects(): Project[] {
  const db = getDb();
  const rows = db.select().from(schema.projects).orderBy(asc(schema.projects.order)).all();
  return rows.map(rowToProject);
}

export function saveProjects(projects: Project[]) {
  const db = getDb();
  db.transaction((tx) => {
    tx.delete(schema.projects).run();
    projects.forEach((p, i) => {
      tx.insert(schema.projects).values({
        id: p.id,
        title: p.title,
        description: p.description,
        tags: p.tags,
        link: p.link ?? null,
        github: p.github ?? null,
        image: p.image ?? null,
        featured: p.featured ?? false,
        order: p.order ?? i,
      }).run();
    });
  });
}

function rowToProject(r: typeof schema.projects.$inferSelect): Project {
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    tags: r.tags,
    link: r.link ?? undefined,
    github: r.github ?? undefined,
    image: r.image ?? undefined,
    featured: r.featured,
    order: r.order,
  };
}

// ─── Experiences ──────────────────────────────────────────────

export function getExperiences(): Experience[] {
  const db = getDb();
  const rows = db.select().from(schema.experiences).orderBy(asc(schema.experiences.order)).all();
  return rows.map(rowToExperience);
}

export function saveExperiences(experiences: Experience[]) {
  const db = getDb();
  db.transaction((tx) => {
    tx.delete(schema.experiences).run();
    experiences.forEach((e, i) => {
      tx.insert(schema.experiences).values({
        id: e.id,
        title: e.title,
        company: e.company,
        period: e.period,
        description: e.description,
        tags: e.tags ?? [],
        order: e.order ?? i,
      }).run();
    });
  });
}

function rowToExperience(r: typeof schema.experiences.$inferSelect): Experience {
  return {
    id: r.id,
    title: r.title,
    company: r.company,
    period: r.period,
    description: r.description,
    tags: r.tags,
    order: r.order,
  };
}

// ─── Skills ───────────────────────────────────────────────────

export function getSkills(): SkillGroup[] {
  const db = getDb();
  const rows = db.select().from(schema.skillGroups).orderBy(asc(schema.skillGroups.order)).all();
  return rows.map(rowToSkillGroup);
}

export function saveSkills(skills: SkillGroup[]) {
  const db = getDb();
  db.transaction((tx) => {
    tx.delete(schema.skillGroups).run();
    skills.forEach((g, i) => {
      tx.insert(schema.skillGroups).values({
        id: g.id,
        name: g.name,
        skills: g.skills,
        order: g.order ?? i,
      }).run();
    });
  });
}

function rowToSkillGroup(r: typeof schema.skillGroups.$inferSelect): SkillGroup {
  return {
    id: r.id,
    name: r.name,
    skills: r.skills,
    order: r.order,
  };
}

// ─── Blog Posts ───────────────────────────────────────────────

export interface PostFull extends BlogPost {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export function getAllPosts(): BlogPost[] {
  const db = getDb();
  const rows = db
    .select()
    .from(schema.posts)
    .where(eq(schema.posts.published, true))
    .orderBy(desc(schema.posts.date))
    .all();
  return rows.map(rowToPost);
}

export function getAllPostsAdmin(): PostFull[] {
  const db = getDb();
  const rows = db
    .select()
    .from(schema.posts)
    .orderBy(desc(schema.posts.date))
    .all();
  return rows.map(rowToPostFull);
}

export function getPostBySlug(slug: string): PostFull | null {
  const db = getDb();
  const row = db
    .select()
    .from(schema.posts)
    .where(eq(schema.posts.slug, slug))
    .get();
  if (!row) return null;
  return rowToPostFull(row);
}

export function createPost(post: {
  slug: string;
  title: string;
  description: string;
  content: string;
  date: string;
  tags: string[];
  published: boolean;
}): PostFull {
  const db = getDb();
  const id = Date.now().toString() + Math.random().toString(36).slice(2, 6);
  const now = new Date().toISOString();
  db.insert(schema.posts).values({
    id,
    slug: post.slug,
    title: post.title,
    description: post.description,
    content: post.content,
    date: post.date,
    tags: post.tags,
    published: post.published,
    createdAt: now,
    updatedAt: now,
  }).run();
  return getPostBySlug(post.slug)!;
}

export function updatePost(
  id: string,
  post: {
    slug?: string;
    title?: string;
    description?: string;
    content?: string;
    date?: string;
    tags?: string[];
    published?: boolean;
  }
) {
  const db = getDb();
  const updates: Partial<typeof schema.posts.$inferInsert> = {
    updatedAt: new Date().toISOString(),
  };
  if (post.slug !== undefined) updates.slug = post.slug;
  if (post.title !== undefined) updates.title = post.title;
  if (post.description !== undefined) updates.description = post.description;
  if (post.content !== undefined) updates.content = post.content;
  if (post.date !== undefined) updates.date = post.date;
  if (post.tags !== undefined) updates.tags = post.tags;
  if (post.published !== undefined) updates.published = post.published;

  db.update(schema.posts).set(updates).where(eq(schema.posts.id, id)).run();
}

export function deletePost(id: string) {
  const db = getDb();
  db.delete(schema.posts).where(eq(schema.posts.id, id)).run();
}

function rowToPost(r: typeof schema.posts.$inferSelect): BlogPost {
  const wordCount = r.content.trim().split(/\s+/).length;
  const readingTime = `${Math.max(1, Math.ceil(wordCount / 200))} min`;
  return {
    slug: r.slug,
    title: r.title,
    description: r.description,
    date: r.date,
    tags: r.tags,
    readingTime,
    published: r.published,
  };
}

function rowToPostFull(r: typeof schema.posts.$inferSelect): PostFull {
  const base = rowToPost(r);
  return {
    ...base,
    id: r.id,
    content: r.content,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

// ─── Guestbook ────────────────────────────────────────────────

export interface GuestbookEntry {
  id: number;
  nickname: string;
  message: string;
  createdAt: string;
}

export function getGuestbookEntries(limit = 100, offset = 0): GuestbookEntry[] {
  const db = getDb();
  const rows = db
    .select()
    .from(schema.guestbook)
    .orderBy(desc(schema.guestbook.createdAt))
    .limit(limit)
    .offset(offset)
    .all();
  return rows.map(rowToGuestbook);
}

export function getGuestbookCount(): number {
  const db = getDb();
  const result = db.select({ value: count() }).from(schema.guestbook).get();
  return result?.value ?? 0;
}

export function addGuestbookEntry(nickname: string, message: string): GuestbookEntry {
  const db = getDb();
  const result = db.insert(schema.guestbook).values({ nickname, message }).run();
  const row = db
    .select()
    .from(schema.guestbook)
    .where(eq(schema.guestbook.id, Number(result.lastInsertRowid)))
    .get();
  return rowToGuestbook(row!);
}

export function deleteGuestbookEntry(id: number) {
  const db = getDb();
  db.delete(schema.guestbook).where(eq(schema.guestbook.id, id)).run();
}

function rowToGuestbook(r: typeof schema.guestbook.$inferSelect): GuestbookEntry {
  return {
    id: r.id,
    nickname: r.nickname,
    message: r.message,
    createdAt: r.createdAt,
  };
}

// ─── Site Config ──────────────────────────────────────────────

export function getSiteConfig(): Record<string, string> {
  const db = getDb();
  const rows = db.select().from(schema.siteConfig).all();
  const cfg: Record<string, string> = {};
  for (const r of rows) cfg[r.key] = r.value;
  return cfg;
}

export function updateSiteConfig(updates: Record<string, string>) {
  const db = getDb();
  db.transaction((tx) => {
    for (const [k, v] of Object.entries(updates)) {
      tx.insert(schema.siteConfig)
        .values({ key: k, value: v })
        .onConflictDoUpdate({
          target: schema.siteConfig.key,
          set: { value: v },
        })
        .run();
    }
  });
}
