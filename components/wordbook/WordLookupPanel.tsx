"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import glossary from "@/data/glossary.json";

export function WordLookupPanel({
  text,
  rect,
  member,
  onAdd,
  onClose,
}: {
  text: string;
  rect: DOMRect;
  member: boolean;
  onAdd: (extra?: { ipa?: string; meaning?: string }) => void;
  onClose: () => void;
}) {
  const word = text.trim();
  const sentence = word.split(/\s+/).length > 3;
  const [detail, setDetail] = useState<{ ipa?: string; zh?: string; found?: boolean } | null>(null);

  useEffect(() => {
    if (!member || sentence) return;
    const clean = word.toLowerCase().replace(/[^a-z'-]/g, "");
    const hit = (glossary as { word: string; ipa: string; zh: string }[]).find((entry) => entry.word === clean);
    setDetail(hit ? { ipa: hit.ipa, zh: hit.zh, found: true } : { found: false });
  }, [member, sentence, word]);

  const left = Math.min(rect.left, window.innerWidth - 300);
  const top = Math.min(rect.bottom + 8, window.innerHeight - 220);

  return (
    <div
      className="fixed z-[60] w-[280px] rounded-xl border border-line bg-surface p-3 shadow-[var(--shadow)]"
      style={{ left: Math.max(8, left), top: Math.max(8, top) }}
    >
      <p className="font-serif text-lg">{sentence ? "选中的句子" : word}</p>
      {sentence ? (
        <p className="mt-2 text-sm leading-6 text-muted">
          {member
            ? "这句没有预存译文。可以先收进生词本，对照原文自己处理。"
            : "翻译此句是会员功能。"}
        </p>
      ) : member ? (
        <p className="mt-2 text-sm leading-6">
          {detail?.ipa ? <span className="mr-2 text-muted">{detail.ipa}</span> : null}
          {detail?.zh ?? (detail ? "这本词库还没有这个词。" : "正在查词库…")}
        </p>
      ) : (
        <p className="mt-2 text-sm leading-6 text-muted">释义要会员才能看。加入生词本不需要。</p>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          className="btn btn-primary h-10"
          onClick={() => {
            onAdd(detail?.zh ? { ipa: detail.ipa, meaning: detail.zh } : undefined);
            onClose();
          }}
        >
          加入生词本
        </button>
        {!member ? (
          <Link className="btn btn-accent h-10" href="/pro">
            解锁会员
          </Link>
        ) : null}
        <button className="btn btn-text h-10" onClick={onClose}>
          关闭
        </button>
      </div>
    </div>
  );
}
