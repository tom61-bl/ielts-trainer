"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import { getWritingSample } from "@/lib/keys";
import { readJson, storageKeys, writeJson } from "@/lib/storage";
import type { WritingTask } from "@/lib/types";
import { MemberGate } from "../ui/MemberGate";
import { useToast } from "../ui/Toast";

function countWords(text: string) {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

export function WritingDesk({ tasks }: { tasks: WritingTask[] }) {
  const { user } = useAuth();
  const toast = useToast();
  const [currentId, setCurrentId] = useState(tasks[0]?.id ?? "");
  const task = tasks.find((item) => item.id === currentId) ?? tasks[0];
  const [text, setText] = useState("");
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [sample, setSample] = useState<string | null>(null);
  const [gate, setGate] = useState(false);
  const words = useMemo(() => countWords(text), [text]);

  useEffect(() => {
    if (!task) return;
    setText(readJson(storageKeys.writing(task.id), ""));
    setSample(null);
    setSeconds(0);
    setRunning(false);
  }, [task]);

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [running]);

  function updateText(value: string) {
    setText(value);
    if (task) writeJson(storageKeys.writing(task.id), value);
  }

  function openSample() {
    if (!task) return;
    if (!user?.member) {
      setGate(true);
      return;
    }
    const sampleText = getWritingSample(task.id);
    if (!sampleText) {
      toast("范文没有打开");
      return;
    }
    setSample(sampleText);
  }

  if (!task) return <p>还没有写作题。</p>;
  const minutes = String(Math.floor(seconds / 60)).padStart(2, "0");
  const remain = String(seconds % 60).padStart(2, "0");
  const enough = words >= task.minWords;

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <aside className="space-y-2">
        {tasks.map((item) => (
          <button
            key={item.id}
            className={`w-full rounded-xl border px-3 py-3 text-left ${item.id === task.id ? "border-primary bg-primary-soft" : "border-line bg-surface"}`}
            onClick={() => setCurrentId(item.id)}
          >
            <span className="text-xs text-muted">
              {item.module === "academic" ? "学术类" : "培训类"} · Task {item.task}
            </span>
            <span className="mt-1 block font-medium">{item.title}</span>
          </button>
        ))}
      </aside>
      <section>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-serif text-3xl">{task.title}</h1>
          <span className={`text-sm ${enough ? "text-correct" : "text-muted"}`}>
            {words} / {task.minWords} 词
          </span>
          <button className="btn btn-ghost ml-auto h-10" onClick={() => setRunning((value) => !value)}>
            {running ? `${minutes}:${remain} 暂停` : seconds ? `${minutes}:${remain} 继续` : "开始计时"}
          </button>
        </div>
        <p className="mt-4 whitespace-pre-wrap text-sm leading-7">{task.prompt}</p>
        {task.chart ? (
          <div className="mt-4 rounded-xl border border-line bg-surface p-4">
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
            <ul className="mt-3 flex flex-wrap gap-3 text-xs text-muted">
              {task.chart.series.map((series) => (
                <li key={series.name}>
                  {series.name}: {series.values.join(" / ")} {task.chart?.unit}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {task.steps ? (
          <ol className="mt-4 list-decimal space-y-1 pl-5 text-sm">
            {task.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        ) : null}
        <textarea
          className="field mt-4 min-h-[320px] font-serif leading-7"
          value={text}
          onChange={(event) => updateText(event.target.value)}
          placeholder="在这里写。草稿会留在这台浏览器。"
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <button className="btn btn-accent" onClick={() => void openSample()}>
            看范文
          </button>
          <p className="self-center text-xs text-muted">
            {user?.member ? "会员可见范文。" : "未解锁时会先看到会员说明，草稿不会丢。"}
          </p>
        </div>
        {sample ? (
          <article className="mt-4 whitespace-pre-wrap rounded-xl bg-primary-soft p-4 text-sm leading-7">{sample}</article>
        ) : null}
      </section>
      <MemberGate open={gate} onClose={() => setGate(false)} feature="写作范文" />
    </div>
  );
}
