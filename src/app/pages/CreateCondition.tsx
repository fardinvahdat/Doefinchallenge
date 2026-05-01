import { useState, useEffect, useMemo } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Loader2, ExternalLink, AlertTriangle, Check } from "lucide-react";
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
import { StrikePreview } from "../components/StrikePreview";
import { useAccount, useWaitForTransactionReceipt } from "wagmi";
import { useWeb3 } from "../contexts/Web3Context";
import { useBitcoinBlockHeight } from "../../hooks/useBitcoinBlockHeight";
import { useBitcoinDifficulty } from "../../hooks/useBitcoinDifficulty";
import { useInvalidateConditions } from "../../hooks/useConditions";
import { useSafeTx } from "../../hooks/useSafeTx";
import { keccak256, toHex, encodeAbiParameters, encodeFunctionData, type Hex } from "viem";
import { CONTRACTS, DIAMOND_ABI } from "../../config/contracts";
import { parseConditionCreationEvent } from "../../utils/conditionEventParser";
import { uploadFileToFilebase } from "../../utils/filebase";
import { friendlyError } from "../../utils/friendlyError";
import NetworkMonitor from "../components/NetworkMonitor";
import { WalletConnect } from "../components/WalletConnect";

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
  } = useBitcoinDifficulty();

  const safeTx = useSafeTx();
  const [txHash, setTxHash] = useState<Hex | undefined>(undefined);
  const {
    isLoading: isConfirming,
    isSuccess,
    data: receipt,
  } = useWaitForTransactionReceipt({ hash: txHash });

  const [thresholdT, setThresholdT] = useState("");
  const [blockHeight, setBlockHeight] = useState("");
  const [blockInputOpen, setBlockInputOpen] = useState(true);
  const [metadataURI, setMetadataURI] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showTransactionOverlay, setShowTransactionOverlay] = useState(false);
  const [conditionId, setConditionId] = useState<`0x${string}` | "">("");
  const [resolvedQuestionId, setResolvedQuestionId] = useState<`0x${string}` | "">(
    "",
  );
  const [conditionIdIsFallback, setConditionIdIsFallback] = useState(false);
  const [capturedQuestion, setCapturedQuestion] = useState("");

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

  // Transaction success — parse event, show modal, invalidate cache
  useEffect(() => {
    if (isSuccess && receipt && txHash && address && questionId) {
      let eventConditionId: string = questionId;
      let eventQuestionId: string = questionId;
      let isFallback = false;

      try {
        const eventData = parseConditionCreationEvent(receipt as any);
        eventConditionId = eventData.conditionId;
        eventQuestionId = eventData.questionId;
      } catch {
        isFallback = true;
      }

      setConditionId(eventConditionId as `0x${string}`);
      setResolvedQuestionId(eventQuestionId as `0x${string}`);
      setConditionIdIsFallback(isFallback);
      const blockNum = parseInt(blockHeight, 10);
      setCapturedQuestion(
        `Will Bitcoin difficulty exceed ${parseFloat(thresholdT).toFixed(2)}T at block ${blockNum.toLocaleString()}?`
      );
      setShowSuccessModal(true);
      toast.success("Condition created successfully!");
      invalidateConditions();
    }
  }, [isSuccess, receipt, txHash, address, questionId, invalidateConditions]);

  useEffect(() => {
    if (safeTx.error) {
      toast.error(friendlyError(safeTx.error));
    }
  }, [safeTx.error]);

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
      const ipfsUrl = result.url;
      setMetadataURI(ipfsUrl);
      setIsUploading(false);

      const metadata = encodeAbiParameters(
        [{ type: "uint256" }, { type: "uint256" }],
        [thresholdRaw, BigInt(blockNum)],
      );
      const salt = keccak256(toHex(questionId));
      const hash = await safeTx.mutateAsync({
        txs: [{
          to: CONTRACTS.Diamond,
          data: encodeFunctionData({
            abi: DIAMOND_ABI,
            functionName: "createConditionWithMetadata",
            args: [
              QuestionType.DifficultyThreshold,
              metadata,
              outcomeSlotCount,
              ipfsUrl,
              salt,
            ],
          }),
        }],
      });
      setTxHash(hash);
    } catch (err) {
      toast.error(friendlyError(err));
    } finally {
      setIsUploading(false);
    }
  };

  const txStatus = useMemo(() => {
    if (safeTx.isPending || isUploading) return "awaiting";
    if (isConfirming) return "confirming";
    if (isSuccess) return "confirmed";
    if (safeTx.error) return "failed";
    return "idle";
  }, [safeTx.isPending, isUploading, isConfirming, isSuccess, safeTx.error]);

  useEffect(() => {
    setShowTransactionOverlay(txStatus !== "idle");
  }, [txStatus]);

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
            Make a Bitcoin Prediction
          </h1>
          <p className="text-text-secondary text-lg">
            Set up a yes/no question — the blockchain verifies the answer automatically
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
            {!contractsConfigured && (
              <div className="mb-6 p-4 bg-danger/10 border border-danger/30 rounded-xl flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-danger flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-danger font-semibold mb-1">Contracts Not Configured</p>
                  <p className="text-sm text-text-secondary">
                    Set{" "}
                    <code className="text-xs bg-elevated px-1.5 py-0.5 rounded">VITE_DIAMOND_ADDRESS</code>
                    {" "}in your{" "}
                    <code className="text-xs bg-elevated px-1.5 py-0.5 rounded">.env</code> file.
                  </p>
                </div>
              </div>
            )}
            <NetworkMonitor />

            {/* Steps + Preview layout */}
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Left: 3-step flow */}
                <div className="space-y-4">

                  {/* ── Step 1 ── */}
                  {(() => {
                    const done = thresholdRaw !== null && thresholdTNum > 0;
                    return (
                      <div className="bg-surface border border-border rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-5">
                          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-bold text-sm transition-colors ${done ? "bg-success text-background" : "bg-primary text-primary-foreground"}`}>
                            {done ? <Check className="h-4 w-4" /> : "1"}
                          </div>
                          <div>
                            <h2 className="font-semibold text-text-primary leading-tight">Pick your difficulty number</h2>
                            <p className="text-xs text-text-secondary mt-0.5">How hard do you think Bitcoin mining will be?</p>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <p className="text-sm text-text-secondary">
                            {difficultyLoading
                              ? "Loading current difficulty…"
                              : bitcoinDifficultyFormatted
                                ? <>Bitcoin mining is currently <span className="text-text-primary font-medium">{bitcoinDifficultyFormatted}</span>. You're predicting it will be <span className="text-text-primary font-medium">above</span> this number:</>
                                : "Enter a difficulty number in T (trillions). You're predicting mining will be above this."}
                          </p>
                          <div className="relative">
                            <Input
                              id="threshold"
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder={currentDifficultyT > 0 ? (currentDifficultyT * 1.05).toFixed(2) : "145.15"}
                              value={thresholdT}
                              onChange={(e) => setThresholdT(e.target.value)}
                              className="bg-elevated border-border text-text-primary pr-10 focus:ring-primary focus:border-primary"
                              aria-describedby="threshold-helper"
                              required
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary text-sm font-medium pointer-events-none">T</span>
                          </div>
                          <p id="threshold-helper" className="text-xs text-text-tertiary">
                            "T" = trillions. Higher number = you think mining gets harder.
                          </p>
                          {thresholdRaw !== null && (
                            <details className="group">
                              <summary className="text-xs text-text-tertiary cursor-pointer hover:text-text-secondary list-none">Technical details ›</summary>
                              <p className="text-xs text-text-tertiary font-mono mt-1">Raw on-chain value: {thresholdRaw.toLocaleString()}</p>
                            </details>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* ── Step 2 ── */}
                  {(() => {
                    const step1Done = thresholdRaw !== null && thresholdTNum > 0;
                    const bh = parseInt(blockHeight, 10);
                    const step2Done = blockHeight !== "" && !isNaN(bh) && bh > (bitcoinBlockHeight || 0);
                    const presets = [
                      { label: "~2 weeks", blocks: 2016 },
                      { label: "~1 month", blocks: 4320 },
                      { label: "~3 months", blocks: 12960 },
                    ];
                    const estDate = step2Done
                      ? new Date(Date.now() + (bh - bitcoinBlockHeight) * 10 * 60 * 1000)
                      : null;

                    return (
                      <div
                        className={`bg-surface border border-border rounded-xl p-6 transition-opacity ${!step1Done ? "opacity-50 pointer-events-none" : ""}`}
                      >
                        <div className="flex items-center gap-3 mb-5">
                          <div
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-bold text-sm transition-colors ${step2Done ? "bg-success text-background" : step1Done ? "bg-primary text-primary-foreground" : "bg-elevated text-text-tertiary border border-border"}`}
                          >
                            {step2Done ? <Check className="h-4 w-4" /> : "2"}
                          </div>
                          <div>
                            <h2 className="font-semibold text-text-primary leading-tight">
                              Choose when to check
                            </h2>
                            <p className="text-xs text-text-secondary mt-0.5">
                              When should the blockchain look at the difficulty?
                            </p>
                          </div>
                        </div>

                        {!step1Done && (
                          <p className="text-sm text-text-tertiary italic">
                            Complete step 1 first.
                          </p>
                        )}

                        {step1Done && (
                          <div className="space-y-4">
                            <p className="text-sm text-text-secondary">
                              Pick how far in the future:
                            </p>

                            {bitcoinBlockHeight > 0 && (
                              <div className="grid grid-cols-3 gap-3">
                                {presets.map(({ label, blocks }) => {
                                  const isActive =
                                    blockHeight ===
                                    (bitcoinBlockHeight + blocks).toString();
                                  const presetDate = new Date(
                                    Date.now() + blocks * 10 * 60 * 1000,
                                  );
                                  return (
                                    <button
                                      key={blocks}
                                      type="button"
                                      onClick={() =>
                                        setBlockHeight(
                                          (
                                            bitcoinBlockHeight + blocks
                                          ).toString(),
                                        )
                                      }
                                      className={`flex flex-col items-center gap-1 px-3 py-3 rounded-lg border font-medium transition-all duration-150 ${
                                        isActive
                                          ? "bg-primary/15 text-primary"
                                          : "border-border bg-elevated text-text-secondary hover:bg-primary/5 hover:text-primary"
                                      }`}
                                      style={
                                        isActive
                                          ? {
                                              borderColor: "var(--primary)",
                                              boxShadow:
                                                "0 0 0 1px var(--primary)",
                                            }
                                          : undefined
                                      }
                                      aria-pressed={isActive}
                                    >
                                      <span className="text-sm font-semibold">
                                        {label}
                                      </span>
                                      <span className="text-xs opacity-70">
                                        {presetDate.toLocaleDateString(
                                          undefined,
                                          { month: "short", year: "numeric" },
                                        )}
                                      </span>
                                      <span className="text-[10px] font-mono opacity-50 tabular-nums">
                                        #
                                        {(
                                          bitcoinBlockHeight + blocks
                                        ).toLocaleString()}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            )}

                            <div>
                              <button
                                type="button"
                                onClick={() => setBlockInputOpen((v) => !v)}
                                className="text-base transition-colors delay-100 cursor-pointer hover:text-text-secondary flex items-center gap-1"
                              >
                                Enter a specific Bitcoin block number instead
                                <span className={`inline-block transition-transform duration-200 ${blockInputOpen ? "rotate-90" : ""}`}>›</span>
                              </button>
                              <div className={`grid transition-all duration-300 ease-in-out ${blockInputOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                                <div className="overflow-hidden">
                                  <div className="mt-2 space-y-2">
                                    <Input
                                      id="blockHeight"
                                      type="number"
                                      placeholder={
                                        bitcoinBlockHeight > 0
                                          ? (bitcoinBlockHeight + 2016).toString()
                                          : "940000"
                                      }
                                      value={blockHeight}
                                      onChange={(e) =>
                                        setBlockHeight(e.target.value)
                                      }
                                      className="bg-elevated text-text-primary focus:ring-primary focus:border-primary border-border"
                                      style={
                                        bitcoinBlockHeight > 0 &&
                                        [2016, 4320, 12960].some(
                                          (b) =>
                                            blockHeight ===
                                            (bitcoinBlockHeight + b).toString(),
                                        )
                                          ? { borderColor: "var(--primary)" }
                                          : undefined
                                      }
                                      aria-describedby="blockheight-helper"
                                    />
                                    {!bitcoinLoading && bitcoinBlockHeight > 0 && (
                                      <p
                                        id="blockheight-helper"
                                        className="text-xs text-text-tertiary"
                                      >
                                        Current Bitcoin block: ~
                                        {bitcoinBlockHeight.toLocaleString()}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {estDate && (
                              <div className="flex items-center gap-2 p-3 bg-success/8 border border-success/20 rounded-lg">
                                <Check className="h-4 w-4 text-success shrink-0" />
                                <p className="text-sm text-text-primary">
                                  The blockchain will check on approximately{" "}
                                  <span className="font-semibold text-success">
                                    {estDate.toLocaleDateString(undefined, {
                                      weekday: "long",
                                      month: "long",
                                      day: "numeric",
                                      year: "numeric",
                                    })}
                                  </span>
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* ── Step 3: Summary + Submit ── */}
                  {(() => {
                    const step1Done = thresholdRaw !== null && thresholdTNum > 0;
                    const bh = parseInt(blockHeight, 10);
                    const step2Done = blockHeight !== "" && !isNaN(bh) && bh > (bitcoinBlockHeight || 0);
                    const bothDone = step1Done && step2Done;
                    const estDate = step2Done
                      ? new Date(Date.now() + (bh - bitcoinBlockHeight) * 10 * 60 * 1000)
                      : null;

                    return (
                      <div className={`bg-surface border rounded-xl p-6 transition-all ${bothDone ? "border-primary/40" : "border-border opacity-50 pointer-events-none"}`}>
                        <div className="flex items-center gap-3 mb-5">
                          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-bold text-sm ${bothDone ? "bg-primary text-primary-foreground" : "bg-elevated text-text-tertiary border border-border"}`}>
                            3
                          </div>
                          <div>
                            <h2 className="font-semibold text-text-primary leading-tight">Review &amp; create</h2>
                            <p className="text-xs text-text-secondary mt-0.5">Double-check your prediction before submitting</p>
                          </div>
                        </div>

                        {!bothDone && (
                          <p className="text-sm text-text-tertiary italic">Complete steps 1 and 2 first.</p>
                        )}

                        {bothDone && (
                          <div className="space-y-4">
                            <div className="p-4 bg-primary/5 border border-primary/25 rounded-lg">
                              <p className="text-xs text-text-tertiary mb-1 uppercase tracking-wide font-medium">Your prediction</p>
                              <p className="text-base text-text-primary font-medium leading-snug">
                                "Will Bitcoin mining difficulty be above{" "}
                                <span className="text-primary">{parseFloat(thresholdT).toFixed(2)}T</span>{" "}
                                when block{" "}
                                <span className="text-primary">{bh.toLocaleString()}</span>{" "}
                                is mined?"
                              </p>
                              {estDate && (
                                <p className="text-xs text-text-secondary mt-2">
                                  Expected check date: {estDate.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}
                                </p>
                              )}
                            </div>

                            {questionId && (
                              <details className="group">
                                <summary className="text-xs text-text-tertiary cursor-pointer hover:text-text-secondary list-none">Developer info ›</summary>
                                <div className="mt-2 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                                  <p className="text-xs text-text-secondary mb-1">Generated Question ID</p>
                                  <code className="text-xs font-mono text-text-primary break-all block">{questionId}</code>
                                </div>
                              </details>
                            )}

                            <Button
                              type="submit"
                              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                              disabled={safeTx.isPending || isConfirming || isUploading}
                            >
                              {safeTx.isPending || isConfirming || isUploading ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  {isUploading ? "Saving market data…" : "Creating prediction…"}
                                </>
                              ) : (
                                "Create This Prediction →"
                              )}
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* Right: Live preview */}
                <StrikePreview
                  thresholdT={thresholdTNum > 0 ? thresholdTNum : null}
                  blockHeight={blockHeightNum}
                  currentDifficulty={bitcoinDifficulty}
                  currentBtcBlock={bitcoinBlockHeight}
                />
              </div>
            </form>
          </>
        )}
      </div>

      <TransactionOverlay
        isOpen={showTransactionOverlay}
        status={txStatus as any}
        txHash={txHash}
        onClose={() => setShowTransactionOverlay(false)}
        onRetry={() => {
          if (metadataURI) {
            safeTx.mutateAsync({
              txs: [{
                to: CONTRACTS.Diamond,
                data: encodeFunctionData({
                  abi: DIAMOND_ABI,
                  functionName: "createConditionWithMetadata",
                  args: [
                    QuestionType.DifficultyThreshold,
                    encodeAbiParameters(
                      [{ type: "uint256" }, { type: "uint256" }],
                      [thresholdRaw!, BigInt(parseInt(blockHeight, 10))],
                    ),
                    outcomeSlotCount,
                    metadataURI,
                    keccak256(toHex(questionId)),
                  ],
                }),
              }],
            }).then(setTxHash).catch((err) => toast.error(friendlyError(err)));
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
            <div className="p-4 bg-primary/5 border border-primary/30 rounded-lg">
              <p className="text-xs text-text-secondary mb-1">Your prediction</p>
              <p className="text-sm font-medium text-text-primary">{capturedQuestion}</p>
            </div>

            <div className="p-4 bg-success/5 border border-success/30 rounded-lg space-y-1">
              <p className="text-xs font-semibold text-success">What's next?</p>
              <p className="text-xs text-text-secondary">
                Click "Get YES/NO Tokens" to split test tokens into YES and NO positions and start trading.
              </p>
            </div>

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
                {txHash && (
                  <div className="space-y-1">
                    <Label className="text-text-secondary text-xs">Transaction</Label>
                    <div className="flex items-center gap-2">
                      <CopyableHash hash={txHash} />
                      <a
                        href={`https://sepolia.basescan.org/tx/${txHash}`}
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
    </div>
  );
}
