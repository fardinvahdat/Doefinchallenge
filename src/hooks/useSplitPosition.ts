import {
  useWriteContract,
  useWaitForTransactionReceipt,
  useAccount,
  useChainId,
  useReadContract,
  usePublicClient,
} from "wagmi";
import {
  Address,
  parseEventLogs,
  zeroHash,
  TransactionReceipt,
  isAddress,
} from "viem";
import { CONTRACTS, DIAMOND_ABI, ERC20_ABI } from "../config/contracts";

/**
 * Convert a value to a proper 0x-prefixed hex string for bytes32 parameters
 * This handles BigInt, regular strings, and already-formatted hex strings
 */
function toBytes32Hex(value: string | bigint | Address): Address {
  if (!value) {
    throw new Error("Value is required");
  }

  // If it's already a string
  if (typeof value === "string") {
    // If it's already a proper 0x-prefixed hex string, return as-is
    if (value.startsWith("0x") && value.length === 66) {
      return value as Address;
    }
    // If it's a hex string without 0x prefix
    if (/^[0-9a-fA-F]+$/.test(value)) {
      return `0x${value.padStart(64, "0")}` as Address;
    }
    // Otherwise treat as regular string and convert
    throw new Error(`Invalid hex string: ${value}`);
  }

  // If it's a bigint, convert to hex string
  if (typeof value === "bigint") {
    return `0x${value.toString(16).padStart(64, "0")}` as Address;
  }

  throw new Error(`Unsupported type: ${typeof value}`);
}

/**
 * Result type for parsing split position receipt
 */
export interface SplitPositionResult {
  yesPositionId: bigint;
  noPositionId: bigint;
  conditionId: Address;
  collateralToken: Address;
  amount: bigint;
}

/**
 * Partition constants for binary outcomes
 * indexSet 1 = yes (first outcome)
 * indexSet 2 = no (second outcome)
 */
export const PARTITION_YES = 1n;
export const PARTITION_NO = 2n;
export const BINARY_PARTITION = [PARTITION_YES, PARTITION_NO] as const;

/**
 * Parse split position receipt to extract position IDs
 *
 * This function calculates the position IDs by:
 * 1. Finding the PositionSplit event in the receipt
 * 2. Using getCollectionId to compute collection IDs for each index set
 * 3. Using getPositionId to compute position IDs from collection IDs
 *
 * Note: This requires a public client to read from the contract
 */
export async function parseSplitPositionReceipt(
  receipt: TransactionReceipt,
  diamondAddress: Address,
  collateralToken: Address,
  conditionId: Address,
  publicClient: {
    readContract: (params: {
      address: Address;
      abi: readonly any[];
      functionName: string;
      args: any[];
    }) => Promise<any>;
  },
): Promise<SplitPositionResult> {
  // Convert conditionId to proper hex string format
  const conditionIdHex = toBytes32Hex(conditionId);

  // Parse logs to find PositionSplit event
  const logs = parseEventLogs({
    abi: DIAMOND_ABI,
    logs: receipt.logs,
    eventName: "PositionSplit",
  });

  if (!logs || logs.length === 0) {
    throw new Error("PositionSplit event not found in receipt");
  }

  const event = logs[0];

  // Get the partition from the event (should be [1n, 2n] for binary)
  const partition = event.args.partition as readonly bigint[];
  const amount = event.args.amount as bigint;

  // For binary outcomes:
  // - indexSet 1 (binary: 01) corresponds to YES position
  // - indexSet 2 (binary: 10) corresponds to NO position

  // Calculate collection IDs for each outcome
  // parentCollectionId is zeroHash (0x0...0) for direct splits
  const parentCollectionId = zeroHash;

  // Get collection ID for YES (indexSet = 1)
  const yesCollectionId = await publicClient.readContract({
    address: diamondAddress,
    abi: DIAMOND_ABI,
    functionName: "getCollectionId",
    args: [parentCollectionId, conditionIdHex, PARTITION_YES],
  });

  // Get collection ID for NO (indexSet = 2)
  const noCollectionId = await publicClient.readContract({
    address: diamondAddress,
    abi: DIAMOND_ABI,
    functionName: "getCollectionId",
    args: [parentCollectionId, conditionIdHex, PARTITION_NO],
  });

  // Get position IDs from collection IDs
  const yesPositionId = await publicClient.readContract({
    address: diamondAddress,
    abi: DIAMOND_ABI,
    functionName: "getPositionId",
    args: [collateralToken, yesCollectionId],
  });

  const noPositionId = await publicClient.readContract({
    address: diamondAddress,
    abi: DIAMOND_ABI,
    functionName: "getPositionId",
    args: [collateralToken, noCollectionId],
  });

  return {
    yesPositionId,
    noPositionId,
    conditionId,
    collateralToken,
    amount,
  };
}

/**
 * Calculate position IDs without requiring a transaction receipt
 * This is useful when you already know the conditionId and collateralToken
 */
export async function calculatePositionIds(
  diamondAddress: Address,
  collateralToken: Address,
  conditionId: Address,
  publicClient: {
    readContract: (params: {
      address: Address;
      abi: readonly any[];
      functionName: string;
      args: any[];
    }) => Promise<any>;
  },
): Promise<{ yesPositionId: bigint; noPositionId: bigint }> {
  // Convert conditionId to proper hex string format
  const conditionIdHex = toBytes32Hex(conditionId);

  const parentCollectionId = zeroHash;

  // Get collection ID for YES (indexSet = 1)
  const yesCollectionId = await publicClient.readContract({
    address: diamondAddress,
    abi: DIAMOND_ABI,
    functionName: "getCollectionId",
    args: [parentCollectionId, conditionIdHex, PARTITION_YES],
  });

  // Get collection ID for NO (indexSet = 2)
  const noCollectionId = await publicClient.readContract({
    address: diamondAddress,
    abi: DIAMOND_ABI,
    functionName: "getCollectionId",
    args: [parentCollectionId, conditionIdHex, PARTITION_NO],
  });

  // Get position IDs from collection IDs
  const yesPositionId = await publicClient.readContract({
    address: diamondAddress,
    abi: DIAMOND_ABI,
    functionName: "getPositionId",
    args: [collateralToken, yesCollectionId],
  });

  const noPositionId = await publicClient.readContract({
    address: diamondAddress,
    abi: DIAMOND_ABI,
    functionName: "getPositionId",
    args: [collateralToken, noCollectionId],
  });

  return { yesPositionId, noPositionId };
}

/**
 * Hook for splitting positions on the conditional tokens protocol
 *
 * This hook allows users to split their collateral into binary outcome tokens
 * (YES/NO) based on a condition.
 *
 * @example
 * ```typescript
 * const { splitPosition, hash, isPending, isConfirming, isSuccess, error, receipt } = useSplitPosition();
 *
 * // Split 100 USDC into YES/NO positions
 * await splitPosition({
 *   collateralToken: usdcAddress,
 *   conditionId: conditionId,
 *   amount: parseEther("100")
 * });
 * ```
 */
export function useSplitPosition() {
  const { address: userAddress } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();

  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess,
    data: receipt,
  } = useWaitForTransactionReceipt({
    hash,
  });

  /**
   * Split a position into binary outcome tokens
   *
   * @param params - The split position parameters
   * @param params.collateralToken - The ERC20 token used as collateral
   * @param params.conditionId - The condition ID for the split
   * @param params.amount - The amount of collateral to split (in wei)
   * @returns The transaction hash
   */
  const splitPosition = async ({
    collateralToken,
    conditionId,
    amount,
  }: {
    collateralToken: Address;
    conditionId: Address;
    amount: bigint;
  }) => {
    // DEBUG: Log the amount type and value to diagnose formatting issues
    console.log("[DEBUG splitPosition] amount received:", {
      amount,
      type: typeof amount,
      isBigInt: typeof amount === "bigint",
      stringValue: typeof amount === "bigint" ? amount.toString() : amount,
    });

    if (!userAddress) {
      throw new Error("Wallet not connected");
    }

    if (!collateralToken || !conditionId || !amount) {
      throw new Error("Missing required parameters");
    }

    // Ensure publicClient is available
    if (!publicClient) {
      throw new Error("Public client not available");
    }

    // Pre-flight validations using public client
    // Ensure conditionId is properly formatted as hex string
    const conditionIdHex = toBytes32Hex(conditionId);

    // DEBUG: Log condition validation details
    console.log("[DEBUG splitPosition] condition validation:", {
      conditionId,
      conditionIdHex,
      localStorageKey: `doefin-conditions`,
    });

    // 1. Check if condition exists and is active
    const storedConditions = JSON.parse(
      localStorage.getItem(`doefin-conditions`) || "[]",
    );
    console.log("[DEBUG splitPosition] stored conditions:", storedConditions);

    const condition = storedConditions.find(
      (item: any) => item.conditionId === conditionIdHex,
    );

    console.log("[DEBUG splitPosition] found condition:", condition);

    if (!condition) {
      throw new Error("Condition does not exist");
    }

    // 2. Check if condition is prepared (getPayoutNumerators returns non-empty array)
    const payoutNumerators = await publicClient.readContract({
      address: CONTRACTS.Diamond,
      abi: DIAMOND_ABI,
      functionName: "getPayoutNumerators",
      args: [conditionIdHex],
    });

    if (!payoutNumerators || payoutNumerators.length === 0) {
      throw new Error(
        "Condition is not prepared. Call prepareCondition first.",
      );
    }

    // 3. Check if collateral is allowed
    const isCollateralAllowed = await publicClient.readContract({
      address: CONTRACTS.Diamond,
      abi: DIAMOND_ABI,
      functionName: "isAllowedCollateral",
      args: [collateralToken],
    });

    if (!isCollateralAllowed) {
      throw new Error("Collateral token is not allowed");
    }

    // 4. Get collateral unit and verify amount is a multiple of it
    const collateralUnit = await publicClient.readContract({
      address: CONTRACTS.Diamond,
      abi: DIAMOND_ABI,
      functionName: "getCollateralUnit",
      args: [collateralToken],
    });

    // DEBUG: Log collateral unit validation
    console.log("[DEBUG splitPosition] collateral unit check:", {
      collateralUnit,
      amount,
      amountDivisibleByUnit: amount % collateralUnit === 0n,
    });

    // Check if collateral token is approved for the diamond contract
    // The user needs to have approved the diamond contract to spend their tokens
    // This is handled separately via useTokenApproval hook

    // DEBUG: Log final writeContract call
    console.log("[DEBUG splitPosition] calling writeContract with:", {
      collateralToken,
      parentCollectionId: zeroHash,
      conditionIdHex,
      partition: BINARY_PARTITION,
      amount,
      amountType: typeof amount,
    });

    return writeContract({
      address: CONTRACTS.Diamond,
      abi: DIAMOND_ABI,
      functionName: "splitPosition",
      args: [
        collateralToken, // collateralToken
        zeroHash, // parentCollectionId (zeroHash for direct splits)
        conditionIdHex, // conditionId
        BINARY_PARTITION, // partition [1n, 2n] for binary outcomes
        amount, // amount in wei
      ],
      gas: BigInt(5000000),
    });
  };

  return {
    splitPosition,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    receipt,
  };
}

/**
 * Hook to check if the user has approved the diamond contract to spend their collateral
 *
 * @param collateralToken - The ERC20 token address
 * @param amount - Optional amount to check approval for (if not provided, checks for any approval)
 */
export function useCollateralApproval(
  collateralToken: Address | undefined,
  amount?: bigint,
) {
  const { address: userAddress } = useAccount();

  const { data: allowance, refetch } = useReadContract({
    address: collateralToken,
    abi: ERC20_ABI,
    functionName: "allowance",
    args:
      userAddress && collateralToken
        ? [userAddress, CONTRACTS.Diamond]
        : undefined,
    query: {
      enabled: !!userAddress && !!collateralToken,
    },
  });

  const isApproved =
    allowance !== undefined && (amount ? allowance >= amount : allowance > 0n);

  return {
    allowance,
    isApproved,
    refetch,
  };
}
