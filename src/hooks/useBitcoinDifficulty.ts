import { useState, useEffect } from "react";

interface BitcoinDifficulty {
  difficulty: number;
  formatted: string;
  loading: boolean;
  error: string | null;
}

function formatDifficulty(difficulty: number): string {
  if (difficulty >= 1e12) return `${(difficulty / 1e12).toFixed(2)}T`;
  if (difficulty >= 1e9) return `${(difficulty / 1e9).toFixed(2)}B`;
  if (difficulty >= 1e6) return `${(difficulty / 1e6).toFixed(2)}M`;
  if (difficulty >= 1e3) return `${(difficulty / 1e3).toFixed(2)}K`;
  return difficulty.toFixed(2);
}

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
      const apis = [
        {
          url: "https://mempool.space/api/v1/difficulty-adjustment",
          parser: (text: string) => JSON.parse(text).currentDifficulty as number,
        },
        {
          url: "https://blockchain.info/q/getdifficulty",
          parser: (text: string) => parseFloat(text),
        },
        {
          url: "https://api.blockchain.info/stats",
          parser: (text: string) => JSON.parse(text).difficulty as number,
        },
      ];

      for (const api of apis) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          const response = await fetch(api.url, {
            signal: controller.signal,
            headers: { Accept: "application/json" },
          });
          clearTimeout(timeoutId);
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const difficulty = api.parser(await response.text());
          if (mounted && difficulty > 0) {
            setState({
              difficulty,
              formatted: formatDifficulty(difficulty),
              loading: false,
              error: null,
            });
            return;
          }
        } catch {
          continue;
        }
      }

      if (mounted) {
        setState({
          difficulty: 0,
          formatted: "",
          loading: false,
          error: "Unable to fetch Bitcoin difficulty.",
        });
      }
    };

    fetchBitcoinDifficulty();
    const interval = setInterval(fetchBitcoinDifficulty, 60_000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return state;
}
