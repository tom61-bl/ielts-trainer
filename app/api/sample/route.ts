import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getWritingSample } from "@/lib/keys";
import { site } from "@/lib/site";

export async function GET(request: Request) {
  const jar = await cookies();
  if (jar.get("ielts_member")?.value !== "1") {
    return NextResponse.json({ error: "member", memberFee: site.memberFee }, { status: 402 });
  }
  const id = new URL(request.url).searchParams.get("id") ?? "";
  const sample = getWritingSample(id);
  if (!sample) return NextResponse.json({ error: "missing" }, { status: 404 });
  return NextResponse.json({ sample });
}
