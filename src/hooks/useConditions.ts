import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";

export type ConditionStatus = "active" | "resolved" | "all";

export interface ApiMarketPosition {
  position_id: string;
  outcome_index: number;
  total_supply: string;
  resolution_status: string;
  current_value: string | null;
}

export interface ApiMarket {
  market_id: number;
  collateral_token: string;
  collateral_digits: number | null;
  positions: ApiMarketPosition[];
}

export interface ApiCondition {
  condition_id: string;
  question_id: string;
  question_string: string;
  outcome_slot_count: number;
  oracle: string;
  active: boolean;
  resolved: boolean;
  created_at_block: number;
  payout_numerators: number[] | null;
  markets: ApiMarket[];
}

interface ConditionsResponse {
  conditions: ApiCondition[];
  total_count: number;
  page: number;
  page_size: number;
}

function buildParams(status: ConditionStatus): Record<string, string> {
  const p: Record<string, string> = { page_size: "100" };
  if (status === "active") p.active_only = "true";
  if (status === "resolved") { p.active_only = "false"; p.resolved_only = "true"; }
  if (status === "all") p.active_only = "false";
  return p;
}

export function useConditions(status: ConditionStatus = "active") {
  const { data, isLoading, error } = useQuery({
    queryKey: ["conditions", status],
    queryFn: () => apiFetch<ConditionsResponse>("/v3/conditions/", buildParams(status)),
    staleTime: 30_000,
    refetchInterval: 30_000,
  });

  return {
    conditions: data?.conditions ?? [],
    totalCount: data?.total_count ?? 0,
    isLoading,
    error,
  };
}

export function useInvalidateConditions() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["conditions"] });
}

// Parse threshold (in T) and blockHeight from a question_string.
// Primary format: "Will Bitcoin difficulty exceed 145.15T at block 934,538?"
// Fallback: any "X.XT at block N" pattern in case the verb changes.
export function parseQuestionString(
  qs: string,
): { thresholdT: number; blockHeight: number } | null {
  let match = qs.match(/exceed\s+([\d.]+)T\s+at\s+block\s+([\d,]+)/i);
  if (!match) match = qs.match(/([\d.]+)T\s+at\s+block\s+([\d,]+)/i);
  if (!match) return null;
  return {
    thresholdT: parseFloat(match[1]),
    blockHeight: parseInt(match[2].replace(/,/g, ""), 10),
  };
}
