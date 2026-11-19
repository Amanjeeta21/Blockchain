"use client";

import { formatEther } from "viem";
import { useAccount, useBalance } from "wagmi";
import { sepolia } from "wagmi/chains";

export default function WalletOverview() {
  const { address, isConnected } = useAccount();
  const { data: balance, isLoading: isBalanceLoading } =
    useBalance({
      address,
      chainId: sepolia.id,
    });

  const formattedBalance = balance
    ? Number(formatEther(balance.value)).toFixed(4)
    : "0.0000";

  return (
    <>
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
              <rect
                x="3"
                y="5"
                width="18"
                height="14"
                rx="2"
              />
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
    </>
  );
}
