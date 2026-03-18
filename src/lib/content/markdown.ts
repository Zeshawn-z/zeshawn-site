import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkRehype from "remark-rehype";
import rehypeKatex from "rehype-katex";
import rehypeStringify from "rehype-stringify";
import rehypeShiki from "@shikijs/rehype";

/**
 * 将 Markdown 内容渲染为 HTML 字符串。
 *
 * 支持：
 * - GFM：表格、任务列表、删除线、自动链接
 * - 数学公式：KaTeX（$..$ 行内 / $$...$$ 块级）
 * - 代码语法高亮：Shiki（VS Code 同款引擎，亮暗双主题）
 *
 * 管线顺序：
 * remarkParse → remarkGfm → remarkMath → remarkRehype → rehypeKatex → rehypeShiki → rehypeStringify
 *
 * 注意：
 * - rehypeKatex 必须在 rehypeShiki 之前，否则公式节点会被代码高亮破坏
 * - 不使用 rehypeRaw，避免破坏 KaTeX 生成的 HTML 节点导致公式渲染两次
 * - remarkMath 不会处理代码块（```）和行内代码（`）内的 $ 符号
 * - Shiki 不会碰非代码块内容，所以 != 等符号不会被转义
 */
export async function renderMarkdown(content: string): Promise<string> {
  const result = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMath)
    .use(remarkRehype)
    .use(rehypeKatex)
    .use(rehypeShiki, {
      themes: {
        light: "github-light",
        dark: "github-dark",
      },
      defaultColor: false,       // 输出双主题 CSS 变量，由 CSS 控制切换
    })
    .use(rehypeStringify)
    .process(content);

  return result.toString();
}
