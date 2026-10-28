"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AudioLines, Bell, BookMarked, Columns2, Highlighter, Languages, MousePointer2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { listPrivatePapers, savePrivatePaper } from "@/lib/private";
import { loadWordbook, saveWordbook } from "@/lib/storage";
import type { Module, Paper, ViewMode, WordEntry } from "@/lib/types";
import { WordbookDrawer } from "../wordbook/WordbookDrawer";
import { Modal } from "../ui/Modal";
import { useToast } from "../ui/Toast";
import { PaperCard } from "./PaperCard";

const skills = [
  { id: "all", label: "全部" },
  { id: "listening", label: "听力" },
  { id: "reading", label: "阅读" },
  { id: "writing", label: "写作" },
] as const;

const features = [
  {
    id: "lookup",
    label: "取词查词",
    icon: MousePointer2,
    body: "打开任意一套卷，在 PDF 上拖选单词。弹层里可以听音、看释义，并把词收进左下角的生词本。释义在会员解锁后显示。",
  },
  {
    id: "audio",
    label: "听力锚点",
    icon: AudioLines,
    body: "听力题号和答题卡是同一套锚点。点题号，播放头跳到那一句，不用自己拖进度条。",
  },
  {
    id: "layout",
    label: "纸笔 / 机考",
    icon: Columns2,
    body: "同一份卷可以翻 PDF，也可以换成机考的左右分栏。右上角随时切回去。",
  },
  {
    id: "translate",
    label: "句子翻译",
    icon: Languages,
    body: "打开试卷后点「译句」，再拖选一句正文。选区下面会出现中文，原文留下虚线下划线。译文是按这三套模拟卷逐句写的，会员才能看。",
  },
  {
    id: "ink",
    label: "手写高亮",
    icon: Highlighter,
    body: "点「高亮」，选黄、粉、绿、蓝里的一支，在句子上拖一下。笔迹像荧光笔，只留在这台浏览器。橡皮擦掉划过的那一笔，清空抹掉这套卷的全部笔迹。",
  },
  {
    id: "words",
    label: "生词本",
    icon: BookMarked,
    body: "收过的词留在这台浏览器里，可以搜索、删除，并导出 CSV 或 Anki。",
  },
] as const;

export function CatalogBoard({
  papers,
  totals,
  initialSkill = "all",
}: {
  papers: Paper[];
  totals: Record<string, number>;
  initialSkill?: string;
}) {
  const { user, setLoginOpen, logout } = useAuth();
  const toast = useToast();
  const [skill, setSkill] = useState(initialSkill);
  const [moduleFilter, setModuleFilter] = useState<"all" | Module>("all");
  const [typeFilter, setTypeFilter] = useState<"all" | ViewMode>("all");
  const [privatePapers, setPrivatePapers] = useState<Paper[]>([]);
  const [loadedOwner, setLoadedOwner] = useState<string | null>(null);
  const [feature, setFeature] = useState<(typeof features)[number] | null>(null);
  const [wordsOpen, setWordsOpen] = useState(false);
  const [words, setWords] = useState<WordEntry[] | null>(null);

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

  const maxBook = papers.reduce((max, paper) => Math.max(max, paper.book), 0);

  const groups = useMemo(() => {
    const map = new Map<string, Paper[]>();
    for (const paper of visible) {
      const key = paper.visibility === "private" ? "private" : `b${paper.book}`;
      const list = map.get(key) ?? [];
      list.push(paper);
      map.set(key, list);
    }
    return [...map.keys()]
      .sort((a, b) => {
        if (a === "private") return 1;
        if (b === "private") return -1;
        return Number(b.slice(1)) - Number(a.slice(1));
      })
      .map((key) => ({ key, items: map.get(key) ?? [] }));
  }, [visible]);

  function openWords() {
    setWords(loadWordbook());
    setWordsOpen(true);
    setFeature(null);
  }

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
    <div className="catalog">
      <h1 className="catalog-title">雅思真题</h1>
      <p className="catalog-count">自研模拟 · 学术类与培训类，共 {papers.length} 套</p>
      <div className="feature-row">
        {features.map((item) => {
          const Icon = item.icon;
          return (
            <button key={item.id} type="button" onClick={() => (item.id === "words" ? openWords() : setFeature(item))}>
              <Icon size={18} strokeWidth={1.7} aria-hidden="true" />
              {item.label}
            </button>
          );
        })}
      </div>
      <div className="notice-banner">
        <Bell size={22} aria-hidden="true" />
        <span>这些是自研模拟卷，用来按完整试卷练习。官方考试日期以报名系统为准。</span>
      </div>
      <div className="catalog-filters">
        {skills.map((item) => (
          <button key={item.id} type="button" aria-pressed={skill === item.id} onClick={() => setSkill(item.id)}>
            {item.label}
          </button>
        ))}
        {(
          [
            ["all", "全部模块"],
            ["academic", "学术类"],
            ["general", "培训类"],
          ] as const
        ).map(([id, label]) => (
          <button key={id} type="button" aria-pressed={moduleFilter === id} onClick={() => setModuleFilter(id)}>
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
            type="button"
            aria-pressed={typeFilter === id}
            onClick={() => setTypeFilter(id)}
          >
            {label}
          </button>
        ))}
        {user ? (
          <label>
            导入私有卷
            <input
              type="file"
              accept="application/pdf"
              className="sr-only"
              onChange={(event) => void onFile(event.target.files?.[0])}
            />
          </label>
        ) : (
          <button type="button" onClick={() => setLoginOpen(true)}>
            登录后导入私有卷
          </button>
        )}
      </div>

      {groups.length === 0 ? (
        <p className="mx-auto mt-10 max-w-md px-4 text-center text-sm text-muted">这个筛选下还没有试卷。</p>
      ) : (
        groups.map((group, index) => (
          <section className="period" key={group.key} id={group.key === "private" ? "private-papers" : `series-${group.key.slice(1)}`}>
            <h2>{group.key === "private" ? "私有卷" : `系列 ${group.key.slice(1).padStart(2, "0")}`}</h2>
            {group.key === `b${maxBook}` ? (
              <p className="period-note">最新一组。封面点进去就是整套卷，听力题号会跳到对应的一句。</p>
            ) : null}
            {group.key === "private" ? (
              <p className="period-note">只在这台浏览器、这个账号下可见，不会上传。</p>
            ) : null}
            <div className="year-rail">
              {group.items.map((paper) => (
                <PaperCard
                  key={paper.id}
                  paper={paper}
                  total={totals[paper.id] ?? 0}
                  fresh={paper.book === maxBook && paper.visibility !== "private"}
                />
              ))}
            </div>
            {index < groups.length - 1 ? <hr className="period-rule" /> : null}
          </section>
        ))
      )}

      <aside className="quick-rail" aria-label="快捷入口">
        {user ? (
          <button type="button" onClick={logout}>
            {user.name}
          </button>
        ) : (
          <button type="button" onClick={() => setLoginOpen(true)}>
            登录
          </button>
        )}
        <Link href="/speaking">口语</Link>
        <Link href="/writing">写作</Link>
        <Link href="/help">帮助</Link>
      </aside>
      <button type="button" className="wordbook-fab" onClick={openWords}>
        生词本
      </button>

      <Modal open={Boolean(feature)} onClose={() => setFeature(null)} title={feature?.label}>
        {feature ? (
          <div className="space-y-4 text-sm leading-7">
            <p>{feature.body}</p>
            <Link href="/ielts/qingjuan-a2" className="btn btn-primary">
              打开最新一套
            </Link>
          </div>
        ) : null}
      </Modal>
      <WordbookDrawer
        open={wordsOpen}
        entries={words ?? []}
        onClose={() => setWordsOpen(false)}
        onDelete={(id) => {
          const next = (words ?? loadWordbook()).filter((entry) => entry.id !== id);
          setWords(next);
          saveWordbook(next);
        }}
      />
    </div>
  );
}
