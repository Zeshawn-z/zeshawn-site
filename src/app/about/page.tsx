import type { Metadata } from "next";
import Link from "next/link";
import { Mail, User, Briefcase, Wrench, MapPin, BookOpen } from "lucide-react";
import { getDynamicSiteConfig } from "@/lib/config/site-config-dynamic";
import { getExperiences, getSkills } from "@/lib/db/data";
import ScrollReveal from "@/components/common/ScrollReveal";
import SpotlightSection from "@/components/common/SpotlightSection";
import GlowTag from "@/components/common/GlowTag";

export const metadata: Metadata = {
  title: "关于",
  description: "关于我的介绍和经历",
};

export const dynamic = "force-dynamic";
export const revalidate = 60; // 每 60 秒重新验证一次，避免每次请求都重新渲染

export default function AboutPage() {
  const { author, about } = getDynamicSiteConfig();
  const experiences = getExperiences();
  const skills = getSkills();

  // 模板变量映射
  const vars: Record<string, string> = {
    name: author.name,
    email: author.email,
    location: author.location,
    bio: author.bio,
  };

  // 自我介绍：从配置读取，支持 {{name}} 等模板变量 + 换行分段
  const defaultIntro = `你好！我是 {{name}}，欢迎来到我的个人网站。`;
  const introText = (about.intro || defaultIntro).replace(
    /\{\{(\w+)\}\}/g,
    (_, key) => vars[key] ?? `{{${key}}}`
  );
  const introParagraphs = introText.split("\n").filter((p: string) => p.trim());

  return (
    <div className="mx-auto max-w-5xl px-6 lg:px-8">
      {/* Intro */}
      <section className="pb-12 pt-16">
        <div className="flex items-center gap-3">
          <User size={24} className="text-accent" />
          <h1 className="text-3xl font-bold tracking-tight">关于我</h1>
        </div>
        <div className="mt-6 space-y-4 leading-relaxed text-muted">
          {introParagraphs.map((paragraph: string, i: number) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>
        {author.location && (
          <div className="mt-4 inline-flex items-center gap-1.5 text-sm text-muted">
            <MapPin size={14} />
            {author.location}
          </div>
        )}
      </section>

      {/* Skills */}
      <SpotlightSection>
        <ScrollReveal>
          <section className="border-t border-border py-12">
            <div className="flex items-center gap-2">
              <Wrench size={18} className="text-accent" />
              <h2 className="text-xl font-semibold tracking-tight">技术栈</h2>
            </div>
            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              {skills.map((group) => (
                <div key={group.id}>
                  <h3 className="mb-3 text-sm font-medium text-muted">
                    {group.name}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {group.skills.map((skill) => (
                      <GlowTag key={skill}>{skill}</GlowTag>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </ScrollReveal>
      </SpotlightSection>

      {/* Experience */}
      <ScrollReveal>
        <section className="border-t border-border py-12">
          <div className="flex items-center gap-2">
            <Briefcase size={18} className="text-accent" />
            <h2 className="text-xl font-semibold tracking-tight">经历</h2>
          </div>
          <div className="mt-6">
            <div className="relative space-y-8 border-l-2 border-border pl-6">
              {experiences.map((exp, index) => (
                <ScrollReveal key={exp.id} delay={index * 100}>
                  <div className="relative">
                    <div className="absolute -left-[31px] top-1 h-3 w-3 rounded-full border-2 border-accent bg-background" />
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{exp.title}</h3>
                        {exp.blogSlug && (
                          <Link
                            href={`/blog/${exp.blogSlug}`}
                            className="inline-flex items-center gap-0.5 rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-500/20 dark:text-blue-400"
                          >
                            <BookOpen size={10} />
                            博客
                          </Link>
                        )}
                      </div>
                      <span className="text-sm text-muted">{exp.period}</span>
                    </div>
                    <p className="mt-0.5 text-sm font-medium text-accent">
                      {exp.company}
                    </p>
                    <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted">
                      {exp.description}
                    </p>
                    {exp.tags && exp.tags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {exp.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-accent/10 px-2.5 py-0.5 text-xs text-accent"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* Contact */}
      <ScrollReveal>
        <section className="border-t border-border py-12">
          <div className="flex items-center gap-2">
            <Mail size={18} className="text-accent" />
            <h2 className="text-xl font-semibold tracking-tight">联系我</h2>
          </div>
          <p className="mt-4 text-muted">
            如果你对我的项目感兴趣，或者想要交流技术，欢迎通过以下方式联系我。
          </p>
          <a
            href={`mailto:${author.email}`}
            className="mt-4 inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-medium transition-all hover:border-accent/50 hover:bg-card"
          >
            <Mail size={16} />
            {author.email}
          </a>
        </section>
      </ScrollReveal>
    </div>
  );
}
