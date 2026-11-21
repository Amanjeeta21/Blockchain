"use client";

import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";

export default function LandingNavbar() {
  const { isConnected } = useAccount();

  return (
    <header className="navbar landing-navbar">
      <Link href="/" className="brand" aria-label="TipJar home">
        <span className="brand-icon">T</span>
        <span className="brand-name">
          TIPJAR<span className="brand-dot">.</span>
        </span>
      </Link>

      {isConnected && (
        <div className="nav-right">
          <ConnectButton showBalance={false} chainStatus="icon" />
        </div>
      )}
    </header>
  );
}
