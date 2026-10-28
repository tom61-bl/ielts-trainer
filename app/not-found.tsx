import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-lg px-4 py-20">
      <p className="text-xs tracking-[0.18em] text-accent">404</p>
      <h1 className="mt-2 font-serif text-4xl">这页不在目录里</h1>
      <p className="mt-3 text-muted">试卷编号可能写错了，或者这套卷还没有放进来。</p>
      <Link className="btn btn-primary mt-6" href="/ielts">
        回到目录
      </Link>
    </main>
  );
}
