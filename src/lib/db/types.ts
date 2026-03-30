export interface Project {
  id: string;
  title: string;
  description: string;
  tags: string[];
  link?: string;
  github?: string;
  image?: string;
  blogSlug?: string;
  featured?: boolean;
  order?: number;
}

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  tags: string[];
  readingTime?: string;
  published?: boolean;
  contentType?: "markdown" | "pdf";
  pdfId?: string;
  commentsEnabled?: boolean;
}

export interface Experience {
  id: string;
  title: string;
  company: string;
  period: string;
  description: string;
  tags?: string[];
  blogSlug?: string;
  order?: number;
}

export interface SkillGroup {
  id: string;
  name: string;
  skills: string[];
  order?: number;
}

export interface Note {
  slug: string;
  title: string;
  description: string;
  group: string;
  date: string;
  tags: string[];
  order?: number;
}
