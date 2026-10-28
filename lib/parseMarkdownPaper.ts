import type { AnswerKey } from "./keys";
import type { Paper, PassageFile, Question, QuestionType } from "./types";

export interface MarkdownBundle {
  paper: Paper;
  questions: Question[];
  passages: PassageFile;
  keys: AnswerKey[];
}

interface Heading {
  id: string;
  text: string;
}

interface DraftQuestion {
  qnum: number;
  prompt: string;
  type: QuestionType;
  choices?: { id: string; text: string }[];
  options?: string[];
  note: string;
  headings: Heading[];
  start: number;
  end: number;
  sectionTitle: string;
}

const tfngOptions = ["TRUE", "FALSE", "NOT GIVEN"];

function clean(source: string) {
  return source.replace(/\uFFFC/g, "").replace(/\r\n/g, "\n").trim();
}

function questionType(label: string): QuestionType {
  const text = label.toLowerCase();
  if (/matching/.test(text) || /标题/.test(label)) return "matching";
  if (/true/.test(text) || /not given/.test(text) || /判断/.test(label)) return "tfng";
  if (/multiple/.test(text) || /choice/.test(text) || /选择/.test(label)) return "multiple_choice";
  return "short_answer";
}

export function parseMarkdownPaper(
  source: string,
  options: { id: string; title?: string; book?: number; test?: number; ownerId?: string } ,
): MarkdownBundle {
  const text = clean(source);
  if (!text) throw new Error("Markdown 是空的");

  const lines = text.split("\n");
  let title = options.title ?? "";
  const paragraphs: { label: string; text: string }[] = [];
  const sections: DraftQuestion[] = [];
  const answers = new Map<number, { answer: string; explanation: string }>();
  let mode: "passage" | "section" | "answers" = "passage";
  let current: DraftQuestion | null = null;
  let activeQuestion: { qnum: number; prompt: string; choices: { id: string; text: string }[] } | null = null;
  let paragraph: { label: string; text: string } | null = null;

  function finishParagraph() {
    if (!paragraph) return;
    paragraphs.push({ label: paragraph.label, text: paragraph.text.replace(/\s+/g, " ").trim() });
    paragraph = null;
  }

  function finishQuestion() {
    if (!current || !activeQuestion) return;
    const type = current.type;
    const base = {
      qnum: activeQuestion.qnum,
      prompt: activeQuestion.prompt.replace(/_+$/g, "").trim(),
      type,
      note: current.note,
      headings: current.headings,
      start: current.start,
      end: current.end,
      sectionTitle: current.sectionTitle,
    };
    if (type === "tfng") sections.push({ ...base, options: tfngOptions });
    else if (type === "matching") sections.push({ ...base, choices: current.headings });
    else if (type === "multiple_choice") sections.push({ ...base, choices: activeQuestion.choices });
    else sections.push(base);
    activeQuestion = null;
  }

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      finishParagraph();
      continue;
    }
    if (/^\(约\s*\d+\s*词\)$/.test(line)) continue;

    const answerHeader = /^(?:#{1,3}\s*)?answers?\b|^答案\b/i.test(line);
    if (answerHeader) {
      finishParagraph();
      finishQuestion();
      mode = "answers";
      continue;
    }

    if (mode === "answers") {
      const answer = line.match(/^(\d+)\s*[.、:：]?\s*(.+?)(?:\s+[—–\-]\s+|\s*[：:]\s+)(.*)$/);
      const bare = line.match(/^(\d+)\s*[.、:：]?\s*(.+)$/);
      const picked = answer ?? bare;
      if (!picked) continue;
      const token = picked[2]
        .split("|")
        .map((part) => part.trim())
        .filter(Boolean)
        .map((part) => {
          const lower = part.toLowerCase();
          if (lower === "not given" || part === "未给出") return "NOT GIVEN";
          if (lower === "true" || part === "正确") return "TRUE";
          if (lower === "false" || part === "错误") return "FALSE";
          if (/^[ivx]+$/i.test(part)) return lower;
          return part.toUpperCase();
        })
        .join("|");
      answers.set(Number(picked[1]), { answer: token, explanation: (answer?.[3] ?? "").trim() });
      continue;
    }

    const section = line.match(/^Questions?\s+(\d+)\s*[–—-]\s*(\d+)\s*[·•.:：\-]?\s*(.*)$/i);
    if (section) {
      finishParagraph();
      finishQuestion();
      mode = "section";
      current = {
        qnum: 0,
        prompt: "",
        type: questionType(section[3] || ""),
        note: "",
        headings: [],
        start: Number(section[1]),
        end: Number(section[2]),
        sectionTitle: line.replace(/\s+/g, " "),
      };
      continue;
    }

    if (!title) {
      const named = line.match(/^(?:Passage|Title)\s*[:：]\s*(.+)$/i) || line.match(/^#\s+(.+)$/);
      if (named) {
        title = named[1].trim();
        continue;
      }
    }

    if (mode === "passage") {
      const labeled = line.match(/^([A-H])\.\s+(.+)$/);
      if (labeled) {
        finishParagraph();
        paragraph = { label: labeled[1], text: labeled[2] };
        continue;
      }
      if (paragraph) paragraph.text += ` ${line}`;
      continue;
    }

    if (!current) continue;
    const heading = line.match(/^(?:[•*\-]\s*)?((?:i{1,3}|iv|vi{0,3}|ix|x))[.)]\s+(.+)$/i);
    if (heading && current.type === "matching" && !activeQuestion) {
      current.headings.push({ id: heading[1].toLowerCase(), text: heading[2].trim() });
      continue;
    }

    const numbered = line.match(/^(\d+)\s*[.、]\s+(.+)$/);
    if (numbered) {
      finishQuestion();
      activeQuestion = { qnum: Number(numbered[1]), prompt: numbered[2].trim(), choices: [] };
      continue;
    }

    const option = line.match(/^([A-H])\s*[.、)]\s+(.+)$/);
    if (option && activeQuestion && current.type === "multiple_choice") {
      activeQuestion.choices.push({ id: option[1].toUpperCase(), text: option[2].trim() });
      continue;
    }

    if (activeQuestion) activeQuestion.prompt += ` ${line}`;
    else if (!/^list of headings$/i.test(line)) current.note = current.note ? `${current.note} ${line}` : line;
  }
  finishParagraph();
  finishQuestion();

  if (!paragraphs.length) throw new Error("没有找到 A. B. C. 这样的段落");
  if (!sections.length) throw new Error("没有找到 Questions 1–5 这样的题目");

  const paperTitle = options.title || title || "导入的阅读";
  const paper: Paper = {
    id: options.id,
    title: paperTitle,
    module: "academic",
    book: options.book ?? 0,
    test: options.test ?? 1,
    testType: "computer",
    pdfUrl: "",
    thumbnailUrl: "",
    visibility: options.ownerId ? "private" : "public",
    source: options.ownerId ? "markdown" : "original-mock",
    version: 1,
    skills: ["reading"],
    pages: 1,
    blurb: title && title !== paperTitle ? title : "从 Markdown 导入的阅读。",
    ownerId: options.ownerId,
  };

  const questions: Question[] = sections
    .slice()
    .sort((a, b) => a.qnum - b.qnum)
    .map((item) => ({
      id: `${options.id}-R${item.qnum}`,
      paperId: options.id,
      skill: "reading" as const,
      section: 1,
      qnum: item.qnum,
      type: item.type,
      page: 1,
      y: 0,
      prompt: item.prompt,
      options: item.options,
      choices: item.choices,
    }));

  const groups = new Map<string, DraftQuestion>();
  for (const item of sections) {
    const key = `${item.start}-${item.end}`;
    if (!groups.has(key)) groups.set(key, item);
  }

  const passages: PassageFile = {
    groups: [...groups.values()].map((item) => ({
      skill: "reading" as const,
      section: 1,
      title: item.sectionTitle,
      note: item.note,
    })),
    passages: [
      {
        section: 1,
        title: title || paperTitle,
        paragraphs,
      },
    ],
  };

  const keys: AnswerKey[] = questions
    .filter((question) => answers.has(question.qnum))
    .map((question) => {
      const row = answers.get(question.qnum)!;
      return {
        id: question.id,
        answer: row.answer,
        explanation: row.explanation || "见原文对应段落。",
      };
    });

  return { paper, questions, passages, keys };
}
