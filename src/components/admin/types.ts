import type { Project, Experience, SkillGroup } from "@/lib/db/types";

export type Tab = "posts" | "notes" | "projects" | "experiences" | "skills" | "comments" | "guestbook" | "images" | "config";

export interface PostAdmin {
  id: string;
  slug: string;
  title: string;
  description: string;
  content: string;
  contentType: "markdown" | "pdf";
  pdfId?: string;
  date: string;
  tags: string[];
  published: boolean;
  commentsEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NoteAdmin {
  id: string;
  slug: string;
  title: string;
  description: string;
  content: string;
  group: string;
  date: string;
  tags: string[];
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface NoteGroupOrder {
  name: string;
  order: number;
}

export interface GuestbookEntry {
  id: number;
  nickname: string;
  message: string;
  location?: string;
  createdAt: string;
}

export interface CommentAdmin {
  id: number;
  postSlug: string;
  parentId: number | null;
  floor: number | null;
  nickname: string;
  content: string;
  location?: string;
  createdAt: string;
}

export interface ImageItem {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  createdAt: string;
}

export type { Project, Experience, SkillGroup };
