"use client";

import { useState, useEffect, useCallback } from "react";
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

export default function MdEditor({ value, onChange, height = 600, placeholder }: MdEditorProps) {
  const [colorMode, setColorMode] = useState<"light" | "dark">("light");

  // 监听暗色模式变化，同步 data-color-mode
  useEffect(() => {
    const update = () => {
      const isDark = document.documentElement.classList.contains("dark");
      setColorMode(isDark ? "dark" : "light");
    };
    update();

    // 监听 class 变化（ThemeToggle 通过 classList 切换）
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  const handleChange = useCallback(
    (val?: string) => {
      onChange(val || "");
    },
    [onChange]
  );

  return (
    <div data-color-mode={colorMode}>
      <MDEditor
        value={value}
        onChange={handleChange}
        height={height}
        preview="live"
        visibleDragbar
        textareaProps={{ placeholder: placeholder || "在这里写你的文章内容，支持 Markdown 语法..." }}
        previewOptions={{
          // 与页面渲染管线保持一致：remark-math + remark-gfm → rehype-katex
          remarkPlugins: [remarkMath, remarkGfm],
          rehypePlugins: [rehypeKatex],
        }}
      />
    </div>
  );
}
