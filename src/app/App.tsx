import { Component, ReactNode, useState } from "react";
import { RouterProvider } from "react-router";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider, midnightTheme } from "@rainbow-me/rainbowkit";
import { router } from "./routes";
import { config } from "../config/wagmi";
import "@rainbow-me/rainbowkit/styles.css";

class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center max-w-md p-8 bg-elevated border border-border rounded-xl">
            <h2 className="text-xl font-bold text-text-primary mb-2">
              Something went wrong
            </h2>
            <p className="text-text-secondary text-sm mb-6">
              An unexpected error occurred. Please reload the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  // #13: QueryClient created inside the component (not at module level) to avoid
  // stale-cache issues on HMR and to allow proper isolation in tests.
  const [queryClient] = useState(() => new QueryClient());

  return (
    <ErrorBoundary>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider
            theme={midnightTheme({
              accentColor: "#6366F1",
              accentColorForeground: "white",
              borderRadius: "medium",
              fontStack: "system",
              overlayBlur: "small",
            })}
            modalSize="compact"
          >
            <RouterProvider router={router} />
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </ErrorBoundary>
  );
}
