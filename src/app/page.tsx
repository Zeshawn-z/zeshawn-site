import Link from "next/link";
import {
  ArrowRight,
  ExternalLink,
  Github,
  Code2,
  BookOpen,
  Calendar,
  Clock,
} from "lucide-react";
import { siteConfig } from "@/lib/site-config";
import { getProjects } from "@/lib/data";
import { getAllPosts } from "@/lib/blog";
import HeroParticles from "@/components/HeroParticles";
import TypeWriter from "@/components/TypeWriter";
import ScrollReveal from "@/components/ScrollReveal";
import GlowCard from "@/components/GlowCard";
import MagneticButton from "@/components/MagneticButton";
import SpotlightSection from "@/components/SpotlightSection";

export default function Home() {
  const projects = getProjects();
  const featuredProjects = projects.filter((p) => p.featured).slice(0, 3);
  const recentPosts = getAllPosts().slice(0, 3);
  const { hero, social } = siteConfig;

  const roles = hero.tagline.split(" / ");

  return (
    <div className="mx-auto max-w-5xl px-6 lg:px-8">
      {/* ── Hero Section ── */}
      <section className="relative -mx-6 lg:-mx-8 overflow-hidden px-6 lg:px-8 pb-16 pt-24 sm:pt-32">
        <div className="pointer-events-none absolute inset-0">
          <HeroParticles />
        </div>
        <div className="relative z-10">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-4 py-1.5 text-sm text-muted backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
            </span>
            Available for work
          </div>

          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            {hero.greeting}{" "}
            <span className="bg-gradient-to-r from-accent to-blue-400 bg-clip-text text-transparent">
              {hero.name}
            </span>
          </h1>

          <div className="mt-4 h-9 text-xl font-medium text-muted sm:text-2xl">
            <TypeWriter words={roles} />
          </div>

          <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
            {hero.description}
          </p>

          {/* CTA buttons with magnetic effect */}
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <MagneticButton>
              <Link
                href="/about"
                className="group inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-2.5 text-sm font-medium text-background transition-all hover:shadow-lg hover:shadow-accent/20"
              >
                了解更多
                <ArrowRight
                  size={16}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </Link>
            </MagneticButton>
            <MagneticButton>
              <Link
                href="/blog"
                className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-2.5 text-sm font-medium transition-all hover:border-accent/50 hover:bg-card"
              >
                <BookOpen size={15} />
                阅读博客
              </Link>
            </MagneticButton>
            {social.github && (
              <MagneticButton>
                <a
                  href={social.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-2.5 text-sm font-medium transition-all hover:border-accent/50 hover:bg-card"
                >
                  <Github size={15} />
                  GitHub
                </a>
              </MagneticButton>
            )}
          </div>
        </div>
      </section>

      {/* ── Featured Projects ── */}
      <SpotlightSection>
        <ScrollReveal>
          <section className="border-t border-border py-12">
            <div className="mb-8 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code2 size={18} className="text-accent" />
                <h2 className="text-xl font-semibold tracking-tight">
                  精选项目
                </h2>
              </div>
              <Link
                href="/projects"
                className="group inline-flex items-center gap-1 text-sm text-muted transition-colors hover:text-foreground"
              >
                查看全部{" "}
                <ArrowRight
                  size={14}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </Link>
            </div>

            <div className="grid gap-4">
              {featuredProjects.map((project, i) => (
                <ScrollReveal key={project.id} delay={i * 100}>
                  <GlowCard>
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-medium">{project.title}</h3>
                          <p className="mt-1.5 text-sm leading-relaxed text-muted">
                            {project.description}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {project.tags.map((tag) => (
                              <span
                                key={tag}
                                className="rounded-full bg-accent/10 px-2.5 py-0.5 text-xs text-accent"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          {project.github && (
                            <a
                              href={project.github}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rounded-md p-1.5 text-muted transition-colors hover:text-accent"
                              aria-label="GitHub"
                            >
                              <Github size={16} />
                            </a>
                          )}
                          {project.link && (
                            <a
                              href={project.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rounded-md p-1.5 text-muted transition-colors hover:text-accent"
                              aria-label="External link"
                            >
                              <ExternalLink size={16} />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </GlowCard>
                </ScrollReveal>
              ))}
            </div>
          </section>
        </ScrollReveal>
      </SpotlightSection>

      {/* ── Recent Posts ── */}
      <SpotlightSection>
        <ScrollReveal>
          <section className="border-t border-border py-12">
            <div className="mb-8 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen size={18} className="text-accent" />
                <h2 className="text-xl font-semibold tracking-tight">
                  最新博客
                </h2>
              </div>
              <Link
                href="/blog"
                className="group inline-flex items-center gap-1 text-sm text-muted transition-colors hover:text-foreground"
              >
                查看全部{" "}
                <ArrowRight
                  size={14}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </Link>
            </div>

            {recentPosts.length > 0 ? (
              <div className="grid gap-4">
                {recentPosts.map((post, i) => (
                  <ScrollReveal key={post.slug} delay={i * 100}>
                    <GlowCard>
                      <Link
                        href={`/blog/${post.slug}`}
                        className="block p-5"
                      >
                        <h3 className="font-medium">
                          {post.title}
                        </h3>
                        <p className="mt-1.5 text-sm leading-relaxed text-muted">
                          {post.description}
                        </p>
                        <div className="mt-3 flex flex-wrap items-center gap-3">
                          <span className="inline-flex items-center gap-1 text-xs text-muted">
                            <Calendar size={12} />
                            {post.date}
                          </span>
                          <span className="inline-flex items-center gap-1 text-xs text-muted">
                            <Clock size={12} />
                            {post.readingTime} 阅读
                          </span>
                          {post.tags.map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full bg-accent/10 px-2.5 py-0.5 text-xs text-accent"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </Link>
                    </GlowCard>
                  </ScrollReveal>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-border p-8 text-center">
                <BookOpen size={24} className="mx-auto mb-3 text-muted" />
                <p className="text-sm text-muted">
                  暂无博客文章。在{" "}
                  <code className="rounded bg-card px-1.5 py-0.5 text-xs font-mono">
                    content/blog/
                  </code>{" "}
                  目录下创建{" "}
                  <code className="rounded bg-card px-1.5 py-0.5 text-xs font-mono">
                    .md
                  </code>{" "}
                  或{" "}
                  <code className="rounded bg-card px-1.5 py-0.5 text-xs font-mono">
                    .mdx
                  </code>{" "}
                  文件即可发布。
                </p>
              </div>
            )}
          </section>
        </ScrollReveal>
      </SpotlightSection>
    </div>
  );
}
