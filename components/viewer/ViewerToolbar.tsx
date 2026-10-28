"use client";

import Link from "next/link";
import { ChevronLeft, Maximize2, Minus, Plus, Share2 } from "lucide-react";
import { ThemeToggle } from "../ui/ThemeToggle";
import type { ViewMode } from "@/lib/types";

export function ViewerToolbar({
  title,
  page,
  pages,
  scale,
  mode,
  onBackHref,
  onPage,
  onScale,
  onMode,
  onFullscreen,
  onShare,
  className = "",
}: {
  title: string;
  page: number;
  pages: number;
  scale: number;
  mode: ViewMode;
  onBackHref: string;
  onPage: (page: number) => void;
  onScale: (scale: number) => void;
  onMode: (mode: ViewMode) => void;
  onFullscreen: () => void;
  onShare: () => void;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-2 overflow-x-auto border-b border-line bg-surface px-3 py-2 ${className}`}>
      <Link href={onBackHref} className="btn btn-ghost h-11 shrink-0 px-3">
        <ChevronLeft size={16} />
        返回
      </Link>
      <p className="hidden min-w-0 truncate text-sm font-medium md:block">{title}</p>
      <div className="ml-auto flex shrink-0 items-center gap-2">
        <button className="btn btn-ghost h-11 w-11 px-0" onClick={() => onScale(Math.max(0.5, Number((scale - 0.1).toFixed(2))))} aria-label="缩小">
          <Minus size={16} />
        </button>
        <span className="w-12 text-center text-xs">{Math.round(scale * 100)}%</span>
        <button className="btn btn-ghost h-11 w-11 px-0" onClick={() => onScale(Math.min(2, Number((scale + 0.1).toFixed(2))))} aria-label="放大">
          <Plus size={16} />
        </button>
        <form
          className="flex items-center gap-1 text-xs"
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            const next = Number(data.get("page"));
            if (next >= 1 && next <= pages) onPage(next);
          }}
        >
          <input
            name="page"
            key={page}
            defaultValue={page}
            inputMode="numeric"
            className="field h-11 w-14 px-2 text-center"
            aria-label="页码"
          />
          <span className="text-muted">/ {pages || "—"}</span>
        </form>
        <div className="flex rounded-lg border border-line p-0.5">
          {(["paper", "computer"] as ViewMode[]).map((item) => (
            <button
              key={item}
              className={`h-10 rounded-md px-3 text-xs ${mode === item ? "bg-primary text-white" : ""}`}
              onClick={() => onMode(item)}
            >
              {item === "paper" ? "纸笔" : "机考"}
            </button>
          ))}
        </div>
        <button className="btn btn-ghost h-11 w-11 px-0" onClick={onFullscreen} aria-label="全屏">
          <Maximize2 size={16} />
        </button>
        <ThemeToggle />
        <button className="btn btn-ghost h-11 w-11 px-0" onClick={onShare} aria-label="分享">
          <Share2 size={16} />
        </button>
      </div>
    </div>
  );
}
