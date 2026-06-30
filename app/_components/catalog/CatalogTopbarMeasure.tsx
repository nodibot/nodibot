"use client";

import { useEffect } from "react";

export function CatalogTopbarMeasure() {
  useEffect(() => {
    const root = document.querySelector(".app-catalog");
    const topbar = root?.querySelector(".topbar");
    if (!(root instanceof HTMLElement) || !(topbar instanceof HTMLElement)) return;

    const sync = () => {
      const height = Math.ceil(topbar.getBoundingClientRect().height);
      root.style.setProperty("--catalog-topbar-height", `${height}px`);
    };

    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(topbar);
    window.addEventListener("resize", sync);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", sync);
    };
  }, []);

  return null;
}

export function scrollToCatalogResults(behavior: ScrollBehavior = "smooth") {
  const anchor = document.getElementById("catalog-results");
  if (!anchor) return;

  const root = document.querySelector(".app-catalog");
  const offset = root
    ? Number.parseFloat(getComputedStyle(root).getPropertyValue("--catalog-topbar-height")) || 0
    : 0;

  const top = anchor.getBoundingClientRect().top + window.scrollY - offset - 12;
  window.scrollTo({ top: Math.max(0, top), behavior });
}
