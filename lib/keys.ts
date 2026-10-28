import { remoteWorkMarkdown } from "@/data/remote-work";
import kA1 from "@/data/keys/qingjuan-a1.json";
import kA2 from "@/data/keys/qingjuan-a2.json";
import kG1 from "@/data/keys/qingjuan-g1.json";
import writingKeys from "@/data/keys/writing.json";
import { parseMarkdownPaper } from "./parseMarkdownPaper";

export interface AnswerKey {
  id: string;
  answer: string;
  explanation: string;
}

const keys: Record<string, AnswerKey[]> = {
  "qingjuan-a1": kA1 as AnswerKey[],
  "qingjuan-a2": kA2 as AnswerKey[],
  "qingjuan-g1": kG1 as AnswerKey[],
  "remote-work": parseMarkdownPaper(remoteWorkMarkdown, { id: "remote-work", title: "远程办公 · 学术类" }).keys,
};

export function getAnswerKeys(paperId: string) {
  return keys[paperId] ?? null;
}

export function getWritingSample(taskId: string) {
  const row = (writingKeys as { id: string; sample: string }[]).find((item) => item.id === taskId);
  return row?.sample ?? null;
}
