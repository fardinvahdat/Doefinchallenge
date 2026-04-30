import { parseEventLogs, TransactionReceipt } from "viem";
import { DIAMOND_ABI } from "../config/contracts";

export interface ConditionCreationEventData {
  conditionId: string;
  questionId: string;
  oracle: string;
  outcomeSlotCount: bigint;
  metadataURI: string;
  creator: string;
}

export function parseConditionCreationEvent(
  receipt: TransactionReceipt,
): ConditionCreationEventData {
  const logs = parseEventLogs({
    abi: DIAMOND_ABI,
    eventName: "ConditionCreated",
    logs: receipt.logs,
  });

  if (logs.length === 0) {
    throw new Error("ConditionCreated event not found in transaction receipt");
  }

  const event = logs[0];
  return {
    conditionId: event.args.conditionId as string,
    questionId: event.args.questionId as string,
    oracle: event.args.oracle as string,
    outcomeSlotCount: event.args.outcomeSlotCount as bigint,
    metadataURI: event.args.metadataURI as string,
    creator: event.args.creator as string,
  };
}
