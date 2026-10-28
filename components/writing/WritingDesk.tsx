"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Maximize2, Volume2 } from "lucide-react";
import { getWritingSample } from "@/lib/keys";
import { speakEnglish, stopSpeaking } from "@/lib/speak";
import { loadWordbook, readJson, saveWordbook, storageKeys, writeJson } from "@/lib/storage";
import type { WordEntry, WritingTask } from "@/lib/types";
import { ThemeToggle } from "../ui/ThemeToggle";
import { useToast } from "../ui/Toast";
import { paintPlain, type InkColor, type InkMark } from "../viewer/inkLayer";
import { StudyTools, type StudyTool } from "../viewer/StudyTools";
import { WordbookDrawer } from "../wordbook/WordbookDrawer";
import { StudyPopups } from "../practice/StudyPopups";

function countWords(text: string) {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

export function WritingDesk({ tasks }: { tasks: WritingTask[] }) {
  const toast = useToast();
  const rootRef = useRef<HTMLDivElement>(null);
  const [currentId, setCurrentId] = useState(tasks[0]?.id ?? "");
  const task = tasks.find((item) => item.id === currentId) ?? tasks[0];
  const [text, setText] = useState("");
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [sample, setSample] = useState<string | null>(null);
  const [tool, setTool] = useState<StudyTool>("lookup");
  const [inkColor, setInkColor] = useState<InkColor>("sun");
  const [erasing, setErasing] = useState(false);
  const [marks, setMarks] = useState<InkMark[]>([]);
  const [past, setPast] = useState<InkMark[][]>([]);
  const [future, setFuture] = useState<InkMark[][]>([]);
  const [scale, setScale] = useState(1);
  const [lookup, setLookup] = useState<{ text: string; rect: DOMRect } | null>(null);
  const [words, setWords] = useState<WordEntry[]>([]);
  const [wordbookOpen, setWordbookOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const wordsCount = useMemo(() => countWords(text), [text]);

  useEffect(() => {
    if (!task) return;
    setText(readJson(storageKeys.writing(task.id), ""));
    setMarks(readJson<InkMark[]>(storageKeys.ink(`writing-${task.id}`), []));
    setWords(loadWordbook());
    setSample(null);
    setSeconds(0);
    setRunning(false);
    setPast([]);
    setFuture([]);
    setLookup(null);
    setReady(true);
  }, [task]);

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [running]);

  useEffect(() => {
    if (!ready || !task) return;
    writeJson(storageKeys.ink(`writing-${task.id}`), marks);
  }, [marks, ready, task]);

  function updateText(value: string) {
    setText(value);
    if (task) writeJson(storageKeys.writing(task.id), value);
  }

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
    const selected = selection.toString().replace(/\s+/g, " ").trim();
    if (!selected || selected.length > 500) return;
    if (tool === "ink") {
      commit((current) => {
        if (erasing) return current.filter((mark) => !(selected.includes(mark.text) || mark.text.includes(selected)));
        return [...current, { id: crypto.randomUUID(), page: 1, text: selected, color: inkColor, surface: "computer" }];
      });
      selection.removeAllRanges();
      return;
    }
    setLookup({ text: selected, rect: selection.getRangeAt(0).getBoundingClientRect() });
  }

  function addWord(extra?: { ipa?: string; meaning?: string }) {
    if (!lookup || !task) return;
    const entry: WordEntry = {
      id: crypto.randomUUID(),
      word: lookup.text.trim(),
      context: "",
      source: task.title,
      createdAt: Date.now(),
      ...extra,
    };
    const next = [entry, ...words.filter((item) => item.word.toLowerCase() !== entry.word.toLowerCase())];
    setWords(next);
    saveWordbook(next);
    toast("已加入生词本");
  }

  if (!task) return <p className="px-4 py-8">还没有写作题。</p>;

  const minutes = String(Math.floor(seconds / 60)).padStart(2, "0");
  const remain = String(seconds % 60).padStart(2, "0");
  const enough = wordsCount >= task.minWords;
  const saved = Boolean(lookup && words.some((item) => item.word.toLowerCase() === lookup.text.trim().toLowerCase()));
  const promptParts = paintPlain(task.prompt, marks);

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
        <select className="exam-set" aria-label="选择题目" value={task.id} onChange={(event) => setCurrentId(event.target.value)}>
          {tasks.map((item) => (
            <option key={item.id} value={item.id}>
              Task {item.task} · {item.title}
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
        <div className="computer-board grid h-full min-h-0 lg:grid-cols-2">
          <div className={`min-h-0 overflow-auto border-b border-line p-5 lg:border-b-0 lg:border-r ${tool === "ink" ? "ink-on" : ""}`} onMouseUp={onMouseUp}>
            <p className="text-sm text-muted">Task {task.task}</p>
            <h1 className="mt-1 font-serif text-3xl leading-snug">{task.title}</h1>
            <p className="mt-4 font-serif leading-8" style={{ fontSize: `${17 * scale}px` }}>
              {promptParts.map((part, index) =>
                part.color ? (
                  <mark key={`${part.id}-${index}`} className={`passage-ink ink-${part.color}`}>
                    {part.text}
                  </mark>
                ) : (
                  <span key={`t-${index}`}>{part.text}</span>
                ),
              )}
            </p>
            {task.chart ? (
              <div className="mt-4 rounded-xl border border-line p-4">
                <p className="text-xs text-muted">{task.chart.caption}</p>
                <div className="mt-4 flex items-end gap-4 overflow-x-auto">
                  {task.chart.categories.map((category, index) => (
                    <div key={category} className="min-w-16">
                      <div className="flex h-36 items-end gap-1">
                        {task.chart!.series.map((series) => (
                          <div key={series.name} className="flex w-4 flex-col justify-end" title={`${series.name} ${series.values[index]}`}>
                            <div
                              className="w-4 rounded-sm bg-primary"
                              style={{
                                height: `${Math.max(8, (series.values[index] / Math.max(...task.chart!.series.flatMap((item) => item.values))) * 140)}px`,
                                opacity: 0.45 + task.chart!.series.indexOf(series) * 0.25,
                              }}
                            />
                          </div>
                        ))}
                      </div>
                      <p className="mt-2 text-center text-xs">{category}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            {task.steps ? (
              <ol className="mt-4 list-decimal space-y-1 pl-5 text-sm leading-7">
                {task.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            ) : null}
            {sample ? <article className="mt-4 whitespace-pre-wrap rounded-xl bg-primary-soft p-4 text-sm leading-7">{sample}</article> : null}
          </div>
          <div className="flex min-h-0 flex-col p-5">
            <textarea
              className="field min-h-0 flex-1 font-serif leading-8"
              style={{ fontSize: `${17 * scale}px` }}
              value={text}
              onChange={(event) => updateText(event.target.value)}
              placeholder="在这里写。草稿会留在这台浏览器。"
            />
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
              speakEnglish(task.prompt);
            }}
          >
            <Volume2 size={16} />
            朗读题目
          </button>
          <p className={`exam-audio-note ${enough ? "is-enough" : ""}`}>
            {wordsCount} / {task.minWords} 词
          </p>
          <button type="button" className="exam-read" onClick={() => setRunning((value) => !value)}>
            {running ? `${minutes}:${remain} 暂停` : seconds ? `${minutes}:${remain} 继续` : "开始计时"}
          </button>
          <button
            type="button"
            className="exam-read"
            onClick={() => {
              const sampleText = getWritingSample(task.id);
              if (!sampleText) {
                toast("范文没有打开");
                return;
              }
              setSample(sampleText);
            }}
          >
            范文
          </button>
        </div>
      </footer>
      <StudyPopups lookup={lookup} tool={tool} saved={saved} onAdd={addWord} onClose={() => setLookup(null)} />
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
