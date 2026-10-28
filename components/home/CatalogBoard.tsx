"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import { listPrivatePapers, savePrivatePaper } from "@/lib/private";
import type { Module, Paper, ViewMode } from "@/lib/types";
import { useToast } from "../ui/Toast";
import { PaperCard } from "./PaperCard";

const skills = [
  { id: "all", label: "全部" },
  { id: "listening", label: "听力" },
  { id: "reading", label: "阅读" },
  { id: "writing", label: "写作" },
] as const;

export function CatalogBoard({
  papers,
  initialSkill = "all",
}: {
  papers: Paper[];
  initialSkill?: string;
}) {
  const { user, setLoginOpen } = useAuth();
  const toast = useToast();
  const [skill, setSkill] = useState(initialSkill);
  const [moduleFilter, setModuleFilter] = useState<"all" | Module>("all");
  const [typeFilter, setTypeFilter] = useState<"all" | ViewMode>("all");
  const [privatePapers, setPrivatePapers] = useState<Paper[]>([]);
  const [loadedOwner, setLoadedOwner] = useState<string | null>(null);

  if (user && loadedOwner !== user.id) {
    setLoadedOwner(user.id);
    setPrivatePapers(
      listPrivatePapers(user.id).map((item) => ({
        id: item.id,
        title: item.title,
        module: "academic",
        book: 0,
        test: 0,
        testType: "paper",
        pdfUrl: "",
        thumbnailUrl: "",
        visibility: "private",
        source: "private",
        version: 1,
        skills: ["reading"],
        pages: 1,
        blurb: "只在这台浏览器、这个账号下可见。",
      })),
    );
  }
  if (!user && loadedOwner) {
    setLoadedOwner(null);
    setPrivatePapers([]);
  }

  const visible = useMemo(() => {
    return [...papers, ...privatePapers].filter((paper) => {
      if (moduleFilter !== "all" && paper.module !== moduleFilter) return false;
      if (typeFilter !== "all" && paper.testType !== typeFilter) return false;
      if (skill !== "all" && !paper.skills.includes(skill as Paper["skills"][number])) return false;
      return true;
    });
  }, [papers, privatePapers, moduleFilter, typeFilter, skill]);

  async function onFile(file: File | undefined) {
    if (!file) return;
    if (!user) {
      setLoginOpen(true);
      return;
    }
    if (file.type !== "application/pdf") {
      toast("请选择 PDF 文件");
      return;
    }
    const id = `private-${crypto.randomUUID()}`;
    await savePrivatePaper(
      {
        id,
        title: file.name.replace(/\.pdf$/i, ""),
        ownerId: user.id,
        createdAt: Date.now(),
        bytes: file.size,
      },
      file,
    );
    setPrivatePapers((current) => [
      {
        id,
        title: file.name.replace(/\.pdf$/i, ""),
        module: "academic",
        book: 0,
        test: 0,
        testType: "paper",
        pdfUrl: "",
        thumbnailUrl: "",
        visibility: "private",
        source: "private",
        version: 1,
        skills: ["reading"],
        pages: 1,
        blurb: "只在这台浏览器、这个账号下可见。",
      },
      ...current,
    ]);
    toast("私有卷已放进目录");
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {skills.map((item) => (
          <button
            key={item.id}
            className={`btn h-10 px-3 text-sm ${skill === item.id ? "btn-primary" : "btn-ghost"}`}
            onClick={() => setSkill(item.id)}
          >
            {item.label}
          </button>
        ))}
        <span className="mx-1 hidden w-px bg-line sm:block" />
        {(
          [
            ["all", "全部模块"],
            ["academic", "Academic"],
            ["general", "General"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            className={`btn h-10 px-3 text-sm ${moduleFilter === id ? "btn-primary" : "btn-ghost"}`}
            onClick={() => setModuleFilter(id)}
          >
            {label}
          </button>
        ))}
        {(
          [
            ["all", "全部形式"],
            ["paper", "纸笔"],
            ["computer", "机考"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={`type-${id}`}
            className={`btn h-10 px-3 text-sm ${typeFilter === id ? "btn-primary" : "btn-ghost"}`}
            onClick={() => setTypeFilter(id)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="mt-4">
        {user ? (
          <label className="btn btn-ghost cursor-pointer">
            导入私有卷
            <input
              type="file"
              accept="application/pdf"
              className="sr-only"
              onChange={(event) => void onFile(event.target.files?.[0])}
            />
          </label>
        ) : (
          <button className="btn btn-ghost" onClick={() => setLoginOpen(true)}>
            登录后导入私有卷
          </button>
        )}
        <p className="mt-2 text-sm text-muted">私有 PDF 只写在这台浏览器里，不会上传。</p>
      </div>
      {visible.length === 0 ? (
        <p className="mt-8 rounded-xl border border-dashed border-line p-6 text-sm text-muted">
          这个筛选下还没有试卷。
        </p>
      ) : (
        <div className="mt-6 grid gap-4">
          {visible.map((paper) => (
            <PaperCard key={paper.id} paper={paper} />
          ))}
        </div>
      )}
    </div>
  );
}
