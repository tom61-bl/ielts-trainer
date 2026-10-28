import Link from "next/link";

export default function ProPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-serif text-4xl">这些功能都已开放</h1>
      <p className="mt-3 max-w-xl text-muted">对答案、单词释义、整句译文和写作范文不用付费，直接在试卷里用。</p>
      <Link className="btn btn-primary mt-6" href="/ielts">
        回试卷目录
      </Link>
    </main>
  );
}
