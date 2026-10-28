import Link from "next/link";
import { BookOpen, Headphones, Mic, PenLine } from "lucide-react";
import { ExamCard } from "@/components/home/ExamCard";
import { InviteBanner } from "@/components/home/InviteBanner";
import { getPapers } from "@/lib/papers";
import { Suspense } from "react";

const cards = [
  {
    index: "01",
    title: "听力",
    desc: "四段录音。点题号，进度条跳到那一句。",
    href: "/ielts?skill=listening",
    icon: Headphones,
  },
  {
    index: "02",
    title: "阅读",
    desc: "纸笔看 PDF，或换成机考的左右分栏。",
    href: "/ielts?skill=reading",
    icon: BookOpen,
  },
  {
    index: "03",
    title: "写作",
    desc: "Task 1 和 Task 2，边写边数字数。",
    href: "/writing",
    icon: PenLine,
  },
  {
    index: "04",
    title: "口语",
    desc: "提示卡、一分钟准备，录完自己打分。",
    href: "/speaking",
    icon: Mic,
  },
];

export default function HomePage() {
  const papers = getPapers();
  return (
    <main className="mx-auto max-w-[1200px] px-4 pb-8">
      <Suspense fallback={null}>
        <div className="pt-6">
          <InviteBanner />
        </div>
      </Suspense>
      <section className="grid items-end gap-8 py-8 lg:grid-cols-[1.3fr_.7fr]">
        <div>
          <p className="text-xs tracking-[0.22em] text-accent">PRACTICE DESK</p>
          <h1 className="mt-3 font-serif text-5xl leading-tight sm:text-6xl">雅思真题在线</h1>
          <p className="mt-3 text-lg">按试卷排版 · 听说读写全科训练</p>
          <p className="mt-4 max-w-xl text-muted">
            一套卷，从封面做到最后一题。点题号就翻到那一页，听力会跟着跳到那一秒。作答留在这台浏览器里。
          </p>
        </div>
        <aside className="rounded-2xl border border-line bg-surface p-5">
          <p className="text-xs text-muted">现在可以打开</p>
          <ul className="mt-3 space-y-3">
            {papers.map((paper) => (
              <li key={paper.id}>
                <Link href={`/ielts/${paper.id}`} className="block">
                  <span className="font-medium">{paper.title}</span>
                  <span className="mt-1 block text-sm text-muted">{paper.blurb}</span>
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      </section>
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <ExamCard key={card.title} {...card} />
        ))}
      </section>
      <Link
        href="/ielts"
        className="mt-6 flex items-center justify-between rounded-2xl border border-line bg-primary px-5 py-6 text-white"
      >
        <span>
          <span className="block font-serif text-3xl">训练卷目录</span>
          <span className="mt-1 block text-sm text-white/80">自研模拟题，按系列与场次。学术类、培训类，纸笔和机考。</span>
        </span>
        <span className="text-sm">进入</span>
      </Link>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: "雅思真题在线",
            applicationCategory: "EducationalApplication",
            description: "按试卷排版练习雅思听说读写的自研训练站。",
          }),
        }}
      />
    </main>
  );
}
