import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE_NAME,
  FARMER_COOKIE_NAME,
  LEGACY_ADMIN_COOKIE,
  LEGACY_FARMER_COOKIE
} from "@/lib/auth";

export async function POST() {
  const response = NextResponse.json({ success: true, message: "Logged out successfully" });
  [ADMIN_COOKIE_NAME, FARMER_COOKIE_NAME, LEGACY_ADMIN_COOKIE, LEGACY_FARMER_COOKIE].forEach((name) => {
    response.cookies.set(name, "", {
      httpOnly: true,
      expires: new Date(0),
      path: "/"
    });
  });
  return response;
}
