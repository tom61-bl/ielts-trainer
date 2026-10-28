import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { gradeAll } from "@/lib/grade";
import { getAnswerKeys } from "@/lib/keys";
import { site } from "@/lib/site";

export async function POST(request: Request) {
  const jar = await cookies();
  if (jar.get("ielts_member")?.value !== "1") {
    return NextResponse.json({ error: "member", memberFee: site.memberFee }, { status: 402 });
  }
  const body = (await request.json().catch(() => null)) as { paperId?: string; answers?: Record<string, string> } | null;
  if (!body?.paperId || !body.answers) {
    return NextResponse.json({ error: "bad-request" }, { status: 400 });
  }
  const keys = getAnswerKeys(body.paperId);
  if (!keys) return NextResponse.json({ error: "missing" }, { status: 404 });
  return NextResponse.json({ results: gradeAll(keys, body.answers) });
}
