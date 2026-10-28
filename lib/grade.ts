import type { GradeResult } from "./types";

export function normalizeAnswer(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[£$,]/g, "")
    .replace(/[.]/g, "")
    .replace(/\s+/g, " ");
}

export function answersMatch(expected: string, given: string) {
  if (!given.trim()) return false;
  const want = normalizeAnswer(given);
  return expected.split("|").some((part) => normalizeAnswer(part) === want);
}

export function gradeAll(
  keys: { id: string; answer: string; explanation: string }[],
  answers: Record<string, string>,
): Record<string, GradeResult> {
  const results: Record<string, GradeResult> = {};
  for (const key of keys) {
    const given = answers[key.id] ?? "";
    results[key.id] = {
      correct: answersMatch(key.answer, given),
      answer: key.answer.split("|")[0],
      explanation: key.explanation,
    };
  }
  return results;
}
