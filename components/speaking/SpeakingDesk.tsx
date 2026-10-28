"use client";

import { useEffect, useRef, useState } from "react";
import { readJson, storageKeys, writeJson } from "@/lib/storage";
import type { SpeakingPrompt } from "@/lib/types";

const criteria = [
  ["fluency", "流利"],
  ["lexical", "词汇"],
  ["grammar", "语法"],
  ["pronunciation", "发音"],
] as const;

type Scores = Record<(typeof criteria)[number][0], number>;

export function SpeakingDesk({ prompts }: { prompts: SpeakingPrompt[] }) {
  const [currentId, setCurrentId] = useState(prompts.find((item) => item.part === 2)?.id ?? prompts[0]?.id ?? "");
  const prompt = prompts.find((item) => item.id === currentId) ?? prompts[0];
  const [prep, setPrep] = useState(60);
  const [speak, setSpeak] = useState(120);
  const [phase, setPhase] = useState<"idle" | "prep" | "speak">("idle");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scores, setScores] = useState<Scores>({ fluency: 0, lexical: 0, grammar: 0, pronunciation: 0 });
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);

  useEffect(() => {
    setPhase("idle");
    setPrep(60);
    setSpeak(120);
    setAudioUrl(null);
    setError(null);
    if (prompt) {
      setScores(
        readJson(storageKeys.speaking(prompt.id), {
          fluency: 0,
          lexical: 0,
          grammar: 0,
          pronunciation: 0,
        }),
      );
    }
  }, [prompt]);

  useEffect(() => {
    if (phase === "idle") return;
    const timer = window.setInterval(() => {
      if (phase === "prep") {
        setPrep((value) => {
          if (value <= 1) {
            setPhase("speak");
            return 0;
          }
          return value - 1;
        });
      } else {
        setSpeak((value) => {
          if (value <= 1) {
            stop();
            return 0;
          }
          return value - 1;
        });
      }
    }, 1000);
    return () => window.clearInterval(timer);
  }, [phase]);

  async function start() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const media = new MediaRecorder(stream);
      chunks.current = [];
      media.ondataavailable = (event) => {
        if (event.data.size) chunks.current.push(event.data);
      };
      media.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(chunks.current, { type: media.mimeType || "audio/webm" });
        setAudioUrl(URL.createObjectURL(blob));
        setPhase("idle");
      };
      recorder.current = media;
      media.start();
      if (prompt?.part === 2) setPhase("prep");
      else setPhase("speak");
    } catch {
      setError("没有拿到麦克风。检查浏览器权限后再试。");
    }
  }

  function stop() {
    if (recorder.current && recorder.current.state !== "inactive") recorder.current.stop();
    else setPhase("idle");
  }

  function setScore(key: Scores[keyof Scores] extends number ? keyof Scores : never, value: number) {
    if (!prompt) return;
    const next = { ...scores, [key]: value };
    setScores(next);
    writeJson(storageKeys.speaking(prompt.id), next);
  }

  if (!prompt) return null;
  const parts = [1, 2, 3] as const;

  return (
    <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
      <div>
        {parts.map((part) => (
          <div key={part} className="mb-4">
            <p className="text-xs text-muted">Part {part}</p>
            <div className="mt-2 space-y-2">
              {prompts
                .filter((item) => item.part === part)
                .map((item) => (
                  <button
                    key={item.id}
                    className={`w-full rounded-xl border px-3 py-2 text-left text-sm ${item.id === prompt.id ? "border-primary bg-primary-soft" : "border-line bg-surface"}`}
                    onClick={() => setCurrentId(item.id)}
                  >
                    {item.topic}
                  </button>
                ))}
            </div>
          </div>
        ))}
      </div>
      <section className="rounded-2xl border border-line bg-surface p-5">
        <p className="text-xs tracking-[0.16em] text-accent">PART {prompt.part}</p>
        <h1 className="mt-2 font-serif text-3xl">{prompt.topic}</h1>
        <p className="mt-4 font-serif text-xl leading-8">{prompt.prompt}</p>
        {prompt.points ? (
          <ul className="mt-4 list-disc space-y-1 pl-5 text-sm">
            {prompt.points.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        ) : null}
        {prompt.questions ? (
          <ol className="mt-4 list-decimal space-y-2 pl-5">
            {prompt.questions.map((question) => (
              <li key={question}>{question}</li>
            ))}
          </ol>
        ) : null}
        {prompt.part === 2 ? (
          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-primary-soft p-4">
              <p className="text-xs text-muted">准备</p>
              <p className="font-serif text-4xl">{prep}s</p>
            </div>
            <div className="rounded-xl bg-bg p-4">
              <p className="text-xs text-muted">作答</p>
              <p className="font-serif text-4xl">{speak}s</p>
            </div>
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted">直接录音即可。Part 2 会先给 60 秒准备。</p>
        )}
        {error ? <p className="mt-3 text-sm text-wrong">{error}</p> : null}
        <div className="mt-4 flex flex-wrap gap-2">
          {phase === "idle" ? (
            <button className="btn btn-primary" onClick={() => void start()}>
              开始录音
            </button>
          ) : (
            <>
              <button className="btn btn-accent" onClick={stop}>
                结束
              </button>
              {phase === "prep" ? (
                <button className="btn btn-ghost" onClick={() => setPhase("speak")}>
                  跳过准备
                </button>
              ) : null}
            </>
          )}
        </div>
        {audioUrl ? (
          <div className="mt-4">
            <p className="text-sm text-muted">录音只留在这次打开的页面里，刷新后需要重录。</p>
            <audio className="mt-2 w-full" controls src={audioUrl} />
          </div>
        ) : null}
        <div className="mt-6">
          <p className="text-sm font-medium">自评</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {criteria.map(([key, label]) => (
              <label key={key} className="text-sm">
                {label}
                <input
                  className="mt-1 w-full accent-[var(--primary)]"
                  type="range"
                  min={0}
                  max={9}
                  step={1}
                  value={scores[key]}
                  onChange={(event) => setScore(key, Number(event.target.value))}
                />
                <span className="text-muted">{scores[key] || "未打"} / 9</span>
              </label>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
