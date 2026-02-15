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
import { useNavigate } from "react-router";
import { TransactionOverlay } from "../components/TransactionOverlay";
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
import { useHistoricalEvents } from "../../hooks/useContractEvents";
import { CONTRACTS, ERC20_ABI } from "../../config/contracts";
import { Address, parseUnits, formatUnits } from "viem";

// Interface for markets stored in localStorage
interface StoredMarket {
  conditionId: string;
  yesPositionId: string;
  noPositionId: string;
  collateralToken: string;
  amount: string;
  transactionHash: string;
  timestamp: number;
}

// LocalStorage key for markets
const MARKETS_STORAGE_KEY = "doefin-markets";

// Function to load markets from localStorage
function loadMarketsFromStorage(): StoredMarket[] {
  try {
    const storedData = localStorage.getItem(MARKETS_STORAGE_KEY);
    if (storedData) {
      return JSON.parse(storedData) as StoredMarket[];
    }
    return [];
  } catch (error) {
    console.error("Error loading markets from localStorage:", error);
    return [];
  }
}

// Function to save a market to localStorage
function saveMarketToStorage(market: StoredMarket): void {
  try {
    const markets = loadMarketsFromStorage();
    markets.push(market);
    localStorage.setItem(MARKETS_STORAGE_KEY, JSON.stringify(markets));
  } catch (error) {
    console.error("Error saving market to localStorage:", error);
  }
}

// Interface for conditions stored in localStorage
interface StoredCondition {
  conditionId: string;
  transactionHash: string;
  question: string;
  threshold: string;
  blockHeight: string;
  outcomeSlotCount: number;
  timestamp: number;
  metadataURI?: string;
}

// LocalStorage key for conditions
const CONDITIONS_STORAGE_KEY = "doefin-conditions";

// Function to load conditions from localStorage
function loadConditionsFromStorage(): StoredCondition[] {
  try {
    const storedData = localStorage.getItem(CONDITIONS_STORAGE_KEY);
    if (storedData) {
      return JSON.parse(storedData) as StoredCondition[];
    }
    return [];
  } catch (error) {
    console.error("Error loading conditions from localStorage:", error);
    return [];
  }
}

interface Condition {
  conditionId: `0x${string}`;
  questionId: `0x${string}`;
  question: string;
  threshold: string;
  blockHeight: string;
}

interface Collateral {
  symbol: string;
  name: string;
  address: Address;
  decimals: number;
}

const collaterals: Collateral[] = [
  {
    symbol: "mBTC",
    name: "Mock Bitcoin",
    address: CONTRACTS.mBTC,
    decimals: 8,
  },
  {
    symbol: "mUSDC",
    name: "Mock USDC",
    address: CONTRACTS.mUSDC,
    decimals: 6,
  },
];

export default function CreateMarket() {
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();
  const currentChain = useChainId();
  const { events, isLoading: eventsLoading } = useHistoricalEvents();

  // State for markets from localStorage
  const [storedMarkets, setStoredMarkets] = useState<StoredMarket[]>([]);
  const [isLoadingStoredMarkets, setIsLoadingStoredMarkets] = useState(true);

  // State for conditions from localStorage
  const [storedConditions, setStoredConditions] = useState<StoredCondition[]>(
    [],
  );
  const [isLoadingStoredConditions, setIsLoadingStoredConditions] =
    useState(true);

  const [selectedCondition, setSelectedCondition] = useState<Condition | null>(
    null,
  );
  const [selectedCollateral, setSelectedCollateral] =
    useState<Collateral | null>(null);
  const [amount, setAmount] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Load conditions and markets from localStorage on component mount
  useEffect(() => {
    const conditions = loadConditionsFromStorage();
    setStoredConditions(conditions);
    setIsLoadingStoredConditions(false);

    const markets = loadMarketsFromStorage();
    setStoredMarkets(markets);
    setIsLoadingStoredMarkets(false);
  }, []);

  // Get conditions from localStorage (now the primary source)
  // Convert StoredCondition to Condition format for compatibility
  const conditions: Condition[] = storedConditions.map((sc) => ({
    conditionId: sc.conditionId as `0x${string}`,
    questionId: "" as `0x${string}`,
    question: sc.question,
    threshold: sc.threshold,
    blockHeight: sc.blockHeight,
  }));

  // Get collateral balance using ERC20 balanceOf
  const { data: collateralBalanceRaw } = useReadContract({
    address: selectedCollateral?.address,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!selectedCollateral,
    },
  });

  // Format balance using collateral's decimals
  const collateralBalance =
    collateralBalanceRaw !== undefined
      ? {
          value: collateralBalanceRaw,
          decimals: selectedCollateral?.decimals ?? 18,
        }
      : null;

  // Token approval hook
  const {
    isApproved,
    approve,
    isPending: isApproving,
    isConfirming: isApprovingConfirming,
    isSuccess: isApproveSuccess,
    refetch: refetchAllowance,
  } = useTokenApproval(
    selectedCollateral?.address || CONTRACTS.mBTC,
    CONTRACTS.ConditionalTokens,
    address,
  );

  // Get public client for reading contract data
  const publicClient = usePublicClient();

  // Split position hook
  const {
    splitPosition,
    hash: splitHash,
    isPending: isSplitting,
    isConfirming: isSplitConfirming,
    isSuccess: isSplitSuccess,
    error: splitError,
    receipt,
  } = useSplitPosition();

  // Handle approve success
  useEffect(() => {
    if (isApproveSuccess) {
      toast.success("Approval successful!");
      refetchAllowance();
    }
  }, [isApproveSuccess, refetchAllowance]);

  // Handle split success
  useEffect(() => {
    if (isSplitSuccess && receipt && selectedCondition && selectedCollateral) {
      // Parse the receipt to get position IDs
      parseSplitPositionReceipt(
        receipt,
        CONTRACTS.Diamond,
        selectedCollateral.address,
        selectedCondition.conditionId,
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
          // Save market to localStorage
          const newMarket: StoredMarket = {
            conditionId: result.conditionId,
            yesPositionId: result.yesPositionId.toString(),
            noPositionId: result.noPositionId.toString(),
            collateralToken: selectedCollateral.address,
            amount: amount,
            transactionHash: receipt.transactionHash,
            timestamp: Date.now(),
          };
          saveMarketToStorage(newMarket);
          setStoredMarkets((prev) => [...prev, newMarket]);

          toast.success(
            `Position split successfully! YES: ${result.yesPositionId.toString().slice(0, 10)}... NO: ${result.noPositionId.toString().slice(0, 10)}...`,
          );
          // Show success modal instead of navigating
          setShowSuccessModal(true);
        })
        .catch((err) => {
          console.error("Error parsing receipt:", err);
          // Still save basic market data on error but without position IDs
          const newMarket: StoredMarket = {
            conditionId: selectedCondition.conditionId,
            yesPositionId: "",
            noPositionId: "",
            collateralToken: selectedCollateral.address,
            amount: amount,
            transactionHash: receipt.transactionHash,
            timestamp: Date.now(),
          };
          saveMarketToStorage(newMarket);
          setStoredMarkets((prev) => [...prev, newMarket]);
          toast.success("Position split successfully!");
          // Show success modal instead of navigating
          setShowSuccessModal(true);
        });
    }
  }, [
    isSplitSuccess,
    receipt,
    selectedCondition,
    selectedCollateral,
    amount,
    publicClient,
  ]);

  // Handle errors
  useEffect(() => {
    if (splitError) {
      toast.error("Transaction failed: " + (splitError as Error).message);
    }
  }, [splitError]);

  const handleApprove = async () => {
    if (!selectedCollateral) return;
    try {
      await approve();
    } catch (err) {
      console.error("Error approving:", err);
    }
  };

  const handleSplitPosition = async () => {
    if (
      !selectedCondition ||
      !selectedCollateral ||
      !amount ||
      !collateralBalance
    ) {
      toast.error("Please complete all fields");
      return;
    }

    if (!isApproved) {
      toast.error("Please approve collateral first");
      return;
    }

    const amountWei = parseUnits(
      amount,
      selectedCollateral.decimals,
    ).toString();
    if (collateralBalance.value < +amountWei) {
      toast.error("Insufficient collateral balance");
      return;
    }

    try {
      await splitPosition({
        collateralToken: selectedCollateral.address,
        conditionId: selectedCondition.conditionId,
        amount: amountWei,
      });
    } catch (err) {
      console.error("Error splitting position:", err);
      toast.error(
        `Transaction failed: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
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
    if (isApproving || isApprovingConfirming) return "awaiting";
    if (isSplitting || isSplitConfirming) return "confirming";
    if (isSplitSuccess) return "confirmed";
    if (splitError) return "failed";
    return "pending";
  }, [
    isApproving,
    isApprovingConfirming,
    isSplitting,
    isSplitConfirming,
    isSplitSuccess,
    splitError,
  ]);

  return (
    <div className="container mx-auto px-4 lg:px-8 py-12">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Create Market</h1>
          <p className="text-text-secondary text-lg">
            Split collateral into YES/NO position tokens for a condition
          </p>
        </div>

        {!isConnected ? (
          <div className="bg-surface border border-border rounded-xl p-12 text-center">
            <p className="text-text-secondary text-lg mb-4">
              Please connect your wallet to create a market
            </p>
            <p className="text-text-tertiary text-sm">
              Use the Connect Wallet button in the top right corner
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Step 1: Select Condition */}
            <div className="bg-surface border border-border rounded-xl p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                  1
                </div>
                <h2 className="text-xl font-semibold">Select Condition</h2>
              </div>

              {isLoadingStoredConditions ? (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                  <p className="text-text-tertiary mt-2">
                    Loading conditions...
                  </p>
                </div>
              ) : storedConditions.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-text-tertiary">
                    No conditions found. Create a condition first.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <Select
                    onValueChange={(value) => {
                      const condition = storedConditions.find(
                        (c) => c.conditionId === value,
                      );
                      if (condition) {
                        setSelectedCondition({
                          conditionId: condition.conditionId as `0x${string}`,
                          questionId: "" as `0x${string}`,
                          question: condition.question,
                          threshold: condition.threshold,
                          blockHeight: condition.blockHeight,
                        });
                      }
                    }}
                    value={selectedCondition?.conditionId}
                  >
                    <SelectTrigger className="bg-elevated border-border text-text-primary">
                      <SelectValue placeholder="Select a condition" />
                    </SelectTrigger>
                    <SelectContent>
                      {storedConditions.map((condition) => (
                        <SelectItem
                          key={condition.conditionId}
                          value={condition.conditionId}
                        >
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {condition.question}
                            </span>
                            <span className="text-xs text-text-tertiary font-mono">
                              {condition.conditionId.slice(0, 20)}...
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Selected condition details */}
                  {selectedCondition && (
                    <div className="p-4 bg-elevated border border-border rounded-lg">
                      <div className="flex items-start justify-between mb-3">
                        <code className="text-xs text-text-tertiary font-mono truncate">
                          {selectedCondition.conditionId}
                        </code>
                      </div>
                      <p className="text-text-primary font-medium mb-2">
                        {selectedCondition.question}
                      </p>
                      <div className="flex gap-4 text-xs text-text-tertiary">
                        <span>Threshold: {selectedCondition.threshold}</span>
                        <span>Block: {selectedCondition.blockHeight}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Step 2: Select Collateral */}
            <div className="bg-surface border border-border rounded-xl p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-accent-foreground font-bold">
                  2
                </div>
                <h2 className="text-xl font-semibold">Select Collateral</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {collaterals.map((collateral) => {
                  const { data: balanceRaw } = useReadContract({
                    address: collateral.address,
                    abi: ERC20_ABI,
                    functionName: "balanceOf",
                    args: address ? [address] : undefined,
                    query: {
                      enabled: !!address,
                    },
                  });

                  return (
                    <button
                      key={collateral.symbol}
                      onClick={() => setSelectedCollateral(collateral)}
                      className={`p-6 rounded-xl border-2 text-left transition-all ${
                        selectedCollateral?.symbol === collateral.symbol
                          ? "border-accent bg-accent/5 shadow-[0_0_20px_rgba(34,211,238,0.2)]"
                          : "border-border bg-elevated hover:border-accent/50"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-lg font-bold text-text-primary">
                            {collateral.symbol}
                          </h3>
                          <p className="text-sm text-text-secondary">
                            {collateral.name}
                          </p>
                        </div>
                        {selectedCollateral?.symbol === collateral.symbol && (
                          <div className="h-5 w-5 rounded-full bg-accent flex items-center justify-center">
                            <Check className="h-3 w-3 text-accent-foreground" />
                          </div>
                        )}
                      </div>
                      {balanceRaw !== undefined && (
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-bold text-text-primary">
                            {parseFloat(
                              formatUnits(balanceRaw, collateral.decimals),
                            ).toFixed(4)}
                          </span>
                          <span className="text-text-tertiary text-sm">
                            {collateral.symbol}
                          </span>
                        </div>
                      )}
                      <code className="text-xs text-text-tertiary font-mono mt-2 block truncate">
                        {collateral.address}
                      </code>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 3: Enter Amount & Execute */}
            <div className="bg-surface border border-border rounded-xl p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success text-background font-bold">
                  3
                </div>
                <h2 className="text-xl font-semibold">Enter Amount & Split</h2>
              </div>

              <div className="max-w-xl space-y-6">
                {/* Amount Input */}
                <div className="space-y-2">
                  <Label htmlFor="amount" className="text-text-primary">
                    Collateral Amount
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="amount"
                      type="number"
                      placeholder="0.0"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="bg-elevated border-border text-text-primary focus:ring-primary focus:border-primary"
                      disabled={!selectedCollateral}
                    />
                    <Button
                      onClick={setMaxAmount}
                      variant="outline"
                      disabled={!selectedCollateral || !collateralBalance}
                      className="bg-elevated border-border hover:bg-elevated/80 px-6"
                    >
                      Max
                    </Button>
                  </div>
                  {collateralBalance && (
                    <p className="text-xs text-text-tertiary">
                      Available:{" "}
                      {parseFloat(
                        formatUnits(
                          collateralBalance.value,
                          collateralBalance.decimals,
                        ),
                      ).toFixed(4)}{" "}
                      {selectedCollateral?.symbol}
                    </p>
                  )}
                </div>

                {/* Approval */}
                {selectedCollateral && (
                  <div className="p-4 bg-accent/5 border border-accent/30 rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-text-primary">
                          Approve {selectedCollateral.symbol}
                        </p>
                        <p className="text-xs text-text-secondary mt-1">
                          Allow the contract to spend your{" "}
                          {selectedCollateral.symbol}
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
                          `Approve ${selectedCollateral.symbol}`
                        )}
                      </Button>
                    )}
                  </div>
                )}

                {/* Split Position Button */}
                <Button
                  onClick={handleSplitPosition}
                  disabled={
                    !selectedCondition ||
                    !selectedCollateral ||
                    !amount ||
                    !isApproved ||
                    isSplitting ||
                    isSplitConfirming
                  }
                  className="w-full bg-success hover:bg-success/90 text-background transition-all hover:shadow-[0_0_20px_rgba(34,197,94,0.4)]"
                >
                  {isSplitting || isSplitConfirming ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Splitting Position...
                    </>
                  ) : (
                    "Split Position"
                  )}
                </Button>

                {/* Info */}
                {selectedCondition && selectedCollateral && amount && (
                  <div className="p-4 bg-elevated border border-border rounded-lg space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-text-secondary">
                        You will receive:
                      </span>
                      <span className="text-text-primary font-medium">
                        {amount} YES + {amount} NO tokens
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Condition:</span>
                      <span className="text-text-primary font-mono text-xs truncate max-w-[200px]">
                        {selectedCondition.conditionId}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Transaction Overlay */}
      <TransactionOverlay
        isOpen={txStatus !== "pending"}
        status={txStatus}
        txHash={splitHash}
        onClose={() => {}}
        onRetry={() => handleSplitPosition()}
      />

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="bg-elevated border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl text-text-primary">
              Position Split Successfully! 🎉
            </DialogTitle>
            <DialogDescription className="text-text-secondary">
              Your collateral has been split into position tokens
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
