import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { Address, maxUint256 } from 'viem';
import { ERC20_ABI } from '../config/contracts';

export function useTokenApproval(
  tokenAddress: Address | undefined,
  spenderAddress: Address,
  ownerAddress: Address | undefined,
  requiredAmount?: bigint,
) {
  const { data: allowance, refetch } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: ownerAddress && tokenAddress ? [ownerAddress, spenderAddress] : undefined,
    query: {
      enabled: !!ownerAddress && !!tokenAddress,
    },
  });

  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const approve = async (amount?: bigint) => {
    if (!tokenAddress) throw new Error('No token selected');
    return writeContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [spenderAddress, amount ?? maxUint256],
    });
  };

  // isApproved: if requiredAmount is provided, check allowance >= requiredAmount;
  // otherwise any non-zero allowance counts (e.g. when amount is not yet known).
  const isApproved =
    allowance !== undefined &&
    (requiredAmount !== undefined ? allowance >= requiredAmount : allowance > 0n);

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
