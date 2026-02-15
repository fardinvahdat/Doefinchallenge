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

/**
 * Parses the ConditionCreated event from a transaction receipt.
 *
 * @param receipt - The transaction receipt from creating a condition
 * @returns The parsed event data including conditionId, questionId, oracle, outcomeSlotCount, metadataURI, and creator
 * @throws Error if the ConditionCreated event is not found in the receipt
 */
export function parseConditionCreationEvent(
  receipt: TransactionReceipt,
): ConditionCreationEventData {
  console.log("🔍 DEBUG: Parsing condition creation event...");
  console.log("  receipt.status:", receipt.status);
  console.log("  receipt.logs count:", receipt.logs?.length);

  // Log all log topics for debugging
  if (receipt.logs && receipt.logs.length > 0) {
    console.log("  📋 Log topics:");
    receipt.logs.forEach((log, i) => {
      console.log(`    [${i}] ${log.address}: ${log.topics[0]}`);
    });
  }

  const logs = parseEventLogs({
    abi: DIAMOND_ABI,
    eventName: "ConditionCreated",
    logs: receipt.logs,
  });

  console.log("  🔎 Parsed 'ConditionCreated' events:", logs.length);

  if (logs.length === 0) {
    // Try alternative event names
    const prepLogs = parseEventLogs({
      abi: DIAMOND_ABI,
      eventName: "ConditionPreparation",
      logs: receipt.logs,
    });
    console.log("  🔎 Parsed 'ConditionPreparation' events:", prepLogs.length);

    throw new Error("ConditionCreated event not found in transaction receipt");
  }

  const event = logs[0];
  console.log("  ✅ Event found:", event.args);

  return {
    conditionId: event.args.conditionId as string,
    questionId: event.args.questionId as string,
    oracle: event.args.oracle as string,
    outcomeSlotCount: event.args.outcomeSlotCount as bigint,
    metadataURI: event.args.metadataURI as string,
    creator: event.args.creator as string,
  };
}
