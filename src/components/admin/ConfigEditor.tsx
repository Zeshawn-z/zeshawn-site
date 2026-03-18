"use client";

import { FieldInput, FieldTextarea } from "./FormFields";

export default function ConfigEditor({ config, onChange }: { config: Record<string, string>; onChange: (c: Record<string, string>) => void }) {
  const update = (key: string, value: string) => {
    onChange({ ...config, [key]: value });
  };

  const sections = [
    {
      title: "站点信息",
      fields: [
        { key: "site.name", label: "站点名称" },
        { key: "site.description", label: "站点描述" },
        { key: "site.url", label: "站点 URL" },
      ],
    },
    {
      title: "个人信息",
      fields: [
        { key: "author.name", label: "姓名" },
        { key: "author.bio", label: "个人简介", multiline: true },
        { key: "author.location", label: "所在地" },
        { key: "author.email", label: "邮箱" },
      ],
    },
    {
      title: "Hero 区域",
      fields: [
        { key: "hero.greeting", label: "问候语" },
        { key: "hero.name", label: "显示名称" },
        { key: "hero.tagline", label: "标语（用 / 分隔多个角色）" },
        { key: "hero.description", label: "描述", multiline: true },
      ],
    },
    {
      title: "关于页面",
      hint: "支持模板变量：{{name}}、{{email}}、{{location}}、{{bio}}，渲染时自动替换为对应个人信息",
      fields: [
        { key: "about.intro", label: "自我介绍（换行分段，支持 {{name}} 等变量）", multiline: true },
      ],
    },
    {
      title: "社交链接",
      fields: [
        { key: "social.github", label: "GitHub" },
        { key: "social.twitter", label: "Twitter" },
        { key: "social.email", label: "Email (mailto:...)" },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {sections.map((section) => (
        <div key={section.title} className="rounded-lg border border-border bg-card p-5">
          <h3 className="mb-1 text-sm font-semibold">{section.title}</h3>
          {section.hint && (
            <p className="mb-4 text-xs text-muted">{section.hint}</p>
          )}
          {!section.hint && <div className="mb-3" />}
          <div className="space-y-3">
            {section.fields.map((field) =>
              field.multiline ? (
                <FieldTextarea
                  key={field.key}
                  label={field.label}
                  value={config[field.key] || ""}
                  onChange={(v) => update(field.key, v)}
                />
              ) : (
                <FieldInput
                  key={field.key}
                  label={field.label}
                  value={config[field.key] || ""}
                  onChange={(v) => update(field.key, v)}
                />
              )
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
