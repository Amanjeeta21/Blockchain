
"use client";

import {
  useAccount,
  useSwitchChain,
} from "wagmi";
import { sepolia } from "wagmi/chains";

export default function NetworkStatus() {
  const { isConnected, chainId } = useAccount();

  const { switchChain, isPending: isSwitching } =
    useSwitchChain();

  const isWrongNetwork =
    isConnected && chainId !== sepolia.id;

  return (
    <div className="network-card">
      <div className="network-card-heading">
        <div>
          <p className="section-label">CONNECTION</p>
          <h3>NETWORK STATUS</h3>
        </div>

        <div className="network-symbol" aria-hidden="true">
          ◎
        </div>
      </div>

      {!isConnected ? (
        <div className="network-message">
          <span className="status-dot neutral" />

          <div>
            <strong>WALLET NOT CONNECTED</strong>
            <p>
              Connect your wallet to access the dashboard.
            </p>
          </div>
        </div>
      ) : isWrongNetwork ? (
        <div className="network-message warning">
          <span className="status-dot warning-dot" />

          <div>
            <strong>WRONG NETWORK DETECTED</strong>
            <p>
              Please switch your wallet to the Sepolia test
              network.
            </p>
          </div>
        </div>
      ) : (
        <div className="network-message success">
          <span className="status-dot" />

          <div>
            <strong>CONNECTED TO SEPOLIA</strong>
            <p>
              Your wallet is connected to the correct network.
            </p>
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
  );
}
