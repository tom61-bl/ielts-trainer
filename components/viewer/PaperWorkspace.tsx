"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft, FileText, Maximize2, Share2, X } from "lucide-react";
import type { GradeResult, Paper, PassageFile, Question, Skill } from "@/lib/types";
import { gradeAll } from "@/lib/grade";
import { getAnswerKeys, type AnswerKey } from "@/lib/keys";
import { loadPrefs, loadProgress, loadWordbook, readJson, savePrefs, saveProgress, saveWordbook, storageKeys, writeJson } from "@/lib/storage";
import { useToast } from "../ui/Toast";
import { ShareModal } from "../ui/ShareModal";
import { AnswerSheet } from "./AnswerSheet";
import { AudioPlayer, type AudioHandle } from "./AudioPlayer";
import { ComputerPane } from "./ComputerPane";
import { ThemeToggle } from "../ui/ThemeToggle";
import { WordLookupPanel } from "../wordbook/WordLookupPanel";
import { WordbookDrawer } from "../wordbook/WordbookDrawer";
import { SentenceCard } from "./SentenceCard";
import { StudyTools, type StudyTool } from "./StudyTools";
import type { InkColor, InkMark } from "./inkLayer";

export function PaperWorkspace({
  paper,
  questions,
  passages,
  answerKeys,
  backHref = "/",
  sets,
  onSet,
  examAudio = true,
  corner,
}: {
  paper: Paper;
  questions: Question[];
  passages: PassageFile;
  answerKeys?: AnswerKey[] | null;
  backHref?: string;
  sets?: { id: string; title: string }[];
  onSet?: (id: string) => void;
  examAudio?: boolean;
  corner?: ReactNode;
}) {
  const toast = useToast();
  const audioRef = useRef<AudioHandle>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [visited, setVisited] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [skill, setSkill] = useState<Skill>(questions.some((q) => q.skill === "listening") ? "listening" : "reading");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [grade, setGrade] = useState<Record<string, GradeResult> | null>(null);
  const [scale, setScale] = useState(1);
  const [followId, setFollowId] = useState<string | null>(null);
  const [share, setShare] = useState(false);
  const [wordbookOpen, setWordbookOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [scriptOpen, setScriptOpen] = useState(false);
  const [words, setWords] = useState<ReturnType<typeof loadWordbook>>([]);
  const [lookup, setLookup] = useState<{ text: string; rect: DOMRect } | null>(null);
  const [shareUrl, setShareUrl] = useState("");
  const [tool, setTool] = useState<StudyTool>("lookup");
  const [inkColor, setInkColor] = useState<InkColor>("sun");
  const [erasing, setErasing] = useState(false);
  const [marks, setMarks] = useState<InkMark[]>([]);
  const [past, setPast] = useState<InkMark[][]>([]);
  const [future, setFuture] = useState<InkMark[][]>([]);

  useEffect(() => {
    const progress = loadProgress(paper.id);
    setAnswers(progress.answers);
    setVisited(progress.visited);
    setScale(loadPrefs().scale || 1);
    setShareUrl(window.location.href);
    setWords(loadWordbook());
    setMarks(readJson<InkMark[]>(storageKeys.ink(paper.id), []));
    setPast([]);
    setFuture([]);
    setReady(true);
  }, [paper.id]);

  useEffect(() => {
    if (!ready) return;
    const timer = window.setTimeout(() => {
      saveProgress(paper.id, { answers, visited, updatedAt: Date.now() });
    }, 500);
    return () => window.clearTimeout(timer);
  }, [answers, visited, ready, paper.id]);

  useEffect(() => {
    if (!ready) return;
    writeJson(storageKeys.ink(paper.id), marks);
  }, [marks, ready, paper.id]);

  const listening = useMemo(
    () => questions.filter((question) => question.skill === "listening" && question.audioAnchor != null),
    [questions],
  );

  function followTime(seconds: number) {
    let best: Question | null = null;
    for (const question of listening) {
      if ((question.audioAnchor ?? 0) <= seconds + 0.2) {
        if (!best || (question.audioAnchor ?? 0) >= (best.audioAnchor ?? 0)) best = question;
      }
    }
    setFollowId(best?.id ?? null);
  }

  async function selectQuestion(id: string) {
    const question = questions.find((item) => item.id === id);
    if (!question) return;
    setActiveId(id);
    setSkill(question.skill);
    setVisited((current) => (current.includes(id) ? current : [...current, id]));
    document.getElementById(`computer-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    if (question.skill === "listening" && question.audioAnchor != null) {
      audioRef.current?.seek(question.audioAnchor);
    }
  }

  function gradePaper() {
    const keys = answerKeys ?? getAnswerKeys(paper.id);
    if (!keys?.length) {
      toast("这份卷还没有答案。在 Markdown 末尾加上 Answers 列表后再导入。");
      return;
    }
    setGrade(gradeAll(keys, answers));
    setScriptOpen(false);
    setSheetOpen(true);
    toast("已对答案");
  }

  function addWord(extra?: { ipa?: string; meaning?: string }) {
    if (!lookup) return;
    const entry = {
      id: crypto.randomUUID(),
      word: lookup.text.trim(),
      context: "",
      source: paper.title,
      createdAt: Date.now(),
      ...extra,
    };
    const next = [entry, ...words.filter((item) => item.word.toLowerCase() !== entry.word.toLowerCase())];
    setWords(next);
    saveWordbook(next);
    toast("已加入生词本");
  }

  function commitMarks(recipe: (current: InkMark[]) => InkMark[]) {
    setMarks((current) => {
      const next = recipe(current);
      if (next === current) return current;
      setPast((items) => [...items, current].slice(-30));
      setFuture([]);
      return next;
    });
  }

  function markText(text: string, page: number, surface: InkMark["surface"]) {
    const clean = text.replace(/\s+/g, " ").trim();
    if (clean.length < 2) return;
    commitMarks((current) => {
      if (erasing) {
        const next = current.filter(
          (mark) =>
            !(
              mark.surface === surface &&
              mark.page === page &&
              (clean.includes(mark.text) || mark.text.includes(clean))
            ),
        );
        return next.length === current.length ? current : next;
      }
      if (current.some((mark) => mark.text === clean && mark.page === page && mark.surface === surface)) return current;
      return [...current, { id: crypto.randomUUID(), page, text: clean, color: inkColor, surface }].slice(-200);
    });
  }

  function undoMarks() {
    setPast((items) => {
      if (!items.length) return items;
      const previous = items[items.length - 1];
      setMarks((current) => {
        setFuture((queue) => [current, ...queue].slice(0, 30));
        return previous;
      });
      return items.slice(0, -1);
    });
  }

  function redoMarks() {
    setFuture((queue) => {
      if (!queue.length) return queue;
      const next = queue[0];
      setMarks((current) => {
        setPast((items) => [...items, current].slice(-30));
        return next;
      });
      return queue.slice(1);
    });
  }

  function removeWord(id: string) {
    const next = words.filter((item) => item.id !== id);
    setWords(next);
    saveWordbook(next);
  }

  const activeSection = listening.find((question) => question.id === followId)?.section;

  const sheet = (
    <AnswerSheet
      questions={questions}
      skill={skill}
      onSkill={setSkill}
      answers={answers}
      visited={visited}
      activeId={activeId}
      followId={followId}
      grade={grade}
      onSelect={(id) => void selectQuestion(id)}
    />
  );

  const tokenCount = lookup?.text.trim().split(/\s+/).filter(Boolean).length ?? 0;
  const sentence = Boolean(lookup && tokenCount > 1 && (tool === "translate" || tokenCount >= 4));
  const lookupSaved = Boolean(
    lookup && words.some((item) => item.word.toLowerCase() === lookup.text.trim().toLowerCase()),
  );

  function changeScale(next: number) {
    setScale(next);
    savePrefs({ ...loadPrefs(), scale: next });
  }

  return (
    <div ref={rootRef} className="exam-desk">
      <header className="exam-top">
        <div className="exam-top-left">
          <Link href={backHref} className="exam-icon" aria-label="返回">
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
            onScale={changeScale}
            onUndo={undoMarks}
            onRedo={redoMarks}
          />
        </div>
        {sets && sets.length > 1 && onSet ? (
          <select
            className="exam-set"
            aria-label="选择一套"
            value={paper.id}
            onChange={(event) => onSet(event.target.value)}
          >
            {sets.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </select>
        ) : (
          <h1 className="exam-title">{paper.title}</h1>
        )}
        <div className="exam-top-right">
          {corner}
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
          <button type="button" className="exam-icon" aria-label="分享" onClick={() => setShare(true)}>
            <Share2 size={16} />
          </button>
        </div>
      </header>

      <div className="exam-stage">
          <ComputerPane
            file={passages}
            questions={questions}
            skill={skill}
            answers={answers}
            grade={grade}
            activeId={activeId}
            onChange={(id, value) => {
              setAnswers((current) => ({ ...current, [id]: value }));
              setVisited((current) => (current.includes(id) ? current : [...current, id]));
            }}
            onSelectText={(text, rect) => setLookup({ text, rect })}
            tool={tool}
            marks={marks}
            scale={scale}
            onInk={(text, inkPage) => markText(text, inkPage, "computer")}
          />
        {sheetOpen ? (
          <aside className="exam-drawer">
            <div className="exam-drawer-bar">
              <strong>答题卡</strong>
              <button type="button" className="exam-icon" aria-label="关闭答题卡" onClick={() => setSheetOpen(false)}>
                <X size={16} />
              </button>
            </div>
            {sheet}
          </aside>
        ) : null}
        {scriptOpen ? (
          <aside className="exam-drawer exam-drawer-left">
            <div className="exam-drawer-bar">
              <strong>听力原文</strong>
              <button type="button" className="exam-icon" aria-label="关闭听力原文" onClick={() => setScriptOpen(false)}>
                <X size={16} />
              </button>
            </div>
            <div className="exam-script">
              <p>点一节，播放会跳到那里。逐句原文跟着录音走，不铺在卷面上。</p>
              {(paper.audioSections ?? []).map((section) => (
                <button
                  key={section.section}
                  type="button"
                  className={activeSection === section.section ? "is-on" : ""}
                  onClick={() => audioRef.current?.seek(section.start)}
                >
                  <span>{section.title}</span>
                  <span>{Math.floor(section.start / 60)}:{String(Math.floor(section.start % 60)).padStart(2, "0")}</span>
                </button>
              ))}
            </div>
          </aside>
        ) : null}
      </div>

      <button type="button" className="exam-wordbook" onClick={() => setWordbookOpen(true)}>
        生词本
        <span aria-hidden="true">›</span>
      </button>
      <button
        type="button"
        className="exam-fab"
        aria-pressed={sheetOpen}
        aria-label="答题卡"
        onClick={() => {
          setScriptOpen(false);
          setSheetOpen((open) => !open);
        }}
      >
        <FileText size={18} />
      </button>
      {examAudio ? (
        <footer className="exam-audio">
          <AudioPlayer
            ref={audioRef}
            src={paper.audioUrl}
            onTime={followTime}
            onTranscript={() => {
              setSheetOpen(false);
              setScriptOpen((open) => !open);
            }}
            onGrade={gradePaper}
          />
        </footer>
      ) : (
        <footer className="exam-audio">
          <div className="exam-transport">
            <p className="exam-audio-note">选中单词会读出读音。阅读页可以朗读整篇，记号留在这台浏览器。</p>
          </div>
        </footer>
      )}

      {lookup && sentence ? (
        <SentenceCard
          text={lookup.text}
          rect={lookup.rect}
          onClose={() => setLookup(null)}
        />
      ) : null}
      {lookup && !sentence ? (
        <WordLookupPanel
          text={lookup.text}
          rect={lookup.rect}
          saved={lookupSaved}
          onAdd={addWord}
          onClose={() => setLookup(null)}
        />
      ) : null}
      <WordbookDrawer
        open={wordbookOpen}
        entries={words}
        onClose={() => setWordbookOpen(false)}
        onDelete={removeWord}
      />
      <ShareModal open={share} onClose={() => setShare(false)} title={paper.title} url={shareUrl} />
    </div>
  );
}
