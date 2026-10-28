import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const jar = await cookies();
  return NextResponse.json({
    cuid: jar.get("ielts_cuid")?.value ?? null,
    email: jar.get("ielts_session")?.value ? decodeURIComponent(jar.get("ielts_session")!.value) : null,
    member: jar.get("ielts_member")?.value === "1",
  });
}
