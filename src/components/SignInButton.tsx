"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useChainModal, useConnectModal } from "@rainbow-me/rainbowkit";
import {
  useAccount,
  useConfig,
  useSignMessage,
} from "wagmi";
import { getAccount } from "wagmi/actions";
import { sepolia } from "wagmi/chains";
import type { Address } from "viem";

import { useVerifiedAddress } from "./VerifiedAddressContext";

type ApiResponse = {
  address?: string;
  nonce?: string;
  error?: string;
};

export default function SignInButton() {
  const { address, chainId, isConnected, status } = useAccount();
  const config = useConfig();
  const { signMessageAsync } = useSignMessage();
  const { openConnectModal, connectModalOpen } = useConnectModal();
  const { openChainModal } = useChainModal();
  const { setVerifiedAddress } = useVerifiedAddress();
  const [error, setError] = useState("");
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isSelectingWallet, setIsSelectingWallet] = useState(false);
  const signAfterConnection = useRef(false);
  const connectModalWasOpened = useRef(false);
  const signInInProgress = useRef(false);

  const needsSepolia = isConnected && chainId !== sepolia.id;
  const isConnecting = status === "connecting" || status === "reconnecting";

  const authenticate = useCallback(
    async (signingAddress: Address) => {
      if (signInInProgress.current) return;

      signInInProgress.current = true;
      setIsSigningIn(true);
      setError("");

      try {
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

        const signature = await signMessageAsync({
          account: signingAddress,
          message,
        });
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

        const currentAccount = getAccount(config);

        if (
          !currentAccount.isConnected ||
          currentAccount.address?.toLowerCase() !== signingAddress.toLowerCase() ||
          currentAccount.chainId !== sepolia.id
        ) {
          throw new Error("Your wallet or network changed. Please sign in again.");
        }

        setVerifiedAddress(verifyPayload.address);
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
    [config, setVerifiedAddress, signMessageAsync],
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
      if (chainId === sepolia.id) {
        void authenticate(address);
      }
      return;
    }

    if (connectModalOpen) {
      connectModalWasOpened.current = true;
      return;
    }

    if (
      signAfterConnection.current &&
      connectModalWasOpened.current &&
      !isConnected &&
      !isConnecting
    ) {
      signAfterConnection.current = false;
      connectModalWasOpened.current = false;
      setIsSelectingWallet(false);
      setError("Wallet selection was cancelled. You can try again.");
    }
  }, [address, authenticate, chainId, connectModalOpen, isConnected, isConnecting]);

  function handleSignIn() {
    setError("");

    if (needsSepolia) {
      if (openChainModal) {
        openChainModal();
      } else {
        setError("Switch to Ethereum Sepolia in your wallet to sign in.");
      }
      return;
    }

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
        className="siwe-signin-button siwe-signin-button-primary"
        type="button"
        onClick={handleSignIn}
        disabled={isSigningIn || isSelectingWallet || isConnecting}
      >
        {isConnecting
          ? "Connecting..."
          : isSelectingWallet
            ? "Select Wallet..."
            : isSigningIn
              ? "Signing in..."
              : needsSepolia
                ? "Switch to Sepolia"
                : isConnected
                  ? "Sign In With Ethereum"
                  : "Connect Wallet"}
      </button>
      {error && (
        <span className="siwe-signin-error" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
