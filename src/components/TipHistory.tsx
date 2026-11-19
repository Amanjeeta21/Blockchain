
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

      // Keep the existing tips even if the next request fails.
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
          <span className={isLoading ? "refresh-icon spinning" : "refresh-icon"}>
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
                {isLoadingMore ? (
                  "Loading..."
                ) : (
                  "Load More"
                )}
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
          padding: 24px;
          border: 1px solid #e5e1d9;
          border-radius: 18px;
          background: #ffffff;
        }

        .history-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 20px;
          width: 100%;
          margin-bottom: 22px;
        }

        .history-heading {
          flex: 1;
          min-width: 0;
          text-align: left;
        }

        .eyebrow {
          margin: 0 0 6px;
          color: #77736c;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-align: left;
        }

        h2 {
          margin: 0;
          color: #172b4d;
          font-size: 24px;
          font-weight: 800;
          text-align: left;
        }

        .subtitle {
          margin: 7px 0 0;
          color: #77736c;
          font-size: 13px;
          text-align: left;
        }

        .refresh-button {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          width: 38px;
          height: 38px;
          border: 1px solid #e5e1d9;
          border-radius: 50%;
          background: #ffffff;
          color: #172b4d;
          cursor: pointer;
          transition: background 0.2s, transform 0.2s;
        }

        .refresh-button:hover:not(:disabled) {
          background: #f5f3ef;
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
          padding: 20px;
          border-radius: 12px;
          background: #f5f3ef;
          color: #77736c;
          font-size: 14px;
          text-align: center;
        }

        .error-card {
          color: #b42318;
          background: #fef3f2;
        }

        .retry-button {
          display: block;
          margin: 12px auto 0;
          border: none;
          background: transparent;
          color: #172b4d;
          font-weight: 700;
          cursor: pointer;
          text-decoration: underline;
        }

        .event-list {
          display: flex;
          flex-direction: column;
          gap: 14px;
          width: 100%;
          min-width: 0;
        }

        .event-card {
          width: 100%;
          min-width: 0;
          box-sizing: border-box;
          padding: 18px;
          border: 1px solid #e8e4dc;
          border-radius: 14px;
          background: #faf9f6;
          overflow: hidden;
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
          margin-bottom: 5px;
          color: #8a867f;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.1em;
        }

        .address {
          color: #172b4d;
          font-family: monospace;
          font-size: 14px;
          font-weight: 600;
          text-decoration: none;
        }

        .address:hover {
          text-decoration: underline;
        }

        .amount {
          color: #172b4d;
          font-size: 17px;
          font-weight: 800;
          overflow-wrap: anywhere;
        }

        .message {
          margin-top: 16px;
          min-width: 0;
        }

        .message p {
          margin: 5px 0 0;
          color: #4d4a45;
          font-size: 14px;
          line-height: 1.5;
          overflow-wrap: anywhere;
        }

        .event-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 16px;
          padding-top: 12px;
          border-top: 1px solid #e8e4dc;
          color: #8a867f;
          font-family: monospace;
          font-size: 11px;
        }

        .event-footer a {
          color: #172b4d;
          text-decoration: none;
          font-weight: 600;
        }

        .event-footer a:hover {
          text-decoration: underline;
        }

        .load-more-container {
          display: flex;
          justify-content: center;
          margin-top: 22px;
        }

        .load-more-button {
          min-width: 150px;
          padding: 11px 24px;
          border: 1px solid #172b4d;
          border-radius: 9px;
          background: #172b4d;
          color: #ffffff;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.2s, transform 0.2s;
        }

        .load-more-button:hover:not(:disabled) {
          background: #263e63;
          transform: translateY(-1px);
        }

        .load-more-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .end-message {
          margin: 20px 0 0;
          color: #8a867f;
          font-size: 12px;
          text-align: center;
        }

        .warning-text,
        .error-text {
          margin: 14px 0 0;
          font-size: 12px;
          text-align: center;
        }

        .warning-text {
          color: #956000;
        }

        .error-text {
          color: #b42318;
        }

        @media (max-width: 650px) {
          .history-section {
            padding: 18px;
          }

          .event-card {
            padding: 15px;
          }

          .amount {
            font-size: 16px;
          }
        }
      `}</style>
    </section>
  );
}
