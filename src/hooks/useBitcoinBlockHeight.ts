import { useState, useEffect } from "react";

interface BitcoinBlockHeight {
  height: number;
  loading: boolean;
  error: string | null;
}

export function useBitcoinBlockHeight(): BitcoinBlockHeight {
  const [state, setState] = useState<BitcoinBlockHeight>({
    height: 0,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let mounted = true;

    const fetchBitcoinBlockHeight = async () => {
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
          const height = api.parser(await response.text());
          if (mounted && height > 0) {
            setState({ height, loading: false, error: null });
            return;
          }
        } catch {
          continue;
        }
      }

      if (mounted) {
        setState({
          height: 0,
          loading: false,
          error: "Unable to fetch Bitcoin block height.",
        });
      }
    };

    fetchBitcoinBlockHeight();
    const interval = setInterval(fetchBitcoinBlockHeight, 60_000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return state;
}
