"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { listImportedPapers, saveImportedMarkdown } from "@/lib/importedPapers";
import { getAnswerKeys } from "@/lib/keys";
import { getPapers, getPassageFile, getQuestions } from "@/lib/papers";
import type { MarkdownBundle } from "@/lib/parseMarkdownPaper";
import type { Paper, Skill } from "@/lib/types";
import { MarkdownImport } from "../home/MarkdownImport";
import { useToast } from "../ui/Toast";
import { PaperWorkspace } from "../viewer/PaperWorkspace";

function practiceTitle(paper: Paper) {
  return paper.title.replace(/ · (学术类|培训类)$/u, "");
}

export function SkillDesk({ skill }: { skill: Extract<Skill, "listening" | "reading"> }) {
  const { user, setLoginOpen } = useAuth();
  const toast = useToast();
  const published = getPapers().filter((paper) => (skill === "listening" ? Boolean(paper.audioUrl) : true));
  const [imported, setImported] = useState<MarkdownBundle[]>([]);
  const [markdownOpen, setMarkdownOpen] = useState(false);
  const [paperId, setPaperId] = useState(published[0]?.id ?? "");

  useEffect(() => {
    setImported(skill === "reading" && user ? listImportedPapers(user.id) : []);
  }, [skill, user]);

  const papers = [...published, ...imported.map((item) => item.paper)];
  const currentId = papers.some((paper) => paper.id === paperId) ? paperId : papers[0]?.id ?? "";
  const bundle = imported.find((item) => item.paper.id === currentId);
  const paper = papers.find((item) => item.id === currentId);
  if (!paper) return <p className="px-4 py-8">这一栏还没有题目。</p>;

  const questions = (bundle?.questions ?? getQuestions(paper.id)).filter((question) => question.skill === skill);
  const passages = bundle?.passages ?? getPassageFile(paper.id);
  const keys = bundle?.keys ?? getAnswerKeys(paper.id);

  return (
    <>
      <PaperWorkspace
        key={paper.id}
        paper={{ ...paper, title: practiceTitle(paper) }}
        questions={questions}
        passages={passages}
        answerKeys={keys}
        backHref="/"
        examAudio={skill === "listening"}
        sets={papers.map((item) => ({ id: item.id, title: practiceTitle(item) }))}
        onSet={setPaperId}
        corner={
          skill === "reading" ? (
            <button
              type="button"
              className="exam-text"
              onClick={() => (user ? setMarkdownOpen(true) : setLoginOpen(true))}
            >
              导入
            </button>
          ) : null
        }
      />
      <MarkdownImport
        open={markdownOpen}
        onClose={() => setMarkdownOpen(false)}
        onImport={(source) => {
          if (!user) return "请先登录";
          try {
            const saved = saveImportedMarkdown(user.id, source);
            setImported((current) => [saved, ...current.filter((item) => item.paper.id !== saved.paper.id)]);
            setPaperId(saved.paper.id);
            toast(`已导入「${saved.paper.blurb || saved.paper.title}」`);
            return null;
          } catch (error) {
            return error instanceof Error ? error.message : "这份 Markdown 没有读懂";
          }
        }}
      />
    </>
  );
}
