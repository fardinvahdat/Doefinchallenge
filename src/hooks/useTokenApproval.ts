import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { Address, maxUint256 } from 'viem';
import { ERC20_ABI } from '../config/contracts';

export function useTokenApproval(
  tokenAddress: Address,
  spenderAddress: Address,
  ownerAddress: Address | undefined
) {
  // Read current allowance
  const { data: allowance, refetch } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: ownerAddress ? [ownerAddress, spenderAddress] : undefined,
    query: {
      enabled: !!ownerAddress,
    },
  });

  // Approve transaction
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const approve = async (amount?: bigint) => {
    return writeContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [spenderAddress, amount || maxUint256],
    });
  };

  const isApproved = allowance !== undefined && allowance > 0n;

  return {
    allowance,
    isApproved,
    approve,
    refetch,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}
