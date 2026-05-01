import { useMutation, type UseMutationResult } from "@tanstack/react-query";
import type { Hex } from "viem";
import { useAccount, useWalletClient } from "wagmi";
import { createSafeClient, type MetaTx, BASE_SEPOLIA_CHAIN_ID } from "../lib/safe";

export type SafeTxInput = { txs: MetaTx[] };

// Executes one or more transactions through the caller's Safe SCW.
// On first use, auto-deploys the SCW in the same tx via predictedSafe.
export function useSafeTx(): UseMutationResult<Hex, Error, SafeTxInput> {
  const { address, chainId } = useAccount();
  const walletClientQuery = useWalletClient();

  return useMutation<Hex, Error, SafeTxInput>({
    mutationFn: async ({ txs }) => {
      const eoa = address?.toLowerCase() as `0x${string}` | undefined;
      const walletClient = walletClientQuery.data;
      if (!eoa) throw new Error("Wallet not connected");
      if (!walletClient) throw new Error("Wallet client unavailable");
      if (chainId !== BASE_SEPOLIA_CHAIN_ID) {
        throw new Error(
          `Switch your wallet to Base Sepolia (chain ${BASE_SEPOLIA_CHAIN_ID})`,
        );
      }

      const eip1193 = {
        request: (args: { method: string; params?: unknown }) =>
          walletClient.request(args as never),
      };

      const safe = await createSafeClient({
        eip1193,
        eoa,
        chainId: walletClient.chain?.id,
        walletClient,
      });

      return safe.exec(txs);
    },
  });
}
