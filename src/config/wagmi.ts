import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from "wagmi";
import { base, baseSepolia, mainnet, sepolia } from "wagmi/chains";

// WalletConnect Project ID from https://cloud.walletconnect.com/
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || "";

export const config = getDefaultConfig({
  appName: "Doefin V2",
  projectId,
  // Include multiple chains so wagmi can properly detect network changes
  chains: [baseSepolia, sepolia, base, mainnet],
  transports: {
    [baseSepolia.id]: http(),
    [sepolia.id]: http(),
    [base.id]: http(),
    [mainnet.id]: http(),
  },
  ssr: false,
});
