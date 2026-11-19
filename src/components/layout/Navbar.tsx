
"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";

export default function Navbar() {
  return (
    <header className="navbar">
      <a href="/" className="brand">
        <span className="brand-icon">T</span>

        <span className="brand-name">
          TIPJAR<span className="brand-dot">.</span>
        </span>
      </a>

      <div className="nav-right">
        <div className="network-label">
          <span className="status-dot" />
          <span>SEPOLIA TESTNET</span>
        </div>

        <ConnectButton />
      </div>
    </header>
  );
}
