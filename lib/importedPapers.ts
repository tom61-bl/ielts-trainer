"use client";

import { parseMarkdownPaper, type MarkdownBundle } from "./parseMarkdownPaper";
import { readJson, storageKeys, writeJson } from "./storage";

interface StoredMarkdownPaper extends MarkdownBundle {
  ownerId: string;
  createdAt: number;
}

function readAll() {
  return readJson<StoredMarkdownPaper[]>(storageKeys.markdownPapers, []);
}

export function listImportedPapers(ownerId: string) {
  return readAll().filter((item) => item.ownerId === ownerId);
}

export function loadImportedPaper(id: string) {
  return readAll().find((item) => item.paper.id === id) ?? null;
}

export function saveImportedMarkdown(ownerId: string, source: string) {
  const id = `md-${crypto.randomUUID()}`;
  const bundle = parseMarkdownPaper(source, { id, ownerId });
  const row: StoredMarkdownPaper = { ...bundle, ownerId, createdAt: Date.now() };
  writeJson(storageKeys.markdownPapers, [row, ...readAll().filter((item) => item.paper.id !== id)]);
  return row;
}

export function removeImportedPaper(id: string) {
  writeJson(
    storageKeys.markdownPapers,
    readAll().filter((item) => item.paper.id !== id),
  );
}
