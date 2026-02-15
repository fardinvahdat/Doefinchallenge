import { useState, useEffect } from "react";

interface BitcoinDifficulty {
  difficulty: number;
  formatted: string;
  loading: boolean;
  error: string | null;
}

/**
 * Format difficulty in a human-readable way
 * Difficulty is typically shown as large numbers like "100 trillion" or scientific notation
 */
function formatDifficulty(difficulty: number): string {
  if (difficulty >= 1e12) {
    return `${(difficulty / 1e12).toFixed(2)}T`;
  } else if (difficulty >= 1e9) {
    return `${(difficulty / 1e9).toFixed(2)}B`;
  } else if (difficulty >= 1e6) {
    return `${(difficulty / 1e6).toFixed(2)}M`;
  } else if (difficulty >= 1e3) {
    return `${(difficulty / 1e3).toFixed(2)}K`;
  }
  return difficulty.toFixed(2);
}

/**
 * Hook to fetch the current Bitcoin mining difficulty from a public API
 * Uses multiple fallbacks for reliability
 */
export function useBitcoinDifficulty(): BitcoinDifficulty {
  const [state, setState] = useState<BitcoinDifficulty>({
    difficulty: 0,
    formatted: "",
    loading: true,
    error: null,
  });

  useEffect(() => {
    let mounted = true;

    const fetchBitcoinDifficulty = async () => {
      // Try multiple Bitcoin API endpoints
      const apis = [
        {
          url: "https://blockstream.info/api/blocks/tip/difficulty",
          parser: (text: string) => parseFloat(text),
        },
        {
          url: "https://mempool.space/api/blocks/tip/difficulty",
          parser: (text: string) => parseFloat(text),
        },
        {
          url: "https://blockchain.info/q/getdifficulty",
          parser: (text: string) => parseFloat(text),
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
          const difficulty = api.parser(text);

          if (mounted && difficulty > 0) {
            console.log("🔍 DEBUG: Fetched Bitcoin difficulty:", difficulty);
            setState({
              difficulty,
              formatted: formatDifficulty(difficulty),
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
          "❌ DEBUG: All Bitcoin difficulty APIs failed:",
          lastError,
        );
        setState({
          difficulty: 0,
          formatted: "",
          loading: false,
          error:
            "Unable to fetch Bitcoin difficulty. Please check your internet connection.",
        });
      }
    };

    fetchBitcoinDifficulty();

    // Refresh every 60 seconds
    const interval = setInterval(fetchBitcoinDifficulty, 60000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return state;
}
