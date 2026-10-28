"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { GradeResult, Paper, PassageFile, Question, Skill, ViewMode } from "@/lib/types";
import { gradeAll } from "@/lib/grade";
import { useAuth } from "@/lib/auth";
import { getAnswerKeys } from "@/lib/keys";
import { loadPrefs, loadProgress, loadWordbook, readJson, savePrefs, saveProgress, saveWordbook, storageKeys, writeJson } from "@/lib/storage";
import { useToast } from "../ui/Toast";
import { MemberGate } from "../ui/MemberGate";
import { ShareModal } from "../ui/ShareModal";
import { AnswerSheet } from "./AnswerSheet";
import { AudioPlayer, type AudioHandle } from "./AudioPlayer";
import { ComputerPane } from "./ComputerPane";
import { PdfViewer, type PdfHandle } from "./PdfViewer";
import { ViewerToolbar } from "./ViewerToolbar";
import { WordLookupPanel } from "../wordbook/WordLookupPanel";
import { WordbookDrawer } from "../wordbook/WordbookDrawer";
import { SentenceCard } from "./SentenceCard";
import { StudyTools, type StudyTool } from "./StudyTools";
import type { InkColor, InkMark } from "./inkLayer";

export function PaperWorkspace({
  paper,
  questions,
  passages,
}: {
  paper: Paper;
  questions: Question[];
  passages: PassageFile;
}) {
  const toast = useToast();
  const { user, setLoginOpen } = useAuth();
  const pdfRef = useRef<PdfHandle>(null);
  const audioRef = useRef<AudioHandle>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [visited, setVisited] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [skill, setSkill] = useState<Skill>(questions.some((q) => q.skill === "listening") ? "listening" : "reading");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [grade, setGrade] = useState<Record<string, GradeResult> | null>(null);
  const [page, setPage] = useState(1);
  const [scale, setScale] = useState(1);
  const [mode, setMode] = useState<ViewMode>(paper.testType);
  const [followId, setFollowId] = useState<string | null>(null);
  const [gate, setGate] = useState<string | null>(null);
  const [share, setShare] = useState(false);
  const [wordbookOpen, setWordbookOpen] = useState(false);
  const [mobilePanel, setMobilePanel] = useState<"sheet" | "audio" | "words" | null>(null);
  const [words, setWords] = useState<ReturnType<typeof loadWordbook>>([]);
  const [desktop, setDesktop] = useState(false);
  const [lookup, setLookup] = useState<{ text: string; rect: DOMRect } | null>(null);
  const [shareUrl, setShareUrl] = useState("");
  const [tool, setTool] = useState<StudyTool>("lookup");
  const [inkColor, setInkColor] = useState<InkColor>("sun");
  const [erasing, setErasing] = useState(false);
  const [marks, setMarks] = useState<InkMark[]>([]);

  useEffect(() => {
    const progress = loadProgress(paper.id);
    setAnswers(progress.answers);
    setVisited(progress.visited);
    setScale(loadPrefs().scale || 1);
    setShareUrl(window.location.href);
    setWords(loadWordbook());
    setMarks(readJson<InkMark[]>(storageKeys.ink(paper.id), []));
    const media = window.matchMedia("(min-width: 1024px)");
    const apply = () => setDesktop(media.matches);
    apply();
    media.addEventListener("change", apply);
    setReady(true);
    return () => media.removeEventListener("change", apply);
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
    setHighlightId(id);
    window.setTimeout(() => setHighlightId((current) => (current === id ? null : current)), 1500);
    if (mode === "paper") await pdfRef.current?.scrollToQuestion(id);
    else document.getElementById(`computer-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    if (question.skill === "listening" && question.audioAnchor != null) {
      audioRef.current?.seek(question.audioAnchor);
    }
  }

  function gradePaper() {
    if (!user?.member) {
      setGate("对答案");
      return;
    }
    const keys = getAnswerKeys(paper.id);
    if (!keys) {
      toast("这套卷还没有答案");
      return;
    }
    setGrade(gradeAll(keys, answers));
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

  function markText(text: string, page: number, surface: InkMark["surface"]) {
    const clean = text.replace(/\s+/g, " ").trim();
    if (clean.length < 2) return;
    setMarks((current) => {
      if (erasing) {
        return current.filter(
          (mark) =>
            !(
              mark.surface === surface &&
              mark.page === page &&
              (clean.includes(mark.text) || mark.text.includes(clean))
            ),
        );
      }
      if (current.some((mark) => mark.text === clean && mark.page === page && mark.surface === surface)) return current;
      return [...current, { id: crypto.randomUUID(), page, text: clean, color: inkColor, surface }].slice(-200);
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

  const sentence = Boolean(
    lookup && (tool === "translate" || lookup.text.trim().split(/\s+/).length >= 4),
  );

  return (
    <div ref={rootRef} className="flex h-[100dvh] flex-col bg-bg">
      <ViewerToolbar
        className="hidden lg:flex"
        title={paper.title}
        page={page}
        pages={paper.pages}
        scale={scale}
        mode={mode}
        onBackHref="/ielts"
        onPage={(next) => pdfRef.current?.goToPage(next)}
        onScale={(next) => {
          setScale(next);
          savePrefs({ ...loadPrefs(), scale: next });
        }}
        onMode={setMode}
        onFullscreen={() => {
          if (document.fullscreenElement) void document.exitFullscreen();
          else void rootRef.current?.requestFullscreen();
        }}
        onShare={() => setShare(true)}
      />
      <StudyTools
        tool={tool}
        color={inkColor}
        erasing={erasing}
        onTool={(next) => {
          setTool(next);
          setErasing(false);
          setLookup(null);
        }}
        onColor={(next) => {
          setInkColor(next);
          setErasing(false);
        }}
        onErase={() => {
          setTool("ink");
          setErasing(true);
        }}
        onClear={() => setMarks([])}
      />
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <div className="min-h-0 min-w-0 flex-1">
          {mode === "paper" ? (
            <PdfViewer
              ref={pdfRef}
              url={paper.pdfUrl}
              scale={scale}
              questions={questions}
              answers={answers}
              activeId={activeId}
              highlightId={highlightId}
              grade={grade}
              onPage={setPage}
              onOpen={(id) => void selectQuestion(id)}
              onChange={(id, value) => setAnswers((current) => ({ ...current, [id]: value }))}
              onSelectText={(text, rect) => setLookup({ text, rect })}
              tool={tool}
              marks={marks}
              onInk={(text, page) => markText(text, page, "paper")}
            />
          ) : (
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
              onInk={(text, page) => markText(text, page, "computer")}
            />
          )}
        </div>
        {desktop ? (
        <aside className="flex min-h-0 w-full shrink-0 flex-col border-l border-line bg-surface lg:h-auto lg:w-[340px]">
          <AudioPlayer
            ref={audioRef}
            src={paper.audioUrl}
            sections={paper.audioSections ?? []}
            activeSection={activeSection}
            onTime={followTime}
          />
          {sheet}
          <div className="flex flex-wrap gap-2 border-t border-line p-3">
            <button className="btn btn-accent h-10" onClick={() => void gradePaper()}>
              对答案
            </button>
            <button className="btn btn-ghost h-10" onClick={() => setWordbookOpen(true)}>
              生词本
            </button>
            <button
              className="btn btn-text h-10"
              onClick={() => {
                if (!user) {
                  setLoginOpen(true);
                  return;
                }
                toast("已保存在本机。跨设备同步还没有接通。");
              }}
            >
              云同步
            </button>
          </div>
        </aside>
        ) : null}
      </div>

      <div className="sticky bottom-0 z-30 border-t border-line bg-surface lg:hidden">
        <ViewerToolbar
          title={paper.title}
          page={page}
          pages={paper.pages}
          scale={scale}
          mode={mode}
          onBackHref="/ielts"
          onPage={(next) => pdfRef.current?.goToPage(next)}
          onScale={(next) => {
            setScale(next);
            savePrefs({ ...loadPrefs(), scale: next });
          }}
          onMode={setMode}
          onFullscreen={() => {
            if (document.fullscreenElement) void document.exitFullscreen();
            else void rootRef.current?.requestFullscreen();
          }}
          onShare={() => setShare(true)}
        />
        <div className="flex gap-2 overflow-x-auto px-3 py-2">
          <button className="btn btn-ghost h-10" onClick={() => setMobilePanel(mobilePanel === "sheet" ? null : "sheet")}>
            答题卡
          </button>
          <button className="btn btn-ghost h-10" onClick={() => setMobilePanel(mobilePanel === "audio" ? null : "audio")}>
            听力
          </button>
          <button className="btn btn-accent h-10" onClick={() => void gradePaper()}>
            对答案
          </button>
          <button className="btn btn-ghost h-10" onClick={() => setWordbookOpen(true)}>
            生词
          </button>
        </div>
        {!desktop && mobilePanel ? (
          <div className="max-h-[50vh] overflow-hidden border-t border-line">
            {mobilePanel === "audio" ? (
              <AudioPlayer
                ref={audioRef}
                src={paper.audioUrl}
                sections={paper.audioSections ?? []}
                activeSection={activeSection}
                onTime={followTime}
              />
            ) : (
              sheet
            )}
          </div>
        ) : null}
      </div>

      {lookup && sentence ? (
        <SentenceCard
          text={lookup.text}
          rect={lookup.rect}
          member={Boolean(user?.member)}
          onClose={() => setLookup(null)}
        />
      ) : null}
      {lookup && !sentence ? (
        <WordLookupPanel
          text={lookup.text}
          rect={lookup.rect}
          member={Boolean(user?.member)}
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
      <MemberGate open={Boolean(gate)} onClose={() => setGate(null)} feature={gate ?? ""} />
      <ShareModal open={share} onClose={() => setShare(false)} title={paper.title} url={shareUrl} />
    </div>
  );
}
