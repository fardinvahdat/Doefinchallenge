import { useState, useEffect, useMemo } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  Search,
  Download,
  X,
  TrendingUp,
  TrendingDown,
  Loader2,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { CopyableHash } from "../components/CopyableHash";
import { useNavigate } from "react-router";
import { CONTRACTS } from "../../config/contracts";

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

// Interface for conditions stored in localStorage
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

// LocalStorage keys
const MARKETS_STORAGE_KEY = "doefin-markets";
const CONDITIONS_STORAGE_KEY = "doefin-conditions";

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

// Get collateral symbol from address
function getCollateralSymbol(address: string): string {
  console.log(address);
  const collaterals: Record<string, string> = {
    [CONTRACTS.mBTC]: "mBTC",
    [CONTRACTS.mUSDC]: "mUSDC",
  };
  return collaterals[address] || "Unknown";
}

export default function Markets() {
  const navigate = useNavigate();
  const [markets, setMarkets] = useState<StoredMarket[]>([]);
  const [conditions, setConditions] = useState<StoredCondition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Load markets and conditions from localStorage on mount
  useEffect(() => {
    const loadedMarkets = loadMarketsFromStorage();
    const loadedConditions = loadConditionsFromStorage();
    setMarkets(loadedMarkets);
    setConditions(loadedConditions);
    setIsLoading(false);
  }, []);

  // Get question for a market by conditionId
  const getQuestionForMarket = (conditionId: string): string | null => {
    const condition = conditions.find((c) => c.conditionId === conditionId);
    return condition?.question || null;
  };

  // Get threshold for a market by conditionId
  const getThresholdForMarket = (conditionId: string): string | null => {
    const condition = conditions.find((c) => c.conditionId === conditionId);
    return condition?.threshold || null;
  };

  // Get block height for a market by conditionId
  const getBlockHeightForMarket = (conditionId: string): string | null => {
    const condition = conditions.find((c) => c.conditionId === conditionId);
    return condition?.blockHeight || null;
  };

  // Filter markets by search query
  const filteredMarkets = useMemo(() => {
    return markets
      .filter((market) => {
        const question = getQuestionForMarket(market.conditionId);
        const searchLower = searchQuery.toLowerCase();
        return (
          market.conditionId.toLowerCase().includes(searchLower) ||
          market.yesPositionId.toLowerCase().includes(searchLower) ||
          market.noPositionId.toLowerCase().includes(searchLower) ||
          (question && question.toLowerCase().includes(searchLower))
        );
      })
      .sort((a, b) => b.timestamp - a.timestamp); // Most recent first
  }, [markets, conditions, searchQuery]);

  return (
    <div className="container mx-auto px-4 lg:px-8 py-12">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Markets</h1>
            <p className="text-text-secondary text-lg">
              Browse your difficulty prediction markets on Base Sepolia
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-tertiary" />
            <Input
              placeholder="Search by condition ID, position ID, or question..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-surface border-border text-text-primary focus:ring-primary focus:border-primary"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="py-24 flex flex-col items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-text-secondary">Loading markets...</p>
          </div>
        ) : filteredMarkets.length === 0 ? (
          /* Empty State */
          <div className="bg-surface border border-border rounded-xl p-12 text-center">
            <div className="w-16 h-16 bg-elevated rounded-full flex items-center justify-center mx-auto mb-4">
              <Wallet className="h-8 w-8 text-text-tertiary" />
            </div>
            <h3 className="text-xl font-semibold text-text-primary mb-2">
              No markets found
            </h3>
            <p className="text-text-secondary mb-6 max-w-md mx-auto">
              {markets.length === 0
                ? "You haven't created any markets yet. Create a condition first, then split your collateral to create a market."
                : "No markets match your search criteria."}
            </p>
            <div className="flex gap-3 justify-center">
              <Button
                onClick={() => navigate("/create-condition")}
                variant="outline"
                className="bg-elevated border-border hover:bg-elevated/80"
              >
                Create Condition
              </Button>
              <Button
                onClick={() => navigate("/create-market")}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Create Market
              </Button>
            </div>
          </div>
        ) : (
          /* Markets Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMarkets.map((market) => {
              const question = getQuestionForMarket(market.conditionId);
              const threshold = getThresholdForMarket(market.conditionId);
              const blockHeight = getBlockHeightForMarket(market.conditionId);

              return (
                <Card
                  key={market.conditionId + market.timestamp}
                  className="bg-surface border-border hover:border-primary/50 transition-colors"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-sm font-medium text-text-primary line-clamp-2">
                        {question || "Unknown Question"}
                      </CardTitle>
                    </div>
                    {threshold && blockHeight && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {threshold} H/s
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          Block {Number(blockHeight).toLocaleString()}
                        </Badge>
                      </div>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Collateral & Amount */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-text-tertiary">
                          Collateral:
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {getCollateralSymbol(market.collateralToken)}
                        </Badge>
                      </div>
                      <span className="text-sm font-medium text-text-primary">
                        {market.amount}
                      </span>
                    </div>

                    {/* Position IDs */}
                    <div className="space-y-2 pt-2 border-t border-border">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-3 w-3 text-success" />
                        <span className="text-xs text-text-tertiary">YES:</span>
                        <code className="text-xs font-mono text-text-primary truncate">
                          {market.yesPositionId.slice(0, 14)}...
                        </code>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingDown className="h-3 w-3 text-danger" />
                        <span className="text-xs text-text-tertiary">NO:</span>
                        <code className="text-xs font-mono text-text-primary truncate">
                          {market.noPositionId.slice(0, 14)}...
                        </code>
                      </div>
                    </div>

                    {/* Timestamp & Tx Hash */}
                    <div className="pt-2 border-t border-border">
                      <div className="flex items-center justify-between text-xs text-text-tertiary">
                        <span>
                          {formatDistanceToNow(new Date(market.timestamp), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                      <div className="mt-2">
                        <CopyableHash
                          hash={market.transactionHash}
                          className="text-xs"
                        />
                      </div>
                    </div>

                    {/* View on Basescan */}
                    <a
                      href={`https://sepolia.basescan.org/tx/${market.transactionHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                    >
                      View on Basescan
                    </a>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
