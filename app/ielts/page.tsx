import Link from "next/link";
import { CatalogBoard } from "@/components/home/CatalogBoard";
import { getPapers } from "@/lib/papers";

export const metadata = { title: "训练卷目录" };

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ skill?: string }>;
}) {
  const params = await searchParams;
  const papers = getPapers();
  return (
    <main className="mx-auto max-w-[1200px] px-4 py-8">
      <p className="text-sm text-muted">
        <Link href="/">首页</Link>
        <span className="mx-2">/</span>
        雅思训练卷
      </p>
      <h1 className="mt-3 font-serif text-4xl">训练卷目录</h1>
      <p className="mt-2 max-w-2xl text-muted">
        三套自研模拟卷。筛选在浏览器里完成，不重新请求。剑桥真题不在这里分发。
      </p>
      <div className="mt-6">
        <CatalogBoard papers={papers} initialSkill={params.skill ?? "all"} />
      </div>
    </main>
  );
}
