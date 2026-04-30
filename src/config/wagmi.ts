import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from "wagmi";
import { base, baseSepolia, mainnet, sepolia } from "wagmi/chains";

// WalletConnect Project ID from https://cloud.walletconnect.com/
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || "";
if (!projectId) {
  console.warn("[wagmi] VITE_WALLETCONNECT_PROJECT_ID is not set — WalletConnect will be unavailable");
}

export const config = getDefaultConfig({
  appName: "Doefin V2",
  projectId,
  // Include multiple chains so wagmi can properly detect network changes
  chains: [baseSepolia, sepolia, base, mainnet],
  // #39: use VITE_*_RPC_URL env vars when provided to avoid public RPC rate limits
  transports: {
    [baseSepolia.id]: http(import.meta.env.VITE_BASE_SEPOLIA_RPC_URL || undefined),
    [sepolia.id]: http(import.meta.env.VITE_SEPOLIA_RPC_URL || undefined),
    [base.id]: http(import.meta.env.VITE_BASE_RPC_URL || undefined),
    [mainnet.id]: http(import.meta.env.VITE_MAINNET_RPC_URL || undefined),
  },
  ssr: false,
});
