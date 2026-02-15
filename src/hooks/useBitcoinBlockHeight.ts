import { useState, useEffect } from "react";

interface BitcoinBlockHeight {
  height: number;
  loading: boolean;
  error: string | null;
}

/**
 * Hook to fetch the current Bitcoin block height from a public API
 * Uses multiple fallbacks for reliability
 */
export function useBitcoinBlockHeight(): BitcoinBlockHeight {
  const [state, setState] = useState<BitcoinBlockHeight>({
    height: 0,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let mounted = true;

    const fetchBitcoinBlockHeight = async () => {
      // Try multiple Bitcoin API endpoints
      const apis = [
        {
          url: "https://blockstream.info/api/blocks/tip/height",
          parser: (text: string) => parseInt(text, 10),
        },
        {
          url: "https://mempool.space/api/blocks/tip/height",
          parser: (text: string) => parseInt(text, 10),
        },
        {
          url: "https://blockchain.info/q/getblockcount",
          parser: (text: string) => parseInt(text, 10),
        },
      ];

      let lastError: Error | null = null;

      for (const api of apis) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

          const response = await fetch(api.url, {
            signal: controller.signal,
            headers: {
              Accept: "application/json",
            },
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }

          const text = await response.text();
          const height = api.parser(text);

          if (mounted && height > 0) {
            console.log("🔍 DEBUG: Fetched Bitcoin block height:", height);
            setState({
              height,
              loading: false,
              error: null,
            });
            return;
          }
        } catch (error) {
          lastError = error as Error;
          console.warn(`Failed to fetch from ${api.url}:`, error);
          continue; // Try next API
        }
      }

      // All APIs failed
      if (mounted) {
        console.error(
          "❌ DEBUG: All Bitcoin block height APIs failed:",
          lastError,
        );
        setState({
          height: 0,
          loading: false,
          error:
            "Unable to fetch Bitcoin block height. Please check your internet connection.",
        });
      }
    };

    fetchBitcoinBlockHeight();

    // Refresh every 60 seconds
    const interval = setInterval(fetchBitcoinBlockHeight, 60000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return state;
}
