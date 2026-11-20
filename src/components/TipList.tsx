
"use client";

import { useMemo } from "react";
import { formatEther } from "viem";
import {
  useBalance,
  useReadContract,
  useReadContracts,
  useWatchContractEvent,
} from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import { sepolia } from "wagmi/chains";

import { TIPJAR_ABI, TIPJAR_ADDRESS } from "@/lib/contracts";

const MAX_VISIBLE_TIPS = 10;

function formatTipAmount(amount: bigint): string {
  const [whole, fraction = ""] = formatEther(amount).split(".");
  return `${whole}.${fraction.padEnd(4, "0").slice(0, 4)}`;
}

function formatDate(timestamp: bigint): {
  date: string;
  time: string;
  iso: string;
} {
  const date = new Date(Number(timestamp) * 1000);

  return {
    date: date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    time: date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    iso: date.toISOString(),
  };
}

export default function TipList() {
  const queryClient = useQueryClient();

  const {
    data: contractBalance,
    isLoading: isBalanceLoading,
    isError: isBalanceError,
  } = useBalance({
    address: TIPJAR_ADDRESS,
    chainId: sepolia.id,
  });

  const {
    data: tipCount,
    error: countError,
    isError: isCountError,
    isLoading: isCountLoading,
    isSuccess: isCountLoaded,
  } = useReadContract({
    address: TIPJAR_ADDRESS,
    abi: TIPJAR_ABI,
    functionName: "getTipCount",
    chainId: sepolia.id,
  });

  const tipIndices = useMemo(() => {
    if (tipCount === undefined) return [];

    const visibleCount = Number(
      tipCount > BigInt(MAX_VISIBLE_TIPS)
        ? BigInt(MAX_VISIBLE_TIPS)
        : tipCount,
    );

    return Array.from(
      { length: visibleCount },
      (_, index) => tipCount - BigInt(index) - 1n,
    );
  }, [tipCount]);

  const {
    data: tipResults,
    error: tipsError,
    isError: isTipsError,
    isLoading: areTipsLoading,
  } = useReadContracts({
    contracts: tipIndices.map((index) => ({
      address: TIPJAR_ADDRESS,
      abi: TIPJAR_ABI,
      functionName: "getTip" as const,
      args: [index] as const,
      chainId: sepolia.id,
    })),
    query: {
      enabled: isCountLoaded && tipIndices.length > 0,
    },
  });

  useWatchContractEvent({
    address: TIPJAR_ADDRESS,
    abi: TIPJAR_ABI,
    eventName: "TipSent",
    chainId: sepolia.id,
    onLogs() {
      void queryClient.invalidateQueries();
    },
  });

  const failedTip = tipResults?.find(
    (result) => result.status === "failure",
  );

  const isLoading =
    isCountLoading ||
    isBalanceLoading ||
    (tipIndices.length > 0 && areTipsLoading);

  const hasError =
    isCountError ||
    isTipsError ||
    isBalanceError ||
    Boolean(failedTip);

  const errorMessage =
    countError?.message ??
    tipsError?.message ??
    failedTip?.error.message ??
    "Unable to load TipJar contract data.";

  const tips = useMemo(
    () =>
      (tipResults ?? []).flatMap((result) =>
        result.status === "success" ? [result.result] : [],
      ),
    [tipResults],
  );

  return (
    <section className="tip-section" aria-labelledby="tip-list-heading">
      <div className="tip-section-top">
        <div>
          <p className="tip-eyebrow">ON-CHAIN ACTIVITY</p>
          <h2 id="tip-list-heading">RECENT TIPS</h2>
          <p className="tip-subtitle">
            Every contribution, recorded transparently on Ethereum.
          </p>
        </div>

        <div className="live-pill">
          <span className="live-dot" />
          SEPOLIA LIVE
        </div>
      </div>

      <div className="tip-stats">
        <div className="tip-stat-card">
          <div className="stat-top">
            <span className="stat-label">TOTAL TIPS</span>
            <span className="stat-icon">↗</span>
          </div>

          <div className="stat-value">
            {isCountLoading ? "—" : tipCount?.toString() ?? "—"}
          </div>

          <span className="stat-caption">
            Contributions received
          </span>
        </div>

        <div className="tip-stat-card balance-stat">
          <div className="stat-top">
            <span className="stat-label">CONTRACT BALANCE</span>
            <span className="stat-icon eth-icon">Ξ</span>
          </div>

          <div className="stat-value balance-value">
            {isBalanceLoading
              ? "Loading..."
              : contractBalance
                ? formatTipAmount(contractBalance.value)
                : "—"}
            {!isBalanceLoading && contractBalance && (
              <span className="stat-currency"> ETH</span>
            )}
          </div>

          <span className="stat-caption">
            ETH currently held by TipJar
          </span>
        </div>
      </div>

      <div className="transactions-heading">
        <div>
          <p className="transactions-label">COMMUNITY</p>
          <h3>LATEST TRANSACTIONS</h3>
        </div>

        {tipCount !== undefined && (
          <span className="records-count">
            {tipCount.toString()} RECORDS
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="tip-state">
          <span className="tip-spinner" />
          <p>FETCHING ON-CHAIN TRANSACTIONS...</p>
        </div>
      ) : hasError ? (
        <div className="tip-state tip-error" role="alert">
          <span className="state-icon">!</span>
          <strong>UNABLE TO LOAD TRANSACTIONS</strong>
          <p>{errorMessage}</p>
        </div>
      ) : !tipCount ? (
        <div className="tip-state">
          <span className="empty-icon">Ξ</span>
          <strong>NO TIPS YET</strong>
          <p>Be the first to support a creator!</p>
        </div>
      ) : (
        <div className="transactions-list">
          {tips.map((tip, index) => {
            const formattedDate = formatDate(tip.timestamp);

            return (
              <article
                className="transaction-card"
                key={`${tip.from}-${tip.timestamp}-${index}`}
              >
                <div className="transaction-top">
                  <div className="transaction-identity">
                    <div className="sender-avatar">
                      {tip.from.slice(2, 4).toUpperCase()}
                    </div>

                    <div className="sender-details">
                      <span className="transaction-number">
                        TIP #
                        {(Number(tipCount) - index)
                          .toString()
                          .padStart(2, "0")}
                      </span>

                      <span className="sender-address">
                        {tip.from.slice(0, 8)}...
                        {tip.from.slice(-6)}
                      </span>
                    </div>
                  </div>

                  <span className="confirmed-pill">
                    <span />
                    CONFIRMED
                  </span>
                </div>

                <div className="transaction-amount">
                  {formatTipAmount(tip.amount)}
                  <span> ETH</span>
                </div>

                <div className="transaction-message">
                  <span className="message-mark">“</span>
                  <p>{tip.message}</p>
                </div>

                <div className="transaction-footer">
                  <span className="transaction-date">
                    {formattedDate.date}
                    <span className="date-separator">·</span>
                    {formattedDate.time}
                  </span>

                  <span className="transaction-network">
                    <span className="network-dot" />
                    ETHEREUM
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <style jsx>{`
        .tip-section {
          grid-column: 1 / -1;
          width: 100%;
          max-width: none;
          min-width: 0;
          margin: 0 auto;
          padding: 23px;
          overflow: hidden;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 12px;
          color: var(--foreground);
        }

        .tip-section-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 19px;
        }

        .tip-eyebrow,
        .transactions-label {
          margin: 0 0 6px;
          color: var(--muted);
          font-family: "DM Mono", monospace;
          font-size: 9px;
          letter-spacing: 1.8px;
        }

        .tip-section-top h2 {
          margin: 0;
          color: var(--foreground);
          font-size: 21px;
          font-weight: 900;
          letter-spacing: 0.3px;
        }

        .tip-subtitle {
          margin: 7px 0 0;
          color: var(--muted);
          font-size: 12px;
          line-height: 1.6;
        }

        .live-pill {
          display: flex;
          align-items: center;
          gap: 7px;
          flex-shrink: 0;
          padding: 7px 10px;
          border: 1px solid var(--border-strong);
          border-radius: 30px;
          color: var(--accent);
          font-family: "DM Mono", monospace;
          font-size: 9px;
          letter-spacing: 0.8px;
        }

        .live-dot,
        .confirmed-pill span,
        .network-dot {
          width: 6px;
          height: 6px;
          flex-shrink: 0;
          border-radius: 50%;
          background: var(--accent);
        }

        .tip-stats {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 11px;
        }

        .tip-stat-card {
          min-width: 0;
          padding: 14px 16px;
          border: 1px solid var(--border);
          border-radius: 9px;
          background: var(--surface-raised);
          transition: border-color 0.2s ease;
        }

        .tip-stat-card:hover {
          border-color: var(--border-strong);
        }

        .stat-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .stat-label {
          color: var(--muted);
          font-family: "DM Mono", monospace;
          font-size: 9px;
          letter-spacing: 1.3px;
        }

        .stat-icon {
          display: grid;
          width: 26px;
          height: 26px;
          place-items: center;
          border-radius: 7px;
          background: var(--surface-soft);
          color: var(--accent);
          font-size: 16px;
        }

        .eth-icon {
          font-size: 19px;
        }

        .stat-value {
          margin-top: 12px;
          color: var(--foreground);
          font-size: 29px;
          font-weight: 800;
          letter-spacing: -1px;
          line-height: 1.2;
          overflow-wrap: anywhere;
        }

        .balance-value {
          font-size: clamp(21px, 3vw, 27px);
          letter-spacing: -0.7px;
        }

        .stat-currency {
          color: var(--muted);
          font-size: 12px;
          letter-spacing: 0;
        }

        .stat-caption {
          display: block;
          margin-top: 5px;
          color: var(--muted);
          font-size: 10px;
        }

        .transactions-heading {
          display: flex;
          align-items: end;
          justify-content: space-between;
          gap: 12px;
          margin: 23px 0 12px;
        }

        .transactions-label {
          margin-bottom: 5px;
        }

        .transactions-heading h3 {
          margin: 0;
          color: var(--foreground);
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.7px;
        }

        .records-count {
          color: var(--muted);
          font-family: "DM Mono", monospace;
          font-size: 9px;
          letter-spacing: 0.8px;
        }

        .transactions-list {
          display: grid;
          grid-template-columns: repeat(
            auto-fit,
            minmax(min(100%, 270px), 1fr)
          );
          gap: 12px;
          align-items: stretch;
        }

        .transaction-card {
          display: flex;
          min-width: 0;
          flex-direction: column;
          padding: 15px 16px 13px;
          border: 1px solid var(--border);
          border-radius: 9px;
          background: var(--surface-raised);
          transition:
            border-color 0.2s ease,
            transform 0.2s ease;
        }

        .transaction-card:hover {
          border-color: var(--border-strong);
          transform: translateY(-2px);
        }

        .transaction-top,
        .transaction-identity,
        .transaction-footer {
          display: flex;
          align-items: center;
        }

        .transaction-top {
          justify-content: space-between;
          gap: 10px;
        }

        .transaction-identity {
          min-width: 0;
          gap: 10px;
        }

        .sender-avatar {
          display: grid;
          width: 34px;
          height: 34px;
          flex-shrink: 0;
          place-items: center;
          border: 1px solid var(--border-strong);
          border-radius: 8px;
          background: var(--surface-soft);
          color: var(--accent);
          font-family: "DM Mono", monospace;
          font-size: 11px;
        }

        .sender-details {
          display: flex;
          min-width: 0;
          flex-direction: column;
          gap: 4px;
        }

        .transaction-number {
          color: var(--accent);
          font-family: "DM Mono", monospace;
          font-size: 9px;
          letter-spacing: 0.8px;
        }

        .sender-address {
          overflow: hidden;
          color: var(--foreground);
          font-family: "DM Mono", monospace;
          font-size: 10px;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .confirmed-pill {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-shrink: 0;
          padding: 5px 8px;
          border: 1px solid var(--border-strong);
          border-radius: 20px;
          color: var(--muted);
          font-family: "DM Mono", monospace;
          font-size: 8px;
          letter-spacing: 0.6px;
        }

        .confirmed-pill span {
          width: 5px;
          height: 5px;
        }

        .transaction-amount {
          margin: 14px 0 11px;
          color: var(--foreground);
          font-size: 24px;
          font-weight: 800;
          letter-spacing: -0.5px;
        }

        .transaction-amount span {
          color: var(--muted);
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0;
        }

        .transaction-message {
          display: flex;
          flex: 1;
          align-items: flex-start;
          gap: 8px;
          min-width: 0;
          padding: 10px 12px;
          border: 1px solid var(--border);
          border-radius: 7px;
          background: var(--surface);
        }

        .message-mark {
          color: var(--muted-dark);
          font-family: Georgia, serif;
          font-size: 25px;
          line-height: 0.9;
        }

        .transaction-message p {
          min-width: 0;
          margin: 2px 0 0;
          color: var(--muted);
          font-size: 11px;
          line-height: 1.6;
          overflow-wrap: anywhere;
        }

        .transaction-footer {
          justify-content: space-between;
          gap: 10px;
          margin-top: 11px;
        }

        .transaction-date,
        .transaction-network {
          color: var(--muted);
          font-family: "DM Mono", monospace;
          font-size: 9px;
          letter-spacing: 0.4px;
        }

        .date-separator {
          padding: 0 7px;
          color: var(--muted-dark);
        }

        .transaction-network {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-shrink: 0;
          font-size: 8px;
        }

        .network-dot {
          width: 5px;
          height: 5px;
        }

        .tip-state {
          display: flex;
          min-height: 125px;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 20px 15px;
          border: 1px dashed var(--border-strong);
          border-radius: 9px;
          color: var(--foreground);
          text-align: center;
        }

        .tip-state strong {
          font-size: 11px;
          letter-spacing: 0.8px;
        }

        .tip-state p {
          max-width: 100%;
          margin: 0;
          color: var(--muted);
          font-size: 11px;
          line-height: 1.6;
          overflow-wrap: anywhere;
        }

        .empty-icon {
          color: var(--accent);
          font-size: 31px;
        }

        .state-icon {
          display: grid;
          width: 27px;
          height: 27px;
          place-items: center;
          border-radius: 50%;
          background: var(--surface-soft);
          color: var(--danger);
          font-weight: 800;
        }

        .tip-error {
          color: var(--danger);
        }

        .tip-spinner {
          width: 22px;
          height: 22px;
          border: 2px solid var(--border);
          border-top-color: var(--accent);
          border-radius: 50%;
          animation: tip-spin 0.8s linear infinite;
        }

        @keyframes tip-spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 650px) {
          .tip-section {
            padding: 19px 15px;
          }

          .tip-section-top {
            flex-direction: column;
            gap: 12px;
          }

          .tip-stats {
            grid-template-columns: 1fr;
          }

          .stat-value {
            font-size: 27px;
          }

          .transactions-list {
            grid-template-columns: 1fr;
          }

          .transaction-card {
            padding: 14px 12px 12px;
          }

          .transaction-footer {
            align-items: flex-start;
            flex-direction: column;
          }

          .transaction-amount {
            font-size: 22px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .tip-section *,
          .tip-section *::before,
          .tip-section *::after {
            animation-duration: 0.01ms !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </section>
  );
}
