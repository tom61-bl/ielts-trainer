import { notFound } from "next/navigation";
import { PrivatePaper } from "@/components/viewer/PrivatePaper";
import { PaperWorkspace } from "@/components/viewer/PaperWorkspace";
import { getPaper, getPapers, getPassageFile, getQuestions } from "@/lib/papers";

export function generateStaticParams() {
  return getPapers().map((paper) => ({ paperId: paper.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ paperId: string }> }) {
  const { paperId } = await params;
  const paper = getPaper(paperId);
  return { title: paper?.title ?? "私有卷" };
}

export default async function PaperPage({ params }: { params: Promise<{ paperId: string }> }) {
  const { paperId } = await params;
  const paper = getPaper(paperId);
  if (!paper) {
    if (paperId.startsWith("private-")) return <PrivatePaper id={paperId} />;
    notFound();
  }
  return <PaperWorkspace paper={paper} questions={getQuestions(paper.id)} passages={getPassageFile(paper.id)} />;
}
