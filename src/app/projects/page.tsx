import type { Metadata } from "next";
import { ExternalLink, Github, Code2 } from "lucide-react";
import { getProjects } from "@/lib/db/data";
import ScrollReveal from "@/components/common/ScrollReveal";
import GlowCard from "@/components/common/GlowCard";
import SpotlightSection from "@/components/common/SpotlightSection";

export const metadata: Metadata = {
  title: "项目",
  description: "我参与开发的一些项目",
};

export const dynamic = "force-dynamic";
export const revalidate = 60; // 每 60 秒重新验证一次

export default function ProjectsPage() {
  const projects = getProjects();

  return (
    <div className="mx-auto max-w-5xl px-6 lg:px-8">
      <section className="pb-12 pt-16">
        <div className="flex items-center gap-3">
          <Code2 size={24} className="text-accent" />
          <h1 className="text-3xl font-bold tracking-tight">项目</h1>
        </div>
        <p className="mt-3 text-muted">
          这里是我参与开发或维护的一些项目，涵盖了不同的技术栈和领域。
        </p>
      </section>

      <SpotlightSection>
        <section className="pb-16">
          <div className="grid gap-5">
            {projects.map((project, i) => (
              <ScrollReveal key={project.id} delay={i * 80}>
                <GlowCard>
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h2 className="text-lg font-medium">
                            {project.title}
                          </h2>
                          {project.featured && (
                            <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
                              精选
                            </span>
                          )}
                        </div>
                        <p className="mt-2 text-sm leading-relaxed text-muted">
                          {project.description}
                        </p>
                        <div className="mt-4 flex flex-wrap gap-1.5">
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
                            className="rounded-md p-2 text-muted transition-colors hover:bg-accent/10 hover:text-accent"
                            aria-label="GitHub"
                          >
                            <Github size={18} />
                          </a>
                        )}
                        {project.link && (
                          <a
                            href={project.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-md p-2 text-muted transition-colors hover:bg-accent/10 hover:text-accent"
                            aria-label="External link"
                          >
                            <ExternalLink size={18} />
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
      </SpotlightSection>
    </div>
  );
}
