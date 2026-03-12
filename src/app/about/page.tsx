import type { Metadata } from "next";
import { Mail, User, Briefcase, Wrench, MapPin } from "lucide-react";
import { siteConfig } from "@/lib/site-config";
import { getExperiences, getSkills } from "@/lib/data";
import ScrollReveal from "@/components/ScrollReveal";

export const metadata: Metadata = {
  title: "关于",
  description: "关于我的介绍和经历",
};

export const dynamic = "force-dynamic";

export default function AboutPage() {
  const { author } = siteConfig;
  const experiences = getExperiences();
  const skills = getSkills();

  return (
    <div className="mx-auto max-w-5xl px-6 lg:px-8">
      {/* Intro */}
      <section className="pb-12 pt-16">
        <div className="flex items-center gap-3">
          <User size={24} className="text-accent" />
          <h1 className="text-3xl font-bold tracking-tight">关于我</h1>
        </div>
        <div className="mt-6 space-y-4 leading-relaxed text-muted">
          <p>
            你好！我是 {author.name}，一名热爱技术的全栈开发者。我热衷于用代码解决实际问题，
            构建优雅、高效的数字产品。
          </p>
          <p>
            我对前端技术有着深入的理解，尤其擅长 React 生态和现代 Web 开发。
            同时，我也对后端开发、系统设计和开源社区充满热情。
          </p>
          <p>
            工作之余，我喜欢通过写博客和技术文章来记录和分享学习心得。
            我相信知识共享能让整个社区变得更好。
          </p>
        </div>
        {author.location && (
          <div className="mt-4 inline-flex items-center gap-1.5 text-sm text-muted">
            <MapPin size={14} />
            {author.location}
          </div>
        )}
      </section>

      {/* Skills */}
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
                    <span
                      key={skill}
                      className="rounded-full border border-border px-3 py-1 text-sm transition-colors hover:border-accent/50 hover:text-accent"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </ScrollReveal>

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
                      <h3 className="font-medium">{exp.title}</h3>
                      <span className="text-sm text-muted">{exp.period}</span>
                    </div>
                    <p className="mt-0.5 text-sm font-medium text-accent">
                      {exp.company}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-muted">
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
