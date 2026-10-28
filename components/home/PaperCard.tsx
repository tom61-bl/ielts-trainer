"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { loadProgress } from "@/lib/storage";
import type { Paper } from "@/lib/types";

function coverTitle(paper: Paper) {
  const [name, kind] = paper.title.split("·").map((part) => part.trim());
  return {
    name: name || paper.title,
    kind: kind || (paper.module === "academic" ? "学术类" : "培训类"),
  };
}

export function PaperCard({
  paper,
  total,
  fresh = false,
}: {
  paper: Paper;
  total: number;
  fresh?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const [pct, setPct] = useState(0);
  const title = coverTitle(paper);

  useEffect(() => {
    const progress = loadProgress(paper.id);
    const answered = Object.values(progress.answers).filter((value) => value.trim()).length;
    setPct(total > 0 ? Math.min(100, Math.round((answered / total) * 100)) : 0);
  }, [paper.id, total]);

  return (
    <Link
      href={paper.visibility === "private" ? `/ielts/local?id=${encodeURIComponent(paper.id)}` : `/ielts/${paper.id}`}
      className="cover-card"
    >
      {paper.thumbnailUrl && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={paper.thumbnailUrl} alt="" onError={() => setFailed(true)} />
      ) : (
        <div className="cover-fallback">{paper.title}</div>
      )}
      {fresh ? <span className="cover-new">新</span> : null}
      <div className="cover-caption">
        <p>
          {title.name}
          <span>（{paper.visibility === "private" ? "私有" : title.kind}）</span>
        </p>
        <progress max={100} value={pct} aria-label={`${title.name} 已作答 ${pct}%`} />
      </div>
    </Link>
  );
}
