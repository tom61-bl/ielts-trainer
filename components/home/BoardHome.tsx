import Link from "next/link";
import { Headphones, Languages, PenLine, BookOpen } from "lucide-react";

const boards = [
  {
    href: "/listening",
    title: "听力",
    body: "播放录音，点题号跳到那一句。选中单词就能听读音、看释义，再收进生词本。",
    icon: Headphones,
  },
  {
    href: "/reading",
    title: "阅读",
    body: "文章和题目分栏排开。可以朗读整篇，在句子上做记号，把不认识的词收藏起来。",
    icon: BookOpen,
  },
  {
    href: "/writing",
    title: "写作",
    body: "题目在左，稿纸在右。题干可以划线、查词、听读音，草稿留在这台浏览器。",
    icon: PenLine,
  },
  {
    href: "/translation",
    title: "翻译",
    body: "按段落对照中文。可以整段朗读，选中单词看释义并收藏，译文随时展开。",
    icon: Languages,
  },
] as const;

export function BoardHome() {
  return (
    <div className="board-home">
      <h1 className="catalog-title">练习</h1>
      <p className="catalog-count">听力、阅读、写作、翻译。自研材料，不是官方题库。</p>
      <div className="board-grid">
        {boards.map((board) => {
          const Icon = board.icon;
          return (
            <Link key={board.href} href={board.href} className="board-card">
              <Icon size={22} strokeWidth={1.7} aria-hidden="true" />
              <strong>{board.title}</strong>
              <span>{board.body}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
