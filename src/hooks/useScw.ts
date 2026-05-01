import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { useAccount } from "wagmi";

const BASE_URL = (
  (import.meta.env.VITE_API_BASE_URL as string) ||
  "https://ge4lct7761.execute-api.eu-west-1.amazonaws.com/prod"
).replace(/\/+$/, "");

export type ScwInfo = {
  eoa: `0x${string}`;
  scw: `0x${string}`;
  deployed: boolean;
  /** 0=Predicted, 1=Deployed, 2=Approved, 3=Active */
  status: number;
  source: string;
};

const fetchScw = async (eoa: `0x${string}`): Promise<ScwInfo> => {
  const res = await fetch(`${BASE_URL}/v3/scw/wallets`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ eoa_address: eoa.toLowerCase(), create_if_missing: false }),
  });
  if (!res.ok) throw new Error(`SCW API ${res.status}`);
  const data = await res.json();
  return {
    eoa: data.eoa_address.toLowerCase() as `0x${string}`,
    scw: data.scw_address.toLowerCase() as `0x${string}`,
    deployed: data.deployed,
    status: data.status,
    source: data.source,
  };
};

// Resolves the deterministic Safe 1-of-1 SCW address for the connected EOA.
// Backend is the sole authority — never self-derive outside of Protocol Kit.
export function useScw(): UseQueryResult<ScwInfo> {
  const { address } = useAccount();
  const eoa = address?.toLowerCase() as `0x${string}` | undefined;
  return useQuery({
    queryKey: ["scw", eoa],
    queryFn: () => fetchScw(eoa as `0x${string}`),
    enabled: Boolean(eoa),
    staleTime: Infinity,
    retry: false,
  });
}
