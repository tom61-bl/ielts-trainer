"use client";

import type { GradeResult, Question, Skill } from "@/lib/types";

const skillLabel: Record<Skill, string> = {
  listening: "听力",
  reading: "阅读",
  writing: "写作",
  speaking: "口语",
};

export function AnswerSheet({
  questions,
  skill,
  onSkill,
  answers,
  visited,
  activeId,
  followId,
  grade,
  onSelect,
}: {
  questions: Question[];
  skill: Skill;
  onSkill: (skill: Skill) => void;
  answers: Record<string, string>;
  visited: string[];
  activeId: string | null;
  followId: string | null;
  grade: Record<string, GradeResult> | null;
  onSelect: (id: string) => void;
}) {
  const skills = [...new Set(questions.map((question) => question.skill))];
  const visible = questions.filter((question) => question.skill === skill);
  const sections = [...new Set(visible.map((question) => question.section))];
  const answered = visible.filter((question) => answers[question.id]?.trim()).length;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex gap-2 border-b border-line px-3 py-2">
        {skills.map((item) => (
          <button
            key={item}
            className={`btn h-10 px-3 text-sm ${item === skill ? "btn-primary" : "btn-ghost"}`}
            onClick={() => onSkill(item)}
          >
            {skillLabel[item]}
          </button>
        ))}
      </div>
      <p className="px-3 pt-3 text-xs text-muted">
        已答 {answered} / {visible.length}
      </p>
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-3 py-3">
        {sections.map((section) => {
          const group = visible.filter((question) => question.section === section);
          return (
            <div key={section}>
              <p className="mb-2 text-xs text-muted">
                {skillLabel[skill]} Section {section}
              </p>
              <div className="grid grid-cols-5 gap-1.5">
                {group.map((question) => {
                  const result = grade?.[question.id];
                  const filled = Boolean(answers[question.id]?.trim());
                  const seen = visited.includes(question.id);
                  const color = result
                    ? result.correct
                      ? "bg-correct text-white border-correct"
                      : "bg-wrong text-white border-wrong"
                    : filled
                      ? "bg-primary text-white border-primary"
                      : seen
                        ? "bg-primary-soft border-primary text-primary"
                        : "bg-surface border-line";
                  const ring =
                    activeId === question.id || followId === question.id ? "ring-2 ring-accent" : "";
                  return (
                    <button
                      key={question.id}
                      className={`h-10 rounded-lg border text-sm ${color} ${ring}`}
                      onClick={() => onSelect(question.id)}
                    >
                      {question.qnum}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
