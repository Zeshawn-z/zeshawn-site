"use client";

import { useEffect } from "react";

let renderCounter = 0;

function getTheme() {
  return document.documentElement.classList.contains("dark") ? "dark" : "base";
}

function renderError(element: HTMLElement, source: string) {
  element.classList.add("mermaid-chart-error");
  element.textContent = "";

  const pre = document.createElement("pre");
  const code = document.createElement("code");
  code.textContent = source;
  pre.appendChild(code);
  element.appendChild(pre);
}

export default function MermaidRenderer() {
  useEffect(() => {
    let active = true;

    const renderCharts = async () => {
      const elements = Array.from(
        document.querySelectorAll<HTMLElement>(".markdown-body .mermaid-chart"),
      );

      if (elements.length === 0) return;

      const mermaid = (await import("mermaid")).default;
      if (!active) return;

      mermaid.initialize({
        startOnLoad: false,
        securityLevel: "strict",
        theme: getTheme(),
      });

      await Promise.all(
        elements.map(async (element) => {
          const source = element.dataset.mermaidSource ?? element.textContent ?? "";
          element.dataset.mermaidSource = source;
          element.classList.remove("mermaid-chart-error");

          try {
            const id = `mermaid-${Date.now()}-${renderCounter++}`;
            const { svg } = await mermaid.render(id, source);
            if (active) element.innerHTML = svg;
          } catch {
            renderError(element, source);
          }
        }),
      );
    };

    void renderCharts();

    const observer = new MutationObserver(() => {
      void renderCharts();
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      active = false;
      observer.disconnect();
    };
  }, []);

  return null;
}
