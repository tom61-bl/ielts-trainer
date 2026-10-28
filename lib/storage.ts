import type { PaperProgress, Prefs, WordEntry } from "./types";

export const storageKeys = {
  progress: (paperId: string) => `ielts:progress:${paperId}`,
  wordbook: "ielts:wordbook",
  prefs: "ielts:prefs",
  invite: "ielts:invite_from",
  users: "ielts:users",
  session: "ielts:session",
  privatePapers: "ielts:private-papers",
  writing: (taskId: string) => `ielts:writing:${taskId}`,
  speaking: (promptId: string) => `ielts:speaking:${promptId}`,
  ink: (paperId: string) => `ielts:ink:${paperId}`,
};

const defaultPrefs: Prefs = { theme: "light", scale: 1 };

export function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeJson(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function loadPrefs(): Prefs {
  return { ...defaultPrefs, ...readJson<Partial<Prefs>>(storageKeys.prefs, {}) };
}

export function savePrefs(prefs: Prefs) {
  writeJson(storageKeys.prefs, prefs);
}

export function loadProgress(paperId: string): PaperProgress {
  return readJson(storageKeys.progress(paperId), {
    answers: {},
    visited: [],
    updatedAt: 0,
  });
}

export function saveProgress(paperId: string, progress: PaperProgress) {
  writeJson(storageKeys.progress(paperId), progress);
}

export function loadWordbook(): WordEntry[] {
  return readJson<WordEntry[]>(storageKeys.wordbook, []);
}

export function saveWordbook(entries: WordEntry[]) {
  writeJson(storageKeys.wordbook, entries);
}

export function setCookie(name: string, value: string, days: number) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${Math.round(days * 86400)}; samesite=lax`;
}

export function clearCookie(name: string) {
  document.cookie = `${name}=; path=/; max-age=0; samesite=lax`;
}
