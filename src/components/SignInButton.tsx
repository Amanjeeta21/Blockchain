"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import {
  useAccount,
  useChainId,
  useSignMessage,
} from "wagmi";
import { sepolia } from "wagmi/chains";
import type { Address } from "viem";

import { useVerifiedAddress } from "./VerifiedAddressContext";

type ApiResponse = {
  address?: string;
  nonce?: string;
  error?: string;
};

type SignInButtonProps = {
  label?: string;
  variant?: "default" | "primary";
};

export default function SignInButton({
  label = "Sign In",
  variant = "default",
}: SignInButtonProps) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { signMessageAsync } = useSignMessage();
  const { openConnectModal, connectModalOpen } = useConnectModal();
  const { setVerifiedAddress } = useVerifiedAddress();
  const router = useRouter();
  const [error, setError] = useState("");
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isSelectingWallet, setIsSelectingWallet] = useState(false);
  const signAfterConnection = useRef(false);
  const connectModalWasOpened = useRef(false);
  const signInInProgress = useRef(false);

  const buttonClassName = `siwe-signin-button${variant === "primary" ? " siwe-signin-button-primary" : ""}`;

  const authenticate = useCallback(
    async (signingAddress: Address) => {
      if (signInInProgress.current) return;

      signInInProgress.current = true;
      setIsSigningIn(true);
      setError("");

      try {
        if (chainId !== sepolia.id) {
          throw new Error(
            "Switch your wallet to Ethereum Sepolia before signing in.",
          );
        }

        const nonceResponse = await fetch("/api/siwe/nonce", {
          cache: "no-store",
        });
        const noncePayload = (await nonceResponse.json()) as ApiResponse;

        if (!nonceResponse.ok || !noncePayload.nonce) {
          throw new Error(
            noncePayload.error ?? "Unable to start sign-in.",
          );
        }

        const scheme = window.location.protocol.slice(0, -1);
        const message = [
          `${scheme}://${window.location.host} wants you to sign in with your Ethereum account:`,
          signingAddress,
          "",
          "Sign in to TipJar.",
          "",
          `URI: ${window.location.origin}`,
          "Version: 1",
          `Chain ID: ${sepolia.id}`,
          `Nonce: ${noncePayload.nonce}`,
          `Issued At: ${new Date().toISOString()}`,
        ].join("\n");

        const signature = await signMessageAsync({ message });
        const verifyResponse = await fetch("/api/siwe/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message, signature }),
        });
        const verifyPayload = (await verifyResponse.json()) as ApiResponse;

        if (
          !verifyResponse.ok ||
          !verifyPayload.address ||
          verifyPayload.address.toLowerCase() !==
            signingAddress.toLowerCase()
        ) {
          throw new Error(
            verifyPayload.error ?? "Unable to verify wallet sign-in.",
          );
        }

        setVerifiedAddress(verifyPayload.address);
        router.push("/connect");
      } catch (signInError) {
        if (
          signInError instanceof Error &&
          (signInError.name === "UserRejectedRequestError" ||
            signInError.message.toLowerCase().includes("user rejected") ||
            signInError.message.toLowerCase().includes("user denied"))
        ) {
          setError("Wallet request was rejected. Please try again.");
        } else {
          setError(
            signInError instanceof Error
              ? signInError.message
              : "Unable to sign in with this wallet.",
          );
        }
      } finally {
        signInInProgress.current = false;
        setIsSigningIn(false);
      }
    },
    [chainId, router, setVerifiedAddress, signMessageAsync],
  );

  useEffect(() => {
    if (
      signAfterConnection.current &&
      isConnected &&
      address
    ) {
      signAfterConnection.current = false;
      connectModalWasOpened.current = false;
      setIsSelectingWallet(false);
      void authenticate(address);
      return;
    }

    if (connectModalOpen) {
      connectModalWasOpened.current = true;
      return;
    }

    if (
      signAfterConnection.current &&
      connectModalWasOpened.current &&
      !isConnected
    ) {
      signAfterConnection.current = false;
      connectModalWasOpened.current = false;
      setIsSelectingWallet(false);
      setError("Wallet selection was cancelled. You can try again.");
    }
  }, [address, authenticate, connectModalOpen, isConnected]);

  function handleSignIn() {
    setError("");

    if (isConnected && address) {
      void authenticate(address);
      return;
    }

    if (!openConnectModal) {
      setError("Wallet selection is unavailable. Please try again.");
      return;
    }

    signAfterConnection.current = true;
    connectModalWasOpened.current = false;
    setIsSelectingWallet(true);
    openConnectModal();
  }

  return (
    <div className="siwe-signin">
      <button
        className={buttonClassName}
        type="button"
        onClick={handleSignIn}
        disabled={isSigningIn || isSelectingWallet}
      >
        {isSelectingWallet
          ? "Select Wallet..."
          : isSigningIn
            ? "Signing in..."
            : label}
      </button>
      {error && (
        <span className="siwe-signin-error" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
