import { getLocale } from "next-intl/server";
import { permanentRedirect } from "next/navigation";
import { withLocale } from "@/app/_lib/locale-path";

export default async function LandingV2Redirect() {
  const locale = await getLocale();
  permanentRedirect(withLocale(locale, "/"));
}
