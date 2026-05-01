import { useState, useEffect, useMemo, useRef } from "react";
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
import { Loader2, Check, ExternalLink, Info } from "lucide-react";
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
import { StrikePreview } from "../components/StrikePreview";
import { CopyableHash } from "../components/CopyableHash";
import { WalletConnect } from "../components/WalletConnect";
import {
  useAccount,
  usePublicClient,
} from "wagmi";
import {
  useSplitPosition,
  parseSplitPositionReceipt,
} from "../../hooks/useSplitPosition";
import { useScw } from "../../hooks/useScw";
import { useScwBalances } from "../../hooks/useScwBalances";
import { useTokens, type ApiToken } from "../../hooks/useTokens";
import {
  useConditions,
  useInvalidateConditions,
  parseQuestionString,
  type ApiCondition,
} from "../../hooks/useConditions";
import { useBitcoinDifficulty } from "../../hooks/useBitcoinDifficulty";
import { useBitcoinBlockHeight } from "../../hooks/useBitcoinBlockHeight";
import { CONTRACTS } from "../../config/contracts";
import { Address, parseUnits, formatUnits } from "viem";
import NetworkMonitor from "../components/NetworkMonitor";
import { friendlyError } from "../../utils/friendlyError";

// TokenCard shows the SCW's available balance from the backend (total − locked).
function TokenCard({
  token,
  selected,
  balances,
  onSelect,
}: {
  token: ApiToken;
  selected: boolean;
  balances: ReturnType<typeof useScwBalances>;
  onSelect: (token: ApiToken) => void;
}) {
  const available = balances.data?.getAvailable(token.address);
  const displayBalance =
    available !== undefined
      ? parseFloat(formatUnits(available, token.decimals)).toFixed(4)
      : null;

  return (
    <button
      onClick={() => onSelect(token)}
      aria-pressed={selected}
      className={`p-4 md:p-6 rounded-xl border-2 text-left transition-all ${
        selected
          ? "bg-accent/5"
          : "border-border bg-elevated hover:border-accent/50"
      }`}
      style={
        selected
          ? {
              borderColor: "var(--accent)",
              boxShadow:
                "0 0 20px rgba(245,158,11,0.18), 0 0 0 1px var(--accent)",
            }
          : undefined
      }
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-lg font-bold text-text-primary">
            {token.symbol}
          </h3>
          <p className="text-sm text-text-secondary">{token.name}</p>
          <p className="text-xs text-text-tertiary mt-0.5">
            Test token — no real value
          </p>
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
  useEffect(() => {
    document.title = "Get YES/NO Tokens — Doefin";
  }, []);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { address, isConnected } = useAccount();
  const { data: scwInfo } = useScw();
  const scwAddress = scwInfo?.scw as Address | undefined;

  const { tokens, isLoading: tokensLoading } = useTokens();
  const { conditions, isLoading: conditionsLoading } = useConditions("active");
  const invalidateConditions = useInvalidateConditions();
  const { difficulty: bitcoinDifficulty } = useBitcoinDifficulty();
  const { height: bitcoinBlockHeight } = useBitcoinBlockHeight();
  const publicClient = usePublicClient();

  const [selectedCondition, setSelectedCondition] =
    useState<ApiCondition | null>(null);

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
  const handledReceiptRef = useRef<string | undefined>(undefined);
  const [showTransactionOverlay, setShowTransactionOverlay] = useState(false);
  const [splitResult, setSplitResult] = useState<{
    conditionId: string;
    yesPositionId: string;
    noPositionId: string;
  } | null>(null);

  const conditionInfo = useSelectedConditionInfo(selectedCondition);

  // Collateral balance — GET /v3/balances/{scw}?refresh=true → available (= total − locked)
  const scwBalances = useScwBalances();
  const tokenDecimals = selectedToken?.decimals ?? 18;
  const availableRaw = selectedToken
    ? scwBalances.data?.getAvailable(selectedToken.address)
    : undefined;
  const collateralBalance =
    availableRaw !== undefined
      ? { value: availableRaw, decimals: tokenDecimals }
      : null;
  const refetchBalance = scwBalances.forceRefresh;

  const {
    splitPosition,
    hash: splitHash,
    isPending: isSplitting,
    isConfirming: isSplitConfirming,
    isSuccess: isSplitSuccess,
    error: splitError,
    receipt,
  } = useSplitPosition();

  useEffect(() => {
    if (isSplitSuccess && receipt && selectedCondition && selectedToken) {
      if (handledReceiptRef.current === receipt.transactionHash) return;
      handledReceiptRef.current = receipt.transactionHash;
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
          invalidateConditions();
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
          invalidateConditions();
        });
    }
  }, [
    isSplitSuccess,
    receipt,
    selectedCondition,
    selectedToken,
    publicClient,
    refetchBalance,
    invalidateConditions,
  ]);

  useEffect(() => {
    if (splitError) {
      toast.error(friendlyError(splitError));
    }
  }, [splitError]);

  const handleSplit = async () => {
    if (!selectedCondition || !selectedToken || !amount || !collateralBalance) {
      toast.error("Please complete all fields");
      return;
    }

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
      toast.error("Insufficient collateral balance in your Safe wallet");
      return;
    }

    try {
      await splitPosition({
        collateralToken: selectedToken.address,
        conditionId: selectedCondition.condition_id as `0x${string}`,
        amount: amountParsed,
        includeApproval: true,
      });
    } catch (err) {
      toast.error(friendlyError(err));
    }
  };

  const setMaxAmount = () => {
    if (collateralBalance) {
      setAmount(
        formatUnits(collateralBalance.value, collateralBalance.decimals),
      );
    }
  };

  const txStatus = useMemo(() => {
    if (isSplitting) return "awaiting";
    if (isSplitConfirming) return "confirming";
    if (isSplitSuccess) return "confirmed";
    if (splitError) return "failed";
    return "idle";
  }, [isSplitting, isSplitConfirming, isSplitSuccess, splitError]);

  useEffect(() => {
    setShowTransactionOverlay(txStatus !== "idle");
  }, [txStatus]);

  return (
    <div className="container mx-auto px-4 lg:px-8 py-12">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Get YES/NO Tokens
          </h1>
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

            {/* SCW info banner */}
            {scwAddress && (
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl flex items-start gap-3 text-sm">
                <Info className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                <div className="space-y-1 min-w-0">
                  <p className="text-text-primary font-medium">Your Safe Wallet</p>
                  <p className="text-text-secondary text-xs">
                    Tokens are held and split from your Safe smart contract wallet. Send {selectedToken?.symbol ?? "collateral"} here before splitting.
                  </p>
                  <CopyableHash hash={scwAddress} className="text-xs" />
                </div>
              </div>
            )}

            {/* Step 1: Select Condition */}
            <div className="bg-surface border border-border rounded-xl p-2 md:p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex min-h-8 h-8 min-w-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                  1
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Pick a Prediction</h2>
                  <p className="text-sm text-text-secondary">
                    Choose which yes/no question you want to trade
                  </p>
                </div>
              </div>

              {conditionsLoading ? (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                  <p className="text-text-tertiary mt-2">
                    Loading conditions...
                  </p>
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
                      const c =
                        conditions.find((x) => x.condition_id === value) ??
                        null;
                      setSelectedCondition(c);
                    }}
                    value={selectedCondition?.condition_id}
                  >
                    <SelectTrigger className="bg-elevated border-border text-text-primary">
                      <SelectValue placeholder="Select an active condition" />
                    </SelectTrigger>
                    <SelectContent className="w-[var(--radix-select-trigger-width)]">
                      {conditions.map((c) => (
                        <SelectItem key={c.condition_id} value={c.condition_id}>
                          <span className="font-medium">
                            {c.question_string || "Unknown prediction"}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

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
            <div className="bg-surface border border-border rounded-xl p-2 md:p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex min-h-8 h-8 min-w-8 w-8 items-center justify-center rounded-full bg-accent text-accent-foreground font-bold">
                  2
                </div>
                <div>
                  <h2 className="text-xl font-semibold">
                    Choose Your Currency
                  </h2>
                  <p className="text-sm text-text-secondary">
                    Pick which test token to put in. You get the same amount
                    back as YES + NO tokens.
                  </p>
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
                      balances={scwBalances}
                      onSelect={setSelectedToken}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Step 3: Enter Amount */}
            <div className="bg-surface border border-border rounded-xl p-2 md:p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex min-h-8 h-8 min-w-8 w-8 items-center justify-center rounded-full bg-success text-background font-bold">
                  3
                </div>
                <div>
                  <h2 className="text-xl font-semibold">How Much to Put In?</h2>
                  <p className="text-sm text-text-secondary">
                    You'll get the same amount back as YES and NO tokens
                  </p>
                </div>
              </div>

              <div className="max-w-xl space-y-6">
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
                        amount &&
                        collateralBalance &&
                        parseFloat(amount) >
                          parseFloat(
                            formatUnits(
                              collateralBalance.value,
                              collateralBalance.decimals,
                            ),
                          )
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
                      Safe wallet balance:{" "}
                      {parseFloat(
                        formatUnits(
                          collateralBalance.value,
                          collateralBalance.decimals,
                        ),
                      ).toFixed(4)}{" "}
                      {selectedToken?.symbol}
                    </p>
                  )}
                  {collateralBalance && collateralBalance.value === 0n && (
                    <p className="text-xs text-yellow-400">
                      Your Safe wallet balance is zero. Send {selectedToken?.symbol} to your Safe address above first.
                    </p>
                  )}
                  {amount &&
                    collateralBalance &&
                    parseFloat(amount) >
                      parseFloat(
                        formatUnits(
                          collateralBalance.value,
                          collateralBalance.decimals,
                        ),
                      ) && (
                      <p className="text-xs text-danger" role="alert">
                        Amount exceeds your Safe wallet balance
                      </p>
                    )}
                </div>

                <Button
                  onClick={handleSplit}
                  disabled={
                    !selectedCondition ||
                    !selectedToken ||
                    !amount ||
                    isSplitting ||
                    isSplitConfirming ||
                    (!!amount &&
                      !!collateralBalance &&
                      parseFloat(amount) >
                        parseFloat(
                          formatUnits(
                            collateralBalance.value,
                            collateralBalance.decimals,
                          ),
                        ))
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
                    <details className="group pt-1 border-t border-border">
                      <summary className="text-xs text-text-tertiary cursor-pointer hover:text-text-secondary list-none">
                        What are YES/NO tokens? ›
                      </summary>
                      <div className="mt-2 space-y-1">
                        <p className="text-xs text-text-secondary">
                          <span className="text-green-400 font-medium">
                            YES tokens
                          </span>{" "}
                          pay out 1:1 if Bitcoin difficulty exceeds the
                          threshold at the target block.
                        </p>
                        <p className="text-xs text-text-secondary">
                          <span className="text-red-400 font-medium">
                            NO tokens
                          </span>{" "}
                          pay out 1:1 if difficulty stays below the threshold.
                        </p>
                        <p className="text-xs text-text-tertiary">
                          You can sell either token to someone with the opposite
                          view.
                        </p>
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
        onRetry={() => handleSplit()}
      />

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
    </div>
  );
}
