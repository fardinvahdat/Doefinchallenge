import { useState, useMemo } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Search, X, Loader2, Wallet, AlertCircle } from "lucide-react";
import { CopyableHash } from "../components/CopyableHash";
import { useNavigate } from "react-router";
import {
  useConditions,
  parseQuestionString,
  type ConditionStatus,
  type ApiCondition,
} from "../../hooks/useConditions";
import { useTokens } from "../../hooks/useTokens";

const STATUS_TABS: { label: string; value: ConditionStatus }[] = [
  { label: "Active", value: "active" },
  { label: "Resolved", value: "resolved" },
  { label: "All", value: "all" },
];

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

function CollateralBadge({ token, symbol }: { token: string; symbol?: string }) {
  const label = symbol ?? token.slice(0, 6) + "…" + token.slice(-4);
  return (
    <Badge variant="outline" className="text-xs font-mono">
      {label}
    </Badge>
  );
}

function ConditionCard({
  condition,
  getTokenSymbol,
}: {
  condition: ApiCondition;
  getTokenSymbol: (addr: string) => string | undefined;
}) {
  const parsed = parseQuestionString(condition.question_string);
  const hasValidOracle =
    condition.oracle &&
    condition.oracle !== ZERO_ADDRESS &&
    condition.oracle !== "undefined";

  return (
    <Card className="bg-surface border-border hover:border-primary/50 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-sm font-medium text-text-primary leading-snug">
            {condition.question_string || "Unknown question"}
          </CardTitle>
          <Badge
            variant={condition.active ? "default" : "secondary"}
            className={`flex-shrink-0 text-xs ${
              condition.active
                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                : "bg-text-tertiary/20 text-text-tertiary"
            }`}
          >
            {condition.active ? "Active" : "Resolved"}
          </Badge>
        </div>

        {parsed && (
          <div className="flex flex-wrap gap-1 mt-2">
            <Badge variant="outline" className="text-xs">
              {parsed.thresholdT.toFixed(2)}T
            </Badge>
            <Badge variant="outline" className="text-xs">
              Block {parsed.blockHeight.toLocaleString()}
            </Badge>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-3">
        {condition.markets.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs text-text-tertiary">Collateral markets:</p>
            <div className="flex flex-wrap gap-1">
              {condition.markets.map((m) => (
                <CollateralBadge
                  key={m.market_id}
                  token={m.collateral_token}
                  symbol={getTokenSymbol(m.collateral_token)}
                />
              ))}
            </div>
          </div>
        )}

        <div className="pt-2 border-t border-border">
          <p className="text-xs text-text-tertiary mb-1">Condition ID</p>
          <CopyableHash hash={condition.condition_id} className="text-xs" />
        </div>

        {/* #27: only render oracle link when address is valid and non-zero */}
        {hasValidOracle && (
          <a
            href={`https://sepolia.basescan.org/address/${condition.oracle}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline"
          >
            Oracle on Basescan
          </a>
        )}
      </CardContent>
    </Card>
  );
}

export default function Markets() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<ConditionStatus>("active");
  const [searchQuery, setSearchQuery] = useState("");

  const { conditions, totalCount, isLoading, error } = useConditions(statusFilter);
  const { tokens } = useTokens();

  // #26: build a lookup map so CollateralBadge can show token symbols
  const tokenSymbolMap = useMemo(() => {
    const m: Record<string, string> = {};
    tokens.forEach((t) => { m[t.address.toLowerCase()] = t.symbol; });
    return m;
  }, [tokens]);

  const getTokenSymbol = (addr: string) => tokenSymbolMap[addr.toLowerCase()];

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return conditions;
    const q = searchQuery.toLowerCase();
    return conditions.filter(
      (c) =>
        c.condition_id.toLowerCase().includes(q) ||
        c.question_string.toLowerCase().includes(q) ||
        c.question_id.toLowerCase().includes(q),
    );
  }, [conditions, searchQuery]);

  return (
    <div className="container mx-auto px-4 lg:px-8 py-12">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Markets</h1>
            <p className="text-text-secondary text-lg">
              Bitcoin difficulty prediction markets on Base Sepolia
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => navigate("/create-condition")}
              variant="outline"
              className="bg-elevated border-border hover:bg-elevated/80"
            >
              New Condition
            </Button>
            <Button
              onClick={() => navigate("/create-market")}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Split Position
            </Button>
          </div>
        </div>

        <div className="flex gap-1 mb-4 p-1 bg-surface rounded-lg border border-border w-fit">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                statusFilter === tab.value
                  ? "bg-primary text-primary-foreground"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-tertiary" />
            <Input
              placeholder="Search by question, condition ID..."
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

        {error && (
          <div className="mb-6 flex items-center gap-2 p-4 bg-danger/10 border border-danger/30 rounded-xl text-sm text-danger">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            Failed to load conditions. Check your internet connection or API
            configuration.
          </div>
        )}

        {isLoading ? (
          <div className="py-24 flex flex-col items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-text-secondary">Loading markets...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-surface border border-border rounded-xl p-12 text-center">
            <div className="w-16 h-16 bg-elevated rounded-full flex items-center justify-center mx-auto mb-4">
              <Wallet className="h-8 w-8 text-text-tertiary" />
            </div>
            <h3 className="text-xl font-semibold text-text-primary mb-2">
              No{" "}
              {statusFilter === "active"
                ? "active"
                : statusFilter === "resolved"
                  ? "resolved"
                  : ""}{" "}
              conditions found
            </h3>
            <p className="text-text-secondary mb-6 max-w-md mx-auto">
              {searchQuery
                ? "No conditions match your search."
                : statusFilter === "active"
                  ? "No active conditions yet. Create one to get started."
                  : "No conditions in this category yet."}
            </p>
            {!searchQuery && statusFilter === "active" && (
              <Button
                onClick={() => navigate("/create-condition")}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Create Condition
              </Button>
            )}
          </div>
        ) : (
          <>
            <p className="text-xs text-text-tertiary mb-4">
              {filtered.length} of {totalCount} condition
              {totalCount !== 1 ? "s" : ""}
              {searchQuery && " matching your search"}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((c) => (
                <ConditionCard
                  key={c.condition_id}
                  condition={c}
                  getTokenSymbol={getTokenSymbol}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
