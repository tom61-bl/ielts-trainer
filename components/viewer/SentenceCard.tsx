"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import sentences from "@/data/sentences.json";
import { translateSelection } from "@/lib/translate";

export function SentenceCard({
  text,
  rect,
  member,
  onClose,
}: {
  text: string;
  rect: DOMRect;
  member: boolean;
  onClose: () => void;
}) {
  const [state, setState] = useState<"loading" | "ready" | "miss" | "locked">("loading");
  const [zh, setZh] = useState("");

  useEffect(() => {
    const selection = window.getSelection();
    const range = selection && selection.rangeCount ? selection.getRangeAt(0).cloneRange() : null;
    let highlight: Highlight | null = null;
    if (range && "Highlight" in window && CSS.highlights) {
      highlight = new Highlight(range);
      CSS.highlights.set("sentence", highlight);
    }
    return () => {
      CSS.highlights?.delete("sentence");
      highlight?.clear();
    };
  }, [text]);

  useEffect(() => {
    if (!member) {
      setState("locked");
      return;
    }
    const hit = translateSelection(text, sentences);
    if (hit) {
      setZh(hit.zh);
      setState("ready");
      return;
    }
    setZh("");
    setState("miss");
  }, [member, text]);

  const left = Math.min(Math.max(8, rect.left), window.innerWidth - 340);
  const top = Math.min(rect.bottom + 10, window.innerHeight - 240);

  return (
    <aside className="sentence-card" style={{ left, top }}>
      <p className="sentence-kicker">译文</p>
      <p className="sentence-en">{text}</p>
      <div className="sentence-zh">
        {state === "loading" ? <span className="text-muted">正在对译文…</span> : null}
        {state === "ready" ? zh : null}
        {state === "miss" ? <span className="text-muted">译文库里没有这句。换一句正文，或把选区拉完整。</span> : null}
        {state === "locked" ? <span className="text-muted">整句译文在会员里。划线和高亮不用会员。</span> : null}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {state === "locked" ? (
          <Link className="btn btn-accent h-10" href="/pro">
            解锁会员
          </Link>
        ) : null}
        <button className="btn btn-ghost h-10" onClick={onClose}>
          关闭
        </button>
      </div>
    </aside>
  );
}
