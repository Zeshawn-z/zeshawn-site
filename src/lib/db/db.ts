import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import path from "path";
import fs from "fs";
import * as schema from "./schema";

const DB_PATH = path.join(process.cwd(), "data", "site.db");

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb() {
  if (_db) return _db;

  // Ensure data directory exists
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const sqlite = new Database(DB_PATH);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");

  // Step 1: Create tables (idempotent)
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
    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_slug TEXT NOT NULL,
      parent_id INTEGER,
      floor INTEGER,
      nickname TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS site_config (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL DEFAULT ''
    );
    CREATE TABLE IF NOT EXISTS images (
      id TEXT PRIMARY KEY,
      filename TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      size INTEGER NOT NULL,
      data TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS pdfs (
      id TEXT PRIMARY KEY,
      filename TEXT NOT NULL,
      size INTEGER NOT NULL,
      data TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Step 2: Migration — add columns to existing tables if missing
  // ALTER TABLE ADD COLUMN errors when column already exists, so catch and ignore
  for (const col of [
    `ALTER TABLE comments ADD COLUMN parent_id INTEGER`,
    `ALTER TABLE comments ADD COLUMN floor INTEGER`,
    `ALTER TABLE comments ADD COLUMN location TEXT`,
    `ALTER TABLE posts ADD COLUMN content_type TEXT NOT NULL DEFAULT 'markdown'`,
    `ALTER TABLE posts ADD COLUMN pdf_id TEXT`,
    `ALTER TABLE guestbook ADD COLUMN location TEXT`,
  ]) {
    try { sqlite.exec(col); } catch { /* column already exists */ }
  }

  // Step 3: Create indexes (after migration ensures columns exist)
  sqlite.exec(`
    CREATE INDEX IF NOT EXISTS idx_comments_post_slug ON comments(post_slug);
    CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);
  `);

  _db = drizzle(sqlite, { schema });
  return _db;
}
