"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { ThemeToggle } from "../ui/ThemeToggle";
import { Modal } from "../ui/Modal";

const links = [
  { href: "/speaking", label: "口语" },
  { href: "/writing", label: "写作" },
  { href: "/help", label: "帮助" },
];

export function Header() {
  const path = usePathname();
  const viewer = /^\/ielts\/[^/]+/.test(path);
  const catalog = path === "/" || path === "/ielts";
  const { user, setLoginOpen, logout } = useAuth();
  const [menu, setMenu] = useState(false);

  if (viewer) return null;

  return (
    <header className="site-header">
      <div className="site-header-bar">
        <Link href="/" className="site-logo">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
            <path d="M6 4.5h9.5A2.5 2.5 0 0 1 18 7v12.5H8.5A2.5 2.5 0 0 0 6 22V4.5Z" />
            <path d="M6 4.5A2.5 2.5 0 0 1 8.5 2H18" />
          </svg>
          <span>雅思真题在线</span>
          <span className="site-logo-sub">按试卷排版设计</span>
        </Link>
        <span className="site-badge" title="自研模拟，不是官方题库">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="M9 12l2 2 4-4" />
          </svg>
          自研模拟卷
        </span>
        <div className="site-header-actions">
          {catalog ? null : (
            <nav className="site-nav">
              {links.map((link) => (
                <Link key={link.href} href={link.href}>
                  {link.label}
                </Link>
              ))}
            </nav>
          )}
          {catalog ? null : user ? (
            <button className="btn btn-text hidden sm:inline-flex" onClick={logout}>
              {user.name}
            </button>
          ) : (
            <button className="btn btn-text hidden sm:inline-flex" onClick={() => setLoginOpen(true)}>
              登录
            </button>
          )}
          <ThemeToggle iconOnly />
          <button className="btn btn-ghost px-3 lg:hidden" onClick={() => setMenu(true)} aria-label="打开菜单">
            <Menu size={18} />
          </button>
        </div>
      </div>
      <Modal open={menu} onClose={() => setMenu(false)} title="去哪里">
        <div className="flex flex-col">
          <Link href="/" className="btn btn-text justify-start" onClick={() => setMenu(false)}>
            试卷目录
          </Link>
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="btn btn-text justify-start" onClick={() => setMenu(false)}>
              {link.label}
            </Link>
          ))}
          {user ? (
            <button
              className="btn btn-ghost mt-3"
              onClick={() => {
                logout();
                setMenu(false);
              }}
            >
              退出 {user.name}
            </button>
          ) : (
            <button
              className="btn btn-primary mt-3"
              onClick={() => {
                setMenu(false);
                setLoginOpen(true);
              }}
            >
              登录
            </button>
          )}
        </div>
      </Modal>
    </header>
  );
}
