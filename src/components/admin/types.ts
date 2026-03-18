import type { Project, Experience, SkillGroup } from "@/lib/db/types";

export type Tab = "posts" | "projects" | "experiences" | "skills" | "comments" | "guestbook" | "images" | "config";

export interface PostAdmin {
  id: string;
  slug: string;
  title: string;
  description: string;
  content: string;
  date: string;
  tags: string[];
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GuestbookEntry {
  id: number;
  nickname: string;
  message: string;
  createdAt: string;
}

export interface CommentAdmin {
  id: number;
  postSlug: string;
  parentId: number | null;
  floor: number | null;
  nickname: string;
  content: string;
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
