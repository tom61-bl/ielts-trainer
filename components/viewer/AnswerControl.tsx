"use client";

import type { GradeResult, Question } from "@/lib/types";

export function AnswerControl({
  question,
  value,
  onChange,
  result,
}: {
  question: Question;
  value: string;
  onChange: (value: string) => void;
  result?: GradeResult;
}) {
  const choices = question.choices;
  const options = question.options ?? [];
  const showButtons = question.type === "tfng" || question.type === "multiple_choice" || question.type === "matching";

  return (
    <div>
      {question.prompt ? <p className="mb-2 text-sm leading-6">{question.prompt}</p> : null}
      {showButtons ? (
        <div className="flex flex-col gap-1.5">
          {(choices ?? options.map((id) => ({ id, text: id }))).map((choice) => {
            const selected = value === choice.id;
            return (
              <button
                key={choice.id}
                type="button"
                onClick={() => onChange(choice.id)}
                className={`rounded-lg border px-3 py-2 text-left text-sm ${selected ? "border-primary bg-primary-soft" : "border-line"}`}
              >
                <span className="mr-2 font-medium">{choice.id}</span>
                {choice.text !== choice.id ? choice.text : null}
              </button>
            );
          })}
        </div>
      ) : (
        <input
          className="field"
          value={value}
          aria-label={`第 ${question.qnum} 题答案`}
          onChange={(event) => onChange(event.target.value)}
          placeholder="写下答案"
        />
      )}
      {result ? (
        <div className={`mt-2 rounded-lg px-3 py-2 text-sm leading-6 ${result.correct ? "bg-correct/10 text-correct" : "bg-wrong/10 text-wrong"}`}>
          <p>{result.correct ? "正确" : `参考答案：${result.answer}`}</p>
          <p className="mt-1 text-ink">{result.explanation}</p>
        </div>
      ) : null}
    </div>
  );
}
