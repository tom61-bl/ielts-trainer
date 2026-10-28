export interface SentenceRow {
  en: string;
  zh: string;
}

export function normalizeSentence(value: string) {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
}

export function translateSelection(text: string, rows: SentenceRow[]) {
  const needle = normalizeSentence(text);
  if (needle.length < 12) return null;
  const indexed = rows
    .map((row) => ({ row, hay: normalizeSentence(row.en) }))
    .filter((item) => item.hay.length >= 12);

  const contained = indexed
    .filter((item) => needle.includes(item.hay))
    .sort((a, b) => needle.indexOf(a.hay) - needle.indexOf(b.hay));
  const kept = contained.filter(
    (item) => !contained.some((other) => other.hay !== item.hay && other.hay.includes(item.hay)),
  );
  if (kept.length) {
    return {
      en: kept.map((item) => item.row.en).join(" "),
      zh: kept.map((item) => item.row.zh).join(""),
    };
  }

  const host = indexed
    .filter((item) => item.hay.includes(needle))
    .sort((a, b) => a.hay.length - b.hay.length)[0];
  if (!host) return null;
  return { en: host.row.en, zh: host.row.zh };
}
