import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "留言",
};

export default function GuestbookLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
