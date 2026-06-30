"use client";

import { useServerInsertedHTML } from "next/navigation";

// Runs before paint to apply the saved theme without a flash.
const themeBootstrap = `(function(){try{var t=localStorage.getItem("nodibot-theme");if(t==="dark"||t==="light"){document.documentElement.setAttribute("data-theme",t);}}catch(e){}})();`;

export function ThemeBootstrap() {
  useServerInsertedHTML(() => (
    <script id="theme-bootstrap" dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
  ));

  return null;
}
