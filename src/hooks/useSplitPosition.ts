import { useState } from "react";
import { useWaitForTransactionReceipt, usePublicClient } from "wagmi";
import {
  Address,
  parseEventLogs,
  zeroHash,
  TransactionReceipt,
  encodeFunctionData,
  maxUint256,
  type Hex,
} from "viem";
import { CONTRACTS, DIAMOND_ABI, ERC20_ABI } from "../config/contracts";
import { useSafeTx } from "./useSafeTx";

export const PARTITION_YES = 1n;
export const PARTITION_NO = 2n;
export const BINARY_PARTITION = [PARTITION_YES, PARTITION_NO] as const;

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
  const safeTx = useSafeTx();
  const publicClient = usePublicClient();
  const [hash, setHash] = useState<Hex | undefined>(undefined);

  const { isLoading: isConfirming, isSuccess, data: receipt } =
    useWaitForTransactionReceipt({ hash });

  const splitPosition = async ({
    collateralToken,
    conditionId,
    amount,
    includeApproval = false,
  }: {
    collateralToken: Address;
    conditionId: `0x${string}`;
    amount: bigint;
    includeApproval?: boolean;
  }) => {
    if (!publicClient) throw new Error("Public client not available");

    const conditionIdHex = toBytes32Hex(conditionId);
    const txs = [];

    if (includeApproval) {
      txs.push({
        to: collateralToken,
        data: encodeFunctionData({
          abi: ERC20_ABI,
          functionName: "approve",
          args: [CONTRACTS.Diamond, maxUint256],
        }),
      });
    }

    txs.push({
      to: CONTRACTS.Diamond,
      data: encodeFunctionData({
        abi: DIAMOND_ABI,
        functionName: "splitPosition",
        args: [collateralToken, zeroHash, conditionIdHex, BINARY_PARTITION, amount],
      }),
    });

    const txHash = await safeTx.mutateAsync({ txs });
    setHash(txHash);
    return txHash;
  };

  return {
    splitPosition,
    hash,
    isPending: safeTx.isPending,
    isConfirming,
    isSuccess,
    error: safeTx.error,
    receipt,
  };
}
