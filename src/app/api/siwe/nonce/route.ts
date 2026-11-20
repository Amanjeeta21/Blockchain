import { NextResponse } from "next/server";
import {
  createSiweNonce,
  SIWE_NONCE_TTL_SECONDS,
} from "../../../../lib/siweNonce";

const NONCE_COOKIE = "siwe-nonce";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const nonce = createSiweNonce();
  const response = NextResponse.json({ nonce });

  response.cookies.set(NONCE_COOKIE, nonce, {
    httpOnly: true,
    maxAge: SIWE_NONCE_TTL_SECONDS,
    path: "/api/siwe",
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  });

  return response;
}
