/**
 * 一次性数据迁移脚本
 *
 * 将以下数据迁移到 SQLite 数据库：
 * 1. data/projects.json    → projects 表
 * 2. data/experiences.json  → experiences 表
 * 3. data/skills.json       → skill_groups 表
 * 4. content/blog/*.mdx     → posts 表
 * 5. site-config 默认值     → site_config 表
 *
 * 用法：
 *   npx tsx scripts/migrate.ts
 *
 * 注意：此脚本只需执行一次。执行前请确保 data/ 目录下有 JSON 文件和 content/blog/ 下有 MDX 文件。
 * 如果数据库中已有数据，脚本会跳过对应的表（不会覆盖）。
 */

import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { count } from "drizzle-orm";
import * as schema from "../src/lib/db/schema";
import * as fs from "fs";
import * as path from "path";
import matter from "gray-matter";

// ─── Paths ────────────────────────────────────────────────────

const ROOT = path.resolve(__dirname, "..");
const DB_PATH = path.join(ROOT, "data", "site.db");
const DATA_DIR = path.join(ROOT, "data");
const CONTENT_DIR = path.join(ROOT, "content", "blog");

// ─── Init DB ──────────────────────────────────────────────────

function initDb() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const sqlite = new Database(DB_PATH);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");

  // Create tables (idempotent)
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      tags TEXT NOT NULL DEFAULT '[]',
      link TEXT,
      github TEXT,
      image TEXT,
      featured INTEGER NOT NULL DEFAULT 0,
      "order" INTEGER NOT NULL DEFAULT 999
    );
    CREATE TABLE IF NOT EXISTS experiences (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL DEFAULT '',
      company TEXT NOT NULL DEFAULT '',
      period TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      tags TEXT NOT NULL DEFAULT '[]',
      "order" INTEGER NOT NULL DEFAULT 999
    );
    CREATE TABLE IF NOT EXISTS skill_groups (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL DEFAULT '',
      skills TEXT NOT NULL DEFAULT '[]',
      "order" INTEGER NOT NULL DEFAULT 999
    );
    CREATE TABLE IF NOT EXISTS posts (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      content TEXT NOT NULL DEFAULT '',
      date TEXT NOT NULL DEFAULT '',
      tags TEXT NOT NULL DEFAULT '[]',
      published INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS guestbook (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nickname TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS site_config (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL DEFAULT ''
    );
  `);

  return drizzle(sqlite, { schema });
}

// ─── Helpers ──────────────────────────────────────────────────

function readJsonFile<T>(filename: string): T | null {
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) {
    console.log(`  ⚠ 文件不存在: ${filePath}，跳过`);
    return null;
  }
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as T;
}

// ─── Migrate Projects ─────────────────────────────────────────

function migrateProjects(db: ReturnType<typeof initDb>) {
  const existing = db.select({ value: count() }).from(schema.projects).get();
  if (existing && existing.value > 0) {
    console.log(`  ⏭ projects 表已有 ${existing.value} 条数据，跳过`);
    return;
  }

  interface ProjectJson {
    id: string;
    title: string;
    description: string;
    tags: string[];
    link?: string;
    github?: string;
    image?: string;
    featured?: boolean;
    order?: number;
  }

  const data = readJsonFile<ProjectJson[]>("projects.json");
  if (!data || data.length === 0) return;

  db.transaction((tx) => {
    data.forEach((p, i) => {
      tx.insert(schema.projects).values({
        id: p.id,
        title: p.title,
        description: p.description,
        tags: p.tags ?? [],
        link: p.link ?? null,
        github: p.github ?? null,
        image: p.image ?? null,
        featured: p.featured ?? false,
        order: p.order ?? i,
      }).run();
    });
  });

  console.log(`  ✅ 迁移了 ${data.length} 个项目`);
}

// ─── Migrate Experiences ──────────────────────────────────────

function migrateExperiences(db: ReturnType<typeof initDb>) {
  const existing = db.select({ value: count() }).from(schema.experiences).get();
  if (existing && existing.value > 0) {
    console.log(`  ⏭ experiences 表已有 ${existing.value} 条数据，跳过`);
    return;
  }

  interface ExperienceJson {
    id: string;
    title: string;
    company: string;
    period: string;
    description: string;
    tags?: string[];
    order?: number;
  }

  const data = readJsonFile<ExperienceJson[]>("experiences.json");
  if (!data || data.length === 0) return;

  db.transaction((tx) => {
    data.forEach((e, i) => {
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

  console.log(`  ✅ 迁移了 ${data.length} 条经历`);
}

// ─── Migrate Skills ───────────────────────────────────────────

function migrateSkills(db: ReturnType<typeof initDb>) {
  const existing = db.select({ value: count() }).from(schema.skillGroups).get();
  if (existing && existing.value > 0) {
    console.log(`  ⏭ skill_groups 表已有 ${existing.value} 条数据，跳过`);
    return;
  }

  interface SkillGroupJson {
    id: string;
    name: string;
    skills: string[];
    order?: number;
  }

  const data = readJsonFile<SkillGroupJson[]>("skills.json");
  if (!data || data.length === 0) return;

  db.transaction((tx) => {
    data.forEach((g, i) => {
      tx.insert(schema.skillGroups).values({
        id: g.id,
        name: g.name,
        skills: g.skills,
        order: g.order ?? i,
      }).run();
    });
  });

  console.log(`  ✅ 迁移了 ${data.length} 个技能分组`);
}

// ─── Migrate MDX Blog Posts ───────────────────────────────────

function migratePosts(db: ReturnType<typeof initDb>) {
  const existing = db.select({ value: count() }).from(schema.posts).get();
  if (existing && existing.value > 0) {
    console.log(`  ⏭ posts 表已有 ${existing.value} 条数据，跳过`);
    return;
  }

  if (!fs.existsSync(CONTENT_DIR)) {
    console.log(`  ⚠ 博客目录不存在: ${CONTENT_DIR}，跳过`);
    return;
  }

  const mdxFiles = fs
    .readdirSync(CONTENT_DIR)
    .filter((f) => f.endsWith(".mdx") || f.endsWith(".md"));

  if (mdxFiles.length === 0) {
    console.log("  ⚠ 没有找到 MDX/MD 文件，跳过");
    return;
  }

  let migrated = 0;

  db.transaction((tx) => {
    mdxFiles.forEach((filename) => {
      const filePath = path.join(CONTENT_DIR, filename);
      const raw = fs.readFileSync(filePath, "utf-8");
      const { data: frontmatter, content } = matter(raw);

      const slug = filename.replace(/\.(mdx|md)$/, "");
      const id = Date.now().toString() + Math.random().toString(36).slice(2, 6);
      const now = new Date().toISOString();

      tx.insert(schema.posts).values({
        id,
        slug,
        title: (frontmatter.title as string) || slug,
        description: (frontmatter.description as string) || "",
        content: content.trim(),
        date: (frontmatter.date as string) || now.slice(0, 10),
        tags: Array.isArray(frontmatter.tags)
          ? (frontmatter.tags as string[])
          : [],
        published: frontmatter.published !== false,
        createdAt: now,
        updatedAt: now,
      }).run();

      migrated++;
    });
  });

  console.log(`  ✅ 迁移了 ${migrated} 篇博客文章`);
}

// ─── Migrate Site Config ──────────────────────────────────────

/**
 * 从 src/lib/site-config.ts 读取实际配置并迁移。
 * 该文件导出 siteConfig 对象，结构如：
 * {
 *   name, title, description, url,
 *   author: { name, bio, avatar, location, email },
 *   hero: { greeting, name, tagline, description },
 *   social: { github, twitter, email },
 *   nav: [...]
 * }
 *
 * 展平为 "section.field" → value 的键值对写入 site_config 表。
 * nav 是代码层面的静态数组，不需要迁移。
 */
async function migrateSiteConfig(db: ReturnType<typeof initDb>) {
  const existing = db.select({ value: count() }).from(schema.siteConfig).get();
  if (existing && existing.value > 0) {
    console.log(`  ⏭ site_config 表已有 ${existing.value} 条数据，跳过`);
    return;
  }

  // 尝试从源文件动态导入 siteConfig
  const configPath = path.join(ROOT, "src", "lib", "site-config.ts");
  if (!fs.existsSync(configPath)) {
    console.log(`  ⚠ 配置文件不存在: ${configPath}，跳过`);
    console.log(`    (如果 site-config.ts 已被删除，请从 git 恢复后再执行迁移)`);
    return;
  }

  // tsx 支持直接 import .ts 文件
  // 在 Windows 上，import() 绝对路径需要 file:// 前缀
  let siteConfig: Record<string, unknown>;
  try {
    const { pathToFileURL } = await import("url");
    const importUrl = pathToFileURL(configPath).href;
    const mod = await import(importUrl);
    siteConfig = mod.siteConfig;
    if (!siteConfig) {
      console.log("  ⚠ site-config.ts 中未找到 siteConfig 导出，跳过");
      return;
    }
  } catch (err) {
    console.log(`  ⚠ 无法加载 site-config.ts: ${err}`);
    return;
  }

  // 展平嵌套对象为 "prefix.key" → string
  const flat: Record<string, string> = {};

  // 顶层字段 → "site.xxx"
  if (siteConfig.name) flat["site.name"] = String(siteConfig.name);
  if (siteConfig.description) flat["site.description"] = String(siteConfig.description);
  if (siteConfig.url) flat["site.url"] = String(siteConfig.url);

  // author.xxx
  const author = siteConfig.author as Record<string, string> | undefined;
  if (author) {
    if (author.name) flat["author.name"] = author.name;
    if (author.bio) flat["author.bio"] = author.bio;
    if (author.location) flat["author.location"] = author.location;
    if (author.email) flat["author.email"] = author.email;
  }

  // hero.xxx
  const hero = siteConfig.hero as Record<string, string> | undefined;
  if (hero) {
    if (hero.greeting) flat["hero.greeting"] = hero.greeting;
    if (hero.name) flat["hero.name"] = hero.name;
    if (hero.tagline) flat["hero.tagline"] = hero.tagline;
    if (hero.description) flat["hero.description"] = hero.description;
  }

  // social.xxx
  const social = siteConfig.social as Record<string, string> | undefined;
  if (social) {
    if (social.github) flat["social.github"] = social.github;
    if (social.twitter) flat["social.twitter"] = social.twitter;
    if (social.email) flat["social.email"] = social.email;
  }

  if (Object.keys(flat).length === 0) {
    console.log("  ⚠ 从 site-config.ts 中未提取到任何配置项，跳过");
    return;
  }

  db.transaction((tx) => {
    for (const [key, value] of Object.entries(flat)) {
      tx.insert(schema.siteConfig).values({ key, value }).run();
    }
  });

  console.log(`  ✅ 从 site-config.ts 迁移了 ${Object.keys(flat).length} 项站点配置`);
}

// ─── Main ─────────────────────────────────────────────────────

async function main() {
  console.log("🚀 开始数据迁移...\n");
  console.log(`📂 数据库路径: ${DB_PATH}`);
  console.log(`📂 数据目录:   ${DATA_DIR}`);
  console.log(`📂 博客目录:   ${CONTENT_DIR}\n`);

  const db = initDb();

  console.log("📦 迁移项目数据...");
  migrateProjects(db);

  console.log("📦 迁移经历数据...");
  migrateExperiences(db);

  console.log("📦 迁移技能数据...");
  migrateSkills(db);

  console.log("📦 迁移博客文章...");
  migratePosts(db);

  console.log("📦 迁移站点配置...");
  await migrateSiteConfig(db);

  console.log("\n✨ 数据迁移完成！");
  console.log(
    "💡 提示：迁移成功后，JSON、MDX 和 site-config.ts 源文件可以归档或删除。"
  );
}

main();
