import { useState, useEffect, useMemo } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Loader2, ExternalLink, AlertTriangle, Info } from "lucide-react";
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
import { StrikePreview } from "../components/StrikePreview";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { useWeb3 } from "../contexts/Web3Context";
import { useBitcoinBlockHeight } from "../../hooks/useBitcoinBlockHeight";
import { useBitcoinDifficulty } from "../../hooks/useBitcoinDifficulty";
import { useGasEstimate } from "../../hooks/useGasEstimate";
import { useInvalidateConditions } from "../../hooks/useConditions";
import { keccak256, toHex, encodeAbiParameters } from "viem";
import { CONTRACTS, DIAMOND_ABI } from "../../config/contracts";
import { parseConditionCreationEvent } from "../../utils/conditionEventParser";
import { uploadFileToFilebase } from "../../utils/filebase";
import { friendlyError } from "../../utils/friendlyError";
import NetworkMonitor from "../components/NetworkMonitor";
import { WalletConnect } from "../components/WalletConnect";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "../components/ui/tooltip";

enum QuestionType {
  DifficultyThreshold = 0,
}

// Converts a T-notation string (e.g. "145.15") to a raw uint256 BigInt.
// Uses string-based parsing to avoid IEEE 754 float precision loss.
function parseTToRaw(tStr: string): bigint | null {
  const trimmed = tStr.trim();
  if (!trimmed || !/^\d+(\.\d+)?$/.test(trimmed)) return null;
  const val = parseFloat(trimmed);
  if (isNaN(val) || val <= 0) return null;

  const [intPart, fracPart = ""] = trimmed.split(".");
  const SCALE_DIGITS = 12;
  const paddedFrac = fracPart.padEnd(SCALE_DIGITS, "0").slice(0, SCALE_DIGITS);
  return BigInt(intPart) * 1_000_000_000_000n + BigInt(paddedFrac);
}

export default function CreateCondition() {
  useEffect(() => { document.title = "Create Condition — Doefin"; }, []);
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();
  const { currentBlock } = useWeb3();
  const invalidateConditions = useInvalidateConditions();
  const { height: bitcoinBlockHeight, loading: bitcoinLoading, error: bitcoinError } =
    useBitcoinBlockHeight();
  const {
    difficulty: bitcoinDifficulty,
    formatted: bitcoinDifficultyFormatted,
    loading: difficultyLoading,
    error: difficultyError,
  } = useBitcoinDifficulty();

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
  } = useWaitForTransactionReceipt({ hash });

  const [thresholdT, setThresholdT] = useState("");
  const [blockHeight, setBlockHeight] = useState("");
  const [metadataURI, setMetadataURI] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showGasModal, setShowGasModal] = useState(false);
  const [showTransactionOverlay, setShowTransactionOverlay] = useState(false);
  const [conditionId, setConditionId] = useState<`0x${string}` | "">("");
  const [resolvedQuestionId, setResolvedQuestionId] = useState<`0x${string}` | "">(
    "",
  );
  // Track whether conditionId in the success modal is a fallback (event parse failed)
  const [conditionIdIsFallback, setConditionIdIsFallback] = useState(false);
  // Captured display values for the success modal (set before form reset)
  const [capturedQuestion, setCapturedQuestion] = useState("");

  const currentBlockNumber = currentBlock ? Number(currentBlock) : 0;
  const outcomeSlotCount = 2;
  const contractsConfigured =
    CONTRACTS.Diamond !== "0x0000000000000000000000000000000000000000";

  const thresholdRaw = useMemo(() => parseTToRaw(thresholdT), [thresholdT]);

  const questionId = useMemo((): `0x${string}` | "" => {
    if (!thresholdRaw) return "";
    const blockNum = parseInt(blockHeight, 10);
    if (isNaN(blockNum) || blockNum <= 0) return "";
    const encoded = encodeAbiParameters(
      [{ type: "uint256" }, { type: "uint256" }],
      [thresholdRaw, BigInt(blockNum)],
    );
    return keccak256(encoded);
  }, [thresholdRaw, blockHeight]);

  const canEstimateGas = Boolean(
    contractsConfigured &&
      isConnected &&
      address &&
      thresholdRaw &&
      blockHeight &&
      questionId,
  );

  const gasEstimate = useGasEstimate({
    enabled: canEstimateGas,
    diamond: CONTRACTS.Diamond,   // #6: was incorrectly passing wallet address
    questionType: QuestionType.DifficultyThreshold,
    threshold: thresholdRaw ?? 0n,
    blockHeight: blockHeight ? BigInt(parseInt(blockHeight, 10)) : 0n,
    outcomeSlotCount: BigInt(outcomeSlotCount),
    metadataURI,
    salt: questionId ? keccak256(toHex(questionId)) : undefined,
  });

  // Transaction success — parse event, show modal, invalidate cache
  useEffect(() => {
    if (isSuccess && receipt && hash && address && questionId) {
      let eventConditionId: string = questionId;
      let eventQuestionId: string = questionId;
      let isFallback = false;

      try {
        const eventData = parseConditionCreationEvent(receipt as any);
        eventConditionId = eventData.conditionId;
        eventQuestionId = eventData.questionId;
      } catch {
        // Event parse failed — fallback to questionId, warn in modal (#20)
        isFallback = true;
      }

      setConditionId(eventConditionId as `0x${string}`);
      setResolvedQuestionId(eventQuestionId as `0x${string}`);
      setConditionIdIsFallback(isFallback);
      // Capture the question text before the form resets (#37)
      const blockNum = parseInt(blockHeight, 10);
      setCapturedQuestion(
        `Will Bitcoin difficulty exceed ${parseFloat(thresholdT).toFixed(2)}T at block ${blockNum.toLocaleString()}?`
      );
      setShowSuccessModal(true);
      toast.success("Condition created successfully!");
      invalidateConditions();
    }
  }, [isSuccess, receipt, hash, address, questionId, invalidateConditions]);

  useEffect(() => {
    if (writeError) {
      toast.error(friendlyError(writeError));
    }
  }, [writeError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isConnected || !address) {
      toast.error("Please connect your wallet");
      return;
    }
    if (!contractsConfigured) {
      toast.error("Contracts not configured. Please check environment variables.");
      return;
    }
    if (!thresholdRaw) {
      toast.error("Enter a valid threshold in T (e.g. 145.15)");
      return;
    }

    const blockNum = parseInt(blockHeight, 10);
    if (isNaN(blockNum) || blockNum <= 0) {
      toast.error("Enter a valid target Bitcoin block height");
      return;
    }
    if (bitcoinBlockHeight > 0 && blockNum <= bitcoinBlockHeight) {
      toast.error(
        `Block height must be greater than the current Bitcoin block (${bitcoinBlockHeight.toLocaleString()})`,
      );
      return;
    }
    if (!questionId) {
      toast.error("Question ID generation failed");
      return;
    }

    setIsUploading(true);
    try {
      const thresholdTNum = parseFloat(thresholdT);
      const question = `Will Bitcoin difficulty exceed ${thresholdTNum.toFixed(2)}T at block ${blockNum.toLocaleString()}?`;
      const jsonMetadata = {
        "difficulty-threshold": thresholdRaw.toString(),
        "target-block-height": blockNum.toString(),
        question,
      };
      const blob = new Blob([JSON.stringify(jsonMetadata, null, 2)], {
        type: "application/json",
      });
      const jsonFile = new File([blob], `condition-${Date.now()}.json`, {
        type: "application/json",
      });
      const result = await uploadFileToFilebase(jsonFile);
      setMetadataURI(result.url);
      setShowGasModal(true);
    } catch (error) {
      toast.error(
        "Failed to upload metadata to IPFS: " + (error as Error).message,
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleConfirmTransaction = async () => {
    if (!address || !questionId || !thresholdRaw || !blockHeight) return;
    try {
      setShowGasModal(false);
      const metadata = encodeAbiParameters(
        [{ type: "uint256" }, { type: "uint256" }],
        [thresholdRaw, BigInt(parseInt(blockHeight, 10))],
      );
      const salt = keccak256(toHex(questionId));
      await writeContract({
        address: CONTRACTS.Diamond,
        abi: DIAMOND_ABI,
        functionName: "createConditionWithMetadata",
        args: [
          QuestionType.DifficultyThreshold,
          metadata,
          outcomeSlotCount,
          metadataURI || "",
          salt,
        ],
      });
    } catch (err) {
      toast.error(friendlyError(err));
    }
  };

  const txStatus = useMemo(() => {
    if (isPending) return "awaiting";
    if (isConfirming) return "confirming";
    if (isSuccess) return "confirmed";
    if (writeError) return "failed";
    return "idle";
  }, [isPending, isConfirming, isSuccess, writeError]);

  useEffect(() => {
    setShowTransactionOverlay(txStatus !== "idle");
  }, [txStatus]);

  // Reset form after successful submission so a second condition can be created
  useEffect(() => {
    if (isSuccess) {
      setThresholdT("");
      setBlockHeight("");
      setMetadataURI("");
    }
  }, [isSuccess]);

  const thresholdTNum = parseFloat(thresholdT) || 0;
  const blockHeightNum = parseInt(blockHeight, 10) || null;
  const currentDifficultyT =
    bitcoinDifficulty > 0 ? bitcoinDifficulty / 1e12 : 0;

  return (
    <div className="container mx-auto px-4 lg:px-8 py-12">
      <div className="max-w-5xl mx-auto">
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
            <p className="text-text-secondary text-lg mb-2">
              Connect your wallet to get started
            </p>
            <p className="text-text-tertiary text-sm mb-6">
              It's free — use a test wallet. No real money on Base Sepolia.
            </p>
            <div className="flex justify-center">
              <WalletConnect />
            </div>
          </div>
        ) : (
          <>
              {/* CC-01: Onboarding callout */}
            <div className="mb-6 p-4 bg-primary/5 border border-primary/20 rounded-xl">
              <h3 className="text-sm font-semibold text-text-primary mb-1">What is a Condition?</h3>
              <p className="text-xs text-text-secondary">
                A condition is a yes/no question about Bitcoin's mining difficulty. You set a
                threshold value and a target block number. When that block is mined, the answer
                is determined automatically by the blockchain. You and others can then bet YES or
                NO by splitting tokens based on this outcome.
              </p>
            </div>

          {!contractsConfigured && (
              <div className="mb-6 p-4 bg-danger/10 border border-danger/30 rounded-xl flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-danger flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-danger font-semibold mb-1">
                    Contracts Not Configured
                  </p>
                  <p className="text-sm text-text-secondary">
                    Set{" "}
                    <code className="text-xs bg-elevated px-1.5 py-0.5 rounded">
                      VITE_DIAMOND_ADDRESS
                    </code>{" "}
                    in your{" "}
                    <code className="text-xs bg-elevated px-1.5 py-0.5 rounded">
                      .env
                    </code>{" "}
                    file.
                  </p>
                </div>
              </div>
            )}
            <NetworkMonitor />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Form */}
              <div className="bg-surface border border-border rounded-xl p-6 md:p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Threshold */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label
                        htmlFor="threshold"
                        className="text-text-primary font-medium"
                      >
                        Difficulty Threshold *
                      </Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-text-tertiary cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p>
                            Difficulty measures how hard it is to mine Bitcoin blocks.
                            "T" = trillions of units. Set higher than current if you
                            predict mining will get harder.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <div className="relative">
                      <Input
                        id="threshold"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder={
                          currentDifficultyT > 0
                            ? (currentDifficultyT * 1.05).toFixed(2)
                            : "145.15"
                        }
                        value={thresholdT}
                        onChange={(e) => setThresholdT(e.target.value)}
                        className="bg-elevated border-border text-text-primary pr-10 focus:ring-primary focus:border-primary"
                        aria-describedby="threshold-helper"
                        required
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary text-sm font-medium">
                        T
                      </span>
                    </div>
                    <p id="threshold-helper" className="text-xs text-text-tertiary">
                      {difficultyLoading
                        ? "Loading Bitcoin difficulty..."
                        : difficultyError
                          ? difficultyError
                          : bitcoinDifficultyFormatted
                            ? `Current difficulty: ${bitcoinDifficultyFormatted} — set higher if you think mining gets harder`
                            : "Set higher than current difficulty if you predict mining will get harder"}
                    </p>
                    {thresholdRaw !== null && (
                      <details className="group">
                        <summary className="text-xs text-text-tertiary cursor-pointer hover:text-text-secondary list-none">
                          Technical details ›
                        </summary>
                        <p className="text-xs text-text-tertiary font-mono mt-1">
                          Raw on-chain value: {thresholdRaw.toLocaleString()}
                        </p>
                      </details>
                    )}
                  </div>

                  {/* Target Block Height */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="blockHeight"
                      className="text-text-primary font-medium"
                    >
                      Target Bitcoin Block Height *
                    </Label>
                    {/* Quick-set buttons */}
                    {bitcoinBlockHeight > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {[
                          { label: "Next epoch (~2 wks)", blocks: 2016 },
                          { label: "+1 Month", blocks: 4320 },
                          { label: "+3 Months", blocks: 12960 },
                        ].map(({ label, blocks }) => (
                          <button
                            key={blocks}
                            type="button"
                            onClick={() => setBlockHeight((bitcoinBlockHeight + blocks).toString())}
                            className="text-xs px-2 py-1 rounded border border-border bg-elevated hover:border-primary/50 hover:bg-primary/5 text-text-secondary hover:text-text-primary transition-colors"
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    )}
                    <Input
                      id="blockHeight"
                      type="number"
                      placeholder={
                        bitcoinBlockHeight > 0
                          ? (bitcoinBlockHeight + 2016).toString()
                          : "940000"
                      }
                      value={blockHeight}
                      onChange={(e) => setBlockHeight(e.target.value)}
                      className="bg-elevated border-border text-text-primary focus:ring-primary focus:border-primary"
                      aria-describedby="blockheight-helper"
                      required
                    />
                    <div id="blockheight-helper" className="space-y-1">
                      {!bitcoinLoading && bitcoinBlockHeight > 0 && (
                        <p className="text-xs text-text-tertiary">
                          Current: ~{bitcoinBlockHeight.toLocaleString()}
                          {blockHeight && !isNaN(parseInt(blockHeight)) && parseInt(blockHeight) > bitcoinBlockHeight && (() => {
                            const blocksAway = parseInt(blockHeight) - bitcoinBlockHeight;
                            const msAway = blocksAway * 10 * 60 * 1000;
                            const estDate = new Date(Date.now() + msAway);
                            return (
                              <span className="text-primary ml-2">
                                ≈ {estDate.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })} (estimated)
                              </span>
                            );
                          })()}
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
                    </div>
                  </div>

                  {/* CC-03: Question ID hidden in developer details */}
                  {questionId && (
                    <details className="group">
                      <summary className="text-xs text-text-tertiary cursor-pointer hover:text-text-secondary list-none">
                        Developer info ›
                      </summary>
                      <div className="mt-2 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                        <p className="text-xs text-text-secondary mb-1">Generated Question ID</p>
                        <code className="text-xs font-mono text-text-primary break-all block">
                          {questionId}
                        </code>
                      </div>
                    </details>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground transition-all hover:shadow-[0_0_20px_rgba(168,85,247,0.4)]"
                    disabled={isPending || isConfirming || isUploading}
                  >
                    {isPending || isConfirming || isUploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {isUploading
                          ? "Saving market data..."
                          : "Creating Condition..."}
                      </>
                    ) : (
                      "Create Condition"
                    )}
                  </Button>
                </form>
              </div>

              {/* Strike Preview */}
              <StrikePreview
                thresholdT={thresholdTNum > 0 ? thresholdTNum : null}
                blockHeight={blockHeightNum}
                currentDifficulty={bitcoinDifficulty}
                currentBtcBlock={bitcoinBlockHeight}
              />
            </div>
          </>
        )}
      </div>

      <TransactionOverlay
        isOpen={showTransactionOverlay}
        status={txStatus as any}
        txHash={hash}
        onClose={() => setShowTransactionOverlay(false)}
        onRetry={() => {
          // #36: if IPFS already uploaded, skip re-upload and go straight to gas modal
          if (metadataURI) {
            setShowGasModal(true);
          } else {
            handleSubmit({ preventDefault: () => {} } as React.FormEvent);
          }
        }}
      />

      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="bg-elevated border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl text-text-primary">
              Your Prediction is Live!
            </DialogTitle>
            <DialogDescription className="text-text-secondary">
              Created on Base Sepolia. Appears in Markets within ~30 seconds.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Human-readable summary */}
            <div className="p-4 bg-primary/5 border border-primary/30 rounded-lg">
              <p className="text-xs text-text-secondary mb-1">Your prediction</p>
              <p className="text-sm font-medium text-text-primary">{capturedQuestion}</p>
            </div>

            {/* What's next */}
            <div className="p-4 bg-success/5 border border-success/30 rounded-lg space-y-1">
              <p className="text-xs font-semibold text-success">What's next?</p>
              <p className="text-xs text-text-secondary">
                Click "Get YES/NO Tokens" to split test tokens into YES and NO positions and start trading.
              </p>
            </div>

            {/* Technical details — collapsed by default */}
            <details className="group">
              <summary className="text-xs text-text-tertiary cursor-pointer hover:text-text-secondary list-none">
                Technical details ›
              </summary>
              <div className="mt-2 space-y-2">
                <div className="space-y-1">
                  <Label className="text-text-secondary text-xs">Condition ID</Label>
                  {conditionIdIsFallback && (
                    <p className="text-xs text-yellow-400 bg-yellow-500/10 border border-yellow-500/30 rounded px-2 py-1">
                      Could not read conditionId from receipt — copy from the transaction logs on Basescan.
                    </p>
                  )}
                  <CopyableHash hash={conditionId} />
                </div>
                <div className="space-y-1">
                  <Label className="text-text-secondary text-xs">Question ID</Label>
                  <CopyableHash hash={resolvedQuestionId} />
                </div>
                {hash && (
                  <div className="space-y-1">
                    <Label className="text-text-secondary text-xs">Transaction</Label>
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
              </div>
            </details>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => { setShowSuccessModal(false); navigate("/markets"); }}
              className="flex-1 bg-background border-border"
            >
              View Markets
            </Button>
            <Button
              onClick={() => {
                setShowSuccessModal(false);
                navigate(`/create-market?conditionId=${conditionId}`);
              }}
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Get YES/NO Tokens
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <GasEstimationModal
        open={showGasModal}
        onOpenChange={setShowGasModal}
        gasEstimate={gasEstimate}
        onSubmit={handleConfirmTransaction}
      />
    </div>
  );
}
