import { useMutation, type UseMutationResult } from "@tanstack/react-query";
import type { Hex } from "viem";
import { useAccount, useWriteContract } from "wagmi";
import { useScw } from "./useScw";
import { ERC20_ABI } from "../config/contracts";
import { BASE_SEPOLIA_CHAIN_ID } from "../lib/safe";

export type DepositInput = { tokenAddress: `0x${string}`; amount: bigint };

// Transfer ERC20 from EOA → SCW. Plain EOA tx, not a Safe tx.
export function useDeposit(): UseMutationResult<Hex, Error, DepositInput> {
  const { address, chainId } = useAccount();
  const scwQuery = useScw();
  const { writeContractAsync } = useWriteContract();

  return useMutation<Hex, Error, DepositInput>({
    mutationFn: async ({ tokenAddress, amount }) => {
      if (!address) throw new Error("Wallet not connected");
      if (chainId !== BASE_SEPOLIA_CHAIN_ID)
        throw new Error(`Switch to Base Sepolia (chain ${BASE_SEPOLIA_CHAIN_ID})`);
      const scw = scwQuery.data?.scw;
      if (!scw) throw new Error("Safe wallet address not resolved");
      if (amount <= 0n) throw new Error("Amount must be greater than 0");

      return writeContractAsync({
        chainId: BASE_SEPOLIA_CHAIN_ID,
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: "transfer",
        args: [scw, amount],
      }) as Promise<Hex>;
    },
  });
}
