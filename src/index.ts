import "dotenv/config";
import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";

async function main() {
  const rpcUrl = process.env.RPC_URL ?? "https://ethereum-rpc.publicnode.com";

  const client = createPublicClient({
    chain: mainnet,
    transport: http(rpcUrl),
  });

  const blockNumber = await client.getBlockNumber();
  console.log(`Latest block: ${blockNumber.toString()}`);
}

main().catch((error) => {
  console.error("Application failed:", error);
  process.exit(1);
});
