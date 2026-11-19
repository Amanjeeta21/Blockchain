
"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  useAccount,
  useBalance,
  useChainId,
  useSwitchChain,
} from "wagmi";
import { sepolia } from "wagmi/chains";
import { formatEther } from "viem";

import TipForm from "../components/TipForm";
import TipList from "../components/TipList";
import TokenBalance from "../components/TokenBalance";
import SendTokens from "../components/SendTokens";

export default function Home() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending: isSwitching } = useSwitchChain();

  const { data: balance, isLoading: isBalanceLoading } = useBalance({
    address,
    chainId: sepolia.id,
  });

  const isWrongNetwork = isConnected && chainId !== sepolia.id;

  const formattedBalance = balance
    ? Number(formatEther(balance.value)).toFixed(4)
    : "0.0000";

  return (
    <main className="page">
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

      <section className="hero">
        <div className="eyebrow">
          <span className="eyebrow-line" />
          DECENTRALIZED SUPPORT
          <span className="eyebrow-line" />
        </div>

        <h1>
          SUPPORT CREATORS.
          <br />
          <span>ON THE BLOCKCHAIN.</span>
        </h1>

        <p className="hero-description">
          A simple way to appreciate the people who create,
          build and inspire. Send support directly through
          the Ethereum network.
        </p>

        <div className="hero-decoration">
          <span />
          <span />
          <span />
        </div>
      </section>

      <section className="dashboard">
        <div className="section-heading">
          <div>
            <p className="section-label">YOUR WEB3 SPACE</p>
            <h2>WALLET OVERVIEW</h2>
          </div>

          <span className="live-indicator">
            <span className="status-dot" />
            LIVE STATUS
          </span>
        </div>

        <div className="wallet-card">
          <div className="wallet-card-top">
            <div className="wallet-icon">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                width="25"
                height="25"
              >
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="M3 9h18M16 14h2" />
              </svg>
            </div>

            <span className="card-tag">WALLET DETAILS</span>
          </div>

          <p className="card-label">CONNECTED ACCOUNT</p>

          <div className="wallet-address">
            {isConnected && address ? (
              <>
                <span className="connected-dot" />
                <span className="address-text">
                  {address.slice(0, 8)}...{address.slice(-8)}
                </span>
              </>
            ) : (
              <span className="disconnected-text">
                NO WALLET CONNECTED
              </span>
            )}
          </div>

          <div className="card-divider" />

          <div className="balance-row">
            <div>
              <p className="card-label">AVAILABLE BALANCE</p>

              <div className="balance">
                {isConnected
                  ? isBalanceLoading
                    ? "Loading..."
                    : formattedBalance
                  : "—"}
                <span className="currency"> ETH</span>
              </div>
            </div>

            <div className="eth-symbol">Ξ</div>
          </div>

          <div className="card-footer">
            <span>NETWORK</span>
            <span className="network-name">ETHEREUM SEPOLIA</span>
          </div>
        </div>

        <div className="network-card">
          <div className="network-card-heading">
            <div>
              <p className="section-label">CONNECTION</p>
              <h3>NETWORK STATUS</h3>
            </div>

            <div className="network-symbol">◎</div>
          </div>

          {!isConnected ? (
            <div className="network-message">
              <span className="status-dot neutral" />

              <div>
                <strong>WALLET NOT CONNECTED</strong>
                <p>Connect your wallet to access the dashboard.</p>
              </div>
            </div>
          ) : isWrongNetwork ? (
            <div className="network-message warning">
              <span className="status-dot warning-dot" />

              <div>
                <strong>WRONG NETWORK DETECTED</strong>
                <p>
                  Please switch your wallet to the Sepolia test network.
                </p>
              </div>
            </div>
          ) : (
            <div className="network-message success">
              <span className="status-dot" />

              <div>
                <strong>CONNECTED TO SEPOLIA</strong>
                <p>Your wallet is connected to the correct network.</p>
              </div>
            </div>
          )}

          {isWrongNetwork && (
            <button
              className="switch-button"
              onClick={() => switchChain({ chainId: sepolia.id })}
              disabled={isSwitching}
            >
              {isSwitching ? "SWITCHING..." : "SWITCH TO SEPOLIA"}
              <span>↗</span>
            </button>
          )}
        </div>
      </section>

      {/* QUANTEK TOKEN BALANCE */}
      <TokenBalance />

      {/* SEND QUANTEK TOKENS */}
      <SendTokens />

      {/* SEND A TIP */}
      <TipForm />

      {/* ON-CHAIN CONTRACT BALANCE AND RECENT TIPS */}
      <TipList />

      <section className="bottom-note">
        <div className="note-symbol">✳</div>

        <div>
          <strong>BUILT ON ETHEREUM</strong>
          <p>
            Transparent transactions. Direct wallet interaction.
            No intermediaries.
          </p>
        </div>

        <span className="note-network">WEB3 / 01</span>
      </section>

      <footer className="footer">
        <span>TIPJAR © 2026</span>
        <span>POWERED BY ETHEREUM</span>
        <span>BUILT FOR CREATORS</span>
      </footer>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500;600;700;800;900&display=swap');

        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          background: #f1f1f3;
          color: #202024;
          font-family: 'DM Sans', sans-serif;
        }

        button,
        a {
          font: inherit;
        }

        .page {
          min-height: 100vh;
          padding: 0 7%;
          max-width: 1600px;
          margin: auto;
        }

        .navbar {
          height: 88px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid #dedee2;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 11px;
          color: #202024;
          text-decoration: none;
          font-size: 17px;
          font-weight: 900;
          letter-spacing: 2px;
        }

        .brand-icon {
          width: 34px;
          height: 34px;
          display: grid;
          place-items: center;
          background: #29262f;
          color: white;
          border-radius: 9px;
          font-size: 18px;
        }

        .brand-dot {
          color: #7965a8;
        }

        .nav-right {
          display: flex;
          align-items: center;
          gap: 25px;
        }

        .network-label,
        .live-indicator {
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          letter-spacing: 1px;
          color: #66656d;
        }

        .status-dot,
        .connected-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #7965a8;
          display: inline-block;
          flex-shrink: 0;
        }

        .hero {
          text-align: center;
          padding: 88px 0 76px;
        }

        .eyebrow {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 13px;
          color: #7965a8;
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          letter-spacing: 2.5px;
        }

        .eyebrow-line {
          height: 1px;
          width: 30px;
          background: #bcb4cb;
        }

        .hero h1 {
          font-size: clamp(37px, 6vw, 72px);
          line-height: 1.08;
          letter-spacing: -3px;
          font-weight: 900;
          margin: 25px 0 18px;
          color: #242329;
        }

        .hero h1 span {
          color: #7965a8;
        }

        .hero-description {
          max-width: 520px;
          margin: 0 auto;
          color: #777780;
          font-size: 14px;
          line-height: 1.9;
        }

        .hero-decoration {
          display: flex;
          justify-content: center;
          gap: 6px;
          margin-top: 30px;
        }

        .hero-decoration span {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #7965a8;
          opacity: 0.35;
        }

        .hero-decoration span:nth-child(2) {
          opacity: 1;
          width: 20px;
          border-radius: 5px;
        }

        .dashboard {
          max-width: 1050px;
          margin: 0 auto;
        }

        .section-heading {
          display: flex;
          justify-content: space-between;
          align-items: end;
          margin-bottom: 18px;
        }

        .section-label {
          font-family: 'DM Mono', monospace;
          font-size: 9px;
          letter-spacing: 2px;
          color: #8a8494;
          margin: 0 0 7px;
        }

        .section-heading h2,
        .network-card h3 {
          font-size: 19px;
          font-weight: 800;
          letter-spacing: 0.5px;
          margin: 0;
        }

        .wallet-card {
          background: #29272f;
          color: #fff;
          border-radius: 14px;
          padding: 30px 34px 22px;
          position: relative;
          overflow: hidden;
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }

        .wallet-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 18px 35px rgba(34, 29, 45, 0.14);
        }

        .wallet-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 27px;
        }

        .wallet-icon {
          width: 43px;
          height: 43px;
          display: grid;
          place-items: center;
          border-radius: 10px;
          background: #403b4b;
          color: #c6b8e3;
        }

        .card-tag {
          color: #b6acc9;
          font-family: 'DM Mono', monospace;
          font-size: 9px;
          letter-spacing: 1.5px;
        }

        .card-label {
          color: #aaa6b2;
          font-family: 'DM Mono', monospace;
          font-size: 9px;
          letter-spacing: 1.5px;
          margin: 0 0 10px;
        }

        .wallet-address {
          display: flex;
          align-items: center;
          gap: 10px;
          min-height: 26px;
          font-family: 'DM Mono', monospace;
          font-size: 14px;
        }

        .address-text {
          color: #eeeaf5;
        }

        .disconnected-text {
          color: #aaa6b2;
          font-size: 11px;
        }

        .card-divider {
          height: 1px;
          background: #48444f;
          margin: 25px 0;
        }

        .balance-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .balance {
          font-size: clamp(29px, 5vw, 42px);
          font-weight: 700;
          letter-spacing: -1px;
        }

        .currency {
          font-size: 15px;
          color: #b9afce;
          letter-spacing: 0;
        }

        .eth-symbol {
          width: 55px;
          height: 55px;
          display: grid;
          place-items: center;
          border: 1px solid #655b78;
          border-radius: 50%;
          color: #c6b8e3;
          font-size: 32px;
          font-weight: 400;
        }

        .card-footer {
          border-top: 1px solid #48444f;
          margin-top: 27px;
          padding-top: 17px;
          display: flex;
          justify-content: space-between;
          font-family: 'DM Mono', monospace;
          font-size: 9px;
          letter-spacing: 1.5px;
          color: #aaa6b2;
        }

        .network-name {
          color: #d0c6e3;
        }

        .network-card {
          background: #fff;
          border: 1px solid #e4e2e8;
          border-radius: 14px;
          padding: 25px 30px;
          margin-top: 17px;
          transition: border-color 0.25s ease, transform 0.25s ease;
        }

        .network-card:hover {
          border-color: #b8aacd;
          transform: translateY(-2px);
        }

        .network-card-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .network-card h3 {
          font-size: 15px;
        }

        .network-symbol {
          width: 37px;
          height: 37px;
          display: grid;
          place-items: center;
          border-radius: 10px;
          background: #f0edf5;
          color: #7965a8;
          font-size: 23px;
        }

        .network-message {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          margin-top: 23px;
          padding: 16px;
          border-radius: 9px;
          background: #f5f4f7;
        }

        .network-message .status-dot {
          margin-top: 5px;
        }

        .network-message strong {
          font-size: 11px;
          letter-spacing: 0.7px;
        }

        .network-message p {
          margin: 5px 0 0;
          font-size: 12px;
          color: #85818b;
          line-height: 1.6;
        }

        .network-message.success {
          background: #f0f3f0;
        }

        .network-message.success .status-dot {
          background: #58866a;
        }

        .network-message.warning {
          background: #f7f2ec;
        }

        .warning-dot {
          background: #c38a48 !important;
        }

        .status-dot.neutral {
          background: #aaa6b2;
        }

        .switch-button {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          margin-top: 15px;
          padding: 14px 17px;
          border: 1px solid #7965a8;
          border-radius: 8px;
          background: #7965a8;
          color: #fff;
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          letter-spacing: 1px;
          cursor: pointer;
          transition: background 0.2s ease, transform 0.2s ease;
        }

        .switch-button:hover:not(:disabled) {
          background: #625087;
          transform: translateY(-2px);
        }

        .switch-button:disabled {
          opacity: 0.6;
          cursor: wait;
        }

        .switch-button span {
          font-size: 17px;
        }

        .bottom-note {
          max-width: 1050px;
          margin: 55px auto 35px;
          padding: 20px 22px;
          display: flex;
          align-items: center;
          gap: 15px;
          border-top: 1px solid #dedee2;
          border-bottom: 1px solid #dedee2;
        }

        .note-symbol {
          color: #7965a8;
          font-size: 25px;
        }

        .bottom-note strong {
          font-size: 10px;
          letter-spacing: 1px;
        }

        .bottom-note p {
          color: #85818b;
          font-size: 11px;
          margin: 5px 0 0;
        }

        .note-network {
          margin-left: auto;
          color: #96919e;
          font-family: 'DM Mono', monospace;
          font-size: 9px;
          letter-spacing: 1px;
        }

        .footer {
          border-top: 1px solid #dedee2;
          min-height: 65px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: #92909a;
          font-family: 'DM Mono', monospace;
          font-size: 9px;
          letter-spacing: 1px;
        }

        @media (max-width: 650px) {
          .page {
            padding: 0 5%;
          }

          .navbar {
            height: 75px;
          }

          .nav-right {
            gap: 10px;
          }

          .network-label {
            display: none;
          }

          .hero {
            padding: 70px 0 55px;
          }

          .hero h1 {
            letter-spacing: -1.8px;
          }

          .hero-description {
            font-size: 12px;
            padding: 0 10px;
          }

          .wallet-card {
            padding: 24px 21px 19px;
          }

          .network-card {
            padding: 22px 19px;
          }

          .section-heading h2 {
            font-size: 16px;
          }

          .live-indicator {
            font-size: 8px;
          }

          .bottom-note {
            margin-top: 40px;
            padding: 18px 5px;
          }

          .note-network {
            display: none;
          }

          .footer {
            gap: 12px;
            flex-wrap: wrap;
            padding: 18px 0;
            font-size: 8px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            transition-duration: 0.01ms !important;
            animation-duration: 0.01ms !important;
          }
        }
      `}</style>
    </main>
  );
}
