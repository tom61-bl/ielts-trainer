"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PaperWorkspace } from "@/components/viewer/PaperWorkspace";
import { PrivatePaper } from "@/components/viewer/PrivatePaper";
import { loadImportedPaper } from "@/lib/importedPapers";
import type { MarkdownBundle } from "@/lib/parseMarkdownPaper";

export default function LocalPaperPage() {
  return (
    <Suspense fallback={<p className="px-4 py-8 text-sm text-muted">正在打开私有卷。</p>}>
      <LocalPaper />
    </Suspense>
  );
}

function LocalPaper() {
  const id = useSearchParams().get("id") ?? "";
  const [bundle, setBundle] = useState<MarkdownBundle | null | undefined>(undefined);

  useEffect(() => {
    setBundle(id ? loadImportedPaper(id) : null);
  }, [id]);

  if (!id) return <p className="px-4 py-8 text-sm text-muted">没有这份卷。</p>;
  if (bundle === undefined) return <p className="px-4 py-8 text-sm text-muted">正在打开。</p>;
  if (bundle) {
    return (
      <PaperWorkspace
        paper={bundle.paper}
        questions={bundle.questions}
        passages={bundle.passages}
        answerKeys={bundle.keys}
      />
    );
  }
  if (id.startsWith("md-")) return <p className="px-4 py-8 text-sm text-muted">这份 Markdown 卷不在这台浏览器里。</p>;
  return <PrivatePaper id={id} />;
}
