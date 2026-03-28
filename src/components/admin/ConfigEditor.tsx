"use client";

import { useState } from "react";
import { ImageIcon, Loader2, Trash2, Upload } from "lucide-react";
import { FieldInput, FieldTextarea } from "./FormFields";

type LogoVariant = "light" | "dark";
type LogoChoice = "light" | "dark" | "default";

function normalizeLogoChoice(value: string | undefined, fallback: LogoChoice): LogoChoice {
  if (value === "light" || value === "dark" || value === "default") {
    return value;
  }
  return fallback;
}

const LOGO_FIELDS: Array<{
  key: string;
  label: string;
  variant: LogoVariant;
  hint: string;
}> = [
  {
    key: "branding.logoLightUrl",
    label: "Light Logo",
    variant: "light",
    hint: "用于亮色主题 Header",
  },
  {
    key: "branding.logoDarkUrl",
    label: "Dark Logo",
    variant: "dark",
    hint: "用于暗色主题 Header",
  },
];

export default function ConfigEditor({ config, onChange }: { config: Record<string, string>; onChange: (c: Record<string, string>) => void }) {
  const [uploadingVariant, setUploadingVariant] = useState<LogoVariant | null>(null);

  const update = (key: string, value: string) => {
    onChange({ ...config, [key]: value });
  };

  const toggleSwitch = (key: string) => {
    const current = config[key] !== "false";
    update(key, current ? "false" : "true");
  };

  const uploadLogo = async (key: string, variant: LogoVariant, file: File) => {
    setUploadingVariant(variant);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/images", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "上传失败");
      }

      const nextConfig = { ...config, [key]: data.url || "" };
      if (!nextConfig["branding.enabled"]) {
        nextConfig["branding.enabled"] = "true";
      }
      if (!nextConfig["branding.lightThemeLogoChoice"]) {
        nextConfig["branding.lightThemeLogoChoice"] = "light";
      }
      if (!nextConfig["branding.darkThemeLogoChoice"]) {
        nextConfig["branding.darkThemeLogoChoice"] = "dark";
      }
      if (!nextConfig["branding.metaLogoChoice"]) {
        const legacy = nextConfig["branding.metaLogoVariant"];
        nextConfig["branding.metaLogoChoice"] =
          legacy === "light" || legacy === "dark" ? legacy : "default";
      }
      onChange(nextConfig);
    } catch (error) {
      const message = error instanceof Error ? error.message : "上传失败";
      alert(`Logo 上传失败: ${message}`);
    } finally {
      setUploadingVariant(null);
    }
  };

  const openLogoPicker = (key: string, variant: LogoVariant) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/jpeg,image/png,image/gif,image/webp,image/svg+xml";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (file) {
        await uploadLogo(key, variant, file);
      }
    };
    input.click();
  };

  const clearLogo = (key: string) => {
    update(key, "");
  };

  const brandingEnabled = config["branding.enabled"] !== "false";
  const logoLightUrl = config["branding.logoLightUrl"] || "";
  const logoDarkUrl = config["branding.logoDarkUrl"] || "";

  const lightThemeChoice = normalizeLogoChoice(config["branding.lightThemeLogoChoice"], "light");
  const darkThemeChoice = normalizeLogoChoice(config["branding.darkThemeLogoChoice"], "dark");
  const metaChoice = normalizeLogoChoice(
    config["branding.metaLogoChoice"] || config["branding.metaLogoVariant"],
    "default"
  );

  const getLogoUrlByChoice = (choice: LogoChoice) => {
    if (choice === "light") return logoLightUrl;
    if (choice === "dark") return logoDarkUrl;
    return "";
  };

  const lightThemeSelectedUrl = brandingEnabled ? getLogoUrlByChoice(lightThemeChoice) : "";
  const darkThemeSelectedUrl = brandingEnabled ? getLogoUrlByChoice(darkThemeChoice) : "";
  const metaSelectedUrl = brandingEnabled ? getLogoUrlByChoice(metaChoice) : "";

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
      {/* Logo 配置 */}
      <div className="rounded-lg border border-border bg-card p-5">
        <h3 className="mb-1 text-sm font-semibold">Logo 配置</h3>
        <p className="mb-4 text-xs text-muted">
          支持上传 light / dark 两版 logo，并分别指定亮主题、暗主题与 meta 图标使用哪一版（或使用默认图标）。
        </p>

        <div className="mb-4 flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2.5">
          <div>
            <p className="text-sm font-medium">Logo 总开关</p>
            <p className="text-xs text-muted">关闭后即使已上传，也不会启用自定义 logo</p>
          </div>
          <button
            onClick={() => toggleSwitch("branding.enabled")}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
              brandingEnabled ? "bg-accent" : "bg-muted/30"
            }`}
            role="switch"
            aria-checked={brandingEnabled}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                brandingEnabled ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {LOGO_FIELDS.map((item) => {
            const logoUrl = config[item.key] || "";
            const isUploading = uploadingVariant === item.variant;
            return (
              <div key={item.key} className="rounded-lg border border-border bg-background p-3">
                <div className="mb-2">
                  <p className="text-xs font-semibold">{item.label}</p>
                  <p className="text-xs text-muted">{item.hint}</p>
                </div>

                <div className="mb-3 overflow-hidden rounded-md border border-border">
                  <div className="flex aspect-square items-center justify-center bg-card">
                    {logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={logoUrl}
                        alt={item.label}
                        className="max-h-full max-w-full object-contain p-2"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-1 text-muted">
                        <ImageIcon size={18} />
                        <span className="text-xs">未上传</span>
                      </div>
                    )}
                  </div>
                </div>

                {logoUrl && (
                  <p className="mb-3 break-all text-[11px] text-muted">{logoUrl}</p>
                )}

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openLogoPicker(item.key, item.variant)}
                    disabled={uploadingVariant !== null}
                    className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs text-muted transition-colors hover:text-foreground disabled:opacity-50"
                  >
                    {isUploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                    {logoUrl ? "替换" : "上传"}
                  </button>

                  {logoUrl && (
                    <button
                      onClick={() => clearLogo(item.key)}
                      className="inline-flex items-center gap-1.5 rounded-md border border-red-500/30 px-2.5 py-1.5 text-xs text-red-500 transition-colors hover:bg-red-500/10"
                    >
                      <Trash2 size={12} />
                      清空
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">亮主题显示</label>
            <select
              value={lightThemeChoice}
              onChange={(e) => update("branding.lightThemeLogoChoice", normalizeLogoChoice(e.target.value, "light"))}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-accent"
            >
              <option value="light">亮色 Logo</option>
              <option value="dark">暗色 Logo</option>
              <option value="default">默认（Terminal）</option>
            </select>
            <div className="mt-2 rounded-md border border-border bg-background px-3 py-2">
              <p className="text-xs font-medium text-muted">当前来源</p>
              {lightThemeSelectedUrl ? (
                <p className="mt-1 break-all text-xs">{lightThemeSelectedUrl}</p>
              ) : (
                <p className="mt-1 text-xs text-muted">
                  {!brandingEnabled
                    ? "总开关已关闭，将使用默认 Terminal 图标"
                    : lightThemeChoice === "default"
                      ? "已选择默认 Terminal 图标"
                      : "所选 Logo 未上传，将回退默认 Terminal 图标"}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted">暗主题显示</label>
            <select
              value={darkThemeChoice}
              onChange={(e) => update("branding.darkThemeLogoChoice", normalizeLogoChoice(e.target.value, "dark"))}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-accent"
            >
              <option value="light">亮色 Logo</option>
              <option value="dark">暗色 Logo</option>
              <option value="default">默认（Terminal）</option>
            </select>
            <div className="mt-2 rounded-md border border-border bg-background px-3 py-2">
              <p className="text-xs font-medium text-muted">当前来源</p>
              {darkThemeSelectedUrl ? (
                <p className="mt-1 break-all text-xs">{darkThemeSelectedUrl}</p>
              ) : (
                <p className="mt-1 text-xs text-muted">
                  {!brandingEnabled
                    ? "总开关已关闭，将使用默认 Terminal 图标"
                    : darkThemeChoice === "default"
                      ? "已选择默认 Terminal 图标"
                      : "所选 Logo 未上传，将回退默认 Terminal 图标"}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Meta 图标显示</label>
            <select
              value={metaChoice}
              onChange={(e) => update("branding.metaLogoChoice", normalizeLogoChoice(e.target.value, "default"))}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-accent"
            >
              <option value="light">亮色 Logo</option>
              <option value="dark">暗色 Logo</option>
              <option value="default">默认 favicon</option>
            </select>
            <div className="mt-2 rounded-md border border-border bg-background px-3 py-2">
              <p className="text-xs font-medium text-muted">当前来源</p>
              {metaSelectedUrl ? (
                <p className="mt-1 break-all text-xs">{metaSelectedUrl}</p>
              ) : (
                <p className="mt-1 text-xs text-muted">
                  {!brandingEnabled
                    ? "总开关已关闭，将使用默认 favicon"
                    : metaChoice === "default"
                      ? "已选择默认 favicon"
                      : "所选 Logo 未上传，将回退默认 favicon"}
                </p>
              )}
            </div>
          </div>
        </div>

        <p className="mt-3 text-xs text-muted">上传后请点击页面侧边栏的“保存全部”生效。</p>
      </div>

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
