import assert from "node:assert/strict";
import test from "node:test";
import sentences from "../data/sentences.json" with { type: "json" };
import { translateSelection, type SentenceRow } from "../lib/translate.ts";

const rows = sentences as SentenceRow[];

test("matches one sentence inside a longer selection", () => {
  const hit = translateSelection(
    "The marshes are not a park. There is no cafe, and the hide has no glass, only a slot at sitting height.",
    rows,
  );
  assert.ok(hit);
  assert.match(hit.zh, /盐沼不是公园/);
  assert.match(hit.zh, /没有咖啡馆/);
});

test("uses the tightest sentence when the selection is a fragment", () => {
  const hit = translateSelection("Brass costs more, but it holds a hairline and does not soften in a warm studio.", rows);
  assert.equal(hit?.zh, "黄铜更贵，但细线站得住，暖和的工作室里也不会发软。");
});

test("ignores a scrap that is too short to be a sentence", () => {
  assert.equal(translateSelection("brass", rows), null);
});
