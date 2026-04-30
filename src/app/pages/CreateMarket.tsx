import { useState, useEffect, useMemo } from "react";
import { Button } from "../components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Loader2, Check, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../components/ui/dialog";
import { useNavigate, useSearchParams } from "react-router";
import { TransactionOverlay } from "../components/TransactionOverlay";
import { GasEstimationModal } from "../components/GasEstimationModal";
import { StrikePreview } from "../components/StrikePreview";
import { CopyableHash } from "../components/CopyableHash";
import { WalletConnect } from "../components/WalletConnect";
import {
  useAccount,
  useChainId,
  useReadContract,
  usePublicClient,
} from "wagmi";
import {
  useSplitPosition,
  parseSplitPositionReceipt,
} from "../../hooks/useSplitPosition";
import { useTokenApproval } from "../../hooks/useTokenApproval";
import { useGasEstimate } from "../../hooks/useGasEstimate";
import { useTokens, type ApiToken } from "../../hooks/useTokens";
import { useConditions, parseQuestionString, type ApiCondition } from "../../hooks/useConditions";
import { useBitcoinDifficulty } from "../../hooks/useBitcoinDifficulty";
import { useBitcoinBlockHeight } from "../../hooks/useBitcoinBlockHeight";
import { CONTRACTS, ERC20_ABI } from "../../config/contracts";
import { Address, parseUnits, formatUnits } from "viem";
import NetworkMonitor from "../components/NetworkMonitor";
import { friendlyError } from "../../utils/friendlyError";

// TokenCard is a separate component so useReadContract doesn't violate rules of hooks
function TokenCard({
  token,
  selected,
  walletAddress,
  onSelect,
}: {
  token: ApiToken;
  selected: boolean;
  walletAddress: Address | undefined;
  onSelect: (token: ApiToken) => void;
}) {
  const { data: balanceRaw } = useReadContract({
    address: token.address,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: walletAddress ? [walletAddress] : undefined,
    query: { enabled: !!walletAddress },
  });

  const displayBalance =
    balanceRaw !== undefined
      ? parseFloat(formatUnits(balanceRaw as bigint, token.decimals)).toFixed(4)
      : null;

  return (
    <button
      onClick={() => onSelect(token)}
      className={`p-4 md:p-6 rounded-xl border-2 text-left transition-all ${
        selected
          ? "border-accent bg-accent/5 shadow-[0_0_20px_rgba(34,211,238,0.2)]"
          : "border-border bg-elevated hover:border-accent/50"
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-lg font-bold text-text-primary">{token.symbol}</h3>
          <p className="text-sm text-text-secondary">{token.name}</p>
          <p className="text-xs text-text-tertiary mt-0.5">Test token — no real value</p>
        </div>
        {selected && (
          <div className="h-5 w-5 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
            <Check className="h-3 w-3 text-accent-foreground" />
          </div>
        )}
      </div>
      {displayBalance !== null && (
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-2xl font-bold text-text-primary">
            {displayBalance}
          </span>
          <span className="text-text-tertiary text-sm">{token.symbol}</span>
        </div>
      )}
      <div onClick={(e) => e.stopPropagation()}>
        <CopyableHash hash={token.address} className="text-xs" />
      </div>
    </button>
  );
}

// Derive selected condition info for display / StrikePreview
function useSelectedConditionInfo(condition: ApiCondition | null) {
  return useMemo(() => {
    if (!condition) return null;
    const parsed = parseQuestionString(condition.question_string);
    return {
      question: condition.question_string,
      thresholdT: parsed?.thresholdT ?? null,
      blockHeight: parsed?.blockHeight ?? null,
    };
  }, [condition]);
}

export default function CreateMarket() {
  useEffect(() => { document.title = "Get YES/NO Tokens — Doefin"; }, []);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { address, isConnected } = useAccount();
  const currentChain = useChainId();

  const { tokens, isLoading: tokensLoading } = useTokens();
  const { conditions, isLoading: conditionsLoading } = useConditions("active");
  const { difficulty: bitcoinDifficulty } = useBitcoinDifficulty();
  const { height: bitcoinBlockHeight } = useBitcoinBlockHeight();

  const [selectedCondition, setSelectedCondition] = useState<ApiCondition | null>(null);

  // Pre-select condition from URL param (e.g. from "Participate" button on Markets page)
  useEffect(() => {
    const conditionId = searchParams.get("conditionId");
    if (conditionId && conditions.length > 0 && !selectedCondition) {
      const match = conditions.find((c) => c.condition_id === conditionId);
      if (match) setSelectedCondition(match);
    }
  }, [searchParams, conditions, selectedCondition]);
  const [selectedToken, setSelectedToken] = useState<ApiToken | null>(null);
  const [amount, setAmount] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showGasModal, setShowGasModal] = useState(false);
  const [showTransactionOverlay, setShowTransactionOverlay] = useState(false);
  const [splitResult, setSplitResult] = useState<{
    conditionId: string;
    yesPositionId: string;
    noPositionId: string;
  } | null>(null);

  const conditionInfo = useSelectedConditionInfo(selectedCondition);

  // Collateral balance for selected token
  const { data: collateralBalanceRaw, refetch: refetchBalance } =
    useReadContract({
      address: selectedToken?.address,
      abi: ERC20_ABI,
      functionName: "balanceOf",
      args: address ? [address] : undefined,
      query: { enabled: !!address && !!selectedToken },
    });

  const tokenDecimals = selectedToken?.decimals ?? 18;
  const collateralBalance =
    collateralBalanceRaw !== undefined
      ? { value: collateralBalanceRaw as bigint, decimals: tokenDecimals }
      : null;

  // Required approval amount in token units — used to check if existing allowance covers the split
  const requiredApprovalAmount = useMemo(() => {
    if (!selectedToken || !amount) return undefined;
    try {
      return parseUnits(amount, selectedToken.decimals);
    } catch {
      return undefined;
    }
  }, [selectedToken, amount]);

  // Token approval — spender is always the Diamond; no fallback when no token selected
  const {
    isApproved,
    approve,
    isPending: isApproving,
    isConfirming: isApprovingConfirming,
    isSuccess: isApproveSuccess,
    refetch: refetchAllowance,
    error: approveError,
  } = useTokenApproval(
    selectedToken?.address,   // undefined when nothing selected — hook stays disabled
    CONTRACTS.Diamond,
    address,
    requiredApprovalAmount,
  );

  const publicClient = usePublicClient();

  const {
    splitPosition,
    hash: splitHash,
    isPending: isSplitting,
    isConfirming: isSplitConfirming,
    isSuccess: isSplitSuccess,
    error: splitError,
    receipt,
  } = useSplitPosition();

  // Gas estimation — amount in token-native units (consistent with split call)
  const canEstimateGas = Boolean(
    isConnected &&
      address &&
      selectedToken?.address &&
      selectedCondition?.condition_id &&
      amount,
  );
  const amountInContractUnits =
    canEstimateGas && amount
      ? (() => { try { return parseUnits(amount, tokenDecimals); } catch { return undefined; } })()
      : undefined;

  const gasEstimate = useGasEstimate({
    enabled: canEstimateGas,
    splitPosition: {
      collateralToken: selectedToken?.address,
      conditionId: selectedCondition?.condition_id as Address | undefined,
      amount: amountInContractUnits,
    },
  });

  useEffect(() => {
    if (isApproveSuccess) {
      toast.success("Approval successful!");
      refetchAllowance();
    }
  }, [isApproveSuccess, refetchAllowance]);

  useEffect(() => {
    if (approveError) {
      toast.error(friendlyError(approveError));
    }
  }, [approveError]);

  useEffect(() => {
    if (isSplitSuccess && receipt && selectedCondition && selectedToken) {
      // Validate condition_id format before using it as bytes32
      const condId = selectedCondition.condition_id;
      if (!condId.startsWith("0x") || condId.length !== 66) {
        toast.error("Invalid condition ID format");
        return;
      }

      parseSplitPositionReceipt(
        receipt,
        CONTRACTS.Diamond,
        selectedToken.address,
        condId as `0x${string}`,
        publicClient as unknown as {
          readContract: (params: {
            address: Address;
            abi: readonly any[];
            functionName: string;
            args: any[];
          }) => Promise<any>;
        },
      )
        .then((result) => {
          setSplitResult({
            conditionId: result.conditionId,
            yesPositionId: result.yesPositionId.toString(),
            noPositionId: result.noPositionId.toString(),
          });
          toast.success("Position split successfully!");
          setShowSuccessModal(true);
          refetchBalance();
        })
        .catch(() => {
          setSplitResult({
            conditionId: selectedCondition.condition_id,
            yesPositionId: "",
            noPositionId: "",
          });
          toast.success("Position split successfully!");
          setShowSuccessModal(true);
          refetchBalance();
        });
    }
  }, [
    isSplitSuccess,
    receipt,
    selectedCondition,
    selectedToken,
    publicClient,
    refetchBalance,
  ]);

  useEffect(() => {
    if (splitError) {
      toast.error(friendlyError(splitError));
    }
  }, [splitError]);

  const handleApprove = async () => {
    if (!selectedToken) return;
    try {
      await approve();
    } catch (err) {
      toast.error(friendlyError(err));
    }
  };

  const handleSplitPosition = async () => {
    if (!selectedCondition || !selectedToken || !amount || !collateralBalance) {
      toast.error("Please complete all fields");
      return;
    }
    if (!isApproved) {
      toast.error("Please approve collateral first");
      return;
    }

    // Use token-native decimals consistently
    let amountParsed: bigint;
    try {
      amountParsed = parseUnits(amount, selectedToken.decimals);
    } catch {
      toast.error("Invalid amount");
      return;
    }

    if (amountParsed <= 0n) {
      toast.error("Amount must be greater than 0");
      return;
    }
    if (collateralBalance.value < amountParsed) {
      toast.error("Insufficient collateral balance");
      return;
    }
    setShowGasModal(true);
  };

  const handleConfirmSplitPosition = async () => {
    if (!selectedCondition || !selectedToken || !amount || !collateralBalance)
      return;
    try {
      setShowGasModal(false);
      await splitPosition({
        collateralToken: selectedToken.address,
        conditionId: selectedCondition.condition_id as `0x${string}`,
        amount: parseUnits(amount, selectedToken.decimals),
      });
    } catch (err) {
      toast.error(
        `Transaction failed: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    }
  };

  const setMaxAmount = () => {
    if (collateralBalance) {
      setAmount(formatUnits(collateralBalance.value, collateralBalance.decimals));
    }
  };

  // Matches CreateCondition pattern: default "idle", overlay shown when not idle
  const txStatus = useMemo(() => {
    if (isApproving || isApprovingConfirming) return "awaiting";
    if (isSplitting || isSplitConfirming) return "confirming";
    if (isSplitSuccess) return "confirmed";
    if (splitError) return "failed";
    return "idle";
  }, [isApproving, isApprovingConfirming, isSplitting, isSplitConfirming, isSplitSuccess, splitError]);

  useEffect(() => {
    setShowTransactionOverlay(txStatus !== "idle");
  }, [txStatus]);

  return (
    <div className="container mx-auto px-4 lg:px-8 py-12">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Get YES/NO Tokens</h1>
          <p className="text-text-secondary text-lg">
            Put in test tokens and receive YES + NO prediction tokens back
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
          <div className="space-y-8">
            <NetworkMonitor />

            {/* CM-04: Two-transaction flow warning */}
            <div className="p-4 bg-accent/5 border border-accent/30 rounded-xl text-sm text-text-secondary">
              <span className="font-semibold text-accent">Heads up:</span> You will be asked to
              sign 2 wallet transactions — first to approve token spending, then to get your YES/NO tokens.
            </div>

            {/* Step 1: Select Condition */}
            <div className="bg-surface border border-border rounded-xl p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                  1
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Pick a Prediction</h2>
                  <p className="text-sm text-text-secondary">Choose which yes/no question you want to trade</p>
                </div>
              </div>

              {conditionsLoading ? (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                  <p className="text-text-tertiary mt-2">Loading conditions...</p>
                </div>
              ) : conditions.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-text-tertiary">
                    No active conditions found.{" "}
                    <button
                      onClick={() => navigate("/create-condition")}
                      className="text-primary hover:underline"
                    >
                      Create one first.
                    </button>
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <Select
                    onValueChange={(value) => {
                      const c = conditions.find((x) => x.condition_id === value) ?? null;
                      setSelectedCondition(c);
                    }}
                    value={selectedCondition?.condition_id}
                  >
                    <SelectTrigger className="bg-elevated border-border text-text-primary">
                      <SelectValue placeholder="Select an active condition" />
                    </SelectTrigger>
                    <SelectContent>
                      {conditions.map((c) => (
                        <SelectItem key={c.condition_id} value={c.condition_id}>
                          <span className="font-medium line-clamp-2">
                            {c.question_string || "Unknown prediction"}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Selected condition with StrikePreview */}
                  {selectedCondition && conditionInfo && (
                    <StrikePreview
                      thresholdT={conditionInfo.thresholdT}
                      blockHeight={conditionInfo.blockHeight}
                      currentDifficulty={bitcoinDifficulty}
                      currentBtcBlock={bitcoinBlockHeight}
                    />
                  )}
                </div>
              )}
            </div>

            {/* Step 2: Choose Currency */}
            <div className="bg-surface border border-border rounded-xl p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-accent-foreground font-bold">
                  2
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Choose Your Currency</h2>
                  <p className="text-sm text-text-secondary">Pick which test token to put in. You get the same amount back as YES + NO tokens.</p>
                </div>
              </div>

              {tokensLoading ? (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                  <p className="text-text-tertiary mt-2">Loading tokens...</p>
                </div>
              ) : tokens.length === 0 ? (
                <p className="text-text-tertiary text-center py-4">
                  No collateral tokens available.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tokens.map((token) => (
                    <TokenCard
                      key={token.address}
                      token={token}
                      selected={selectedToken?.address === token.address}
                      walletAddress={address}
                      onSelect={setSelectedToken}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Step 3: Enter Amount */}
            <div className="bg-surface border border-border rounded-xl p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success text-background font-bold">
                  3
                </div>
                <div>
                  <h2 className="text-xl font-semibold">How Much to Put In?</h2>
                  <p className="text-sm text-text-secondary">You'll get the same amount back as YES and NO tokens</p>
                </div>
              </div>

              <div className="max-w-xl space-y-6">
                {/* Amount Input */}
                <div className="space-y-2">
                  <Label htmlFor="amount" className="text-text-primary">
                    Amount
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="amount"
                      type="number"
                      placeholder="0.0"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className={`bg-elevated border-border text-text-primary focus:ring-primary focus:border-primary ${
                        amount && collateralBalance &&
                        parseFloat(amount) > parseFloat(formatUnits(collateralBalance.value, collateralBalance.decimals))
                          ? "border-danger focus:border-danger"
                          : ""
                      }`}
                      disabled={!selectedToken}
                    />
                    <Button
                      onClick={setMaxAmount}
                      variant="outline"
                      disabled={!selectedToken || !collateralBalance}
                      className="bg-elevated border-border hover:bg-elevated/80 px-6"
                    >
                      Max
                    </Button>
                  </div>
                  {collateralBalance && (
                    <p className="text-xs text-text-tertiary">
                      Available:{" "}
                      {parseFloat(
                        formatUnits(collateralBalance.value, collateralBalance.decimals),
                      ).toFixed(4)}{" "}
                      {selectedToken?.symbol}
                    </p>
                  )}
                  {collateralBalance && collateralBalance.value === 0n && (
                    <p className="text-xs text-yellow-400">
                      Your balance is zero.{" "}
                      <a
                        href="https://www.alchemy.com/faucets/base-sepolia"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:text-yellow-300"
                      >
                        Get free test ETH →
                      </a>{" "}
                      then swap for {selectedToken?.symbol} on the testnet.
                    </p>
                  )}
                  {/* CM-05: Inline balance error */}
                  {amount && collateralBalance && parseFloat(amount) > parseFloat(formatUnits(collateralBalance.value, collateralBalance.decimals)) && (
                    <p className="text-xs text-danger" role="alert">
                      Amount exceeds your available balance
                    </p>
                  )}
                </div>

                {/* Approval */}
                {selectedToken && (
                  <div className="p-4 bg-accent/5 border border-accent/30 rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-text-primary">
                          Approve {selectedToken.symbol}
                        </p>
                        <p className="text-xs text-text-secondary mt-1">
                          Step 1 of 2 — Allow the smart contract to use your{" "}
                          {selectedToken.symbol}
                        </p>
                      </div>
                      {isApproved && (
                        <div className="flex items-center gap-1 text-success">
                          <Check className="h-4 w-4" />
                          <span className="text-sm font-medium">Approved</span>
                        </div>
                      )}
                    </div>
                    {!isApproved && (
                      <Button
                        onClick={handleApprove}
                        disabled={isApproving || isApprovingConfirming}
                        className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
                      >
                        {isApproving || isApprovingConfirming ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Approving...
                          </>
                        ) : (
                          `Approve ${selectedToken.symbol}`
                        )}
                      </Button>
                    )}
                  </div>
                )}

                {/* Split Button */}
                <Button
                  onClick={handleSplitPosition}
                  disabled={
                    !selectedCondition ||
                    !selectedToken ||
                    !amount ||
                    !isApproved ||
                    isSplitting ||
                    isSplitConfirming ||
                    (!!amount && !!collateralBalance && parseFloat(amount) > parseFloat(formatUnits(collateralBalance.value, collateralBalance.decimals)))
                  }
                  className="w-full bg-success hover:bg-success/90 text-background transition-all hover:shadow-[0_0_20px_rgba(34,197,94,0.4)]"
                >
                  {isSplitting || isSplitConfirming ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Getting tokens...
                    </>
                  ) : (
                    "Get My YES/NO Tokens"
                  )}
                </Button>

                {/* Summary */}
                {selectedCondition && selectedToken && amount && (
                  <div className="p-4 bg-elevated border border-border rounded-lg space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-text-secondary">You put in:</span>
                      <span className="text-text-primary font-medium">
                        {amount} {selectedToken.symbol}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">You get back:</span>
                      <span className="text-text-primary font-medium">
                        {amount} YES + {amount} NO tokens
                      </span>
                    </div>
                    {/* CM-06: YES/NO explanation */}
                    <details className="group pt-1 border-t border-border">
                      <summary className="text-xs text-text-tertiary cursor-pointer hover:text-text-secondary list-none">
                        What are YES/NO tokens? ›
                      </summary>
                      <div className="mt-2 space-y-1">
                        <p className="text-xs text-text-secondary">
                          <span className="text-green-400 font-medium">YES tokens</span> pay out 1:1 if Bitcoin difficulty exceeds the threshold at the target block.
                        </p>
                        <p className="text-xs text-text-secondary">
                          <span className="text-red-400 font-medium">NO tokens</span> pay out 1:1 if difficulty stays below the threshold.
                        </p>
                        <p className="text-xs text-text-tertiary">You can sell either token to someone with the opposite view.</p>
                      </div>
                    </details>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <TransactionOverlay
        isOpen={showTransactionOverlay}
        status={txStatus as any}
        txHash={splitHash}
        onClose={() => setShowTransactionOverlay(false)}
        onRetry={() => handleSplitPosition()}
      />

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="bg-elevated border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl text-text-primary">
              Position Split Successfully!
            </DialogTitle>
            <DialogDescription className="text-text-secondary">
              Your collateral has been split into YES/NO position tokens
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {splitHash && (
              <div className="p-4 bg-background border border-border rounded-lg">
                <p className="text-xs text-text-secondary mb-2">
                  Transaction Hash
                </p>
                <code className="text-xs font-mono text-text-primary break-all block mb-2">
                  {splitHash}
                </code>
                <a
                  href={`https://sepolia.basescan.org/tx/${splitHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  View on Basescan
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
            {splitResult?.yesPositionId && (
              <div className="space-y-2 text-xs font-mono text-text-tertiary">
                <div>YES: {splitResult.yesPositionId.slice(0, 30)}...</div>
                <div>NO: {splitResult.noPositionId.slice(0, 30)}...</div>
              </div>
            )}
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
                navigate("/markets");
              }}
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              View Markets
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <GasEstimationModal
        open={showGasModal}
        onOpenChange={setShowGasModal}
        gasEstimate={gasEstimate}
        onSubmit={handleConfirmSplitPosition}
        transactionDetails={{
          title: "Split Position",
          description:
            "Split your collateral into YES/NO position tokens on the Diamond contract",
          items: [
            { label: "Contract", value: "Diamond" },
            { label: "Function", value: "splitPosition()" },
            {
              label: "Condition",
              value: selectedCondition
                ? `${selectedCondition.condition_id.slice(0, 10)}...`
                : "-",
            },
            { label: "Collateral", value: selectedToken?.symbol || "-" },
            { label: "Amount", value: amount || "-" },
          ],
        }}
      />
    </div>
  );
}
