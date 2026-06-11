import type { Metadata } from "next";
import { Hanken_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const hanken = Hanken_Grotesk({
  variable: "--font-hanken",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: {
    default: "nodibot — Industrial automation parts, sourced on demand",
    template: "%s | nodibot",
  },
  description:
    "Verified secondary-market controllers, drives, teach pendants and reducers for discontinued FANUC, ABB, KUKA, Yaskawa & Siemens automation. Drop a part number — we locate, test, and quote.",
};

// Applies the persisted theme before paint to avoid a flash of the wrong theme.
const themeBootstrap = `
(function(){try{var t=localStorage.getItem("nodibot-theme");if(t==="dark"||t==="light"){document.documentElement.setAttribute("data-theme",t);}}catch(e){}})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-theme="light"
      className={`${hanken.variable} ${jetbrains.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
