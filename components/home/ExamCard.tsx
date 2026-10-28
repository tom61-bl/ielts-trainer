import Link from "next/link";
import type { LucideIcon } from "lucide-react";

export function ExamCard({
  index,
  title,
  desc,
  href,
  icon: Icon,
}: {
  index: string;
  title: string;
  desc: string;
  href: string;
  icon: LucideIcon;
}) {
  return (
    <Link
      href={href}
      className="group flex min-h-[180px] flex-col justify-between rounded-xl border border-line bg-surface p-4 shadow-[var(--shadow)] transition hover:-translate-y-0.5"
    >
      <div className="flex items-start justify-between">
        <span className="font-serif text-3xl text-primary/70">{index}</span>
        <Icon size={18} className="text-accent" />
      </div>
      <div>
        <h2 className="font-serif text-2xl">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-muted">{desc}</p>
        <p className="mt-3 text-sm text-primary">进入</p>
      </div>
    </Link>
  );
}
