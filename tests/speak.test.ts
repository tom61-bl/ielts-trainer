import assert from "node:assert/strict";
import test from "node:test";
import { pickEnglishVoice, speakableWord } from "../lib/speak.ts";

test("prefers a British English voice", () => {
  const voice = pickEnglishVoice([
    { lang: "zh-CN", name: "Ting" },
    { lang: "en-US", name: "Samantha" },
    { lang: "en-GB", name: "Daniel" },
  ]);
  assert.equal(voice?.name, "Daniel");
});

test("falls back to any English voice", () => {
  const voice = pickEnglishVoice([{ lang: "en-US", name: "Samantha" }]);
  assert.equal(voice?.name, "Samantha");
});

test("strips punctuation before a word is spoken", () => {
  assert.equal(speakableWord("lockdowns,"), "lockdowns");
  assert.equal(speakableWord("face-to-face"), "face-to-face");
});
