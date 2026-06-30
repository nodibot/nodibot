"use client";

import { useEffect, useRef, useState } from "react";

const MOBILE_CATALOG_MQ = "(max-width: 900px)";

export function useMobileCatalogLayout(): boolean {
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(MOBILE_CATALOG_MQ);
    const sync = () => setMobile(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  return mobile;
}

export function CatalogScrollReveal({
  children,
  index,
  enabled,
}: {
  children: React.ReactNode;
  index: number;
  enabled: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);
  const visible = !enabled || revealed;

  useEffect(() => {
    if (!enabled) return;

    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true);
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -6% 0px", threshold: 0.08 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [enabled]);

  const delay = enabled && visible ? `${Math.min(index, 10) * 70}ms` : undefined;

  return (
    <div
      ref={ref}
      className={"catalog-reveal" + (visible ? " is-visible" : "")}
      style={{ transitionDelay: delay }}
    >
      {children}
    </div>
  );
}
