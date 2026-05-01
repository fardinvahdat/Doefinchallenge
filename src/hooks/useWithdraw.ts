import { useMutation, type UseMutationResult } from "@tanstack/react-query";
import { encodeFunctionData, type Hex } from "viem";
import { useAccount } from "wagmi";
import { useScw } from "./useScw";
import { useSafeTx } from "./useSafeTx";
import { ERC20_ABI } from "../config/contracts";

export type WithdrawInput = { tokenAddress: `0x${string}`; amount: bigint };

// Transfer ERC20 from SCW → EOA via a Safe transaction.
export function useWithdraw(): UseMutationResult<Hex, Error, WithdrawInput> {
  const { address } = useAccount();
  const scwQuery = useScw();
  const safeTx = useSafeTx();

  return useMutation<Hex, Error, WithdrawInput>({
    mutationFn: async ({ tokenAddress, amount }) => {
      if (!address) throw new Error("Wallet not connected");
      if (!scwQuery.data?.scw) throw new Error("Safe wallet address not resolved");
      if (amount <= 0n) throw new Error("Amount must be greater than 0");

      return safeTx.mutateAsync({
        txs: [{
          to: tokenAddress,
          data: encodeFunctionData({
            abi: ERC20_ABI,
            functionName: "transfer",
            args: [address as `0x${string}`, amount],
          }),
          value: 0n,
        }],
      });
    },
  });
}
