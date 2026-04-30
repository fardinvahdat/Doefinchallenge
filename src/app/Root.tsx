import { Outlet } from "react-router";
import { Navigation } from "./components/Navigation";
import { Footer } from "./components/Footer";
import { Toaster } from "./components/ui/sonner";
import { Web3Provider } from "./contexts/Web3Context";

export default function Root() {
  return (
    <Web3Provider>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:outline-none"
      >
        Skip to main content
      </a>
      <div className="min-h-dvh bg-background relative flex flex-col">
        <div className="bg-yellow-500/10 border-b border-yellow-500/30 text-center py-2 px-4 text-xs text-yellow-300 relative z-50">
          This is a testnet demo — no real money involved.{" "}
          <a
            href="https://www.alchemy.com/faucets/base-sepolia"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-yellow-200"
          >
            Get free test ETH →
          </a>
        </div>
        <Navigation />
        <main id="main-content" className="relative z-10 flex-1">
          <Outlet />
        </main>
        <Footer />
        <Toaster />
      </div>
    </Web3Provider>
  );
}