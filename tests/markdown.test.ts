import assert from "node:assert/strict";
import test from "node:test";
import { remoteWorkMarkdown } from "../data/remote-work.ts";
import { parseMarkdownPaper } from "../lib/parseMarkdownPaper.ts";
import { answersMatch } from "../lib/grade.ts";

const bundle = parseMarkdownPaper(remoteWorkMarkdown, {
  id: "remote-work",
  title: "远程办公 · 学术类",
  book: 3,
});

test("remote work passage has five labeled paragraphs and twelve questions", () => {
  assert.equal(bundle.passages.passages[0]?.paragraphs.length, 5);
  assert.deepEqual(
    bundle.passages.passages[0]?.paragraphs.map((item) => item.label),
    ["A", "B", "C", "D", "E"],
  );
  assert.equal(bundle.questions.length, 12);
  assert.equal(bundle.questions[0]?.type, "matching");
  assert.equal(bundle.questions[5]?.type, "tfng");
  assert.equal(bundle.questions[9]?.type, "multiple_choice");
  assert.equal(bundle.questions[9]?.choices?.length, 4);
  assert.equal(bundle.keys.length, 12);
});

test("matching headings keep the shared list", () => {
  const choices = bundle.questions[0]?.choices ?? [];
  assert.equal(choices.length, 8);
  assert.equal(choices[1]?.id, "ii");
  assert.match(choices[1]?.text ?? "", /unexpected shift/i);
});

test("answer key accepts either fair heading for paragraph D", () => {
  const row = bundle.keys.find((item) => item.id === "remote-work-R4");
  assert.ok(row);
  assert.equal(answersMatch(row.answer, "v"), true);
  assert.equal(answersMatch(row.answer, "i"), true);
  assert.equal(answersMatch(row.answer, "iii"), false);
});
