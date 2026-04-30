import {
  useWriteContract,
  useWaitForTransactionReceipt,
  useAccount,
  usePublicClient,
} from "wagmi";
import {
  Address,
  parseEventLogs,
  zeroHash,
  TransactionReceipt,
} from "viem";
import { CONTRACTS, DIAMOND_ABI } from "../config/contracts";

function toBytes32Hex(value: string | bigint | Address): Address {
  if (!value) throw new Error("Value is required");
  if (typeof value === "string") {
    if (value.startsWith("0x") && value.length === 66) return value as Address;
    if (/^[0-9a-fA-F]+$/.test(value))
      return `0x${value.padStart(64, "0")}` as Address;
    throw new Error(`Invalid hex string: ${value}`);
  }
  if (typeof value === "bigint")
    return `0x${value.toString(16).padStart(64, "0")}` as Address;
  throw new Error(`Unsupported type: ${typeof value}`);
}

export interface SplitPositionResult {
  yesPositionId: bigint;
  noPositionId: bigint;
  conditionId: Address;
  collateralToken: Address;
  amount: bigint;
}

export const PARTITION_YES = 1n;
export const PARTITION_NO = 2n;
export const BINARY_PARTITION = [PARTITION_YES, PARTITION_NO] as const;

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
  const conditionIdHex = toBytes32Hex(conditionId);

  const logs = parseEventLogs({
    abi: DIAMOND_ABI,
    logs: receipt.logs,
    eventName: "PositionSplit",
  });

  if (!logs || logs.length === 0) {
    throw new Error("PositionSplit event not found in receipt");
  }

  const event = logs[0];
  const amount = event.args.amount as bigint;
  const parentCollectionId = zeroHash;

  // Fetch both collection IDs in parallel (#19)
  const [yesCollectionId, noCollectionId] = await Promise.all([
    publicClient.readContract({
      address: diamondAddress,
      abi: DIAMOND_ABI,
      functionName: "getCollectionId",
      args: [parentCollectionId, conditionIdHex, PARTITION_YES],
    }),
    publicClient.readContract({
      address: diamondAddress,
      abi: DIAMOND_ABI,
      functionName: "getCollectionId",
      args: [parentCollectionId, conditionIdHex, PARTITION_NO],
    }),
  ]);

  // Fetch both position IDs in parallel (#19)
  const [yesPositionId, noPositionId] = await Promise.all([
    publicClient.readContract({
      address: diamondAddress,
      abi: DIAMOND_ABI,
      functionName: "getPositionId",
      args: [collateralToken, yesCollectionId],
    }),
    publicClient.readContract({
      address: diamondAddress,
      abi: DIAMOND_ABI,
      functionName: "getPositionId",
      args: [collateralToken, noCollectionId],
    }),
  ]);

  return { yesPositionId, noPositionId, conditionId, collateralToken, amount };
}

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
  const conditionIdHex = toBytes32Hex(conditionId);
  const parentCollectionId = zeroHash;

  const [yesCollectionId, noCollectionId] = await Promise.all([
    publicClient.readContract({
      address: diamondAddress,
      abi: DIAMOND_ABI,
      functionName: "getCollectionId",
      args: [parentCollectionId, conditionIdHex, PARTITION_YES],
    }),
    publicClient.readContract({
      address: diamondAddress,
      abi: DIAMOND_ABI,
      functionName: "getCollectionId",
      args: [parentCollectionId, conditionIdHex, PARTITION_NO],
    }),
  ]);

  const [yesPositionId, noPositionId] = await Promise.all([
    publicClient.readContract({
      address: diamondAddress,
      abi: DIAMOND_ABI,
      functionName: "getPositionId",
      args: [collateralToken, yesCollectionId],
    }),
    publicClient.readContract({
      address: diamondAddress,
      abi: DIAMOND_ABI,
      functionName: "getPositionId",
      args: [collateralToken, noCollectionId],
    }),
  ]);

  return { yesPositionId, noPositionId };
}

export function useSplitPosition() {
  const { address: userAddress } = useAccount();
  const publicClient = usePublicClient();

  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const {
    isLoading: isConfirming,
    isSuccess,
    data: receipt,
  } = useWaitForTransactionReceipt({ hash });

  const splitPosition = async ({
    collateralToken,
    conditionId,
    amount,
  }: {
    collateralToken: Address;
    conditionId: Address;
    amount: bigint;
  }) => {
    if (!userAddress) throw new Error("Wallet not connected");
    if (!collateralToken || !conditionId || !amount)
      throw new Error("Missing required parameters");
    if (!publicClient) throw new Error("Public client not available");

    const conditionIdHex = toBytes32Hex(conditionId);

    const isCollateralAllowed = await publicClient.readContract({
      address: CONTRACTS.Diamond,
      abi: DIAMOND_ABI,
      functionName: "isAllowedCollateral",
      args: [collateralToken],
    });
    if (!isCollateralAllowed) {
      throw new Error("Collateral token is not allowed by this Diamond");
    }

    // #14: removed hardcoded gas: 5_000_000 — let the wallet estimate gas
    return writeContract({
      address: CONTRACTS.Diamond,
      abi: DIAMOND_ABI,
      functionName: "splitPosition",
      args: [
        collateralToken,
        zeroHash,
        conditionIdHex,
        BINARY_PARTITION,
        amount,
      ],
    });
  };

  return { splitPosition, hash, isPending, isConfirming, isSuccess, error, receipt };
}
