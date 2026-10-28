"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Paper } from "@/lib/types";

const moduleLabel = { academic: "学术类 A", general: "培训类 G" };
const typeLabel = { paper: "纸笔", computer: "机考" };

export function PaperCard({ paper }: { paper: Paper }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const [shown, setShown] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShown(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Link
      ref={ref}
      href={`/ielts/${paper.id}`}
      className="relative grid grid-cols-[104px_1fr] gap-4 rounded-xl border border-line bg-surface p-3 transition hover:-translate-y-0.5 sm:grid-cols-[140px_1fr]"
    >
      {paper.visibility === "private" ? (
        <span className="absolute right-3 top-3 rounded-full bg-accent px-2 py-0.5 text-xs text-white">
          私有
        </span>
      ) : null}
      <div className="aspect-[3/4] overflow-hidden rounded-lg bg-primary-soft">
        {shown && !failed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={paper.thumbnailUrl}
            alt=""
            className="h-full w-full object-cover"
            onError={() => setFailed(true)}
          />
        ) : (
          <div className="flex h-full items-end p-3 font-serif text-sm text-primary">
            {failed ? "封面未生成" : paper.title}
          </div>
        )}
      </div>
      <div className="flex min-w-0 flex-col justify-between py-1">
        <div>
          <p className="text-xs tracking-wide text-muted">
            系列 {paper.book} · 第 {paper.test} 套
          </p>
          <h2 className="mt-1 font-serif text-xl leading-snug sm:text-2xl">{paper.title}</h2>
          <p className="mt-2 text-sm leading-6 text-muted">{paper.blurb}</p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-primary-soft px-2 py-1 text-primary">
              {moduleLabel[paper.module]}
            </span>
            <span className="rounded-full border border-line px-2 py-1">{typeLabel[paper.testType]}</span>
            <span className="rounded-full border border-line px-2 py-1">
              {paper.source === "original-mock" ? "自研模拟" : "私有卷"}
            </span>
            {paper.audioUrl ? <span className="rounded-full border border-line px-2 py-1">含听力</span> : null}
          </div>
        </div>
        <p className="mt-3 text-sm text-primary">开始训练</p>
      </div>
    </Link>
  );
}
