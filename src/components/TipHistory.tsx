
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { formatEther } from "viem";

type TipEvent = {
  id: string;
  sender: string;
  amount: bigint;
  message: string;
  blockNumber: bigint;
  transactionHash: string;
  logIndex: number;
};

type TipHistoryApiEvent = {
  id: string;
  sender: string;
  amount: string;
  message: string;
  blockNumber: string;
  transactionHash: string;
  logIndex: number;
};

type TipHistoryResponse = {
  events?: TipHistoryApiEvent[];
  nextToBlock?: string | null;
  hasMore?: boolean;
  warning?: string;
  error?: string;
};

const PAGE_SIZE = 10;

function shortenAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function convertEvents(events: TipHistoryApiEvent[]): TipEvent[] {
  return events.map((event) => ({
    ...event,
    amount: BigInt(event.amount),
    blockNumber: BigInt(event.blockNumber),
  }));
}

function mergeEvents(
  existing: TipEvent[],
  incoming: TipEvent[],
): TipEvent[] {
  const eventMap = new Map<string, TipEvent>();

  for (const event of existing) {
    eventMap.set(event.id, event);
  }

  for (const event of incoming) {
    eventMap.set(event.id, event);
  }

  return Array.from(eventMap.values()).sort((a, b) => {
    if (a.blockNumber > b.blockNumber) return -1;
    if (a.blockNumber < b.blockNumber) return 1;

    return b.logIndex - a.logIndex;
  });
}

async function fetchTipHistory(
  toBlock?: string | null,
): Promise<TipHistoryResponse> {
  const params = new URLSearchParams({
    limit: String(PAGE_SIZE),
  });

  if (toBlock !== undefined && toBlock !== null) {
    params.set("toBlock", toBlock);
  }

  const response = await fetch(
    `/api/tip-history?${params.toString()}`,
    {
      cache: "no-store",
    },
  );

  const payload: TipHistoryResponse = await response
    .json()
    .catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      payload.error ??
        `Tip history request failed (${response.status}).`,
    );
  }

  return payload;
}

export default function TipHistory() {
  const [events, setEvents] = useState<TipEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextToBlock, setNextToBlock] = useState<string | null>(
    null,
  );
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");

  const isLoadingRef = useRef(false);

  const loadInitialHistory = useCallback(async () => {
    if (isLoadingRef.current) return;

    isLoadingRef.current = true;
    setIsLoading(true);
    setError("");
    setWarning("");

    try {
      const response = await fetchTipHistory();

      const fetchedEvents = convertEvents(
        response.events ?? [],
      );

      setEvents(fetchedEvents);
      setNextToBlock(response.nextToBlock ?? null);
      setHasMore(Boolean(response.hasMore));
      setWarning(response.warning ?? "");
    } catch (err) {
      console.error("Failed to load Tip History:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load Tip History.",
      );
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false);
    }
  }, []);

  const loadMoreHistory = useCallback(async () => {
    if (
      isLoadingRef.current ||
      !hasMore ||
      nextToBlock === null
    ) {
      return;
    }

    isLoadingRef.current = true;
    setIsLoadingMore(true);
    setError("");
    setWarning("");

    try {
      const response = await fetchTipHistory(nextToBlock);

      const fetchedEvents = convertEvents(
        response.events ?? [],
      );

      setEvents((previous) =>
        mergeEvents(previous, fetchedEvents),
      );

      setNextToBlock(response.nextToBlock ?? null);
      setHasMore(Boolean(response.hasMore));
      setWarning(response.warning ?? "");
    } catch (err) {
      console.error("Failed to load more tips:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load more tips.",
      );
    } finally {
      isLoadingRef.current = false;
      setIsLoadingMore(false);
    }
  }, [hasMore, nextToBlock]);

  const refreshHistory = useCallback(() => {
    setEvents([]);
    setNextToBlock(null);
    setHasMore(false);
    void loadInitialHistory();
  }, [loadInitialHistory]);

  useEffect(() => {
    void loadInitialHistory();
  }, [loadInitialHistory]);

  return (
    <section className="history-section">
      <div className="history-header">
        <div className="history-heading">
          <p className="eyebrow">ON-CHAIN ACTIVITY</p>
          <h2>TIP HISTORY</h2>
          <p className="subtitle">
            Tips recorded by the TipJar smart contract.
          </p>
        </div>

        <button
          type="button"
          className="refresh-button"
          onClick={refreshHistory}
          disabled={isLoading || isLoadingMore}
          aria-label="Refresh tip history"
          title="Refresh tip history"
        >
          <span
            className={
              isLoading
                ? "refresh-icon spinning"
                : "refresh-icon"
            }
          >
            ↻
          </span>
        </button>
      </div>

      {isLoading && (
        <div className="state-card">
          Fetching the latest tips...
        </div>
      )}

      {!isLoading && error && events.length === 0 && (
        <div className="state-card error-card">
          {error}
          <button
            type="button"
            className="retry-button"
            onClick={() => void loadInitialHistory()}
          >
            Try again
          </button>
        </div>
      )}

      {!isLoading && events.length === 0 && !error && (
        <div className="state-card">
          {warning || "No tips have been recorded yet."}
        </div>
      )}

      {events.length > 0 && (
        <>
          <div className="event-list">
            {events.map((event) => (
              <article className="event-card" key={event.id}>
                <div className="event-top">
                  <div className="sender-info">
                    <span className="label">SENDER</span>

                    <a
                      href={`https://sepolia.etherscan.io/address/${event.sender}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="address"
                    >
                      {shortenAddress(event.sender)}
                    </a>
                  </div>

                  <div className="amount">
                    {formatEther(event.amount)} ETH
                  </div>
                </div>

                <div className="message">
                  <span className="label">MESSAGE</span>
                  <p>
                    {event.message || "No message provided."}
                  </p>
                </div>

                <div className="event-footer">
                  <span>
                    Block #{event.blockNumber.toString()}
                  </span>

                  <a
                    href={`https://sepolia.etherscan.io/tx/${event.transactionHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View transaction ↗
                  </a>
                </div>
              </article>
            ))}
          </div>

          {warning && (
            <p className="warning-text">{warning}</p>
          )}

          {error && (
            <p className="error-text">{error}</p>
          )}

          {hasMore && (
            <div className="load-more-container">
              <button
                type="button"
                className="load-more-button"
                onClick={() => void loadMoreHistory()}
                disabled={isLoadingMore}
              >
                {isLoadingMore ? "Loading..." : "Load More"}
              </button>
            </div>
          )}

          {!hasMore && !warning && !error && (
            <p className="end-message">
              You've reached the beginning of Tip History.
            </p>
          )}
        </>
      )}

      <style jsx>{`
        .history-section {
          width: 100%;
          min-width: 0;
          box-sizing: border-box;
          margin-top: 24px;
          padding: 28px;
          border: 1px solid var(--border);
          border-radius: 14px;
          background: var(--surface);
          color: var(--foreground);
        }

        .history-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 20px;
          width: 100%;
          margin-bottom: 24px;
        }

        .history-heading {
          flex: 1;
          min-width: 0;
          text-align: left;
        }

        .eyebrow {
          margin: 0 0 8px;
          color: var(--muted);
          font-family: "DM Mono", monospace;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 2px;
        }

        h2 {
          margin: 0;
          color: var(--foreground);
          font-size: 23px;
          font-weight: 800;
          letter-spacing: 0.5px;
        }

        .subtitle {
          margin: 8px 0 0;
          color: var(--muted);
          font-size: 13px;
          line-height: 1.6;
        }

        .refresh-button {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          width: 40px;
          height: 40px;
          border: 1px solid var(--border-strong);
          border-radius: 50%;
          background: var(--surface-raised);
          color: var(--foreground);
          cursor: pointer;
          transition: background 0.2s ease,
            border-color 0.2s ease,
            transform 0.2s ease;
        }

        .refresh-button:hover:not(:disabled) {
          background: var(--surface-soft);
          border-color: var(--accent);
          transform: rotate(30deg);
        }

        .refresh-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .refresh-icon {
          display: inline-block;
          font-size: 23px;
          line-height: 1;
        }

        .spinning {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .state-card {
          padding: 22px;
          border: 1px solid var(--border);
          border-radius: 10px;
          background: var(--surface-raised);
          color: var(--muted);
          font-size: 13px;
          line-height: 1.6;
          text-align: center;
        }

        .error-card {
          color: #d0c5c5;
          border-color: #554747;
          background: #302a2a;
        }

        .retry-button {
          display: block;
          margin: 12px auto 0;
          border: none;
          background: transparent;
          color: var(--foreground);
          font-weight: 700;
          cursor: pointer;
          text-decoration: underline;
          text-underline-offset: 3px;
        }

        .event-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          width: 100%;
          min-width: 0;
        }

        .event-card {
          width: 100%;
          min-width: 0;
          box-sizing: border-box;
          padding: 20px;
          border: 1px solid var(--border);
          border-radius: 11px;
          background: var(--surface-raised);
          overflow: hidden;
          transition: border-color 0.2s ease,
            background 0.2s ease;
        }

        .event-card:hover {
          border-color: var(--border-strong);
          background: var(--surface-soft);
        }

        .event-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 14px;
          min-width: 0;
        }

        .sender-info {
          min-width: 0;
        }

        .label {
          display: block;
          margin-bottom: 7px;
          color: var(--muted-dark);
          font-family: "DM Mono", monospace;
          font-size: 9px;
          font-weight: 500;
          letter-spacing: 1.5px;
        }

        .address {
          color: var(--foreground);
          font-family: "DM Mono", monospace;
          font-size: 13px;
          font-weight: 500;
          text-decoration: none;
          transition: color 0.2s ease;
        }

        .address:hover {
          color: var(--accent-hover);
          text-decoration: underline;
          text-underline-offset: 3px;
        }

        .amount {
          color: var(--foreground);
          font-family: "DM Sans", sans-serif;
          font-size: 17px;
          font-weight: 800;
          overflow-wrap: anywhere;
        }

        .message {
          margin-top: 19px;
          min-width: 0;
        }

        .message p {
          margin: 5px 0 0;
          color: var(--muted);
          font-size: 13px;
          line-height: 1.7;
          overflow-wrap: anywhere;
        }

        .event-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 18px;
          padding-top: 14px;
          border-top: 1px solid var(--border);
          color: var(--muted-dark);
          font-family: "DM Mono", monospace;
          font-size: 10px;
        }

        .event-footer a {
          color: var(--accent);
          text-decoration: none;
          font-weight: 500;
          transition: color 0.2s ease;
        }

        .event-footer a:hover {
          color: var(--accent-hover);
          text-decoration: underline;
          text-underline-offset: 3px;
        }

        .load-more-container {
          display: flex;
          justify-content: center;
          margin-top: 24px;
        }

        .load-more-button {
          min-width: 155px;
          padding: 12px 25px;
          border: 1px solid var(--accent);
          border-radius: 8px;
          background: var(--accent);
          color: var(--background);
          font-family: "DM Mono", monospace;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 1px;
          cursor: pointer;
          transition: background 0.2s ease,
            border-color 0.2s ease,
            transform 0.2s ease;
        }

        .load-more-button:hover:not(:disabled) {
          background: var(--accent-hover);
          border-color: var(--accent-hover);
          transform: translateY(-2px);
        }

        .load-more-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .end-message {
          margin: 22px 0 0;
          color: var(--muted-dark);
          font-family: "DM Mono", monospace;
          font-size: 10px;
          letter-spacing: 0.4px;
          text-align: center;
        }

        .warning-text,
        .error-text {
          margin: 14px 0 0;
          font-size: 11px;
          line-height: 1.6;
          text-align: center;
        }

        .warning-text {
          color: #c1beb5;
        }

        .error-text {
          color: #d0c5c5;
        }

        @media (max-width: 650px) {
          .history-section {
            padding: 20px 16px;
          }

          .history-header {
            gap: 12px;
          }

          h2 {
            font-size: 20px;
          }

          .subtitle {
            font-size: 12px;
          }

          .event-card {
            padding: 16px;
          }

          .amount {
            font-size: 16px;
          }

          .event-footer {
            font-size: 9px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .spinning {
            animation: none;
          }

          .refresh-button,
          .event-card,
          .load-more-button {
            transition: none;
          }
        }
      `}</style>
    </section>
  );
}
