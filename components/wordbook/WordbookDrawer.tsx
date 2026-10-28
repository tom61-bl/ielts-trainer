"use client";

import { useMemo, useState } from "react";
import { X } from "lucide-react";
import type { WordEntry } from "@/lib/types";

function download(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function WordbookDrawer({
  open,
  entries,
  onClose,
  onDelete,
}: {
  open: boolean;
  entries: WordEntry[];
  onClose: () => void;
  onDelete: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return entries;
    return entries.filter((entry) =>
      `${entry.word} ${entry.context} ${entry.source}`.toLowerCase().includes(needle),
    );
  }, [entries, query]);

  if (!open) return null;

  function exportCsv() {
    const lines = [
      "word,ipa,meaning,context,source,createdAt",
      ...entries.map((entry) =>
        [entry.word, entry.ipa ?? "", entry.meaning ?? "", entry.context, entry.source, new Date(entry.createdAt).toISOString()]
          .map((cell) => `"${cell.replaceAll('"', '""')}"`)
          .join(","),
      ),
    ];
    download("wordbook.csv", `\uFEFF${lines.join("\n")}`, "text/csv;charset=utf-8");
  }

  function exportAnki() {
    const lines = entries.map(
      (entry) => `${entry.word}\t${entry.ipa ?? ""}\t${entry.meaning ?? ""}\t${entry.context}`,
    );
    download("wordbook-anki.txt", lines.join("\n"), "text/plain;charset=utf-8");
  }

  return (
    <aside className="fixed inset-0 z-50 flex justify-end bg-black/45 sm:bg-black/20">
      <button className="hidden flex-1 sm:block" aria-label="关闭生词本" onClick={onClose} />
      <div className="flex h-full w-full flex-col bg-surface sm:max-w-md sm:border-l sm:border-line">
        <div className="flex items-center justify-between border-b border-line px-4 py-2">
          <h2 className="font-medium">生词本</h2>
          <button className="btn btn-text h-11 w-11 px-0" onClick={onClose} aria-label="关闭">
            <X size={18} />
          </button>
        </div>
        <div className="flex gap-2 px-4 py-3">
          <input
            className="field"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索单词或原句"
          />
        </div>
        <div className="flex gap-2 px-4">
          <button className="btn btn-ghost h-10" onClick={exportCsv} disabled={!entries.length}>
            导出 CSV
          </button>
          <button className="btn btn-ghost h-10" onClick={exportAnki} disabled={!entries.length}>
            导出 Anki
          </button>
        </div>
        <div className="mt-3 min-h-0 flex-1 overflow-auto px-4 pb-6">
          {filtered.length === 0 ? (
            <p className="text-sm leading-7 text-muted">
              {entries.length === 0 ? "还没有生词。在试卷里选中单词，再点加入生词本。" : "没有匹配的词。"}
            </p>
          ) : (
            <ul className="space-y-3">
              {filtered.map((entry) => (
                <li key={entry.id} className="rounded-xl border border-line p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-serif text-lg">{entry.word}</p>
                      {entry.ipa ? <p className="text-xs text-muted">{entry.ipa}</p> : null}
                      {entry.meaning ? <p className="mt-1 text-sm">{entry.meaning}</p> : null}
                    </div>
                    <button className="btn btn-text h-10" onClick={() => onDelete(entry.id)}>
                      删除
                    </button>
                  </div>
                  {entry.context ? <p className="mt-2 text-sm leading-6 text-muted">{entry.context}</p> : null}
                  <p className="mt-2 text-xs text-muted">
                    {entry.source} · {new Date(entry.createdAt).toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </aside>
  );
}
