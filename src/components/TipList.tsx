
"use client";

import { useMemo } from "react";
import { formatEther } from "viem";
import {
  useBalance,
  useReadContract,
  useReadContracts,
} from "wagmi";
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
                key={`${tip.sender}-${tip.timestamp}-${index}`}
              >
                <div className="transaction-top">
                  <div className="transaction-identity">
                    <div className="sender-avatar">
                      {tip.sender.slice(2, 4).toUpperCase()}
                    </div>

                    <div className="sender-details">
                      <span className="transaction-number">
                        TIP #{(Number(tipCount) - index)
                          .toString()
                          .padStart(2, "0")}
                      </span>

                      <span className="sender-address">
                        {tip.sender.slice(0, 8)}...
                        {tip.sender.slice(-6)}
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
          max-width: 1050px;
          margin: 28px auto 0;
          padding: 30px;
          overflow: hidden;
          background: #29272f;
          border: 1px solid #393640;
          border-radius: 16px;
          color: #fff;
        }

        .tip-section-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 25px;
        }

        .tip-eyebrow,
        .transactions-label {
          margin: 0 0 8px;
          color: #b9a9d9;
          font-family: "DM Mono", monospace;
          font-size: 9px;
          letter-spacing: 2px;
        }

        .tip-section-top h2 {
          margin: 0;
          color: #fff;
          font-size: 23px;
          font-weight: 900;
          letter-spacing: 0.5px;
        }

        .tip-subtitle {
          margin: 9px 0 0;
          color: #aaa6b2;
          font-size: 12px;
          line-height: 1.6;
        }

        .live-pill {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
          padding: 9px 12px;
          border: 1px solid #4b5b4d;
          border-radius: 30px;
          color: #b8d2bc;
          font-family: "DM Mono", monospace;
          font-size: 9px;
          letter-spacing: 1px;
        }

        .live-dot,
        .confirmed-pill span,
        .network-dot {
          width: 7px;
          height: 7px;
          flex-shrink: 0;
          border-radius: 50%;
          background: #83b48d;
          box-shadow: 0 0 9px rgba(131, 180, 141, 0.35);
        }

        .tip-stats {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 13px;
        }

        .tip-stat-card {
          min-width: 0;
          padding: 19px 20px;
          border: 1px solid #45414d;
          border-radius: 11px;
          background: #35323d;
          transition:
            transform 0.2s ease,
            border-color 0.2s ease,
            background 0.2s ease;
        }

        .tip-stat-card:hover {
          transform: translateY(-3px);
          border-color: #7965a8;
          background: #3b3744;
        }

        .stat-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .stat-label {
          color: #b9a9d9;
          font-family: "DM Mono", monospace;
          font-size: 9px;
          letter-spacing: 1.5px;
        }

        .stat-icon {
          display: grid;
          width: 29px;
          height: 29px;
          place-items: center;
          border-radius: 8px;
          background: #494354;
          color: #c9bce1;
          font-size: 17px;
        }

        .eth-icon {
          font-size: 21px;
        }

        .stat-value {
          margin-top: 17px;
          color: #fff;
          font-size: 34px;
          font-weight: 800;
          letter-spacing: -1.5px;
          line-height: 1.2;
          overflow-wrap: anywhere;
        }

        .balance-value {
          font-size: clamp(22px, 3vw, 31px);
          letter-spacing: -1px;
        }

        .stat-currency {
          color: #c4b7dc;
          font-size: 13px;
          letter-spacing: 0;
        }

        .stat-caption {
          display: block;
          margin-top: 7px;
          color: #aaa6b2;
          font-size: 10px;
        }

        .transactions-heading {
          display: flex;
          align-items: end;
          justify-content: space-between;
          gap: 12px;
          margin: 30px 0 14px;
        }

        .transactions-label {
          margin-bottom: 6px;
        }

        .transactions-heading h3 {
          margin: 0;
          color: #fff;
          font-size: 13px;
          font-weight: 800;
          letter-spacing: 0.7px;
        }

        .records-count {
          color: #aaa6b2;
          font-family: "DM Mono", monospace;
          font-size: 9px;
          letter-spacing: 1px;
        }

        .transactions-list {
          display: grid;
          gap: 11px;
        }

        .transaction-card {
          min-width: 0;
          padding: 19px 20px 15px;
          border: 1px solid #48444f;
          border-radius: 11px;
          background: #35323d;
          transition:
            transform 0.2s ease,
            border-color 0.2s ease,
            background 0.2s ease;
        }

        .transaction-card:hover {
          transform: translateY(-2px);
          border-color: #7965a8;
          background: #3c3845;
        }

        .transaction-top,
        .transaction-identity,
        .transaction-footer {
          display: flex;
          align-items: center;
        }

        .transaction-top {
          justify-content: space-between;
          gap: 12px;
        }

        .transaction-identity {
          min-width: 0;
          gap: 12px;
        }

        .sender-avatar {
          display: grid;
          width: 39px;
          height: 39px;
          flex-shrink: 0;
          place-items: center;
          border: 1px solid #6c5b87;
          border-radius: 10px;
          background: #494354;
          color: #d4c6ec;
          font-family: "DM Mono", monospace;
          font-size: 12px;
        }

        .sender-details {
          display: flex;
          min-width: 0;
          flex-direction: column;
          gap: 5px;
        }

        .transaction-number {
          color: #c4b5df;
          font-family: "DM Mono", monospace;
          font-size: 9px;
          letter-spacing: 1px;
        }

        .sender-address {
          overflow: hidden;
          color: #d4d0da;
          font-family: "DM Mono", monospace;
          font-size: 11px;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .confirmed-pill {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-shrink: 0;
          padding: 6px 9px;
          border: 1px solid #4b604f;
          border-radius: 20px;
          color: #b8d2bc;
          font-family: "DM Mono", monospace;
          font-size: 8px;
          letter-spacing: 0.7px;
        }

        .confirmed-pill span {
          width: 5px;
          height: 5px;
        }

        .transaction-amount {
          margin: 21px 0 15px;
          color: #fff;
          font-size: 27px;
          font-weight: 800;
          letter-spacing: -0.7px;
        }

        .transaction-amount span {
          color: #c4b7dc;
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0;
        }

        .transaction-message {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          min-width: 0;
          padding: 13px 14px;
          border-radius: 8px;
          background: #2d2a34;
        }

        .message-mark {
          color: #a994cc;
          font-family: Georgia, serif;
          font-size: 30px;
          line-height: 0.9;
        }

        .transaction-message p {
          min-width: 0;
          margin: 2px 0 0;
          color: #d2ced8;
          font-size: 12px;
          line-height: 1.7;
          overflow-wrap: anywhere;
        }

        .transaction-footer {
          justify-content: space-between;
          gap: 10px;
          margin-top: 15px;
        }

        .transaction-date,
        .transaction-network {
          color: #aaa6b2;
          font-family: "DM Mono", monospace;
          font-size: 9px;
          letter-spacing: 0.5px;
        }

        .date-separator {
          padding: 0 7px;
          color: #7965a8;
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
          min-height: 155px;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 9px;
          padding: 25px 15px;
          border: 1px dashed #514b5d;
          border-radius: 11px;
          color: #d4cedf;
          text-align: center;
        }

        .tip-state strong {
          font-size: 11px;
          letter-spacing: 1px;
        }

        .tip-state p {
          max-width: 100%;
          margin: 0;
          color: #aaa6b2;
          font-size: 11px;
          line-height: 1.6;
          overflow-wrap: anywhere;
        }

        .empty-icon {
          color: #b9a9d9;
          font-size: 35px;
        }

        .state-icon {
          display: grid;
          width: 29px;
          height: 29px;
          place-items: center;
          border-radius: 50%;
          background: #5b3838;
          color: #f1b2b2;
          font-weight: 800;
        }

        .tip-error {
          color: #f1b2b2;
        }

        .tip-spinner {
          width: 23px;
          height: 23px;
          border: 2px solid #514b5d;
          border-top-color: #b9a9d9;
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
            padding: 22px 17px;
            margin-top: 22px;
          }

          .tip-section-top {
            flex-direction: column;
            gap: 14px;
          }

          .tip-stats {
            grid-template-columns: 1fr;
          }

          .stat-value {
            font-size: 30px;
          }

          .transaction-card {
            padding: 16px 14px 13px;
          }

          .transaction-footer {
            align-items: flex-start;
            flex-direction: column;
          }

          .transaction-amount {
            font-size: 24px;
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
