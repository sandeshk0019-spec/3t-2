import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const cookieHeader = request.headers.get("cookie") || "";
    const match = cookieHeader.match(/3t_session_token=([^;]+)/);

    if (!match) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const session = await verifySession(decodeURIComponent(match[1]));

    if (!session) {
      return NextResponse.json({ authenticated: false, error: "Invalid or expired session" }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      user: { email: session.email, name: session.name, role: session.role }
    });
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
