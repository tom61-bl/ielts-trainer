"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { ThemeToggle } from "../ui/ThemeToggle";
import { Modal } from "../ui/Modal";
import { ShareModal } from "../ui/ShareModal";

const links = [
  { href: "/ielts", label: "目录" },
  { href: "/speaking", label: "口语" },
  { href: "/writing", label: "写作" },
  { href: "/help", label: "帮助" },
];

export function Header() {
  const { user, setLoginOpen, logout } = useAuth();
  const [menu, setMenu] = useState(false);
  const [share, setShare] = useState(false);
  const [url, setUrl] = useState("");

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center gap-3 px-4">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary font-serif text-lg text-white">
            卷
          </span>
          <span className="whitespace-nowrap text-[15px] font-medium tracking-tight">雅思真题在线</span>
        </Link>
        <nav className="ml-4 hidden items-center gap-5 text-sm text-muted md:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-ink">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <button
            className="btn btn-text hidden sm:inline-flex"
            onClick={() => {
              setUrl(window.location.href);
              setShare(true);
            }}
          >
            分享
          </button>
          <ThemeToggle />
          {user ? (
            <button className="btn btn-ghost hidden max-w-[180px] truncate sm:inline-flex" onClick={logout}>
              {user.name}
            </button>
          ) : (
            <button className="btn btn-primary hidden sm:inline-flex" onClick={() => setLoginOpen(true)}>
              登录
            </button>
          )}
          <button className="btn btn-ghost px-3 md:hidden" onClick={() => setMenu(true)} aria-label="打开菜单">
            <Menu size={18} />
          </button>
        </div>
      </div>
      <Modal open={menu} onClose={() => setMenu(false)} title="去哪里">
        <div className="flex flex-col">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="btn btn-text justify-start" onClick={() => setMenu(false)}>
              {link.label}
            </Link>
          ))}
          <button
            className="btn btn-text justify-start"
            onClick={() => {
              setMenu(false);
              setUrl(window.location.href);
              setShare(true);
            }}
          >
            分享
          </button>
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
      <ShareModal open={share} onClose={() => setShare(false)} title="雅思真题在线" url={url || "/"} />
    </header>
  );
}
