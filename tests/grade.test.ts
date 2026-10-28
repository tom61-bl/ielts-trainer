import assert from "node:assert/strict";
import test from "node:test";
import { answersMatch, gradeAll, normalizeAnswer } from "../lib/grade.ts";

test("normalize collapses case and spacing", () => {
  assert.equal(normalizeAnswer("  Clay   and Glazes "), "clay and glazes");
});

test("accepts any listed alternative", () => {
  assert.equal(answersMatch("86|86 pounds", "86 pounds"), true);
  assert.equal(answersMatch("Hartley", "hartley"), true);
  assert.equal(answersMatch("TRUE", ""), false);
  assert.equal(answersMatch("4:30|4.30", "4.30"), true);
});

test("gradeAll marks blanks incorrect", () => {
  const results = gradeAll(
    [{ id: "q", answer: "B", explanation: "because" }],
    { q: "A" },
  );
  assert.equal(results.q.correct, false);
  assert.equal(results.q.answer, "B");
});
