import { defineRouting } from "next-intl/routing";

// Korean copy stays in messages/ko.json. "ko" is omitted here so those pages
// are not routed. Add it back to re-enable /ko.
export const routing = defineRouting({
  locales: ["en"],
  defaultLocale: "en",
  localePrefix: "always",
});

export type Locale = (typeof routing.locales)[number];
