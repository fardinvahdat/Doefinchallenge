import { useState, useMemo } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Search,
  Download,
  X,
  ArrowUpDown,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "../components/ui/sheet";
import { formatDistanceToNow } from "date-fns";
import { CopyableHash } from "../components/CopyableHash";
import { useHistoricalEvents } from "../../hooks/useContractEvents";

interface Market {
  conditionId: string;
  questionId: string;
  question: string;
  blockNumber: bigint;
  transactionHash: string;
  timestamp?: number;
  oracle: string;
}

type SortField = "timestamp" | "blockNumber";
type SortDirection = "asc" | "desc";

export default function Markets() {
  const { events, isLoading } = useHistoricalEvents();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  const [sortField, setSortField] = useState<SortField>("timestamp");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // Convert events to markets
  const markets: Market[] = useMemo(() => {
    return events
      .filter((e) => e.type === "ConditionPreparation")
      .map((e) => ({
        conditionId: e.args.conditionId as string,
        questionId: e.args.questionId as string,
        question: `Condition for question ${(e.args.questionId as string).slice(0, 10)}...`,
        blockNumber: e.blockNumber,
        transactionHash: e.transactionHash,
        timestamp: e.timestamp,
        oracle: e.args.oracle as string,
      }));
  }, [events]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const handleExportJSON = () => {
    const dataStr = JSON.stringify(filteredMarkets, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "doefin-markets.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Markets exported to JSON");
  };

  const filteredMarkets = markets
    .filter(
      (market) =>
        market.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        market.conditionId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        market.questionId.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      let comparison = 0;
      if (sortField === "timestamp") {
        comparison = (a.timestamp || 0) - (b.timestamp || 0);
      } else if (sortField === "blockNumber") {
        comparison = Number(a.blockNumber - b.blockNumber);
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });

  return (
    <div className="container mx-auto px-4 lg:px-8 py-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Markets</h1>
            <p className="text-text-secondary text-lg">
              Browse all active difficulty prediction markets on Base Sepolia
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={handleExportJSON}
              variant="outline"
              className="bg-elevated border-border hover:bg-elevated/80"
              disabled={markets.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Export JSON
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-tertiary" />
            <Input
              placeholder="Search by condition ID, question ID..."
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

        {/* Markets Table */}
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          {isLoading ? (
            <div className="py-24 flex flex-col items-center justify-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-text-secondary">Loading markets from blockchain...</p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-elevated border-b border-border">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                        Condition ID
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                        Question ID
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                        <button
                          onClick={() => handleSort("blockNumber")}
                          className="flex items-center gap-1 hover:text-text-primary"
                        >
                          Block Number
                          <ArrowUpDown className="h-3 w-3" />
                        </button>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                        <button
                          onClick={() => handleSort("timestamp")}
                          className="flex items-center gap-1 hover:text-text-primary"
                        >
                          Created
                          <ArrowUpDown className="h-3 w-3" />
                        </button>
                      </th>
                      <th className="px-6 py-4"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredMarkets.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center">
                          <p className="text-text-tertiary">
                            {markets.length === 0
                              ? "No conditions found on-chain. Create a condition to get started."
                              : "No markets found matching your search"}
                          </p>
                        </td>
                      </tr>
                    ) : (
                      filteredMarkets.map((market) => (
                        <tr
                          key={market.conditionId}
                          onClick={() => setSelectedMarket(market)}
                          className="hover:bg-elevated/50 cursor-pointer transition-colors group"
                        >
                          <td className="px-6 py-4">
                            <code className="text-sm font-mono text-text-primary truncate max-w-[200px] block">
                              {market.conditionId}
                            </code>
                          </td>
                          <td className="px-6 py-4">
                            <code className="text-sm font-mono text-text-primary truncate max-w-[200px] block">
                              {market.questionId}
                            </code>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-text-primary">
                              {market.blockNumber.toString()}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-text-secondary">
                              {market.timestamp
                                ? formatDistanceToNow(new Date(market.timestamp * 1000), {
                                    addSuffix: true,
                                  })
                                : "Unknown"}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <ChevronRight className="h-5 w-5 text-text-tertiary group-hover:text-primary transition-colors" />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="lg:hidden divide-y divide-border">
                {filteredMarkets.length === 0 ? (
                  <div className="px-6 py-12 text-center">
                    <p className="text-text-tertiary">
                      {markets.length === 0
                        ? "No conditions found on-chain"
                        : "No markets found matching your search"}
                    </p>
                  </div>
                ) : (
                  filteredMarkets.map((market) => (
                    <button
                      key={market.conditionId}
                      onClick={() => setSelectedMarket(market)}
                      className="w-full p-4 text-left hover:bg-elevated/50 transition-colors"
                    >
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs text-text-tertiary mb-1">Condition ID</p>
                          <code className="text-sm font-mono text-text-primary break-all">
                            {market.conditionId}
                          </code>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-text-tertiary">
                            Block {market.blockNumber.toString()}
                          </span>
                          {market.timestamp && (
                            <span className="text-text-secondary">
                              {formatDistanceToNow(new Date(market.timestamp * 1000), {
                                addSuffix: true,
                              })}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Market Detail Sidebar */}
      <Sheet open={!!selectedMarket} onOpenChange={() => setSelectedMarket(null)}>
        <SheetContent className="bg-background border-border w-full sm:max-w-xl overflow-y-auto">
          {selectedMarket && (
            <>
              <SheetHeader>
                <SheetTitle className="text-text-primary text-xl">
                  Market Details
                </SheetTitle>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Condition ID */}
                <div>
                  <h3 className="text-sm font-semibold text-text-secondary mb-2">
                    Condition ID
                  </h3>
                  <CopyableHash hash={selectedMarket.conditionId} />
                </div>

                {/* Question ID */}
                <div>
                  <h3 className="text-sm font-semibold text-text-secondary mb-2">
                    Question ID
                  </h3>
                  <CopyableHash hash={selectedMarket.questionId} />
                </div>

                {/* Oracle */}
                <div>
                  <h3 className="text-sm font-semibold text-text-secondary mb-2">
                    Oracle Address
                  </h3>
                  <CopyableHash hash={selectedMarket.oracle} />
                </div>

                {/* Transaction Hash */}
                <div>
                  <h3 className="text-sm font-semibold text-text-secondary mb-2">
                    Transaction Hash
                  </h3>
                  <div className="flex items-center gap-2">
                    <CopyableHash hash={selectedMarket.transactionHash} />
                    <a
                      href={`https://sepolia.basescan.org/tx/${selectedMarket.transactionHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      View on Basescan
                    </a>
                  </div>
                </div>

                {/* Block Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-semibold text-text-secondary mb-2">
                      Block Number
                    </h3>
                    <p className="text-text-primary font-mono">
                      {selectedMarket.blockNumber.toString()}
                    </p>
                  </div>
                  {selectedMarket.timestamp && (
                    <div>
                      <h3 className="text-sm font-semibold text-text-secondary mb-2">
                        Created
                      </h3>
                      <p className="text-text-primary">
                        {formatDistanceToNow(new Date(selectedMarket.timestamp * 1000), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
