import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http, type Config } from "wagmi";
import { sepolia } from "wagmi/chains";

const projectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID;
const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL;

if (!projectId) {
  throw new Error("NEXT_PUBLIC_WC_PROJECT_ID is not configured");
}

if (!rpcUrl) {
  throw new Error("NEXT_PUBLIC_RPC_URL is not configured");
}

export const config: Config = getDefaultConfig({
  appName: "TipJar DApp",
  projectId,
  chains: [sepolia],
  transports: {
    [sepolia.id]: http(rpcUrl),
  },
  ssr: true,
});