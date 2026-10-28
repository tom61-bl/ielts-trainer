import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import sentences from "../data/sentences.json" with { type: "json" };
import { remoteWorkMarkdown } from "../data/remote-work.ts";
import { parseMarkdownPaper } from "../lib/parseMarkdownPaper.ts";
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

test("translates every sentence of the remote-work passage", () => {
  const first = translateSelection(
    "When offices emptied almost overnight during the early 2020s, few observers expected the change to last.",
    rows,
  );
  assert.equal(first?.zh, "2020 年代初，办公室几乎一夜之间空了，很少有人以为这种变化会留下来。");
  const joined = translateSelection(
    "Geography matters as well. High-speed internet and quiet workspace are not evenly distributed.",
    rows,
  );
  assert.match(joined?.zh ?? "", /地理条件同样要紧/);
  assert.match(joined?.zh ?? "", /并不是到处都有/);
});

test("every passage sentence and exam prompt has a translation", () => {
  const pending: string[] = [];
  function consider(value: unknown) {
    const text = String(value ?? "").replace(/\s+/g, " ").trim();
    if (text.length < 12 || /_{2,}/.test(text)) return;
    if (!translateSelection(text, rows)) pending.push(text);
  }
  for (const file of [
    "data/passages/qingjuan-a1.json",
    "data/passages/qingjuan-a2.json",
    "data/passages/qingjuan-g1.json",
  ]) {
    const data = JSON.parse(readFileSync(new URL(`../${file}`, import.meta.url), "utf8")) as {
      groups?: { title?: string; note?: string }[];
      passages?: { paragraphs?: { text: string }[] }[];
    };
    for (const group of data.groups ?? []) {
      consider(group.title);
      consider(group.note);
    }
    for (const passage of data.passages ?? []) {
      for (const paragraph of passage.paragraphs ?? []) {
        for (const sentence of paragraph.text.split(/(?<=[.!?])\s+(?=[A-Z“"])/)) consider(sentence);
      }
    }
  }
  for (const file of [
    "data/questions/qingjuan-a1.json",
    "data/questions/qingjuan-a2.json",
    "data/questions/qingjuan-g1.json",
  ]) {
    const questions = JSON.parse(readFileSync(new URL(`../${file}`, import.meta.url), "utf8")) as {
      prompt?: string;
      choices?: { text: string }[];
      options?: string[];
    }[];
    for (const question of questions) {
      consider(question.prompt);
      for (const choice of question.choices ?? []) consider(choice.text);
      for (const option of question.options ?? []) consider(option);
    }
  }
  const remote = parseMarkdownPaper(remoteWorkMarkdown, { id: "remote-work", title: "远程办公" });
  for (const group of remote.passages.groups) {
    consider(group.title);
    consider(group.note);
  }
  for (const passage of remote.passages.passages) {
    for (const paragraph of passage.paragraphs) {
      for (const sentence of paragraph.text.split(/(?<=[.!?])\s+(?=[A-Z“"])/)) consider(sentence);
    }
  }
  for (const question of remote.questions) {
    consider(question.prompt);
    for (const choice of question.choices ?? []) consider(choice.text);
    for (const option of question.options ?? []) consider(option);
  }
  assert.deepEqual(pending, []);
});
