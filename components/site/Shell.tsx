"use client";

import { usePathname } from "next/navigation";
import { Footer } from "./Footer";

export function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const viewer = /^\/ielts\/[^/]+/.test(path);
  return (
    <>
      {children}
      {viewer ? null : <Footer />}
    </>
  );
}
