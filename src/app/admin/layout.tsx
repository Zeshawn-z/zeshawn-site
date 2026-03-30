import type { Metadata } from "next";

export function generateMetadata(): Metadata {
  return {
    title: `管理后台`,
    robots: "noindex, nofollow",
  };
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
