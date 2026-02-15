import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from "wagmi";
import { baseSepolia } from "wagmi/chains";

// WalletConnect Project ID from https://cloud.walletconnect.com/
const projectId = "efb47ff3cfb810a78ddeca11318457f9";

export const config = getDefaultConfig({
  appName: "Doefin V2",
  projectId,
  chains: [baseSepolia],
  transports: {
    [baseSepolia.id]: http(),
  },
  ssr: false,
});
