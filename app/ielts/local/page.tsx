"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { PrivatePaper } from "@/components/viewer/PrivatePaper";

export default function LocalPaperPage() {
  return (
    <Suspense fallback={<p className="px-4 py-8 text-sm text-muted">正在打开私有卷。</p>}>
      <LocalPaper />
    </Suspense>
  );
}

function LocalPaper() {
  const id = useSearchParams().get("id") ?? "";
  if (!id) return <p className="px-4 py-8 text-sm text-muted">没有这份私有卷。</p>;
  return <PrivatePaper id={id} />;
}
