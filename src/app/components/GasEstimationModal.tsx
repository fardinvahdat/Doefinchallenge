import { AlertCircle, Fuel, TrendingUp, Clock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";
import { formatGwei } from "viem";

interface GasEstimationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: () => void;
  gasEstimate: {
    estimatedGas: bigint;
    gasPrice: bigint;
    estimatedCostEth: string;
    estimatedCostUSD: string;
    isEstimating: boolean;
    error: string | null;
    conditionExists?: boolean;
  };
}

export function GasEstimationModal({
  open,
  onOpenChange,
  onSubmit,
  gasEstimate,
}: GasEstimationModalProps) {
  const { estimatedGas, gasPrice, estimatedCostEth, estimatedCostUSD, isEstimating, error, conditionExists } = gasEstimate;
  const hasError = !!error;

  const transactionDetails = {
    title: "Create Condition",
    description: "Create a new binary prediction condition with metadata on the Diamond contract",
    items: [
      { label: "Contract", value: "Diamond" },
      { label: "Function", value: "createConditionWithMetadata()" },
      { label: "Outcomes", value: "2 (YES/NO)" },
    ],
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-elevated border-border max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl text-text-primary flex items-center gap-2">
            <Fuel className="h-6 w-6 text-primary" />
            Confirm Transaction
          </DialogTitle>
          <DialogDescription className="text-text-secondary">
            Review the transaction details and estimated gas costs
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Transaction Details */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-text-primary">
              {transactionDetails.title}
            </h3>
            <p className="text-sm text-text-secondary">
              {transactionDetails.description}
            </p>
            
            <div className="p-3 bg-background border border-border rounded-lg space-y-2">
              {transactionDetails.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span className="text-text-secondary">{item.label}</span>
                  <span className="text-text-primary font-mono">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Gas Estimation */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <Fuel className="h-4 w-4" />
              Gas Estimation
            </h3>

            {isEstimating ? (
              <div className="space-y-2">
                <Skeleton className="h-16 w-full bg-surface" />
                <div className="grid grid-cols-2 gap-2">
                  <Skeleton className="h-12 w-full bg-surface" />
                  <Skeleton className="h-12 w-full bg-surface" />
                </div>
              </div>
            ) : hasError ? (
              <div className="p-4 bg-danger/10 border border-danger/30 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-danger flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-danger mb-1">
                      {gasEstimate.conditionExists ? 'Condition Already Exists' : 'Gas Estimation Failed'}
                    </p>
                    <p className="text-xs text-text-secondary mb-2">{error}</p>
                    
                    {gasEstimate.conditionExists ? (
                      <div className="mt-3 p-2 bg-background/50 rounded border border-border/50">
                        <p className="text-xs font-semibold text-text-primary mb-2">💡 Solutions:</p>
                        <ul className="text-xs text-text-secondary space-y-1 list-disc list-inside">
                          <li>Change the <span className="font-mono text-primary">threshold</span> value</li>
                          <li>Change the <span className="font-mono text-primary">block height</span> value</li>
                          <li>Or use the existing condition in Create Market</li>
                        </ul>
                      </div>
                    ) : (
                      <p className="text-xs text-text-tertiary mt-2">
                        The transaction may fail. Please check your inputs and try again.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Main Cost Display */}
                <div className="p-4 bg-primary/5 border border-primary/30 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-text-secondary">Estimated Cost</span>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-success" />
                      <span className="text-xs text-success">Low</span>
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-text-primary">
                      ${estimatedCostUSD}
                    </span>
                    <span className="text-sm text-text-secondary">USD</span>
                  </div>
                  <p className="text-xs text-text-tertiary mt-1">
                    ≈ {parseFloat(estimatedCostEth).toFixed(6)} ETH
                  </p>
                </div>

                {/* Gas Details Grid */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Gas Limit */}
                  <div className="p-3 bg-background border border-border rounded-lg">
                    <p className="text-xs text-text-secondary mb-1">Gas Limit</p>
                    <p className="text-lg font-semibold text-text-primary">
                      {estimatedGas.toLocaleString()}
                    </p>
                    <p className="text-xs text-text-tertiary mt-0.5">units</p>
                  </div>

                  {/* Gas Price */}
                  <div className="p-3 bg-background border border-border rounded-lg">
                    <p className="text-xs text-text-secondary mb-1">Gas Price</p>
                    <p className="text-lg font-semibold text-text-primary">
                      {formatGwei(gasPrice)}
                    </p>
                    <p className="text-xs text-text-tertiary mt-0.5">Gwei</p>
                  </div>
                </div>

                {/* Info Box */}
                <div className="p-3 bg-accent/5 border border-accent/30 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Clock className="h-4 w-4 text-accent flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-text-secondary">
                        This estimate includes a 20% safety buffer. Actual cost may be lower.
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Network Info */}
          <div className="flex items-center justify-between p-3 bg-background border border-border rounded-lg">
            <span className="text-xs text-text-secondary">Network</span>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
              <span className="text-xs font-medium text-text-primary">Base Sepolia</span>
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1 bg-background border-border hover:bg-elevated"
          >
            Cancel
          </Button>
          <Button
            onClick={onSubmit}
            disabled={hasError || isEstimating}
            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground transition-all hover:shadow-[0_0_20px_rgba(168,85,247,0.4)]"
          >
            {isEstimating ? "Estimating..." : "Confirm & Send"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}