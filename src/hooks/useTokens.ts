import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";
import { Address } from "viem";

export interface ApiToken {
  address: Address;
  symbol: string;
  name: string;
  decimals: number;
  unit: string;
}

interface TokensResponse {
  tokens: ApiToken[];
}

export function useTokens() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["tokens"],
    queryFn: () => apiFetch<TokensResponse>("/v3/tokens/"),
    // 10-minute stale time: new tokens appear after a tab refresh, not permanently hidden
    staleTime: 10 * 60 * 1000,
  });

  return {
    tokens: data?.tokens ?? [],
    isLoading,
    error,
  };
}
