import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { CONTRACTS, CONDITIONAL_TOKENS_ABI } from "../config/contracts";
import { Address, keccak256, encodePacked } from "viem";

export function useConditionalTokens() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Prepare a condition
  const prepareCondition = async (
    oracle: Address,
    questionId: `0x${string}`,
    outcomeSlotCount: bigint,
  ) => {
    return writeContract({
      address: CONTRACTS.ConditionalTokens,
      abi: CONDITIONAL_TOKENS_ABI,
      functionName: "prepareCondition",
      args: [oracle, questionId, outcomeSlotCount],
    });
  };

  // Split position
  const splitPosition = async (
    collateralToken: Address,
    parentCollectionId: `0x${string}`,
    conditionId: `0x${string}`,
    partition: bigint[],
    amount: bigint,
  ) => {
    debugger;
    try {
      return writeContract({
        address: CONTRACTS.ConditionalTokens,
        abi: CONDITIONAL_TOKENS_ABI,
        functionName: "splitPosition",
        args: [
          collateralToken,
          parentCollectionId,
          conditionId,
          partition,
          amount,
        ],
      });
    } catch (error) {
      console.error("Error splitting position:", error);
    }
  };

  // Generate condition ID from parameters
  const generateConditionId = (
    oracle: Address,
    questionId: `0x${string}`,
    outcomeSlotCount: bigint,
  ): `0x${string}` => {
    return keccak256(
      encodePacked(
        ["address", "bytes32", "uint256"],
        [oracle, questionId, outcomeSlotCount],
      ),
    );
  };

  return {
    prepareCondition,
    splitPosition,
    generateConditionId,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

// Hook to read condition outcome slot count
export function useConditionOutcomeSlotCount(
  conditionId: `0x${string}` | undefined,
) {
  return useReadContract({
    address: CONTRACTS.ConditionalTokens,
    abi: CONDITIONAL_TOKENS_ABI,
    functionName: "getOutcomeSlotCount",
    args: conditionId ? [conditionId] : undefined,
    query: {
      enabled: !!conditionId,
    },
  });
}

// Hook to read position token balance
export function usePositionBalance(
  owner: Address | undefined,
  positionId: bigint | undefined,
) {
  return useReadContract({
    address: CONTRACTS.ConditionalTokens,
    abi: CONDITIONAL_TOKENS_ABI,
    functionName: "balanceOf",
    args: owner && positionId !== undefined ? [owner, positionId] : undefined,
    query: {
      enabled: !!owner && positionId !== undefined,
    },
  });
}
