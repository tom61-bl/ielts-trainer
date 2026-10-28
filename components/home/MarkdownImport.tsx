"use client";

import { useState } from "react";
import { Modal } from "../ui/Modal";

const sample = `Passage: 标题
A. 第一段正文。
B. 第二段正文。

Questions 1–2 · Matching Headings
List of Headings
• i. 第一个标题
• ii. 第二个标题
1. Paragraph A ______
2. Paragraph B ______

Questions 3–3 · True / False / Not Given
3. 一句可以判断对错的陈述。

Answers
1. ii — 为什么选这个标题
2. i
3. NOT GIVEN
`;

export function MarkdownImport({
  open,
  onClose,
  onImport,
}: {
  open: boolean;
  onClose: () => void;
  onImport: (source: string) => string | null;
}) {
  const [source, setSource] = useState("");
  const [error, setError] = useState("");

  function submit() {
    const message = onImport(source);
    if (message) {
      setError(message);
      return;
    }
    setSource("");
    setError("");
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="导入 Markdown 阅读">
      <div className="space-y-3 text-sm leading-6">
        <p className="text-muted">
          以 Passage 开头，段落用 A. B. C.，题目用 Questions 1–5。文末可以加 Answers，查答案才会有对错。文件只留在这台浏览器。
        </p>
        <textarea
          className="field min-h-56 font-mono text-xs leading-5"
          value={source}
          placeholder={sample}
          onChange={(event) => setSource(event.target.value)}
        />
        <label className="btn btn-ghost h-10 cursor-pointer">
          选择 .md 文件
          <input
            type="file"
            accept=".md,.markdown,text/markdown,text/plain"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              void file.text().then((text) => {
                setSource(text);
                setError("");
              });
            }}
          />
        </label>
        {error ? <p className="text-wrong">{error}</p> : null}
        <div className="flex gap-2">
          <button type="button" className="btn btn-primary" onClick={submit}>
            导入并放进目录
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => setSource(sample)}>
            填入示例
          </button>
        </div>
      </div>
    </Modal>
  );
}
