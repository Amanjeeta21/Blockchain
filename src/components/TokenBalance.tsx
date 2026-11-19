
"use client";

import { formatUnits, zeroAddress } from "viem";
import { useAccount, useReadContracts } from "wagmi";
import { sepolia } from "wagmi/chains";

import {
  QUANTEK_TOKEN_ABI,
  QUANTEK_TOKEN_ADDRESS,
} from "@/lib/contracts";

function formatTokenBalance(balance: bigint, decimals: number): string {
  const [whole = "0", fraction] = formatUnits(balance, decimals).split(".");

  if (!fraction) return whole;

  const visibleFraction = fraction.slice(0, 6).replace(/0+$/, "");
  return visibleFraction ? `${whole}.${visibleFraction}` : whole;
}

export default function TokenBalance() {
  const { address, isConnected } = useAccount();

  const {
    data,
    isLoading,
    isError,
  } = useReadContracts({
    contracts: [
      {
        address: QUANTEK_TOKEN_ADDRESS,
        abi: QUANTEK_TOKEN_ABI,
        functionName: "balanceOf",
        args: [address ?? zeroAddress],
        chainId: sepolia.id,
      },
      {
        address: QUANTEK_TOKEN_ADDRESS,
        abi: QUANTEK_TOKEN_ABI,
        functionName: "symbol",
        chainId: sepolia.id,
      },
      {
        address: QUANTEK_TOKEN_ADDRESS,
        abi: QUANTEK_TOKEN_ABI,
        functionName: "decimals",
        chainId: sepolia.id,
      },
    ],
    query: {
      enabled: isConnected && Boolean(address),
    },
  });

  const balance = data?.[0]?.result as bigint | undefined;
  const symbol = data?.[1]?.result as string | undefined;
  const decimals = data?.[2]?.result as number | undefined;

  const hasError =
    isError ||
    data?.some((result) => result.status === "failure") === true;

  return (
    <section className="token-balance" aria-labelledby="token-balance-heading">
      <div className="token-balance-heading">
        <div>
          <p className="token-balance-eyebrow">YOUR ASSETS</p>
          <h2 id="token-balance-heading">TOKEN BALANCE</h2>
        </div>

        <span className="token-balance-network">SEPOLIA</span>
      </div>

      {!isConnected ? (
        <p className="token-balance-message">
          Connect your wallet to view your token balance.
        </p>
      ) : isLoading ? (
        <p className="token-balance-value" aria-live="polite">
          Loading balance...
        </p>
      ) : hasError ||
        balance === undefined ||
        decimals === undefined ? (
        <p className="token-balance-error" role="alert">
          Unable to load your token balance. Check the token contract and
          Sepolia RPC configuration.
        </p>
      ) : (
        <p className="token-balance-value" aria-live="polite">
          {formatTokenBalance(balance, decimals)}
          <span>{symbol ?? "tokens"}</span>
        </p>
      )}

      <style jsx>{`
        .token-balance {
          width: 100%;
          max-width: 1050px;
          margin: 18px auto;
          padding: 24px 28px;
          border: 1px solid var(--border);
          border-radius: 12px;
          background: var(--surface);
          color: var(--foreground);
        }

        .token-balance-heading {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
        }

        .token-balance-eyebrow {
          margin: 0 0 7px;
          color: var(--muted);
          font-family: "DM Mono", monospace;
          font-size: 9px;
          letter-spacing: 2px;
        }

        .token-balance-heading h2 {
          margin: 0;
          color: var(--foreground);
          font-size: 16px;
          font-weight: 800;
          letter-spacing: 0.5px;
        }

        .token-balance-network {
          padding: 7px 10px;
          border: 1px solid var(--border-strong);
          border-radius: 20px;
          background: var(--surface-raised);
          color: var(--accent);
          font-family: "DM Mono", monospace;
          font-size: 9px;
          letter-spacing: 1px;
        }

        .token-balance-value {
          margin: 20px 0 0;
          color: var(--foreground);
          font-size: clamp(24px, 4vw, 34px);
          font-weight: 800;
          letter-spacing: -1px;
          overflow-wrap: anywhere;
        }

        .token-balance-value span {
          margin-left: 9px;
          color: var(--accent);
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0;
        }

        .token-balance-message,
        .token-balance-error {
          margin: 20px 0 0;
          color: var(--muted);
          font-size: 13px;
          line-height: 1.6;
        }

        .token-balance-error {
          color: var(--danger);
        }

        @media (max-width: 650px) {
          .token-balance {
            padding: 21px 19px;
          }
        }
      `}</style>
    </section>
  );
}
