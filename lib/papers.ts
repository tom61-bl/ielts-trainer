import papers from "@/data/papers.json";
import writingTasks from "@/data/writing.json";
import speakingPrompts from "@/data/speaking.json";
import qA1 from "@/data/questions/qingjuan-a1.json";
import qA2 from "@/data/questions/qingjuan-a2.json";
import qG1 from "@/data/questions/qingjuan-g1.json";
import pA1 from "@/data/passages/qingjuan-a1.json";
import pA2 from "@/data/passages/qingjuan-a2.json";
import pG1 from "@/data/passages/qingjuan-g1.json";
import { remoteWorkMarkdown } from "@/data/remote-work";
import { publicPath } from "./content";
import { parseMarkdownPaper } from "./parseMarkdownPaper";
import type {
  Paper,
  PassageFile,
  Question,
  Skill,
  SpeakingPrompt,
  WritingTask,
} from "./types";

const questionMap: Record<string, Question[]> = {
  "qingjuan-a1": qA1 as Question[],
  "qingjuan-a2": qA2 as Question[],
  "qingjuan-g1": qG1 as Question[],
};

const passageMap: Record<string, PassageFile> = {
  "qingjuan-a1": pA1 as PassageFile,
  "qingjuan-a2": pA2 as PassageFile,
  "qingjuan-g1": pG1 as PassageFile,
};

const remoteWork = parseMarkdownPaper(remoteWorkMarkdown, {
  id: "remote-work",
  title: "远程办公 · 学术类",
  book: 3,
  test: 1,
});
questionMap["remote-work"] = remoteWork.questions;
passageMap["remote-work"] = remoteWork.passages;

export function getPapers(): Paper[] {
  return [...(papers as Paper[]), remoteWork.paper]
    .slice()
    .sort((a, b) => b.book - a.book || a.module.localeCompare(b.module) || b.test - a.test)
    .map((paper) => ({
      ...paper,
      pdfUrl: publicPath(paper.pdfUrl),
      audioUrl: paper.audioUrl ? publicPath(paper.audioUrl) : paper.audioUrl,
      thumbnailUrl: paper.thumbnailUrl ? publicPath(paper.thumbnailUrl) : paper.thumbnailUrl,
    }));
}

export function questionTotals(): Record<string, number> {
  return Object.fromEntries(Object.entries(questionMap).map(([id, questions]) => [id, questions.length]));
}

export function getPaper(id: string) {
  return getPapers().find((paper) => paper.id === id) ?? null;
}

export function getQuestions(id: string) {
  return questionMap[id] ?? [];
}

export function getPassageFile(id: string): PassageFile {
  return passageMap[id] ?? { groups: [], passages: [] };
}

export function getWritingTasks() {
  return writingTasks as WritingTask[];
}

export function getSpeakingPrompts() {
  return speakingPrompts as SpeakingPrompt[];
}

export function paperHasSkill(paper: Paper, skill: Skill | "all") {
  if (skill === "all") return true;
  return paper.skills.includes(skill);
}
