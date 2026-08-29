"use client";

import { useState } from "react";
import { PartImage } from "@/app/_components/badges";
import type { Part } from "@/app/_lib/types";

export function ProductGallery({ part, images }: { part: Part; images: string[] }) {
  const [active, setActive] = useState(0);
  const current = images[active] ?? images[0];

  return (
    <div className="pdp-gallery" style={{ position: "static" }}>
      <div className="pdp-img">
        <PartImage part={part} src={current} />
      </div>
      {images.length > 1 && (
        <div className="pdp-thumbs">
          {images.map((src, i) => (
            <button
              type="button"
              key={src}
              className={"pdp-thumb" + (i === active ? " is-active" : "")}
              onClick={() => setActive(i)}
              aria-label={`Show photo ${i + 1} of ${images.length}`}
              aria-pressed={i === active}
            >
              <PartImage part={part} src={src} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
