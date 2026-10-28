export type InkColor = "sun" | "rose" | "mint" | "sky";

export interface InkMark {
  id: string;
  page: number;
  text: string;
  color: InkColor;
  surface: "paper" | "computer";
}

export const inkColors: { id: InkColor; label: string }[] = [
  { id: "sun", label: "黄" },
  { id: "rose", label: "粉" },
  { id: "mint", label: "绿" },
  { id: "sky", label: "蓝" },
];

interface FlatChar {
  node: Text;
  offset: number;
}

function buildFlat(root: HTMLElement) {
  const chars: FlatChar[] = [];
  let flat = "";
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let current = walker.nextNode();
  while (current) {
    const text = current as Text;
    for (let index = 0; index < text.data.length; index += 1) {
      const char = text.data[index];
      if (/\s/.test(char)) {
        if (flat.length && !flat.endsWith(" ")) {
          flat += " ";
          chars.push({ node: text, offset: index });
        }
        continue;
      }
      flat += char;
      chars.push({ node: text, offset: index });
    }
    current = walker.nextNode();
  }
  return { flat, chars };
}

function unwrap(root: HTMLElement) {
  for (const mark of [...root.querySelectorAll("mark.ink-mark")]) {
    const parent = mark.parentNode;
    if (!parent) continue;
    while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
    parent.removeChild(mark);
  }
  root.normalize();
}

const inkClass = ["ink-mark", "ink-sun", "ink-rose", "ink-mint", "ink-sky"];

export function applyInkMarks(root: HTMLElement, marks: InkMark[]) {
  unwrap(root);
  for (const node of root.querySelectorAll("span.ink-mark")) {
    node.classList.remove(...inkClass);
  }
  if (!marks.length) return;
  const index = buildFlat(root);
  for (const mark of marks) {
    const needle = mark.text.replace(/\s+/g, " ").trim();
    const at = needle.length >= 2 ? index.flat.indexOf(needle) : -1;
    if (at < 0) continue;
    const start = index.chars[at];
    const end = index.chars[at + needle.length - 1];
    if (!start || !end) continue;
    const range = document.createRange();
    try {
      range.setStart(start.node, start.offset);
      range.setEnd(end.node, end.offset + 1);
    } catch {
      continue;
    }
    for (const span of root.querySelectorAll("span")) {
      if (!span.textContent?.trim()) continue;
      if (range.intersectsNode(span)) span.classList.add("ink-mark", `ink-${mark.color}`);
    }
  }
}

export function paintPlain(text: string, marks: InkMark[]) {
  let parts: { text: string; color?: InkColor; id?: string }[] = [{ text }];
  const relevant = marks
    .filter((mark) => mark.text && text.includes(mark.text))
    .sort((a, b) => b.text.length - a.text.length);
  for (const mark of relevant) {
    parts = parts.flatMap((part) => {
      if (part.color || !part.text.includes(mark.text)) return [part];
      const at = part.text.indexOf(mark.text);
      return [
        { text: part.text.slice(0, at) },
        { text: mark.text, color: mark.color, id: mark.id },
        { text: part.text.slice(at + mark.text.length) },
      ].filter((piece) => piece.text);
    });
  }
  return parts;
}
