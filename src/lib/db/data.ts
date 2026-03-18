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
  // 查出文章详情，用于级联删除评论和图片
  const post = db.select({ slug: schema.posts.slug, content: schema.posts.content }).from(schema.posts).where(eq(schema.posts.id, id)).get();
  if (post) {
    deleteCommentsBySlug(post.slug);
    // 清理文章内容中引用的图片
    deleteImagesInContent(post.content);
  }
  db.delete(schema.posts).where(eq(schema.posts.id, id)).run();
}

/** 扫描 markdown 内容中的 /api/images/xxx 引用并删除对应图片 */
function deleteImagesInContent(content: string) {
  const regex = /\/api\/images\/([a-f0-9-]{36})/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    try { deleteImage(match[1]); } catch { /* ignore */ }
  }
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

// ─── Comments ─────────────────────────────────────────────────

export interface Comment {
  id: number;
  postSlug: string;
  parentId: number | null;
  floor: number | null;
  nickname: string;
  content: string;
  createdAt: string;
  replies?: Comment[];       // 前端组装
}

/**
 * 获取某篇文章的主评论（带分页、排序），并附带所有回复
 */
export function getCommentsBySlug(
  postSlug: string,
  opts: { page?: number; limit?: number; order?: "asc" | "desc" } = {}
): { comments: Comment[]; total: number; page: number; pages: number } {
  const db = getDb();
  const page = Math.max(1, opts.page ?? 1);
  const limit = opts.limit ?? 10;
  const offset = (page - 1) * limit;
  const orderDir = opts.order === "desc" ? desc : asc;

  // 只查主评论数量（不含回复）
  const totalResult = db
    .select({ value: count() })
    .from(schema.comments)
    .where(and(eq(schema.comments.postSlug, postSlug), sql`${schema.comments.parentId} IS NULL`))
    .get();
  const total = totalResult?.value ?? 0;

  // 主评论（分页）
  const mainRows = db
    .select()
    .from(schema.comments)
    .where(and(eq(schema.comments.postSlug, postSlug), sql`${schema.comments.parentId} IS NULL`))
    .orderBy(orderDir(schema.comments.createdAt))
    .limit(limit)
    .offset(offset)
    .all();

  const mainComments = mainRows.map(rowToComment);

  // 批量获取这些主评论的所有回复
  if (mainComments.length > 0) {
    const mainIds = mainComments.map((c) => c.id);
    const replyRows = db
      .select()
      .from(schema.comments)
      .where(sql`${schema.comments.parentId} IN (${sql.join(mainIds.map((id) => sql`${id}`), sql`, `)})`)
      .orderBy(asc(schema.comments.createdAt))
      .all();

    const repliesByParent = new Map<number, Comment[]>();
    for (const r of replyRows) {
      const comment = rowToComment(r);
      const arr = repliesByParent.get(comment.parentId!) || [];
      arr.push(comment);
      repliesByParent.set(comment.parentId!, arr);
    }

    for (const c of mainComments) {
      c.replies = repliesByParent.get(c.id) || [];
    }
  }

  return { comments: mainComments, total, page, pages: Math.ceil(total / limit) };
}

/**
 * 获取主评论数（不含回复）
 */
export function getCommentCount(postSlug: string): number {
  const db = getDb();
  const result = db
    .select({ value: count() })
    .from(schema.comments)
    .where(and(eq(schema.comments.postSlug, postSlug), sql`${schema.comments.parentId} IS NULL`))
    .get();
  return result?.value ?? 0;
}

/**
 * 管理后台：获取所有评论（含回复），支持 slug 筛选
 */
export function getAllComments(opts: { limit?: number; offset?: number; slug?: string } = {}): Comment[] {
  const db = getDb();
  const limit = opts.limit ?? 500;
  const offset = opts.offset ?? 0;

  if (opts.slug) {
    return db
      .select()
      .from(schema.comments)
      .where(eq(schema.comments.postSlug, opts.slug))
      .orderBy(desc(schema.comments.createdAt))
      .limit(limit)
      .offset(offset)
      .all()
      .map(rowToComment);
  }

  return db
    .select()
    .from(schema.comments)
    .orderBy(desc(schema.comments.createdAt))
    .limit(limit)
    .offset(offset)
    .all()
    .map(rowToComment);
}

export function getAllCommentsCount(slug?: string): number {
  const db = getDb();
  if (slug) {
    const result = db
      .select({ value: count() })
      .from(schema.comments)
      .where(eq(schema.comments.postSlug, slug))
      .get();
    return result?.value ?? 0;
  }
  const result = db.select({ value: count() }).from(schema.comments).get();
  return result?.value ?? 0;
}

/**
 * 发表主评论：自动计算楼数
 */
export function addComment(postSlug: string, nickname: string, content: string, parentId?: number): Comment {
  const db = getDb();

  let floor: number | null = null;
  if (!parentId) {
    // 主评论：计算当前最大楼数 + 1
    const maxFloor = db
      .select({ value: sql<number>`MAX(floor)` })
      .from(schema.comments)
      .where(and(eq(schema.comments.postSlug, postSlug), sql`${schema.comments.parentId} IS NULL`))
      .get();
    floor = (maxFloor?.value ?? 0) + 1;
  }

  const result = db
    .insert(schema.comments)
    .values({
      postSlug,
      parentId: parentId ?? null,
      floor,
      nickname,
      content,
    })
    .run();

  const row = db
    .select()
    .from(schema.comments)
    .where(eq(schema.comments.id, Number(result.lastInsertRowid)))
    .get();
  return rowToComment(row!);
}

export function deleteComment(id: number) {
  const db = getDb();
  // 同时删除该评论的所有回复
  db.delete(schema.comments).where(eq(schema.comments.parentId, id)).run();
  db.delete(schema.comments).where(eq(schema.comments.id, id)).run();
}

/**
 * 级联删除：删除某篇文章的所有评论（含回复）
 */
export function deleteCommentsBySlug(postSlug: string) {
  const db = getDb();
  db.delete(schema.comments).where(eq(schema.comments.postSlug, postSlug)).run();
}

function rowToComment(r: typeof schema.comments.$inferSelect): Comment {
  return {
    id: r.id,
    postSlug: r.postSlug,
    parentId: r.parentId,
    floor: r.floor,
    nickname: r.nickname,
    content: r.content,
    createdAt: r.createdAt,
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

// ─── Images ───────────────────────────────────────────────────

export function saveImage(id: string, filename: string, mimeType: string, size: number, base64Data: string) {
  const db = getDb();
  db.insert(schema.images)
    .values({ id, filename, mimeType, size, data: base64Data })
    .run();
  return { id, filename, mimeType, size };
}

export function getImage(id: string) {
  const db = getDb();
  return db.select().from(schema.images).where(eq(schema.images.id, id)).get();
}

export function deleteImage(id: string) {
  const db = getDb();
  db.delete(schema.images).where(eq(schema.images.id, id)).run();
}

/** 获取所有图片（不含 base64 data，用于列表展示） */
export function getAllImages() {
  const db = getDb();
  return db
    .select({
      id: schema.images.id,
      filename: schema.images.filename,
      mimeType: schema.images.mimeType,
      size: schema.images.size,
      createdAt: schema.images.createdAt,
    })
    .from(schema.images)
    .orderBy(sql`created_at DESC`)
    .all();
}

/** 扫描所有帖子内容，删除未被任何帖子引用的图片，返回被删除的图片 id 列表 */
export function cleanupUnusedImages() {
  const db = getDb();

  // 1. 获取所有帖子的 content
  const allPosts = db
    .select({ content: schema.posts.content })
    .from(schema.posts)
    .all();

  // 2. 收集所有帖子中引用的图片 id
  const usedIds = new Set<string>();
  const regex = /\/api\/images\/([a-f0-9-]{36})/g;
  for (const post of allPosts) {
    let match;
    while ((match = regex.exec(post.content)) !== null) {
      usedIds.add(match[1]);
    }
    regex.lastIndex = 0; // reset for next post
  }

  // 3. 获取所有图片 id
  const allImages = db
    .select({ id: schema.images.id })
    .from(schema.images)
    .all();

  // 4. 删除未被引用的图片
  const deletedIds: string[] = [];
  for (const img of allImages) {
    if (!usedIds.has(img.id)) {
      db.delete(schema.images).where(eq(schema.images.id, img.id)).run();
      deletedIds.push(img.id);
    }
  }

  return deletedIds;
}
