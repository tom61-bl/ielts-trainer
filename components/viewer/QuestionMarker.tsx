"use client";

import type { GradeResult, Question } from "@/lib/types";
import { AnswerControl } from "./AnswerControl";

export function QuestionMarker({
  question,
  active,
  hot,
  value,
  result,
  onOpen,
  onChange,
}: {
  question: Question;
  active: boolean;
  hot: boolean;
  value: string;
  result?: GradeResult;
  onOpen: () => void;
  onChange: (value: string) => void;
}) {
  const state = result ? (result.correct ? "bg-correct text-white" : "bg-wrong text-white") : value ? "bg-primary text-white" : "bg-white text-ink";

  return (
    <div className="absolute left-2 z-[4] -translate-y-1/2" style={{ top: `${question.y * 100}%` }}>
      <button
        id={`marker-${question.id}`}
        className={`grid h-7 min-w-7 place-items-center rounded-full border border-line px-1 text-xs shadow ${state} ${hot ? "q-hot" : ""}`}
        onClick={onOpen}
        aria-label={`第 ${question.qnum} 题`}
      >
        {question.qnum}
      </button>
      {active ? (
        <div className="absolute left-9 top-0 w-64 rounded-xl border border-line bg-surface p-3 text-ink shadow-[var(--shadow)]">
          <p className="mb-2 text-xs text-muted">
            {question.skill === "listening" ? "听力" : "阅读"} · 第 {question.qnum} 题
          </p>
          <AnswerControl question={question} value={value} onChange={onChange} result={result} />
        </div>
      ) : null}
    </div>
  );
}
