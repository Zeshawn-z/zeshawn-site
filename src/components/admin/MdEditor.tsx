"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import remarkMath from "remark-math";
import remarkGfm from "remark-gfm";
import rehypeKatex from "rehype-katex";

// 动态导入编辑器（SSR 不兼容）
const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

interface MdEditorProps {
  value: string;
  onChange: (value: string) => void;
  height?: number;
  placeholder?: string;
}

async function uploadImage(file: File): Promise<{ url: string; filename: string } | null> {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const res = await fetch("/api/images", { method: "POST", body: formData });
    if (!res.ok) {
      const err = await res.json();
      alert(`图片上传失败: ${err.error || "未知错误"}`);
      return null;
    }
    const data = await res.json();
    return { url: data.url, filename: data.filename };
  } catch {
    alert("图片上传失败: 网络错误");
    return null;
  }
}

function insertTextAtCursor(
  textarea: HTMLTextAreaElement,
  text: string,
  onChange: (v: string) => void
) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const before = textarea.value.substring(0, start);
  const after = textarea.value.substring(end);
  const newValue = before + text + after;
  onChange(newValue);

  requestAnimationFrame(() => {
    textarea.selectionStart = textarea.selectionEnd = start + text.length;
    textarea.focus();
  });
}

export default function MdEditor({ value, onChange, height = 600, placeholder }: MdEditorProps) {
  const [colorMode, setColorMode] = useState<"light" | "dark">("light");
  const [uploading, setUploading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 监听暗色模式变化
  useEffect(() => {
    const update = () => {
      const isDark = document.documentElement.classList.contains("dark");
      setColorMode(isDark ? "dark" : "light");
    };
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const handleChange = useCallback(
    (val?: string) => { onChange(val || ""); },
    [onChange]
  );

  // 图片上传并插入 markdown
  const handleImageUpload = useCallback(
    async (file: File) => {
      setUploading(true);
      try {
        const result = await uploadImage(file);
        if (!result) return;
        const markdownImg = `![${result.filename}](${result.url})`;
        const textarea = containerRef.current?.querySelector("textarea");
        if (textarea) {
          insertTextAtCursor(textarea, markdownImg, onChange);
        } else {
          onChange(value + "\n" + markdownImg);
        }
      } finally {
        setUploading(false);
      }
    },
    [onChange, value]
  );

  // 触发文件选择器（供工具栏 image 按钮和粘贴/拖拽共用）
  const triggerFileInput = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/jpeg,image/png,image/gif,image/webp,image/svg+xml";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (file) await handleImageUpload(file);
    };
    input.click();
  }, [handleImageUpload]);

  // 粘贴图片
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) await handleImageUpload(file);
          return;
        }
      }
    };
    container.addEventListener("paste", handlePaste);
    return () => container.removeEventListener("paste", handlePaste);
  }, [handleImageUpload]);

  // 拖拽图片
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const handleDragOver = (e: DragEvent) => { e.preventDefault(); e.stopPropagation(); };
    const handleDrop = async (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const files = e.dataTransfer?.files;
      if (!files) return;
      for (const file of Array.from(files)) {
        if (file.type.startsWith("image/")) await handleImageUpload(file);
      }
    };
    container.addEventListener("dragover", handleDragOver);
    container.addEventListener("drop", handleDrop);
    return () => {
      container.removeEventListener("dragover", handleDragOver);
      container.removeEventListener("drop", handleDrop);
    };
  }, [handleImageUpload]);

  // 用 commandsFilter 接管工具栏的 image 按钮
  const commandsFilter = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (cmd: any) => {
      if (cmd.name === "image") {
        return {
          ...cmd,
          buttonProps: {
            "aria-label": "上传图片",
            title: "上传图片（支持粘贴/拖拽）",
          },
          execute: () => {
            triggerFileInput();
          },
        };
      }
      return cmd;
    },
    [triggerFileInput]
  );

  return (
    <div ref={containerRef} data-color-mode={colorMode} className="relative">
      {uploading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center rounded-lg bg-background/80 backdrop-blur-sm">
          <div className="flex items-center gap-2 rounded-lg bg-card px-4 py-2 text-sm shadow-lg border border-border">
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
              <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" className="opacity-75" />
            </svg>
            图片上传中...
          </div>
        </div>
      )}
      <MDEditor
        value={value}
        onChange={handleChange}
        height={height}
        preview="live"
        visibleDragbar
        commandsFilter={commandsFilter}
        textareaProps={{ placeholder: placeholder || "在这里写你的文章内容，支持 Markdown 语法..." }}
        previewOptions={{
          remarkPlugins: [remarkMath, remarkGfm],
          rehypePlugins: [rehypeKatex],
        }}
      />
      <p className="mt-1.5 text-xs text-muted">
        💡 点击工具栏 🖼 按钮上传图片，也支持直接粘贴或拖拽图片（最大 5MB）
      </p>
    </div>
  );
}
