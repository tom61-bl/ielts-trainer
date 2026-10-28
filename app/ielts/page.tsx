import { Suspense } from "react";
import { CatalogBoard } from "@/components/home/CatalogBoard";
import { InviteBanner } from "@/components/home/InviteBanner";
import { getPapers, questionTotals } from "@/lib/papers";

export const metadata = { title: "雅思真题" };

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ skill?: string }>;
}) {
  const params = await searchParams;
  return (
    <main className="pb-16">
      <Suspense fallback={null}>
        <div className="mx-auto max-w-3xl px-4 pt-2">
          <InviteBanner />
        </div>
      </Suspense>
      <CatalogBoard papers={getPapers()} totals={questionTotals()} initialSkill={params.skill ?? "all"} />
    </main>
  );
}
