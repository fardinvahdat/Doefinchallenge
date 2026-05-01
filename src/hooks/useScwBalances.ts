import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";
import { useScw } from "./useScw";

// Wire shape from GET /v3/balances/{scw}?refresh=true
interface RawTokenBalance {
  token_address: string;
  token_type: string;
  token_id: string | null;
  total: string;
  locked: string;
  available: string;
  cache_updated_at: string | null;
}

interface BalancesResponse {
  scw_address: string;
  balances: RawTokenBalance[];
}

// Backend sometimes returns scientific notation (e.g. "1.200E+7").
// BigInt() cannot parse it — normalize to plain integer string.
const toIntString = (s: string): string =>
  /[Ee]/.test(s) ? String(Math.round(parseFloat(s))) : s;

export type ScwTokenBalance = {
  tokenAddress: string;
  total: bigint;
  locked: bigint;
  // Always use available (= total − locked). Mirrors doefin-frontend rule.
  available: bigint;
};

const fetchBalances = async (scw: string): Promise<ScwTokenBalance[]> => {
  const data = await apiFetch<BalancesResponse>(
    `/v3/balances/${scw}`,
    { refresh: "true" },
  );
  return data.balances
    .filter((b) => b.token_type === "ERC20")
    .map((b) => ({
      tokenAddress: b.token_address.toLowerCase(),
      total: BigInt(toIntString(b.total)),
      locked: BigInt(toIntString(b.locked)),
      available: BigInt(toIntString(b.available)),
    }));
};

const QUERY_KEY = (scw: string | undefined) => ["scw-balances", scw] as const;

export function useScwBalances() {
  const { data: scwInfo } = useScw();
  const scw = scwInfo?.scw;
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: QUERY_KEY(scw),
    queryFn: () => fetchBalances(scw as string),
    enabled: Boolean(scw),
    staleTime: 30_000,
    select: (balances) => {
      const byAddress = new Map(balances.map((b) => [b.tokenAddress, b]));
      return {
        getAvailable: (tokenAddress: string): bigint =>
          byAddress.get(tokenAddress.toLowerCase())?.available ?? 0n,
        balances,
      };
    },
  });

  const forceRefresh = async () => {
    if (!scw) return;
    const fresh = await fetchBalances(scw);
    queryClient.setQueryData(QUERY_KEY(scw), fresh);
  };

  return { ...query, forceRefresh };
}
