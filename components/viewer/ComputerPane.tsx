"use client";

import { useState } from "react";
import type { GradeResult, PassageFile, Question, Skill } from "@/lib/types";
import { AnswerControl } from "./AnswerControl";
import { paintPlain, type InkMark } from "./inkLayer";
import type { StudyTool } from "./StudyTools";

export function ComputerPane({
  file,
  questions,
  skill,
  answers,
  grade,
  activeId,
  onChange,
  onSelectText,
  tool = "lookup",
  marks = [],
  onInk,
}: {
  file: PassageFile;
  questions: Question[];
  skill: Skill;
  answers: Record<string, string>;
  grade: Record<string, GradeResult> | null;
  activeId: string | null;
  onChange: (id: string, value: string) => void;
  onSelectText: (text: string, rect: DOMRect) => void;
  tool?: StudyTool;
  marks?: InkMark[];
  onInk?: (text: string, page: number) => void;
}) {
  const passages = file.passages;
  const [section, setSection] = useState(passages[0]?.section ?? 1);
  const passage = passages.find((item) => item.section === section) ?? passages[0];
  const visible = questions.filter((question) => question.skill === skill);
  const groups = file.groups.filter((group) => group.skill === skill);

  function onMouseUp() {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;
    const text = selection.toString().replace(/\s+/g, " ").trim();
    if (!text || text.length > 500) return;
    if (tool === "ink") {
      onInk?.(text, passage?.section ?? 1);
      selection.removeAllRanges();
      return;
    }
    onSelectText(text, selection.getRangeAt(0).getBoundingClientRect());
  }

  return (
    <div className="computer-board grid h-full min-h-0 lg:grid-cols-2">
      <div className={`min-h-0 overflow-auto border-b border-line p-5 lg:border-b-0 lg:border-r ${tool === "ink" ? "ink-on" : ""}`} onMouseUp={onMouseUp}>
        {skill === "reading" && passage ? (
          <>
            <div className="mb-4 flex flex-wrap gap-2">
              {passages.map((item) => (
                <button
                  key={item.section}
                  className={`btn h-10 px-3 text-sm ${item.section === passage.section ? "btn-primary" : "btn-ghost"}`}
                  onClick={() => setSection(item.section)}
                >
                  Passage {item.section}
                </button>
              ))}
            </div>
            <h2 className="font-serif text-2xl leading-snug">{passage.title}</h2>
            <div className="mt-4 space-y-4 font-serif text-[17px] leading-8">
              {passage.paragraphs.map((paragraph, index) => (
                <p key={`${paragraph.label}-${index}`}>
                  {paragraph.label ? <strong className="mr-2">{paragraph.label}</strong> : null}
                  {paintPlain(
                    paragraph.text,
                    marks.filter((mark) => mark.surface === "computer"),
                  ).map((part, index) =>
                    part.color ? (
                      <mark key={`${part.id}-${index}`} className={`passage-ink ink-${part.color}`}>
                        {part.text}
                      </mark>
                    ) : (
                      <span key={`t-${index}`}>{part.text}</span>
                    ),
                  )}
                </p>
              ))}
            </div>
          </>
        ) : (
          <div>
            <h2 className="font-serif text-2xl">听力作答</h2>
            <p className="mt-3 text-sm leading-7 text-muted">
              录音在侧栏。点题号会把播放跳到那一句。这里不放原文，避免提前看到答案。
            </p>
          </div>
        )}
      </div>
      <div className="min-h-0 overflow-auto p-5">
        {groups
          .filter((group) => /\d+\s*[–-]\s*\d+/.test(group.title))
          .map((group) => {
            const groupQuestions = visible.filter((question) => {
              if (question.section !== group.section) return false;
              const match = group.title.match(/(\d+)\s*[–-]\s*(\d+)/);
              if (!match) return group.title.startsWith("Section") || group.title.startsWith("Reading") || group.title.startsWith("Passage");
              const start = Number(match[1]);
              const end = Number(match[2]);
              return question.qnum >= start && question.qnum <= end;
            });
            if (!groupQuestions.length && !group.title.match(/\d/)) return null;
            return (
              <section key={`${group.section}-${group.title}`} className="mb-6">
                <h3 className="font-medium">{group.title}</h3>
                {group.note ? <p className="mt-1 text-sm text-muted">{group.note}</p> : null}
                <div className="mt-3 space-y-4">
                  {groupQuestions.map((question) => (
                    <div
                      key={question.id}
                      id={`computer-${question.id}`}
                      className={`rounded-xl border p-3 ${activeId === question.id ? "border-accent" : "border-line"}`}
                    >
                      <AnswerControl
                        question={question}
                        value={answers[question.id] ?? ""}
                        onChange={(value) => onChange(question.id, value)}
                        result={grade?.[question.id]}
                      />
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
      </div>
    </div>
  );
}
