import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { getClientSiteConfig, getDynamicSiteConfig } from "@/lib/config/site-config-dynamic";
import SiteConfigProvider from "@/components/layout/SiteConfigProvider";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  const cfg = getDynamicSiteConfig();
  const description = cfg.description || `${cfg.name} 的个人网站 - 项目、博客与技术分享`;
  const siteUrl = cfg.url || "";

  const getLogoUrlByChoice = (choice: "light" | "dark" | "default") => {
    if (!cfg.branding.enabled || choice === "default") return "";
    return choice === "light" ? cfg.branding.logoLightUrl : cfg.branding.logoDarkUrl;
  };

  const metaLogoUrl = getLogoUrlByChoice(cfg.branding.metaLogoChoice);

  const metadata: Metadata = {
    title: {
      default: cfg.name,
      template: `%s | ${cfg.name}`,
    },
    description,
    metadataBase: siteUrl ? new URL(siteUrl) : undefined,
    openGraph: {
      type: "website",
      locale: "zh_CN",
      siteName: cfg.name,
      title: cfg.name,
      description,
      ...(siteUrl && { url: siteUrl }),
    },
    twitter: {
      card: "summary",
      title: cfg.name,
      description,
    },
    alternates: siteUrl ? { canonical: siteUrl } : undefined,
  };

  if (metaLogoUrl) {
    metadata.icons = {
      icon: [{ url: metaLogoUrl }],
      shortcut: [{ url: metaLogoUrl }],
      apple: [{ url: metaLogoUrl }],
    };
  }

  return metadata;
}

// Inline script to prevent FOUC (flash of unstyled content) on theme load
const themeScript = `
(function(){
  try {
    var t = localStorage.getItem('theme');
    if (t === 'dark') document.documentElement.classList.add('dark');
    else if (t === 'light') document.documentElement.classList.remove('dark');
    else if (window.matchMedia('(prefers-color-scheme: dark)').matches) document.documentElement.classList.add('dark');
  } catch(e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const clientConfig = getClientSiteConfig();

  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SiteConfigProvider value={clientConfig}>
          <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </SiteConfigProvider>
      </body>
    </html>
  );
}
