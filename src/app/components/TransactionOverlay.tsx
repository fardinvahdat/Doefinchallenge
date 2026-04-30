import { useEffect, useState } from "react";
import {
  Loader2,
  ExternalLink,
  CheckCircle2,
  XCircle,
  AlertCircle,
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
  status:
    | "awaiting"
    | "pending"
    | "broadcasting"
    | "confirming"
    | "confirmed"
    | "failed";
  txHash?: string;
  message?: string;
  error?: string;
  onClose?: () => void;
  onRetry?: () => void;
}

export function TransactionOverlay({
  isOpen,
  status,
  txHash,
  message,
  error,
  onClose,
  onRetry,
}: TransactionOverlayProps) {
  const getStatusConfig = () => {
    switch (status) {
      case "awaiting":
        return {
          icon: <Loader2 className="h-16 w-16 text-accent animate-spin" />,
          title: "Confirm in Wallet",
          description:
            message ||
            "Please confirm the transaction in your wallet extension...",
          color: "accent",
          showClose: false,
        };
      case "pending":
        return {
          icon: <Loader2 className="h-16 w-16 text-primary animate-spin" />,
          title: "Transaction Pending",
          description:
            message ||
            "Please wait while your transaction is being processed...",
          color: "primary",
          showClose: false,
        };
      case "broadcasting":
        return {
          icon: <Loader2 className="h-16 w-16 text-accent animate-spin" />,
          title: "Broadcasting Transaction",
          description: message || "Sending your transaction to the network...",
          color: "accent",
          showClose: false,
        };
      case "confirming":
        return {
          icon: <Loader2 className="h-16 w-16 text-primary animate-spin" />,
          title: "Waiting for Confirmation",
          description:
            message ||
            "Your transaction has been submitted. Waiting for block confirmation...",
          color: "primary",
          showClose: false,
        };
      case "confirmed":
        return {
          icon: <CheckCircle2 className="h-16 w-16 text-success" />,
          title: "Transaction Confirmed",
          description:
            message || "Your transaction has been successfully confirmed!",
          color: "success",
          showClose: true,
        };
      case "failed":
        return {
          icon: <XCircle className="h-16 w-16 text-danger" />,
          title: "Transaction Failed",
          description:
            error || message || "Your transaction failed. Please try again.",
          color: "danger",
          showClose: true,
        };
      default:
        return {
          icon: <Loader2 className="h-16 w-16 text-primary animate-spin" />,
          title: "Processing",
          description: message || "Processing your transaction...",
          color: "primary",
          showClose: false,
        };
    }
  };

  const config = getStatusConfig();

  // #35: after 5 minutes with no resolution, show an escape button so users aren't trapped
  const [timedOut, setTimedOut] = useState(false);
  useEffect(() => {
    if (!isOpen || config.showClose) {
      setTimedOut(false);
      return;
    }
    const t = setTimeout(() => setTimedOut(true), 5 * 60 * 1000);
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
            <p className="text-text-secondary">{config.description}</p>
          </div>

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

          {status === "pending" && (
            <div className="flex items-center gap-2 text-text-tertiary text-xs">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <span>Waiting for confirmation...</span>
            </div>
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
