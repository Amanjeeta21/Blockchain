"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";

export default function Navbar() {
  return (
    <header className="navbar">
      <a href="/" className="brand">
        <span className="brand-icon">T</span>
        <span>
          TIPJAR<span className="brand-dot">.</span>
        </span>
      </a>

      <div className="nav-right">
        <span className="network-label">
          <span className="status-dot" />
          SEPOLIA TESTNET
        </span>
        <ConnectButton />
      </div>
    </header>
  );
}
