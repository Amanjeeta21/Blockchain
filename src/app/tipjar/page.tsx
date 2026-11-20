"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAccount, useChainId } from "wagmi";
import { sepolia } from "wagmi/chains";

import BottomNote from "../../components/layout/BottomNote";
import Footer from "../../components/layout/Footer";
import Hero from "../../components/layout/Hero";
import Navbar from "../../components/layout/Navbar";
import NetworkStatus from "../../components/dashboard/NetworkStatus";
import WalletOverview from "../../components/dashboard/WalletOverview";
import TipSection from "../../components/sections/TipSection";
import TokenSection from "../../components/sections/TokenSection";
import TipHistory from "../../components/TipHistory";
import { useVerifiedAddress } from "../../components/VerifiedAddressContext";

export default function TipJarPage() {
  const router = useRouter();
  const { verifiedAddress } = useVerifiedAddress();
  const { address, isConnected } = useAccount();
  const chainId = useChainId();

  const isVerifiedWalletConnected =
    Boolean(address) &&
    Boolean(verifiedAddress) &&
    address?.toLowerCase() === verifiedAddress.toLowerCase();

  useEffect(() => {
    if (!verifiedAddress) {
      router.replace("/");
    } else if (
      !isConnected ||
      !isVerifiedWalletConnected ||
      chainId !== sepolia.id
    ) {
      router.replace("/connect");
    }
  }, [
    chainId,
    isConnected,
    isVerifiedWalletConnected,
    router,
    verifiedAddress,
  ]);

  if (!verifiedAddress) {
    return (
      <main className="page">
        <p className="tipjar-auth-message">
          Sign in with Ethereum to access TipJar. Returning to the landing
          page...
        </p>
      </main>
    );
  }

  if (
    !isConnected ||
    !isVerifiedWalletConnected ||
    chainId !== sepolia.id
  ) {
    return (
      <main className="page">
        <p className="tipjar-auth-message">
          Confirm your verified Sepolia wallet to continue...
        </p>
      </main>
    );
  }

  return (
    <main className="page">
      <Navbar />

      <section className="hero-section">
        <Hero />

        <div className="hero-dashboard">
          <WalletOverview />
          <NetworkStatus />
        </div>
      </section>

      <section className="action-section">
        <div className="action-grid">
          <TokenSection />
          <TipSection />
        </div>
      </section>

      <TipHistory />

      <BottomNote />
      <Footer />
    </main>
  );
}
