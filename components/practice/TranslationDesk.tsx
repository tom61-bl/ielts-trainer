"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Maximize2, Volume2 } from "lucide-react";
import sentences from "@/data/sentences.json";
import { getPapers, getPassageFile } from "@/lib/papers";
import { speakEnglish, stopSpeaking } from "@/lib/speak";
import { loadWordbook, readJson, saveWordbook, storageKeys, writeJson } from "@/lib/storage";
import { translateSelection, type SentenceRow } from "@/lib/translate";
import type { WordEntry } from "@/lib/types";
import { ThemeToggle } from "../ui/ThemeToggle";
import { useToast } from "../ui/Toast";
import { paintPlain, type InkColor, type InkMark } from "../viewer/inkLayer";
import { StudyTools, type StudyTool } from "../viewer/StudyTools";
import { WordbookDrawer } from "../wordbook/WordbookDrawer";
import { StudyPopups } from "./StudyPopups";

const rows = sentences as SentenceRow[];

function splitSentences(text: string) {
  return text
    .replace(/\s+/g, " ")
    .trim()
    .split(/(?<=[.!?])\s+(?=[A-Z“"])/u)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

export function TranslationDesk() {
  const toast = useToast();
  const rootRef = useRef<HTMLDivElement>(null);
  const pieces = useMemo(
    () =>
      getPapers().flatMap((paper) =>
        getPassageFile(paper.id).passages.map((passage) => ({
          id: `${paper.id}-${passage.section}`,
          section: passage.section,
          paperTitle: paper.title.replace(/ · (学术类|培训类)$/u, ""),
          title: passage.title.replace(/ · (学术类|培训类)$/u, ""),
          paragraphs: passage.paragraphs,
        })),
      ),
    [],
  );
  const [pieceId, setPieceId] = useState(pieces[0]?.id ?? "");
  const piece = pieces.find((item) => item.id === pieceId) ?? pieces[0];
  const [tool, setTool] = useState<StudyTool>("lookup");
  const [inkColor, setInkColor] = useState<InkColor>("sun");
  const [erasing, setErasing] = useState(false);
  const [marks, setMarks] = useState<InkMark[]>([]);
  const [past, setPast] = useState<InkMark[][]>([]);
  const [future, setFuture] = useState<InkMark[][]>([]);
  const [scale, setScale] = useState(1);
  const [openZh, setOpenZh] = useState<Record<number, boolean>>({});
  const [lookup, setLookup] = useState<{ text: string; rect: DOMRect } | null>(null);
  const [words, setWords] = useState<WordEntry[]>([]);
  const [wordbookOpen, setWordbookOpen] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setWords(loadWordbook());
    setMarks(readJson<InkMark[]>(storageKeys.ink(`translation-${pieceId}`), []));
    setPast([]);
    setFuture([]);
    setOpenZh({});
    setLookup(null);
    setReady(true);
  }, [pieceId]);

  useEffect(() => {
    if (!ready) return;
    writeJson(storageKeys.ink(`translation-${pieceId}`), marks);
  }, [marks, pieceId, ready]);

  function commit(recipe: (current: InkMark[]) => InkMark[]) {
    setMarks((current) => {
      const next = recipe(current);
      if (next === current) return current;
      setPast((items) => [...items, current].slice(-30));
      setFuture([]);
      return next;
    });
  }

  function onMouseUp() {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;
    const text = selection.toString().replace(/\s+/g, " ").trim();
    if (!text || text.length > 500) return;
    if (tool === "ink") {
      const clean = text;
      commit((current) => {
        if (erasing) {
          return current.filter((mark) => !(clean.includes(mark.text) || mark.text.includes(clean)));
        }
        return [...current, { id: crypto.randomUUID(), page: 1, text: clean, color: inkColor, surface: "computer" }];
      });
      selection.removeAllRanges();
      return;
    }
    setLookup({ text, rect: selection.getRangeAt(0).getBoundingClientRect() });
  }

  function addWord(extra?: { ipa?: string; meaning?: string }) {
    if (!lookup) return;
    const entry: WordEntry = {
      id: crypto.randomUUID(),
      word: lookup.text.trim(),
      context: "",
      source: piece?.paperTitle ?? "翻译",
      createdAt: Date.now(),
      ...extra,
    };
    const next = [entry, ...words.filter((item) => item.word.toLowerCase() !== entry.word.toLowerCase())];
    setWords(next);
    saveWordbook(next);
    toast("已加入生词本");
  }

  if (!piece) return <p className="px-4 py-8">还没有可以翻译的文章。</p>;

  const saved = Boolean(lookup && words.some((item) => item.word.toLowerCase() === lookup.text.trim().toLowerCase()));

  return (
    <div ref={rootRef} className="exam-desk">
      <header className="exam-top">
        <div className="exam-top-left">
          <Link href="/" className="exam-icon" aria-label="返回">
            <ChevronLeft size={18} />
          </Link>
          <StudyTools
            tool={tool}
            color={inkColor}
            erasing={erasing}
            scale={scale}
            canUndo={past.length > 0}
            canRedo={future.length > 0}
            onTool={(next) => {
              setTool(next);
              setErasing(false);
              setLookup(null);
            }}
            onColor={(next) => {
              setInkColor(next);
              setTool("ink");
              setErasing(false);
            }}
            onErase={() => {
              setTool("ink");
              setErasing(true);
            }}
            onScale={setScale}
            onUndo={() => {
              setPast((items) => {
                const previous = items[items.length - 1];
                if (!previous) return items;
                setFuture((queue) => [marks, ...queue]);
                setMarks(previous);
                return items.slice(0, -1);
              });
            }}
            onRedo={() => {
              setFuture((items) => {
                const next = items[0];
                if (!next) return items;
                setPast((queue) => [...queue, marks]);
                setMarks(next);
                return items.slice(1);
              });
            }}
          />
        </div>
        <select className="exam-set" aria-label="选择一篇" value={piece.id} onChange={(event) => setPieceId(event.target.value)}>
          {pieces.map((item) => (
            <option key={item.id} value={item.id}>
              {item.title && item.title !== item.paperTitle ? `${item.paperTitle} · ${item.title}` : `${item.paperTitle} · 第 ${item.section} 篇`}
            </option>
          ))}
        </select>
        <div className="exam-top-right">
          <ThemeToggle iconOnly className="exam-icon" />
          <button
            type="button"
            className="exam-icon"
            aria-label="全屏"
            onClick={() => {
              if (document.fullscreenElement) void document.exitFullscreen();
              else void rootRef.current?.requestFullscreen();
            }}
          >
            <Maximize2 size={16} />
          </button>
        </div>
      </header>
      <div className="exam-stage">
        <div className={`computer-board translation-sheet ${tool === "ink" ? "ink-on" : ""}`} onMouseUp={onMouseUp}>
          <p className="translation-kicker">{piece.paperTitle}</p>
          <h1>{piece.title}</h1>
          <div style={{ fontSize: `${18 * scale}px` }}>
            {piece.paragraphs.map((paragraph, index) => {
              const sentencesInParagraph = splitSentences(paragraph.text);
              return (
                <section key={`${paragraph.label}-${index}`} className="translation-block">
                  <div className="translation-actions">
                    <button
                      type="button"
                      onClick={() => {
                        stopSpeaking();
                        speakEnglish(paragraph.text);
                      }}
                    >
                      <Volume2 size={14} />
                      朗读
                    </button>
                    <button type="button" onClick={() => setOpenZh((current) => ({ ...current, [index]: !current[index] }))}>
                      {openZh[index] ? "收起译文" : "译文"}
                    </button>
                  </div>
                  <p>
                    {paragraph.label ? <strong className="mr-2">{paragraph.label}</strong> : null}
                    {paintPlain(paragraph.text, marks).map((part, partIndex) =>
                      part.color ? (
                        <mark key={`${part.id}-${partIndex}`} className={`passage-ink ink-${part.color}`}>
                          {part.text}
                        </mark>
                      ) : (
                        <span key={`t-${partIndex}`}>{part.text}</span>
                      ),
                    )}
                  </p>
                  {openZh[index] ? (
                    <div className="translation-zh">
                      {sentencesInParagraph.map((sentence) => {
                        const hit = translateSelection(sentence, rows);
                        return <p key={sentence}>{hit?.zh ?? "这一句还没有译文。"}</p>;
                      })}
                    </div>
                  ) : null}
                </section>
              );
            })}
          </div>
        </div>
      </div>
      <button type="button" className="exam-wordbook" onClick={() => setWordbookOpen(true)}>
        生词本
        <span aria-hidden="true">›</span>
      </button>
      <footer className="exam-audio">
        <div className="exam-transport">
          <button
            type="button"
            className="exam-read"
            onClick={() => {
              stopSpeaking();
              speakEnglish(piece.paragraphs.map((item) => item.text).join(" "));
            }}
          >
            <Volume2 size={16} />
            朗读全文
          </button>
          <p className="exam-audio-note">选中单词会听读音并看释义。点星星收藏。点「译文」展开这一段的中文。</p>
        </div>
      </footer>
      <StudyPopups
        lookup={lookup}
        tool={tool}
        saved={saved}
        onAdd={addWord}
        onClose={() => setLookup(null)}
      />
      <WordbookDrawer
        open={wordbookOpen}
        entries={words}
        onClose={() => setWordbookOpen(false)}
        onDelete={(id) => {
          const next = words.filter((entry) => entry.id !== id);
          setWords(next);
          saveWordbook(next);
        }}
      />
    </div>
  );
}
