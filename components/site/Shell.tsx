"use client";

import { usePathname } from "next/navigation";
import { Footer } from "./Footer";

export function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const clean = path.replace(/\/$/, "") || "/";
  const viewer = /^\/ielts\/[^/]+$/.test(clean) || ["/listening", "/reading", "/writing", "/translation"].includes(clean);
  return (
    <>
      {children}
      {viewer ? null : <Footer />}
    </>
  );
}
