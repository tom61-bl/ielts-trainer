"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import type { Paper } from "@/lib/types";
import { CatalogBoard } from "./CatalogBoard";

export function CatalogRoute({
  papers,
  totals,
}: {
  papers: Paper[];
  totals: Record<string, number>;
}) {
  return (
    <Suspense fallback={<p className="px-4 py-8 text-sm text-muted">正在打开题库。</p>}>
      <CatalogFromQuery papers={papers} totals={totals} />
    </Suspense>
  );
}

function CatalogFromQuery({
  papers,
  totals,
}: {
  papers: Paper[];
  totals: Record<string, number>;
}) {
  const skill = useSearchParams().get("skill") ?? "all";
  return <CatalogBoard papers={papers} totals={totals} initialSkill={skill} />;
}
