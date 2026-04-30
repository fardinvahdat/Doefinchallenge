import { useEffect, useState } from "react";
import {
  Loader2,
  ExternalLink,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Check,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { Button } from "./ui/button";

interface TransactionOverlayProps {
  isOpen: boolean;
  status: "awaiting" | "confirming" | "confirmed" | "failed";
  txHash?: string;
  message?: string;
  error?: string;
  onClose?: () => void;
  onRetry?: () => void;
  /** Optional context — shown as subtitle and step indicator */
  context?: { action?: string; step?: string };
}

const STEPS = ["Wallet signed", "Submitted", "Confirmed"] as const;

function StepIndicator({ status }: { status: TransactionOverlayProps["status"] }) {
  const activeStep = status === "awaiting" ? 0 : status === "confirming" ? 1 : 2;
  return (
    <div className="flex items-center gap-2 justify-center w-full">
      {STEPS.map((label, i) => {
        const isDone = activeStep > i || status === "confirmed";
        const isCurrent = activeStep === i && status !== "confirmed" && status !== "failed";
        return (
          <div key={label} className="flex items-center gap-2">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`h-7 w-7 rounded-full flex items-center justify-center border-2 transition-all ${
                  isDone
                    ? "bg-success border-success"
                    : isCurrent
                      ? "border-primary animate-pulse"
                      : "border-border bg-elevated"
                }`}
              >
                {isDone ? (
                  <Check className="h-3.5 w-3.5 text-background" />
                ) : isCurrent ? (
                  <Loader2 className="h-3 w-3 text-primary animate-spin" />
                ) : (
                  <span className="text-xs text-text-tertiary">{i + 1}</span>
                )}
              </div>
              <span className="text-[10px] text-text-tertiary whitespace-nowrap">{label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`w-8 h-0.5 mb-4 rounded ${activeStep > i || status === "confirmed" ? "bg-success" : "bg-border"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function TransactionOverlay({
  isOpen,
  status,
  txHash,
  message,
  error,
  onClose,
  onRetry,
  context,
}: TransactionOverlayProps) {
  const getStatusConfig = () => {
    switch (status) {
      case "awaiting":
        return {
          icon: <Loader2 className="h-16 w-16 text-accent animate-spin" />,
          title: context?.action ?? "Confirm in Wallet",
          description: message ?? "Please confirm the transaction in your wallet extension...",
          color: "accent",
          showClose: false,
        };
      case "confirming":
        return {
          icon: <Loader2 className="h-16 w-16 text-primary animate-spin" />,
          title: context?.action ?? "Waiting for Confirmation",
          description: message ?? "Your transaction has been submitted. Waiting for block confirmation...",
          color: "primary",
          showClose: false,
        };
      case "confirmed":
        return {
          icon: <CheckCircle2 className="h-16 w-16 text-success" />,
          title: "Done!",
          description: message ?? "Your transaction has been confirmed.",
          color: "success",
          showClose: true,
        };
      case "failed":
        return {
          icon: <XCircle className="h-16 w-16 text-danger" />,
          title: "Transaction Failed",
          description: error ?? message ?? "Your transaction failed. Please try again.",
          color: "danger",
          showClose: true,
        };
      default:
        return {
          icon: <Loader2 className="h-16 w-16 text-primary animate-spin" />,
          title: "Processing",
          description: message ?? "Processing your transaction...",
          color: "primary",
          showClose: false,
        };
    }
  };

  const config = getStatusConfig();

  // TO-04: Reduced from 5 minutes to 90 seconds
  const [timedOut, setTimedOut] = useState(false);
  useEffect(() => {
    if (!isOpen || config.showClose) {
      setTimedOut(false);
      return;
    }
    const t = setTimeout(() => setTimedOut(true), 90 * 1000);
    return () => clearTimeout(t);
  }, [isOpen, config.showClose]);

  return (
    <Dialog open={isOpen} onOpenChange={config.showClose ? onClose : undefined}>
      <DialogContent
        className="bg-elevated border-border max-w-md backdrop-blur-xl"
        onInteractOutside={(e) => {
          if (!config.showClose) {
            e.preventDefault();
          }
        }}
      >
        <DialogTitle className="sr-only">{config.title}</DialogTitle>
        <DialogDescription className="sr-only">
          {config.description}
        </DialogDescription>
        <div className="flex flex-col items-center text-center py-6 space-y-6">
          <div className="animate-pulse-slow">{config.icon}</div>

          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-text-primary">
              {config.title}
            </h3>
            {context?.step && (
              <p className="text-xs text-text-tertiary">{context.step}</p>
            )}
            <p className="text-text-secondary">{config.description}</p>
          </div>

          {/* TO-03: Step progress indicator */}
          {status !== "failed" && (
            <div className="w-full px-4">
              <StepIndicator status={status} />
            </div>
          )}

          {txHash && (
            <a
              href={`https://sepolia.basescan.org/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-surface border border-border hover:border-primary/50 text-text-primary text-sm transition-all hover:shadow-[0_0_20px_rgba(168,85,247,0.2)]"
            >
              View on Basescan
              <ExternalLink className="h-4 w-4" />
            </a>
          )}

          {status === "awaiting" && (
            <div className="flex items-center gap-2 p-3 bg-accent/10 border border-accent/30 rounded-lg">
              <AlertCircle className="h-4 w-4 text-accent flex-shrink-0" />
              <span className="text-xs text-text-secondary">
                Check your wallet extension to approve this transaction
              </span>
            </div>
          )}

          {status === "failed" && onRetry && (
            <div className="flex gap-3 w-full">
              <Button
                onClick={onClose}
                variant="outline"
                className="flex-1 bg-background border-border"
              >
                Close
              </Button>
              <Button
                onClick={onRetry}
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Retry
              </Button>
            </div>
          )}

          {status === "confirmed" && onClose && (
            <Button
              onClick={onClose}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Close
            </Button>
          )}

          {timedOut && !config.showClose && onClose && (
            <div className="w-full p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <p className="text-xs text-yellow-300 mb-2 text-center">
                Taking longer than expected
              </p>
              <Button
                onClick={onClose}
                variant="outline"
                size="sm"
                className="w-full border-yellow-500/30 text-yellow-300 hover:bg-yellow-500/10"
              >
                Close and check wallet
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
