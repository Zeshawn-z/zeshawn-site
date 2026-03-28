"use client";

import { FieldInput, FieldTextarea } from "./FormFields";

export default function ConfigEditor({ config, onChange }: { config: Record<string, string>; onChange: (c: Record<string, string>) => void }) {
  const update = (key: string, value: string) => {
    onChange({ ...config, [key]: value });
  };

  const toggleSwitch = (key: string) => {
    const current = config[key] !== "false";
    update(key, current ? "false" : "true");
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

  // 功能开关
  const switches = [
    { key: "guestbook.enabled", label: "留言板", description: "关闭后留言板仍可访问，但不允许添加新留言" },
    { key: "comments.enabled", label: "全局评论", description: "关闭后所有博客文章的评论功能将被禁用" },
  ];

  return (
    <div className="space-y-6">
      {/* 功能开关 */}
      <div className="rounded-lg border border-border bg-card p-5">
        <h3 className="mb-4 text-sm font-semibold">功能开关</h3>
        <div className="space-y-4">
          {switches.map((sw) => {
            const enabled = config[sw.key] !== "false";
            return (
              <div key={sw.key} className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium">{sw.label}</span>
                  <p className="text-xs text-muted">{sw.description}</p>
                </div>
                <button
                  onClick={() => toggleSwitch(sw.key)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                    enabled ? "bg-accent" : "bg-muted/30"
                  }`}
                  role="switch"
                  aria-checked={enabled}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                      enabled ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </div>
      </div>

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
