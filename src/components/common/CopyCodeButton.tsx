"use client";

import { useEffect } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Copy, Check } from "lucide-react";

const copyIconHtml = renderToStaticMarkup(<Copy size={16} />);
const checkIconHtml = renderToStaticMarkup(<Check size={16} />);

/**
 * 给 .markdown-body 内的所有 <pre> 代码块自动添加复制按钮。
 */
export default function CopyCodeButton() {
  useEffect(() => {
    const wrapper = document.querySelector(".markdown-body");
    if (!wrapper) return;

    const pres = wrapper.querySelectorAll("pre");
    const buttons: HTMLButtonElement[] = [];

    pres.forEach((pre) => {
      if (pre.querySelector(".copy-btn")) return;
      pre.style.position = "relative";

      const btn = document.createElement("button");
      btn.className = "copy-btn";
      btn.setAttribute("aria-label", "复制代码");
      btn.innerHTML = copyIconHtml;

      btn.addEventListener("click", async () => {
        const code = pre.querySelector("code");
        const text = code ? code.textContent || "" : pre.textContent || "";
        try {
          await navigator.clipboard.writeText(text);
          btn.innerHTML = checkIconHtml;
          btn.classList.add("copied");
          setTimeout(() => {
            btn.innerHTML = copyIconHtml;
            btn.classList.remove("copied");
          }, 2000);
        } catch {
          const range = document.createRange();
          range.selectNodeContents(code || pre);
          const sel = window.getSelection();
          sel?.removeAllRanges();
          sel?.addRange(range);
        }
      });

      pre.appendChild(btn);
      buttons.push(btn);
    });

    return () => {
      buttons.forEach((btn) => btn.remove());
    };
  }, []);

  return null;
}
