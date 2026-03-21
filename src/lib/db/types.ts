export interface Project {
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
}

export interface Experience {
  id: string;
  title: string;
  company: string;
  period: string;
  description: string;
  tags?: string[];
  order?: number;
}

export interface SkillGroup {
  id: string;
  name: string;
  skills: string[];
  order?: number;
}
