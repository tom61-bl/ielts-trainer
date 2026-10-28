import { Suspense } from "react";
import { CatalogRoute } from "@/components/home/CatalogRoute";
import { InviteBanner } from "@/components/home/InviteBanner";
import { getPapers, questionTotals } from "@/lib/papers";

export default function HomePage() {
  return (
    <main className="pb-16">
      <Suspense fallback={null}>
        <div className="mx-auto max-w-3xl px-4 pt-2">
          <InviteBanner />
        </div>
      </Suspense>
      <CatalogRoute papers={getPapers()} totals={questionTotals()} />
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
