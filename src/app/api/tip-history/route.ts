
import { NextResponse } from "next/server";
import {
  createPublicClient,
  fallback,
  http,
  type Transport,
} from "viem";
import { sepolia } from "viem/chains";

import {
  TIPJAR_ABI,
  TIPJAR_ADDRESS,
} from "@/lib/contracts";

const MAX_BLOCK_RANGE = 10_000n;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;
const PUBLIC_SEPOLIA_RPC_URL =
  "https://ethereum-sepolia-rpc.publicnode.com";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const rpcUrl = process.env.SEPOLIA_RPC_URL;

  if (!rpcUrl) {
    return NextResponse.json(
      { error: "Server RPC is not configured. Set SEPOLIA_RPC_URL." },
      { status: 500 },
    );
  }

  const transportOptions = {
    retryCount: 0,
    timeout: 20_000,
  };
  let transport: Transport = http(
    PUBLIC_SEPOLIA_RPC_URL,
    transportOptions,
  );

  if (!rpcUrl.includes("ethereum-sepolia-rpc.publicnode.com")) {
    transport = fallback(
      [
        transport,
        http(rpcUrl, transportOptions),
      ],
      { retryCount: 0 },
    );
  }

  const client = createPublicClient({
    chain: sepolia,
    transport,
  });

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
        { error: `Limit must be between 1 and ${MAX_LIMIT}.` },
        { status: 400 },
      );
    }

    if (
      toBlockValue !== null &&
      !/^\d+$/.test(toBlockValue)
    ) {
      return NextResponse.json(
        { error: "Invalid toBlock value." },
        { status: 400 },
      );
    }

    const deploymentBlockValue =
      process.env.NEXT_PUBLIC_TIPJAR_DEPLOYMENT_BLOCK;

    if (
      !deploymentBlockValue ||
      !/^\d+$/.test(deploymentBlockValue)
    ) {
      return NextResponse.json(
        { error: "A valid TipJar deployment block is not configured." },
        { status: 500 },
      );
    }

    const deploymentBlock = BigInt(deploymentBlockValue);
    const latestBlock = await client.getBlockNumber();

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
      });
    }

    const events: {
      id: string;
      sender: string;
      amount: string;
      message: string;
      blockNumber: string;
      transactionHash: string;
      logIndex: number;
    }[] = [];

    let nextToBlock: bigint | null = currentTo;
    let warning: string | undefined;

    // Search backwards, starting with the newest blocks.
    while (
      events.length < limit &&
      nextToBlock !== null &&
      nextToBlock >= deploymentBlock
    ) {
      const toBlock: bigint = nextToBlock;

      const fromBlock: bigint =
        toBlock - MAX_BLOCK_RANGE + 1n < deploymentBlock
          ? deploymentBlock
          : toBlock - MAX_BLOCK_RANGE + 1n;

      try {
        const logs = await client.getContractEvents({
          address: TIPJAR_ADDRESS,
          abi: TIPJAR_ABI,
          eventName: "TipSent",
          fromBlock,
          toBlock,
        });

        for (const log of logs) {
          const { from, amount, message } = log.args;

          if (
            !from ||
            amount === undefined ||
            message === undefined ||
            log.blockNumber === null ||
            log.blockNumber === undefined ||
            !log.transactionHash ||
            log.logIndex === null ||
            log.logIndex === undefined
          ) {
            continue;
          }

          events.push({
            id: `${log.transactionHash}-${log.logIndex}`,
            sender: from,
            amount: amount.toString(),
            message,
            blockNumber: log.blockNumber.toString(),
            transactionHash: log.transactionHash,
            logIndex: log.logIndex,
          });
        }

        // Continue with the next older block range.
        nextToBlock = fromBlock - 1n;
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Unknown RPC error.";
        const safeMessage = errorMessage
          .split(rpcUrl)
          .join("[configured Sepolia RPC]");

        console.error("Tip history batch failed:", {
          errorName:
            error instanceof Error ? error.name : "UnknownError",
          message: safeMessage,
        });

        const historyIsUnavailable =
          /pruned history unavailable|historical logs unavailable|block range.*(?:too large|limit|exceed)/i.test(
            errorMessage,
          );

        nextToBlock = null;
        warning = historyIsUnavailable
          ? "The RPC providers cannot serve the full event history; only available tips are shown."
          : "Some older tips are unavailable from the current RPC providers.";

        break;
      }
    }

    // Newest events first.
    events.sort((a, b) => {
      const blockA = BigInt(a.blockNumber);
      const blockB = BigInt(b.blockNumber);

      if (blockA > blockB) return -1;
      if (blockA < blockB) return 1;

      return b.logIndex - a.logIndex;
    });

    const nextBlockCursor =
      nextToBlock !== null && nextToBlock >= deploymentBlock
        ? nextToBlock.toString()
        : null;
    const hasMore = nextBlockCursor !== null;

    return NextResponse.json(
      {
        events,
        latestBlock: latestBlock.toString(),
        nextToBlock: nextBlockCursor,
        hasMore,
        warning,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    const errorName =
      error instanceof Error ? error.name : "UnknownError";

    const errorMessage =
      error instanceof Error
        ? error.message
        : "Unknown RPC error.";

    const safeMessage = errorMessage
      .split(rpcUrl)
      .join("[configured Sepolia RPC]");

    console.error("Tip history RPC request failed:", {
      errorName,
      message: safeMessage,
    });

    const isRateLimited =
      /429|too many requests|rate.?limit|throttl/i.test(
        errorMessage,
      );

    return NextResponse.json(
      {
        error: isRateLimited
          ? "The Sepolia RPC is temporarily rate-limited. Please try again."
          : `Unable to fetch Tip History: ${safeMessage}`,
      },
      {
        status: isRateLimited ? 429 : 502,
        ...(isRateLimited
          ? { headers: { "Retry-After": "3" } }
          : {}),
      },
    );
  }
}
