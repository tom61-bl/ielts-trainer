import { Suspense } from "react";
import { BoardHome } from "@/components/home/BoardHome";
import { InviteBanner } from "@/components/home/InviteBanner";

export default function HomePage() {
  return (
    <main className="pb-16">
      <Suspense fallback={null}>
        <div className="mx-auto max-w-3xl px-4 pt-2">
          <InviteBanner />
        </div>
      </Suspense>
      <BoardHome />
    </main>
  );
}
