import { Suspense } from "react";
import { CatalogRoute } from "@/components/home/CatalogRoute";
import { InviteBanner } from "@/components/home/InviteBanner";
import { getPapers, questionTotals } from "@/lib/papers";

export const metadata = { title: "雅思真题" };

export default function CatalogPage() {
  return (
    <main className="pb-16">
      <Suspense fallback={null}>
        <div className="mx-auto max-w-3xl px-4 pt-2">
          <InviteBanner />
        </div>
      </Suspense>
      <CatalogRoute papers={getPapers()} totals={questionTotals()} />
    </main>
  );
}
