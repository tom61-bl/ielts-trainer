import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  if (!request.cookies.get("ielts_cuid")) {
    const cuid = `${crypto.randomUUID()}__${Date.now()}`;
    response.cookies.set("ielts_cuid", cuid, {
      path: "/",
      maxAge: 60 * 60 * 24 * 730,
      sameSite: "lax",
    });
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|samples/|pdf.worker.min.mjs|icon-.*).*)"],
};
