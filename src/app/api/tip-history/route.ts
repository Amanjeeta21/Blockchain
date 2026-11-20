import { NextResponse } from "next/server";
import {
  createPublicClient,
  http,
  type Log,
} from "viem";
import { sepolia } from "viem/chains";

import {
  TIPJAR_ABI,
  TIPJAR_ADDRESS,
} from "@/lib/contracts";

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

// Start with a reasonably large block range.
// If the RPC rejects it, we reduce the range and retry.
const INITIAL_BLOCK_WINDOW = 10_000n;
const MIN_BLOCK_WINDOW = 100n;

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type TipHistoryEvent = {
  id: string;
  sender: string;
  amount: string;
  message: string;
  blockNumber: string;
  transactionHash: string;
  logIndex: number;
};

const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(),
});

function decodeTipLog(
  log: Log<
    bigint,
    number,
    false,
    undefined,
    undefined,
    typeof TIPJAR_ABI,
    "TipSent"
  >
): TipHistoryEvent | null {
  try {
    const args = log.args;

    if (
      !args ||
      args.from === undefined ||
      args.amount === undefined ||
      args.message === undefined ||
      log.blockNumber === null ||
      log.transactionHash === null ||
      log.logIndex === undefined
    ) {
      return null;
    }

    return {
      id: `${log.transactionHash}-${log.logIndex}`,
      sender: args.from,
      amount: args.amount.toString(),
      message: args.message,
      blockNumber: log.blockNumber.toString(),
      transactionHash: log.transactionHash,
      logIndex: log.logIndex,
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

async function fetchTipSentLogs(
  fromBlock: bigint,
  toBlock: bigint
) {
  return publicClient.getContractEvents({
    address: TIPJAR_ADDRESS,
    abi: TIPJAR_ABI,
    eventName: "TipSent",
    fromBlock,
    toBlock,
  });
}

/**
 * Fetch a block range.
 *
 * If the RPC rejects the requested range because it is too large,
 * reduce the window and retry the same range.
 */
async function fetchWithChunking(
  fromBlock: bigint,
  toBlock: bigint
) {
  let currentFromBlock = fromBlock;
  const currentToBlock = toBlock;

  while (true) {
    try {
      return await fetchTipSentLogs(
        currentFromBlock,
        currentToBlock
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Unknown RPC error.";

      console.error("TipSent RPC query failed:", {
        fromBlock: currentFromBlock.toString(),
        toBlock: currentToBlock.toString(),
        message: errorMessage,
      });

      const currentWindow =
        currentToBlock - currentFromBlock + 1n;

      if (currentWindow <= MIN_BLOCK_WINDOW) {
        throw error;
      }

      const smallerWindow =
        currentWindow / 2n;

      currentFromBlock =
        currentToBlock - smallerWindow + 1n;

      console.warn(
        `RPC rejected the block range. Retrying with ${smallerWindow} blocks.`
      );
    }
  }
}

export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams;

  try {
    const limitValue = searchParams.get("limit");
    const toBlockValue = searchParams.get("toBlock");

    const limit =
      limitValue === null
        ? DEFAULT_LIMIT
        : Number(limitValue);

    if (
      (limitValue !== null &&
        !/^\d+$/.test(limitValue)) ||
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
      await publicClient.getBlockNumber();

    let currentTo =
      toBlockValue !== null
        ? BigInt(toBlockValue)
        : latestBlock;

    if (currentTo > latestBlock) {
      currentTo = latestBlock;
    }

    /*
     * Never query before the TipJar deployment block.
     */
    if (currentTo < deploymentBlock) {
      return NextResponse.json({
        events: [],
        latestBlock: latestBlock.toString(),
        nextToBlock: null,
        hasMore: false,
      });
    }

    const events: TipHistoryEvent[] = [];

    let nextToBlock: bigint | null =
      currentTo;

    const blockWindow =
      INITIAL_BLOCK_WINDOW;

    /*
     * Search backwards from the newest block.
     *
     * Example:
     *
     * latest block
     *      ↓
     * [currentTo - 9999 ... currentTo]
     *      ↓
     * [older range]
     *      ↓
     * [older range]
     *
     * The search NEVER goes before the
     * TipJar deployment block.
     */
    while (
      events.length < limit &&
      nextToBlock !== null &&
      nextToBlock >= deploymentBlock
    ) {
      const toBlock: bigint = nextToBlock;

      let fromBlock: bigint =
        toBlock - blockWindow + 1n;

      if (fromBlock < deploymentBlock) {
        fromBlock = deploymentBlock;
      }

      let logs: Awaited<ReturnType<typeof fetchTipSentLogs>>;

      try {
        logs = await fetchWithChunking(
          fromBlock,
          toBlock
        );
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Unknown RPC error.";

        console.error(
          "Unable to fetch TipSent events:",
          errorMessage
        );

        return NextResponse.json(
          {
            error:
              "Unable to fetch Tip History from the Sepolia RPC.",
          },
          { status: 502 }
        );
      }

      /*
       * Convert blockchain logs into the format
       * expected by TipHistory.tsx.
       */
      for (const log of logs) {
        const decodedEvent =
          decodeTipLog(log);

        if (decodedEvent) {
          events.push(decodedEvent);
        }
      }

      /*
       * Move backwards to the block immediately
       * before the range we just searched.
       */
      nextToBlock =
        fromBlock - 1n;

      /*
       * If we collected enough events,
       * stop searching.
       */
      if (events.length >= limit) {
        break;
      }

      /*
       * If this was the first range and the RPC
       * accepted it, keep the 10,000-block window.
       *
       * Chunk reduction only happens inside
       * fetchWithChunking when the RPC rejects
       * a range.
       */
    }

    sortNewestFirst(events);

    const pageEvents =
      events.slice(0, limit);

    /*
     * The cursor should point to the block
     * immediately before the oldest event
     * returned to the client.
     *
     * This prevents duplicate events when
     * "Load More" is clicked.
     */
    const oldestReturnedEvent =
      pageEvents[pageEvents.length - 1];

    let nextBlockCursor: string | null =
      null;

    if (oldestReturnedEvent) {
      const oldestBlock =
        BigInt(
          oldestReturnedEvent.blockNumber
        );

      if (oldestBlock > deploymentBlock) {
        nextBlockCursor =
          (oldestBlock - 1n).toString();
      }
    }

    /*
     * If we reached the deployment block,
     * there cannot be older TipSent events.
     */
    const hasMore =
      nextBlockCursor !== null;

    return NextResponse.json(
      {
        events: pageEvents,
        latestBlock:
          latestBlock.toString(),
        nextToBlock:
          nextBlockCursor,
        hasMore,
      },
      {
        headers: {
          "Cache-Control":
            "no-store",
        },
      }
    );
  } catch (error) {
    console.error(
      "Tip History request failed:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to fetch Tip History.",
      },
      { status: 500 }
    );
  }
}