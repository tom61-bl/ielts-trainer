import { Suspense } from "react";
import { CatalogBoard } from "@/components/home/CatalogBoard";
import { InviteBanner } from "@/components/home/InviteBanner";
import { getPapers, questionTotals } from "@/lib/papers";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ skill?: string }>;
}) {
  const params = await searchParams;
  const papers = getPapers();
  return (
    <main className="pb-16">
      <Suspense fallback={null}>
        <div className="mx-auto max-w-3xl px-4 pt-2">
          <InviteBanner />
        </div>
      </Suspense>
      <CatalogBoard papers={papers} totals={questionTotals()} initialSkill={params.skill ?? "all"} />
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
