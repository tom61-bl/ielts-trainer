"use client";

import type { StudyTool } from "../viewer/StudyTools";
import { SentenceCard } from "../viewer/SentenceCard";
import { WordLookupPanel } from "../wordbook/WordLookupPanel";

export function isSentenceSelection(text: string, tool: StudyTool) {
  const tokenCount = text.trim().split(/\s+/).filter(Boolean).length;
  return tokenCount > 1 && (tool === "translate" || tokenCount >= 4);
}

export function StudyPopups({
  lookup,
  tool,
  saved,
  onAdd,
  onClose,
}: {
  lookup: { text: string; rect: DOMRect } | null;
  tool: StudyTool;
  saved: boolean;
  onAdd: (extra?: { ipa?: string; meaning?: string }) => void;
  onClose: () => void;
}) {
  if (!lookup) return null;
  if (isSentenceSelection(lookup.text, tool)) {
    return <SentenceCard text={lookup.text} rect={lookup.rect} onClose={onClose} />;
  }
  return (
    <WordLookupPanel text={lookup.text} rect={lookup.rect} saved={saved} onAdd={onAdd} onClose={onClose} />
  );
}
