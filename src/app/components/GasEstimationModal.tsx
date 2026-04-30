import { AlertCircle, Fuel, TrendingUp, TrendingDown, Clock, Lightbulb } from "lucide-react";
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
  /** Label for the confirm button — should be action-specific */
  submitLabel?: string;
  gasEstimate: {
    estimatedGas: bigint;
    gasPrice: bigint;
    estimatedCostEth: string;
    estimatedCostUSD: string;
    isEstimating: boolean;
    error: string | null;
    conditionExists?: boolean;
  };
  transactionDetails?: {
    title: string;
    description: string;
    items: { label: string; value: string }[];
  };
}

export function GasEstimationModal({
  open,
  onOpenChange,
  onSubmit,
  submitLabel,
  gasEstimate,
  transactionDetails: customTransactionDetails,
}: GasEstimationModalProps) {
  const {
    estimatedGas,
    gasPrice,
    estimatedCostEth,
    estimatedCostUSD,
    isEstimating,
    error,
    conditionExists,
  } = gasEstimate;
  const hasError = !!error;

  const defaultTransactionDetails = {
    title: "Create Condition",
    description: "Create a new binary prediction condition on-chain",
    items: [
      { label: "Network", value: "Base Sepolia (Testnet)" },
      { label: "Function", value: "createConditionWithMetadata()" },
      { label: "Outcomes", value: "2 (YES / NO)" },
    ],
  };

  const transactionDetails = customTransactionDetails || defaultTransactionDetails;
  const confirmLabel = submitLabel ?? transactionDetails.title ?? "Confirm & Send";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-elevated border-border max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl text-text-primary flex items-center gap-2">
            <Fuel className="h-6 w-6 text-primary" />
            Confirm Transaction
          </DialogTitle>
          <DialogDescription className="text-text-secondary">
            Review the details and estimated network fee
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
                  <span className="text-text-primary font-mono">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Gas Estimation */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <Fuel className="h-4 w-4" />
              Network Fee
            </h3>

            {isEstimating ? (
              <div className="space-y-2">
                <Skeleton className="h-16 w-full bg-surface" />
              </div>
            ) : hasError ? (
              <div className="p-4 bg-danger/10 border border-danger/30 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-danger flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-danger mb-1">
                      {conditionExists
                        ? "Prediction Already Exists"
                        : "Fee Estimation Failed"}
                    </p>
                    <p className="text-xs text-text-secondary mb-2">{error}</p>

                    {conditionExists ? (
                      <div className="mt-3 p-2 bg-background/50 rounded border border-border/50">
                        <div className="flex items-center gap-1.5 mb-2">
                          <Lightbulb className="h-3.5 w-3.5 text-primary" />
                          <span className="text-xs font-semibold text-text-primary">Solutions:</span>
                        </div>
                        <ul className="text-xs text-text-secondary space-y-1 list-disc list-inside">
                          <li>
                            Change the{" "}
                            <span className="font-mono text-primary">
                              threshold
                            </span>{" "}
                            value
                          </li>
                          <li>
                            Change the{" "}
                            <span className="font-mono text-primary">
                              block height
                            </span>{" "}
                            value
                          </li>
                          <li>
                            Or use the existing prediction in Get YES/NO Tokens
                          </li>
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
                {(() => {
                  const gasPriceGwei = Number(formatGwei(gasPrice));
                  const gasLevel = gasPriceGwei < 1 ? "Low" : gasPriceGwei < 10 ? "Medium" : "High";
                  const GasIcon = gasPriceGwei < 10 ? TrendingUp : TrendingDown;
                  const gasColor = gasPriceGwei < 1 ? "text-success" : gasPriceGwei < 10 ? "text-accent" : "text-danger";
                  return (
                    <div className="p-4 bg-primary/5 border border-primary/30 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-text-secondary">
                          Estimated Fee
                        </span>
                        <div className="flex items-center gap-2">
                          <GasIcon className={`h-4 w-4 ${gasColor}`} />
                          <span className={`text-xs ${gasColor}`}>{gasLevel}</span>
                        </div>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-text-primary">
                          {parseFloat(estimatedCostEth).toFixed(6)} ETH
                        </span>
                      </div>
                      <p className="text-xs text-text-tertiary mt-1">
                        ≈ ${estimatedCostUSD} USD (estimate)
                      </p>
                    </div>
                  );
                })()}

                {/* GE-03: Gas details in collapsible section */}
                <details className="group">
                  <summary className="text-xs text-text-tertiary cursor-pointer hover:text-text-secondary list-none flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-accent" />
                    Technical fee details ›
                  </summary>
                  <div className="mt-2 grid grid-cols-2 gap-3">
                    <div className="p-3 bg-background border border-border rounded-lg">
                      <p className="text-xs text-text-secondary mb-1">Gas Limit</p>
                      <p className="text-lg font-semibold text-text-primary">
                        {estimatedGas.toLocaleString()}
                      </p>
                      <p className="text-xs text-text-tertiary mt-0.5">units</p>
                    </div>
                    <div className="p-3 bg-background border border-border rounded-lg">
                      <p className="text-xs text-text-secondary mb-1">Gas Price</p>
                      <p className="text-lg font-semibold text-text-primary">
                        {formatGwei(gasPrice)}
                      </p>
                      <p className="text-xs text-text-tertiary mt-0.5">Gwei</p>
                    </div>
                  </div>
                  <p className="text-xs text-text-tertiary mt-2">
                    Includes a 20% safety buffer. Actual cost may be lower.
                  </p>
                </details>
              </>
            )}
          </div>

          {/* Network Info */}
          <div className="flex items-center justify-between p-3 bg-background border border-border rounded-lg">
            <span className="text-xs text-text-secondary">Network</span>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
              <span className="text-xs font-medium text-text-primary">
                Base Sepolia
              </span>
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
            {isEstimating ? "Estimating..." : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
