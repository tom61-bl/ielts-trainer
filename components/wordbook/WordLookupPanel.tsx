"use client";

import { useEffect, useState } from "react";
import { Star, Volume2, X } from "lucide-react";
import glossary from "@/data/glossary.json";
import { speakEnglish, stopSpeaking } from "@/lib/speak";

export function WordLookupPanel({
  text,
  rect,
  saved,
  onAdd,
  onClose,
}: {
  text: string;
  rect: DOMRect;
  saved: boolean;
  onAdd: (extra?: { ipa?: string; meaning?: string }) => void;
  onClose: () => void;
}) {
  const word = text.trim();
  const sentence = word.split(/\s+/).length > 3;
  const [detail, setDetail] = useState<{ ipa?: string; zh?: string; found?: boolean } | null>(null);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    if (sentence) return;
    const clean = word.toLowerCase().replace(/[^a-z'-]/g, "");
    const hit = (glossary as { word: string; ipa: string; zh: string }[]).find((entry) => entry.word === clean);
    setDetail(hit ? { ipa: hit.ipa, zh: hit.zh, found: true } : { found: false });
  }, [sentence, word]);

  useEffect(() => {
    if (sentence) return;
    setSpeaking(false);
    speakEnglish(word, {
      onStart: () => setSpeaking(true),
      onEnd: () => setSpeaking(false),
    });
    return () => stopSpeaking();
  }, [sentence, word]);

  const left = Math.min(Math.max(12, rect.left), window.innerWidth - 336);
  const top = Math.min(Math.max(60, rect.bottom + 8), window.innerHeight - 210);

  return (
    <aside className="dict-card" style={{ left, top }}>
      <button type="button" className="dict-close" onClick={onClose} aria-label="关闭">
        <X size={14} />
      </button>
      <div className="dict-head">
        <p className="dict-word">{sentence ? "选中的句子" : word}</p>
        {sentence ? null : (
          <button
            type="button"
            className="dict-speak"
            data-speaking={speaking ? "true" : "false"}
            aria-label="朗读"
            onClick={() =>
              speakEnglish(word, {
                onStart: () => setSpeaking(true),
                onEnd: () => setSpeaking(false),
              })
            }
          >
            <Volume2 size={15} />
          </button>
        )}
        <button
          type="button"
          className="dict-star"
          aria-pressed={saved}
          aria-label={saved ? "已在生词本" : "加入生词本"}
          onClick={() => onAdd(detail?.zh ? { ipa: detail.ipa, meaning: detail.zh } : undefined)}
        >
          <Star size={15} fill={saved ? "currentColor" : "none"} />
        </button>
      </div>
      {sentence ? (
        <p className="dict-zh">整句翻译用顶栏的 T。这个卡片只查单词。</p>
      ) : (
        <>
          {detail?.ipa ? <p className="dict-ipa">{detail.ipa}</p> : null}
          <div className="dict-rule" />
          <p className="dict-zh">{detail?.zh ?? (detail ? "这本词库还没有这个词。" : "正在查词库…")}</p>
        </>
      )}
    </aside>
  );
}
