
import "dotenv/config";

import {
  createPublicClient,
  formatEther,
  getAddress,
  http,
  parseEther,
} from "viem";

import { sepolia } from "viem/chains";

async function main(): Promise<void> {
  // Read configuration from environment variables.
  const rpcUrl = process.env.SEPOLIA_RPC_URL;
  const walletAddressInput = process.env.WALLET_ADDRESS;

  if (!rpcUrl) {
    throw new Error("SEPOLIA_RPC_URL is missing.");
  }

  if (!walletAddressInput) {
    throw new Error("WALLET_ADDRESS is missing.");
  }

  // Validate and normalize the Ethereum address.
  const walletAddress = getAddress(walletAddressInput);

  // Create a public client connected to Ethereum Sepolia.
  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(rpcUrl),
  });

  console.log("\n========== BLOCKCHAIN LAB ==========");
  console.log("Network:", sepolia.name);

  // 1. Fetch the latest block number.
  const blockNumber = await publicClient.getBlockNumber();

  console.log("\nLatest Block Number:", blockNumber.toString());

  // 2. Fetch the wallet balance.
  const balanceWei = await publicClient.getBalance({
    address: walletAddress,
  });

  console.log("\nWallet Address:", walletAddress);
  console.log("Balance in Wei:", balanceWei.toString());

  // 3. Convert Wei into ETH.
  const balanceEther = formatEther(balanceWei);

  console.log("Balance in ETH:", balanceEther);

  // 4. Convert an ETH amount into Wei.
  const exampleAmount = parseEther("0.001");

  console.log("\n========== ETH CONVERSION ==========");
  console.log("Amount in ETH: 0.001");
  console.log("Amount in Wei:", exampleAmount.toString());

  // Convert back to ETH to demonstrate the reverse conversion.
  console.log("Converted back to ETH:", formatEther(exampleAmount));

  console.log("\nBlockchain Lab read operations completed!");
}

main().catch((error: unknown) => {
  console.error("\nBlockchain Lab error:");

  if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error(error);
  }

  process.exitCode = 1;
});
