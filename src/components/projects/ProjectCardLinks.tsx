"use client";

import { useRouter } from "next/navigation";
import { ExternalLink, Github, BookOpen } from "lucide-react";

interface ProjectCardLinksProps {
  blogSlug?: string | null;
  github?: string | null;
  link?: string | null;
  /** 当卡片本身已被 <Link> 包裹时设为 true，内部按钮将用 button 代替 a 以避免 <a> 嵌套 */
  insideLink?: boolean;
}

export default function ProjectCardLinks({ blogSlug, github, link, insideLink = false }: ProjectCardLinksProps) {
  const router = useRouter();

  const handleNav = (e: React.MouseEvent, url: string, external?: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    if (external) {
      window.open(url, "_blank", "noopener,noreferrer");
    } else {
      router.push(url);
    }
  };

  // 当处于 Link 内部时，用 button 渲染避免 <a> 嵌套
  if (insideLink) {
    return (
      <div
        className="flex shrink-0 items-center gap-1.5"
        onClick={(e) => e.stopPropagation()}
      >
        {blogSlug && (
          <button
            onClick={(e) => handleNav(e, `/blog/${blogSlug}`)}
            className="rounded-md p-2 text-muted transition-colors hover:bg-blue-500/10 hover:text-blue-500"
            title="查看博客"
          >
            <BookOpen size={16} />
          </button>
        )}
        {github && (
          <button
            onClick={(e) => handleNav(e, github, true)}
            className="rounded-md p-2 text-muted transition-colors hover:bg-accent/10 hover:text-accent"
            title="GitHub"
          >
            <Github size={16} />
          </button>
        )}
        {link && (
          <button
            onClick={(e) => handleNav(e, link, true)}
            className="rounded-md p-2 text-muted transition-colors hover:bg-accent/10 hover:text-accent"
            title="访问项目"
          >
            <ExternalLink size={16} />
          </button>
        )}
      </div>
    );
  }

  // 卡片没被 Link 包裹时，正常用 <a> 渲染
  return (
    <div className="flex shrink-0 items-center gap-1.5">
      {blogSlug && (
        <a
          href={`/blog/${blogSlug}`}
          onClick={(e) => { e.stopPropagation(); router.push(`/blog/${blogSlug}`); e.preventDefault(); }}
          className="rounded-md p-2 text-muted transition-colors hover:bg-blue-500/10 hover:text-blue-500"
          title="查看博客"
        >
          <BookOpen size={16} />
        </a>
      )}
      {github && (
        <a
          href={github}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-md p-2 text-muted transition-colors hover:bg-accent/10 hover:text-accent"
          title="GitHub"
        >
          <Github size={16} />
        </a>
      )}
      {link && (
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-md p-2 text-muted transition-colors hover:bg-accent/10 hover:text-accent"
          title="访问项目"
        >
          <ExternalLink size={16} />
        </a>
      )}
    </div>
  );
}
