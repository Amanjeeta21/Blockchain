import { NextResponse } from "next/server";
import {
  decodeEventLog,
  keccak256,
  stringToHex,
  type Hex,
} from "viem";

import {
  TIPJAR_ABI,
  TIPJAR_ADDRESS,
} from "@/lib/contracts";

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

// Etherscan currently returns at most 1,000 logs per request.
// We use a smaller block window so we can reliably get the newest
// events without depending on a huge result set.
const INITIAL_BLOCK_WINDOW = 10_000n;

const ETHERSCAN_API_URL = "https://api.etherscan.io/v2/api";
const SEPOLIA_CHAIN_ID = "11155111";

const TIP_SENT_TOPIC = keccak256(
  stringToHex("TipSent(address,uint256,string)")
);

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type EtherscanLog = {
  address: string;
  topics: string[];
  data: string;
  blockNumber: string;
  blockHash: string;
  timeStamp: string;
  gasPrice: string;
  gasUsed: string;
  logIndex: string;
  transactionHash: string;
  transactionIndex: string;
};

type EtherscanResponse = {
  status: string;
  message: string;
  result: EtherscanLog[] | string;
};

type TipHistoryEvent = {
  id: string;
  sender: string;
  amount: string;
  message: string;
  blockNumber: string;
  transactionHash: string;
  logIndex: number;
};

function isEtherscanLogResult(
  result: EtherscanLog[] | string
): result is EtherscanLog[] {
  return Array.isArray(result);
}

function getEtherscanErrorMessage(
  response: EtherscanResponse
): string {
  if (typeof response.result === "string") {
    return response.result;
  }

  return response.message || "Unknown Etherscan API error.";
}

async function fetchEtherscanLogs(
  fromBlock: bigint,
  toBlock: bigint
): Promise<EtherscanLog[]> {
  const apiKey = process.env.ETHERSCAN_API_KEY;

  if (!apiKey) {
    throw new Error(
      "Etherscan API key is not configured. Set ETHERSCAN_API_KEY."
    );
  }

  const searchParams = new URLSearchParams({
    chainid: SEPOLIA_CHAIN_ID,
    module: "logs",
    action: "getLogs",
    address: TIPJAR_ADDRESS,
    fromBlock: fromBlock.toString(),
    toBlock: toBlock.toString(),
    topic0: TIP_SENT_TOPIC,
    page: "1",
    offset: "1000",
    apikey: apiKey,
  });

  const response = await fetch(
    `${ETHERSCAN_API_URL}?${searchParams.toString()}`,
    {
      method: "GET",
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(
      `Etherscan request failed with HTTP ${response.status}.`
    );
  }

  const data =
    (await response.json()) as EtherscanResponse;

  if (
    data.status !== "1" &&
    !(
      typeof data.result === "string" &&
      /no records found/i.test(data.result)
    )
  ) {
    throw new Error(getEtherscanErrorMessage(data));
  }

  if (!isEtherscanLogResult(data.result)) {
    return [];
  }

  return data.result;
}

async function fetchLatestBlock(): Promise<bigint> {
  const apiKey = process.env.ETHERSCAN_API_KEY;

  if (!apiKey) {
    throw new Error(
      "Etherscan API key is not configured. Set ETHERSCAN_API_KEY."
    );
  }

  const searchParams = new URLSearchParams({
    chainid: SEPOLIA_CHAIN_ID,
    module: "proxy",
    action: "eth_blockNumber",
    apikey: apiKey,
  });

  const response = await fetch(
    `${ETHERSCAN_API_URL}?${searchParams.toString()}`,
    {
      method: "GET",
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(
      `Etherscan latest-block request failed with HTTP ${response.status}.`
    );
  }

  const data = (await response.json()) as {
    result?: string;
    message?: string;
  };

  if (
    !data.result ||
    !/^0x[0-9a-fA-F]+$/.test(data.result)
  ) {
    throw new Error(
      data.message || "Unable to retrieve the latest Sepolia block."
    );
  }

  return BigInt(data.result);
}

function decodeTipLog(
  log: EtherscanLog
): TipHistoryEvent | null {
  try {
    const decoded = decodeEventLog({
      abi: TIPJAR_ABI,
      eventName: "TipSent",
      topics: log.topics as Hex[],
      data: log.data as Hex,
    });

    const { from, amount, message } = decoded.args;

    if (
      !from ||
      amount === undefined ||
      message === undefined ||
      !log.transactionHash ||
      !log.blockNumber ||
      !log.logIndex
    ) {
      return null;
    }

    const blockNumber = BigInt(log.blockNumber);
    const logIndex = Number(BigInt(log.logIndex));

    return {
      id: `${log.transactionHash}-${logIndex}`,
      sender: from,
      amount: amount.toString(),
      message,
      blockNumber: blockNumber.toString(),
      transactionHash: log.transactionHash,
      logIndex,
    };
  } catch (error) {
    console.error("Failed to decode TipSent log:", {
      transactionHash: log.transactionHash,
      error:
        error instanceof Error
          ? error.message
          : "Unknown decode error.",
    });

    return null;
  }
}

function sortNewestFirst(
  events: TipHistoryEvent[]
): TipHistoryEvent[] {
  return events.sort((a, b) => {
    const blockA = BigInt(a.blockNumber);
    const blockB = BigInt(b.blockNumber);

    if (blockA > blockB) return -1;
    if (blockA < blockB) return 1;

    return b.logIndex - a.logIndex;
  });
}

export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams;

  try {
    const limitValue = searchParams.get("limit");
    const toBlockValue = searchParams.get("toBlock");

    const limit = limitValue
      ? Number(limitValue)
      : DEFAULT_LIMIT;

    if (
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > MAX_LIMIT
    ) {
      return NextResponse.json(
        {
          error: `Limit must be between 1 and ${MAX_LIMIT}.`,
        },
        { status: 400 }
      );
    }

    if (
      toBlockValue !== null &&
      !/^\d+$/.test(toBlockValue)
    ) {
      return NextResponse.json(
        {
          error: "Invalid toBlock value.",
        },
        { status: 400 }
      );
    }

    const deploymentBlockValue =
      process.env.NEXT_PUBLIC_TIPJAR_DEPLOYMENT_BLOCK;

    if (
      !deploymentBlockValue ||
      !/^\d+$/.test(deploymentBlockValue)
    ) {
      return NextResponse.json(
        {
          error:
            "A valid TipJar deployment block is not configured.",
        },
        { status: 500 }
      );
    }

    const deploymentBlock =
      BigInt(deploymentBlockValue);

    const latestBlock =
      await fetchLatestBlock();

    let currentTo = toBlockValue
      ? BigInt(toBlockValue)
      : latestBlock;

    if (currentTo > latestBlock) {
      currentTo = latestBlock;
    }

    if (currentTo < deploymentBlock) {
      return NextResponse.json({
        events: [],
        latestBlock: latestBlock.toString(),
        nextToBlock: null,
        hasMore: false,
        warning: undefined,
      });
    }

    const events: TipHistoryEvent[] = [];

    let nextToBlock: bigint | null = currentTo;
    let blockWindow = INITIAL_BLOCK_WINDOW;
    let warning: string | undefined;

    /*
     * Search backwards through Etherscan-indexed logs.
     *
     * Unlike the old RPC implementation, this does NOT make
     * thousands of eth_getLogs calls. Etherscan already indexes
     * the event logs, and we query the TipJar address + TipSent
     * event topic directly.
     */
    while (
      events.length < limit &&
      nextToBlock !== null &&
      nextToBlock >= deploymentBlock
    ) {
      const toBlock = nextToBlock;

      let fromBlock =
        toBlock - blockWindow + 1n;

      if (fromBlock < deploymentBlock) {
        fromBlock = deploymentBlock;
      }

      let logs: EtherscanLog[] = [];

      try {
        logs = await fetchEtherscanLogs(
          fromBlock,
          toBlock
        );
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Unknown Etherscan API error.";

        console.error("Etherscan Tip History batch failed:", {
          fromBlock: fromBlock.toString(),
          toBlock: toBlock.toString(),
          message: errorMessage,
        });

        const isRateLimited =
          /429|rate.?limit|too many requests|throttl/i.test(
            errorMessage
          );

        return NextResponse.json(
          {
            error: isRateLimited
              ? "Etherscan API is temporarily rate-limited. Please try again."
              : `Unable to fetch Tip History from Etherscan: ${errorMessage}`,
          },
          {
            status: isRateLimited ? 429 : 502,
            ...(isRateLimited
              ? {
                  headers: {
                    "Retry-After": "3",
                  },
                }
              : {}),
          }
        );
      }

      /*
       * Etherscan returns at most 1,000 logs per request.
       *
       * If we hit that limit, the block window may contain
       * too many events. Reduce the window and retry the same
       * range until the returned result is safely below the
       * limit.
       */
      if (logs.length >= 1000 && blockWindow > 1n) {
        blockWindow =
          blockWindow / 2n < 1n
            ? 1n
            : blockWindow / 2n;

        continue;
      }

      for (const log of logs) {
        const decodedEvent =
          decodeTipLog(log);

        if (decodedEvent) {
          events.push(decodedEvent);
        }
      }

      /*
       * We have enough events for this page.
       *
       * The cursor points to the block immediately before
       * this range so Load More can continue with older tips.
       */
      if (events.length >= limit) {
        nextToBlock = fromBlock - 1n;
        break;
      }

      /*
       * No more events in this range.
       * Continue searching older blocks.
       */
      nextToBlock = fromBlock - 1n;

      /*
       * Once a range is known to contain fewer than 1,000
       * logs, we can keep using the same window size.
       */
    }

    sortNewestFirst(events);

    const pageEvents = events.slice(0, limit);

    /*
     * If we found more than the requested limit, the cursor
     * should point to the oldest event that was actually
     * returned, not merely the end of the scanned range.
     *
     * This lets Load More continue without skipping events.
     */
    let nextBlockCursor: string | null = null;

    if (pageEvents.length > 0) {
      const oldestReturnedBlock =
        BigInt(
          pageEvents[pageEvents.length - 1].blockNumber
        );

      const hasOlderEvents =
        oldestReturnedBlock > deploymentBlock;

      nextBlockCursor = hasOlderEvents
        ? (oldestReturnedBlock - 1n).toString()
        : null;
    } else if (
      nextToBlock !== null &&
      nextToBlock >= deploymentBlock
    ) {
      nextBlockCursor = nextToBlock.toString();
    }

    const hasMore =
      nextBlockCursor !== null;

    if (
      pageEvents.length === 0 &&
      currentTo >= deploymentBlock
    ) {
      warning =
        "No TipSent events were found in the requested history range.";
    }

    return NextResponse.json(
      {
        events: pageEvents,
        latestBlock: latestBlock.toString(),
        nextToBlock: nextBlockCursor,
        hasMore,
        warning,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Unknown error.";

    console.error("Tip History Etherscan request failed:", {
      message: errorMessage,
    });

    const isRateLimited =
      /429|rate.?limit|too many requests|throttl/i.test(
        errorMessage
      );

    return NextResponse.json(
      {
        error: isRateLimited
          ? "Etherscan API is temporarily rate-limited. Please try again."
          : `Unable to fetch Tip History: ${errorMessage}`,
      },
      {
        status: isRateLimited ? 429 : 502,
        ...(isRateLimited
          ? {
              headers: {
                "Retry-After": "3",
              },
            }
          : {}),
      }
    );
  }
}