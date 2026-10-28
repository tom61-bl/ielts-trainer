import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import glossary from "@/data/glossary.json";

export async function GET(request: Request) {
  const jar = await cookies();
  const word = new URL(request.url).searchParams.get("word")?.trim().toLowerCase() ?? "";
  const clean = word.replace(/[^a-z'-]/g, "");
  if (jar.get("ielts_member")?.value !== "1") {
    return NextResponse.json({ member: false, word: clean }, { status: 402 });
  }
  const hit = (glossary as { word: string; ipa: string; zh: string }[]).find((entry) => entry.word === clean);
  if (!hit) return NextResponse.json({ member: true, found: false, word: clean });
  return NextResponse.json({ member: true, found: true, word: hit.word, ipa: hit.ipa, zh: hit.zh });
}
