
import "dotenv/config";

import {
  createPublicClient,
  createWalletClient,
  formatEther,
  getAddress,
  http,
  parseEther,
} from "viem";

import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";

async function main(): Promise<void> {
  // 1. Read configuration from .env
  const rpcUrl = process.env.RPC_URL?.trim();
  const rawPrivateKey = process.env.PRIVATE_KEY?.trim();
  const recipientInput = process.env.TO_ADDRESS?.trim();
  const expectedAddress = process.env.WALLET_ADDRESS?.trim();

  // 2. Check required environment variables
  if (!rpcUrl || !rawPrivateKey || !recipientInput) {
    throw new Error(
      "Missing configuration. Check RPC_URL, PRIVATE_KEY and TO_ADDRESS in .env."
    );
  }

  // 3. Format and validate the private key
  const privateKey = (
    rawPrivateKey.startsWith("0x")
      ? rawPrivateKey
      : `0x${rawPrivateKey}`
  ) as `0x${string}`;

  if (!/^0x[0-9a-fA-F]{64}$/.test(privateKey)) {
    throw new Error("PRIVATE_KEY is not a valid 32-byte hexadecimal key.");
  }

  // 4. Create an account from the private key
  const account = privateKeyToAccount(privateKey);

  // 5. Validate the recipient address
  const recipient = getAddress(recipientInput);

  // 6. Check that the private key matches your expected wallet
  if (expectedAddress) {
    if (account.address !== getAddress(expectedAddress)) {
      throw new Error(
        "The private key does not match WALLET_ADDRESS in .env."
      );
    }
  }

  // 7. Create the public client
  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(rpcUrl),
  });

  // 8. Verify the network
  const chainId = await publicClient.getChainId();

  console.log("\n========== BLOCKCHAIN LAB ==========");
  console.log("Network:", sepolia.name);
  console.log("Chain ID:", chainId);

  if (chainId !== 11155111) {
    throw new Error("Wrong network! This script requires Ethereum Sepolia.");
  }

  console.log("Sepolia network verified!");

  // 9. Create the wallet client
  const walletClient = createWalletClient({
    account,
    chain: sepolia,
    transport: http(rpcUrl),
  });

  // 10. Read block number and wallet balance
  const blockNumber = await publicClient.getBlockNumber();

  const balance = await publicClient.getBalance({
    address: account.address,
  });

  console.log("\n========== WALLET DETAILS ==========");
  console.log("Latest Block:", blockNumber.toString());
  console.log("Sender Address:", account.address);
  console.log("Balance:", formatEther(balance), "ETH");

  // 11. Prepare transaction
  const amount = parseEther("0.001");

  if (balance <= amount) {
    throw new Error(
      "Insufficient balance for the transfer and network fee."
    );
  }

  console.log("\n========== TRANSACTION ==========");
  console.log("Recipient:", recipient);
  console.log("Amount:", formatEther(amount), "ETH");

  // 12. Ask before broadcasting
  const rl = createInterface({
    input: stdin,
    output: stdout,
  });

  const confirmation = await rl.question(
    "\nType SEND to confirm this transaction: "
  );

  rl.close();

  if (confirmation.trim() !== "SEND") {
    console.log("Transaction cancelled. No ETH was sent.");
    return;
  }

  // 13. Send the transaction
  const hash = await walletClient.sendTransaction({
    account,
    to: recipient,
    value: parseEther("0.001"),
  });

  console.log("\nTransaction submitted!");
  console.log("Transaction Hash:", hash);

  // 14. Wait for the transaction receipt
  console.log("\nWaiting for confirmation...");

  const receipt = await publicClient.waitForTransactionReceipt({
    hash,
  });

  // 15. Calculate transaction fee
  const feeWei = receipt.gasUsed * receipt.effectiveGasPrice;
  const feeEther = formatEther(feeWei);

  // 16. Display receipt details
  console.log("\n========== TRANSACTION RECEIPT ==========");
  console.log("Status:", receipt.status);
  console.log("Block Number:", receipt.blockNumber.toString());
  console.log("Gas Used:", receipt.gasUsed.toString());
  console.log("Transaction Fee:", feeEther, "ETH");

  console.log(
    "Etherscan:",
    `https://sepolia.etherscan.io/tx/${hash}`
  );

  if (receipt.status !== "success") {
    throw new Error("Transaction was not successful.");
  }

  console.log("\nBlockchain Lab transaction completed!");
}

main().catch((error: unknown) => {
  console.error("\nBlockchain Lab Error:");

  console.error(
    error instanceof Error ? error.message : error
  );

  process.exitCode = 1;
});
