import { generateNonce } from "siwe";

export const SIWE_NONCE_TTL_SECONDS = 5 * 60;

const MAX_PENDING_NONCES = 10_000;

type SiweNonceGlobal = typeof globalThis & {
  __tipJarSiweNonces?: Map<string, number>;
};

const globalForSiwe = globalThis as SiweNonceGlobal;
const pendingNonces =
  globalForSiwe.__tipJarSiweNonces ?? new Map<string, number>();

globalForSiwe.__tipJarSiweNonces = pendingNonces;

export function createSiweNonce() {
  const now = Date.now();

  for (const [nonce, expiresAt] of pendingNonces) {
    if (expiresAt <= now) {
      pendingNonces.delete(nonce);
    }
  }

  if (pendingNonces.size >= MAX_PENDING_NONCES) {
    const earliest = pendingNonces.keys().next().value;

    if (earliest) {
      pendingNonces.delete(earliest);
    }
  }

  const nonce = generateNonce();
  pendingNonces.set(
    nonce,
    now + SIWE_NONCE_TTL_SECONDS * 1000,
  );

  return nonce;
}

export function consumeSiweNonce(nonce: string) {
  const expiresAt = pendingNonces.get(nonce);

  if (expiresAt === undefined) {
    return false;
  }

  pendingNonces.delete(nonce);
  return expiresAt > Date.now();
}
