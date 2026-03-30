import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const projects = sqliteTable("projects", {
  id: text("id").primaryKey(),
  title: text("title").notNull().default(""),
  description: text("description").notNull().default(""),
  tags: text("tags", { mode: "json" }).notNull().$type<string[]>().default([]),
  link: text("link"),
  github: text("github"),
  image: text("image"),
  blogSlug: text("blog_slug"),
  featured: integer("featured", { mode: "boolean" }).notNull().default(false),
  order: integer("order").notNull().default(999),
});

export const experiences = sqliteTable("experiences", {
  id: text("id").primaryKey(),
  title: text("title").notNull().default(""),
  company: text("company").notNull().default(""),
  period: text("period").notNull().default(""),
  description: text("description").notNull().default(""),
  tags: text("tags", { mode: "json" }).notNull().$type<string[]>().default([]),
  blogSlug: text("blog_slug"),
  order: integer("order").notNull().default(999),
});

export const skillGroups = sqliteTable("skill_groups", {
  id: text("id").primaryKey(),
  name: text("name").notNull().default(""),
  skills: text("skills", { mode: "json" }).notNull().$type<string[]>().default([]),
  order: integer("order").notNull().default(999),
});

export const posts = sqliteTable("posts", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull().default(""),
  description: text("description").notNull().default(""),
  content: text("content").notNull().default(""),
  contentType: text("content_type").notNull().default("markdown"), // "markdown" | "pdf"
  pdfId: text("pdf_id"),  // PDF 文件存储在 pdfs 表中的 id
  date: text("date").notNull().default(""),
  tags: text("tags", { mode: "json" }).notNull().$type<string[]>().default([]),
  published: integer("published", { mode: "boolean" }).notNull().default(true),
  commentsEnabled: integer("comments_enabled", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

export const guestbook = sqliteTable("guestbook", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  nickname: text("nickname").notNull(),
  message: text("message").notNull(),
  location: text("location"),  // IP 归属地，如 "广东广州"
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export const comments = sqliteTable("comments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  postSlug: text("post_slug").notNull(),
  parentId: integer("parent_id"),       // 楼中楼：回复哪条评论，NULL 表示主评论
  floor: integer("floor"),               // 主评论楼数，回复为 NULL
  nickname: text("nickname").notNull(),
  content: text("content").notNull(),
  location: text("location"),            // IP 归属地，如 "北京"
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export const siteConfig = sqliteTable("site_config", {
  key: text("key").primaryKey(),
  value: text("value").notNull().default(""),
});

export const images = sqliteTable("images", {
  id: text("id").primaryKey(),
  filename: text("filename").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(),
  data: text("data").notNull(),           // base64 编码的图片数据
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export const notes = sqliteTable("notes", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull().default(""),
  description: text("description").notNull().default(""),
  content: text("content").notNull().default(""),
  group: text("group").notNull().default(""),
  date: text("date").notNull().default(""),
  tags: text("tags", { mode: "json" }).notNull().$type<string[]>().default([]),
  order: integer("order").notNull().default(999),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

export const pdfs = sqliteTable("pdfs", {
  id: text("id").primaryKey(),
  filename: text("filename").notNull(),
  size: integer("size").notNull(),
  data: text("data").notNull(),           // base64 编码的 PDF 数据
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});
