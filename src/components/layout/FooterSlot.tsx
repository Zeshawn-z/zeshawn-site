"use client";

import { usePathname } from "next/navigation";
import Footer from "@/components/layout/Footer";

export default function FooterSlot() {
  const pathname = usePathname();
  const isNotesRoute = pathname === "/notes" || pathname.startsWith("/notes/");

  if (!isNotesRoute) {
    return <Footer />;
  }

  return null;
}
