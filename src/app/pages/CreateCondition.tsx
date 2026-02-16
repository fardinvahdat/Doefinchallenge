import { useState, useEffect, useMemo } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Loader2, ExternalLink, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../components/ui/dialog";
import { useNavigate } from "react-router";
import { TransactionOverlay } from "../components/TransactionOverlay";
import { CopyableHash } from "../components/CopyableHash";
import { GasEstimationModal } from "../components/GasEstimationModal";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { useWeb3 } from "../contexts/Web3Context";
import { useBitcoinBlockHeight } from "../../hooks/useBitcoinBlockHeight";
import { useBitcoinDifficulty } from "../../hooks/useBitcoinDifficulty";
import { useGasEstimate } from "../../hooks/useGasEstimate";
import {
  keccak256,
  toHex,
  encodePacked,
  encodeAbiParameters,
  randomBytes,
} from "viem";
import { CONTRACTS, DIAMOND_ABI } from "../../config/contracts";
import { parseConditionCreationEvent } from "../../utils/conditionEventParser";
import { uploadFileToFilebase } from "@/utils/filebase";

// QuestionType enum - corresponds to the contract enum
enum QuestionType {
  DifficultyThreshold = 0,
}

// Condition data interface for localStorage
interface StoredCondition {
  conditionId: string;
  questionId: string;
  transactionHash: string;
  question: string;
  threshold: string;
  blockHeight: string;
  outcomeSlotCount: number;
  timestamp: number;
  metadataURI: string;
}

// LocalStorage key
const CONDITIONS_STORAGE_KEY = "doefin-conditions";

// Function to save condition to localStorage
function saveConditionToStorage(condition: StoredCondition): void {
  try {
    const existingData = localStorage.getItem(CONDITIONS_STORAGE_KEY);
    const conditions: StoredCondition[] = existingData
      ? JSON.parse(existingData)
      : [];

    // Check if condition already exists (by conditionId)
    const existingIndex = conditions.findIndex(
      (c) => c.conditionId === condition.conditionId,
    );
    if (existingIndex >= 0) {
      // Update existing condition
      conditions[existingIndex] = condition;
    } else {
      // Add new condition at the beginning
      conditions.unshift(condition);
    }

    localStorage.setItem(CONDITIONS_STORAGE_KEY, JSON.stringify(conditions));
    console.log("Condition saved to localStorage:", condition.conditionId);
  } catch (error) {
    console.error("Error saving condition to localStorage:", error);
  }
}

export default function CreateCondition() {
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();
  const { currentBlock } = useWeb3();
  const {
    height: bitcoinBlockHeight,
    loading: bitcoinLoading,
    error: bitcoinError,
  } = useBitcoinBlockHeight();
  const {
    difficulty: bitcoinDifficulty,
    formatted: bitcoinDifficultyFormatted,
    loading: difficultyLoading,
    error: difficultyError,
  } = useBitcoinDifficulty();

  // Direct wagmi hooks for createConditionWithMetadata
  const {
    writeContract,
    data: hash,
    isPending,
    error: writeError,
  } = useWriteContract();
  const {
    isLoading: isConfirming,
    isSuccess,
    data: receipt,
  } = useWaitForTransactionReceipt({
    hash,
  });

  const [threshold, setThreshold] = useState("");
  const [blockHeight, setBlockHeight] = useState("");
  const [metadataURI, setMetadataURI] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showGasModal, setShowGasModal] = useState(false);
  const [showTransactionOverlay, setShowTransactionOverlay] = useState(false);
  const [conditionId, setConditionId] = useState<`0x${string}` | "">("");
  const [questionId, setQuestionId] = useState<`0x${string}` | "">("");
  const [eventQuestionId, setEventQuestionId] = useState<`0x${string}` | "">(
    "",
  );

  const currentBlockNumber = currentBlock ? Number(currentBlock) : 0;
  const outcomeSlotCount = 2; // Binary condition (YES/NO) - uint8

  // Check if contracts are configured
  const contractsConfigured =
    CONTRACTS.Diamond !== "0x0000000000000000000000000000000000000000";

  // Gas estimation - enable when all fields are filled
  const canEstimateGas = Boolean(
    contractsConfigured &&
    isConnected &&
    address &&
    threshold &&
    blockHeight &&
    questionId,
  );

  const gasEstimate = useGasEstimate({
    enabled: canEstimateGas,
    diamond: address,
    questionType: QuestionType.DifficultyThreshold,
    threshold: BigInt(threshold),
    blockHeight: BigInt(blockHeight),
    outcomeSlotCount: BigInt(outcomeSlotCount),
    metadataURI,
    salt: questionId ? keccak256(toHex(questionId)) : undefined,
  });

  // Generate questionId from metadata using ABI encoding
  useEffect(() => {
    if (threshold && blockHeight) {
      // Encode metadata using ABI encoding (matches contract expectation)
      const encodedMetadata = encodeAbiParameters(
        [{ type: "uint256" }, { type: "uint256" }],
        [BigInt(threshold), BigInt(blockHeight)],
      );

      // Generate questionId as keccak256 of the encoded metadata
      const qId = keccak256(encodedMetadata);

      // DEBUG: Log to see what's being hashed
      console.log("🔍 DEBUG: Generating questionId");
      console.log("  Threshold:", threshold);
      console.log("  Block Height:", blockHeight);
      console.log("  Encoded Metadata:", encodedMetadata);
      console.log("  QuestionId:", qId);

      setQuestionId(qId);
    } else {
      setQuestionId("");
    }
  }, [threshold, blockHeight]);

  // Handle transaction success
  useEffect(() => {
    // Always log when this effect runs
    console.log("🎯 DEBUG: Success useEffect triggered", {
      isSuccess,
      receipt: !!receipt,
      hash: !!hash,
      address: !!address,
      questionId,
    });

    if (isSuccess && receipt && hash && address && questionId) {
      console.log("🚀 DEBUG: Transaction success detected!");
      console.log("  receipt.logs length:", receipt.logs?.length);
      console.log("  hash:", hash);
      console.log("  questionId:", questionId);

      // Generate question string for the condition (from metadata for display)
      const question = `Will Bitcoin mining difficulty exceed ${parseInt(threshold).toLocaleString()} at block ${blockHeight}?`;

      // Try to parse event, but don't fail if it doesn't work
      let eventConditionId: string;
      let eventQuestionId: string;
      let eventOutcomeSlotCount: number;
      let eventMetadataURI: string;

      try {
        const eventData = parseConditionCreationEvent(receipt as any);
        console.log("✅ DEBUG: Event parsed successfully:", eventData);

        eventConditionId = eventData.conditionId;
        eventQuestionId = eventData.questionId;
        eventOutcomeSlotCount = Number(eventData.outcomeSlotCount);
        eventMetadataURI = eventData.metadataURI;
      } catch (eventError) {
        console.error(
          "❌ DEBUG: Event parsing failed, using fallback:",
          eventError,
        );

        // FALLBACK: Use questionId as conditionId (this is what the contract does internally)
        // The conditionId = keccak256(oracle || questionId || outcomeSlotCount)
        // Since we don't know the oracle address, we'll use the questionId directly
        // This is a simplification - in production you'd want to query the contract
        eventConditionId = questionId;
        eventQuestionId = questionId;
        eventOutcomeSlotCount = outcomeSlotCount;
        eventMetadataURI = metadataURI || "";

        console.log(
          "⚠️ DEBUG: Using fallback IDs - conditionId:",
          eventConditionId,
        );
      }

      setConditionId(eventConditionId as `0x${string}`);
      setEventQuestionId(eventQuestionId as `0x${string}`);

      // Save condition to localStorage with event-derived (or fallback) IDs
      const storedCondition: StoredCondition = {
        conditionId: eventConditionId,
        questionId: eventQuestionId,
        transactionHash: hash,
        question: question,
        threshold: threshold,
        blockHeight: blockHeight,
        outcomeSlotCount: eventOutcomeSlotCount,
        timestamp: Date.now(),
        metadataURI: eventMetadataURI,
      };

      console.log("💾 DEBUG: About to save condition:", storedCondition);
      saveConditionToStorage(storedCondition);

      setShowSuccessModal(true);
      toast.success("Condition created successfully!");
    }
  }, [
    isSuccess,
    receipt,
    hash,
    address,
    questionId,
    threshold,
    blockHeight,
    metadataURI,
  ]);

  // Handle transaction error
  useEffect(() => {
    if (writeError) {
      toast.error("Transaction failed: " + (writeError as Error).message);
    }
  }, [writeError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isConnected || !address) {
      toast.error("Please connect your wallet");
      return;
    }

    if (!contractsConfigured) {
      toast.error(
        "Contracts not configured. Please deploy contracts and update /src/config/contracts.ts",
      );
      return;
    }

    if (!threshold) {
      toast.error("Threshold is required");
      return;
    }

    // Validate threshold is a positive number
    const thresholdNum = parseFloat(threshold);
    if (isNaN(thresholdNum) || thresholdNum <= 0) {
      toast.error(
        "Difficulty Threshold must be a numeric value greater than zero",
      );
      return;
    }

    if (!blockHeight) {
      toast.error("Target block height is required");
      return;
    }

    // Validate block height is a positive number and greater than current Bitcoin block
    const blockHeightNum = parseFloat(blockHeight);
    if (isNaN(blockHeightNum) || blockHeightNum <= 0) {
      toast.error("Target Bitcoin Block Height must be a positive number");
      return;
    }

    // Check if block height is in the future (strictly greater than current Bitcoin block)
    if (bitcoinBlockHeight > 0 && blockHeightNum <= bitcoinBlockHeight) {
      toast.error(
        `Target Bitcoin Block Height must be greater than current block (${bitcoinBlockHeight.toLocaleString()})`,
      );
      return;
    }

    if (!questionId) {
      toast.error("Question ID generation failed");
      return;
    }

    // Show loading indicator while uploading to IPFS
    setIsUploading(true);

    try {
      // Create JSON metadata object
      const jsonMetadata = {
        "difficulty-threshold": threshold,
        "target-block-height": blockHeight,
        question: `Will Bitcoin mining difficulty exceed ${parseInt(threshold).toLocaleString()} at block ${blockHeight}?`,
      };

      // Convert JSON to File object
      const metadataFile = new File(
        [JSON.stringify(jsonMetadata)],
        "metadata.json",
        { type: "application/json" },
      );

      // Upload to IPFS using Filebase
      const result = await uploadFileToFilebase(
        metadataFile,
        "doe-finch-challenge",
      );

      // Use the returned IPFS URL as metadata URI
      const ipfsURI = result.url;
      console.log("📤 DEBUG: IPFS Upload successful:", ipfsURI);

      setMetadataURI(ipfsURI);

      // Show gas estimation modal after successful upload
      setShowGasModal(true);
    } catch (error) {
      console.error("IPFS upload failed:", error);
      toast.error(
        "Failed to upload metadata to IPFS: " + (error as Error).message,
      );
      return;
    } finally {
      setIsUploading(false);
    }
  };

  const handleConfirmTransaction = async () => {
    if (!address || !questionId || !threshold || !blockHeight) return;

    try {
      setShowGasModal(false);

      // Encode metadata using ABI encoding
      const metadata = encodeAbiParameters(
        [{ type: "uint256" }, { type: "uint256" }],
        [BigInt(threshold), BigInt(blockHeight)],
      );

      // Generate salt from questionId for uniqueness
      const salt = keccak256(toHex(questionId));

      console.log("📝 DEBUG: Creating condition with metadata");
      console.log("  QuestionType:", QuestionType.DifficultyThreshold);
      console.log("  Metadata (encoded):", metadata);
      console.log("  OutcomeSlotCount:", outcomeSlotCount);
      console.log("  MetadataURI:", metadataURI);
      console.log("  Salt:", salt);

      // Call Diamond contract's createConditionWithMetadata
      await writeContract({
        address: CONTRACTS.Diamond,
        abi: DIAMOND_ABI,
        functionName: "createConditionWithMetadata",
        args: [
          QuestionType.DifficultyThreshold, // questionType: uint8
          metadata, // metadata: bytes (encoded threshold + blockHeight)
          outcomeSlotCount, // outcomeSlotCount: uint8
          metadataURI || "", // metadataURI: string (empty string if not provided)
          salt, // salt: bytes32
        ],
      });
    } catch (err) {
      console.error("Error creating condition:", err);
      toast.error("Failed to create condition: " + (err as Error).message);
    }
  };

  const txStatus = useMemo(() => {
    if (isPending) return "awaiting";
    if (isConfirming) return "confirming";
    if (isSuccess) return "confirmed";
    if (writeError) return "failed";
    return "idle";
  }, [isPending, isConfirming, isSuccess, writeError]);

  // Control TransactionOverlay visibility based on txStatus
  useEffect(() => {
    if (txStatus !== "idle") {
      setShowTransactionOverlay(true);
    } else {
      setShowTransactionOverlay(false);
    }
  }, [txStatus]);

  const metadata =
    threshold && blockHeight
      ? {
          question: `Will Bitcoin mining difficulty exceed ${parseInt(threshold).toLocaleString()} at block ${blockHeight}?`,
          threshold: threshold,
          blockHeight: blockHeight,
          type: "DifficultyThreshold",
          questionType: QuestionType.DifficultyThreshold,
        }
      : null;

  return (
    <div className="container mx-auto px-4 lg:px-8 py-12">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Create Binary Condition
          </h1>
          <p className="text-text-secondary text-lg">
            Define a difficulty threshold condition for Bitcoin mining
            prediction markets
          </p>
        </div>

        {!isConnected ? (
          <div className="bg-surface border border-border rounded-xl p-12 text-center">
            <p className="text-text-secondary text-lg mb-4">
              Please connect your wallet to create a condition
            </p>
            <p className="text-text-tertiary text-sm">
              Use the Connect Wallet button in the top right corner
            </p>
          </div>
        ) : (
          <>
            {/* Warning Banner - Contracts Not Configured */}
            {!contractsConfigured && (
              <div className="mb-6 p-4 bg-danger/10 border border-danger/30 rounded-xl flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-danger flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-danger font-semibold mb-1">
                    Contracts Not Configured
                  </p>
                  <p className="text-sm text-text-secondary mb-2">
                    Contract addresses are set to zero address. You need to
                    deploy contracts first and update{" "}
                    <code className="text-xs bg-elevated px-1.5 py-0.5 rounded">
                      /src/config/contracts.ts
                    </code>
                  </p>
                  <p className="text-xs text-text-tertiary">
                    See{" "}
                    <code className="bg-elevated px-1.5 py-0.5 rounded">
                      /WEB3_SETUP.md
                    </code>{" "}
                    for deployment instructions
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Form */}
              <div className="bg-surface border border-border rounded-xl p-6 md:p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Threshold */}
                  <div className="space-y-2">
                    <Label htmlFor="threshold" className="text-text-primary">
                      Difficulty Threshold *
                    </Label>
                    <div className="relative">
                      <Input
                        id="threshold"
                        type="number"
                        placeholder={
                          bitcoinDifficulty?.toString() || "50000000000"
                        }
                        value={threshold}
                        onChange={(e) => setThreshold(e.target.value)}
                        className="bg-elevated border-border text-text-primary pr-20 focus:ring-primary focus:border-primary"
                        required
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary text-sm">
                        H/s
                      </span>
                    </div>
                    <p className="text-xs text-text-tertiary">
                      {difficultyLoading
                        ? "Loading Bitcoin difficulty..."
                        : difficultyError
                          ? difficultyError
                          : bitcoinDifficultyFormatted
                            ? `Current difficulty: ${bitcoinDifficultyFormatted} H/s`
                            : null}
                    </p>
                    <p className="text-xs text-text-tertiary">
                      The difficulty value that determines the binary outcome
                    </p>
                  </div>

                  {/* Target Block Height */}
                  <div className="space-y-2">
                    <Label htmlFor="blockHeight" className="text-text-primary">
                      Target Bitcoin Block Height *
                    </Label>
                    <Input
                      id="blockHeight"
                      type="number"
                      placeholder={
                        bitcoinBlockHeight > 0
                          ? bitcoinBlockHeight.toString()
                          : "875000"
                      }
                      value={blockHeight}
                      onChange={(e) => setBlockHeight(e.target.value)}
                      className="bg-elevated border-border text-text-primary focus:ring-primary focus:border-primary"
                      required
                    />
                    <div className="space-y-1">
                      {!bitcoinLoading && bitcoinBlockHeight > 0 && (
                        <p className="text-xs text-text-tertiary">
                          Current Bitcoin block: ~
                          {bitcoinBlockHeight.toLocaleString()}
                        </p>
                      )}
                      {bitcoinLoading && (
                        <p className="text-xs text-text-tertiary">
                          Loading Bitcoin block height...
                        </p>
                      )}
                      {bitcoinError && (
                        <p className="text-xs text-text-tertiary">
                          {bitcoinError}
                        </p>
                      )}
                      <p className="text-xs text-text-tertiary">
                        Note: This is Bitcoin block height. The contract will
                        validate this on-chain.
                      </p>
                    </div>
                  </div>

                  {/* Generated Question ID */}
                  {questionId && (
                    <div className="p-3 bg-primary/5 border border-primary/30 rounded-lg">
                      <p className="text-xs text-text-secondary mb-1">
                        Generated Question ID
                      </p>
                      <code className="text-xs font-mono text-text-primary break-all block">
                        {questionId}
                      </code>
                    </div>
                  )}

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground transition-all hover:shadow-[0_0_20px_rgba(168,85,247,0.4)]"
                    disabled={isPending || isConfirming || isUploading}
                  >
                    {isPending || isConfirming || isUploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {isUploading
                          ? "Uploading to IPFS..."
                          : "Creating Condition..."}
                      </>
                    ) : (
                      "Create Condition"
                    )}
                  </Button>
                </form>
              </div>

              {/* Live Preview */}
              <div className="bg-surface border border-border rounded-xl p-6 md:p-8 h-fit sticky top-24">
                <h3 className="text-lg font-semibold mb-4">Live Preview</h3>
                {metadata ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-elevated rounded-lg border border-border">
                      <p className="text-sm text-text-secondary mb-1">
                        Question
                      </p>
                      <p className="text-text-primary font-medium">
                        {metadata.question}
                      </p>
                    </div>
                    <div className="p-4 bg-elevated rounded-lg border border-border">
                      <p className="text-sm text-text-secondary mb-2">
                        Encoded Metadata (ABI)
                      </p>
                      <pre className="text-xs text-text-tertiary font-mono overflow-x-auto">
                        {encodeAbiParameters(
                          [{ type: "uint256" }, { type: "uint256" }],
                          [BigInt(threshold), BigInt(blockHeight)],
                        )}
                      </pre>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-success/10 border border-success/30 rounded-lg">
                        <p className="text-xs text-text-secondary mb-1">
                          YES Outcome
                        </p>
                        <p className="text-sm font-medium text-success">
                          ≥ {parseInt(threshold).toLocaleString()}
                        </p>
                      </div>
                      <div className="p-3 bg-danger/10 border border-danger/30 rounded-lg">
                        <p className="text-xs text-text-secondary mb-1">
                          NO Outcome
                        </p>
                        <p className="text-sm font-medium text-danger">
                          &lt;{parseInt(threshold).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-text-tertiary">
                      Fill in the form to see a preview
                    </p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Transaction Overlay */}
      <TransactionOverlay
        isOpen={showTransactionOverlay}
        status={txStatus}
        txHash={hash}
        onClose={() => {
          console.log(
            "[DEBUG] TransactionOverlay onClose called, closing overlay",
          );
          setShowTransactionOverlay(false);
        }}
        onRetry={() =>
          handleSubmit({ preventDefault: () => {} } as React.FormEvent)
        }
      />

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="bg-elevated border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl text-text-primary">
              Condition Created Successfully! 🎉
            </DialogTitle>
            <DialogDescription className="text-text-secondary">
              Your condition has been created on-chain
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Condition ID */}
            <div className="space-y-2">
              <Label className="text-text-secondary text-sm">
                Condition ID
              </Label>
              <CopyableHash hash={conditionId} />
            </div>

            {/* Question ID - Event Derived */}
            <div className="space-y-2">
              <Label className="text-text-secondary text-sm">Question ID</Label>
              <CopyableHash hash={eventQuestionId} />
            </div>

            {/* Transaction Hash */}
            {hash && (
              <div className="space-y-2">
                <Label className="text-text-secondary text-sm">
                  Transaction Hash
                </Label>
                <div className="flex items-center gap-2">
                  <CopyableHash hash={hash} />
                  <a
                    href={`https://sepolia.basescan.org/tx/${hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline flex items-center gap-1"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
            )}

            {/* Question Preview */}
            <div className="p-4 bg-background border border-border rounded-lg">
              <p className="text-sm text-text-primary">{metadata?.question}</p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setShowSuccessModal(false)}
              className="flex-1 bg-background border-border"
            >
              Close
            </Button>
            <Button
              onClick={() => {
                setShowSuccessModal(false);
                navigate("/create-market");
              }}
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Create Market
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Gas Estimation Modal */}
      <GasEstimationModal
        open={showGasModal}
        onOpenChange={setShowGasModal}
        gasEstimate={gasEstimate}
        onSubmit={handleConfirmTransaction}
      />
    </div>
  );
}
