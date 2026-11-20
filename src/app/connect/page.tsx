"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useAccount,
  useChainId,
  useDisconnect,
} from "wagmi";
import { useChainModal, useConnectModal } from "@rainbow-me/rainbowkit";
import { sepolia } from "wagmi/chains";

import { useVerifiedAddress } from "../../components/VerifiedAddressContext";
import SignInButton from "../../components/SignInButton";

function shortenAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default function ConnectPage() {
  const router = useRouter();
  const { verifiedAddress } = useVerifiedAddress();
  const { address, isConnected, status } = useAccount();
  const chainId = useChainId();
  const { disconnect } = useDisconnect();
  const { openConnectModal } = useConnectModal();
  const { openChainModal } = useChainModal();
  const connectRequested = useRef(false);

  const matchesVerifiedAddress =
    Boolean(address) &&
    Boolean(verifiedAddress) &&
    address?.toLowerCase() === verifiedAddress.toLowerCase();
  const isSepolia = chainId === sepolia.id;

  useEffect(() => {
    if (!verifiedAddress) {
      router.replace("/");
    }
  }, [router, verifiedAddress]);

  useEffect(() => {
    if (
      connectRequested.current &&
      isConnected &&
      matchesVerifiedAddress &&
      isSepolia
    ) {
      router.replace("/tipjar");
    }
  }, [isConnected, isSepolia, matchesVerifiedAddress, router]);

  if (!verifiedAddress) {
    return (
      <main className="connect-page">
        <p>Sign in is required. Returning to TipJar...</p>
      </main>
    );
  }

  function handleConnect() {
    connectRequested.current = true;
    openConnectModal?.();
  }

  function handleContinue() {
    router.replace("/tipjar");
  }

  return (
    <main className="connect-page">
      <Link href="/" className="brand" aria-label="TipJar home">
        <span className="brand-icon">T</span>
        <span className="brand-name">
          TIPJAR<span className="brand-dot">.</span>
        </span>
      </Link>

      <section className="connect-card">
        <p className="landing-eyebrow">
          <span className="landing-eyebrow-dot" />
          SIGN-IN VERIFIED
        </p>
        <h1>You’re verified. Now connect your wallet to continue.</h1>
        <p className="connect-card-description">
          Your signature verified control of this address. Connecting is a
          separate step that lets TipJar request wallet actions.
        </p>

        <div className="connect-address">
          <span>VERIFIED ADDRESS</span>
          <strong title={verifiedAddress}>{shortenAddress(verifiedAddress)}</strong>
        </div>

        {isConnected && !matchesVerifiedAddress && (
          <div className="connect-notice" role="alert">
            This wallet differs from the verified address. Sign in again with
            this selected wallet before continuing.
          </div>
        )}

        {isConnected && matchesVerifiedAddress && !isSepolia && (
          <div className="connect-notice" role="status">
            Switch to Sepolia to continue to the TipJar application.
          </div>
        )}

        {isConnected && matchesVerifiedAddress && isSepolia ? (
          <button
            className="connect-primary-button"
            type="button"
            onClick={handleContinue}
          >
            Continue to TipJar
          </button>
        ) : isConnected && matchesVerifiedAddress ? (
          <button
            className="connect-primary-button"
            type="button"
            onClick={() => openChainModal?.()}
          >
            Switch to Sepolia
          </button>
        ) : isConnected && !matchesVerifiedAddress ? (
          <div className="connect-auth-actions">
            <SignInButton
              label="Re-authenticate with this wallet"
              variant="primary"
            />
            <button
              className="connect-secondary-button"
              type="button"
              onClick={() => disconnect()}
            >
              Disconnect wallet
            </button>
          </div>
        ) : isConnected ? (
          <button
            className="connect-primary-button"
            type="button"
            onClick={() => disconnect()}
          >
            Disconnect wallet
          </button>
        ) : (
          <button
            className="connect-primary-button"
            type="button"
            onClick={handleConnect}
            disabled={status === "connecting" || status === "reconnecting"}
          >
            {status === "connecting" ? "Connecting..." : "Connect Wallet"}
          </button>
        )}

        <div className="connect-network-status" role="status">
          <span className="landing-eyebrow-dot" />
          {isConnected && matchesVerifiedAddress && isSepolia
            ? "WALLET CONNECTED · ETHEREUM SEPOLIA"
            : "SUPPORTED NETWORK · ETHEREUM SEPOLIA"}
        </div>

        <p className="connect-signature-note">
          SIWE authentication did not submit a transaction or spend gas.
        </p>
      </section>
    </main>
  );
}
