import { NextResponse, type NextRequest } from "next/server";
import { SiweMessage } from "siwe";
import { sepolia } from "viem/chains";
import { consumeSiweNonce } from "../../../../lib/siweNonce";

const NONCE_COOKIE = "siwe-nonce";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type VerifyPayload = {
  message?: unknown;
  signature?: unknown;
};

function jsonResponse(
  body: Record<string, string>,
  status: number,
) {
  const response = NextResponse.json(body, { status });

  response.cookies.set(NONCE_COOKIE, "", {
    httpOnly: true,
    maxAge: 0,
    path: "/api/siwe",
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  });

  return response;
}

export async function POST(request: NextRequest) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return jsonResponse({ error: "Request body must be valid JSON." }, 400);
  }

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return jsonResponse({ error: "Request body must be a JSON object." }, 400);
  }

  const { message, signature } = payload as VerifyPayload;

  if (
    typeof message !== "string" ||
    typeof signature !== "string"
  ) {
    return jsonResponse(
      { error: "A SIWE message and signature are required." },
      400,
    );
  }

  const nonce = request.cookies.get(NONCE_COOKIE)?.value;

  if (!nonce) {
    return jsonResponse(
      { error: "Sign-in nonce is missing or expired. Please try again." },
      401,
    );
  }

  const origin = request.headers.get("origin");

  if (!origin) {
    return jsonResponse({ error: "Request origin is required." }, 403);
  }

  let originUrl: URL;

  try {
    originUrl = new URL(origin);
  } catch {
    return jsonResponse({ error: "Request origin is invalid." }, 403);
  }

  if (originUrl.origin !== origin) {
    return jsonResponse({ error: "Request origin is invalid." }, 403);
  }

  try {
    const siweMessage = new SiweMessage(message);
    const scheme = originUrl.protocol.slice(0, -1);

    if (
      siweMessage.chainId !== sepolia.id ||
      siweMessage.uri !== originUrl.origin ||
      siweMessage.scheme !== scheme
    ) {
      return jsonResponse(
        { error: "SIWE message does not match this app or network." },
        400,
      );
    }

    if (!consumeSiweNonce(nonce)) {
      return jsonResponse(
        { error: "Sign-in nonce is invalid, expired, or already used." },
        401,
      );
    }

    const verification = await siweMessage.verify(
      {
        signature,
        nonce,
        domain: originUrl.host,
        scheme,
      },
      { suppressExceptions: true },
    );

    if (!verification.success) {
      return jsonResponse({ error: "SIWE signature is invalid." }, 401);
    }

    return jsonResponse({ address: verification.data.address }, 200);
  } catch (error) {
    console.error("SIWE verification failed:", error);
    return jsonResponse({ error: "Unable to verify sign-in request." }, 400);
  }
}
