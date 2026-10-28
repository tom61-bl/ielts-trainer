import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { isContentAddressed } from "../lib/content.ts";

const papers = JSON.parse(readFileSync(new URL("../data/papers.json", import.meta.url), "utf8"));

test("three original papers are content addressed", () => {
  assert.equal(papers.length, 3);
  for (const paper of papers) {
    assert.equal(paper.source, "original-mock");
    assert.equal(paper.visibility, "public");
    assert.equal(isContentAddressed(paper.pdfUrl.split("?")[0] + (paper.pdfUrl.includes("?") ? `?${paper.pdfUrl.split("?")[1]}` : "")), true);
    assert.ok(isContentAddressed(paper.pdfUrl));
    assert.ok(paper.audioUrl && isContentAddressed(paper.audioUrl));
    const questions = JSON.parse(
      readFileSync(new URL(`../data/questions/${paper.id}.json`, import.meta.url), "utf8"),
    );
    const listening = questions.filter((item: { skill: string }) => item.skill === "listening");
    const reading = questions.filter((item: { skill: string }) => item.skill === "reading");
    assert.equal(listening.length, 40);
    assert.equal(reading.length, 40);
    assert.ok(listening.every((item: { audioAnchor?: number; page: number }) => item.page > 0 && item.audioAnchor != null));
    assert.equal(
      questions.some((item: { answer?: string }) => "answer" in item),
      false,
    );
  }
});
