import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import sentences from "@/data/sentences.json";
import { translateSelection, type SentenceRow } from "@/lib/translate";

export async function GET(request: Request) {
  const jar = await cookies();
  const raw = new URL(request.url).searchParams.get("q") ?? "";
  const text = raw.replace(/\s+/g, " ").trim().slice(0, 600);
  if (jar.get("ielts_member")?.value !== "1") {
    return NextResponse.json({ member: false }, { status: 402 });
  }
  const hit = translateSelection(text, sentences as SentenceRow[]);
  if (!hit) return NextResponse.json({ member: true, found: false });
  return NextResponse.json({ member: true, found: true, en: hit.en, zh: hit.zh });
}
